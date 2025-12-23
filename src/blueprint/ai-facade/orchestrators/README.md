# Orchestrators

用途
- 本資料夾包含協調多階段 AI 任務的工作流程實作樣板（例如：上傳 → OCR → 解析 → 審核 → 儲存）。

設計要點
- 將複雜工作流程拆為小步驟，每步驟有明確的輸入/輸出（可用 TypeScript 型別描述）。
- Orchestrator 應注入 Adapter、ContextProvider 與 Policy，並以小段可重試/補償的單元執行。

範例：簡單 OCR 工作流程（伪代碼）
```ts
async function processUploadedImage({ gcsUri, context, adapter, policies }) {
  const upload = await adapter.callExtractDocument({ gcsUri, workspaceId: context.workspaceId });
  if (!upload.ok) return { ok: false, error: upload.error };

  const parsed = await prompts.parseOCR(upload.value.summary);
  const valid = policies.validateParsed(parsed);
  if (!valid.ok) return { ok: false, error: valid.error };

  await repository.saveParsed(context.workspaceId, parsed);
  return { ok: true, value: { id: parsed.id } };
}
```

測試
- 使用 mock adapter 驗證 orchestrator 在成功/失敗/重試情境下的行為。
# orchestrators

說明
- 此資料夾包含協調多階段 AI 任務的邏輯（例如：影像上傳 → OCR → 結果解析 → 回寫）。

用途
- 將多個 adapters、prompts 與 policies 組合，形成可重用的工作流程。

實作提示
- 以小型步驟拆解流程，並為每步驟定義明確的輸入/輸出契約。
