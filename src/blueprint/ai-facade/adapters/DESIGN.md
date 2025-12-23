# adapters - Design

責任
- 封裝 callable functions，處理輸入驗證、輸出解析、錯誤轉換、與重試策略。

設計要點
- Adapter 僅定義契約（interface），實際 vendor 呼叫應在 Cloud Functions 中以 provider 實作。
- 輸入/輸出皆使用明確 schema，並對錯誤分類（Transient / Permanent / RateLimit）。
- 不在 Adapter 中處理業務邏輯；Adapter 的錯誤應轉成上層可理解的錯誤型別。

接口（範例）
```ts
export interface FunctionsAdapter {
  callAiFunction<T = unknown>(name: string, payload: unknown): Promise<{ ok: true; value: T } | { ok: false; error: { code: string; message: string } }>;
}
```

錯誤與重試策略
- 對 transient network errors 實作有限次重試與 exponential backoff。
- 對 429 / quota 錯誤回傳特定 error.code 以便上層策略採取速率限制或 queue。

序列化與版本化
- 所有 payload 與 response schema 應含 `v` 或 `version` 欄位，以便未來升級與兼容處理。

測試
- 提供可注入的 mock adapter（mocks.ts），並在 CI 中加入一組合約測試，驗證 callAiFunction 的 contract 未變。
# adapters - Design

責任
- 封裝與 Firebase Functions 的 callable 呼叫。
- 處理輸入驗證、輸出解析、以及錯誤轉換。

接口範例
```ts
interface FunctionsAdapter {
  callAiFunction(name: string, payload: unknown): Promise<AdapterResult>;
}
```

重試與退避
- 在短暫性失敗時實作有限次重試與指數退避。

測試
- 使用 stub 函數回傳已知的結果以驗證上層 orchestrator。
