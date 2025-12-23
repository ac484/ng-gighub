# context-providers

說明
- 提供在呼叫 AI 時需要的上下文資料（例如使用者身份、地區偏好、功能旗標等）。

用途
- 將上下文組合成單一物件，供 prompts 與 adapters 使用。

實作提示
- 儘量使用小型、可組合的 providers（userContext, tenantContext, costControlContext）。
