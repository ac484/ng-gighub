# responses - Design

目標
- 以結構化方式定義回應，並在後端強制驗證與 redaction，避免不受信任內容進入系統。

回應 metadata
- 每次回應應包含 `model`, `promptVersion`, `tokensUsed`, `requestId` 以利審計與成本核算。

驗證流程
- Step 1: vendor raw → Step 2: schema validation（zod / ajv）→ Step 3: post-redaction → Step 4: normalize

兼容性
- 若不同 vendor 回傳格式不同，提供 vendor-specific normalizer 並在 normalize 後統一回傳 domain 型別。
# responses - Design

責任
- 定義回應 schema、驗證與錯誤分類。

建議
- 對於關鍵欄位使用嚴格型別與 schema 驗證；對於自由文本使用安全的清理流程。

回傳 metadata
- 建議每次回應包含：`model`, `promptVersion`, `tokensUsed`, `requestId`。
