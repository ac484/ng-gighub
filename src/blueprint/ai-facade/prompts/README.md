# Prompts

用途
- 儲存可重用的 prompt 模板（含變數與 schema），並提供版本化與安全填充機制。

Prompt 模板結構（範例）
```json
{
  "id": "generate-code-v1",
  "version": 1,
  "inputSchema": { "type": "object", "properties": { "language": {"type":"string"}, "spec":{"type":"string"} }, "required": ["language","spec"] },
  "template": "Generate a {language} project that does: {spec} ...",
  "costEstimate": { "tokens": 200 }
}
```

安全填充規則
- 只允許從 `AICallContext` 的白名單欄位填充進入 prompt；敏感欄位必須先標記並由後端 redaction。

版本管理
- 每次重大改動（output structure 或 behaviour）增加 `version`。執行時在 audit log 中記錄 promptId + promptVersion。
-- placeholder --# prompts

說明
- 儲存與管理 prompt 模板、示例與版本資訊。可包含模板變數與填充工具。

實作提示
- 將 prompt 與其 metadata（用途、版本、成本估計）一同儲存。
- 提供安全檢查以避免將敏感資料直接注入 prompt。
