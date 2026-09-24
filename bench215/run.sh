#!/bin/zsh
# Official 215 in one place. Person running another base model only needs this folder.
# Usage:
#   zsh bench215/run.sh --mode hybrid \
#     --env-url http://127.0.0.1:4173 \
#     --model-base-url http://host:port/v1 \
#     --model-name YourModel \
#     --model-api-key KEY \
#     --output-dir runs/bench215-yourmodel-hybrid
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
cd "$ROOT"
PY="${PY:-python3}"
[[ -x "$PY" ]] || PY="$(command -v python3)"

MODE="hybrid"
ENV_URL=""
MODEL_URL=""
MODEL_NAME=""
MODEL_KEY="${OPENAI_API_KEY:-}"
OUT=""
PARALLEL=5
MAX_TOKENS=4096
TEMP=0.1
HEADLESS=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode) MODE="$2"; shift 2 ;;
    --env-url) ENV_URL="$2"; shift 2 ;;
    --model-base-url) MODEL_URL="$2"; shift 2 ;;
    --model-name) MODEL_NAME="$2"; shift 2 ;;
    --model-api-key) MODEL_KEY="$2"; shift 2 ;;
    --output-dir) OUT="$2"; shift 2 ;;
    --parallel) PARALLEL="$2"; shift 2 ;;
    --max-tokens) MAX_TOKENS="$2"; shift 2 ;;
    --temperature) TEMP="$2"; shift 2 ;;
    --no-headless) HEADLESS=0; shift ;;
    -h|--help)
      sed -n '2,12p' "$0"
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

if [[ -z "$ENV_URL" || -z "$MODEL_URL" || -z "$MODEL_NAME" || -z "$OUT" ]]; then
  echo "need --mode --env-url --model-base-url --model-name --output-dir" >&2
  exit 2
fi
if [[ "$MODE" != "gui_only" && "$MODE" != "hybrid" ]]; then
  echo "--mode must be gui_only or hybrid" >&2
  exit 2
fi

export PYTHONUNBUFFERED=1 PYTHONPATH="$ROOT${PYTHONPATH:+:$PYTHONPATH}"
unset HTTP_PROXY HTTPS_PROXY ALL_PROXY http_proxy https_proxy all_proxy
export NO_PROXY=127.0.0.1,localhost
export no_proxy=127.0.0.1,localhost

HEADLESS_FLAG=()
[[ "$HEADLESS" == 1 ]] && HEADLESS_FLAG=(--headless)

SUITES="$("$PY" -c 'import json; print(",".join(json.load(open("bench215/official.json"))["suites"]))')"
MAIN_IDS="$("$PY" -c 'import json; print(",".join(json.load(open("bench215/official.json"))["main_ids"]))')"
SEC_ID="$("$PY" -c 'import json; print(json.load(open("bench215/official.json"))["secretary_task_id"])')"

run_one() {
  local pack="$1" suites="$2" ids="$3" dest="$4"
  mkdir -p "$dest"
  echo "[bench215] $MODE pack=$pack n=$(python3 -c "print(len('$ids'.split(',')))") -> $dest"
  "$PY" -m bench_env.hybrid_benchmark \
    --suite "$suites" \
    --task-ids "$ids" \
    --interaction-mode "$MODE" \
    --runtime qwen35_session \
    --last-n 3 \
    --enable-thinking true \
    --env-url "$ENV_URL" \
    --model-base-url "$MODEL_URL" \
    --model-api-key "${MODEL_KEY:-EMPTY}" \
    --model-name "$MODEL_NAME" \
    --parallel "$PARALLEL" \
    --max-tokens "$MAX_TOKENS" \
    --temperature "$TEMP" \
    --output-dir "$dest" \
    --quiet \
    "${HEADLESS_FLAG[@]}" \
    || true
}

mkdir -p "$OUT"
run_one main "$SUITES" "$MAIN_IDS" "$OUT/main"
run_one secretary crossapp "$SEC_ID" "$OUT/secretary"

"$PY" - <<PY
import json
from pathlib import Path
out = Path("$OUT")
rows = []
for pack in ("main", "secretary"):
    p = out / pack / "results.jsonl"
    if p.exists():
        rows.extend(json.loads(line) for line in p.read_text().splitlines() if line.strip())
(out / "results.jsonl").write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rows), encoding="utf-8")
ok = sum(1 for r in rows if r.get("success"))
n = len(rows)
steps = [r["steps"] for r in rows if isinstance(r.get("steps"), (int, float))]
summary = {
    "n": n,
    "successful": ok,
    "sr": (ok / n) if n else 0,
    "mean_steps": (sum(steps) / len(steps)) if steps else None,
    "interaction_mode": "$MODE",
    "model_name": "$MODEL_NAME",
    "official": "bench215",
}
(out / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"[bench215] done {ok}/{n} SR={summary['sr']:.3f} output={out}")
PY
