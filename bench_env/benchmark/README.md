# MobileGym++ Bench

MobileGym++ Bench 是仓库中的唯一正式评测集，共 215 个任务。完整题目清单、稳定任务 ID、正式题面和应用范围保存在 [`official.json`](official.json)；任务设置与程序化检查器由仓库中的 `bench_env/task/` 实现。

## 运行完整评测集

安装依赖：

```bash
python3 -m pip install -r bench_env/requirements.txt
python3 -m playwright install chromium
npm install
```

启动模拟器并保持运行：

```bash
npm run dev
```

在另一个终端的仓库根目录一次性运行全部 215 题：

```bash
zsh bench_env/benchmark/run.sh \
  --mode hybrid \
  --env-url http://127.0.0.1:3000 \
  --model-base-url http://HOST:PORT/v1 \
  --model-name YourModel \
  --model-api-key "$OPENAI_API_KEY" \
  --output-dir runs/mobilegympp-bench
```

`--mode gui_only` 使用同一套题目和检查器，仅开放图形界面操作。运行结果直接写入指定目录的 `results.jsonl`、`summary.json`、`tasks.json` 和 `episodes/`。

## English

MobileGym++ Bench is the repository's single official evaluation set: 215 tasks with stable IDs, official instructions, and app coverage in [`official.json`](official.json). Task setup and programmatic checkers are implemented in `bench_env/task/`.

Install the Python dependencies and Playwright browser, start the simulator with `npm run dev`, then run `zsh bench_env/benchmark/run.sh` from another terminal at the repository root. The runner executes the complete set once and writes one result file and summary to the requested output directory. Use `--mode gui_only` for GUI-only evaluation; the default is `hybrid`.
