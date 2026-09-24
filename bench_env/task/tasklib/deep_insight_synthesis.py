"""轨迹审查方法论 -- 第四层：对Layer2产出做真正的"深度思考式"综合分析。

背景：Layer 2（`llm_trajectory_review.py`）已经把183条轨迹的原始trace各自读了一遍，
产出了五维度的结论；Layer 3（`aggregate_llm_review.py`）用纯规则对这183份结论做了
计数/分桶，只能回答"多少条属于哪一类"这种统计问题。但用户明确要的是第三种东西：
**不是规则统计，也不是逐条复述，而是一个真正"读完全部183条结论、深度思考后"
才能看出来的、跨任务的、指向研究结论/论文insight的深层模式**——这种模式规则匹配
原理上就做不到（它要求真正理解每条记录的语义并互相印证/证伪），必须靠模型自己
通读全部证据后推理出来。

做法：因为183条五维度结论全文拼起来数据量较大（对着完整trace会更大，所以这层
只喂Layer2已经提炼过的五维度文本，不喂原始trace），为了不让模型在单次超长
context里"注意力稀释、只认真看开头结尾"，分成几个chunk分别做"深度分析"，
每个chunk都被要求跳出"逐条复述"，直接去找模式/矛盾/反直觉发现；最后再用一次
调用把几个chunk的深度分析结果合并、去重、排出优先级，产出面向"这周实验能得出
什么有insight的结论"这个问题的最终报告。

用法：
    python3 bench_env/task/tasklib/deep_insight_synthesis.py \\
        --review-dir runs/llm-review-full-v1to4 \\
        --out runs/llm-review-full-v1to4/_deep_insights.md \\
        --model claude-opus-4-8-thinking
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any

from openai import OpenAI

TOKENHUB_BASE_URL = "https://example.invalid/v1"
DEFAULT_MODEL = "claude-opus-4-8-thinking"
DEFAULT_API_KEY = os.environ.get("TOKENHUB_API_KEY", "")

RESEARCH_CONTEXT = """\
背景（供你理解这批数据的来源，不要在回答里复述这段背景本身）：
这是一个自建的"手机App模拟环境 + App专属工具"混合基准测试。跑了183条任务，
覆盖约13类场景（含7个自建App：taobao/jingdong/dianping/ctrip/kapi/broadcast/luckin，
以及跨App/记忆/多约束/边缘导航/恢复等特殊类型），每条任务都跑了两条轨迹：
hybrid（GUI+专属工具都能用）和gui_only（只能用截图+点击/滑动/输入的GUI操作，
不能用工具）。模型是gemini-3.1-pro-preview。

下面这些JSON是另一个LLM（Layer 2）针对每条任务，读了完整的逐步trace（含每步的
thought、action、工具返回、路由变化）之后，按五个维度给出的结论：
- tool_boundary：工具到底有没有被用上、边界在哪
- env_bug：有没有疑似App本身的bug
- failure_mode：如果失败了，具体错在哪一步、什么原因
- verifier_risk：判分脚本本身是否过严/过松
- cross_mode_signal：hybrid相对gui_only有没有实质优势

这些结论已经是"消化过"的文本，不是原始trace。
"""

DEEP_ANALYSIS_INSTRUCTIONS = """\
你现在要做的**不是**逐条复述或分类统计这些结论（那种事纯规则脚本已经做过了，
产出见同目录`_aggregate_summary.md`，你不需要重复它）。你要做的是：

**通读下面这批任务的全部结论，像一个正在写论文/技术报告的研究者一样，去找那些
"必须同时看过多条记录、互相印证或互相矛盾才能发现"的深层模式**。具体来说，
尝试从下面这些角度深挖（不必每个角度都有内容，但**禁止**只从一个角度写完就收工）：

1. **反直觉发现**：有没有什么结论是"跟直觉预期相反"的？比如"看起来应该工具更有
   优势的场景实际没有""看起来更难的任务模型反而做得更好"之类。
2. **因果链条/系统性根因**：多条看似独立的失败，会不会指向同一个更底层的原因？
   （比如"记忆丢失"具体是在什么条件下触发的——是步数长度、是跨App切换次数、
   还是某种特定的UI交互模式？能不能给出比"模型会记忆丢失"更精确的触发条件？）
3. **工具设计的深层教训**：工具"有用"和"没用"的案例放在一起看，能不能总结出
   一条可以指导"以后怎么设计工具"的通用原则，而不是"这个工具好/那个工具不好"
   的个案评价？
4. **模型能力边界的精确刻画**：能不能把"模型在xx场景下会失败"这种笼统说法，
   变成更精确的、可预测的边界条件？（比如"当需要同时满足条件在验证的时候，
   模型倾向于......"）
5. **verifier设计对结果解读的系统性影响**：如果verifier风险很高的比例很大，
   这对"我们现在测出来的成功率数字本身能不能直接采信"意味着什么？
6. **矛盾与证伪**：有没有哪些个案表面上支持某个流行猜测，但放在一起看其实
   互相矛盾、这个猜测站不住脚？
7. **任何你觉得值得写进论文/报告、但不属于以上六类的洞察**。

每条洞察都必须**引用具体的task_id作为证据**（至少2-3个，除非确实只有孤例），
不能只给结论不给证据。你要主动跨维度关联信息（比如某条任务的env_bug线索
和另一条任务的verifier_risk线索放在一起看是否指向同一个问题）。

输出结构化markdown，每条洞察一个小标题，格式：
## 洞察N：<一句话概括>
**证据**：task_id列表 + 简要说明
**为什么这值得写进报告**：<你的推理>
"""

FINAL_MERGE_INSTRUCTIONS = """\
下面是几份针对不同任务子集独立做的"深度洞察分析"报告（有的报告是同一批数据、
但被拆成了不同chunk分别看，所以可能有重复、也可能有些洞察只在其中一份出现）。

你的任务：把这些洞察**合并、去重、互相印证或证伪、按"对写报告/论文的价值"
排出优先级**，产出一份最终的、面向"这次183条大规模轨迹分析到底告诉了我们
什么有深度的东西"这个问题的综合报告。要求：

1. 如果不同chunk的洞察其实是同一个模式的不同侧面，合并成一条更完整的表述，
   并汇总它们各自引用的task_id证据。
2. 如果发现某两条洞察实际上互相矛盾，明确指出矛盾，并给出你的判断（哪个更
   站得住脚，或者说明这可能反映了任务集本身的异质性）。
3. 最后单独写一节"如果只能挑3条给汇报用，应该挑哪3条"，说明理由。
4. 不要因为想"面面俱到"而堆砌太多条——宁可少而深，也不要多而浅。

输出结构化markdown。
"""


def load_task_records(review_dir: Path) -> list[dict[str, Any]]:
    tasks: list[dict[str, Any]] = []
    for path in sorted(review_dir.glob("*.json")):
        if path.name == "_combined.json":
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        for t in data.get("tasks", []):
            tasks.append(t)
    return tasks


def chunk_list(items: list[Any], n_chunks: int) -> list[list[Any]]:
    size = -(-len(items) // n_chunks)  # ceil div
    return [items[i : i + size] for i in range(0, len(items), size)]


def call_llm(prompt: str, *, model: str, api_key: str, base_url: str, max_tokens: int, retries: int = 3) -> str:
    if not api_key:
        print("错误：未设置 TOKENHUB_API_KEY 环境变量，也没有传 --api-key", file=sys.stderr)
        sys.exit(2)
    client = OpenAI(api_key=api_key, base_url=base_url, timeout=600)
    last_exc: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            resp = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "你是一个正在为一篇技术报告/论文做数据分析的资深研究员，擅长从大量案例中提炼非显而易见的深层模式，而不是简单复述或分类。"},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=max_tokens,
            )
            return resp.choices[0].message.content or ""
        except Exception as exc:  # noqa: BLE001 - Bedrock后端偶发"Operation not allowed"等瞬时错误，重试即可
            last_exc = exc
            wait = 5 * attempt
            print(f"  [WARN] 调用失败（第{attempt}/{retries}次）：{exc}；{wait}秒后重试", file=sys.stderr)
            time.sleep(wait)
    raise last_exc  # type: ignore[misc]


def build_chunk_prompt(chunk_idx: int, total_chunks: int, tasks: list[dict[str, Any]]) -> str:
    body = json.dumps(tasks, ensure_ascii=False, indent=1)
    return (
        f"{RESEARCH_CONTEXT}\n"
        f"（这是第{chunk_idx}/{total_chunks}批任务，共{len(tasks)}条，"
        f"你只能看到这一批，看不到其它批次，做分析时不要假设你看过全部183条。）\n\n"
        f"{DEEP_ANALYSIS_INSTRUCTIONS}\n\n"
        f"以下是这批任务的五维度结论原始数据：\n\n{body}\n"
    )


def build_merge_prompt(chunk_reports: list[str]) -> str:
    joined = "\n\n---\n\n".join(
        f"# 子集{i+1}的深度洞察报告\n\n{report}" for i, report in enumerate(chunk_reports)
    )
    return f"{FINAL_MERGE_INSTRUCTIONS}\n\n{joined}\n"


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--review-dir", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--model", default=DEFAULT_MODEL)
    p.add_argument("--api-key", default=DEFAULT_API_KEY)
    p.add_argument("--base-url", default=TOKENHUB_BASE_URL)
    p.add_argument("--n-chunks", type=int, default=4, help="把183条切成几份分别深度分析，避免单次超长context注意力稀释")
    p.add_argument("--chunk-max-tokens", type=int, default=16000)
    p.add_argument("--merge-max-tokens", type=int, default=16000)
    p.add_argument("--keep-intermediate", action="store_true", help="保留每个chunk的中间分析报告到同目录")
    args = p.parse_args()

    review_dir = Path(args.review_dir)
    tasks = load_task_records(review_dir)
    if not tasks:
        print("没有读到任何任务记录，检查 --review-dir 是否正确", file=sys.stderr)
        return 2

    chunks = chunk_list(tasks, args.n_chunks)
    print(f"共 {len(tasks)} 条任务，切成 {len(chunks)} 份（每份约 {len(chunks[0])} 条），模型 {args.model} ...")

    def _run_chunk(idx_chunk: tuple[int, list[dict[str, Any]]]) -> tuple[int, str]:
        idx, chunk = idx_chunk
        cache_path = review_dir / f"_deep_insights_chunk{idx}.md"
        if args.keep_intermediate and cache_path.exists():
            print(f"[{idx}/{len(chunks)}] 复用已有中间结果 {cache_path.name}，跳过调用")
            return idx, cache_path.read_text(encoding="utf-8")
        print(f"[{idx}/{len(chunks)}] 深度分析中（{len(chunk)}条任务）...")
        prompt = build_chunk_prompt(idx, len(chunks), chunk)
        report = call_llm(
            prompt, model=args.model, api_key=args.api_key, base_url=args.base_url,
            max_tokens=args.chunk_max_tokens,
        )
        if args.keep_intermediate:
            (review_dir / f"_deep_insights_chunk{idx}.md").write_text(report, encoding="utf-8")
        print(f"  [{idx}/{len(chunks)}] 完成，{len(report)} 字符")
        return idx, report

    with ThreadPoolExecutor(max_workers=min(2, len(chunks))) as executor:
        results = list(executor.map(_run_chunk, enumerate(chunks, 1)))
    results.sort(key=lambda x: x[0])
    chunk_reports = [r for _, r in results]

    print("正在做最终合并/去重/排优先级...")
    merge_prompt = build_merge_prompt(chunk_reports)
    final_report = call_llm(
        merge_prompt, model=args.model, api_key=args.api_key, base_url=args.base_url,
        max_tokens=args.merge_max_tokens,
    )

    Path(args.out).write_text(final_report, encoding="utf-8")
    print(f"完成，最终深度洞察报告写入 {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
