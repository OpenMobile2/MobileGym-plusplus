# 小日常(Xiaorichang)复刻 · 验收清单(ACCEPTANCE)

> spec: `docs/xiaorichang-replication/spec.json` **v1.4.0**(习惯创建与情境数据一致性修复)| 更新:2026-07-22
> 61 节点 / 469 交互 / 20 inferred / P0-inferred **0 条**。机器 gate 全绿。

## 机器 gate 结果

| Gate | 命令 | 结果 |
|------|------|------|
| 覆盖率(转换) | `node scripts/build_nav_artifacts.mjs Xiaorichang` | **113/113 used, 0 unused, 0 fromMismatch** ✅ |
| 覆盖率(动作) | 同上 | **295/295 declared, 0 missingInDeclaration, 0 schemaError** ✅ |
| 类型检查 | `npx tsc --noEmit` | **0 errors** ✅ |
| Lint(禁 `Date.now` / `new Date`) | `npx eslint apps/Xiaorichang` | **0 违规** ✅ |
| Store getter 反模式 | `node scripts/lint_store_getters.mjs Xiaorichang` | **无** ✅ |
| 运行时走查 | `node apps/Xiaorichang/assets/runtime_walkthrough.mjs` | **59/59 passed, 零 console/pageerror** ✅ |

> 声明产物由 `apps/Xiaorichang/assets/gen_nav_declaration.py` 从**冻结的 spec** 编译而来,
> 脚本内置覆盖率自检(spec 的每个 transitionId/actionId 必须落进声明,漏一条 exit 1),
> 且 `frozen != true` 时拒绝生成。**改交互必须先改 spec 再重跑,不得直接改生成物。**

## 运行时走查覆盖什么

5 tab 渲染;P0 打卡三态计分(完成 `+reward` / 失败 `−reward` / 待定 `0`);
日历点空格 = 就地补打卡且不弹层;专注 <1 分钟作废不写记录;
返回可达性(深页连续 back 回 tab 根 + 签名序列无环);零 console/pageerror。

外加 **Gate4 每条人工标注 → 一条回归断言**(见下)。其中三条值得单独说:

v1.4 另补完整交互回归:新建习惯填写名称/情境/每周 N 天 → 图标页往返 → 新增提醒 → 创建落库;
新建习惯组 → 多选两个成员 → 保存名称与时段;删除该习惯所在情境后校验全部习惯仍有有效情境。

- **升级路径**(`G4b-3`):往 localStorage 塞一份 `_dataVersion` 过期的旧存档,断言迁移钩子把它重置。
  走查每次开全新浏览器,天然盖不到「装过旧版的用户」——这是机器 gate 的结构性盲区,补上了。
- **坑一同型**(`G5-1b` / `G5-2b`):个性化的「版式」「边框」改的是选中态,断言今日页
  `gridTemplateColumns` 与图标 `border-radius` **必须真的跟着变**。
- **不存在的组合**(`G5-3e`):「天」档只属于番茄专注域,切回习惯打卡时 range 必须重置。

## 阶段⑥ 走查订正记录

### 第 3 轮(spec v1.2.0 → v1.3.0)— 补拍 s257/s258/s259
三个长期缺口全部关闭:**① 统计 → 番茄专注 tab**(从阶段② 的 A3 缺口挂到现在)内容确证,
并发现该域范围分段有**四档**(天/周/月/年,默认「天」),而习惯打卡域只有三档 —— 切域必须重置 range。
**② 个性化 → 边框** = 首页习惯图标形状(圆形/圆角矩形)。**③ 个性化 → 版式** = 首页网格密度(3/4/5 列)。
②③ 直接驱动 `today.main` 渲染,不是装饰。至此**全 App 无死占位**。

### 第 2 轮(spec v1.1.0 → v1.2.0)— gate4-feedback-v2.json + R4 录屏
**R4 录屏解开了 onetap 悬案**:`hideCompleted` 真机**默认为 true**,习惯完成后先显示约 1 秒
完成态(实心圆 + 名下「+N ☀」),再连同该习惯一起从今日页隐藏;情境组空掉则整组隐藏。
所以「点了会消失」与 R2 的「已打卡单击开弹层」**并不矛盾** —— 错的是我把默认值设成了 false。
连带订正:情境 chip 的数字是**未完成数**;光芒 toast 是顶部横幅;`+` 在 chip 旁。
统计页周/月/年确认为**三套结构不同的视图**,第一版糊成一个周表格,已重做。

### 第 1 轮(spec v1.0.0 → v1.1.0)— gate4-feedback-v1.json,15 条
**三处裁定翻案**:阶段① 把 `快捷指令`/`我的卡包`/`整点报时`/`AI 规划师` 整页判为 wontfix,
补拍证明四页内容全是纯展示或本地开关,原理由只对**个别按钮**成立。
教训:**wontfix 应标到按钮粒度,不是页面粒度** —— 页面粒度会连带砍掉本可实现的内容,违反铁律①。
连锁:`存进卡包` 的 wontfix 理由写的是「卡包属实验室 wontfix」,该前提被推翻后一并改为真实现。

两个真 bug:小事快捷输入的遮罩没绑返回(进去出不来);
`habit.reminder.add.open` 漏了 `params=["habitId"]`,跳转丢参 → `addReminder('')` **静默不写**(坑四)。
另把 9 处 `window.confirm/prompt` 换成 App 内弹窗,并加断言劫持原生弹窗以防回潮。

## 保真四要素(pipeline §10)

| # | 项目 | 结果 |
|---|------|------|
| 10.1 A1 | app 图标 | ✅ `LauncherIcon`(透明底太阳字形)+ `iconBackground #FFF5D5`,不套图标 |
| 10.1 A2 | 状态栏前景 | ✅ manifest `dark`(白底首屏);43/49 页显式声明 `data-status-bar-foreground` |
| 10.1 A3 | 圆角/字号/间距 | ✅ 逐页对真机截图比对,三轮走查订正 |
| 10.1 A4 | 取色来源 | ✅ `design-tokens.md` 记录:真机 PNG **区域众数采样**,非目测,非沿用参考实现 |
| 10.2 | 中英双语 | ✅ `res/strings.ts` + `strings.en.ts` **137/137 键全覆盖**,48 个文件经 `useAppStrings` 消费;设置页语言三档(系统/中文/EN)可切 |
| 10.2 | 外观设置入口 | ✅ 「跟随系统暗黑模式」开关实现;个性化五个 tab 全部可用 |
| 10.3 | 构建时种子 ≥5 且多样 | ✅ 习惯 8(四种 recurrence / 含量化 / 含需专注 / 含已归档)、打卡日志 11(三种状态齐全)、心愿 5、笔记 5、小事 6、专注记录 5 |
| 10.3 | 运行时写入 | ✅ 全走 store action;`DATA_VERSION=4` + `afterHydration` 迁移钩子(第 2 轮补) |
| 10.4 | 不在分支私改规范 | ⚠️ **见下方「需组长裁定」** |

## 已知取舍(wontfix,按铁律① 一律给 toast「该功能暂未开放」)

共 **22 处**,剩余项主要需要 AI 后端、地图/定位、通知与闹钟、音频资产、iCloud、
第三方登录或尚未接入的外部页面。分享、剪切板、相册选图/存图和支付/会员入口已改接
系统标准能力,不再列入 wontfix。
**没有一处是整页 wontfix** —— 第 1 轮已按「按钮粒度」原则纠正。

## 遗留 openIssues(6 条,均已写明保守策略,不阻塞交付)

| id | 级别 | 说明 |
|----|------|------|
| `todo-listmenu-clearDone` | P1 | 操作员勾「符合」,但 s234 只有 2 项;按「截图 > 勾选」删除该项 |
| `todo-sortmenu-options` | P1 | 排序方式二级菜单选项未拍到,三个选项为 inferred |
| `habit-detail-calendar-uncheck` | P1 | 点**已填充**的日历格能否取消打卡,未拍到;只建模「空格 → 补卡」单向 |
| `stats-focus-manualadd-form` | P2 | 「补记专注 ›」点开的表单未拍到;按「补记 25 分钟」实现 |
| `note-section-menu` | P2 | 笔记区头 ⋯ 菜单内容未确证 |
| `planning-exit-behavior` | P2 | 「完成规划」除退出模式外是否有别的效果未知 |

## 复现命令

```bash
cd trial_apps/mobilegym
npm run dev                                            # localhost:3000 → 打开「小日常」

# 机器 gate
npx tsc --noEmit
npx eslint apps/Xiaorichang
node scripts/build_nav_artifacts.mjs Xiaorichang
node apps/Xiaorichang/assets/runtime_walkthrough.mjs   # 需先 npm run dev

# 从冻结的 spec 重新编译导航声明(改交互的唯一正确入口)
python3 ../../docs/xiaorichang-replication/build_spec.py
python3 apps/Xiaorichang/assets/gen_nav_declaration.py
```

## 需组长裁定的两件事

**1. `tools/gen_review_html.py` 有个共享 bug,我在本地改了。**
该脚本给操作员看的 App 名**硬编码成「淘宝」**,复刻其它 App 时审核页会指错对象
(原文:「这一页真实淘宝里还有什么重要操作…」)。我改成读 `spec.displayName`。
但按 §10.4「规范/共享工具只在主仓 main 改,不在自己分支私改」,**这个改动没有随本 PR 提交**。
请决定:由维护者在 main 上修,还是允许我单独开一个 PR。
(附:`docs/fanqietodo-replication/review.html` 因为 evidence 用 `sNN` 而非 `IMG_` 前缀,
渲染出来是**零张截图**,同一个脚本的另一个坑,一并提请复核。)

**2. 仓库历史里有一把明文 API key。**
`test_api_imggen.py` 在 `030a8e9`(拼多多复刻)被提交,`f8472bd` 又删除。
删除只让它离开最新版本,**历史 commit 里仍是明文可查**。与本次复刻无关,但建议:
轮换该 key,并考虑清理历史。本 PR **不包含**该文件(`.gitignore` 未覆盖它,已手动排除)。
