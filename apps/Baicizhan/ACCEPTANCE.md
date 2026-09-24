# 百词斩(Baicizhan)复刻 · 验收清单(ACCEPTANCE)

> spec: `docs/baicizhan-replication/spec.json` **v1.9.0** | 更新:2026-08-08
> 67 节点 / 429 交互 / inferred **0 条**。导航和动作声明完整覆盖。

## 机器 gate 结果

| Gate | 命令 | 结果 |
|------|------|------|
| 覆盖率(转换) | `node scripts/build_nav_artifacts.mjs Baicizhan` | **123/123 used, 0 unused, 0 fromMismatch** ✅ |
| 覆盖率(动作) | 同上 | **239/239 declared, 0 missing, 0 schemaError** ✅ |
| 生产构建 | `npm run build` | **构建成功** ✅ |
| 百词斩 Lint | `npx eslint apps/Baicizhan --ext .ts,.tsx` | **0 errors, 0 warnings** ✅ |
| Store getter 反模式 | `node scripts/lint_store_getters.mjs apps/Baicizhan` | **无** ✅ |
| 运行时走查 | `node apps/Baicizhan/assets/runtime_walkthrough.mjs` | **68/68 passed, 零 console/pageerror** ✅ |

> 全仓 `npx tsc --noEmit` 仍会命中 Ctrip、Didi、FanqieTodo 等其他 App 的既有错误；本次未越界修改这些 App。
> 导航 gate 仅保留 3 条宽状态静态分析 warning（课程 tab 1 条、阅读书架 tab 2 条），无 error，运行时路径均已覆盖通过。

> 导航声明由 `apps/Baicizhan/assets/gen_nav_declaration.py` 从**冻结的 spec** 编译,
> 脚本内置覆盖率自检(每个 transitionId/actionId 必须落进声明,漏一条 exit 1),`frozen != true` 时拒绝生成。
> 改交互必须先改 spec 再重跑,不得直接改生成物。

## 运行时走查覆盖什么

4 个有效主 tab 渲染;**新学/复习/训练答题统一写 learn 状态**;课程课时进度持久化;外刊计划、阅读历史和阅读字数持久化且重复打开不重复计数;
**商城详情 → 收藏 → 我的收藏同源联动**;**商城加购 → 购物车角标 → 去结算 → 确认订单 → 支付结果**全链路;
不同单词/文章/商品携带各自 id;首页、深页和替换页返回无环;搜索/筛选原页生效且不叠历史;未实现核心能力进入明确确认页;零 console/pageerror。

## 阶段④ 审核订正记录(review-verdicts 三轮)

- 第一轮补拍(8311-8316):解开**记忆模式**悬案 —— 新学有认识/记忆两套模式(R3),
  已建模为 study.session 双模式(答对进详情 vs 直接下一词+连对连击+自评卡)。
- 第二轮(8321-8340):12 条 wrong 全订正 —— ⚡→不断电页 / 🗓→分享卡 / 曲线→复习统计 /
  我的收藏 hub / 词汇量测试 / 身份页 / **设置页无语言开关**(删臆造项,按真机 8335 重建 11 项+5 子页)。
- 第三轮(8341-8353):关闭全部 P0 缺口 —— 文章阅读器(点词弹精讲卡+加入单词本)/
  非空购物车+确认订单+新增地址 / 单词本详情+排序菜单+⋯菜单。

## 保真四要素(pipeline §10)

| # | 项目 | 结果 |
|---|------|------|
| 10.1 A1 | app 图标 | ✅ `LauncherIcon`(白底+蓝书本+斩字笔刷)+ `iconBackground #FFFFFF`,不套图标 |
| 10.1 A2 | 状态栏前景 | ✅ manifest `dark`(浅色首屏);排行榜深色页页面内翻转 `light` |
| 10.1 A3 | 圆角/字号/间距 | ✅ 逐页对真机截图比对(阶段④ 三轮订正) |
| 10.1 A4 | 取色来源 | ✅ `design-tokens.md` 记录:真机 PNG **区域众数采样**,非目测 |
| 10.2 | 中英双语 | ✅ `res/strings.ts` + `strings.en.ts` 经 `useAppStrings` 跟随 OS 语言。**真机设置无 in-app 语言开关**(8335),故不臆造,双语在字符串层实现——符合 §10.2 |
| 10.3 | 构建时种子 ≥5 且多样 | ✅ 单词 **399**(真实词/释义/例句/四选一干扰项,含 learning/known/zhan 多状态)、词书 10、商品 12、文章 3、收藏词 39 |
| 10.3 | 运行时写入 | ✅ 学习、课程、阅读、收藏、会员、订单全走 store action;`DATA_VERSION=5` + `afterHydration` 迁移钩子 |
| 10.4 | 不在分支私改规范 | ⚠️ `tools/gen_review_html.py` 的 `淘宝→displayName` 修复沿用上个 app,未随本 app 提交(见下) |

## §5.3 资产管线

用户提供生图 API,已**批量生成 60 张位图**(单词配图 44 + 商品 12 + 文章 3 + 头像 1),
经 `assets/gen_assets.py` 幂等生成、压到 256px(约 6MB)。组件 `WordImage/ProductImage/ArticleImage`
缺图时回落 CSS 色块(§5.3:有 PNG 用 PNG,缺失回落)。
**安全红线**:prompt 只描述合成主体;真机截图未作生图输入;key 走环境变量,不进代码/git。

## 已知取舍

需要 AI 后端、课程视频、联网对战等当前环境无法完成的核心入口，统一进入 `/unavailable` 明确说明页，必须由 agent 手动点击「我知道了」确认后返回，不再用一闪而过的 toast 冒充完成。
已有环境能力的分享、复制、相册和支付继续走标准 OS 接口；单词和例句发音使用运行时语音能力。**没有整页无按钮的死路**。

## 遗留 openIssues(2 条,均保守实现,不阻塞)

| id | 级别 | 说明 |
|----|------|------|
| `study-zhan-effect` | P2 | 『斩』效果未单独拍到 → 保守:标记已斩+移出本组+toast,列表『已斩』tab 回显 |
| `mall-spec-popup` | P2 | 规格弹层内部未单独拍(购物车已见选中规格) → 按规格列表+数量+确认实现 |

## 复现命令

```bash
cd trial_apps/mobilegym
npm run dev                                              # localhost:3000 → 打开「百词斩」
npm run build
npx eslint apps/Baicizhan --ext .ts,.tsx
node scripts/lint_store_getters.mjs apps/Baicizhan
node scripts/build_nav_artifacts.mjs Baicizhan
node apps/Baicizhan/assets/runtime_walkthrough.mjs       # 需先 npm run dev

# 从冻结的 spec 重新编译导航声明(改交互的唯一正确入口)
python3 ../../docs/baicizhan-replication/build_spec.py   # 需先解冻才可改
python3 apps/Baicizhan/assets/gen_nav_declaration.py
# 重新生成种子/位图
python3 apps/Baicizhan/assets/gen_defaults.py
IMAGE_GEN_API_KEY=... python3 apps/Baicizhan/assets/gen_assets.py
```

## 需组长裁定

`tools/gen_review_html.py` 的「淘宝硬编码 → `spec.displayName`」修复是上个 app(小日常)遗留在工作区的改动,
本 app 的审核页生成依赖它(否则页面文案指向「淘宝」)。按 §10.4「共享工具只在 main 改」,
该改动**未随本 app 提交**。请维护者决定在 main 上收编,还是允许单独 PR。
