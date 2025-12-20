# functions-observability

## 概述
集中可觀測性與審計的 Functions codebase，提供 log/metrics/trace 標準化，並將關鍵事件匯出至 Cloud Logging/Monitoring、BigQuery（或其他 sink），支援容量與成本監控。

## 核心職責
- **統一 Logger/Tracer**：封裝結構化日誌、追蹤 ID、租戶／請求上下文。
- **審計事件匯出**：登入、敏感資料存取、配置變更等事件集中留存。
- **指標聚合**：成本與性能指標（QPS、延遲、錯誤率、AI 調用次數、外部 API 成本）匯總並告警。
- **告警路由**：將閾值告警送往 ChatOps / Email / Pager。

## 典型觸發
- **Callable/HTTP**：收集上報事件或查詢觀測資料。
- **Pub/Sub**：接收其他 codebase 推送的審計／metrics 事件並批次匯出。
- **Scheduler**：定期彙總並落地 BigQuery/Storage。

## 輸入 / 輸出
- **輸入**：事件 payload（log/metric/audit）、租戶與追蹤資訊。
- **輸出**：指標至 Monitoring，審計至 BigQuery/Storage/Log Sink，告警至通知渠道。

## 成本與安全
- 盡量批次寫入與壓縮；使用 Pub/Sub 平滑尖峰。
- 僅暴露必要查詢接口並驗證租戶／權限；敏感審計資料加上存取控管。
