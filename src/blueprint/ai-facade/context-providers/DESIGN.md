# context-providers - Design

目標
- 定義 context 的來源、合併規則、以及敏感欄位處理流程。

來源
- User store（user id, roles, preferences）
- Workspace config（workspace id, plan, quota）
- Request metadata（requestId, locale, headers）

合併規則
- 使用明確優先順序（request overrides user overrides workspace），並保留原始來源以供 audit。

敏感資料處理
- 在 buildContext 階段只標記敏感欄位；在後端 adapter 呼叫前，呼叫 `applyBackendRedaction(context)` 以移除/mask PII。

測試
- 提供 deterministic factories 與 property-based tests 驗證合併行為與 redaction 規則。
# context-providers - Design

責任
- 定義如何收集與組合呼叫 AI 所需的上下文。

範例
- `UserContext`：userId, roles, preferences
- `RequestContext`：requestId, locale, timeZone

延伸
- 支援 context 之間的覆寫（local overrides），並確保敏感欄位在送出前被遮蔽或移除。
