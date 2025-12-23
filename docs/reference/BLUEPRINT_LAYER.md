# 藍圖層架構設計文檔 (Blueprint Layer)

> 文件版本: 3.23.0  
> 更新日期: 2025-12-16  
> 文件性質: 跨模組流程與系統規則定義

> **路徑說明（與實際倉庫一致）：** Blueprint Layer 的根目錄位於 `/src/app/core/blueprint`，對應的 UI 入口在 `/src/app/routes/blueprint`。以下凡提及「/blueprint」皆指向此實際路徑，並與 `MODULE_LAYER.md` 的模組骨架（`/src/app/core/blueprint/modules/implementations/<module>`）對齊。

---

## 目錄

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
| workflow | 下一步是什麼 | ⚠️（流程狀態） | ❌ |
| audit | 發生過什麼 | ✅（歷史） | ❌ |
| policies | 可不可以 | ❌ | ⚠️（規則） |

### 1.2 `/src/app/core/blueprint/event-bus`

**一句話定位：**
> 系統事件的傳遞與分發中樞（不包含業務邏輯）

**核心職責：**

提供事件的：
- 發佈（emit / publish）
 - 訂閱（subscribe）
 - 分派（dispatch）

 確保事件：
 - 結構一致
 - 可追蹤（Correlation ID）
 - 可重試（Retry / DLQ）

 **❌ 絕對不能做的事情：**
 - ❌ 判斷「這個事件該不該發生」
 - ❌ 改寫事件 payload
 - ❌ 根據事件內容執行業務邏輯
 - ❌ 依賴任何 Domain Module

 **核心理念：**
 > Event Bus 是一個跨模組的流程基礎設施（Process Infrastructure），負責傳遞「已發生事實」，不承載業務決策。
### 1.3 `/src/app/core/blueprint/workflow`

**一句話定位：**
> 跨模組流程的「協調者」，用於高風險或多步驟流程

**什麼時候「需要」 Workflow：**

只有在以下情況才使用：
- 涉及多個模組
- 中間步驟可能失敗
- 需要補償（Rollback / Saga）
- 流程「不能只靠事件自然擴散」

**例如：**
- 請款 → 開票 → 收款 → 入帳
# 藍圖層架構設計文檔 (Blueprint Layer)

> 文件版本: 3.23.0
> 更新日期: 2025-12-16
> 文件性質: 跨模組流程與系統規則定義

---

## 目次

- [1. 概覽 (Overview)](#1-概覽-overview)
- [2. Blueprint Layer 設計原則](#2-blueprint-layer-設計原則)
  - [2.1 層級總覽對照表](#21-層級總覽對照表)
- [2.2 Event Bus (/src/app/core/blueprint/event-bus)](#22-event-bus-srcappcoreblueprintevent-bus)
- [2.3 Workflow (/src/app/core/blueprint/workflow)](#23-workflow-srcappcoreblueprintworkflow)
- [2.4 Audit (/src/app/core/blueprint/audit)](#24-audit-srcappcoreblueprintaudit)
- [2.5 Policies (/src/app/core/blueprint/policies)](#25-policies-srcappcoreblueprintpolicies)
- [3. 工作流程定義 (Workflows)](#3-工作流程定義-workflows)
  - [3.1 合約建立流程](#31-合約建立流程)
  - [3.2 任務與施工階段](#32-任務與施工階段)
  - [3.3 品質與驗收流程](#33-品質與驗收流程)
  - [3.4 保固期管理](#34-保固期管理)
  - [3.5 財務與成本流程](#35-財務與成本流程)
  - [3.6 問題單 (Issue) 原則](#36-問題單-issue-原則)
  - [3.7 事件與自動化原則](#37-事件與自動化原則)
  - [3.8 稽核與權限控制](#38-稽核與權限控制)
- [4. Blueprint Layer 完整骨架 (Skeleton)](#4-blueprint-layer-完整骨架-skeleton)
  - [4.1 目錄結構範例](#41-目錄結構範例)
  - [4.2 實作骨架與樣板程式碼](#42-實作骨架與樣板程式碼)
  - [4.3 責任邊界](#43-責任邊界)
  - [4.4 事件流範例（Contract PDF 上傳）](#44-事件流範例contract-pdf-上傳)
  - [4.5 建議開發規範](#45-建議開發規範)
- [5. 結語與注意事項](#5-結語與注意事項)

---

## 1 概覽 (Overview)

Blueprint Layer 提供跨模組的流程協調能力與系統級規則。其目標是支援模組間的流程、事件與稽核需求，但不應承載具體業務語意或直接修改 Domain 狀態。

核心要點：
- 不承載業務語意
- 不擁有 Domain 狀態
- 不取代模組決策

---

## 2 Blueprint Layer 設計原則

以下分節說明 Blueprint 常見的子子系統與設計原則。

### 2.1 層級總覽對照表

| 資料夾 | 回答的問題 | 有狀態 | 有業務語意 |
|--------|-----------:|:------:|:-----------:|
| `event-bus` | 發生了什麼 | ❌ | ❌ |
| `workflow` | 下一步是什麼 | ⚠️（流程狀態） | ❌ |
| `audit` | 發生過什麼 | ✅（歷史） | ❌ |
| `policies` | 可不可以 | ❌ | ⚠️（規則） |

### 2.2 Event Bus (/src/app/core/blueprint/event-bus)

一句話定位：系統事件的傳遞與分發中樞（不包含業務邏輯）。

核心職責：
- 提供發佈（emit / publish）、訂閱（subscribe）、分派（dispatch）
- 確保事件結構一致、可追蹤（Correlation ID）、可重試（Retry / DLQ）

不可做事項（硬性限制）：
- 不得判斷「這個事件該不該發生」
- 不得改寫事件 payload
- 不得根據事件內容執行業務邏輯
- 不得依賴任何 Domain Module

設計心法：Event Bus 是流程基礎設施，傳遞「已發生事實」，不承載業務決策。

### 2.3 Workflow (/src/app/core/blueprint/workflow)

一句話定位：跨模組流程的協調者，用於高風險或多步驟流程。

何時需要 Workflow：僅在下列情況使用：
- 涉及多個模組
- 中間步驟可能失敗
- 需要補償（Rollback / Saga）
- 流程不能只靠事件自然擴散

可做的事：
- 訂閱多個事件並管理流程狀態（Process State）
- 發出下一步之指令型事件
- 觸發補償事件

不可做的事：
- 不得存取 Domain Repository
- 不得直接改寫 Domain 狀態
- 不得實作 UI 或權限邏輯

正確心法：Workflow 不「做事」，只「決定接下來要叫誰做事」。

### 2.4 Audit (/src/app/core/blueprint/audit)

一句話定位：系統行為的不可變歷史紀錄層。

核心職責：
- 記錄手動操作、重要狀態變更與關鍵事件
- 提供事後追蹤、稽核查詢與問責依據

可記錄欄位：操作人、操作時間、模組來源、行為類型、狀態前/後、Correlation ID 等。

不可做事項：
- 不影響流程
- 不阻斷操作
- 不當作業務資料來源或回寫 Domain

提醒：不要把 Audit Log 當成流程判斷依據；Audit 是歷史紀錄，而非即時真相來源。

### 2.5 Policies (/src/app/core/blueprint/policies)

一句話定位：跨模組的一致性規則與限制條件。

適合放在 `policies` 的範例：
- 狀態轉換規則
- 操作前置條件
- 角色/權限矩陣（邏輯層）
- 系統級 Guard

例子：未生效合約不可建立任務；驗收未通過不可請款；已結案問題不可再編輯。

Policy 的責任是回答「可不可以」，而不是「怎麼做」。

示範簽名：
```typescript
function canCreateTask(contract): boolean
```

不可做事項：
- 不存資料
- 不發事件
- 不執行流程
- 不處理例外流程

---

## 3 工作流程定義 (Workflows)

本節列出主要業務流程（範例），說明事件來源、人工/自動節點與狀態轉換。

### 3.1 合約建立流程

流程：

```text
合約上傳（PDF / 圖檔）【手動】
↓
合約建檔（基本資料、業主、承商）【手動】
↓
合約解析（OCR / AI 解析條款、金額、工項）【自動】
↓
合約確認（確認解析結果或人工補齊）【手動】
↓
合約狀態：待生效
↓
合約生效（僅已生效合約可建立任務）【手動】
```

### 3.2 任務與施工階段

流程：

```text
任務建立（關聯合約 / 工項 / 金額）【手動】
↓
指派使用者或團隊【手動】
↓
施工執行
↓
提報完成【手動】
↓
管理確認完成【手動】
```

註：此節點僅確認施工責任完成，不等同於驗收完成。

### 3.3 品質與驗收流程

流程節點：

```text
自動建立施工日誌【自動】
↓
自動建立 QC 待驗【自動】
↓
QC 判定
```

QC 判定：
- 否：
  ```text
  建立缺失單【自動】
  ↓
  整改【手動】
  ↓
  複驗【手動】
  ↓
  回到 QC 判定
  ```
- 是：
  ```text
  驗收【手動】
  ```

驗收判定：
- 否：
  ```text
  建立問題單【可手動 / 可自動】
  ↓
  問題處理【手動】
  ↓
  回到驗收
  ```
- 是：
  ```text
  驗收資料封存【自動】
  ↓
  進入保固期【自動】
  ```

### 3.4 保固期管理

保固期間處理：

- 發生保固缺失？
  - 是：
    ```text
    建立問題單【可手動 / 可自動】
    ↓
    保固維修【手動】
    ↓
    結案【手動】
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
/src/app/core/blueprint
├─ modules/
│  └─ implementations/
│     ├─ acceptance/ | finance/ | issue/ | qa/ | communication/ | warranty/ | cloud/ | workflow/ | audit-logs/ | safety/ | log/
│     ├─ <module>/models | services | repositories | policies | events | facade | config
│     └─ module.metadata.ts / <module>.module.ts / README.md
├─ container/ | context/ | config/ | events/
├─ workflow/ | event-bus/ | audit/ | policies/
├─ integration/ | repositories/ | services/
└─ index.ts
```

（詳見 repo 中的 `/src/app/core/blueprint` 範例目錄）

### 4.2 實作骨架與樣板程式碼

以下為簡要樣板，供快速參考：

#### 4.2.1 Facade 範例（Issue）

```typescript
// /src/app/core/blueprint/modules/implementations/issue/facade/issue.facade.ts
import { IssueService } from '../services/issue.service';

export class IssueFacade {
  constructor(private readonly issueService: IssueService) {}

  async create(payload: any) {
    // TODO: 驗證 policy
    return this.issueService.create(payload);
  }
}
```

#### 4.2.2 Service 範例（Issue）

```typescript
// /src/app/core/blueprint/modules/implementations/issue/services/issue.service.ts
import { IssueRepository } from '../repositories/issue.repository';
import { EventBusService } from '../../../event-bus/event-bus.service';

export class IssueService {
  constructor(
    private readonly repository: IssueRepository,
    private readonly eventBus: EventBusService,
  ) {}

  async create(payload: any) {
    // TODO: 驗證 policy
    const issue = await this.repository.save(payload);
    this.eventBus.publish('issue.created', { id: issue.id });
    return issue;
  }
}
```

#### 4.2.3 EventBus 起手式

```typescript
// /src/app/core/blueprint/event-bus/event-bus.service.ts
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
// /src/app/core/blueprint/workflow/workflow.engine.ts
export class WorkflowEngine {
  execute(workflowId: string, context: any) {
    // TODO: 根據 workflow steps 執行
  }
}
```

#### 4.2.5 Audit 起手式

```typescript
// /src/app/core/blueprint/audit/audit-log.service.ts
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

## 三、Blueprint Layer 完整骨架

### 3.1 目錄結構

```
/src/app/core/blueprint
├─ modules/
│  └─ implementations/
│     ├─ acceptance/ | finance/ | issue/ | qa/ | communication/ | warranty/ | cloud/ | workflow/ | audit-logs/ | safety/ | log/
│     ├─ <module>/models | services | repositories | policies | events | facade | config
│     └─ module.metadata.ts / <module>.module.ts / README.md
│
├─ container/ | context/ | config/ | events/
├─ workflow/ | event-bus/ | audit/ | policies/
├─ integration/ | repositories/ | services/
└─ index.ts
```

### 3.2 實作骨架範例

#### 3.2.1 Facade 範例（Asset）

```typescript
// /src/app/core/blueprint/modules/implementations/issue/facade/issue.facade.ts
import { IssueService } from '../services/issue.service';

export class IssueFacade {
  constructor(private readonly issueService: IssueService) {}

  async create(payload: any) {
    return this.issueService.create(payload);
  }
}
```

#### 3.2.2 Service 範例（Issue）

```typescript
// /src/app/core/blueprint/modules/implementations/issue/services/issue.service.ts
import { IssueRepository } from '../repositories/issue.repository';
import { EventBusService } from '../../../event-bus/event-bus.service';

export class IssueService {
  constructor(
    private readonly repository: IssueRepository,
    private readonly eventBus: EventBusService,
  ) {}

  async create(payload: any) {
    // TODO: 驗證 policy
    const issue = await this.repository.save(payload);
    this.eventBus.publish('issue.created', { id: issue.id });
    return issue;
  }
}
```

#### 3.2.3 EventBus 起手式

```typescript
// /src/app/core/blueprint/event-bus/event-bus.service.ts
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
// /src/app/core/blueprint/workflow/workflow.engine.ts
export class WorkflowEngine {
  execute(workflowId: string, context: any) {
    // TODO: 根據 workflow steps 執行
  }
}
```

#### 3.2.5 Audit 起手式

```typescript
// /src/app/core/blueprint/audit/audit-log.service.ts
export class AuditLogService {
  log(action: string, entityId: string, userId: string, data?: any) {
    console.log(`[AUDIT] ${action} by ${userId} on ${entityId}`, data);
  }
}
```

### 3.3 Blueprint Layer 責任邊界

| 層級 / 資源 | 責任 |
|------------|------|
| modules/implementations | 具體業務模組，Domain 聚合根、狀態、規則、事件、Facade。只能依賴 Blueprint 內的其他模組或 Infrastructure Facade（Cloud、Queue、AI）。 |
| event-bus/ | Domain Event Dispatcher。負責事件發布與訂閱。事件由 Domain 層產生，不應有業務邏輯。 |
| workflow/ | 工作流程編排器。定義流程步驟、狀態轉移、事件觸發，執行 Domain Service。 |
| audit/ | 系統稽核。負責紀錄手動操作、狀態變更、事件觸發，可被各模組呼叫。 |
| policies/ | 跨模組策略。包含存取控制、審核策略等，模組內策略只管模組內規則，不管跨模組流程。 |
| integration/ | 封裝對外服務（Cloud/AI/Queue）或跨模組協作的 Adapter。 |

### 3.4 事件流範例（Contract PDF 上傳）

```
IssueFacade.createIssue(command)
    ↓
IssueService.validatePolicy()
    ↓
IssueRepository.save()
    ↓
event-bus.emit('issue.created')
    ↓
NotificationService.onIssueCreated()
```

**關鍵點：**
- Domain 模組只透過 Facade 進入，並由 Service 驗證 Policy。
- Repository 與外部基礎設施隔離在 Blueprint Layer，不穿透到 UI。
- 事件由 Domain 發布到 event-bus，其他模組透過訂閱回應。

### 3.5 建議開發規範

1. 模組之間只透過 Facade + EventBus 通訊
2. 所有 Domain Event 必須由模組 Service 發布
3. Cloud / AI / Queue / Notification 統一經由 Infrastructure Facade
4. File / Asset 類型（如需）仍屬 Blueprint Domain，不直接依賴 Contract / Task / Issue
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
