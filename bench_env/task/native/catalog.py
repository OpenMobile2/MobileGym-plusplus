"""生成可人工审查的 V6 中文任务目录。"""

from __future__ import annotations

from collections import Counter
from pathlib import Path

from bench_env.task.native.specs import EXCLUDED_CASES, REPAIRED_CASES
from bench_env.task.native.tasks import RUNTIME_CASES


def render_catalog() -> str:
    tools = Counter(tool for spec in RUNTIME_CASES for tool in spec.candidate_tools)
    rows = [
        "# Hybrid Tools V6 任务目录",
        "",
        f"- 计分任务：{len(RUNTIME_CASES)}",
        f"- V6 verifier 修订：{len(REPAIRED_CASES)} 条（Case 11、20、33、54）",
        f"- 从 V5 删除：{len(EXCLUDED_CASES)} 条（Case 45）",
        f"- 候选 App Tools：{len(tools)} 种",
        f"- 固定模拟时间：`{RUNTIME_CASES[0].simulated_time}`",
        "- 主要指标：任务成功率（SR）",
        "- ID 策略：保留原 Case ID，不因删除 Case45 而重编号",
        "",
        "| V6 任务 ID | V5 来源 | V6 状态 | 难度 | App | 原始任务类 | 指令 |",
        "| --- | --- | --- | --- | --- | --- | --- |",
    ]
    for spec in RUNTIME_CASES:
        instruction = spec.instruction.replace("|", "\\|")
        status = "V6 verifier 修订" if spec.index in REPAIRED_CASES else "继承 V5"
        rows.append(
            f"| `{spec.task_id}` | `HTV5Case{spec.index:02d}` | {status} | "
            f"{spec.difficulty} | {', '.join(spec.apps)} | `{spec.source_task}` | "
            f"{instruction} |"
        )
    rows.extend([
        "",
        "## 候选工具覆盖",
        "",
        "这里的覆盖表示对应 App 在前台时 runtime 会向 agent 暴露该工具；",
        "并不表示任务必须调用它，纯 GUI 与其他合理混合轨迹仍由同一 verifier 判定。",
        "",
        "| Tool | 可候选任务数 |",
        "| --- | ---: |",
    ])
    rows.extend(f"| `{name}` | {count} |" for name, count in sorted(tools.items()))
    rows.append("")
    return "\n".join(rows)


def main() -> int:
    output = Path(__file__).with_name("TASK_CATALOG.md")
    output.write_text(render_catalog(), encoding="utf-8")
    print(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
