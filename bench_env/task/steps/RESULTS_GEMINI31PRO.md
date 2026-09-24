# Gemini 3.1 Pro Result

## Configuration

- Suite: `steps`
- Tasks: 50 fixed cases
- Model: `gemini-3.1-pro-preview`
- Agent: Hybrid XML runtime with dynamic foreground-App tools
- GUI coordinate space: normalized 0-1000
- Workers: 4
- Maximum output tokens: 8192
- Temperature: 0
- Top-p: 1
- Maximum task steps: 45-60, inherited from each source task

Final artifacts:

```text
runs/hybrid-tools-v2-gemini31pro-50-par4-final
```

## Result

| Metric | Value |
| --- | ---: |
| Overall SR | 14/50 = 28.0% |
| Official-derived cases | 9/40 = 22.5% |
| New hybrid dependency cases | 5/10 = 50.0% |
| L3 | 4/7 = 57.1% |
| L4 | 10/43 = 23.3% |
| Mean steps | 24.14 |
| Median steps | 18 |
| P90 steps | 54 |
| Maximum steps | 60 |
| App Tool calls | 128 |
| Distinct App Tools used | 22 |
| Runner/API errors | 0 |

Stop reasons were `COMPLETE=45`, `MAX_STEPS=4`, and `ABORT=1`. The remaining
ABORT was an intentional model failure termination in the weather/meeting task,
not an empty API response. The final run contains no empty-response or runner
errors.

This is substantially more discriminative than v1's 87/90 (96.7%). V2 tasks
use hidden source values, ranking and aggregation, conditional branches,
derived dates/times, preservation constraints, and multi-App output
consistency. The step distribution also moved from v1's median 7 and P90 11 to
median 18 and P90 54.

## Repair Provenance

The initial complete r2 run is preserved at:

```text
runs/hybrid-tools-v2-gemini31pro-50-par4-e2e-r2
```

It scored 11/50 (22%). Inspection found four suite-side issues rather than
model capability failures:

1. Notes was ambiguous with the added Flomo app. V2 instructions now name the
   official `Notes` app explicitly.
2. Days Matter seeds used local `+08:00` midnight, while the app's canonical
   date representation is UTC midnight. V2 now normalizes only its own seeds.
3. The pantry task did not distinguish the standalone Taobao Instant app from
   the regular Taobao app's unavailable entry point.
4. Two custom verifier contracts required details not requested by the
   instruction or exact whitespace/non-persistent location fields.

Only affected tasks were rerun with the same model configuration. The final
directory copies the other 46 r2 episodes unchanged and records every
replacement in `repair_provenance.json`. Raw r2 and both repair runs remain
available for audit.

## Verification

Before model execution, all 50 task setups were exercised against the real
browser and confirmed not to pass from initial state. The final implementation
also passed:

```text
538 passed
```

This regression set covers the Hybrid runtime, v1/v2 suites, and the official
commerce, content, life, and work task/verifier suites inherited by v2.

