# Taobao(淘宝复刻)

> **给后续接手的 AI / 开发者的入口文档。不需要通读代码,按下面的地图走。**

## 单一事实源

本 App 由文档驱动管线生成,**`D:\OpenMobileV2\docs\taobao-replication\spec.json` 是唯一事实源**:
所有页面、UI 状态、交互、判题条件都在 spec 里,且每条交互带 `source` 证据锚点(真实截图/人工答疑/AI推断)。

**迭代纪律(spec-first)**:任何功能增改,先改 spec(递增 specVersion + changelog),再改代码,最后跑机器 gate。
禁止只改代码不改 spec。

## 文档地图

| 文件 | 说明 |
|------|------|
| `docs/taobao-replication/spec.json` | 事实源(冻结版本见 changelog) |
| `docs/taobao-replication/00a-capture-catalog.md` | 61 张真实截图的编目(证据索引) |
| `docs/taobao-replication/01-questions.md` | 人工答疑记录(qa:Qn 的出处) |
| `docs/taobao-replication/03-interaction-matrix.md` | 交互矩阵(生成视图,跑 `tools/gen_matrix_md.py` 刷新,手改无效) |
| `docs/taobao-replication/design-tokens.md` | 视觉规范(色彩/字号/组件形态)+ 合成数据替换表 |
| `apps/Taobao/ACCEPTANCE.md` | 验收状态与已知技术债 |
| `docs/app-replication-pipeline-v3.md` | 整个复刻流程的 SOP 与实测教训 |

## 机器 gate(改完必跑)

```bash
python apps/Taobao/assets/validate_coverage.py        # spec↔declaration↔代码 三方 100%
node scripts/build_nav_artifacts.mjs Taobao            # 官方静态分析,0 ERROR
npx tsc --noEmit && npx eslint apps/Taobao             # 类型 + lint
```

## 数据与资产

- 种子数据:`assets/regen_defaults.py` 生成 `data/defaults.json`(**永远跑脚本,不手改 JSON**);
  改完递增 `constants.ts` 的 `DATA_VERSION` 强制刷新 localStorage
- 商品图:`assets/gen_item_images.py`(gpt-image-2 生成,幂等,缺失自动回落 SVG 占位)
- 全部数据为合成,无真实个人信息

## 本 App 试跑中沉淀的坑(新人必读)

见 `docs/app-replication-pipeline-v3.md` §5:绑定必须字面量 id、actions 内联 uiStates、
actionId 命名合同、离散态键不进 queryParams、Zustand selector 禁止返回新引用(运行时崩溃)。
