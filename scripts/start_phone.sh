#!/bin/zsh
# Start the browser phone. Leave this terminal running, then score a model
# with bench_env/benchmark/run.sh in another terminal.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PORT="${PORT:-3000}"

step() { print -P "%F{green}[$1/4]%f $2"; }

need_node() {
  if ! command -v node >/dev/null 2>&1; then
    print -P "%F{red}Node.js 22 or newer is required (node was not found).%f"
    exit 1
  fi
  local major="${$(node -p 'process.versions.node.split(".")[0]'):-0}"
  if (( major < 22 )); then
    print -P "%F{red}Node.js 22 or newer is required (found $(node -v)).%f"
    exit 1
  fi
}

step 1 "Checking Node.js"
need_node
print "      node $(node -v), npm $(npm -v)"

step 2 "Restoring large data files stored compressed (first run only)"
zsh scripts/unpack_large_files.sh
print "      done"

step 3 "Installing Node packages"
if [[ -d node_modules ]]; then
  print "      node_modules already present, skipped"
else
  print "      first run: this downloads a few hundred MB and can take several minutes"
  # The phone does not need the headless browser that puppeteer downloads; only
  # developer smoke scripts use it.
  PUPPETEER_SKIP_DOWNLOAD=1 npm install --no-audit --no-fund
fi

export VITE_CDN_BASE="${VITE_CDN_BASE-https://cdn.mobilegym.dev}"
step 4 "Starting the phone at http://127.0.0.1:${PORT}"
if [[ -n "$VITE_CDN_BASE" ]]; then
  print "      wallpapers and theme assets load from ${VITE_CDN_BASE}"
else
  print "      VITE_CDN_BASE is empty: no external requests, wallpapers and theme widgets are off"
fi
print "      open the URL above in a browser; keep this terminal running (Ctrl+C to stop)"
exec npm run dev -- --host 127.0.0.1 --port "$PORT"
