# 菜鸟(Cainiao)验收清单

> spec: `docs/cainiao-replication/spec.json`(frozen v1.1.0);完工报告: `docs/cainiao-replication/05-build-report.md`;阶段⑥走查修订: `docs/cainiao-replication/06-gate4-report.md` / `06-gate4-report-0731.md`

## 机器 gate(阶段⑥ 0731 修订后全绿)

| Gate | 结果 |
|------|------|
| `node scripts/build_nav_artifacts.mjs Cainiao` | 31 routes / 76 transitions / 142 actions,0 ERROR |
| `npx eslint apps/Cainiao` | 0 错误 |
| `node scripts/lint_store_getters.mjs Cainiao` | ✅ |
| 静态自检 A-1 空回调 | 0 |
| `python apps/Cainiao/assets/gen_assets.py` | 22/22 齐 |
| 运行时走查 `node apps/Cainiao/assets/runtime_walkthrough.mjs` | **57/57 PASS** |

## 阶段⑥ 走查修复(gate4-feedback-0731.json,15 项)

详见 `docs/cainiao-replication/06-gate4-report-0731.md`。要点:一键开柜两步弹窗、近日签收模块、FAQ 快捷答、寄件顶 Tab 横排+暂未开放、完成度 100%、种子时间钳制。**DATA_VERSION 2→3**,复查前请硬刷新。

## 阶段⑥ 走查修复(gate4-feedback-0717.json,18 项)

- 全量数据脱敏:姓名/电话/地址/商品名/单号/取件码全部虚构;包裹扩至 16 个,覆盖全部筛选维度(类型/所属/物流/交易/8 家快递公司),搜索链路同步校验。
- 交互修复:包裹详情顶栏补安全区+修「已已揽件」文案;搜索/筛选进入清空;首页「点击领取」→我的权益、「免费领取」/瀑布流→toast;导入设置快手改已授权;购物券横滑补全+刷新重置领取态;服务页订单横滑补足溢出;购物订单真实搜索;寄件顶 Tab「寄件」选中样式统一;寄件默认无寄件人(点地址簿选);柜机卡点选回填;包裹签收/寄件同步包裹消息。
- **DATA_VERSION 1→2**:数据结构变更,持久化状态自动重置(用户浏览器需刷新一次以加载新种子)。

## 可见性清单(V1–V11)

- V1 顶栏不被状态栏遮挡 ✅(TopBar pt-10;走查后修复过一轮)
- V2 返回有效 ✅(back-reachability 断言)
- V3/V4/V5 图片真实、列表有数据 ✅(22 张生图资产;包裹 8 条/地址 3 条/券 7 张/消息 13 条)
- V6 Tab 切换 ✅ V7 P0 链路 ✅(取件/寄件下单/取消/地址新建/领券/确认收货)
- V8 图标 ✅(蓝瓦片+白色小鸟字形) V9 顶栏色对应 ✅(蓝底 light/白底 dark 按页声明)
- V10 双语 ✅(导航/Tab/主按钮/空态,走查断言) V11 种子多样 ✅

## P0 用例(走查自动断言)

1. 取包裹:首页/取包裹页「确认已取」(确认弹窗)→ 待取件→已签收,计数联动
2. 寄件:选收件人→物品信息(类型/重量/体积)→上门时间(点选即关)→交件方式(回填,切方式清空)→三种寄件方式切换(运费联动)→立即下单(无成功页直达详情,状态 待上门取件)
3. 取消寄件:原因单选(信息填错了→内联装饰引导)→确认取消→已取消(操作栏仅剩客服)→列表「已取消」Tab+删除(确认弹窗)
4. 新增地址:表单+省市区(热门城市/逐级列表)+标签(两组不互斥)→保存
5. 消息:进入频道未读清零;包裹通知→包裹详情
6. 购物券:领券→红包+1+按钮变去购买;购物订单:确认收货(确认弹窗)→交易成功

## 已知说明

- 平台键盘行为:键盘弹起时第一次点击被「收起键盘」吞掉(OS 级,所有 app 一致),非本 app缺陷。
- 3 处纯装饰无反应(首页广告横幅/瀑布流、包裹详情低价寄件横幅、取消页内联修改订单)= 用户阶段④拍板(spec scope.decorOnly)。
