## Modules in Blueprint

`modules/` 放置具有明確業務語意與完整生命週期的 Domain 模組，每個模組依 `MODULE_LAYER.md` 的標準骨架實作：`models/`、`states/`、`services/`、`repositories/`、`events/`、`policies/`、`facade/`、`config/`、`module.metadata.ts` 與 `README.md`。

## Core Principles

- 模組只做兩件事：發事件（事實）與訂閱事件（反應）。跨模組互動只能透過事件、Facade 指令或 Query。
- 不直接存取其他模組的 Repository 或 Service；外部僅能呼叫本模組 Facade。
- 事件命名必須以模組為前綴並描述已發生的事實（例：`task.completed`）。

## Adding a New Module

1. 依骨架建立資料夾並補齊模組 README 與 `module.metadata.ts`。
2. 在 Service 中集中狀態轉移並發布 Domain Event，政策驗證優先於寫入。
3. Facade 是唯一對外入口，負責驗證輸入、調用 Service、傳回結果。
4. 若需跨模組一致性或高風險流程，將規則放入 `policies/` 或透過 `workflow/` 協調。

更多互動規則與檢查表請參考 `MODULE_LAYER.md`。
