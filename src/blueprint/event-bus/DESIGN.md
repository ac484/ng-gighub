## Event Bus 設計概要

**角色**：事件發布/訂閱/分派中樞，確保事件結構一致、可追蹤、可重試。

**責任**
- 提供 publish / subscribe / dispatch API。
- 維持事件登記表與 Correlation ID，支援重試/DLQ（若有基礎設施）。

**邊界**
- ❌ 不決定事件該不該發生，不改寫 Payload。
- ❌ 不依賴 Domain 模組，也不執行業務邏輯。
- ✅ 僅傳遞已發生的事實 `<module>.<fact>`，Payload 僅含識別資訊。

**使用建議**
- 事件由模組 Service 發布；訂閱端保持輕量。
- 高風險事件可加簽或審批後再發布。
- 若接入 Queue/DLQ/Adapter，封裝於 `adapters/`，Event Bus 只暴露抽象。

## 目錄結構與用途

```
event-bus/
├─ adapters/           # 對 Queue/DLQ/外部 bus 的適配層
├─ event-bus.service.ts# publish/subscribe/dispatch 核心
├─ event.types.ts      # 事件介面、標準欄位（id、timestamp、correlationId）
└─ README.md           # 說明文件
```

- `event-bus.service.ts`：維護訂閱表、派發事件、可插入重試/回退策略。  
- `adapters/`：對特定基礎設施（如 Pub/Sub、SQS）的封裝，不洩漏到 Domain。  
- `event.types.ts`：統一事件欄位與型別，避免 Payload 發散。 
