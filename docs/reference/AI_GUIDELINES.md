# SDK 用法建議（對應場景）

本節說明三個官方 Node.js 客戶端在本系統中建議的使用場景與適用情境。所有呼叫仍應透過 Cloud Functions（AI Facade）代理，並依照本文件其他章節強制執行 pinning、redaction、quota、audit 與 metrics。

## 目錄結構範例（前端 + Cloud Functions）

```text
Frontend (Angular)
├─ src/app/routes/ai-assistant/         # UI 入口，呼叫 Facade 而非直接 SDK
├─ src/app/core/facades/ai/             # Facade：協調 service、data-access
├─ src/app/core/services/ai/            # Quota / policy / redaction 客戶端協調
└─ src/app/core/data-access/ai/         # 呼叫 Cloud Functions 的封裝

Backend (Cloud Functions)
├─ functions-ai/src/functions/          # callable / https endpoints（唯一入口）
├─ functions-ai/src/services/           # SDK adapter + vendor 選擇器
├─ functions-ai/src/config/             # model pinning / quota / routing
└─ functions-ai/src/utils/              # redaction / logging / metrics helper
```

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

## 實作檢查清單（Checklist）

- [ ] 所有前端呼叫都透過 `functions-ai` callable functions（或其他受控 Functions）。
- [ ] Facade 層實作 adapter 並抽離 SDK 初始化與密鑰。前端只呼叫 Facade。 
- [ ] Model pinning 已在 `ai.modelConfigs` 中設定並不可由用戶輸入自由變更。
- [ ] 所有輸入皆執行 redaction hints，並在後端再次執行強制 redaction 與 PII 去標識。
- [ ] 每次呼叫都產生 audit entry（redacted summary + correlationId + cost estimate），並匯出 metrics。
- [ ] 配置 per-workspace quota、rate limiting 與 cost accounting（traceable 到 workspace）。
- [ ] 在後端為高風險 prompt 建立人工審查（review queue）或顯示風險標記。

## 簡易 Adapter 範例（伪代碼）

```ts
// adapter.ts (server-side)
export async function callGenerate({ modelId, prompt, workspaceId }) {
  // 1. select client based on modelId
  // 2. enforce model pinning, quota, and redaction
  // 3. call vendor SDK (@google/genai / vertexai / aiplatform)
  // 4. record audit + metrics + cost
  // 5. return redacted result + metadata
}
```

## 參考與安全要點

- 將 AI 回應視為不可信資料：在任何會改變 Domain 或觸發外部動作前，務必以 Domain 規則與人工/自動驗證再次確認。
- 避免在前端執行敏感 redaction（僅作 UX 輔助），最終 redaction 應在後端強制執行並日誌化。
- 若需保存 raw data（例如 for analytics），需征得使用者同意並限制保留週期與存取權限。
