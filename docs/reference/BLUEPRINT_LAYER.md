# 藍圖層架構設計文檔 (Blueprint Layer)

> 文件版本: 3.23.0  
> 更新日期: 2025-12-16  
> 文件性質: 跨模組流程與系統規則定義

---

## 目錄

注意：本文件的目錄與結構部分已統一採用 [docs/reference/Skeleton.md](docs/reference/Skeleton.md) 作為權威來源，請以該文件為主要參照。

1. [Blueprint Layer 設計](#一blueprint-layer-設計)
2. [工作流程定義](#二工作流程定義)
3. [Blueprint Layer 完整骨架](#三blueprint-layer-完整骨架)

---

## 一、Blueprint Layer 設計

> Blueprint Layer 提供跨模組的流程能力與系統規則，不承載任何業務語意、不擁有 Domain 狀態、不取代模組決策。

### 1.1 Blueprint 層總結對照表

| 資料夾 | 回答的問題 | 有狀態 | 有業務語意 |
|--------|-----------|--------|-----------|
| event-bus | 發生了什麼 | ❌ | ❌ |
### 3.1 目錄結構

目錄與檔案結構請參考權威來源：[docs/reference/Skeleton.md](docs/reference/Skeleton.md)。
│  │  ├─ asset.repository.ts                  # repository 介面
│  │  └─ asset.repository.impl.ts             # 實作（CloudFacade 調用）
│  ├─ events/
│  │  └─ asset.events.ts                      # asset.uploaded / deleted 等
│  ├─ policies/
│  │  └─ asset.policies.ts                    # 檔案存取與保留期限規則
│  ├─ facade/
│  │  └─ asset.facade.ts                      # 上傳/下載/刪除等高階操作
│  ├─ config/
│  │  └─ asset.config.ts                      # 存儲設定與限制
│  ├─ module.metadata.ts                      # 模組資訊
│  ├─ asset.module.ts                         # 模組入口
│  └─ README.md                               # 模組說明
│
├─ ai/                                        # AI 服務模組 - AI 能力統一入口與安全封裝
│  ├─ providers/                              # AI 供應商適配器集合（各供應商 client 封裝）
│  │  ├─ vertex/                              # Google Vertex AI 適配器
│  │  │  ├─ adapter.ts                        # Vertex 適配器：呼叫封裝與錯誤處理
│  │  │  ├─ client.ts                         # Vertex 客戶端工廠 / 設定
│  │  │  └─ README.md                         # Vertex 使用說明與限制
│  │  ├─ genai/                               # 其他 GenAI 適配器
│  │  │  ├─ adapter.ts
│  │  │  ├─ client.ts
│  │  │  └─ README.md
│  │  └─ README.md                            # 供應商整合說明與選擇準則
│  ├─ facade/
│  │  └─ ai.facade.ts                         # 高層 AI 操作入口（淨化 / 速率 / 安全）
│  ├─ prompts/                                # Prompt 管理與模板
│  │  ├─ templates.ts                         # prompt 範本定義
│  │  └─ renderer.ts                          # prompt 渲染器（變數替換）
│  ├─ safety/
│  │  ├─ sanitizer.ts                         # 輸入淨化（阻止 prompt injection）
│  │  └─ validator.ts                         # 輸出驗證（格式 / 安全檢查）
│  ├─ types.ts                                # 共用型別定義
│  └─ README.md                               # 模組使用說明與安全指南
│
├─ analytics/                                 # 分析模組 - 指標、報表與監控資料轉換
│  ├─ metrics/
│  │  ├─ metrics.service.ts                   # 指標計算機
│  │  └─ metric-definitions.ts                # 指標定義與說明
│  ├─ reports/
│  │  ├─ report.generator.ts                  # 報表產生邏輯
│  │  └─ report-templates.ts                  # 報表模板
│  ├─ analytics.service.ts                    # 分析流程協調
│  └─ README.md                               # 使用與資料需求說明
│
├─ notification/                              # 通知模組 - 多渠道通知發送
│  ├─ channels/
│  │  ├─ email.channel.ts                     # 電子郵件渠道實作
│  │  ├─ push.channel.ts                      # 行動推播渠道
│  │  └─ sms.channel.ts                       # 簡訊渠道
│  ├─ templates/
│  │  ├─ default.template.ts                  # 預設通知模板
│  │  └─ template.renderer.ts                 # 模板渲染器
│  ├─ notification.service.ts                 # 通知發送協調服務（多渠道路由）
│  └─ README.md                               # 使用與範本說明
│
├─ event-bus/                                 # 事件匯流排 - 事件發布/訂閱中樞（adapter 驅動）
│  ├─ adapters/                               # 事件匯流排實作適配器
│  │  ├─ memory.adapter.ts                    # 本機記憶體適配器（開發 / 測試用）
│  │  ├─ redis.adapter.ts                     # Redis 適配器（跨進程/可擴展）
│  │  └─ index.ts                             # adapters 匯出
│  ├─ event-bus.service.ts                    # 核心 EventBus 介面/邏輯
│  ├─ event.types.ts                          # 事件型別定義（共用 schema）
│  ├─ event.metadata.ts                       # 事件元資料（correlation / version）
│  └─ README.md                               # 架構與使用說明
│
├─ workflow/                                  # 工作流程引擎 - 定義流程、執行上下文、補償
│  ├─ engine/
│  │  ├─ workflow.engine.ts                   # 執行器核心（步驟調度）
│  │  └─ execution-context.ts                 # 執行上下文型別 / transient state
│  ├─ registry/
│  │  ├─ workflow.registry.ts                 # 流程註冊與查詢服務
│  │  └─ workflow-definition.ts               # 流程定義介面（宣告式步驟）
│  ├─ steps/
│  │  ├─ step.interface.ts                    # 步驟介面
│  │  ├─ contract-workflow-steps.ts           # 合約流程步驟定義
│  │  ├─ task-workflow-steps.ts               # 任務流程步驟定義
│  │  └─ index.ts                             # steps 匯出
│  ├─ compensation/
│  │  └─ saga.handler.ts                      # 補償 / Saga 處理器
│  └─ README.md                               # 設計與使用指南
│
├─ audit/                                     # 稽核模組 - 不可變的操作歷史紀錄
│  ├─ models/
│  │  └─ audit-log.entity.ts                  # 稽核紀錄實體（schema definition）
│  ├─ services/
│  │  ├─ audit-log.service.ts                 # 寫入稽核紀錄的服務
│  │  └─ audit-query.service.ts               # 提供稽核查詢與篩選功能
│  ├─ repositories/
│  │  ├─ audit-log.repository.ts              # repository 介面
│  │  └─ audit-log.repository.impl.ts         # 實作（查詢優化）
│  ├─ policies/
│  │  └─ audit.policies.ts                    # 稽核保留與可見性規則
│  └─ README.md                               # 稽核使用說明
│
├─ policies/                                  # 策略模組 - 跨模組規則集合
│  ├─ access-control/
│  │  ├─ access-control.policy.ts             # 存取控制規則集合
│  │  └─ role-permissions.ts                  # 角色對應權限矩陣
│  ├─ approval/
│  │  ├─ approval.policy.ts                   # 審核判斷邏輯
│  │  └─ approval-chain.ts                    # 多層審核鏈定義
│  ├─ state-transition/
│  │  └─ transition.policy.ts                 # 狀態轉換驗證
│  └─ README.md                               # 策略模組說明
│
└─ README.md                                  # Blueprint Layer 總覽文件
```
  - 否：持續保固監控

保固期滿：
```text
保固期滿【自動】
↓
最終驗收結案【手動】
```

### 3.5 財務與成本流程

流程：

```text
金額/比例確認（可請款比例/可付款比例）【手動】
↓
建立可請款清單 + 可付款清單【自動】
（業主 / 承商分離）
↓
請款 / 付款流程【手動】
```

流程狀態：草稿 → 送出 → 審核 → 開票 → 收款/付款

財務審核：通過→繼續流程；退回→補件/修正→再審核。

財務狀態同步（自動）示例：更新任務款項狀態、請款/付款進度百分比。

成本分析自動計入：實際成本、應收/應付、毛利分析。

### 3.6 問題單（Issue）原則

- 問題單為獨立模組，具備完整生命週期：
```text
open → in_progress → resolved → verified → closed
```
- 建立來源：驗收失敗、QC 驗收、保固缺失、安全事件或使用者手動建立。

### 3.7 事件與自動化原則

- 所有自動流程皆由事件或 Queue 觸發
- 狀態改變即產生事件
- 事件不包含 UI 或使用者互動邏輯

### 3.8 稽核與權限控制

Audit Log（必要）應記錄：操作人、操作時間、狀態變更前後、備註或原因。

權限設計要點：
- 不同角色可操作不同節點
- 權限不硬編碼於 UI
- 由模組層或 Policy 層控管

---

## 4 Blueprint Layer 完整骨架 (Skeleton)

本節提供目錄範例、實作骨架樣板與責任邊界，方便開發者快速上手。

### 4.1 目錄結構範例

```text
/blueprint
├─ modules/
│  ├─ contract/
│  ├─ task/
│  ├─ issue/
│  ├─ acceptance/
│  ├─ finance/
│  └─ warranty/
├─ asset/
├─ ai/
├─ analytics/
├─ notification/
├─ event-bus/
├─ workflow/
├─ audit/
└─ policies/
```

（詳見 repo 中的 `/blueprint` 範例目錄）

### 4.2 實作骨架與樣板程式碼

以下為簡要樣板，供快速參考：

#### 4.2.1 Facade 範例（Asset）

```typescript
// /blueprint/asset/facade/asset.facade.ts
import { AssetService } from '../services/asset.service';

export class AssetFacade {
  constructor(private readonly assetService: AssetService) {}

  async upload(file: any, ownerId: string, ownerType: string) {
    return this.assetService.upload(file, ownerId, ownerType);
  }
}
```

#### 4.2.2 Service 範例（Asset）

```typescript
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
```

#### 4.2.3 EventBus 起手式

```typescript
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
```

#### 4.2.4 Workflow Engine 起手式

```typescript
// /blueprint/workflow/workflow.engine.ts
export class WorkflowEngine {
  execute(workflowId: string, context: any) {
    // TODO: 根據 workflow steps 執行
  }
}
```

#### 4.2.5 Audit 起手式

```typescript
// /blueprint/audit/audit-log.service.ts
export class AuditLogService {
  log(action: string, entityId: string, userId: string, data?: any) {
    console.log(`[AUDIT] ${action} by ${userId} on ${entityId}`, data);
  }
}
```

### 4.3 責任邊界

| 層級 / 資源 | 責任 |
|------------|------|
| `modules/` | 具體業務模組：Domain 聚合根、狀態、規則、事件、Facade。僅能依賴 Blueprint 內其他模組或 Infrastructure Facade（Cloud、Queue、AI）。 |
| `asset/` | 檔案/附件模組：負責檔案生命週期、狀態與政策，呼叫 CloudFacade 儲存/讀取。 |
| `event-bus/` | Domain Event Dispatcher：事件發布與訂閱，事件由 Domain 層產生，不應含業務邏輯。 |
| `workflow/` | 工作流程編排器：定義流程步驟、狀態轉移與事件觸發，協調 Domain Service。 |
| `audit/` | 系統稽核：紀錄手動操作、狀態變更與事件觸發，供稽核查詢。 |
| `policies/` | 跨模組策略：存取控制、審核策略等，模組內策略僅管本模組規則。 |

### 4.4 事件流範例（Contract PDF 上傳）

```text
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
```

關鍵點：
- Contract 不存檔案，僅存 AssetId
- Asset 模組負責檔案狀態管理
- CloudFacade 不應理解 Domain 細節
- 事件由 Blueprint Domain 發布到 EventBus

### 4.5 建議開發規範

1. 模組間僅透過 Facade 與 EventBus 通訊
2. 所有 Domain Event 必須由模組 Service 發布
3. Cloud / AI / Queue / Notification 統一經由 Infrastructure Facade
4. Asset / File 為 Blueprint Domain，不直接依賴 Contract / Task / Issue
5. Audit / Policy / Workflow 集中管理，Domain Service 呼叫即可

---

## 5 結語與注意事項

本文件定義：
- 跨模組流程協調
- 系統級規則與策略
- 事件匯流排架構
- 工作流程定義
- 稽核與審計機制

不描述：單一模組內部實作、模組資料結構或 UI 實作細節。

此文件可作為：Blueprint 架構藍圖、跨模組流程設計依據、系統整合驗收基準與事件/工作流程規範。

> **最重要提醒：Blueprint Layer 永遠不應該知道「資料長什麼樣子」，只知道「事件、規則與流程」。**

---


open → in_progress → resolved → verified → closed
```

**問題單建立來源（概念）：**
- 驗收失敗
- QC 檢驗失敗
- 保固缺失
- 安全事件
- 使用者手動建立

### 2.7 事件與自動化原則

- 所有自動流程皆由 **事件或 Queue 觸發**
- 狀態改變即產生事件
- 事件不包含 UI 或使用者互動邏輯

### 2.8 稽核與權限控制

**Audit Log（必要）：**

所有【手動】節點需記錄：
- 操作人
- 操作時間
- 狀態變更前後
- 備註或原因

**權限設計：**
- 不同角色可操作不同節點
- 權限不硬編碼於 UI
- 由模組層或政策層控管

---


### 3.2 實作骨架範例

#### 3.2.1 Facade 範例（Asset）

```typescript
// /blueprint/asset/facade/asset.facade.ts
import { AssetService } from '../services/asset.service';

export class AssetFacade {
  constructor(private readonly assetService: AssetService) {}

  async upload(file: any, ownerId: string, ownerType: string) {
    return this.assetService.upload(file, ownerId, ownerType);
  }
}
```

#### 3.2.2 Service 範例（Asset）

```typescript
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
```

#### 3.2.3 EventBus 起手式

```typescript
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
```

#### 3.2.4 Workflow Engine 起手式

```typescript
// /blueprint/workflow/workflow.engine.ts
export class WorkflowEngine {
  execute(workflowId: string, context: any) {
    // TODO: 根據 workflow steps 執行
  }
}
```

#### 3.2.5 Audit 起手式

```typescript
// /blueprint/audit/audit-log.service.ts
export class AuditLogService {
  log(action: string, entityId: string, userId: string, data?: any) {
    console.log(`[AUDIT] ${action} by ${userId} on ${entityId}`, data);
  }
}
```

### 3.3 Blueprint Layer 責任邊界

| 層級 / 資源 | 責任 |
|------------|------|
| modules/ | 具體業務模組，Domain 聚合根、狀態、規則、事件、Facade。只能依賴 Blueprint 內的其他模組或 Infrastructure Facade（Cloud、Queue、AI）。 |
| asset/ | 檔案 / 附件模組。負責檔案生命週期、狀態、政策。呼叫 CloudFacade 儲存/讀取。 |
| event-bus/ | Domain Event Dispatcher。負責事件發布與訂閱。事件由 Domain 層產生，不應有業務邏輯。 |
| workflow/ | 工作流程編排器。定義流程步驟、狀態轉移、事件觸發，執行 Domain Service。 |
| audit/ | 系統稽核。負責紀錄手動操作、狀態變更、事件觸發，可被各模組呼叫。 |
| policies/ | 跨模組策略。包含存取控制、審核策略等，模組內策略只管模組內規則，不管跨模組流程。 |

### 3.4 事件流範例（Contract PDF 上傳）

```
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
```

**關鍵點：**
- Contract 不存檔案，只存 AssetId
- Asset 模組負責檔案狀態管理
- CloudFacade 完全不認識 Domain
- 事件由 Blueprint Domain 發布到 event-bus

### 3.5 建議開發規範

1. 模組之間只透過 Facade + EventBus 通訊
2. 所有 Domain Event 必須由模組 Service 發布
3. Cloud / AI / Queue / Notification 統一經由 Infrastructure Facade
4. Asset / File 是 Blueprint Domain，不直接依賴 Contract / Task / Issue
5. Audit / Policy / Workflow 集中管理，Domain Service 呼叫即可

---

## 結語

### 本文件定義的是：

- **跨模組流程協調**
- **系統級規則與策略**
- **事件匯流排架構**
- **工作流程定義**
- **稽核與審計機制**

### 不描述：

- 單一模組內部實作
- 模組資料結構
- UI 實作細節

### 此文件可作為：

- Blueprint 架構藍圖
- 跨模組流程設計依據
- 系統整合驗收基準
- 事件與工作流程規範

---

## 最重要的提醒

> **Blueprint Layer 永遠不應該知道「資料長什麼樣子」，只知道「事件、規則與流程」。**

---