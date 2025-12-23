# Adapters

用途
- 本資料夾包含前端/Facade 與後端 callable Functions（`functions-ai`）之間的 adapter 介面與範例實作。Adapter 應只描述呼叫契約，不執行 vendor SDK（vendor 呼叫於 Functions 中實作）。

目標
- 統一 callable payload/response shape
- 將 vendor error 轉換為 domain-friendly error
- 提供 mockable interface 以便單元測試

建議檔案
- `index.ts` — 導出 Adapter 介面與 factory
- `functionsAdapter.ts` — callable functions wrapper types + helper
- `mocks.ts` — 測試用的 mock adapter

範例：Adapter 介面
```ts
export type AdapterResult<T> = { ok: true; value: T } | { ok: false; error: Error };

export interface AiAdapter {
  callGenerate(payload: { prompt: string; modelId: string; workspaceId?: string }): Promise<AdapterResult<{ text: string; model: string; requestId: string; costEstimate?: number }>>;
  callExtractDocument(payload: { gcsUri: string; workspaceId?: string }): Promise<AdapterResult<{ summary: string; entities?: Record<string, any> }>>;
}
```

Mock 範例
```ts
export const mockAdapter: AiAdapter = {
  async callGenerate(_) { return { ok: true, value: { text: 'mock', model: 'mock-v1', requestId: 'r-123' } }; },
  async callExtractDocument(_) { return { ok: true, value: { summary: 'mock summary' } }; }
};
```

測試提示
- 在 orchestrator 與 policies 的單元測試注入 `mockAdapter`，以驗證流程與錯誤處理。
# adapters

說明
- 此資料夾放置與後端 callable functions（`functions-ai`）互動的適配器。

用途
- 封裝 callable function 的輸入/輸出、序列化、錯誤轉換與重試策略。

實作提示
- 提供 interface/型別，並在測試時以 mock 替換。
- 不要在此層硬編碼任何金鑰或憑證。
