# functions-orchestration

## 概述
負責工作佇列、重試與補償流程的 Functions codebase，使用 Pub/Sub + Cloud Tasks 提供可靠的事件管線與 DLQ，確保 AI、外部整合在高流量下仍可穩定運作。

## 核心職責
- **佇列與 DLQ**：為事件、AI 任務、外部 Webhook 提供主隊列與死信隊列。
- **重試與退避**：統一重試策略（指數退避、最大次數）與去重。
- **補償/對賬**：失敗任務的恢復、人工重放或對賬流程。
- **流量整形**：對外呼叫的速率限制與批次化，避免爆量時連鎖故障。

## 典型觸發
- **Pub/Sub**：主隊列、DLQ 消費；事件分類轉發。
- **Cloud Tasks**：具體工作執行（AI 調用、外部 API）。
- **Scheduler**：定期巡檢 DLQ、觸發補償或重放。

## 輸入 / 輸出
- **輸入**：事件/任務 payload、租戶上下文、優先級。
- **輸出**：執行結果、狀態記錄（submitted/processing/succeeded/failed）、DLQ 記錄。

## 成本與安全
- 用 Pub/Sub 平滑尖峰，避免 Functions 熱路徑爆量；批次與速率限制降低外部 API 成本。
- 任務包含租戶與追蹤 ID，執行前校驗權限；敏感資料不落 payload，必要時用短期 token。
