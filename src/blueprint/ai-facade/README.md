AI Facade (ai-facade)

簡介
- 本目錄定義並實作 ai-facade 的設計說明與範例。ai-facade 提供給上層 Service/UseCase 一組穩定、可測試且安全的 AI 呼叫介面，實際呼叫由 backend callable Functions 執行。

設計原則
- 不在前端存放或使用任何 provider 金鑰；所有 vendor SDK 呼叫皆由 Cloud Functions 代理。
- 使用 Result pattern 回傳結果（成功/失敗），且每次呼叫需回傳 metadata（model、tokensUsed、requestId、costEstimate）。
- 後端必須強制 model pinning、redaction、per-workspace quota 與 audit logging。

目錄地圖
- `ai.facade.ts` - Facade interface 與前端輕量實作（thin client/validation only）。
- `DESIGN.md` - 設計注意事項與互動範式。
- `adapters/` - 封裝 callable functions 與 vendor SDK 的伺服器端 adapter 介面（server-side 實作在 functions）。
- `context-providers/` - 提供呼叫上下文（workspace, user, consent, locale 等）的定義與 helper。
- `orchestrators/` - 協調複雜任務（如：OCR → extract → review）的邏輯樣版。
- `policies/` - 費用、隱私、敏感內容過濾與回應驗證策略。
- `prompts/` - Prompt 模板、版本與範例（包含 input schema 與 expected output shape）。
- `responses/` - 回應 schema、驗證器與 redaction 規則。

快速上手（開發者導覽）

1. 前端（Angular）
  - 使用 `ai-facade.ts` 中的 interface，只做最小的 prompt validation 與 context 補充（例如 workspaceId）。
  - 不直接呼叫外部 AI 或儲存原始未 redacted 的回應。

2. 後端（Cloud Functions）
  - 在 `functions-ai` 實作 Adapter（例如 `callGenerate()`、`callExtractDocument()`），負責：
    - model pinning 檢核（來自 `ai.modelConfigs`）、quota 與 cost accounting
    - 最終 redaction 與 PII 偵測
    - 寫入 audit log（redacted summary + requestId + costEstimate）
    - 回傳限定欄位給前端（redacted text、model、requestId、costEstimate）

範例（Adapter 伪代碼，server-side）

```ts
// 在 functions-ai 中
export async function callGenerate({ modelId, prompt, workspaceId }) {
  enforceModelPinning(modelId, workspaceId);
  await enforceQuota(workspaceId);
  const redacted = backendRedact(prompt);
  const vendorRes = await vendorClient.generate({ model: modelId, prompt: redacted });
  const cost = estimateCost(vendorRes);
  const summary = redactResult(vendorRes);
  await writeAudit({ workspaceId, requestId: vendorRes.id, summary, cost });
  return { text: summary, model: modelId, requestId: vendorRes.id, costEstimate: cost };
}
```

Prompt 與回應模板（prompts/）
- 每個 prompt 應定義：`id`, `version`, `inputSchema`, `template`, `expectedOutputSchema`。
- 範例：`generate-code-v1`：輸入 { language, spec }，輸出 { files: [{ path, content }], summary }

檢查清單（開發/審核）
- [ ] 前端僅使用 facade interface，無直接 vendor 呼叫。
- [ ] 後端 adapter 實作 model pinning 與 quota 限制。
- [ ] 每次呼叫皆產生 audit entry 並包含 costEstimate。
- [ ] prompts 有版本控制與 schema 驗證。
- [ ] responses 有 schema 驗證與 redaction 策略。

測試
- 對 adapters 提供 mock 介面，使 orchestrator、policies 與 facade 可在單元測試中不依賴外部服務。

下一步
- 我會依序填入 `adapters/`、`context-providers/`、`orchestrators/` 等 README/DESIGN 模板，並提供可直接用於生成代碼的範例 schema 與測試樣板。
-- placeholder --# AI Facade (ai-facade)

簡介
- 此目錄包含 AI Facade 的設計與說明文件，為上層 service 層提供一組穩定、可測試的 AI 呼叫介面。

目的
- 將前端與 AI 後端（例如 `functions-ai` / `functions-ai-document`）的互動統一封裝，避免在 UI 或 service 層直接使用 HTTP/Key 等憑證。

核心準則
- 所有 AI 呼叫必須透過 Firebase Functions（後端）來執行。
- 前端不得包含任何機敏金鑰或直接呼叫外部 AI 服務。
- 遵循三層架構：UI → Service → Repository（或 Facade 作為協調層）。
- 使用 `inject()`、Result pattern、和專案既有的錯誤處理慣例。

後續工作
- 實作 `ai-facade.ts` 中的具體方法，並在 `adapters/`、`orchestrators/`、`prompts/` 等子目錄逐步填入實作。
