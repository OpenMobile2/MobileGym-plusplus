# 猫眼(Maoyan)验收清单(Playbook §8)

> spec: `docs/maoyan-replication/spec.json` v1.0.1(v1.0.0 冻结 + 实现期非行为修订,见 changelog)
> 日期:2026-07-13 | 全部机器 gate 结果如下,阶段⑥人工走查按此复核。

## 机器 gate 结果(阶段⑤ 六道 + 静态自检)

| gate | 结果 |
|---|---|
| 1. coverage(spec↔declaration↔代码) | ✅ 128/128 = 100%(`assets/validate_coverage.py`) |
| 2. `build_nav_artifacts.mjs Maoyan` | ✅ 71/71 转换、92/92 动作,0 ERROR 0 mismatch;WARN:10 个 tab uiState 节点在 schema 图中"不可达"——tab 由 select action 切换(URL 变化),分析器只追 transition,属已知信息性告警 |
| 3. `npx tsc --noEmit` | ✅ 0 错误 |
| 4. `npm run lint` + `lint_store_getters` + `tools/lint_binding_override.py` | ✅ Maoyan 零违规(无 Date.now/new Date/touch事件/绑定覆盖/store getter) |
| 5. 运行时走查(`assets/runtime_walkthrough.py`) | ✅ **58/58**,console/pageerror 零;含 select/tab 前后不等断言 ×10、返回可达性断言 ×4(§11) |
| 6. 视觉比对(`assets/visual_diff.py`) | ✅ 36 页截图零 console 错误 → `docs/maoyan-replication/visual-diff/index.html` |
| 静态自检 A-1 空回调 | ✅ 0 命中 |
| 静态自检 A-2 toast-only 假回调 | ✅ 0 可疑(所有 toast 均为铁律① wontfix 反馈或输入校验提示) |
| 静态自检 A-3 Math.random 拼 id | ✅ 0 命中(取票码/座位图均确定性派生) |
| 渠道④ 合同爬虫 | ✅ 覆盖 48 绑定,1 误报入 baseline(选中态日期tab再点击,单点复现联动正常),0 真 bug |

## 走查实战抓获并修复(已固化为回归断言)

1. **button 嵌套 button**(列表行内 PillBtn)→ React DOM 违规 console error;改 span+role,console 清零。
2. **虚拟键盘吞首击**:输入聚焦态下点击保存无效——确认为平台标准行为(首击收键盘),非 app bug;走查脚本统一先收键盘。

## 可见性清单 V1–V11

- [x] V1 顶栏不被状态栏遮挡(AppShell h-10 安全区)
- [x] V2 返回全部 bindBack,返回可达性断言 4 条通过(深页 ≤1 步回 Tab 根)
- [x] V3 关键图片为生成位图(59/62 张;`avatar_8/avatar_9/poster_spiderman` 网关限流未出,SVG 占位,重跑 `gen_item_images.py` 可补)
- [x] V4/V5 首页 8+8 部影片、8 演出、8 影院、576 场次、12 短评、6 历史订单、7 券、8 玩乐商户,内容各异(§10.3)
- [x] V6 五格 TabBar 全部可切换(演唱会·演出中间特型)
- [x] V7 P0 链路:购票(选座→协议→确认订单→收银台→出票→取票码)/评分(想看↔取消、看过→打分→发布→互斥)/搜索/演出下单/登录,runtime 走查全过
- [x] V8 launcher 图标:红底白猫眼 SVG(非默认方块)
- [x] V9 顶栏色:浅页 dark、红顶栏/详情沉浸页 light(逐页 data-status-bar-foreground)
- [x] V10 双语:切 OS 英文后 Tab/主按钮/空态跟随(Playwright 实测 Home/Me/Fun/No tickets yet)
- [x] V11 种子多样:主列表 ≥5 条且日期/价格/类型/状态各不相同

## 走查迭代(2026-08-10):真机 agent 反馈 7 项修复

| # | 问题 | 修复 | 回归断言 |
|---|---|---|---|
| 1 | 选座下单后回退到 `/order/confirm` 只剩「订单信息缺失」纯文本,**无任何可点元素**,agent 彻底被困 | 所有数据缺失早退一律换成 `RecoverPage`(顶栏返回 + 业务出口 + 回到首页);出票页【查看订单】带 `popTo` Tab 根,收起下单链历史 | W17a/W17b/W17d |
| 2 | 想看清单里的演出是纯展示,进不去订票 | 演出行可点进详情(`filmlog.show-open`),并直接给【预订】(`filmlog.show.book-open`) | W17e/W17f |
| 3 | 演出订单票券区照抄电影票「取电影票」 | 订单详情按 `order.kind` 分流:演出=入场二维码 + 凭证件入场 + 观演人 + 不支持退改;电影维持取票码 | W17g/W17h |
| 4 | 支付后停在支付页/出票中,没有跳转出口 | 收银台草稿失效不再展示 ¥0 假收银台;出票页无论订单是否生成都必有出口(查看订单/查看我的订单 + 回到首页) | W17c |
| 5 | 分享评价给微信好友提示「功能未开放」 | 分享卡渠道改为真实反馈(已分享到微信好友/朋友圈/QQ好友、已保存到相册),详情页右上分享改为打开分享卡(`detail.share-open`) | W6d/W6e |
| 6 | 演职人员每 3 部电影循环同一组,角色与影片对不上(动画片出现「饰:曹操」) | 重写 18 部影片卡司:9 位演职人员一人一脸(不再撞脸),角色按各片剧情重新分配;`ar_chenhaoyu` 头像与舒淇解绑 | W17i |
| 7 | 写完评价后热评入口仍写「写短评」,点进去其实是编辑 | 已评分时详情页/短评页/写评页统一显示「编辑短评」 | W6f |

> 复跑:`python apps/Maoyan/assets/runtime_walkthrough.py 3017` → **73/73 通过,console 错误 0**;
> `validate_coverage.py` 128/128;`build_nav_artifacts.mjs Maoyan` 79/79 转换、94/94 动作、0 ERROR/mismatch。
> `DATA_VERSION` 3→4(defaults.json 卡司数据变更)。

## 已知限缩(范围内决策,非缺陷)

- 商城/卖品下单、视频、社区、退改签真实流程、榜单页、影人深页等 = wontfix,一律 toast『该功能暂未开放』(铁律①③,同组一致)
- 演出下单到收银台支付为止(spec 冻结范围)
- 3 张装饰图暂为 SVG 占位(见 V3)
