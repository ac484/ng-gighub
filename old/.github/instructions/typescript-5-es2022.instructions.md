```instructions
---
description: 'TypeScript 開發指引，目標為 TypeScript 5.x 並編譯為 ES2022 (繁體中文翻譯)'
applyTo: '**/*.ts'
---

# TypeScript 開發

> 本指引假設專案以 TypeScript 5.x（或更新版本）建置，目標 JavaScript 為 ES2022。如執行環境需支援較舊目標或降級轉譯，請據實調整。

## 核心意圖

- 尊重現有架構與程式碼標準。
- 偏好可讀且明確的解法，勝於花俏的技巧。
- 在擴充既有抽象前，先嘗試延伸現有實作。
- 優先可維護性與清晰度；方法與類別維持短小、程式碼乾淨。

## 一般規範

- 目標為 TypeScript 5.x / ES2022，盡量使用原生語法功能而非 polyfill。
- 使用純 ES 模組，避免輸出 `require`、`module.exports` 或 CommonJS helper。
- 依賴專案的建置、lint 與測試腳本，除非另有指定。
- 當意圖不明顯時，註明設計權衡。

## 專案組織

- 遵循倉庫現有的目錄與責任劃分來新增程式碼。
- 檔名使用 kebab-case（例如 `user-session.ts`、`data-service.ts`），除非另有指示。
- 測試、型別與輔助工具放置於靠近實作的位置，利於發現與維護。
- 先重用或擴充共用工具，避免新增不必要的工具程式。

## 命名與風格

- 類別、介面、列舉與型別別名使用 PascalCase；其他採用 camelCase。
- 不要加介面前綴 `I`，以描述性名稱替代。
- 以行為或領域意義命名，而非實作細節。

## 格式化與風格

- 在提交前執行專案的 lint/format 腳本（例如 `npm run lint`）。
- 配合專案的縮排、引號與尾逗號規則。
- 保持函式單一職責；當分支複雜時抽出輔助函式。
- 優先使用不可變資料與純函式（當可行時）。

## 型別系統期望

- 避免使用 `any`（隱式或顯式）；偏好 `unknown` 並在使用前縮窄型別。
- 對即時事件與狀態機使用判別聯合（discriminated unions）。
- 將共用契約集中管理，避免重複型別定義。
- 使用 TypeScript 工具型別（例如 `Readonly`、`Partial`、`Record`）以表達意圖。

## 非同步、事件與錯誤處理

- 使用 `async/await`；在 await 周遭以 try/catch 包裹並回傳結構化錯誤。
- 提早處理邊界情況以避免巢狀過深。
- 使用專案的日誌/遙測工具記錄錯誤。
- 將面向使用者的錯誤透過專案的通知模式曝露。
- 對於需要防抖的配置更新採用 debounce，且確保資源可確定地釋放。

## 架構與設計模式

- 遵循倉庫現有的相依注入或組合模式；保持模組單一職責。
- 在接入生命週期時，遵守現有的初始化與釋放順序。
- 使運輸層、領域層與呈現層有明確界限，並以清晰介面隔離。
- 若新增服務，提供初始化 (`initialize`) 與釋放 (`dispose`) 等生命週期鈎子，並包含對應測試。

## 外部整合

- 將客戶端實例化放在非熱路徑（non-hot paths），並以注入方式使其可測試。
- 切勿硬編碼祕密；從安全來源載入。
- 對網路或 IO 呼叫實作重試、退避與取消機制。
- 正規化外部回應並將錯誤對應到領域型別。

## 安全實務

- 使用 schema 驗證器或型別守衛驗證與消毒外部輸入。
- 避免動態程式碼執行或不受信任的模板渲染。
- 對不受信任的內容在輸出 HTML 前做編碼；使用框架的逃逸機制或 trusted types。
- 對資料庫查詢使用參數化或預備語句以防注入攻擊。
- 將祕密保存在安全儲存並定期輪替，並以最小權限原則要求存取範圍。
- 對敏感資料採用不可變流程與防禦性複製。

## 設定與祕密管理

- 透過共用 helper 獲取設定，並以 schema 或驗證器驗證設定值。
- 將祕密透過專案的安全儲存存放；處理 `undefined` 與錯誤情境。
- 文件化新增的設定鍵並在測試中更新相對應項目。

## UI 與使用者體驗元件

- 在渲染前消毒使用者或外部內容。
- 保持 UI 層薄化；將繁重邏輯交由服務或狀態管理處理。
- 使用事件或訊息機制解耦 UI 與商業邏輯。

## 測試期望

- 使用專案的測試框架新增或更新單元測試，並遵守命名慣例。
- 當行為跨越模組或平台 API 時，擴充整合或端對端測試。
- 在提交前執行目標測試腳本以取得快速回饋。
- 避免脆弱的時間相關斷言；優先使用假時鐘或注入的時鐘。

## 效能與可靠性

- 延遲載入大型相依並在完成後釋放資源。
- 延後昂貴工作至使用者需要時執行。
- 對高頻率事件做批次或防抖以減少抖動。
- 追蹤資源生命週期以避免記憶體或資源洩漏。

## 文件與註解

- 為公開 API 新增 JSDoc；必要時以 `@remarks` 或 `@example` 提供範例。
- 撰寫能說明意圖的註解，並在重構時移除過時註解。
- 在引入重要設計模式時更新架構或設計文件。

```
---
description: 'Guidelines for TypeScript Development targeting TypeScript 5.x and ES2022 output'
applyTo: '**/*.ts'
---

# TypeScript Development

> These instructions assume projects are built with TypeScript 5.x (or newer) compiling to an ES2022 JavaScript baseline. Adjust guidance if your runtime requires older language targets or down-level transpilation.

## Core Intent

- Respect the existing architecture and coding standards.
- Prefer readable, explicit solutions over clever shortcuts.
- Extend current abstractions before inventing new ones.
- Prioritize maintainability and clarity, short methods and classes, clean code.

## General Guardrails

- Target TypeScript 5.x / ES2022 and prefer native features over polyfills.
- Use pure ES modules; never emit `require`, `module.exports`, or CommonJS helpers.
- Rely on the project's build, lint, and test scripts unless asked otherwise.
- Note design trade-offs when intent is not obvious.

## Project Organization

- Follow the repository's folder and responsibility layout for new code.
- Use kebab-case filenames (e.g., `user-session.ts`, `data-service.ts`) unless told otherwise.
- Keep tests, types, and helpers near their implementation when it aids discovery.
- Reuse or extend shared utilities before adding new ones.

## Naming & Style

- Use PascalCase for classes, interfaces, enums, and type aliases; camelCase for everything else.
- Skip interface prefixes like `I`; rely on descriptive names.
- Name things for their behavior or domain meaning, not implementation.

## Formatting & Style

- Run the repository's lint/format scripts (e.g., `npm run lint`) before submitting.
- Match the project's indentation, quote style, and trailing comma rules.
- Keep functions focused; extract helpers when logic branches grow.
- Favor immutable data and pure functions when practical.

## Type System Expectations

- Avoid `any` (implicit or explicit); prefer `unknown` plus narrowing.
- Use discriminated unions for realtime events and state machines.
- Centralize shared contracts instead of duplicating shapes.
- Express intent with TypeScript utility types (e.g., `Readonly`, `Partial`, `Record`).

## Async, Events & Error Handling

- Use `async/await`; wrap awaits in try/catch with structured errors.
- Guard edge cases early to avoid deep nesting.
- Send errors through the project's logging/telemetry utilities.
- Surface user-facing errors via the repository's notification pattern.
- Debounce configuration-driven updates and dispose resources deterministically.

## Architecture & Patterns

- Follow the repository's dependency injection or composition pattern; keep modules single-purpose.
- Observe existing initialization and disposal sequences when wiring into lifecycles.
- Keep transport, domain, and presentation layers decoupled with clear interfaces.
- Supply lifecycle hooks (e.g., `initialize`, `dispose`) and targeted tests when adding services.

## External Integrations

- Instantiate clients outside hot paths and inject them for testability.
- Never hardcode secrets; load them from secure sources.
- Apply retries, backoff, and cancellation to network or IO calls.
- Normalize external responses and map errors to domain shapes.

## Security Practices

- Validate and sanitize external input with schema validators or type guards.
- Avoid dynamic code execution and untrusted template rendering.
- Encode untrusted content before rendering HTML; use framework escaping or trusted types.
- Use parameterized queries or prepared statements to block injection.
- Keep secrets in secure storage, rotate them regularly, and request least-privilege scopes.
- Favor immutable flows and defensive copies for sensitive data.
- Use vetted crypto libraries only.
- Patch dependencies promptly and monitor advisories.

## Configuration & Secrets

- Reach configuration through shared helpers and validate with schemas or dedicated validators.
- Handle secrets via the project's secure storage; guard `undefined` and error states.
- Document new configuration keys and update related tests.

## UI & UX Components

- Sanitize user or external content before rendering.
- Keep UI layers thin; push heavy logic to services or state managers.
- Use messaging or events to decouple UI from business logic.

## Testing Expectations

- Add or update unit tests with the project's framework and naming style.
- Expand integration or end-to-end suites when behavior crosses modules or platform APIs.
- Run targeted test scripts for quick feedback before submitting.
- Avoid brittle timing assertions; prefer fake timers or injected clocks.

## Performance & Reliability

- Lazy-load heavy dependencies and dispose them when done.
- Defer expensive work until users need it.
- Batch or debounce high-frequency events to reduce thrash.
- Track resource lifetimes to prevent leaks.

## Documentation & Comments

- Add JSDoc to public APIs; include `@remarks` or `@example` when helpful.
- Write comments that capture intent, and remove stale notes during refactors.
- Update architecture or design docs when introducing significant patterns.
