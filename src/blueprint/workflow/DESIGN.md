## Workflow 設計概要

**角色**：跨模組流程協調者，處理多步驟、高風險、需補償的流程；決定「下一步叫誰做事」而非執行業務。

**責任**
- 訂閱多個事件，維護流程狀態/Context/Correlation ID。
- 發出指令型事件或呼叫對應 Facade，必要時觸發補償事件。

**邊界**
- ❌ 不存取 Domain Repository，不改寫模組狀態。
- ❌ 不含 UI/權限邏輯，不成為「流程上帝」。
- ✅ 僅協調，將工作交由模組 Facade/Service 完成。

**使用建議**
- 僅在事件自然擴散不足以保證一致性或需要補償時建立 Workflow。
- 以 `workflow.registry` 記錄步驟與補償策略，並強制 Audit 高風險節點。
- 指令與事件必須攜帶 Workspace/Blueprint Context，以利授權核對。
