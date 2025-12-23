# SDK 用法建議（對應場景）

本節說明三個官方 Node.js 客戶端在本系統中建議的使用場景與適用情境。所有呼叫仍應透過 Cloud Functions（AI Facade）代理，並依照本文件其他章節強制執行 pinning、redaction、quota、audit 與 metrics。

## @google/genai
- 最適合：聊天/對話（chat sessions）、短文本生成、embeddings（若支援）、以及需要高階 GenAI helper 的快速互動體驗。
- 場景：以 User‑Facing 為優先；亦可在需要高階對話管理或快速向量查詢時使用於內部服務。  
- 要點：
  - 適合低延遲同步回應路徑（短 prompt、互動式 UI）。
  - 方便管理多輪對話狀態與 session-oriented 呼叫。
  - 請在 Facade 層做嚴格 redaction、token 計費回寫與 per-workspace quota 檢查。

## @google-cloud/vertexai
- 最適合：需要較完整的 Vertex 平台管理能力與官方整合功能（例如高級 chat/生成 API、session 管理、endpoint 操作）。
- 場景：User‑Facing 或 Analytics 均可使用，依你對官方 API 的需要（例如更細節的 endpoint 控制、較新平台功能）選擇是否使用此 SDK。
- 要點：
  - 適合需要更多平台控制或官方支援新功能的場景。
  - 可用於同步或非同步呼叫，但若需 batch/Job 管理，通常搭配 @google-cloud/aiplatform。
  - 在 Facade 中以 adapter pattern 包裝，以便未來切換或混合使用。

## @google-cloud/aiplatform
- 最適合：Batch prediction、大量/離線推論、Custom model endpoints、以及 Job 管理（Training / BatchPredict / JobService）。
- 場景：Analytics（大量批次/離線預測）、長任務、模型管理與 batch pipelines 的首選。
- 要點：
  - 適合提交長時間運行或大規模資料處理的 Job。
  - 結果通常輸出至 GCS / BigQuery，並在 Firestore 保存 job metadata 與摘要。
  - 需明確管理計算資源、預算與輸出格式（Parquet/NDJSON 等）。

## 實作建議（簡要）
- Adapter/Provider：在 AI Facade 實作一個選擇器（selectClientForModel）與呼叫封裝（callModel），根據 modelId 或 model-config 決定使用哪個 SDK，避免在多處重複初始化或商業邏輯散落。
- Model Pinning：所有請求必須帶 concrete modelId（不要使用 "latest"），model→client mapping 建在 Firestore 的 `ai.modelConfigs`。
- 分離責任：User‑Facing 與 Analytics Facade 應分開（不同 service account、不同 quota/retention/alerting），以降低合規與成本風險。
- 日誌與儲存：User‑Facing 預設只保存 redacted summary + hash；Analytics 若需保存 raw，須有 explicit consent 與合規控制（CMEK、retention policy）。