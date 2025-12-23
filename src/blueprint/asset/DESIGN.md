## Asset 模組設計概要

**角色**：檔案/附件生命週期管理，僅暴露 Facade，事件驅動，對外提供 AssetId。

**責任**
- 驗證檔案政策（大小/型態/擁有者）。
- 維護狀態，發布 `asset.<fact>` 事件（如 `asset.uploaded`）。
- 透過 Infrastructure Facade（Cloud）上傳/讀取，不耦合 Domain。

**邊界**
- ❌ 不耦合特定業務模組（Contract/Task 等僅存 AssetId）。
- ❌ 不直接存取其他模組或 Repository。
- ✅ 只透過 Facade 指令，Service 發事件，Policy 驗證。

**常見流程**
1) `AssetFacade.upload(file, ownerId, ownerType)`  
2) Policy 檢查 → CloudFacade 上傳 → 更新狀態 → 發布 `asset.uploaded`  
3) 訂閱方（如 Contract）據事件更新自身狀態。

**稽核/安全**
- 高風險動作寫入 Audit（上傳/刪除/封存）。
- 僅授權角色可上傳/刪除，並可加速率限制。
