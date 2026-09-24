# 淘宝闪购(tbsg)验收清单

> spec:`docs/elema-replication/spec.json` v1.0.2(frozen)。
> 机器 gate 全绿记录:2026-07-08,详见 `docs/elema-replication/05-gate-report.md`。

## 机器 gate(六道,全绿)

| # | Gate | 结果 |
|---|------|------|
| 1 | coverage(spec↔declaration↔code)`assets/validate_coverage.py --code` | 114 transitions + 191 actions,100% |
| 2 | `node scripts/build_nav_artifacts.mjs TaobaoShangou` | 0 ERROR;fromMismatch/unused/missing=0;148/148 任务可达 |
| 3 | `npx tsc --noEmit` | 0 错误 |
| 4 | eslint + `tools/lint_binding_override.py` | 0 违规 |
| 5 | 运行时走查 `assets/runtime_walkthrough.py`(P0 状态断言+返回可达性 §11) | **31/31 PASS**,console 零错误 |
| 6 | 视觉比对 `assets/gen_visual_diff.py` | 45/45 页拼图 → `docs/elema-replication/visual-diff/index.html` |
| + | 合同爬虫 `tools/contract_crawler.py --app tbsg` | 60 绑定,0 可疑(10 误报复核入 baseline),0 运行时错误 |

## 走查断言覆盖(W1–W16 + W-BACK)

点单全流程(频道领券/进店/单规格+SKU加购/必选品/满起送/选券联动/支付) · 订单状态机自动推进(备餐→配送→送达,75s/时序) · 取消+极速退 · 退款全链路(原因→表单→进度→refunded) · 评价(+吃货豆) · 多店拆单(qa:Q7) · 待支付(收银台×,qa:R4) · 自取(qa:Q8) · 地址新增 · 聊天自动回复(qa:Q9) · 返回可达性(连按返回回 tab 根,无环)

## 可见性清单 V1–V11

- [x] V1 顶栏不被状态栏遮挡(AppShell h-10 安全区)
- [x] V2 返回按钮有效(全部 bindBack;W-BACK 断言)
- [x] V3 图片真实内容(307 张生图:223 菜品/51 logo/13 头像/14 金刚区/6 banner,AppImg 占位回落)
- [x] V4/V5 主列表与内容页有数据(51 店/484 商品/305 评价/8 预置订单)
- [x] V6 5 个 tab 均可切换(走查覆盖)
- [x] V7 P0 链路跑通(31/31)
- [x] V8 图标(manifest SVG 橙底购物袋闪电,非默认方块)
- [x] V9 顶栏色(浅色顶栏+statusBarForeground dark;客服页 data-status-bar-foreground=light)
- [x] V10 双语(切 en:Home/Coupons/Messages/Cart/Me、All/In Progress/To Review/Refunds、Review/Order Again 等跟随)
- [x] V11 种子数据多样(51 店 24 品类,价格/月售/满减/评分各异;233 个多规格商品)

## 已知限制(wontfix 呈现均按铁律①给 toast)

- 深层长尾文案(状态词/部分卡片标题)双语覆盖到 P0 链路为主,数据层(店名/商品名)保持中文
- 金刚区第二页 4 个入口、买药频道子模块、金融/开发票/电话/分享等按冻结范围 toast「该功能暂未开放」
- 数据重置:递增 `constants.ts` DATA_VERSION 后刷新即恢复种子数据
