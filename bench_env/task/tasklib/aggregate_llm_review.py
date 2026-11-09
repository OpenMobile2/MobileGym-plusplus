"""轨迹审查方法论 -- 第三层：对 llm_trajectory_review.py 的产出做免费的确定性聚合。

背景：`llm_trajectory_review.py` 对183条任务、五个维度都生成了自由文本结论，
逐条人工读一遍不现实。这一层不调用任何模型，纯靠关键词/正则规则，把183条
的自由文本压缩成：
  1. 每个维度的分桶计数（比如cross_mode_signal里"工具有明显优势/无优势/
     帮倒忙"各占多少条）——直接回答"工具到底有没有用"这类比例性问题。
  2. 过滤掉"正常/未观察到/低风险"之后剩下的"候选清单"（env_bug候选、
     verifier_risk中高风险候选、tool_boundary里讲不进已知四类边界的文本）
     ——这些才是真正值得再花时间精读trace.json确认的少数条目。

用法：
    python3 bench_env/task/tasklib/aggregate_llm_review.py \\
        --review-dir runs/llm-review-full-v1to4 \\
        --out runs/llm-review-full-v1to4/_aggregate_summary.md
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

CROSS_MODE_BUCKETS = [
    ("决定性优势/彻底避免失败", re.compile(r"决定性优势|彻底避免|从失败到成功|唯一解法|根本解法")),
    ("明显步数优势", re.compile(r"明显优势|显著优势|大幅节省|大幅减少")),
    ("一定/轻微优势", re.compile(r"一定优势|轻微优势|小幅|略有优势|略微优势")),
    ("工具帮倒忙", re.compile(r"帮倒忙|工具反而|变差|劣势|工具导致失败")),
    ("持平/无优势", re.compile(r"持平|无(明显)?优势|无差异|相同|无step优势|无步数优势")),
]

VERIFIER_BUCKETS = [
    ("高风险/过松或过严", re.compile(r"高风险|明确.{0,4}过松|明确.{0,4}过严|已通过.{0,10}错误答案|误判|漏判")),
    ("中等风险", re.compile(r"中等风险|中风险|一定风险|存在.{0,6}风险")),
    ("低风险/无", re.compile(r"低风险|风险可控|无风险|不存在.{0,6}风险")),
]

KNOWN_BOUNDARY_TAGS = [
    "idinhand",
    "state_direct",
    "field_mismatch",
    "query_scan_mismatch",
    "query_phrase_mismatch",
]

NEGATIVE_ENV_BUG_PREFIXES = re.compile(r"^(未观察到|未发现|无明显|无(App)?bug|没有观察到)")


def classify(text: str, buckets: list[tuple[str, re.Pattern]]) -> str:
    for label, pattern in buckets:
        if pattern.search(text):
            return label
    return "未分类/需人工看"


def load_all_tasks(review_dir: Path) -> list[dict[str, Any]]:
    tasks: list[dict[str, Any]] = []
    for path in sorted(review_dir.glob("*.json")):
        if path.name in ("_combined.json",):
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        for t in data.get("tasks", []):
            t = dict(t)
            t["_source_file"] = path.name
            tasks.append(t)
    return tasks


def load_ground_truth_success(audit_path: str | None) -> dict[str, dict[str, Any]]:
    """从 trajectory_audit.py 的产出里取真实的 success 布尔值，
    不依赖对free text做关键词匹配（"两条轨迹均成功，无失败"这种表述本身
    就包含"失败"二字，纯关键词匹配会产生大量假阳性）。"""
    if not audit_path:
        return {}
    audit = json.loads(Path(audit_path).read_text(encoding="utf-8"))
    out: dict[str, dict[str, Any]] = {}
    for batch in audit["batches"]:
        for t in batch["tasks"]:
            out[t["dataset_id"]] = {
                "hybrid_success": (t.get("hybrid") or {}).get("success"),
                "gui_only_success": (t.get("gui_only") or {}).get("success"),
            }
    return out


def build_report(tasks: list[dict[str, Any]], ground_truth: dict[str, dict[str, Any]]) -> str:
    lines: list[str] = []
    lines.append(f"# 全量183条LLM审查记录 -- 确定性聚合摘要（{len(tasks)}条）")
    lines.append("")
    lines.append("本文档由 `aggregate_llm_review.py` 规则生成，不调用任何模型。用于把183条")
    lines.append("自由文本结论压缩成分桶计数+候选清单，减少人工精读量。")
    lines.append("")

    # --- cross_mode_signal ---
    lines.append("## 1. cross_mode_signal：工具相对纯GUI到底有没有实质优势")
    lines.append("")
    cross_buckets: dict[str, list[str]] = {}
    for t in tasks:
        text = t.get("cross_mode_signal", "") or ""
        label = classify(text, CROSS_MODE_BUCKETS)
        cross_buckets.setdefault(label, []).append(t["dataset_id"])
    total_with_signal = sum(len(v) for v in cross_buckets.values())
    for label, _ in CROSS_MODE_BUCKETS + [("未分类/需人工看", None)]:
        ids = cross_buckets.get(label, [])
        if not ids:
            continue
        pct = 100.0 * len(ids) / total_with_signal if total_with_signal else 0
        lines.append(f"- **{label}**：{len(ids)}条（{pct:.0f}%）")
    lines.append("")
    lines.append("（注：只有同时有hybrid+gui_only两条轨迹的任务才会有真正的对比信号，")
    lines.append("部分任务只有单一模式轨迹，规则会分到\"未分类\"，属于正常情况不是聚合错误。）")
    lines.append("")

    # --- env_bug candidates ---
    lines.append("## 2. env_bug：过滤掉\"未观察到\"之后的候选清单")
    lines.append("")
    bug_candidates = [t for t in tasks if not NEGATIVE_ENV_BUG_PREFIXES.match((t.get("env_bug") or "").strip())]
    lines.append(f"183条里 **{len(bug_candidates)}条** 提到了非空的疑似env bug线索"
                 f"（未必都是真bug，很多是\"提到了但判断不是bug\"，仍需人工确认）：")
    lines.append("")
    for t in bug_candidates:
        snippet = (t.get("env_bug") or "").replace("\n", " ")
        if len(snippet) > 160:
            snippet = snippet[:160] + "…"
        lines.append(f"- `{t['dataset_id']}`（{t['_source_file']}）：{snippet}")
    lines.append("")

    # --- verifier_risk ---
    lines.append("## 3. verifier_risk：验证脚本风险分桶")
    lines.append("")
    verifier_buckets: dict[str, list[dict[str, Any]]] = {}
    for t in tasks:
        text = t.get("verifier_risk", "") or ""
        label = classify(text, VERIFIER_BUCKETS)
        verifier_buckets.setdefault(label, []).append(t)
    for label, _ in VERIFIER_BUCKETS + [("未分类/需人工看", None)]:
        items = verifier_buckets.get(label, [])
        if not items:
            continue
        lines.append(f"- **{label}**：{len(items)}条")
    lines.append("")
    high_or_mid = verifier_buckets.get("高风险/过松或过严", []) + verifier_buckets.get("中等风险", [])
    if high_or_mid:
        lines.append("### 中高风险明细（建议逐条对照spec文件确认）")
        lines.append("")
        for t in high_or_mid:
            snippet = (t.get("verifier_risk") or "").replace("\n", " ")
            if len(snippet) > 200:
                snippet = snippet[:200] + "…"
            lines.append(f"- `{t['dataset_id']}`：{snippet}")
        lines.append("")

    # --- tool_boundary ---
    lines.append("## 4. tool_boundary：已知边界类型覆盖度 + 疑似新边界")
    lines.append("")
    boundary_counts: dict[str, int] = {tag: 0 for tag in KNOWN_BOUNDARY_TAGS}
    unmatched: list[dict[str, Any]] = []
    for t in tasks:
        text = t.get("tool_boundary", "") or ""
        matched = False
        for tag in KNOWN_BOUNDARY_TAGS:
            if tag in text:
                boundary_counts[tag] += 1
                matched = True
        if not matched and re.search(r"边界|新的模式|新类型|不属于", text):
            unmatched.append(t)
    for tag, count in boundary_counts.items():
        lines.append(f"- `{tag}`：{count}条提及")
    lines.append("")
    if unmatched:
        lines.append("### 提到\"边界/新模式\"但未匹配到已知四类标签的条目（候选新边界）")
        lines.append("")
        for t in unmatched:
            snippet = (t.get("tool_boundary") or "").replace("\n", " ")
            if len(snippet) > 200:
                snippet = snippet[:200] + "…"
            lines.append(f"- `{t['dataset_id']}`：{snippet}")
        lines.append("")

    # --- failure_mode: use ground-truth success flags, not keyword matching ---
    lines.append("## 5. failure_mode：真正失败的任务清单（按audit文件里的真实success布尔值，不是关键词猜的）")
    lines.append("")
    if ground_truth:
        failed_ids = [
            did for did, gt in ground_truth.items()
            if gt.get("hybrid_success") is False or gt.get("gui_only_success") is False
        ]
        by_id = {t["dataset_id"]: t for t in tasks}
        lines.append(f"183条里 **{len(failed_ids)}条** 存在至少一侧（hybrid或gui_only）真实失败：")
        lines.append("")
        for did in sorted(failed_ids):
            t = by_id.get(did)
            gt = ground_truth[did]
            side = []
            if gt.get("hybrid_success") is False:
                side.append("hybrid失败")
            if gt.get("gui_only_success") is False:
                side.append("gui_only失败")
            snippet = ((t or {}).get("failure_mode") or "（无对应LLM复核记录）").replace("\n", " ")
            if len(snippet) > 200:
                snippet = snippet[:200] + "…"
            lines.append(f"- `{did}`（{'+'.join(side)}）：{snippet}")
        lines.append("")
    else:
        lines.append("未提供 `--audit` 参数，跳过这一节（不要用关键词匹配free text猜失败，"
                     "\"两条轨迹均成功，无失败\"这类表述本身就包含\"失败\"二字，关键词匹配会产生大量假阳性）。")
        lines.append("")

    return "\n".join(lines)


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--review-dir", required=True)
    p.add_argument("--audit", default=None, help="trajectory_audit.py 产出的json（用于取真实success布尔值，强烈建议提供）")
    p.add_argument("--out", required=True)
    args = p.parse_args()

    review_dir = Path(args.review_dir)
    tasks = load_all_tasks(review_dir)
    ground_truth = load_ground_truth_success(args.audit)
    report = build_report(tasks, ground_truth)
    Path(args.out).write_text(report, encoding="utf-8")
    print(f"聚合了 {len(tasks)} 条任务的审查记录，写入 {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
