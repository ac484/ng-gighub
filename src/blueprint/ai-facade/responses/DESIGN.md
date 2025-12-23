# responses - Design

責任
- 定義回應 schema、驗證與錯誤分類。

建議
- 對於關鍵欄位使用嚴格型別與 schema 驗證；對於自由文本使用安全的清理流程。

回傳 metadata
- 建議每次回應包含：`model`, `promptVersion`, `tokensUsed`, `requestId`。
