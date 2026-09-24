#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../../../../.." && pwd)"

if [[ -f "${repo_root}/.env" ]]; then
  chmod 600 "${repo_root}/.env"
fi

if [[ -d "${repo_root}/didi_images" ]]; then
  find "${repo_root}/didi_images" -type d -exec chmod 700 {} +
  find "${repo_root}/didi_images" -type f -exec chmod 600 {} +
fi

echo "Private DiDi source material permissions hardened."
