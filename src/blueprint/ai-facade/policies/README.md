# Policies

用途
- 包含呼叫前（pre）與呼叫後（post）策略，例如輸入過濾、PII redaction、cost-control、model-selection 與回應驗證。

實作風格
- 建議以純函式或 middleware pattern 實作：每個 policy 接受 context 與 payload，返回可能被修改的 payload 或 error。

介面範例
```ts
export type PolicyResult<T> = { ok: true; value: T } | { ok: false; error: Error };

export interface Policy<T> { apply(input: T, ctx: AICallContext): Promise<PolicyResult<T>> }
```

常見實作
- `CostControlPolicy`：根據 workspace plan 決定模型或拒絕請求。
- `PrivacyFilterPolicy`：標記與遮蔽 PII。
- `ResponseValidationPolicy`：檢查回應是否符合 expectedOutputSchema。

測試
- 對每個 policy 寫單元測試，使用多種 context 驗證過濾與拒絕邏輯。
# policies

說明
- 放置呼叫前/後處理策略，例如：輸入過濾、敏感資料遮蔽、費用/速率控制、回應驗證。

實作提示
- 將策略實作為可組合的 middleware，並在 orchestrator 中注入。
