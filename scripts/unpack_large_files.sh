#!/bin/zsh
# Restore data files stored compressed or split because of a per-file size
# limit. Safe to run more than once.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

while IFS=$'\t' read -r kind rel; do
  [[ -z "$kind" || -f "$rel" ]] && continue
  case "$kind" in
    gz) gunzip -c "$rel.gz" > "$rel.tmp" && mv "$rel.tmp" "$rel" ;;
    split) cat "$rel".part[0-9][0-9] > "$rel.tmp" && mv "$rel.tmp" "$rel" ;;
  esac
done < scripts/large_files.txt
