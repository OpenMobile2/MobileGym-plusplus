# Hybrid Tools V6

`native` 是当前固定版 GUI + App Tools 评测集，共 75 条任务。它以
V5 的 76 条已审计任务为基础，保留原 Case ID，不重编号地删除 `Case45`，并修复
GUI-only 审查中确认的环境与 verifier 问题。

## V6 变更

1. 删除 `HTV5Case45`。该任务要求通过微信读书书页逐项读取推荐值；现有 mock
   GUI 没有稳定、完整地暴露 verifier 所需信息，GUI-only 合约不成立。
2. `Case11` 保持金额严格匹配，但交易对象接受支付宝界面可见的完整标签、昵称或
   括号内真实姓名。
3. `Case20` 仍要求消息包含完整标题内容，但忽略不影响标题语义的空格、标点和
   装饰性 emoji；“数据分析”之类的摘要不会通过。
4. `Case33` 仍要求最高评分和最近距离，但当原始距离在地图 GUI 中都显示为同一
   50m/0.1km 粒度时，接受任一同评分、同显示距离的候选。
5. `Case54` 在目标分钟为 `00` 时接受“11点开始”“上午11点”等自然整点表达，
   但不会把“11点30分”误判为 11:00。
6. `Case25` 明确把两个指定短语作为栏目标题，并将 Spotify 栏目改为“今天在听的歌”；
   完整的“今天听过且已点赞”歌曲交集和未点赞歌曲排除规则保持不变。
7. 天气 GUI 添加城市和 `weather__add_saved_city` 统一经过同一状态写入层：保存城市、
   选中城市、离线 bundle 三者一次完成；主页面、城市管理页、逐日预报页共享同一
   离线 fallback。新增南京后可立即继续 GUI 操作。
8. 支付宝账单、账单搜索和收支分析三个年月滚轮统一按真实 `scrollTop` 读值；打开
   时只初始化一次，确认时再次读取 DOM，避免滚到目标月份后被旧 React state 回弹。

天气和支付宝属于共享环境修复，不包含 benchmark 任务判断或答案注入。V1-V5、
MobileGym 官方 suite 的任务注册、setup 和 verifier 均未修改。

完整 75 条指令、来源和候选工具见 [TASK_CATALOG.md](TASK_CATALOG.md)。
变更边界与验证证据见 [V6_REPAIRS.md](V6_REPAIRS.md)。

## 列出任务

```bash
conda run -n mobilegym-bench python -m bench_env.hybrid_benchmark \
  --suite native --list
```

## 标准评测

GUI + Tools：

```bash
RUN_DIR="runs/hybrid-tools-v6-${MODEL_NAME}-75-par8-$(date +%Y%m%d-%H%M%S)"

env -u http_proxy -u https_proxy -u HTTP_PROXY -u HTTPS_PROXY \
  -u ALL_PROXY -u all_proxy \
conda run --no-capture-output -n mobilegym-bench python \
  -m bench_env.hybrid_benchmark \
  --suite native \
  --interaction-mode hybrid \
  --env-url http://127.0.0.1:4181 \
  --model-base-url "$MODEL_BASE_URL" \
  --model-api-key "$MODEL_API_KEY" \
  --model-name "$MODEL_NAME" \
  --parallel 8 --headless \
  --max-tokens 8192 --temperature 0 --top-p 1 \
  --output-dir "$RUN_DIR"
```

公平的 GUI-only 对照只把 `--interaction-mode hybrid` 改成
`--interaction-mode gui_only`，其余 task、setup、截图、动作协议和 verifier 相同。
GPT-5.4 仍需额外传 `--coord-space physical`；Gemini 保持默认 `norm_0_1000`。

## 验证

```bash
conda run -n mobilegym-bench python -m pytest -q \
  bench_env/tests/native \
  bench_env/tests/prior

npm test -- --run \
  tests/nativeEnvironment.contract.test.ts \
  tests/priorEnvironment.contract.test.ts

conda run -n mobilegym-bench python \
  -m bench_env.task.native.smoke \
  --env-url http://127.0.0.1:4181 --headless \
  --output runs/hybrid-tools-v6-smoke.json

conda run -n mobilegym-bench python \
  -m bench_env.task.native.boundary_smoke \
  --env-url http://127.0.0.1:4181 --headless \
  --output runs/hybrid-tools-v6-boundary-smoke.json
```
