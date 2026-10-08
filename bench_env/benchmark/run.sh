#!/bin/zsh
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
MANIFEST="$HERE/official.json"
cd "$ROOT"

PY="${PY:-python3}"
MODE="hybrid"
ENV_URL=""
MODEL_URL=""
MODEL_NAME=""
MODEL_KEY="${OPENAI_API_KEY:-}"
OUT=""
PARALLEL=5
MAX_TOKENS=4096
TEMP=0.1
AGENT_PROTOCOL="xml"
MODEL_EXTRA_BODY_JSON=""
COORD_SPACE="norm_0_1000"
HEADLESS=1

usage() {
  cat <<'HELP'
Run the complete official MobileGym++ Bench (215 tasks).

Required:
  --env-url URL
  --model-base-url URL
  --model-name NAME
  --output-dir DIR

Optional:
  --mode hybrid|gui_only       default: hybrid
  --model-api-key KEY          defaults to OPENAI_API_KEY
  --agent-protocol PROTOCOL    xml (default, runs qwen35_session), venus, gpt_responses, or kimi_k2_6
  --model-extra-body-json JSON
  --coord-space SPACE
  --parallel N                 default: 5
  --max-tokens N               default: 4096
  --temperature VALUE          default: 0.1
  --no-headless
HELP
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode) MODE="$2"; shift 2 ;;
    --env-url) ENV_URL="$2"; shift 2 ;;
    --model-base-url) MODEL_URL="$2"; shift 2 ;;
    --model-name) MODEL_NAME="$2"; shift 2 ;;
    --model-api-key) MODEL_KEY="$2"; shift 2 ;;
    --output-dir) OUT="$2"; shift 2 ;;
    --agent-protocol) AGENT_PROTOCOL="$2"; shift 2 ;;
    --model-extra-body-json) MODEL_EXTRA_BODY_JSON="$2"; shift 2 ;;
    --coord-space) COORD_SPACE="$2"; shift 2 ;;
    --parallel) PARALLEL="$2"; shift 2 ;;
    --max-tokens) MAX_TOKENS="$2"; shift 2 ;;
    --temperature) TEMP="$2"; shift 2 ;;
    --no-headless) HEADLESS=0; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done

if [[ -z "$ENV_URL" || -z "$MODEL_URL" || -z "$MODEL_NAME" || -z "$OUT" ]]; then
  echo "Missing a required argument." >&2
  usage >&2
  exit 2
fi
if [[ "$MODE" != "gui_only" && "$MODE" != "hybrid" ]]; then
  echo "--mode must be gui_only or hybrid" >&2
  exit 2
fi

mkdir -p "$OUT"
TASK_IDS_FILE="$OUT/task_ids.txt"
N_TASKS="$($PY - "$MANIFEST" "$TASK_IDS_FILE" <<'PY'
import json
import sys
from pathlib import Path

manifest_path, task_ids_path = map(Path, sys.argv[1:])
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
tasks = manifest["tasks"]
ids = [row["task_id"] for row in tasks]
if len(ids) != manifest["n"]:
    raise SystemExit(f"Manifest count mismatch: n={manifest['n']}, tasks={len(ids)}")
if len(ids) != len(set(ids)):
    raise SystemExit("Manifest contains duplicate task IDs")
task_ids_path.write_text("".join(task_id + "\n" for task_id in ids), encoding="utf-8")
print(len(ids))
PY
)"
SUITES="$($PY - "$TASK_IDS_FILE" <<'PY'
import sys
from pathlib import Path
ids = Path(sys.argv[1]).read_text(encoding="utf-8").splitlines()
print(",".join(sorted({task_id.split(".", 1)[0] for task_id in ids})))
PY
)"

export PYTHONUNBUFFERED=1
PYTHONPATH_VALUE="${PYTHONPATH:-}"
NO_PROXY_VALUE="${NO_PROXY:-}"
export PYTHONPATH="$ROOT${PYTHONPATH_VALUE:+:$PYTHONPATH_VALUE}"
export NO_PROXY="127.0.0.1,localhost${NO_PROXY_VALUE:+,$NO_PROXY_VALUE}"
export no_proxy="$NO_PROXY"

HEADLESS_FLAG=()
[[ "$HEADLESS" == 1 ]] && HEADLESS_FLAG=(--headless)
MODEL_KEY="${MODEL_KEY:-EMPTY}"
MODEL_BODY_ARGS=()
[[ -n "$MODEL_EXTRA_BODY_JSON" ]] && MODEL_BODY_ARGS=(--model-extra-body-json "$MODEL_EXTRA_BODY_JSON")

# Bench 215 is the Qwen3.5 session protocol. The other --agent-protocol values
# keep their own adapters and do not use that session packing.
RUNTIME_ARGS=(--runtime hybrid_xml)
if [[ "$AGENT_PROTOCOL" == "xml" ]]; then
  RUNTIME_ARGS=(--runtime qwen35_session --last-n 3 --enable-thinking true)
fi

echo "[MobileGym++ Bench] Running all $N_TASKS tasks -> $OUT"
"$PY" -m bench_env.hybrid_benchmark \
  --suite "$SUITES" \
  --task-ids-file "$TASK_IDS_FILE" \
  --interaction-mode "$MODE" \
  --agent-protocol "$AGENT_PROTOCOL" \
  "${RUNTIME_ARGS[@]}" \
  --coord-space "$COORD_SPACE" \
  --env-url "$ENV_URL" \
  --model-base-url "$MODEL_URL" \
  --model-api-key "$MODEL_KEY" \
  --model-name "$MODEL_NAME" \
  --parallel "$PARALLEL" \
  --max-tokens "$MAX_TOKENS" \
  --temperature "$TEMP" \
  --output-dir "$OUT" \
  --quiet \
  "${MODEL_BODY_ARGS[@]}" \
  "${HEADLESS_FLAG[@]}"
