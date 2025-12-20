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
