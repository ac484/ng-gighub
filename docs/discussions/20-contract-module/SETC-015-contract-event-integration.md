# SETC-015: Contract Event Integration

> **任務 ID**: SETC-015  
> **任務名稱**: Contract Event Integration  
> **優先級**: P0 (Critical)  
> **預估工時**: 2 天  
> **依賴**: SETC-013  
> **狀態**: ✅ 已完成

---

## 📋 任務定義

### 名稱
Contract Event Integration - 合約事件總線整合

### 背景 / 目的
整合 Contract Module 與 Blueprint Event Bus，實作事件發送與訂閱機制，使合約狀態變更能自動觸發相關模組的後續流程。

### 需求說明
1. 實作 ContractEventService 類別
2. 定義 Contract 相關事件類型
3. 實作事件發送機制
4. 實作事件訂閱處理
5. 整合到現有 Service 層

### In Scope / Out of Scope

#### ✅ In Scope
- ContractEventService 實作
- 事件類型定義
- 事件發送機制
- 事件訂閱處理
- 與 Event Bus 整合

#### ❌ Out of Scope
- 跨模組事件處理（SETC-018~023）
- Workflow Orchestrator（SETC-019）

### 功能行為
當合約狀態變更、工項更新、檔案上傳等操作發生時，自動發送事件通知其他模組。

### 資料 / API

#### 事件類型定義
```typescript
// Contract Events
export const CONTRACT_EVENTS = {
  // CRUD Events
  CREATED: 'contract.created',
  UPDATED: 'contract.updated',
  DELETED: 'contract.deleted',
  
  // Status Events
  STATUS_CHANGED: 'contract.status_changed',
  ACTIVATED: 'contract.activated',
  COMPLETED: 'contract.completed',
  TERMINATED: 'contract.terminated',
  
  // Work Items Events
  WORK_ITEM_CREATED: 'contract.work_item_created',
  WORK_ITEM_UPDATED: 'contract.work_item_updated',
  WORK_ITEM_PROGRESS_UPDATED: 'contract.work_item_progress_updated',
  
  // File Events
  FILE_UPLOADED: 'contract.file_uploaded',
  FILE_DELETED: 'contract.file_deleted',
} as const;
```

#### Service 介面
```typescript
@Injectable({ providedIn: 'root' })
export class ContractEventService {
  // Event Emission
  emitContractCreated(contract: Contract): void;
  emitContractUpdated(contract: Contract, changes: Partial<Contract>): void;
  emitContractDeleted(contractId: string): void;
  
  emitStatusChanged(contract: Contract, previousStatus: ContractStatus): void;
  emitContractActivated(contract: Contract): void;
  emitContractCompleted(contract: Contract): void;
  emitContractTerminated(contract: Contract, reason: string): void;
  
  emitWorkItemCreated(workItem: ContractWorkItem): void;
  emitWorkItemUpdated(workItem: ContractWorkItem): void;
  emitWorkItemProgressUpdated(workItem: ContractWorkItem): void;
  
  emitFileUploaded(contractId: string, file: FileAttachment): void;
  emitFileDeleted(contractId: string, fileId: string): void;
  
  // Event Subscription
  onContractCreated(): Observable<ContractEvent>;
  onContractActivated(): Observable<ContractEvent>;
  onContractCompleted(): Observable<ContractEvent>;
  onWorkItemProgressUpdated(): Observable<WorkItemEvent>;
}
```

#### 事件資料結構
```typescript
interface ContractEvent extends BlueprintEvent {
  type: typeof CONTRACT_EVENTS[keyof typeof CONTRACT_EVENTS];
  data: {
    contractId: string;
    blueprintId: string;
    contract?: Contract;
    previousStatus?: ContractStatus;
    changes?: Partial<Contract>;
    reason?: string;
  };
}

interface WorkItemEvent extends BlueprintEvent {
  type: typeof CONTRACT_EVENTS[keyof typeof CONTRACT_EVENTS];
  data: {
    contractId: string;
    workItemId: string;
    blueprintId: string;
    workItem?: ContractWorkItem;
    progress?: WorkItemProgress;
  };
}
```

### 影響範圍
- **新增 Service**: ContractEventService
- **Event Types**: 新增 CONTRACT_EVENTS 定義
- **現有 Services**: 整合事件發送邏輯
- **Event Bus**: 註冊 Contract 事件類型

### 驗收條件
- [ ] ContractEventService 實作完成
- [ ] 所有事件類型定義完整
- [ ] 事件發送機制實作
- [ ] 事件訂閱機制實作
- [ ] 現有 Services 整合完成
- [ ] 單元測試覆蓋率 > 80%

---

## 🔍 分析階段

### 步驟 1: 查詢官方文件 (Context7)

#### Event-Driven Architecture
**主題**: event-bus, pub-sub-pattern, rxjs

**關鍵發現**:
- ✅ 使用 RxJS Subject 實作 Event Bus
- ✅ 使用 Observable 訂閱事件
- ✅ 使用 `takeUntilDestroyed()` 清理訂閱

#### Blueprint Event Bus
**參考**: Issue Module Event Integration

**關鍵發現**:
- ✅ 所有事件透過 BlueprintEventBus
- ✅ 事件命名: `[module].[action]`
- ✅ 事件包含 blueprintId, timestamp, actor

### 步驟 2: 循序思考分析 (Sequential Thinking)

#### 架構決策

**問題 1**: 事件應該在哪裡發送？
- **決策**: 在 Service 層操作完成後發送
- **理由**:
  - 確保資料已成功更新
  - 避免事件與資料不一致
  - 便於錯誤處理

**問題 2**: 如何避免事件循環？
- **決策**: 事件只描述已發生的事實，不觸發新操作
- **理由**:
  - 避免無限循環
  - 事件僅用於通知
  - Orchestrator 負責協調

**問題 3**: 事件資料應該包含什麼？
- **決策**: 包含完整的 Contract 或 WorkItem 物件
- **理由**:
  - 訂閱者無需額外查詢
  - 減少資料庫存取
  - 提升效能

### 步驟 3: 制定開發計畫 (Software Planning Tool)

#### 實施計畫

**Phase 1: 事件類型定義** (2 小時)
- 定義所有事件類型常數
- 定義事件資料結構

**Phase 2: EventService 實作** (4 小時)
- 實作事件發送方法
- 實作事件訂閱方法

**Phase 3: Services 整合** (4 小時)
- 整合到 ContractManagementService
- 整合到 ContractStatusService
- 整合到 ContractWorkItemsService
- 整合到 ContractUploadService

**Phase 4: 測試** (4 小時)
- 測試事件發送
- 測試事件訂閱
- 測試事件資料完整性

---

## 📐 規劃階段

### 實施步驟

#### Phase 1: 事件類型定義 (2 小時)
- [ ] 定義 CONTRACT_EVENTS 常數
- [ ] 定義 ContractEvent 介面
- [ ] 定義 WorkItemEvent 介面
- [ ] 註冊到 Event Bus

#### Phase 2: ContractEventService 實作 (4 小時)
- [ ] 實作 emitContractCreated()
- [ ] 實作 emitContractUpdated()
- [ ] 實作 emitStatusChanged()
- [ ] 實作 emitContractActivated()
- [ ] 實作 emitContractCompleted()
- [ ] 實作 emitWorkItemCreated()
- [ ] 實作 emitWorkItemProgressUpdated()
- [ ] 實作訂閱方法

#### Phase 3: Services 整合 (4 小時)
- [ ] ContractManagementService 加入事件發送
- [ ] ContractStatusService 加入事件發送
- [ ] ContractWorkItemsService 加入事件發送
- [ ] ContractUploadService 加入事件發送

#### Phase 4: 測試 (4 小時)
- [ ] 測試事件發送
- [ ] 測試事件訂閱
- [ ] 測試事件資料
- [ ] 測試跨 Service 整合

### 檔案清單

#### 新增檔案
```
src/app/core/blueprint/modules/implementations/contract/
├── services/
│   ├── contract-event.service.ts
│   └── contract-event.service.spec.ts
├── events/
│   ├── contract-events.ts
│   ├── contract-event.interface.ts
│   └── work-item-event.interface.ts
```

#### 修改檔案
```
src/app/core/blueprint/events/event-types.ts
src/app/core/blueprint/modules/implementations/contract/services/*.service.ts
```

---

## 📜 開發規範

### 規範檢查清單

#### ⭐ 必須使用工具
- [x] Context7 - 已查詢 Event-Driven Architecture 文檔
- [x] Sequential Thinking - 已完成架構決策分析
- [x] Software Planning Tool - 已制定實施計畫

#### 📡 事件驅動架構
- [x] 所有事件透過 BlueprintEventBus
- [x] 事件命名遵循 `contract.*` 規範
- [x] 事件包含完整上下文資訊
- [x] 使用 `takeUntilDestroyed()` 清理訂閱

---

## ✅ 檢查清單

### 📋 程式碼審查檢查點
- [ ] 事件類型定義完整
- [ ] 事件發送機制實作
- [ ] 事件訂閱機制實作
- [ ] Services 整合完成
- [ ] 測試覆蓋率 > 80%

---

**文件版本**: 1.0.0  
**最後更新**: 2025-12-15  
**下一步**: SETC-016 Contract UI Components
