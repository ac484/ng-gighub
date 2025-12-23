## Blueprint Layer Overview

Blueprint 層只負責「事件、規則與流程」，不承載任何業務語意或資料結構。請搭配 `BLUEPRINT_LAYER.md` 與 `MODULE_LAYER.md` 一起閱讀，遵守「模組把事做好、Blueprint 把事情串起來」的分工。

## Directory Map

- `modules/`：業務模組聚合根、狀態、事件與 Facade，遵循 `MODULE_LAYER.md` 的骨架與互動鐵律。
- `asset/`：檔案與附件的生命週期管理，提供 Facade、事件與政策，不直接依賴其他模組資料。
- `event-bus/`：事件發布、訂閱與分派中樞，確保事件結構一致、可追蹤且可重試。
- `workflow/`：跨模組協調器，處理高風險或需要補償的多步驟流程，僅決定下一步要叫誰做事。
- `audit/`：不可變的歷史紀錄層，記錄手動操作與重要狀態變更，供追蹤與問責。
- `policies/`：跨模組一致性規則與限制條件，回覆「可不可以」，不執行流程。

## Operating Principles

- Blueprint 層不直接操作 Domain 資料，也不決定單一模組的業務邏輯。
- 模組之間只允許 Facade、事件或查詢式互動，禁止跨模組直接存取 Repository 或 Service。
- 事件必須描述已發生的事實（`<module>.<fact>`），Payload 僅包含識別資訊。
- 高風險或需要補償的流程交由 `workflow/` 管理，並透過 Event Bus 推進。
- 所有手動節點需留下稽核紀錄，政策與權限邏輯集中在 `policies/`。

## Getting Started

1. 新增模組：依 `MODULE_LAYER.md` 的標準骨架建立 `modules/<name>/`，只開放 Facade 對外。
2. 定義事件：由模組 Service 發布到 `event-bus/`，維持一致的事件命名與追蹤資訊。
3. 建立流程：僅在跨模組、高風險情境下新增 Workflow，負責決定下一個指令型事件。
4. 補齊政策與稽核：共用規則寫在 `policies/`，所有手動操作需經 `audit/` 記錄。

更多細節請參考 `BLUEPRINT_LAYER.md` 與各資料夾內的 README。
