# Taobao 验收清单

> spec 来源:`docs/taobao-replication/spec.json` v1.0.2(Gate2 人工审阅通过后冻结,实现期 3 次 id 归并/合规化重命名,语义未变,见 changelog)
> 日期:2026-06-10

## 机器 Gate(阶段 3,已全部通过)

| Gate | 结果 |
|------|------|
| coverage 校验器(spec ↔ declaration ↔ 代码 data-* 三方比对) | ✅ 120/120 = 100% |
| `build_nav_artifacts.mjs Taobao` transitions | ✅ 0 ERROR(46/46 声明=使用,1 个 WARN:`pay.success-open` 为 go() 编程式跳转,无 UI 触发点,合理) |
| `build_nav_artifacts.mjs Taobao` actions 合同 | ✅ 0 ERROR(78/78,命名/段数/select格式/input value 全合规) |
| `npx tsc --noEmit` | ✅ 0 错误 |
| `npx eslint apps/Taobao` | ✅ 0 问题(无 Date.now/new Date,全 TimeService) |
| `npm run build` | ✅ 通过 |

## 体量

29 路由 / 46 transitions / 78 actions / 28 页面组件 + 5 共享组件;
种子数据:18 商品 / 6 店铺 / 5 地址 / 5 订单(全状态)+ 1 退款 / 4 会话 / 6 券,全部合成,无真实个人信息。

## 待 Gate 4(人工/模拟器验收)

- [ ] V1-V7 可见性清单(Playbook §8.2)
- [ ] P0 链路走查:搜索→详情→SKU→加购→购物车勾选→结算→支付(模拟)→订单→确认收货→售后→评价
- [ ] 视觉回归:Playwright 截图 vs 真实截图并排比对(工具待建,pipeline 阶段3 第4步)
- [ ] inferred 页面实测:支付成功页、退款表单(Gate2 审阅时人无法判断的 8 条)
- [ ] 数据重置测试:DATA_VERSION 1→2 后刷新,确认重载 defaults.json

## 已知技术债

| 项 | 说明 |
|----|------|
| i18n | 文案直接内联中文,未走 res/strings.ts + useAppStrings(AGENTS i18n 合同);批量迁移留待 v1.1 |
| 首页非推荐频道 | 静态轻实现(spec wontfix 决策) |
| 店铺更多面板各入口 | toast 占位(P2) |
| 二楼下拉手势 | wontfix,以入口条替代 |

## 迭代 #2 backlog(用户走查发现,2026-06-11)

- [ ] 购物车左滑按钮组补全:真实为 5 键(更多/移入收藏/加入分组/找同款/删除),当前仅 3 键,
      「加入分组」「找同款」缺(spec 1.1.0 标记 P2 浅实现,需升级为完整实现或调整宽度还原 5 键视觉)
- [ ] 收藏夹左滑/长按菜单的完整按钮组核对
- [ ] 其余见 03-interaction-matrix.md 的 ⬜ 项

## 运行时走查 gate(2026-06-11 起为必跑项)

`python apps/Taobao/assets/runtime_walkthrough.py`(模拟器在 :3000)
当前 8 断言:详情+足迹 / SKU加购 / 详情→购物车 / 左滑删除 / 左滑移收藏 / 管理删除 / 搜索留痕 / 清未读。
**新交互合入时同步加断言**;本 gate 实战抓到 onClick覆盖、pointer capture 吞 click 两个静态全绿的真 bug。
