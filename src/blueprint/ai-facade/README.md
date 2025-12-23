-- placeholder --# AI Facade (ai-facade)

簡介
- 此目錄包含 AI Facade 的設計與說明文件，為上層 service 層提供一組穩定、可測試的 AI 呼叫介面。

目的
- 將前端與 AI 後端（例如 `functions-ai` / `functions-ai-document`）的互動統一封裝，避免在 UI 或 service 層直接使用 HTTP/Key 等憑證。

核心準則
- 所有 AI 呼叫必須透過 Firebase Functions（後端）來執行。
- 前端不得包含任何機敏金鑰或直接呼叫外部 AI 服務。
- 遵循三層架構：UI → Service → Repository（或 Facade 作為協調層）。
- 使用 `inject()`、Result pattern、和專案既有的錯誤處理慣例。

後續工作
- 實作 `ai-facade.ts` 中的具體方法，並在 `adapters/`、`orchestrators/`、`prompts/` 等子目錄逐步填入實作。
