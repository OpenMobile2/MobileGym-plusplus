# 番茄ToDo 复刻 · 验收清单(ACCEPTANCE)

> spec: `docs/fanqietodo-replication/spec.json` v1.2.0(阶段⑥走查第2轮订正后) | 更新:2026-07-07
> 机器 gate 全绿。阶段⑥ 人工走查 第1轮(33)+第2轮(23)+第3轮(5)+第4轮(gate4-feedback-v3.json,2)已逐条修复。

## 阶段⑥ 走查订正·第 4 轮(2026-07-07)
gate4-feedback-v3.json 2 条:**① launcher 图标「大图标里套小图标」** —— 根因是 OS 把组件图标画成「iconBackground 瓦片 + 55% 居中字形」,而我的 SVG 自带米白圆角底,于是米白方块套在蓝色瓦片里。修:`manifest.iconBackground` 改米白 #ECE7D3,`res/appIcon.tsx` 去掉自绘底、只留透明底番茄字形(充满 viewBox)。**② 默认「不休息」时休息完成页不自动返回** —— 根因 React.StrictMode 挂载期双调用 effect,`returnedRef` 守卫把定时器吞掉;改为无 ref 守卫的 effect(done→1 秒后 back)。已实测:不休息时到达「专注已完成」后自动回待办。

## 阶段⑥ 走查订正·第 3 轮(2026-07-07)
gate4-feedback-v2.json 5 条(核心:今天日期错):**修正「今天」为模拟系统当天(2026-07-07,与锁机页一致)**,不再硬编码 7-6 —— `utils/appTime.ts` 的 APP_TODAY 改为取 `TimeService.getDate()`,种子记录用 `toToday()` 搬到今天(DATA_VERSION 3→4);打卡卡日期/时间轴「今」跳转/统计「当日专注」全部随之变正确;时间轴标题与天数按当月动态。休息完成页停留 1 秒后自动返回(1.4s→1.0s)。**launcher 图标按真机参考图(added/…_115)重绘为米白底+低多边形红番茄+绿蒂+柔和投影**(去掉蓝底与对勾)。

## 机器 gate 结果

| Gate | 命令 | 结果 |
|------|------|------|
| 覆盖率(转换) | `node scripts/build_nav_artifacts.mjs FanqieTodo` | **41/41 used, 0 unused, 0 fromMismatch** ✅ |
| 覆盖率(动作) | 同上 | **129/129 used, 0 unused, 0 schemaError** ✅ |
| 类型检查 | `npx tsc --noEmit` | **0 errors** ✅ |
| Lint(禁 Date.now/new Date) | `npm run lint` / grep | **无违规** ✅ |
| 声明 schema | 同覆盖率 | base态`.base`✅ / 离散键✅ / 无多基态 ✅ |
| 运行时走查 | `node apps/FanqieTodo/assets/runtime_walkthrough.mjs` | **18/18 passed** ✅ |

## 阶段⑥ 走查订正·第 2 轮(spec v1.1.0 → v1.2.0,2026-07-07)
gate4-feedback-v1.json 23 条:删打卡卡滤镜/「分布图·时间轴」文字切换;打卡卡刷新→更换背景 toast、分享→分享 toast、日期=叙事今天(2026-07-06);时间轴工具栏专属 toast(总结/补记/分享/排序)+加号放大+「今」跳当天;种子/新建记录归到叙事今天(2026-07-06,`utils/appTime.ts` 的 APP_TODAY),时间轴按日期筛选正确;记录详情「修改记录」的 ✓/✕ 移到右上角;**倒计时归零自动进休息**、**休息结束自动回待办并提示「专注已完成」**、休息页布局字体对齐专注页、**休息/停止返回栈用 popTo 收起 → 返回直达待办**;**锁机到时自动「锁机结束」并返回**;未来倒计时可选目标日期(年月日步进);待办排序**真长按拖动**(PointerEvent);设置「自定义格言」→暂未开放;launcher 图标重绘(居中放大)。一处打卡卡 svg 图标(标注 pageSig 空)判定为 launcher 应用图标,已一并重绘。

## 阶段⑥ 走查订正·第 1 轮(spec v1.0.0 → v1.1.0,2026-07-07)
33 条标注全部处理:删除顶栏「鸿蒙权限」(待办/锁机)与专注顶部工具栏 5 项;新增养习惯频率(每天/每周/每月);开关加白色滑块;自习室 toast=「自习室功能尚未开放」;暂停真冻结计时+文案「已暂停」并删「您已自定义暂停时长」;停止按钮不再误跳「文档写作」(todoId 退回 activeFocus);自定义时长/默认休息时长弹分钟输入框;默认休息时长=10 分钟并真应用于休息倒计时;昵称/个性签名可改;默认昵称=番茄用户;时间轴按日期筛选记录(蓝底圆+没有专注记录)+可改记录名称/时长;统计饼图加图例;锁机进行中实时时钟+按时长显示时间段;休息完成后停止回待办。

运行时走查覆盖:5 tab 渲染、添加/快捷菜单/打卡弹窗、P0 专注链路(activeFocus 写入→专注页→休息页→记录+1)、不计时打卡(完成次数+1)、**返回可达性(回到 tab 根 + URL 无环)**、**零 console/pageerror**。

## 可见性清单(V1–V11)

| # | 项目 | 结果 |
|---|------|------|
| V1 | 顶栏不被状态栏遮挡 | ✅ 各页 `pt-10` 安全区 |
| V2 | 返回按钮/系统返回有效 | ✅ 走查返回可达性通过;返回用 `bindBack` |
| V3 | 关键图片为真实内容 | ✅ 6 张待办卡背景 + 专注/打卡背景 + 头像(生图 PNG) |
| V4 | 主列表 ≥ 3 条真实数据 | ✅ 6 条种子待办 |
| V5 | 内容页有数据 | ✅ 时间轴 4 条记录、统计饼图/累计数据 |
| V6 | Tab 切换正常 | ✅ 5 个 tab 均渲染 |
| V7 | P0 链路跑通 | ✅ 待办→专注→休息→记录;不计时打卡;锁机 |
| V8 | launcher 有 App 图标 | ✅ 番茄蓝底 + 待办勾选 + 番茄(`res/appIcon.tsx`) |
| V9 | 顶栏色明暗对应 | ✅ 待办/我的深色顶栏→`statusBarForeground:light`;锁机/统计/时间轴/设置浅色顶栏→页面内 `data-status-bar-foreground="dark"` |
| V10 | 中英双语跟随系统语言 | ✅ 已接 `os/useLocale` + `i18n`(导航/Tab/主按钮/空态);切系统语言即中↔英 |
| V11 | 种子数据 ≥5 且多样 | ✅ 6 条待办:普通/习惯/定目标 × 倒计时/正向/不计时,背景/次数各异 |

## 保真四要素(pipeline §10)
- **外观**:图标 + 顶栏色明暗对应 + 色值取自真机(design-tokens.md);
- **双语**:接 useLocale,跟随 OS 语言;
- **数据分层**:构建时种子(defaults.json ≥5 多样)+ 运行时写入(store action,刷新不丢);
- **协作**:工作在 chennuo 分支。

## 已知取舍(wontfix,按铁律①给 toast「该功能暂未开放」)
自习室/许愿墙、鸿蒙权限、VIP/备份/云同步/连接电脑、桌面小组件、定时锁机/提升强制性/海报外观/自定义底栏/主题色/分享导出等——均在 spec 冻结时确认放弃,入口点击给提示,无静默死区。

## 复现命令
```bash
cd trial_apps/mobilegym
npm run dev                                             # http://127.0.0.1:3000(用 openApp('fanqietodo'))
python apps/FanqieTodo/data/regen_defaults.py           # 重建种子
python apps/FanqieTodo/assets/gen_nav_declaration.py    # 从 spec 重生成导航声明
python apps/FanqieTodo/assets/gen_assets.py             # 批量生图(需 IMAGE_GEN_API_KEY)
node scripts/build_nav_artifacts.mjs FanqieTodo         # 覆盖率 gate
node apps/FanqieTodo/assets/runtime_walkthrough.mjs     # 运行时走查(仅断言,不再产出截图)
```
