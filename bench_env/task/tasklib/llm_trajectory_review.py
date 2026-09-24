"""轨迹审查方法论 -- 第二层：直接调API做结构化复核（不占用Cursor agent额度）。

背景：第一层 `trajectory_audit.py` 用纯规则从几百条轨迹里筛出几十条"值得细看"
的（工具声明未用/用了一半又转GUI/没有步数优势/工具反而拖累结果等）。这一层
本该由人或LLM子agent去读这些轨迹的 trace.json 再下结论，但没必要为此消耗
Cursor 的 agent 调用额度——trace.json 本身已经是纯文本（每一步的 Thought +
Action + 工具反馈 + 路由变化），不需要读截图，所以直接把它拼成文本、连同
候选工具的真实签名（从 definitions.ts 里抠出来）一起塞进一次性的 chat
completion 调用即可，走 TokenHub 网关（`tools/test_api.py` 里用的那个），
免费/近乎免费，愿意调多少次调多少次。

**关键设计：不能只审查出一种结论**。每条任务的输出被强制要求覆盖五个独立
维度（而不是模型顺着最先想到的角度写一大段就收尾）：
  1. tool_boundary       -- 工具没用上/用了没用对，是否是新的边界类型
  2. env_bug             -- 怀疑是App本身的bug（GUI卡死、入口缺失等）
  3. failure_mode        -- 任务难度来源 / 模型具体错在哪一步
  4. verifier_risk       -- 这条任务的verifier判定是否可能过严/过松/能被幻觉蒙混过关
  5. cross_mode_signal   -- 工具相对纯GUI到底有没有带来实质优势（步数/成功率）

用法：
    export TOKENHUB_API_KEY=sk-...   # 见下方"关于key"，不要写进代码/提交到git
    python3 bench_env/task/tasklib/llm_trajectory_review.py \\
        --audit runs/trajectory-audit-v1to4.json \\
        --flags tool_declared_unused tool_used_then_gui_fallback low_tool_utilization \\
                hybrid_worse_outcome no_hybrid_step_advantage \\
        --out-dir runs/llm-review

也可以用 --task-id 指定具体几个task_id，跳过按flag筛选。

**关于key/模型选择**：2026-08-10用三把已知key查`/v1/models`时只挂了
gpt-*/gemini-*/bailian(qwen/deepseek/glm/kimi/minimax)几个族系，没有Claude；
2026-08-11拿到一把新key后重查，挂了完整的claude-*/gpt-*/gemini-*/bailian共
96个模型（含`claude-sonnet-4-6`），且未触发`insufficient_user_quota`（旧三把
当时已耗尽额度，隔了一天多也没恢复）。默认模型改成了`claude-sonnet-4-6`。
**这把新key是活跃真实凭证，不要硬编码进这个文件/不要提交到git**——从环境变量
`TOKENHUB_API_KEY`读取，本地`export`一下即可；如果之后key又失效/换新的，同样
不要写进代码，只改环境变量。

**2026-08-11 稳定性测试结论**（用户要求验证"轨迹审查是否稳定、能否大规模复用"）：
同一批7个broadcast任务、相同prompt、temperature=0，独立跑了3次，五个维度的
核心结论（尤其是`cross_mode_signal`的方向性判断：工具有/无优势）**三次完全
一致**，只是措辞不同——说明结论本身是稳定可复现的。但发现并修复了一个格式
稳定性问题：模型偶尔会在字符串内容里直接写半角引号（如`"屠龙之术"`）而不转义，
导致约一半的调用JSON解析失败——已经在prompt里加了硬性格式要求+加了一个
基于启发式的repair fallback，修复后连续3次调用全部一次性解析成功。另外用
ctrip组（含`ctrip_06`那条三方数据不一致的复杂案例）测过深度：这套脚本能准确
复现"轨迹层面的症状"（模型点不开第二个航班、最后幻觉编答案），但**定位不到
需要读App源码/数据文件才能确认的根因**（比如ctrip_06真正的根因是日期库存
过滤+verifier锚定静态价格三方不一致，这个是Grok子agent读了组件源码才查出来
的）——这是直接调API方式相对Cursor子agent的一个结构性短板：子agent能自主
读文件系统找证据，这个脚本只能看到我显式喂给它的trace.json+工具签名，广度
和输入端稳定性没问题，但深挖"是不是真bug"这类需要读源码的结论，仍然更适合
子agent或人工介入复核。
"""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
import os
import re
import sys
from pathlib import Path
from typing import Any

MOBILEGYM_ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(MOBILEGYM_ROOT))

TOKENHUB_BASE_URL = "https://example.invalid/v1"
# 2026-08-11 拿到的新key挂了完整的 claude-*/gpt-*/gemini-*/bailian(qwen等)
# 族系（`client.models.list()` 验证过96个模型，含 claude-sonnet-4-6），且未
# 触发 insufficient_user_quota（旧的三把key，见git历史，都已耗尽额度）。
# 这把新key是活跃可用的真实凭证，不写进代码/不提交到git——从环境变量读取，
# 本地用之前 `export TOKENHUB_API_KEY=sk-...`。
DEFAULT_API_KEY = os.environ.get("TOKENHUB_API_KEY", "")
DEFAULT_MODEL = "claude-sonnet-4-6"

MAX_STEP_TEXT_CHARS = 260  # 每步 feedback.output 截断长度，避免prompt爆炸


def _compact_trace(trace_path: Path) -> str:
    if not trace_path.exists():
        return "(trace.json 不存在)"
    data = json.loads(trace_path.read_text(encoding="utf-8"))
    lines = [f"[stop_reason={data.get('stop_reason')}] task: {data.get('task', '')[:200]}"]
    for step in data.get("trace", []):
        resp = step.get("response", "") or ""
        thought_match = re.search(r"Thought:\s*(.*?)(?:\nAction:|\n<tool_call>|$)", resp, re.S)
        thought = (thought_match.group(1).strip() if thought_match else resp[:120]).replace("\n", " ")
        call = step.get("call") or {}
        call_name = call.get("name", "?")
        call_args = call.get("arguments", {})
        feedback = step.get("feedback") or {}
        fb_ok = feedback.get("ok")
        fb_out = json.dumps(feedback.get("output", ""), ensure_ascii=False)[:MAX_STEP_TEXT_CHARS]
        route_before = (step.get("route_before") or {}).get("path", "")
        route_after = (step.get("route_after") or {}).get("path", "")
        route_str = f" route:{route_before}->{route_after}" if route_before != route_after else ""
        lines.append(
            f"  step{step.get('step')}: thought=\"{thought[:150]}\" "
            f"call={call_name}({json.dumps(call_args, ensure_ascii=False)[:120]}) "
            f"ok={fb_ok} out={fb_out}{route_str}"
        )
    if data.get("agent_answer"):
        lines.append(f"  [final agent_answer]: {str(data.get('agent_answer'))[:300]}")
    return "\n".join(lines)


def _tool_definition_snippets(app: str, tool_names: set[str]) -> str:
    """从 app_tools/apps/<app>/definitions.ts 里按行抠出候选工具的声明。"""
    defs_file = MOBILEGYM_ROOT / "app_tools" / "apps" / app / "definitions.ts"
    if not defs_file.exists():
        return f"(未找到 {defs_file.relative_to(MOBILEGYM_ROOT)})"
    text = defs_file.read_text(encoding="utf-8")
    short_names = {t.split("__", 1)[-1] for t in tool_names if "__" in t or True}
    out = []
    for line in text.splitlines():
        m = re.search(r"name:\s*'([a-zA-Z_]+)'", line)
        if m and m.group(1) in short_names:
            out.append(line.strip())
    return "\n".join(out) if out else "(该app下没有匹配到候选工具声明，可能工具名跨app或命名不同)"


REVIEW_SCHEMA_INSTRUCTIONS = """
对下面每一条任务，你必须同时给出五个独立维度的结论（不能只答其中一两个就结束，
即使某个维度"看起来不适用"，也要写明"不适用，因为……"，禁止留空）：

1. tool_boundary: 工具到底有没有被用上、用得对不对；如果没用上是模型的问题
   （该用没用/选择了低效GUI路径）还是工具设计本身帮不上忙；是否揭示了一类新的
   "工具-GUI边界"，不在已知的 idinhand / state_direct / field_mismatch /
   query_scan_mismatch 四类里。
2. env_bug: 有没有观察到疑似App本身的bug迹象（GUI卡死反复点同一元素无效、
   入口缺失导致根本走不通、组件渲染缺字段等）。给出具体页面/组件线索，方便
   后续去代码里定位确认。如果没有，明确写"未观察到"。
3. failure_mode: 如果任务失败或步数异常多，具体是在哪一步、因为什么原因
   （记忆丢失/字段混淆/幻觉编造答案/操作路径绕远/纯GUI导航能力不足等）。
4. verifier_risk: 结合任务instruction判断，这条任务的verifier判定条件
   （notes里的contains/not_contains关键词、或state diff条件）有没有过严
   （正确答案的合理措辞会被判错）、过松（错误/编造的答案也能通过）的风险。
   特别注意：如果agent几乎没有执行任何真实查询/核对动作（工具没调用、GUI也
   没有实质浏览）却仍然success=true，要重点怀疑是不是verifier只做了浅层关键词
   匹配、没识别出答案是幻觉编造的。
5. cross_mode_signal: 如果同时提供了 hybrid 和 gui_only 两条轨迹，工具相对
   纯GUI到底有没有带来实质优势（步数更少/成功率更高）？如果没有，用一句话
   说明"没有优势的原因"（比如GUI操作本来就很短，用工具反而多了一次多余调用）。
6. graph_evidence: 为功能电路图回写轨迹证据。输出实际观察到的页面/状态/动作/Tool
   节点与跳转边、首次分叉点、循环或断路点、涉及的数据读取/写入，以及证据所在的
   mode和step。每条证据必须标注 confidence=observed|inferred|declared；没有Store
   diff或正式verifier时，禁止把写入推断成verified，只能写unscored或inferred。

最后额外给一段"batch_summary"：这一批任务里有没有可以归纳成一句话的共性
（比如"某个具体工具的返回字段设计有系统性歧义，导致连续N条任务出错"）。

严格按以下JSON格式输出（不要输出JSON之外的任何文字，不要用markdown代码块包裹）。
**格式硬性要求**：字符串内容里如果要引用中文短语/标题，一律用中文引号「」或
英文单引号''，绝对不要在字符串内容里使用英文半角双引号"——半角双引号会
提前终止JSON字符串导致整个输出解析失败。
{
  "tasks": [
    {
      "dataset_id": "...",
      "tool_boundary": "...",
      "env_bug": "...",
      "failure_mode": "...",
      "verifier_risk": "...",
      "cross_mode_signal": "...",
      "graph_evidence": {
        "observed_nodes": [{"id": "screen:/path或action/tool节点", "kind": "screen|ui_state|action|data_field|tool|os_capability", "mode": "hybrid|gui_only", "step": 1, "confidence": "observed|inferred|declared", "artifact_ref": "..."}],
        "observed_edges": [{"source": "...", "target": "...", "kind": "navigate|select|reads|writes|invokes|returns_to|tool_access|observed_transition", "mode": "hybrid|gui_only", "step": 1, "confidence": "observed|inferred|declared"}],
        "failure_points": [{"node_id": "...", "mode": "hybrid|gui_only", "step": 1, "type": "loop|dead_end|wrong_app|missing_entry|no_response|other", "evidence": "..."}],
        "first_divergence": {"step": 1, "hybrid_node": "...", "gui_only_node": "..."},
        "state_closure": "verified|claimed|not_observed|contradicted|unscored"
      }
    }
  ],
  "batch_summary": "..."
}
"""


def build_group_prompt(app: str, tasks: list[dict[str, Any]]) -> str:
    all_candidate_tools: set[str] = set()
    for t in tasks:
        all_candidate_tools.update(t.get("candidate_tools") or [])
    tool_defs = _tool_definition_snippets(app, all_candidate_tools)

    task_blocks = []
    for t in tasks:
        hybrid = t.get("hybrid") or {}
        gui_only = t.get("gui_only") or {}
        block = [f"### task: {t['dataset_id']}"]
        block.append(f"tags: {t.get('tags')}")
        block.append(f"candidate_tools: {t.get('candidate_tools')}")
        block.append(f"命中的规则标记: {t.get('flags')}  原因: {t.get('reasons')}")
        if hybrid.get("artifact_dir"):
            trace_path = MOBILEGYM_ROOT / hybrid["artifact_dir"] / "trace.json"
            block.append(
                f"[hybrid轨迹 success={hybrid.get('success')} steps={hybrid.get('steps')}/"
                f"{hybrid.get('max_steps')} stop_reason={hybrid.get('stop_reason')}]"
            )
            block.append(_compact_trace(trace_path))
        if gui_only.get("artifact_dir"):
            trace_path = MOBILEGYM_ROOT / gui_only["artifact_dir"] / "trace.json"
            block.append(
                f"[gui_only轨迹 success={gui_only.get('success')} steps={gui_only.get('steps')}/"
                f"{gui_only.get('max_steps')} stop_reason={gui_only.get('stop_reason')}]"
            )
            block.append(_compact_trace(trace_path))
        task_blocks.append("\n".join(block))

    return (
        f"你在审查 mobilegym（模拟Android APP的GUI+Tools benchmark）里 {app} app "
        f"的一批实验轨迹。每条任务在 hybrid（GUI+工具）与 gui_only（纯GUI）两种模式"
        f"下各跑一次，模型相同。一个规则脚本已经从全部轨迹里筛出了下面这几条"
        f"「值得细看」的任务（原因见每条任务的`命中的规则标记`）。\n\n"
        f"该app候选工具的真实签名（从definitions.ts原文抠出，供你判断工具能力边界）：\n"
        f"{tool_defs}\n\n"
        + "\n\n".join(task_blocks)
        + "\n\n"
        + REVIEW_SCHEMA_INSTRUCTIONS
    )


def call_llm(prompt: str, *, model: str, api_key: str, base_url: str) -> dict[str, Any]:
    from openai import OpenAI

    client = OpenAI(api_key=api_key, base_url=base_url, timeout=180)
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "你是一个严谨的benchmark轨迹审查员，只输出JSON。"},
            {"role": "user", "content": prompt},
        ],
        temperature=0,
        max_tokens=8000,
    )
    content = resp.choices[0].message.content or ""
    match = re.search(r"\{.*\}", content, re.S)
    if not match:
        return {"_raw": content, "_parse_error": "no JSON object found"}
    raw_json = match.group(0)
    try:
        return json.loads(raw_json)
    except json.JSONDecodeError:
        pass
    # Observed failure mode (2026-08-11): the model sometimes still embeds a bare
    # ASCII '"' inside a string value (e.g. quoting a Chinese title) despite being
    # told not to, which prematurely terminates the JSON string. Heuristic repair:
    # a '"' that is immediately followed by CJK/alnum text and NOT immediately
    # followed by a JSON structural character (,:}]) is almost certainly a stray
    # quote-inside-a-string, not a real string boundary -- escape it.
    repaired = re.sub(r'(?<!\\)"(?=[^\s,:}\]])', r'\\"', raw_json)
    # ...but that also escapes the real opening quotes of every field/value; only
    # keep the escape when it's not right after one of the JSON structural chars
    # that legitimately precede a string.
    repaired = re.sub(r'([{\[:,]\s*)\\"', r'\1"', repaired)
    try:
        return json.loads(repaired)
    except json.JSONDecodeError as exc:
        return {"_raw": content, "_parse_error": str(exc)}


def load_priority_groups(audit_path: str, wanted_flags: set[str] | None, task_ids: set[str] | None) -> dict[str, list[dict[str, Any]]]:
    audit = json.loads(Path(audit_path).read_text(encoding="utf-8"))
    groups: dict[str, list[dict[str, Any]]] = {}
    for batch in audit["batches"]:
        for t in batch["tasks"]:
            if task_ids:
                if t["dataset_id"] not in task_ids:
                    continue
            elif wanted_flags:
                if not (wanted_flags & set(t["flags"])):
                    continue
            else:
                continue
            app = t.get("app") or t["dataset_id"].split("_")[0]
            groups.setdefault(app, []).append(t)
    return groups


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--audit", required=True, help="trajectory_audit.py 产出的json路径")
    p.add_argument("--flags", nargs="*", default=[], help="按规则标记筛选（与--task-id二选一）")
    p.add_argument("--task-id", nargs="*", default=[], help="直接指定task_id列表，忽略--flags")
    p.add_argument("--model", default=DEFAULT_MODEL)
    p.add_argument("--api-key", default=DEFAULT_API_KEY)
    p.add_argument("--base-url", default=TOKENHUB_BASE_URL)
    p.add_argument("--out-dir", required=True)
    p.add_argument("--chunk-size", type=int, default=0, help="每次请求最多包含几条任务；0表示每个App一批")
    p.add_argument("--parallel", type=int, default=1, help="LLM审查请求并发数")
    args = p.parse_args()

    groups = load_priority_groups(args.audit, set(args.flags) or None, set(args.task_id) or None)
    if not groups:
        print("没有匹配到任何任务，检查 --flags / --task-id 是否正确", file=sys.stderr)
        return 2

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    jobs: list[tuple[str, int, list[dict[str, Any]]]] = []
    for app, tasks in groups.items():
        size = args.chunk_size or len(tasks)
        for index in range(0, len(tasks), size):
            jobs.append((app, index // size + 1, tasks[index:index + size]))

    def run_job(job):
        app, chunk_index, tasks = job
        prompt = build_group_prompt(app, tasks)
        result = call_llm(prompt, model=args.model, api_key=args.api_key, base_url=args.base_url)
        return app, chunk_index, tasks, result

    all_results: dict[str, Any] = {}
    with ThreadPoolExecutor(max_workers=max(1, args.parallel)) as pool:
        futures = {pool.submit(run_job, job): job for job in jobs}
        for future in as_completed(futures):
            app, chunk_index, tasks, result = future.result()
            key = app if len([j for j in jobs if j[0] == app]) == 1 else f"{app}__{chunk_index:03d}"
            all_results[key] = result
            out_path = out_dir / f"{key}.json"
            out_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
            if "_parse_error" in result:
                print(f"[{key}] [WARN] JSON解析失败，原始输出已保存到 {out_path}")
            else:
                print(f"[{key}] 完成（{len(result.get('tasks', []))} 条）")

    combined_path = out_dir / "_combined.json"
    combined_path.write_text(json.dumps(all_results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"全部完成，汇总写入 {combined_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
