# 去哪儿旅行复刻 · 阶段⑤交付状态

## 已完成

- 63 个 spec 页面全部实现并注册路由。
- 127 个可执行交互全部具有 `transitionId` / `actionId`、导航声明和代码绑定。
- 交互已绑到真实可见控件；已移除「可用操作」脚手架列表。
- 首页金刚区按真机锚点还原为「左三大彩卡 + 右 3×3 小入口」。
- 五栏 Tab：首页、行程、客服、看世界、我的。
- 机票、酒店、火车票、门票四条 P0 预订主链。
- 收银台、支付成功、订单生成与订单详情。
- 搜索、日历、城市/乘客选择、订单中心、个人中心、登录、客服、旅行内容。
- 民宿、海外酒店、租车、接送机、度假/跟团等扩展频道。
- 使用 `TimeService` 和确定性序列生成状态，不使用 `Date.now()`、`new Date()`、`Math.random()`。
- 主列表种子数据均不少于 5 条，图片加载失败有 SVG fallback。
- manifest 图标、主题、360 设计宽度、状态栏前景色与中英字符串资源。

## 批量生图（§5.3）

- 模式：按 pipeline §5.3 调用项目 `tools/image_gen_client.py`，4 路并发、可断点重跑。
- Prompt：仅描述合成酒店、景点、旅拍、民宿、车辆、线路与客服头像；未上传真机截图或录屏。
- 最终资产：34 张 PNG，位于 `assets/images/`（hotel/scenic/world/homestay/car/tour/avatar）。
- 完整 prompt 集保存在 `assets/gen_travel_images.py`。

## Gate 结果（本轮复核）

```text
coverage:        127/127 = 100%
routes:          63/63
transitions:     86/86
actions:         41/41
reachable:       41/41 action tasks
seed validation: PASS
runtime walkthrough: 14/14 PASS，console/page error 0
visual screenshots:  17/17 PASS
A-1 空回调:      clean
A-3 Math.random id: clean
```

## 运行时与视觉验收

- 四条预订链均到达收银台；机票支付生成订单。
- 深页连续返回：7 步回到 Tab 根页，无循环。
- 退出与重新登录 state：PASS。
- 视觉对照页：`docs/qunaer-replication/visual-diff/index.html`。

详见 `docs/qunaer-replication/04-p0-walkthrough.md`。

## 请你进入阶段⑥

1. 浏览器打开模拟器（本机已有 `http://127.0.0.1:3017` 或当前 dev 端口），打开去哪儿旅行。
2. 按真 App 习惯走一遍 P0 流程；对照 `docs/qunaer-replication/visual-diff/index.html` 看视觉差异。
3. 用 `tools/feedback_overlay.js` 标注问题，导出到  
   `docs/qunaer-replication/gate4-feedback-<日期>.json`，把路径发我。
