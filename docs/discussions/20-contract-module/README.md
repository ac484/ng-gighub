# 📝 Contract Module (合約管理模組)

> **SETC 任務編號**: SETC-009 ~ SETC-017  
> **模組狀態**: ✅ 文檔完成  
> **預估工時**: 20 天

---

## 🏗️ Blueprint Event Bus 整合 (MANDATORY)

### 🚨 核心要求
- ✅ **零直接依賴**: Contract Module 不得直接注入其他模組服務
- ✅ **事件驅動**: 所有模組間通訊透過 BlueprintEventBus
- ✅ **階段零模組**: 作為工作流程起點，發送關鍵事件給下游模組
- ✅ **發送領域事件**: 發送 contract.* 系列事件

### 📡 事件整合

#### 發送事件 (Emit)
```typescript
// Contract Module 發送的領域事件
'contract.created'           → 合約建立
'contract.activated'         → 合約生效（觸發 Task Module）
'contract.amended'           → 合約變更
'contract.suspended'         → 合約暫停
'contract.completed'         → 合約完工
'contract.closed'            → 合約結案
'contract.work_item_added'   → 工項新增
'contract.work_item_updated' → 工項更新
```

#### 下游模組訂閱 Contract 事件
```typescript
// Task Module 監聽
'contract.activated' → 啟用任務建立功能

// Finance Module 監聽
'contract.activated' → 建立預算記錄
'contract.work_item_updated' → 更新預算項目

// Invoice Module 監聽
'contract.activated' → 準備計價基準
```

#### 事件處理範例
```typescript
@Injectable({ providedIn: 'root' })
export class ContractEventService {
  private eventBus = inject(BlueprintEventBusService);
  private blueprintContext = inject(BlueprintContextService);
  
  async activateContract(contractId: string): Promise<void> {
    const contract = await this.repository.update(contractId, {
      status: 'active',
      activatedAt: new Date()
    });
    
    // 發送合約生效事件
    this.eventBus.emit({
      type: 'contract.activated',
      blueprintId: contract.blueprintId,
      timestamp: new Date(),
      actor: this.userContext.currentUser()?.id,
      data: {
        contractId: contract.id,
        contractNumber: contract.contractNumber,
        workItems: contract.workItems,
        budget: contract.totalAmount,
        startDate: contract.startDate,
        endDate: contract.endDate
      }
    });
  }
}
```

### 🚫 禁止模式
```typescript
// ❌ 禁止: 直接注入下游模組服務
@Injectable({ providedIn: 'root' })
export class ContractService {
  private taskService = inject(TaskService);       // ❌ 絕對禁止
  private financeService = inject(FinanceService); // ❌ 絕對禁止
  
  async activateContract(contractId: string) {
    await this.repository.update(contractId, { status: 'active' });
    await this.taskService.enableTaskCreation(contractId); // ❌ 直接呼叫
  }
}

// ❌ 禁止: 查詢其他模組資料
async checkTaskProgress(contractId: string) {
  const tasks = await getDocs(
    query(collection(this.firestore, 'tasks'), 
    where('contractId', '==', contractId))  // ❌ 跨模組查詢
  );
}
```

### ✅ 正確模式
```typescript
// ✅ 正確: 透過事件通知下游
@Injectable({ providedIn: 'root' })
export class ContractService {
  private eventBus = inject(BlueprintEventBusService);
  
  async activateContract(contractId: string): Promise<void> {
    await this.repository.update(contractId, { status: 'active' });
    
    // 發送事件讓下游模組自行處理
    this.eventBus.emit({
      type: 'contract.activated',
      blueprintId: this.blueprintContext.currentBlueprint()?.id,
      timestamp: new Date(),
      data: { contractId }
    });
  }
}
```

---

## 📋 任務清單

### SETC-009: Contract Module Foundation
**檔案**: `SETC-009-contract-module-foundation.md`  
**目的**: 建立 Contract Module 基礎架構  
**內容**: 模組註冊、核心資料模型、基礎結構

### SETC-010: Contract Repository Layer
**檔案**: `SETC-010-contract-repository-layer.md`  
**目的**: 實作資料存取層  
**內容**: Repository 介面、Firestore 操作、查詢優化

### SETC-011: Contract Management Service
**檔案**: `SETC-011-contract-management-service.md`  
**目的**: 核心合約管理服務  
**內容**: CRUD 操作、業務邏輯、驗證規則

### SETC-012: Contract Upload & Parsing Service
**檔案**: `SETC-012-contract-upload-parsing-service.md`  
**目的**: 合約檔案上傳與解析  
**內容**: 檔案處理、PDF/Excel 解析、資料擷取

### SETC-013: Contract Status & Lifecycle Service
**檔案**: `SETC-013-contract-status-lifecycle-service.md`  
**目的**: 合約狀態生命週期管理  
**內容**: 狀態機、生命週期追蹤、通知機制

### SETC-014: Contract Work Items Management
**檔案**: `SETC-014-contract-work-items-management.md`  
**目的**: 合約工項管理  
**內容**: 工項拆分、數量管理、單價追蹤

### SETC-015: Contract Event Integration
**檔案**: `SETC-015-contract-event-integration.md`  
**目的**: 事件驅動整合  
**內容**: 領域事件、EventBus、跨模組通訊

### SETC-016: Contract UI Components
**檔案**: `SETC-016-contract-ui-components.md`  
**目的**: 使用者介面元件  
**內容**: List/Detail/Form Components、檔案上傳介面

### SETC-017: Contract Testing & Integration
**檔案**: `SETC-017-contract-testing-integration.md`  
**目的**: 測試覆蓋與整合  
**內容**: 單元測試、整合測試、E2E 測試

---

## 🏗️ 核心功能

### 主要功能
- ✅ 合約基本資訊管理 (CRUD)
- ✅ 合約檔案上傳與解析 (PDF, Excel)
- ✅ 合約狀態生命週期管理
- ✅ 工項拆分與數量管理
- ✅ 合約金額追蹤
- ✅ 事件驅動通知

### 資料模型
- **Contract**: 合約主體
- **WorkItem**: 工項
- **ContractStatus**: 合約狀態
- **ContractFile**: 附件檔案

---

## 📊 進度追蹤

| 任務編號 | 任務名稱 | 文檔狀態 | 實作狀態 |
|---------|---------|---------|---------|
| SETC-009 | Foundation | ✅ 完成 | ⏳ 未開始 |
| SETC-010 | Repository | ✅ 完成 | ⏳ 未開始 |
| SETC-011 | Management | ✅ 完成 | ⏳ 未開始 |
| SETC-012 | Upload & Parse | ✅ 完成 | ⏳ 未開始 |
| SETC-013 | Lifecycle | ✅ 完成 | ⏳ 未開始 |
| SETC-014 | Work Items | ✅ 完成 | ⏳ 未開始 |
| SETC-015 | Events | ✅ 完成 | ⏳ 未開始 |
| SETC-016 | UI | ✅ 完成 | ⏳ 未開始 |
| SETC-017 | Testing | ✅ 完成 | ⏳ 未開始 |

---

## 🔗 相關連結

- **上層目錄**: [返回 discussions](../)
- **總覽文檔**: [01-overview](../01-overview/)
- **規劃文檔**: [02-planning](../02-planning/)

---

**優先級**: P0 (高優先級)  
**最後更新**: 2025-12-16  
**任務數**: 9 個  
**狀態**: ✅ 文檔完成
