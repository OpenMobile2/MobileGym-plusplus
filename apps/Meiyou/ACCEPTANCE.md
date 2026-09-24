# 美柚(Meiyou)验收清单

> 阶段⑤ 自验收记录 | 2026-07-14 | spec v1.0(冻结)
> 六道机器 gate + 保真四要素 + 三条铁律 自检结果。

## 机器 gate(全绿才交付)

| # | Gate | 命令 | 结果 |
|---|------|------|------|
| 1 | 类型检查 | `npx tsc --noEmit` | ✅ Meiyou 0 错 |
| 2 | 导航一致性 | `node scripts/check_navigation_declaration_consistency.mjs Meiyou --actions` | ✅ exit 0;schemaErrors 0 / fromMismatch 0 / invalidBase 0 / missing 0 |
| 3 | 导航产物 | `node scripts/build_nav_artifacts.mjs Meiyou` | ✅ 无 ERROR,生成 nav graph |
| 4 | ESLint(禁 Date.now/new Date) | `npx eslint apps/Meiyou` | ✅ 0 error(1 exhaustive-deps warn) |
| 5 | 绑定覆盖 lint | `python3 tools/lint_binding_override.py trial_apps/mobilegym/apps/Meiyou` | ✅ 无违规 |
| 5 | store getter lint | `node scripts/lint_store_getters.mjs Meiyou` | ✅ 无反模式 |
| 6 | 运行时走查 | `python3 apps/Meiyou/assets/runtime_walkthrough.py` | ✅ 24/24 通过,console 错误 0,含返回可达性断言 |
| 7 | 合同爬虫粗筛 | `python3 tools/contract_crawler.py --app meiyou --baseline docs/meiyou-replication/crawler-baseline.json` | ✅ 96 绑定,可疑 0,运行时错误 0 |
| 8 | 视觉比对 | `python3 apps/Meiyou/assets/visual_diff.py` | ✅ 19/19 页截图,渲染错误 0,index.html 生成 |

## 运行时走查覆盖的 P0 状态断言(runtime_walkthrough.py)

- W1 帖子详情打开 + 点赞写入 likedPostIds
- W2 记录行→流量弹层→确定,写入 dayRecords + analysisBadge+
- W3 月经走喽「是」→选结束日期→确定,periods 末段 end 更新
- W4 圈子加入/退出,joinedCircles 变化(+我页宫格联动)
- W5 发帖→posts+1 + publishBanner
- W6 美柚姐姐 AI 推荐问题→aiSessions messages 增长(打字机)
- W7 经期设置改周期长度→cycle.cycleLen 变化(预测联动)
- W8 备孕模式开启 mode=prep,再切回 mode=period
- **返回可达性(pipeline §11)**:帖子详情/今日密报/设置深层连续 back 均回到 tab 根,URL 签名序列无环

## 保真四要素(pipeline §10)

| # | 要素 | 状态 |
|---|------|------|
| V8 | 图标(A1) | ✅ 粉底白花瓣 SVG,非默认方块 |
| V9 | 顶栏色(A2) | ✅ 浅色顶栏 `statusBarForeground:'dark'`,时间/信号清晰 |
| V10 | 中英双语 | ✅ 导航/Tab/主按钮/空态接 useAppStrings(strings + strings.en) |
| V11 | 种子数据多样 | ✅ 14 帖(不同用户/身份/圈子/时间/图文)+ 5 圈子 + 评论楼中楼 + 通知;周期数据按真机还原 |

## 三条铁律

- **① 可见即可点**:全部可交互元素带 data-action/data-trigger;wontfix 项统一 toast「该功能暂未开放」(见 crawler-baseline.json 21 项),无静默死区。
- **② 同组一致**:我页服务宫格/功能卡全部统一 toast;记录行全部可点开弹层。
- **③ 宁可不做不做错**:怀孕/育儿模式、柚子街、领券等未实现项一律 toast,不做错误行为。

## 已知取舍(wontfix,阶段⑥可讨论升级)

- 怀孕/育儿模式:仅 toast(经期+备孕两模式完整)。
- 柚子街/商城/会员开通/签到/领惊喜/创作者中心等:入口保留,toast「暂未开放」。
- 便便折叠项(形状/量/用时)、体重秤连接、自定义症状:toast。
- 数据重置:改 `constants.ts` DATA_VERSION 即清 localStorage 重载 defaults。

## 交付物

- App:`trial_apps/mobilegym/apps/Meiyou/`(launcher 可见「美柚」,点开即用)
- 视觉比对:`docs/meiyou-replication/visual-diff/index.html`(模拟版 vs 真机逐页)
- 审核页:`docs/meiyou-replication/review.html`
- gate 脚本:`apps/Meiyou/assets/runtime_walkthrough.py` / `visual_diff.py` / `regen_defaults.py` / `gen_images.py` / `validate_coverage.py`
