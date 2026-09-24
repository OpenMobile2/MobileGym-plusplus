# Hybrid Tools V3: Gemini 3.1 Pro Results

## Final Result

Run: `runs/hybrid-tools-v3-gemini31pro-80-par4-final-r4`

Configuration: `gemini-3.1-pro-preview`, OpenAI-compatible API, XML tool-call
protocol, 4 workers, 8192 output tokens, temperature 0, top-p 1, dynamic
foreground-App tools, and source-task step limits.

| Metric | Result |
| --- | ---: |
| Success rate | **63 / 80 (78.75%)** |
| Runtime errors | 0 |
| COMPLETE / MAX_STEPS | 76 / 4 |
| Clean episodes | 78 / 80 |
| Mean / median steps | 14.49 / 10.5 |
| P90 / maximum steps | 23 / 60 |
| All calls | 1,156 |
| App Tool / `mobile_use` calls | 278 / 878 |
| Distinct App Tools used | 61 |
| Episodes using both GUI and App Tools | 72 / 80 |

## Breakdown

| Group | Success |
| --- | ---: |
| Commerce | 11 / 11 (100.0%) |
| Content | 17 / 20 (85.0%) |
| Life | 12 / 21 (57.1%) |
| Taobao | 8 / 8 (100.0%) |
| Transfer | 4 / 5 (80.0%) |
| Work | 11 / 15 (73.3%) |

| Difficulty | Success |
| --- | ---: |
| L2 | 6 / 7 (85.7%) |
| L3 | 20 / 25 (80.0%) |
| L4 | 37 / 48 (77.1%) |

## Audit Progression

The first full pass scored 36/80. The initial post-build full pass scored 37/80.
The final score is not an indiscriminate rerun: only directly affected tasks were
rerun after each verified repair, and all other trajectories remain unchanged.

Repairs made during the audit included:

- aligning eBay total-price/filter ordering, Map candidate limits and category aliases,
  Weather offline data and future-day offsets, Spotify history ordering/liked identity,
  Alipay bill quick filters, and RedBook lazy base-data search with their GUI sources;
- replacing three ambiguous inherited tasks with unmodified official tasks whose
  instruction, setup, and verifier form a clear contract;
- exposing the simulated device date/time to the hybrid agent for relative-date tasks;
- accepting two instruction-equivalent message phrasings in V3 wrappers;
- enforcing non-stream OAI total timeouts and serializing regex verifier details.

Validation artifacts:

- 80/80 setup, initial-negative, and dynamic-tool checks:
  `runs/hybrid-tools-v3-setup-smoke-final-r3.json`
- 150/150 expanded tools, 159 successful browser calls, 0 failures:
  `runs/app-tools-expanded-smoke-v3-final-r6/report.json`
- 80 episode HTML viewers and exact rerun provenance are inside the final run.

This is an internal hybrid-tools benchmark result, not an official MobileGym
leaderboard submission. A fresh single-pass run can vary even at temperature 0
because the remote model service and visual execution are not fully deterministic.
