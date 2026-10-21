#!/usr/bin/env python3
"""List relative / @-alias imports whose target is not in the git tree.

Uses `git ls-files` for existence, so it works on a sparse checkout.
Usage: check_imports.py <repo_root>
"""
import re
import subprocess
import sys
from pathlib import PurePosixPath

root = sys.argv[1] if len(sys.argv) > 1 else "."
files = set(subprocess.check_output(["git", "-C", root, "ls-files"], text=True).splitlines())
dirs = set()
for f in files:
    p = PurePosixPath(f).parent
    while str(p) != ".":
        dirs.add(str(p))
        p = p.parent

EXTS = ["", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".d.ts"]
IMPORT_RE = re.compile(
    r"""(?:import|export)\s[^'"]*?\sfrom\s*['"]([^'"]+)['"]"""
    r"""|import\s*['"]([^'"]+)['"]"""
    r"""|import\(\s*['"]([^'"]+)['"]\s*\)"""
    r"""|new\s+URL\(\s*['"](\.[^'"]+)['"]\s*,\s*import\.meta\.url"""
)
SKIP_DIRS = ("node_modules/", "dist/", "bench_env/", "docs/")


def norm(path: str) -> str:
    parts = []
    for part in path.split("/"):
        if part in ("", "."):
            continue
        if part == "..":
            if parts:
                parts.pop()
            continue
        parts.append(part)
    return "/".join(parts)


def exists(target: str) -> bool:
    for ext in EXTS:
        if target + ext in files:
            return True
    if target in dirs:
        for ext in EXTS[1:]:
            if f"{target}/index{ext}" in files:
                return True
    return False


missing = {}
for f in sorted(files):
    if not f.endswith((".ts", ".tsx", ".js", ".mjs", ".jsx")) or f.startswith(SKIP_DIRS):
        continue
    try:
        text = open(f"{root}/{f}", encoding="utf-8", errors="ignore").read()
    except FileNotFoundError:
        continue
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    text = re.sub(r"(^|\s)//[^\n]*", r"\1", text)
    for m in IMPORT_RE.finditer(text):
        spec = next(g for g in m.groups() if g)
        spec = spec.split("?")[0]
        if spec.startswith("@/"):
            target = norm(spec[2:])
        elif spec.startswith("."):
            target = norm(str(PurePosixPath(f).parent / spec))
        else:
            continue
        if "*" in target or target.endswith(".css"):
            continue
        if not exists(target):
            missing.setdefault(target, []).append(f)

for target, users in sorted(missing.items()):
    print(f"MISSING {target}  <- {len(users)} file(s): {', '.join(users[:4])}{' ...' if len(users) > 4 else ''}")
print(f"{len(missing)} missing module(s)")
sys.exit(1 if missing else 0)
