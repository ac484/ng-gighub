## Policies Scope

`policies/` 回答「可不可以」，提供跨模組的前置條件與一致性規則，邏輯應純函式化並可重用於多個模組或 Workflow。

## Responsibilities

- 定義跨模組的狀態轉換與操作前置條件（例如：未生效合約不可建立任務）。
- 提供角色 / 權限矩陣的邏輯判斷層，不依賴 UI。
- 輸出布林或錯誤原因，供 Facade、Service 或 Workflow 直接引用。

## Boundaries

- ❌ 不存取資料庫或 Domain Repository。
- ❌ 不發布事件、不直接執行流程。
- ❌ 不夾帶 UI、排程或補償邏輯。
- ✅ 可以被多個模組共用，應保持純邏輯、可測試。

## Usage Notes

1. 將共用規則集中於此，模組內部專屬規則仍放在各自的 `modules/<name>/policies/`。
2. 保持輸入輸出簡潔（id、狀態、角色），避免傳遞完整 Entity。
3. 在 Workflow 或 Facade 中先調用政策，拒絕條件時回傳可追蹤的原因碼。 
