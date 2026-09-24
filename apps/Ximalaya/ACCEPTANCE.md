# 喜马拉雅复刻 —— 验收清单(ACCEPTANCE)

> spec 冻结 v1.0.0(`docs/ximalaya-replication/spec.json`,47 节点/236 交互,P0 推断违规 0)
> 实现:`apps/Ximalaya/`,36 页面组件(播放器 10 弹层折进 `/player`)。

## 机器 Gate(全绿)

| Gate | 命令 | 结果 |
|------|------|------|
| 类型检查 | `npx tsc --noEmit` | ✅ apps/Ximalaya 0 错误 |
| ESLint(禁 Date.now/getter) | `npx eslint apps/Ximalaya` | ✅ 干净 |
| 导航一致性 + 图 + 动作任务 | `node scripts/build_nav_artifacts.mjs Ximalaya` | ✅ schemaErrors=0 / missingInDeclaration=0 / fromMismatches=0;transition 80/80、action 146/146 全部使用,unused=0 |
| 绑定覆盖 | `python tools/lint_binding_override.py apps/Ximalaya` | ✅ 无违规 |
| 生产构建 | `npm run build` | ✅ 通过,产出 XimalayaApp chunk(OS 自动注册) |

## 保真四要素(pipeline-v3 §10)

- [x] ① 外观:launcher 图标(红底白耳机);主色 `#FE4543` 取自真机;白底页 statusBar `dark`、播放/会员深色页 `light`(逐页 `data-status-bar-foreground` 声明);播放页动态主题色(每专辑封面取色 themeColor)。
- [x] ② 双语:`res/strings.ts` + `strings.en.ts` 经 `useXimalayaStrings`,导航/Tab/主按钮/空态跟随 OS 语言。
- [x] ③ 数据分层:`data/defaults.json`(Python 生成,10 专辑/60 集/10 主播,历史·本地·消息·会员·勋章·榜单每列 ≥5 条多样合成数据);运行时订阅/收藏/关注/点赞/评论/开通VIP 走 Zustand store 持久化,不回写 defaults。
- [x] ④ 三条铁律:可见即可点(占位统一 `wontfix()` toast「该功能暂未开放」,无静默死区);同组一致;宁可不做不要做错。

## 可见性清单(V1–V11,待人工走查确认)

| # | 项 | 状态 |
|---|----|------|
| V1 顶栏可见 | pt-10 安全区,每页 TopBar | 待走查 |
| V2 返回有效 | 子页 bindBack() | 待走查 |
| V3 图片显示 | Img 组件 + SVG 兜底(封面 PNG 待生图) | 待走查 |
| V4 主列表有数据 | 首页推荐 ≥10 专辑 | 待走查 |
| V5 内容页有数据 | 专辑/评论/历史/消息等 | 待走查 |
| V6 Tab 切换 | 首页/快听/会员/我的 + 中央播放 | 待走查 |
| V7 P0 链路 | 见下 | 待走查 |
| V8 图标存在 | manifest icon | ✅ |
| V9 顶栏色对应 | 逐页声明 | ✅ |
| V10 双语可切 | useAppStrings | ✅ |
| V11 种子多样 | 每列 ≥5 条多样 | ✅ |

## P0 链路(走查重点)

1. 首页续听卡 → 续播进播放页;中央按钮外环→播放页、内芯→切播放/暂停。
2. 播放页:封面/文稿切换、倍速/定时/音质/更多菜单(18 项)/播放列表/月票弹层、点赞/收藏、进度拖动、上下集、评论页(轻触评价/投票/时间戳跳转/发评论)。
3. 首页/搜索 → 专辑详情 → 订阅/开始播放/节目行播放/找相似;搜索一键播放第 1 集。
4. 我的 → 订阅(我收藏的声音听单)/历史/本地/已购/消息(子会话);编辑资料、勋章墙。
5. 会员开通页选套餐+支付方式 → 确认协议并开通 → 模拟开通成功(不真扣款)。
6. 更多菜单尾:驾驶模式/意见反馈/举报(10 原因)/版权申诉 真实页;连接外设/定时启播 弹窗。

## 已知降级(按铁律①占位)

录音直播/扫一扫/智能硬件/文档朗读器/创作中心/领红包/提现/AI荐书/问AI/签到积分抽奖/边听边看视频/橱窗电商/打赏/第三方分享落地/真实收银台 —— 统一 `wontfix()` toast 或模拟态。

## 待办

- [ ] 生图封面:用户将 key 放入 `assets/.imgkey`(gitignored)后,`python assets/gen_covers.py` 批量生成 10 张(§5.3),当前 SVG 兜底。
- [ ] 阶段⑥ 人工走查(模拟器 `npm run dev` → 打开喜马拉雅,逐条核对 V1–V7 与 P0 链路,标注 错/漏)。
