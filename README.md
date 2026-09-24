# OpenMobile-2 / MobileGym++

A browser-hosted phone simulator and a 215-task benchmark for mobile agents. Agents act through the graphical interface, through app-native tools, or through both. Tool calls and on-screen actions write the same application state, and each task is checked by a programmatic verifier.

This repository is the MobileGym++ environment. It is not the earlier MobileGym release (28 apps, a separate task set, and a downloadable data pack).

## What is in the tree

The paper counts **63 installable clients**: 49 commercial-style applications and 14 system clients.

- Commercial-style clients live in `apps/`. That directory also contains `apps/BilibiliV2`, which is not part of the 63.
- System clients live in `system/` (Answer Sheet, Browser, Calculator, Calculator 2, Calendar, Clock, Compass, Contacts, File Manager, Gallery, Notes, Settings, SMS, Theme Store).

**MobileGym++ Bench** is 215 tasks and covers **48** of these applications. The coverage count is the span of the benchmark, not the size of the simulator. Of the 215 tasks, 109 touch one app, 74 touch two, 27 touch three, and 5 touch four (106 are cross-app). A task can fall in more than one domain, so domain counts overlap.

| Path | Role |
| --- | --- |
| `apps/` | Commercial-style clients |
| `system/` | System clients |
| `os/` | Device shell: navigation, clipboard, files, notifications |
| `app_tools/` | App-native tool schemas and handlers |
| `bench215/` | Frozen 215-task entry point (`official.json`, `run.sh`) |
| `bench_env/` | Simulator driver, hybrid agent, task code, and tests |
| `docs/guides/` | How to add an app, a task, or an agent adapter |
| `scripts/` | Lint and maintenance helpers |

`bench215/run.sh` is the supported way to run the 215 tasks. Other suites under `bench_env/task/` are part of the task code and tests; they are not a second official benchmark.

## Run the simulator

Requires Node.js and npm.

```bash
npm install
npm run dev
```

Vite serves the simulator on port 3000 (`http://127.0.0.1:3000`). Use the URL printed by Vite as `--env-url` below.

`npm test` runs the Vitest suite. `npm run lint` checks `os/`, `apps/`, and `app_tools/`.

## Run the 215-task Bench

Requires Python 3 and the packages in `bench_env/requirements.txt`.

```bash
python3 -m pip install -r bench_env/requirements.txt
python3 -m playwright install chromium
```

Start the simulator first, then from the repository root:

```bash
zsh bench215/run.sh \
  --mode hybrid \
  --env-url http://127.0.0.1:3000 \
  --model-base-url http://HOST:PORT/v1 \
  --model-name YourModel \
  --model-api-key "$OPENAI_API_KEY" \
  --output-dir runs/bench-hybrid
```

`--mode gui_only` uses the same tasks and checkers without app-native tools. Results land in the output directory as `results.jsonl` and `summary.json`. See `bench215/README.md` for the suite list.

## License

Code is under `LICENSE`. Data terms, the disclaimer, and third-party notices are in `LICENSE-DATA`, `DISCLAIMER`, and `NOTICE`.
