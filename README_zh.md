# OpenMobile-2 / MobileGym++

浏览器里的手机模拟器，以及一套 215 题的移动智能体评测。智能体可以只走图形界面、只调用应用自带工具，或两者混用。工具调用和界面操作写的是同一份应用状态，每题由程序化检查器判定。

本仓库是 MobileGym++ 环境，不是前作 MobileGym（28 个应用、另一套任务，以及单独下载的数据包）。

## 仓库里有什么

论文计入 **63 个可安装客户端**：49 个商业风格应用，14 个系统客户端。

- 商业风格应用在 `apps/`。该目录里还有 `apps/BilibiliV2`，不计入这 63 个。
- 系统客户端在 `system/`（答题卡、浏览器、计算器、计算器 2、日历、时钟、指南针、电话、文件、相册、笔记、设置、短信、主题商店）。

**MobileGym++ Bench** 有 215 题，覆盖其中 **48** 个应用。48 是题目覆盖范围，不是模拟器的规模。215 题里，109 题涉及 1 个应用，74 题涉及 2 个，27 题涉及 3 个，5 题涉及 4 个（跨应用 106 题）。一道题可以同时落入多个领域，领域计数会重叠。

| 路径 | 作用 |
| --- | --- |
| `apps/` | 商业风格客户端 |
| `system/` | 系统客户端 |
| `os/` | 设备外壳：导航、剪贴板、文件、通知 |
| `app_tools/` | 应用自带工具的 schema 与处理函数 |
| `bench_env/benchmark/` | 唯一正式的 215 题评测集及运行入口 |
| `bench_env/` | 模拟器驱动、混合动作智能体、任务代码与测试 |
| `docs/guides/` | 如何新增应用、任务或智能体适配器 |
| `scripts/` | 检查与维护脚本 |

完整运行正式评测集用 `bench_env/benchmark/run.sh`；任务设置和程序化检查器实现在 `bench_env/task/`。

## 启动模拟器

需要 Node.js 和 npm。

```bash
npm install
npm run dev
```

Vite 默认在 3000 端口提供模拟器（`http://127.0.0.1:3000`）。下面的 `--env-url` 填 Vite 打印出来的地址。

`npm test` 跑 Vitest。`npm run lint` 检查 `os/`、`apps/` 和 `app_tools/`。

## 跑 215 题 Bench

需要 Python 3，以及 `bench_env/requirements.txt` 里的依赖。

```bash
python3 -m pip install -r bench_env/requirements.txt
python3 -m playwright install chromium
```

先启动模拟器，再在仓库根目录执行：

```bash
zsh bench_env/benchmark/run.sh \
  --mode hybrid \
  --env-url http://127.0.0.1:3000 \
  --model-base-url http://HOST:PORT/v1 \
  --model-name YourModel \
  --model-api-key "$OPENAI_API_KEY" \
  --output-dir runs/bench-hybrid
```

`--mode gui_only` 使用同一套 215 道题和检查器，只开放图形界面操作。一次运行会在输出目录生成 `results.jsonl`、`summary.json` 和题目运行记录。完整说明见 `bench_env/benchmark/README.md`。

## 许可

代码见 `LICENSE`。数据条款、免责声明和第三方声明见 `LICENSE-DATA`、`DISCLAIMER` 和 `NOTICE`。
