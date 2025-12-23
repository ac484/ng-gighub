## Asset Module Purpose

`asset/` 負責檔案與附件的完整生命週期管理，提供上傳、狀態更新、事件發布與政策驗證。其他模組只存 AssetId，不直接處理檔案。

## Responsibilities

- 驗證檔案政策（大小、型態、擁有者）。
- 透過 Infrastructure Facade（如 Cloud）完成上傳與存取。
- 維護檔案狀態並發布 `asset.<fact>` 事件（例：`asset.uploaded`）。
- 提供 Facade 供模組或 Workflow 呼叫。

## Boundaries

- ❌ 不耦合特定業務模組（Contract/Task/Issue 等只持有 AssetId）。
- ❌ 不內嵌 UI 或權限邏輯，權限判斷交由政策層。
- ✅ 事件與狀態變更集中在 Service；外部只能透過 Facade 指令。

## Quick Usage

1. 呼叫 `AssetFacade.upload(file, ownerId, ownerType)` 完成上傳。
2. Service 發布 `asset.uploaded` 事件，由需要的模組訂閱並更新自身狀態。
3. 若需跨模組限制（如合約未生效不得上傳），在 `policies/` 撰寫共用規則或於 Workflow 判斷。

更多設計細節與骨架請參考 `BLUEPRINT_LAYER.md` 的 Asset 範例。 
