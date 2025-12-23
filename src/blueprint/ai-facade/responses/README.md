# Responses

用途
- 定義 AI 回應的 schema、驗證器、redaction 與至 domain model 的轉換器。

建議型別（範例）
```ts
export interface AIResponseMeta { model: string; promptVersion?: number; tokensUsed?: number; requestId?: string }
export interface GenerateTextOutput { text: string; meta: AIResponseMeta }
```

驗證
- 使用 JSON Schema 或 zod 類型在後端驗證原始回應，並在必要時進行 redaction。

轉換
- 提供 `normalizeResponse(raw)` helper，將 vendor raw output 轉為 `GenerateTextOutput` 並回傳 { ok, value | error }。
# responses

說明
- 定義 AI 回應的 schema、驗證器與轉換工具（raw → domain model）。

實作提示
- 使用 JSON schema 或 TypeScript 型別進行結構驗證。
