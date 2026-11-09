# MobileGym App Tools Design Guide

本文档面向负责扩展 MobileGym App Tools、实现 Agent 接入或构建 GUI + Tools 混合评测的开发者和 coding agent。

目标不是把每个 App 的全部状态和功能都包装成工具，而是构建一组：

- 业务语义清晰、粒度原子的工具；
- 与真实 App 可能开放的 API、Intent、MCP 能力相近的工具；
- 有意保持稀疏，使 GUI 仍然是必要交互方式之一；
- 与现有 GUI 操作复用相同业务逻辑和状态；
- 可重复执行、可验证、适合训练和评测的工具。

## 1. Architecture

当前环境端调用链：

```text
Model
  -> Python Agent / Model Adapter
  -> Playwright page.evaluate()
  -> window.__MOBILE_GYM_TOOLS__.callTool()
  -> TypeScript Tool Registry
  -> App Tool Handler
  -> shared domain logic / existing store action / normal app route
  -> ToolResult
  -> updated screenshot when needed
  -> Model
```

核心目录：

```text
app_tools/
  core/
    types.ts                 # ToolDefinition / ToolResult / BrowserToolApi
    errors.ts                # 参数检查与结构化错误
    registry.ts              # 工具注册和统一执行
  apps/
    calendar/                # Calendar 工具定义与实现
  bootstrap.ts               # 注册工具并暴露浏览器 API
  globals.d.ts               # window.__MOBILE_GYM_TOOLS__ 类型
```

App Tool 的业务实现位于浏览器 TypeScript 层，因为 MobileGym 的 App、Zustand Store、路由和业务 action 都运行在浏览器内。Python 层只负责模型协议、调用转发、轨迹管理和截图，不应重新实现 App 业务逻辑。

## 2. How To Choose Tools For An App

### 2.1 Start From User-Facing Capabilities

一个工具应对应一个稳定、可复用、用户可以理解的 App 能力，例如：

```text
calendar__search_events
calendar__open_date
wechat__send_message
notes__create_note
```

不要直接把数据库字段操作暴露为工具：

```text
calendar__append_event_row          # bad
wechat__set_messages_array          # bad
```

也不要把完整 benchmark 解法包装成工具：

```text
calendar__find_free_afternoon_and_create_reminder       # bad
wechat__summarize_calendar_and_send_to_contact           # bad
```

推荐粒度是 AppWorld 风格的业务原子能力，但工具集合应比 AppWorld 更稀疏。

### 2.2 Inspect The App Before Proposing Tools

设计新 App 工具前，至少检查：

1. `state.ts` 中的持久化状态和现有 actions。
2. 页面组件中是否存在未抽取的业务校验、默认值或副作用。
3. 路由和 deep link 是否可以稳定打开目标页面。
4. 现有 benchmark tasks 覆盖了哪些查询、编辑和跨 App 流程。
5. 哪些功能在真实 App 中通常通过 API、Intent 或系统 Provider 开放。
6. 哪些信息敏感，哪些写操作需要确认或应保留给 GUI。

不要看到一个 Zustand action 就直接将它注册成工具。Store action 可能只是底层状态操作，真正的校验和业务逻辑可能仍在 React 页面中。

### 2.3 Keep The Tool Surface Sparse

每个 App 的第一版建议只提供约 5-15 个高价值工具。优先级通常是：

```text
高：搜索、定位、打开页面、有限结构化查询
中：低风险原子写操作、预填草稿、跨 App Intent
低：设置项、展示偏好、批量操作
禁用：任意状态读写、完整工作流、任务专用工具
```

工具不需要让每个任务都变成混合任务。有些任务可以 Tool-only，有些可以 GUI-only，关键是整个任务集能自然地产生多种交互路径。

不要按单个测试任务临时隐藏某个工具来强制混合，这容易泄漏任务结构并产生不自然的环境。优先定义 App 级 capability profile，例如：

```text
calendar_read_assist
calendar_intent_write
calendar_full_api        # ablation only
```

### 2.4 Prefer Natural Hybrid Boundaries

最适合 GUI + Tools 的工具边界包括：

- 工具负责搜索候选，GUI 查看候选详情；
- 工具负责定位日期，GUI 阅读当天内容；
- 工具负责预填表单，GUI 设置高级选项并确认提交；
- 工具返回 free/busy，GUI 查看敏感事件标题；
- 工具执行低风险查询，GUI 完成需要视觉判断或确认的步骤。

Calendar 的 `prepare_event_draft` 是典型例子：工具预填标题和时间，但不调用 `createEvent`，提醒、闹钟和最终保存仍由正常 GUI 完成。

## 3. Tool Categories And UI Contracts

工具至少分为以下两大类。

### 3.1 Data/Query Tools

此类工具完成查询或业务状态更新，不承诺改变前台页面。

```text
uiEffect: none
```

示例：

```text
calendar__search_events
calendar__get_busy_intervals
wechat__send_message       # future example, if it does not open chat UI
```

执行完成时必须保证：

- 查询结果已经完整生成；或
- 业务 action 已经完成，异步副作用已经被 `await`；
- ToolResult 对应的是提交后的状态；
- 没有隐式要求 Agent 等待任意固定时间。

当前页面可能因为订阅了相关状态而自行刷新，但这不是该工具的 UI 契约。

### 3.2 UI Tools

此类工具承诺调用后处于某个可继续 GUI 操作的页面。

```text
uiEffect: navigation | draft
```

示例：

```text
calendar__open_date
calendar__open_event
calendar__prepare_event_draft
```

UI Tool 必须在 `callTool()` 返回前：

1. 请求 App 导航；
2. 等待目标 route 生效；
3. 等待目标页面状态和 React render 完成；
4. 确保 Agent 随后立即截图时已经是目标页面。

Calendar 当前在目标 route 生效后额外等待两帧 UI render。对于需要异步加载数据的页面，两帧不一定充分，应增加明确的 ready condition，而不是加入任意 `sleep(1)`。

未来可按实际需要扩展：

```text
uiEffect: refresh | dialog | picker
```

但每种值都必须有清晰、可测试的完成条件。

### 3.3 Framework Metadata Versus Model Instructions

`annotations.uiEffect` 是给 Agent Runtime 使用的结构化元数据：

```json
{
  "readOnlyHint": true,
  "destructiveHint": false,
  "idempotentHint": true,
  "uiEffect": "navigation"
}
```

模型通常看不到自定义 metadata。OpenAI Function Calling 没有标准 `uiEffect` 字段，MCP 也没有标准 UI effect annotation。因此工具描述中还必须用自然语言说明：

- 工具是否会打开或改变页面；
- 调用后是否应读取新截图；
- 草稿是否已经保存；
- 后续是否需要 GUI 确认。

原则是：

```text
structured annotations -> control the Agent Runtime
natural-language description -> instruct the model
```

## 4. Implementation Requirements

### 4.1 Reuse The Real Business Path

优先顺序：

1. 调用 GUI 已在使用的共享 domain service。
2. 调用具备完整业务语义和校验的现有 store action。
3. 抽取页面中的业务逻辑为共享 domain service，并让 GUI 与 Tool 共同使用。
4. 最后才考虑为工具新增专用逻辑。

禁止：

- 使用 `window.__SIM__.setState()` 实现 Agent Tool；
- 直接替换 App state 数组或对象；
- 读取 verifier、expected answer、task ground truth 或 `apps_init`；
- 将隐藏的 Playwright 点击序列包装成所谓“业务工具”；
- 在 Python 中复制 TypeScript App 业务逻辑。

`__SIM__.setState()` 仅可用于任务 setup、测试 fixture 和环境 reset，不属于 Agent 工具能力。

### 4.2 Read Tools Must Control Information Exposure

查询工具应只返回完成其公开能力所需的数据。

例如 Calendar 搜索结果返回：

```json
{
  "event_id": "evt_xxx",
  "title": "Project review",
  "start": "2026-07-15T14:00:00+08:00",
  "all_day": false
}
```

它不返回备注、提醒和闹钟；这些信息可通过 `open_event` 后的 GUI 查看。

信息限制必须有稳定的产品语义，例如搜索结果摘要、free/busy 隐私边界或权限限制。不要仅为某一个 benchmark task 人为删字段。

### 4.3 Write Tools Need A Higher Bar

直接写工具必须具备：

- 参数校验；
- 权限与对象存在性检查；
- 明确的幂等性语义；
- 冲突和错误处理；
- 与 GUI 一致的默认值和联动副作用；
- destructive action 的确认策略；
- state diff 和 clean verifier 测试。

如果当前 Store 只有原始 CRUD，没有完整业务校验，不要直接暴露。可以先实现“预填草稿并打开 GUI”的 Intent 风格工具。

### 4.4 Schema Design

每个工具定义至少包含：

```text
name
app
description
inputSchema
outputSchema
annotations
handler
```

命名使用稳定的 App namespace：

```text
{app_id}__{verb}_{object}
```

双下划线兼容 OpenAI native function name 和未来 MCP adapter，例如：

```text
calendar__search_events
calendar__open_date
```

参数要求：

- 使用业务格式，不暴露实现格式；日期用 `YYYY-MM-DD`，时间用 `HH:mm` 或 ISO 8601；
- ID 作为 opaque identifier，不要求模型解析 ID；
- 参数名和返回字段保持稳定；
- 对字符串长度、枚举、数字范围和额外参数进行校验；
- 列表查询提供合理 `limit` 和 `truncated`；
- 不允许模糊地静默选择重名对象；先搜索，再按 ID 操作。

### 4.5 Error Contract

工具错误必须返回结构化结果，不应把异常直接泄漏给模型：

```json
{
  "callId": "tool_call_3",
  "name": "calendar__open_event",
  "ok": false,
  "error": {
    "code": "EVENT_NOT_FOUND",
    "message": "Calendar event not found: evt_xxx"
  }
}
```

推荐错误类别：

```text
INVALID_ARGUMENTS
INVALID_ARGUMENT
TOOL_NOT_FOUND
OBJECT_NOT_FOUND / EVENT_NOT_FOUND
PERMISSION_DENIED
CONFLICT
ENVIRONMENT_NOT_READY
NAVIGATION_TIMEOUT
INTERNAL_ERROR
```

可恢复的业务错误应交给模型观察和调整；基础设施错误由 Runtime 按明确策略重试。不要对所有错误无条件重试。

### 4.6 Time And Determinism

浏览器实现必须使用 `TimeService`，不要直接使用 `Date.now()` 或 `new Date()` 获取环境时间。

需要测试：

- 本地时区；
- 日期边界；
- 全天事件的 end-exclusive 语义；
- 跨天事件；
- 冻结模拟时间；
- 重复调用和随机 ID 对评测的影响。

## 5. Calendar Reference Design

Calendar v1 暴露五个工具：

| Tool | Category | State effect | UI effect | Reason |
| --- | --- | --- | --- | --- |
| `calendar__search_events` | query | none | none | 搜索候选，详情保留给 GUI |
| `calendar__open_event` | navigation | none | event detail | 允许搜索后进入 GUI 深入操作 |
| `calendar__open_date` | navigation | selected date only | month/agenda | 不直接返回当天日程内容 |
| `calendar__get_busy_intervals` | query | none | none | 隐私友好的 free/busy 能力 |
| `calendar__prepare_event_draft` | draft | no event write | prefilled form | 最终由 GUI 设置提醒并保存 |

Calendar v1 有意不提供：

```text
calendar__list_events
calendar__get_event_details
calendar__create_event
calendar__update_event
calendar__delete_event
calendar__set_reminder
calendar__find_free_slot
calendar__summarize_schedule
```

实现中的关键共享点：

- Calendar 搜索页和搜索工具共同使用 `system/Calendar/domain/eventQueries.ts`；
- date/event navigation 使用正常 `window.__OS__.openApp()` 和 Calendar routes；
- event draft 通过 route 参数预填正常 Calendar form；
- 点击 GUI 保存后仍执行页面原有 `handleSave -> createEvent`；
- 工具草稿保存前 `events` 不发生变化。

## 6. Verification And Testing

The implemented v1 capability inventory for Calendar, WeChat, Taobao Instant,
Days Matter, Clock, and Notes is maintained in
[`TOOL_CATALOG.md`](./TOOL_CATALOG.md). Keep that catalog synchronized whenever a
tool is added, removed, renamed, or changes side-effect/UI semantics.

Real-browser coverage and state-diff evidence are maintained in
[`VALIDATION.md`](./VALIDATION.md). Browser validators must remain manually invoked
development tools and must not be imported by the production MobileGym entrypoint.

一个工具不能只验证“函数返回成功”。至少覆盖以下层次。

### 6.1 Schema And Registry Tests

- 工具名称唯一；
- `listTools({app})` 只返回预期工具；
- input/output schemas 完整；
- annotation 与真实行为一致；
- 未知工具和额外参数返回结构化错误。

### 6.2 Domain Unit Tests

- 查询、排序、分页和过滤；
- 空结果、重名对象和无效 ID；
- 日期、时区、跨天和全天边界；
- busy interval clipping 和 merge；
- 参数无效时不修改状态。

### 6.3 State-Diff Tests

对写操作或草稿操作记录调用前后状态：

```text
before = __SIM__.getState()
callTool(...)
after = __SIM__.getState()
```

确认：

- 必须变化的字段已变化；
- 不应变化的字段未变化；
- 没有 unexpected side effect；
- 草稿类工具在 GUI 保存前没有写入业务数据；
- GUI 保存后的状态与普通 GUI 创建语义一致。

测试 fixture 可以使用 `__SIM__.setState()` 注入初始数据，但工具 handler 本身不可以使用。

### 6.4 UI Integration Tests

对于 `uiEffect != none` 的工具：

- 从 App 未启动、后台、错误页面和目标 App 内部多种状态调用；
- `await callTool()` 返回后立即截图，不添加额外 sleep；
- 验证 route、可见页面、表单字段和目标对象；
- 确认随后可以继续 click/type/swipe；
- 验证系统 Back 和 App history 行为；
- 验证导航超时返回明确错误。

### 6.5 GUI/Tool Equivalence Tests

对同一业务操作分别走 GUI 和 Tool 路径，然后比较最终业务状态。比较重点是语义状态，不应要求随机 ID 完全一致。

```text
GUI path final state ~= Tool path final state
```

如果两条路径产生不同默认值、通知、跨 App 联动或校验结果，说明工具绕开了真实业务入口。

### 6.6 Required Commands

提交前至少执行：

```bash
npm test -- --run tests/<app>ToolEnvironment.test.ts
NODE_OPTIONS=--max-old-space-size=4096 npx tsc --noEmit
npx eslint app_tools/
npm run build
```

还应运行完整测试。若存在与改动无关的基线失败，需要在结果中明确记录，不能声称完整测试全部通过。

## 7. Agent-Side Integration Guide

环境端完成后，Python Agent 不应 import 或复制 TypeScript 工具实现，而应把浏览器视为工具服务。

当前 XML 协议参考实现位于 `bench_env/hybrid_agent/`。它独立于现有
`bench_env.agent` 和 benchmark `Controller`，包括动态工具发现、Qwen XML
prompt/解析、`mobile_use` 到 MobileGym action 的映射、Playwright 调用转发和
顺序执行 runtime。可运行入口和边界说明见
`bench_env/hybrid_agent/README.md`。

### 7.1 Discover Tools

```python
definitions = await page.evaluate(
    "() => window.__MOBILE_GYM_TOOLS__.listTools()"
)

metadata_by_name = {
    item["name"]: item["annotations"]
    for item in definitions
}
```

### 7.2 Convert Definitions For The Model

OpenAI native tool format：

```python
model_tools = [
    {
        "type": "function",
        "function": {
            "name": item["name"],
            "description": item["description"],
            "parameters": item["inputSchema"],
        },
    }
    for item in definitions
]
```

不要把自定义 `uiEffect` 当作 OAI 标准字段直接塞入 function schema。Runtime 保存 annotations；模型通过 description 理解行为。

### 7.3 Execute A Tool

```python
result = await page.evaluate(
    """async ({name, arguments}) => {
        return await window.__MOBILE_GYM_TOOLS__.callTool(name, arguments);
    }""",
    {
        "name": tool_call.name,
        "arguments": tool_call.arguments,
    },
)
```

必须 `await callTool()`，不能与截图并发。

### 7.4 Build The Next Observation

建议规则：

```text
uiEffect == none
  -> return ToolResult
  -> screenshot optional according to the agent observation policy

uiEffect != none
  -> return ToolResult
  -> always capture the new screenshot
  -> send ToolResult + screenshot to the model
```

即使 ToolResult 中包含 `route`，也不能用 route 文本替代截图，因为后续 GUI grounding 依赖真实视觉状态。

### 7.5 Handle Native Tool Calls Correctly

Native tool-call response 可能出现：

```text
message.content == empty
message.tool_calls != empty
```

这种响应不是空响应，不能触发 empty-response retry。Agent adapter 应优先解析 `tool_calls`，只有 content 和 tool_calls 都为空时才执行空响应重试。

第一版建议每轮只执行一个工具调用，降低 UI 顺序、截图和副作用并发问题。确认语义后再考虑 parallel tool calls；多个会改变 UI 的工具不能并行执行。

### 7.6 Tool History

轨迹至少记录：

```text
tool_call_id
tool_name
arguments
start/end timestamp
ToolResult
uiEffect
route before/after
screenshot after UI tool
state diff summary for evaluation/debugging
```

模型下一轮应收到与其 tool call ID 对应的 ToolResult，避免结果错配。

## 8. MCP Adapter Guidance

MCP 是工具发现和调用协议，不应成为另一套业务实现。

推荐路径：

```text
MCP list_tools
  -> browser listTools

MCP call_tool
  -> Python BrowserToolClient
  -> Playwright page.evaluate
  -> browser callTool
```

MCP adapter 负责：

- schema 格式转换；
- HTTP/stdio transport；
- session/worker/page 路由；
- timeout、日志和结果序列化；
- 将 `uiEffect` 等自定义信息保存在 `_meta` 或 Runtime side table。

MCP adapter 不负责：

- 重新实现 App 查询或写入；
- 直接访问 Zustand state；
- 读取 verifier 数据；
- 通过 Python 修改 App 状态。

每个并行 worker 必须绑定自己的 browser page 和环境状态，不能让多个 Agent 共用同一个可变 App world。

## 9. Workflow For Adding Tools To Another App

按以下顺序开发：

1. 阅读 App state、actions、routes、页面业务逻辑和相关 tasks。
2. 列出真实 App 可能开放的能力及安全等级。
3. 提出 5-15 个候选工具，并标注 query/write/navigation/draft。
4. 删除高层工作流、重复能力和会让 GUI 完全失去作用的工具。
5. 为每个保留工具写输入、输出、状态副作用和 UI 契约。
6. 抽取 GUI/Tool 共用 domain logic。
7. 在 `app_tools/apps/<app>/` 中实现 definitions 和 handlers。
8. 注册到 Tool Registry，不在 Agent Python 中实现业务逻辑。
9. 添加 schema、domain、state diff 和 browser integration tests。
10. 运行类型检查、lint、专项测试、完整测试和生产构建。
11. 用真实浏览器在 `await callTool()` 后立即截图验收 UI 工具。
12. 更新本文档或 App-specific README，记录能力边界和未开放工具。

## 10. Definition Of Done

一个 App Tool 只有满足以下条件才算完成：

- [ ] 工具粒度是原子业务能力，不是任务级工作流。
- [ ] 工具集合稀疏且有真实产品/API 依据。
- [ ] input/output schema 完整并有明确描述。
- [ ] 参数、额外字段、对象不存在和权限错误得到校验。
- [ ] 没有使用 `__SIM__.setState()` 或 verifier-only 数据。
- [ ] GUI 与 Tool 复用相同 domain/action。
- [ ] 写操作的默认值和副作用与 GUI 一致。
- [ ] `uiEffect` 与真实行为一致。
- [ ] 工具描述告诉模型调用后应如何继续。
- [ ] UI Tool 在返回时已可立即截图和继续 GUI 操作。
- [ ] 单元、state diff、路由和浏览器集成测试通过。
- [ ] TypeScript、lint 和 production build 通过。
- [ ] Agent adapter 可以仅通过 `listTools/callTool` 使用工具。
- [ ] MCP/OAI adapter 中没有复制 App 业务逻辑。
