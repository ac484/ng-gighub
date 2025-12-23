## Workflow Responsibilities

`workflow/` 是跨模組流程的協調者，僅在多模組、高風險、需要補償或順序不可缺步時使用。它決定「下一步要叫誰做事」，而非直接執行業務邏輯。

## When to Create a Workflow

- 涉及多個模組且中間步驟可能失敗。
- 流程需要補償（Rollback / Saga）或超時處理。
- 事件自然擴散不足以保證順序或一致性。

## Boundaries

- ❌ 不得存取 Domain Repository、不得改寫模組狀態。
- ❌ 不包含 UI 或權限邏輯。
- ✅ 可以訂閱多個事件、管理流程狀態、發布下一個指令型事件。

## Implementation Hints

1. 透過 Event Bus 訂閱觸發事件並維護流程上下文（Correlation ID）。
2. 依 `workflow.registry` 記錄步驟與補償邏輯，必要時發出補償事件。
3. 將工作委派給模組 Facade（指令型事件）而非直接存取 Service。
4. 只儲存流程狀態本身，不存放業務資料；稽核紀錄交由 `audit/` 處理。

詳細流程與範例請參考 `BLUEPRINT_LAYER.md` 的 Workflow 章節。 
