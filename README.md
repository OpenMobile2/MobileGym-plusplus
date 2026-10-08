# MobileGym++

<p align="center">
  <a href="README_zh.md"><b>中文</b></a>
  &nbsp;·&nbsp;
  <a href="https://os-copilot.github.io/OpenMobile2-Home"><b>Homepage</b></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/OpenMobile2/OpenMobile2-Code"><b>Agent code</b></a>
  &nbsp;·&nbsp;
  <a href="https://huggingface.co/datasets/OpenMobile-2/OpenMobile-Data"><b>Dataset</b></a>
  &nbsp;·&nbsp;
  <a href="https://huggingface.co/OpenMobile-2/OpenMobile-27B"><b>Model</b></a>
  &nbsp;·&nbsp;
  <a href="https://mobilegym-mock-production.up.railway.app"><b>Try the phone</b></a>
</p>

<p align="center">
  <a href="LICENSE"><img alt="Apache 2.0" src="https://img.shields.io/badge/license-Apache%202.0-blue.svg"></a>
  <a href="bench_env/benchmark/official.json"><img alt="215 tasks" src="https://img.shields.io/badge/bench-215%20tasks-111111.svg"></a>
  <a href="#the-phone"><img alt="63 clients" src="https://img.shields.io/badge/clients-63-111111.svg"></a>
</p>

<p align="center">
  <img src="docs/images/fig2b-hybrid.png" alt="GUI-only actions on top. Below, the same task interleaves clicks with app-native calls such as list_order and search_item. Both write one shared application state." width="780">
</p>

<p align="center">
  <em>Same task, same application state, same checker.</em><br>
  The top path is GUI only. The bottom path interleaves those gestures with the app's own tools.
</p>

Mobile agents are being asked to finish real workflows on commercial applications: book a trip, pay an order, carry a value from one app into another. Those workflows are long, and the outcome that matters is a change in the application's own records.

**MobileGym++** is a phone that runs in the browser, so those workflows can be reset, replayed, and checked in parallel. It extends [MobileGym](https://arxiv.org/abs/2605.26114) with 35 new commercial-style applications, explicit cross-app mechanisms, and an experimental setting in which an application exposes selected functions as tools beside its GUI. The agent sees screen pixels. There is no accessibility tree, and it cannot read business state directly. Device state is fully serializable, so every episode can start from the same snapshot.

This repository is that phone, together with **MobileGym++ Bench**: 215 tasks, each scored by a programmatic checker over application state. Training trajectories, the Android-emulator playground, and the released model live with [OpenMobile2](https://github.com/OpenMobile2/OpenMobile2-Code).

## Two channels, one state

Computer use is moving past GUI-only interaction. MobileGym++ brings that idea to the phone. An application's tools are not an outside API glued on afterwards. Each tool is a structured lookup or write over that application's own objects, and it changes the same persistent state as the matching taps and keystrokes. A call such as `search_item` and the taps that would reach the same screen write one store. GUI-only and hybrid therefore share the task, the initial state, and the checker. The only thing that changes is the path.

More than 300 such tools are exposed across 50-plus applications, including system clients such as Clock and Notes. A tool is offered only while its application is in front. Every benchmark task remains solvable from the GUI alone.

| | GUI only | Hybrid |
| --- | --- | --- |
| Flag | `--mode gui_only` | `--mode hybrid` |
| What the agent can do | Tap, type, and scroll on the screenshot | The same gestures, plus the foreground app's tools |
| What is checked | The resulting application state | The same application state |

## The phone

The phone installs **63** clients: **35** built for this release and **28** kept from MobileGym. **47** are commercial-style applications and **16** are system clients. They cover travel, shopping, finance, content, social, office, and local services.

<p align="center">
  <img src="docs/images/app-coverage.png" alt="Application coverage. The simulator phone has 63 apps and is this repository. The emulator phone has 62 apps and is not in this repository. Each square is two applications. Dots mark apps that expose native tools." width="720">
</p>

The upper phone is this repository. The lower phone is the Android-emulator playground released with OpenMobile2, and those apps are not in this clone. Each square stands for two applications. A dot marks an application that exposes native tools.

Each client keeps its own business objects — orders, bills, itineraries, messages — and those objects change as the agent acts. Clipboard transfer, app-to-app sharing, payment redirection, and media selection connect the clients, so a workflow can leave one application and write into another. The whole device can be snapshotted and restored, which is what makes a training episode and an evaluation run start from the same place.

Among the new clients, the median application exposes 37 routes, 166 interactive actions, and 86 page transitions, with a median depth of 3 from its home screen. Set beside the 12 earlier MobileGym business apps that remain on this phone, the new clients reach 1.48× the interactive actions and 1.91× the page transitions.

<details>
<summary>Clients</summary>

**Commerce.** Alipay, Taobao, Taobao Shangou, JD, Pinduoduo, Xianyu, Vipshop, Suning, eBay, Kapi.

**Local life.** Meituan, Dianping, Ctrip, Qunar, Didi, Railway 12306, Map, Cainiao, Luckin.

**Social and media.** WeChat, RedBook, Weibo, Bilibili, Douban, Reddit, X, WeChat Reading, Fanqie Novel, Ximalaya, Podcasts, NetEase Cloud Music, Spotify, Tencent Video, Youku, Maoyan.

**Work and personal.** Slack, Tencent Meeting, Google Drive, Mail, Dida, flomo, Days Matter, Fanqie Todo, Xiaorichang, BOSS Zhipin, Baicizhan, Keep, Meiyou.

**System, under `system/`.** Answer sheet, Browser, Calculator, Calculator 2, Calendar, Clock, Compass, Phone, Files, Gallery, Notes, Settings, SMS, Themes.

Weather and NetEase Cloud Music are stored under `apps/` and counted with the system clients. That is why `apps/` has 49 directories and `system/` has 14, while the counts above are 47 and 16. Both pairs are the same 63 clients.

</details>

## MobileGym++ Bench

The benchmark asks whether an agent can complete a commercial write inside this phone: find the right screen, and, when the task crosses apps, recover a live value from another client's store and put it in the right field. Instructions are written as user goals. They do not name the widget, the tool, or the field the checker reads.

There are **215** tasks, touching **48** of the installed clients. 109 use one app, 74 use two, 27 use three, and 5 use four, so **106** tasks cross applications. A task can sit in more than one domain; the right-hand counts overlap and do not add up to 215.

<p align="center">
  <img src="docs/images/bench-composition.png" alt="MobileGym++ Bench: 109, 74, 27, and 5 tasks by app count, and overlapping domain incidences." width="92%">
</p>

Each task is a user goal, a bound initial state, and a checker over the before/after difference of application state. The checker does not watch the trajectory or the screenshots, and it does not ask another model to judge. GUI-only and hybrid runs use the same tasks, the same initial states, and the same checks. The reported number is success rate.

The task list, stable ids, and instructions are in [`bench_env/benchmark/official.json`](bench_env/benchmark/official.json).

### How this environment compares

Commercial-app counts below follow the same definition as the paper: for MobileGym++, the 35 are the applications built in this work. The phone also keeps the earlier clients, 63 installable in total.

| Environment | Platform | Commercial apps | Tasks | Cross-app | GUI | App-native tools | Controllable reset |
| --- | --- | ---: | ---: | --- | --- | --- | --- |
| AppWorld | API | 9 | 750 | yes | — | — | yes |
| AndroidLab | Emulator | 5 | 138 | — | yes | — | — |
| AndroidWorld | Emulator | 0 | 116 | yes | yes | — | — |
| SPA-Bench | Real device | 58 | 340 | yes | yes | — | — |
| MobileWorld | Emulator | 4 | 201 | yes | yes | — | — |
| MobileGym | Simulator | 12 | 416 | limited | yes | — | yes |
| **MobileGym++** | **Simulator** | **35** | **215** | **yes** | **yes** | **yes** | **yes** |

## Layout

| Path | What it is |
| --- | --- |
| `apps/` | Commercial-style clients, plus Weather and NetEase Cloud Music |
| `system/` | System clients: clock, notes, calendar, files, settings, and the rest |
| `os/` | The device shell: launcher, status bar, files, clipboard, notifications |
| `app_tools/` | Schemas and handlers for the app-native tools |
| `bench_env/benchmark/` | The 215 tasks and `run.sh` |
| `bench_env/task/` | Task setup and the checkers |
| `docs/getting-started.md` | From a fresh clone to one finished task |

Open the phone to use the product. Open `bench_env/benchmark/` to score a model.

## 1. Start the phone

Node.js 22 or newer. This is the only command the phone needs. Leave the terminal running and open <http://127.0.0.1:3000>.

```bash
git clone https://github.com/OpenMobile2/MobileGym-plusplus.git
cd MobileGym-plusplus
zsh scripts/start_phone.sh
```

The script installs Node packages on the first run and loads wallpapers from `https://cdn.mobilegym.dev`, the same host as the hosted phone. The 215 tasks do not need map, weather, or assistant keys.

## 2. Score your model

Python 3.11 or newer. In a second terminal, at the repository root, install the checker once:

```bash
python3 -m pip install -r bench_env/requirements.txt
python3 -m playwright install chromium
```

Then point it at the phone and at your OpenAI-compatible endpoint:

```bash
zsh bench_env/benchmark/run.sh \
  --mode hybrid \
  --env-url http://127.0.0.1:3000 \
  --model-base-url http://HOST:PORT/v1 \
  --model-name YourModel \
  --model-api-key "$OPENAI_API_KEY" \
  --output-dir runs/bench-hybrid
```

`--mode gui_only` uses the same 215 tasks and the same checkers, with the app-native tools turned off. With the default protocol the script runs `qwen35_session`: the system prompt and the task are sent once, `tools` stays `mobile_use`, and the last 3 screenshots are kept. Inside that protocol the model name selects the adapter: Qwen, Gemini, Kimi K3, DeepSeek, or GLM. The run writes `results.jsonl` and `summary.json`. For many parallel episodes, use `scripts/server/start_nginx_gateway.sh` as described in [`docs/getting-started.md`](docs/getting-started.md). The Vite server above is one process.

## License

Code is Apache 2.0 ([`LICENSE`](LICENSE)). Data terms, the third-party disclaimer, and notices are in [`LICENSE-DATA`](LICENSE-DATA), [`DISCLAIMER.md`](DISCLAIMER.md), and [`NOTICE`](NOTICE). The simulated apps are research targets. They are not the products they are named after, and this project is not affiliated with those companies.
