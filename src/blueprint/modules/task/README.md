## Task 模組總覽

Task 模組提供任務生命週期、狀態與多視圖呈現（Tree、Tree List、Gantt、Calendar、Timeline）。互動遵循 Blueprint/MODULE Layer 鐵律：對外僅透過 Facade，事件命名 `<module>.<fact>`，所有操作需攜帶 Workspace/Blueprint Context。

### 職責
- 管理任務模型（WBS 欄位、狀態、依賴、負責人、期限）。
- 提供多視圖資料投影（樹狀、表格、甘特、日曆、時間線）。
- 發布任務事件（`task.created`、`task.updated`、`task.deleted`、`task.resequenced` 等）。

### 邊界
- ❌ 不直接存取其他模組 Repository/Service。
- ❌ 不實作跨模組流程（交由 workflow/）。
- ✅ 僅透過 Facade 指令與事件互動，需經 policies 驗證與 guards。

### 目錄（摘要）
- `DESIGN.md`：詳細設計、視圖與資料模型。
- `models/`：任務核心模型、WBS 欄位。
- `states/`：任務狀態與轉移表。
- `services/`：任務行為、狀態轉移、事件發布。
- `repositories/`：資料存取介面與實作。
- `events/`：`task.<fact>` 事件定義。
- `policies/`：任務建立/編輯/刪除/排序/分享前置檢查。
- `facade/`：唯一對外入口（CRUD、排序、視圖查詢）。
- `config/`、`module.metadata.ts`、`task.module.ts`：設定與 DI。
