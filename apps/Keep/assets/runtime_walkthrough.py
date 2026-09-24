# -*- coding: utf-8 -*-
"""Keep 阶段⑤运行时走查入口；复用工作区 Node Playwright，避免额外安装 Python 包。"""
from pathlib import Path
import os
import subprocess
import sys

HERE = Path(__file__).resolve().parent
DEFAULT_NODE_MODULES = (
    Path.home()
    / ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules"
)


def main() -> int:
    env = os.environ.copy()
    if "NODE_PATH" not in env and DEFAULT_NODE_MODULES.exists():
        env["NODE_PATH"] = str(DEFAULT_NODE_MODULES)
    return subprocess.run(
        [env.get("NODE_BINARY", "node"), str(HERE / "runtime_walkthrough.mjs")],
        env=env,
        check=False,
    ).returncode


if __name__ == "__main__":
    sys.exit(main())
