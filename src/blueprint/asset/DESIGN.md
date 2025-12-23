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

## 目錄結構與用途

```
asset/
├─ models/            # Asset Entity / Value Object 定義
├─ states/            # 資產狀態與轉移表
├─ services/          # 生命週期行為、事件發布
├─ repositories/      # 資料存取抽象（對 Cloud/DB）
├─ events/            # asset.<fact> 事件定義
├─ policies/          # 檔案/權限檢查（僅限本模組）
├─ facade/            # 對外唯一入口（upload/delete/封存）
├─ config/            # 模組設定
├─ module.metadata.ts # 模組描述（事件、能力）
├─ asset.module.ts    # DI 註冊
└─ README.md          # 模組說明
```

- `services/asset.service.ts`：驗證政策、呼叫 CloudFacade、更新狀態、發布事件。  
- `repositories/asset.repository.ts`：介面，隔離資料來源（Firestore/Cloud）。  
- `policies/asset.policies.ts`：檔案大小/型態/擁有者檢查。  
- `events/asset.events.ts`：事件名稱常數（uploaded/archived 等）。  
- `facade/asset.facade.ts`：提供 upload/delete/archive 指令。 

## 基礎檔案起手式（必備）
- `models/asset.entity.ts`：定義 Asset Aggregate/VO。
- `states/asset.states.ts`：列出狀態與允許轉移。
- `services/asset.service.ts`：生命週期核心邏輯、事件發布集中處理。
- `repositories/asset.repository.ts` + `.impl.ts`：介面與實作分離，隔離 Infra。
- `events/asset.events.ts`：`asset.<fact>` 命名。
- `policies/asset.policies.ts`：檔案/權限檢查。
- `facade/asset.facade.ts`：外部唯一入口。 
