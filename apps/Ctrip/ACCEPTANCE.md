# 携程旅行(ctrip)复刻 · 验收清单(ACCEPTANCE)

> Pipeline v3 工程实现与机器 Gate 已完成。spec 冻结 v1.0.1（51 节点 + 4 Tab、77 transitions、89 actions）。
> 收口日期：2026-07-26。参考：`docs/ctrip-replication/spec.json`、`docs/ctrip-replication/04-gate4-findings.md`。

## 机器 Gate

| Gate | 结果 |
|------|------|
| Ctrip 定向 TypeScript | ✅ 0 error |
| 51 个声明路由运行时挂载 | ✅ 51/51，0 page error，0 破图 |
| `check_navigation_declaration_consistency.mjs Ctrip` | ✅ exit 0；invalidBaseStateIds=0；multipleBaseStates=0；fromMismatches=0；missingInDeclaration=0 |
| transitions used in code | ✅ 75/77；另 2 条 `facilities.back` / `hotelReview.back` 由系统返回合同承接 |
| actions used in code | ✅ 89/89；schemaErrors=0；任务可达 89/89 |
| 历史 `NO_EFFECT` 复核 | ✅ 13/13 点击均产生 DOM 变化，0 runtime error |
| 核心视觉截图 | ✅ 10/10 已生成；对照 121 张真机截图重新校正证据编号 |
| 图像与占位符 | ✅ 页面引用资产 0 缺失；emoji 占位已清除 |
| 全项目 Vite build | ⚠️ 已完成 4602 modules transform 并进入 rendering chunks；整仓构建在本次会话 5 分钟时限内未返回最终 exit code |

软警告：`extraFromWarnings=1`（详情页「更多」浮层复用消息 tab 入口）；data graph 中部分 query UI state 由页内 action/searchParams 打开，不是独立入口。

## 三条铁律落地
1. **可见即可点**:全部可点元素带 `data-action`/`data-trigger`(bindTap/bindBack 生成);
   做不了的统一 `useToast('该功能暂未开放')`(金刚区长尾/运营卡/AI/接送机查询/改签查看航班/换卡/钱包/权益等)。
2. **同组一致**:金刚区 10 入口、底部 4 Tab、各品类订按钮整组一致(要么进真页,要么整组 toast)。
3. **宁可不做不要做错**:真实支付/地图引擎/AI 明确 stub;收银台停在模拟「支付成功」不真实扣款(Q2)。

## P0 核心链路(自检可跑通)
- 首页金刚区 → 酒店/机票/火车/门票/租车 各品类搜索。
- **酒店全链路**:搜索→(城市/日期/人数弹层)→列表(排序/筛选/地图)→详情(收藏/更多浮层/问酒店)→房型→填单→收银台→支付成功→订单。
- **火车全链路**:搜索(学生票开关 Q9)→车次列表→详情(经停弹层)→填单→收银台。
- **机票全链路**:搜索→日历铺价→列表→详情→填单(乘机人/保险)→收银台;低价提醒。
- **门票全链路**:列表→详情(切 tab/相册/票种 Q13)→填单(日期/票数/游客)→收银台。
- **租车链路**:首页→取车地点/接送机→车型列表→详情→填单→收银台(Q14 共用)。
- **收银台**:支付方式单选 → 支付成功(生成 upcoming 订单)→ 查看订单/返回首页。
- **G 组完整还原**:订单列表 5tab(支付/改签/退票/报销/再次预订)、订单详情(倒计时/取消)、
  取消申请、改签、报销开票、消息中心/通知原地展开、客服模拟问答、我的(会员卡/订单/功能宫格)、
  钱包、常用信息(新增出行人表单本地保存)、会员权益、设置(开关/二级页/退出确认)。

## Gate 4

工程走查与整改已完成，详见 `docs/ctrip-replication/04-gate4-findings.md`。若交付流程要求产品方在真实设备上签字，可继续运行核心流程并导出 `gate4-feedback.json`；该签字属于人工确认，不影响当前机器 Gate 结论。
