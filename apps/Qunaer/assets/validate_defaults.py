#!/usr/bin/env python3
import json
import re
from pathlib import Path

path = Path(__file__).resolve().parent.parent / "data" / "defaults.json"
data = json.loads(path.read_text(encoding="utf-8"))
errors = []


def check(value, key="root"):
    if isinstance(value, dict):
        for child_key, child in value.items():
            check(child, f"{key}.{child_key}")
    elif isinstance(value, list):
        for index, child in enumerate(value):
            check(child, f"{key}[{index}]")
    elif isinstance(value, str) and re.search(r"\.(png|jpg|jpeg|webp)$", value, re.I):
        if not value.startswith("/@app-assets/Qunaer/"):
            errors.append(f"bad asset path {key}: {value}")


check(data)
for collection in ("hotels", "scenics", "world", "orders"):
    if len(data[collection]) < 5:
        errors.append(f"{collection} must contain at least 5 varied seeds")

if errors:
    print("\n".join(errors))
    raise SystemExit(1)
print("OK: Qunaer defaults are valid and main lists contain >=5 entries")
