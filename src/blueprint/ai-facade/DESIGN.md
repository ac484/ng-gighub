# ai-facade - Design notes

目標
- 定義 ai-facade 的責任範圍、子系統、以及與 Firebase Functions 的互動模式。

責任
- 提供乾淨、可測試的介面供 service 層呼叫 AI 能力。
- 隱藏 network/formatting/prompt 管理與重試邏輯。

子系統概觀
- adapters/: 後端呼叫適配層（callable functions wrappers、序列化/反序列化）。
- context-providers/: 提供呼叫時所需上下文（使用者、項目、隱私設置等）。
- orchestrators/: 協調多步驟 AI 任務（例如：OCR → 解析 → 審核）。
- policies/: 呼叫與輸出處理策略（費用控制、敏感資料過濾、回應驗證）。
- prompts/: 儲存與版本化的 prompt 模板與示例。
- responses/: 回應格式定義與驗證器。

互動模式
- 前端呼叫 `aiFacade` 中的高階方法。
- facade 透過 `adapters` 呼叫 Firebase callable functions（functions-ai）。
- 回傳值採用 Result pattern 並包含可驗證的 metadata（model, tokensUsed, requestId）。

安全與成本考量
- 不在前端存放任何 API Key。
- 支援速率限制、batching 與抽樣，以控制成本。

測試
- 為 adapters 提供 mockable interface，允許在單元測試中以假回應驗證 orchestrator 與 policies。
