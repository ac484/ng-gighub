# prompts - Design

目標
- 定義 prompt 模板的 schema、填充管道、以及版本與審計要求。

填充／安全管道
- Step 1: 從 prompt template 讀取 `inputSchema` 並驗證 incoming payload
- Step 2: 從 `AICallContext` 只允許白名單欄位填充
- Step 3: 在後端執行 final redaction，然後呼叫 vendor

審計
- 在 audit log 中紀錄 promptId、promptVersion、inputHash、redactionSummary 與 modelId。

回退策略
- 當 promptVersion 變更導致回應結構差異時，提供 migration 或 compatibility layer 以免破壞舊流程。
# prompts - Design

責任
- 定義 prompt 結構、版本管理與安全填充規則。

範例
- 使用 template strings 並在填充前進行 context 白名單/黑名單檢查。

版本化
- 每次 prompt 重大修改須增加版本號，並在回應紀錄中包含 promptVersion。
