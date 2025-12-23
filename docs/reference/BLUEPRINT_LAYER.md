# 藍圖層架構設計文檔 (Blueprint Layer)

> 文件版本: 3.23.0  
> 更新日期: 2025-12-16  
> 文件性質: 跨模組流程與系統規則定義

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
### 3.1 目錄結構

```
/
/app/
/src/blueprint                                # Blueprint Layer - 跨模組流程與系統規則
│
├─ modules/                                   # 業務領域模組集合 - 具體業務聚合根（各模組為獨立 Domain 範圍）
│  │
│  ├─ contract/                               # 合約模組 - 合約生命週期管理
│  │  ├─ models/                              # 聚合根與值物件 - Domain 實體定義
│  │  │  ├─ contract.entity.ts                # 合約聚合根
│  │  │  ├─ contract-item.vo.ts               # 合約工項值物件
│  │  │  └─ index.ts                          # barrel 匯出（模組外使用的統一出口）
│  │  ├─ states/                              # 狀態定義 - 合約狀態機
│  │  │  └─ contract.states.ts                # 合約狀態列舉與狀態轉換規則
│  │  ├─ services/                            # 領域服務 - 業務邏輯實作
│  │  │  ├─ contract.service.ts               # 合約核心業務邏輯
│  │  │  └─ contract-parser.service.ts        # OCR/解析相關邏輯封裝
│  │  ├─ repositories/                        # 資料存取層 - Repository 模式
│  │  │  ├─ contract.repository.ts            # Repository 介面定義（抽象）
│  │  │  └─ contract.repository.impl.ts       # Repository 實作（Firestore / adapter）
│  │  ├─ events/                              # 領域事件 - 合約相關事件定義
│  │  │  └─ contract.events.ts                # Domain Event 宣告（不含處理者）
│  │  ├─ policies/                            # 模組策略 - 合約業務規則（本模組範圍）
│  │  │  └─ contract.policies.ts              # 合約建立/修改權限與前置條件檢查
│  │  ├─ facade/                              # 對外門面 - 模組統一入口
│  │  │  └─ contract.facade.ts                # 公開 API / 用例入口（簡化調用）
│  │  ├─ config/                              # 模組配置 - 設定檔
│  │  │  └─ contract.config.ts                # 模組專屬設定（常數、啟用旗標）
│  │  ├─ module.metadata.ts                   # 模組元資料 - 版本/相依性/作者資訊
│  │  ├─ contract.module.ts                   # 模組註冊/匯出宣告（模組邊界說明）
│  │  └─ README.md                            # 模組說明文件（設計與使用說明）
│  │
│  ├─ task/                                   # 任務模組 - 施工任務管理
│  │  ├─ models/                              # 任務聚合根與值物件
│  │  │  ├─ task.entity.ts                    # 任務聚合根
│  │  │  ├─ task-assignment.vo.ts             # 指派相關值物件
│  │  │  └─ index.ts                          # barrel 匯出
│  │  ├─ states/                              # 任務狀態機
│  │  │  └─ task.states.ts                    # 任務狀態枚舉與轉換
│  │  ├─ services/                            # 任務領域服務
│  │  │  ├─ task.service.ts                   # 任務業務邏輯
│  │  │  └─ task-scheduler.service.ts         # 排程與定時任務整合
│  │  ├─ repositories/                        # 任務資料存取
│  │  │  ├─ task.repository.ts                # repository 介面
│  │  │  └─ task.repository.impl.ts           # repository 實作（DB/Firestore）
│  │  ├─ events/                              # 任務事件定義
│  │  │  └─ task.events.ts                    # task.created / task.completed 等
│  │  ├─ policies/                            # 任務相關策略
│  │  │  └─ task.policies.ts                  # 權限 / 可操作性規則
│  │  ├─ facade/                              # 模組門面
│  │  │  └─ task.facade.ts                    # 對外複合操作的簡化方法
│  │  ├─ config/                              # 模組設定
│  │  │  └─ task.config.ts                    # 任務模組常數與選項
│  │  ├─ module.metadata.ts                   # 模組描述檔
│  │  ├─ task.module.ts                       # 模組入口
│  │  └─ README.md                            # 使用與實作說明
│  │
│  ├─ issue/                                  # 問題單模組 - 問題追蹤管理
│  │  ├─ models/                              # 問題單實體
│  │  │  ├─ issue.entity.ts                   # 問題單聚合根
│  │  │  ├─ issue-category.vo.ts              # 分類值物件
│  │  │  └─ index.ts                          # barrel 匯出
│  │  ├─ states/                              # 問題單狀態機
│  │  │  └─ issue.states.ts
│  │  ├─ services/                            # 問題解決相關服務
│  │  │  ├─ issue.service.ts
│  │  │  └─ issue-resolver.service.ts         # 複雜問題處理器
│  │  ├─ repositories/                        # 存取層
│  │  │  ├─ issue.repository.ts
│  │  │  └─ issue.repository.impl.ts          # 實作（storage / indexes）
│  │  ├─ events/                              # 問題單事件
│  │  │  └─ issue.events.ts
│  │  ├─ policies/                            # 問題單策略（驗收/關閉規則）
│  │  │  └─ issue.policies.ts
│  │  ├─ facade/                              
│  │  │  └─ issue.facade.ts                    # 提供整合多步驟操作方法
│  │  ├─ config/                              
│  │  │  └─ issue.config.ts                    # module specific settings
│  │  ├─ module.metadata.ts
│  │  ├─ issue.module.ts
│  │  └─ README.md
│  │
│  ├─ acceptance/                             # 驗收模組 - 品質驗收管理
│  │  ├─ models/
│  │  │  ├─ acceptance.entity.ts              # 驗收聚合根
│  │  │  ├─ qc-checklist.vo.ts                # QC 清單值物件
│  │  │  └─ index.ts                          # barrel 匯出
│  │  ├─ states/                              # 驗收狀態機
│  │  │  └─ acceptance.states.ts
│  │  ├─ services/
│  │  │  ├─ acceptance.service.ts             # 驗收流程邏輯
│  │  │  └─ qc.service.ts                     # 品質檢驗邏輯
│  │  ├─ repositories/
│  │  │  ├─ acceptance.repository.ts
│  │  │  └─ acceptance.repository.impl.ts
│  │  ├─ events/
│  │  │  └─ acceptance.events.ts
│  │  ├─ policies/
│  │  │  └─ acceptance.policies.ts
│  │  ├─ facade/
│  │  │  └─ acceptance.facade.ts
│  │  ├─ config/
│  │  │  └─ acceptance.config.ts
│  │  ├─ module.metadata.ts
│  │  ├─ acceptance.module.ts
│  │  └─ README.md
│  │
│  ├─ finance/                                # 財務模組 - 請款付款管理
│  │  ├─ models/
│  │  │  ├─ payment.entity.ts                 # 付款聚合根
│  │  │  ├─ invoice.entity.ts                 # 發票聚合根
│  │  │  ├─ amount.vo.ts                      # 金額值物件
│  │  │  └─ index.ts                          # barrel 匯出
│  │  ├─ states/                              # 財務狀態機
│  │  │  ├─ payment.states.ts
│  │  │  └─ invoice.states.ts
│  │  ├─ services/
│  │  │  ├─ finance.service.ts                # 財務主要流程
│  │  │  ├─ payment.service.ts                # 付款執行服務
│  │  │  └─ invoice.service.ts                # 發票處理
│  │  ├─ repositories/
│  │  │  ├─ finance.repository.ts
│  │  │  └─ finance.repository.impl.ts       # 實作（含批次/交易支援）
│  │  ├─ events/
│  │  │  └─ finance.events.ts
│  │  ├─ policies/
│  │  │  └─ finance.policies.ts               # 審核/金流規則
│  │  ├─ facade/
│  │  │  └─ finance.facade.ts                 # 對外財務操作入口
│  │  ├─ config/
│  │  │  └─ finance.config.ts
│  │  ├─ module.metadata.ts
│  │  ├─ finance.module.ts
│  │  └─ README.md
│  │
│  └─ warranty/                               # 保固模組 - 保固期管理
│     ├─ models/
│     │  ├─ warranty.entity.ts                # 保固聚合根
│     │  ├─ warranty-period.vo.ts             # 保固期間值物件
│     │  └─ index.ts                          # barrel 匯出
│     ├─ states/                              # 保固狀態機
│     │  └─ warranty.states.ts
│     ├─ services/
│     │  ├─ warranty.service.ts               # 保固處理服務
│     │  └─ warranty-monitor.service.ts       # 監控與到期處理
│     ├─ repositories/
│     │  ├─ warranty.repository.ts
│     │  └─ warranty.repository.impl.ts
│     ├─ events/
│     │  └─ warranty.events.ts
│     ├─ policies/
│     │  └─ warranty.policies.ts
│     ├─ facade/
│     │  └─ warranty.facade.ts
│     ├─ config/
│     │  └─ warranty.config.ts
│     ├─ module.metadata.ts
│     ├─ warranty.module.ts
│     └─ README.md
│
├─ asset/                                     # 資產檔案模組 - 檔案生命週期管理
│  ├─ models/
│  │  ├─ asset.entity.ts                      # 資產聚合根
│  │  ├─ file-metadata.vo.ts                  # 檔案元資料值物件
│  │  └─ index.ts                              # barrel 匯出
│  ├─ states/                                 # 資產狀態機
│  │  └─ asset.states.ts
│  ├─ services/
│  │  ├─ asset.service.ts                     # 資產核心服務
│  │  ├─ asset-upload.service.ts              # 上傳流程封裝（雲端/暫存）
│  │  └─ asset-validation.service.ts          # 檔案驗證（類型/大小/安全）
│  ├─ repositories/
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

## 三、Blueprint Layer 完整骨架

### 3.1 目錄結構

```
/
/app/
/src/blueprint                                # Blueprint Layer - 跨模組流程與系統規則
│
├─ modules/                                   # 業務領域模組集合 - 具體業務聚合根
│  │
│  ├─ contract/                               # 合約模組 - 合約生命週期管理
│  │  ├─ models/                              # 聚合根與值物件 - Domain 實體定義
│  │  │  ├─ contract.entity.ts                # 合約聚合根
│  │  │  ├─ contract-item.vo.ts               # 合約工項值物件
│  │  │  └─ index.ts                          # 統一匯出
│  │  ├─ states/                              # 狀態定義 - 合約狀態機
│  │  │  └─ contract.states.ts                # 合約狀態枚舉與轉換規則
│  │  ├─ services/                            # 領域服務 - 業務邏輯實作
│  │  │  ├─ contract.service.ts               # 合約核心服務
│  │  │  └─ contract-parser.service.ts        # 合約解析服務
│  │  ├─ repositories/                        # 資料存取層 - Repository 模式
│  │  │  ├─ contract.repository.ts            # Repository 介面定義
│  │  │  └─ contract.repository.impl.ts       # Repository 實作
│  │  ├─ events/                              # 領域事件 - 合約相關事件定義
│  │  │  └─ contract.events.ts                # 合約建立/生效/終止等事件
│  │  ├─ policies/                            # 模組策略 - 合約業務規則
│  │  │  └─ contract.policies.ts              # 合約建立/修改權限規則
│  │  ├─ facade/                              # 對外門面 - 模組統一入口
│  │  │  └─ contract.facade.ts                # 合約 Facade
│  │  ├─ config/                              # 模組配置 - 設定檔
│  │  │  └─ contract.config.ts                # 合約模組配置
│  │  ├─ module.metadata.ts                   # 模組元資料 - 版本/依賴資訊
│  │  ├─ contract.module.ts                   # 模組定義檔
│  │  └─ README.md                            # 模組說明文件
│  │
│  ├─ task/                                   # 任務模組 - 施工任務管理
│  │  ├─ models/                              # 任務聚合根與值物件
│  │  │  ├─ task.entity.ts                    # 任務聚合根
│  │  │  ├─ task-assignment.vo.ts             # 任務指派值物件
│  │  │  └─ index.ts
│  │  ├─ states/                              # 任務狀態機
│  │  │  └─ task.states.ts
│  │  ├─ services/                            # 任務領域服務
│  │  │  ├─ task.service.ts
│  │  │  └─ task-scheduler.service.ts         # 任務排程服務
│  │  ├─ repositories/
│  │  │  ├─ task.repository.ts
│  │  │  └─ task.repository.impl.ts
│  │  ├─ events/                              # 任務事件
│  │  │  └─ task.events.ts
│  │  ├─ policies/                            # 任務策略
│  │  │  └─ task.policies.ts
│  │  ├─ facade/
│  │  │  └─ task.facade.ts
│  │  ├─ config/
│  │  │  └─ task.config.ts
│  │  ├─ module.metadata.ts
│  │  ├─ task.module.ts
│  │  └─ README.md
│  │
│  ├─ issue/                                  # 問題單模組 - 問題追蹤管理
│  │  ├─ models/
│  │  │  ├─ issue.entity.ts                   # 問題單聚合根
│  │  │  ├─ issue-category.vo.ts              # 問題分類值物件
│  │  │  └─ index.ts
│  │  ├─ states/                              # 問題單狀態機
│  │  │  └─ issue.states.ts
│  │  ├─ services/
│  │  │  ├─ issue.service.ts
│  │  │  └─ issue-resolver.service.ts         # 問題解決服務
│  │  ├─ repositories/
│  │  │  ├─ issue.repository.ts
│  │  │  └─ issue.repository.impl.ts
│  │  ├─ events/
│  │  │  └─ issue.events.ts
│  │  ├─ policies/
│  │  │  └─ issue.policies.ts
│  │  ├─ facade/
│  │  │  └─ issue.facade.ts
│  │  ├─ config/
│  │  │  └─ issue.config.ts
│  │  ├─ module.metadata.ts
│  │  ├─ issue.module.ts
│  │  └─ README.md
│  │
│  ├─ acceptance/                             # 驗收模組 - 品質驗收管理
│  │  ├─ models/
│  │  │  ├─ acceptance.entity.ts              # 驗收聚合根
│  │  │  ├─ qc-checklist.vo.ts                # QC 檢查清單值物件
│  │  │  └─ index.ts
│  │  ├─ states/                              # 驗收狀態機
│  │  │  └─ acceptance.states.ts
│  │  ├─ services/
│  │  │  ├─ acceptance.service.ts
│  │  │  └─ qc.service.ts                     # 品質檢驗服務
│  │  ├─ repositories/
│  │  │  ├─ acceptance.repository.ts
│  │  │  └─ acceptance.repository.impl.ts
│  │  ├─ events/
│  │  │  └─ acceptance.events.ts
│  │  ├─ policies/
│  │  │  └─ acceptance.policies.ts
│  │  ├─ facade/
│  │  │  └─ acceptance.facade.ts
│  │  ├─ config/
│  │  │  └─ acceptance.config.ts
│  │  ├─ module.metadata.ts
│  │  ├─ acceptance.module.ts
│  │  └─ README.md
│  │
│  ├─ finance/                                # 財務模組 - 請款付款管理
│  │  ├─ models/
│  │  │  ├─ payment.entity.ts                 # 付款聚合根
│  │  │  ├─ invoice.entity.ts                 # 發票聚合根
│  │  │  ├─ amount.vo.ts                      # 金額值物件
│  │  │  └─ index.ts
│  │  ├─ states/                              # 財務狀態機
│  │  │  ├─ payment.states.ts
│  │  │  └─ invoice.states.ts
│  │  ├─ services/
│  │  │  ├─ finance.service.ts
│  │  │  ├─ payment.service.ts                # 付款服務
│  │  │  └─ invoice.service.ts                # 發票服務
│  │  ├─ repositories/
│  │  │  ├─ finance.repository.ts
│  │  │  └─ finance.repository.impl.ts
│  │  ├─ events/
│  │  │  └─ finance.events.ts
│  │  ├─ policies/
│  │  │  └─ finance.policies.ts
│  │  ├─ facade/
│  │  │  └─ finance.facade.ts
│  │  ├─ config/
│  │  │  └─ finance.config.ts
│  │  ├─ module.metadata.ts
│  │  ├─ finance.module.ts
│  │  └─ README.md
│  │
│  └─ warranty/                               # 保固模組 - 保固期管理
│     ├─ models/
│     │  ├─ warranty.entity.ts                # 保固聚合根
│     │  ├─ warranty-period.vo.ts             # 保固期間值物件
│     │  └─ index.ts
│     ├─ states/                              # 保固狀態機
│     │  └─ warranty.states.ts
│     ├─ services/
│     │  ├─ warranty.service.ts
│     │  └─ warranty-monitor.service.ts       # 保固監控服務
│     ├─ repositories/
│     │  ├─ warranty.repository.ts
│     │  └─ warranty.repository.impl.ts
│     ├─ events/
│     │  └─ warranty.events.ts
│     ├─ policies/
│     │  └─ warranty.policies.ts
│     ├─ facade/
│     │  └─ warranty.facade.ts
│     ├─ config/
│     │  └─ warranty.config.ts
│     ├─ module.metadata.ts
│     ├─ warranty.module.ts
│     └─ README.md
│
├─ asset/                                     # 資產檔案模組 - 檔案生命週期管理
│  ├─ models/
│  │  ├─ asset.entity.ts                      # 資產聚合根
│  │  ├─ file-metadata.vo.ts                  # 檔案元資料值物件
│  │  └─ index.ts
│  ├─ states/                                 # 資產狀態機
│  │  └─ asset.states.ts
│  ├─ services/
│  │  ├─ asset.service.ts                     # 資產核心服務
│  │  ├─ asset-upload.service.ts              # 檔案上傳服務
│  │  └─ asset-validation.service.ts          # 檔案驗證服務
│  ├─ repositories/
│  │  ├─ asset.repository.ts
│  │  └─ asset.repository.impl.ts
│  ├─ events/
│  │  └─ asset.events.ts
│  ├─ policies/
│  │  └─ asset.policies.ts                    # 檔案存取權限規則
│  ├─ facade/
│  │  └─ asset.facade.ts
│  ├─ config/
│  │  └─ asset.config.ts
│  ├─ module.metadata.ts
│  ├─ asset.module.ts
│  └─ README.md
│
├─ ai/                                        # AI 服務模組 - AI 能力統一入口
│  ├─ providers/                              # AI 供應商適配器集合
│  │  ├─ vertex/                              # Google Vertex AI 供應商
│  │  │  ├─ adapter.ts                        # Vertex AI 適配器實作
│  │  │  ├─ client.ts                         # Vertex AI 客戶端封裝
│  │  │  └─ README.md                         # Vertex AI 使用說明
│  │  ├─ genai/                               # Google GenAI 供應商
│  │  │  ├─ adapter.ts                        # GenAI 適配器實作
│  │  │  ├─ client.ts                         # GenAI 客戶端封裝
│  │  │  └─ README.md                         # GenAI 使用說明
│  │  └─ README.md                            # 供應商整合說明
│  ├─ facade/
│  │  └─ ai.facade.ts                         # AI Facade - 統一協調入口
│  ├─ prompts/                                # Prompt 管理
│  │  ├─ templates.ts                         # Prompt 模板定義
│  │  └─ renderer.ts                          # 模板渲染器
│  ├─ safety/                                 # AI 安全機制
│  │  ├─ sanitizer.ts                         # 輸入淨化器
│  │  └─ validator.ts                         # 輸出驗證器
│  ├─ types.ts                                # AI 型別定義
│  └─ README.md
│
├─ analytics/                                 # 分析模組 - 數據分析與報表
│  ├─ metrics/                                # 指標計算
│  │  ├─ metrics.service.ts                   # 指標服務
│  │  └─ metric-definitions.ts                # 指標定義
│  ├─ reports/                                # 報表生成
│  │  ├─ report.generator.ts                  # 報表產生器
│  │  └─ report-templates.ts                  # 報表模板
│  ├─ analytics.service.ts                    # 分析核心服務
│  └─ README.md
│
├─ notification/                              # 通知模組 - 多渠道通知發送
│  ├─ channels/                               # 通知渠道
│  │  ├─ email.channel.ts                     # 郵件渠道
│  │  ├─ push.channel.ts                      # 推播渠道
│  │  └─ sms.channel.ts                       # 簡訊渠道
│  ├─ templates/                              # 通知模板
│  │  ├─ default.template.ts                  # 預設模板
│  │  └─ template.renderer.ts                 # 模板渲染器
│  ├─ notification.service.ts                 # 通知核心服務
│  └─ README.md
│
├─ event-bus/                                 # 事件匯流排 - 事件發布訂閱中樞
│  ├─ adapters/                               # 事件匯流排適配器
│  │  ├─ memory.adapter.ts                    # 記憶體適配器
│  │  ├─ redis.adapter.ts                     # Redis 適配器
│  │  └─ index.ts
│  ├─ event-bus.service.ts                    # 事件匯流排核心服務
│  ├─ event.types.ts                          # 事件型別定義
│  ├─ event.metadata.ts                       # 事件元資料
│  └─ README.md
│
├─ workflow/                                  # 工作流程引擎 - 跨模組流程編排
│  ├─ engine/                                 # 流程引擎核心
│  │  ├─ workflow.engine.ts                   # 流程引擎實作
│  │  └─ execution-context.ts                 # 執行上下文
│  ├─ registry/                               # 流程註冊表
│  │  ├─ workflow.registry.ts                 # 流程註冊服務
│  │  └─ workflow-definition.ts               # 流程定義介面
│  ├─ steps/                                  # 流程步驟定義
│  │  ├─ step.interface.ts                    # 步驟介面
│  │  ├─ contract-workflow-steps.ts           # 合約流程步驟
│  │  ├─ task-workflow-steps.ts               # 任務流程步驟
│  │  └─ index.ts
│  ├─ compensation/                           # 補償機制
│  │  └─ saga.handler.ts                      # Saga 補償處理器
│  └─ README.md
│
├─ audit/                                     # 稽核模組 - 系統操作歷史記錄
│  ├─ models/
│  │  └─ audit-log.entity.ts                  # 稽核日誌實體
│  ├─ services/
│  │  ├─ audit-log.service.ts                 # 稽核日誌服務
│  │  └─ audit-query.service.ts               # 稽核查詢服務
│  ├─ repositories/
│  │  ├─ audit-log.repository.ts
│  │  └─ audit-log.repository.impl.ts
│  ├─ policies/
│  │  └─ audit.policies.ts                    # 稽核策略規則
│  └─ README.md
│
├─ policies/                                  # 策略模組 - 跨模組業務規則
│  ├─ access-control/                         # 存取控制策略
│  │  ├─ access-control.policy.ts             # 存取控制規則
│  │  └─ role-permissions.ts                  # 角色權限定義
│  ├─ approval/                               # 審核策略
│  │  ├─ approval.policy.ts                   # 審核規則
│  │  └─ approval-chain.ts                    # 審核鏈定義
│  ├─ state-transition/                       # 狀態轉換策略
│  │  └─ transition.policy.ts                 # 狀態轉換規則
│  └─ README.md
│
└─ README.md                                  # Blueprint Layer 總覽文件
```

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