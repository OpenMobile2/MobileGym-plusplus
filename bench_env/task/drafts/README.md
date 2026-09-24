# Hybrid Tools V3

`drafts` is an 80-task evaluation suite for agents that interleave
screenshot-based GUI actions with dynamically exposed App Tools.

## Contract

- 67 tasks are curated from the official 256-task test split.
- Official-derived cases keep the original default instruction, setup and verifier together.
- 8 Taobao cases reuse the app's existing setup and verifier but are not part of the official split.
- 5 deterministic cross-app transfer cases reuse audited V2-owned setup and state verifiers.
- No task rewrites an instruction while inheriting a verifier written for different wording.
- eBay source verifiers reuse their semantic output checks but omit procedural GUI-search-history checks, so read-only tools and GUI search are judged equivalently.
- The suite covers 21 apps and all 203 App Tools as candidate capabilities.
- App Tools remain optional: the same source final-state verifier judges GUI and tool effects.

Tasks known to be ambiguous or verifier-incomplete during the V2 audit are excluded.
Selection favors ranking, aggregation, conditional branches, date/time reasoning,
multi-output consistency and sensitive GUI-only final actions.

See `TASK_CATALOG.md` for every frozen instruction and source verifier.

## Audited Gemini Result

The final audited Gemini 3.1 Pro run is:

```text
runs/hybrid-tools-v3-gemini31pro-80-par4-final-r4
```

It contains 80 trajectory viewers and reports **63/80 = 78.75% SR**, with zero
runtime errors. See [RESULTS_GEMINI31PRO.md](./RESULTS_GEMINI31PRO.md) for the
full metric breakdown and [FAILURE_AUDIT.md](./FAILURE_AUDIT.md) for the
case-by-case review of all 17 remaining failures.

The final directory is an audited merge: the original complete run is retained
for unaffected tasks, while only tasks affected by a verified environment,
tool-contract, prompt-context, or task-selection repair are replaced by reruns.
`repair_provenance.json` records the source trajectory for every task.

## Validate

```bash
/opt/miniconda3/envs/mobilegym-bench/bin/python -m pytest -q \
  bench_env/tests/drafts

NO_PROXY=127.0.0.1,localhost no_proxy=127.0.0.1,localhost \
env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY \
  -u http_proxy -u https_proxy -u all_proxy \
/opt/miniconda3/envs/mobilegym-bench/bin/python \
  -m bench_env.task.drafts.smoke \
  --env-url http://127.0.0.1:4181 --headless \
  --output runs/hybrid-tools-v3-setup-smoke.json
```

## Run Gemini 3.1 Pro

```bash
RUN_DIR="runs/hybrid-tools-v3-gemini31pro-80-par4-$(date +%Y%m%d-%H%M%S)"

NO_PROXY=127.0.0.1,localhost no_proxy=127.0.0.1,localhost \
env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY \
  -u http_proxy -u https_proxy -u all_proxy \
/opt/miniconda3/envs/mobilegym-bench/bin/python -m bench_env.hybrid_benchmark \
  --suite drafts \
  --env-url http://127.0.0.1:4181 \
  --model-base-url https://example.invalid/v1 \
  --model-api-key "$MODEL_API_KEY" \
  --model-name gemini-3.1-pro-preview \
  --parallel 4 --headless \
  --max-tokens 8192 --temperature 0 --top-p 1 \
  --output-dir "$RUN_DIR"
```
