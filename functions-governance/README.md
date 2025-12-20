# functions-governance

## 概述
集中治理與設定管理的 Functions codebase，負責 Secrets、Feature Flags、租戶配額與速率限制查詢／控管，確保多租戶安全與成本可控。

## 核心職責
- **Secrets 管理**：統一透過 Secret Manager 取用敏感金鑰，提供安全的讀取介面。
- **Feature Flags**：回傳租戶／環境層級的功能開關，支援漸進式發布。
- **配額與 Rate Limit**：提供租戶級配額、呼叫次數與速率限制查詢，便於前後端節流。
- **合規稽核**：記錄設定讀取／變更的審計事件（搭配 observability）。

## 典型觸發
- **Callable/HTTP**：前端或其他 Functions 查詢設定、flags、配額。
- **Scheduler**：定期輪替金鑰、重新載入配置快取。

## 輸入 / 輸出
- **輸入**：租戶 ID、環境、功能 key、使用者身分。
- **輸出**：設定值、旗標狀態、配額與剩餘量；審計事件寫入 Firestore/Log Sink。

## 成本與安全
- 僅對熱路徑函式設定少量 minInstances，其餘零常駐。
- 秘密全部由 Secret Manager 提供；嚴格身份驗證與租戶隔離。

## 設計原則（高內聚／低耦合／可擴展）
- **功能劃分（高內聚）**：模組聚焦「治理」範疇：Secrets、flags、配額/rate limit；不混入觀測、佇列等其它職責。
- **明確接口（低耦合）**：對外僅暴露 callable/HTTP + 事件輸出（如審計事件）；使用清晰的 request/response schema，避免跨模組直接存取內部資料結構。
- **內部自由（可演進）**：可在模組內更換資料來源（Secret Manager / Firestore / Remote Config）、快取策略或審計存放位置，對外接口保持穩定。
- **事件優先**：設定變更或配額觸發審計事件，供 observability/下游同步；避免同步耦合。
