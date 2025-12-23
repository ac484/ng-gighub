## Event Bus Responsibilities

`event-bus/` 是事件發布、訂閱與分派的中樞，提供統一的事件通道但不含業務判斷。目標是讓事件具備一致結構、可追蹤（Correlation ID）與可重試能力。

## Boundaries

- ❌ 不決定事件該不該發生，也不改寫事件 Payload。
- ❌ 不依賴任何 Domain 模組或承載業務邏輯。
- ✅ 提供 publish / subscribe / dispatch 能力，維持事件登記表與重試策略。

## Usage Notes

1. 事件由模組 Service 發布，命名須為 `<module>.<fact>`，僅帶必要識別資訊。
2. 訂閱端應保持輕量，可在 Workflow 或模組 Service 中處理後續步驟。
3. 確保每個事件都帶 Correlation ID 以便追蹤與稽核。
4. 若有外部基礎設施（Queue、DLQ、Adapter），請放在 `adapters/` 並在此層抽象化。

詳細心法與起手式可參考 `BLUEPRINT_LAYER.md` 的 Event Bus 章節。 
