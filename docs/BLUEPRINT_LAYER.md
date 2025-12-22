# Blueprint Layer 完整骨架

## 目錄結構

/blueprint
├─ modules/
│  ├─ contract/
│  │  ├─ models/                  # Aggregate / Value Objects
│  │  │  └─ index.ts
│  │  ├─ states/
│  │  │  └─ contract.states.ts
│  │  ├─ services/
│  │  │  └─ contract.service.ts
│  │  ├─ repositories/
│  │  │  ├─ contract.repository.ts
│  │  │  └─ contract.repository.impl.ts
│  │  ├─ events/
│  │  │  └─ contract.events.ts
│  │  ├─ policies/
│  │  │  └─ contract.policies.ts
│  │  ├─ facade/
│  │  │  └─ contract.facade.ts
│  │  ├─ config/
│  │  │  └─ contract.config.ts
│  │  ├─ module.metadata.ts
│  │  ├─ contract.module.ts
│  │  └─ README.md
│  │
│  ├─ task/
│  │  └─ ... (同 contract)
│  │
│  ├─ issue/
│  │  └─ ...
│  │
│  ├─ acceptance/
│  │  └─ ...
│  │
│  ├─ finance/
│  │  └─ ...
│  │
│  └─ warranty/
│     └─ ...
│
├─ asset/
│  ├─ models/
│  │  └─ asset.entity.ts
│  ├─ states/
│  │  └─ asset.states.ts
│  ├─ services/
│  │  ├─ asset.service.ts
│  │  └─ asset-upload.service.ts
│  ├─ repositories/
│  │  └─ asset.repository.ts
│  ├─ events/
│  │  └─ asset.events.ts
│  ├─ policies/
│  │  └─ asset.policies.ts
│  ├─ facade/
│  │  └─ asset.facade.ts
│  ├─ config/
│  │  └─ asset.config.ts
│  ├─ module.metadata.ts
│  ├─ asset.module.ts
│  └─ README.md
│
├─ event-bus/
│  ├─ adapters/
│  │  └─ index.ts
│  ├─ event-bus.service.ts
│  ├─ event.types.ts
│  └─ README.md
│
├─ workflow/
│  ├─ workflow.engine.ts
│  ├─ workflow.registry.ts
│  ├─ steps/
│  │  └─ index.ts
│  └─ README.md
│
├─ audit/
│  ├─ audit-log.entity.ts
│  ├─ audit-log.service.ts
│  ├─ audit-policies.ts
│  └─ README.md
│
├─ policies/
│  ├─ access-control.policy.ts
│  ├─ approval.policy.ts
│  └─ README.md
│
└─ README.md

---

## 每個檔案最小起手式

### 1️⃣ Facade 範例（Asset）

```ts
// /blueprint/asset/facade/asset.facade.ts
import { AssetService } from '../services/asset.service';

export class AssetFacade {
  constructor(private readonly assetService: AssetService) {}

  async upload(file: any, ownerId: string, ownerType: string) {
    return this.assetService.upload(file, ownerId, ownerType);
  }
}


---

2️⃣ Service 範例（Asset）

// /blueprint/asset/services/asset.service.ts
import { CloudFacade } from '../../infrastructure/cloud/cloud.facade';

export class AssetService {
  constructor(private readonly cloud: CloudFacade) {}

  async upload(file: any, ownerId: string, ownerType: string) {
    // TODO: 驗證 policy
    const cloudFile = await this.cloud.uploadFile({ file });
    // TODO: 建立 Asset Entity / 更新狀態
    // TODO: 發布 asset.uploaded event
    return cloudFile;
  }
}


---

3️⃣ EventBus 起手式

// /blueprint/event-bus/event-bus.service.ts
export class EventBusService {
  private subscribers: Record<string, Function[]> = {};

  publish(event: string, payload: any) {
    (this.subscribers[event] || []).forEach(fn => fn(payload));
  }

  subscribe(event: string, handler: Function) {
    if (!this.subscribers[event]) this.subscribers[event] = [];
    this.subscribers[event].push(handler);
  }
}


---

4️⃣ Workflow Engine 起手式

// /blueprint/workflow/workflow.engine.ts
export class WorkflowEngine {
  execute(workflowId: string, context: any) {
    // TODO: 根據 workflow steps 執行
  }
}


---

5️⃣ Audit 起手式

// /blueprint/audit/audit-log.service.ts
export class AuditLogService {
  log(action: string, entityId: string, userId: string, data?: any) {
    console.log(`[AUDIT] ${action} by ${userId} on ${entityId}`, data);
  }
}


---

Blueprint Layer 責任邊界

層級 / 資源	責任

modules/	具體業務模組，Domain 聚合根、狀態、規則、事件、Facade。只能依賴 Blueprint 內的其他模組或 Infrastructure Facade（Cloud、Queue、AI）。
asset/	檔案 / 附件模組。負責檔案生命週期、狀態、政策。呼叫 CloudFacade 儲存/讀取。
event-bus/	Domain Event Dispatcher。負責事件發布與訂閱。事件由 Domain 層產生，不應有業務邏輯。
workflow/	工作流程編排器。定義流程步驟、狀態轉移、事件觸發，執行 Domain Service。
audit/	系統稽核。負責紀錄手動操作、狀態變更、事件觸發，可被各模組呼叫。
policies/	跨模組策略。包含存取控制、審核策略等，模組內策略只管模組內規則，不管跨模組流程。



---

事件流範例（Contract PDF 上傳）

ContractFacade.uploadContractPDF(file)
    ↓
AssetFacade.upload(file)
    ↓
AssetService.validatePolicy()
    ↓
CloudFacade.uploadFile()
    ↓
AssetService.updateAssetStatus()
    ↓
event-bus.emit('asset.uploaded')
    ↓
ContractService.onAssetUploaded()

Contract 不存檔案，只存 AssetId

Asset 模組負責檔案狀態管理

CloudFacade 完全不認識 Domain

事件由 Blueprint Domain 發布到 event-bus



---

建議開發規範

1. 模組之間只透過 Facade + EventBus 通訊


2. 所有 Domain Event 必須由模組 Service 發布


3. Cloud / AI / Queue / Notification 統一經由 Infrastructure Facade


4. Asset / File 是 Blueprint Domain，不直接依賴 Contract / Task / Issue


5. Audit / Policy / Workflow 集中管理，Domain Service 呼叫即可



---