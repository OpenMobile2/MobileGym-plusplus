# -*- coding: utf-8 -*-
"""从 test_api_imggen.py 读取 key 后调用 gen_assets（避免把 key 写进仓库脚本）。"""
from __future__ import annotations

import os
import re
import runpy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[5]  # mobilegym-mock
TEST = ROOT / "tools" / "test_api_imggen.py"
text = TEST.read_text(encoding="utf-8")
m = re.search(r'API_KEY\s*=\s*"([^"]+)"', text)
if not m:
    raise SystemExit("无法从 tools/test_api_imggen.py 解析 API_KEY")
os.environ.setdefault("IMAGE_GEN_API_KEY", m.group(1))
os.environ.setdefault("IMAGE_GEN_BASE_URL", "https://api.openai.com")
os.environ.setdefault("FORCE_REGEN", "1")
runpy.run_path(str(Path(__file__).with_name("gen_assets.py")), run_name="__main__")
