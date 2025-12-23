# context-providers - Design

責任
- 定義如何收集與組合呼叫 AI 所需的上下文。

範例
- `UserContext`：userId, roles, preferences
- `RequestContext`：requestId, locale, timeZone

延伸
- 支援 context 之間的覆寫（local overrides），並確保敏感欄位在送出前被遮蔽或移除。
