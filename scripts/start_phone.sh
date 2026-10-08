#!/bin/zsh
# Start the browser phone. Leave this terminal running, then score a model
# with bench_env/benchmark/run.sh in another terminal.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -d node_modules ]]; then
  npm install
fi

export VITE_CDN_BASE="${VITE_CDN_BASE:-https://cdn.mobilegym.dev}"
exec npm run dev -- --host 127.0.0.1 --port "${PORT:-3000}"
