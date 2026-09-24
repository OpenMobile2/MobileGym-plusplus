# V4 P1/P2 To V5 Repair Matrix

Source audit: `clocked/CASE_BY_CASE_CONTRACT_AUDIT.md`.

## 中高风险语义审查修订

在原 P1/P2 修订之后，又按照 `TASK_VERIFIER_INTENT_AUDIT.md` 对 20 条中高风险
任务完成了第二轮收敛。这一轮遵循“合理完成不应被格式差异判错”的原则，同时保留
无歧义字段、精确状态和副作用约束。

| Case | 已实施修订 |
| --- | --- |
| 01 | 将“转账”、对象和金额拆开验证，不再要求固定连续格式。 |
| 08 | 胜出月份兼容中文年月、斜杠、连字符和上下文明确的月份写法。 |
| 09 | 标题-金额仍需逐笔配对，但兼容相邻行、逗号、冒号和表格布局。 |
| 10 | 移除消息必须重复“订单”二字的限制，保留收件人、笔数和金额。 |
| 15、16、18 | 在指令中分别明确笔记标题、完整商品标题和博主昵称；verifier 保持严格。 |
| 23、24 | 推荐值按百分比数值匹配；阅读时长按总分钟语义匹配。 |
| 29、30 | 小红书统计兼容“万/千”和展开数字。 |
| 33、34 | 地址做安全格式规范化，但保留地点和核心地址身份。 |
| 37 | 地址、天气和温度保持同候选绑定；分别做地址、天气类别和温度语义匹配。 |
| 40 | 日期解析增加周几、`号` 和中文数字，仍要求精确日期集合。 |
| 51 | 忙碌分支增加“有安排、没空、时间占用、无法安排”等自然表达。 |
| 70 | 新订单严格要求数量 1 和商品规格首选项组成的默认 SKU。 |
| 72 | 笔记时间支持中文等价写法，版本、标题和闹钟状态不放宽。 |
| 73、75 | 日期增加 `号` 和中文数字；Case75 仍强制包含年份。 |

实现全部位于 V5 的任务覆盖层和 V5 规格中，没有修改 V4 或官方 MobileGym
任务 verifier。

| Case | Severity | V5 repair | Acceptance boundary |
| --- | --- | --- | --- |
| 02 | P2 | Normalize eBay product text in the note verifier. | Spacing/punctuation variants pass; another product does not. |
| 03 | P1 | Apply the same normalization to both copied product titles. | The observed compact-title false negative passes. |
| 05 | P2 | Normalize the copied cheapest-product title. | Price and product identity remain independently required. |
| 06 | P2 | Normalize the product title sent to WeChat. | Recipient and total price checks are retained. |
| 07 | P2 | Normalize both durable product-title outputs. | Search, balance, note, recipient, and product remain required. |
| 09 | P1 | Require each top-three transaction label to be paired with its amount and enforce the requested last sentence. | Amount-only, label/amount-swapped, or incorrectly ended summaries fail. |
| 14 | P1 | Seed local playback timestamps, show them in GUI/tool output, define chronological earliest, and require a new note titled “今日文化清单”. | The correctly titled note and new RedBook post must both contain the two derived items. |
| 15 | P2 | Sort the Notes home list by pinned state then `updatedAt`; clarify ranking by update time. | Fixed setup has no pinned ambiguity and GUI matches verifier order. |
| 17 | P1 | Define and verify the target as all shelf books with positive progress that are not finished. | A new plan missing any target book fails. |
| 21 | P1 | Define first as earliest by actual playback time and expose timestamps. | GUI, tool, and `recentPlays[-1]` identify the same track. |
| 22 | P1 | Define chronological third, expose timestamps, remove benchmark-specific tool text, and enforce both identity fields in the RedBook body. | RedBook body and the new playlist must use the same third track. |
| 23 | P2 | Rank History books by `recommendedValue`, not rating. | A unique maximum is required; setup errors cannot silently choose a tie. |
| 25 | P1 | Require both headings, the best reading date, every liked recent song and artist, and no unliked recent song. | Partial or over-inclusive Moments posts fail. |
| 32 | P2 | Replace the alarm check with a newly created, enabled departure-minus-one-hour alarm. | A matching pre-existing or disabled alarm does not satisfy the task. |
| 36 | P1 | Resolve saved-city cards from the same offline library used by App Tools, first by city ID then coordinates. | Adding Nanjing through GUI/tool yields non-placeholder GUI weather. |
| 38 | P2 | Normalize known Jay Chou/JJ Lin aliases before requiring the exact four-track artist multiset. | Traditional, simplified, and standard English aliases pass; extra tracks or any third artist fail. |
| 40 | P1 | Parse natural dates and compare the exact output date set. | Missing, rainy, or out-of-window extra dates fail. |
| 41 | P1 | Require a new pending order on the derived date whose `trainNo` starts with `G`. | G-series passes; D/C/regular trains and no-candidate setup fail. |
| 42 | P2 | Require a newly created, enabled 08:00 alarm. | Existing or disabled alarms fail. |
| 44 | P2 | Compare the nearest-place address with address-specific formatting normalization. | Spaces, punctuation, country prefix, and postal suffix are tolerated; a different branch address still fails. |
| 46 | P2 | Require invitation semantics in the SMS in addition to date and weather. | “适合跑步” alone fails; “一起跑步/约跑” passes. |
| 47 | P1 | Pin the sampled date to `2026-07-14`. | Host date can no longer shift setup/verifier away from the instruction. |
| 53 | P2 | Diff scheduled and active meetings against initial state and match both messages to one new meeting ID. | Initial active meetings and mismatched channel IDs fail. |
| 63 | P2 | Clarify that “longest” means planned duration. | Existing planned-duration verifier is now stated by the instruction. |
| 73 | P1 | Keep exact original/preparation dates but remove the unstated title requirement from WeChat. | Correct dates pass without hidden message content; either missing date fails. |
| 74 | P1 | Seed exact product and shop names, then require an exact one-each cart delta with unchanged orders and checkout draft. | Alternative quantity, extra SKU, checkout, or order side effects fail. |
| 75 | P1 | Require the full preparation date including year. | `2026-11-01` passes; `11月1日` or another November date fails. |

## Shared Environment Changes

Three shared changes were necessary because the audited mismatch existed below the
task layer:

1. Notes displays deterministic `updatedAt` ordering, preserving pinned-first UI.
2. Weather saved-city cards use their offline library entry when no fetched bundle
   exists. This makes GUI and App Tool observations equivalent.
3. Spotify recent plays expose seeded local timestamps in both the GUI and the
   general-purpose tool result. The tool description contains no task-specific hint.

These changes do not register tasks, run setup, or mutate app state during ordinary
MobileGym use. They only change presentation/read results when the corresponding
state already contains notes, offline weather data, or playback timestamps.

## Regression Evidence

- Python unit/regression suite: 58 tests across V5, V4, and Hybrid Agent.
- TypeScript contract suite: 8 tests across V5 environment behavior and App Tool
  benchmark isolation.
- Full browser setup smoke: 76/76 tasks, zero initial false positives, no judge errors,
  all foreground tool surfaces matched.
- Boundary browser smoke: Spotify GUI/tool timestamps and Case14 output contract
  aligned; Case17 complete/missing set behavior correct; Nanjing GUI forecast
  populated; Case40 exact/superset behavior correct; Case41 G/D behavior correct;
  Case74 exact tool-driven cart delta accepted.
