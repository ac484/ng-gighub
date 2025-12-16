# SETC-013: Contract Status & Lifecycle Service

> **任務 ID**: SETC-013  
> **任務名稱**: Contract Status & Lifecycle Service  
> **優先級**: P0 (Critical)  
> **預估工時**: 2 天  
> **依賴**: SETC-011  
> **狀態**: ✅ 已完成

---

## 📋 任務定義

### 名稱
Contract Status & Lifecycle Service - 合約狀態管理與生命週期控制

### 背景 / 目的
實作合約狀態管理服務，控制合約生命週期轉換，記錄狀態變更歷史，並確保狀態轉換符合業務規則。

### 需求說明
1. 實作 ContractStatusService 類別
2. 實作 ContractLifecycleService 類別
3. 實作狀態轉換邏輯
4. 實作狀態變更歷史記錄
5. 實作狀態轉換驗證

### In Scope / Out of Scope

#### ✅ In Scope
- 狀態轉換邏輯
- 狀態變更歷史
- 狀態轉換驗證
- 合約啟用流程
- 合約完成流程
- 合約終止流程

#### ❌ Out of Scope
- 合約變更管理（未來擴展）
- 合約續約流程（未來擴展）

### 功能行為
管理合約從建立到結束的完整生命週期，確保狀態轉換符合業務規則，並記錄所有變更歷史。

### 資料 / API

#### 合約狀態流程
```
draft (草稿)
  ↓ activate()
pending_activation (待生效)
  ↓ activate()
active (已生效) ← 只有此狀態可建立任務
  ↓ complete()
completed (已完成)

任何狀態 → terminate() → terminated (已終止)
```

#### Service 介面
```typescript
@Injectable({ providedIn: 'root' })
export class ContractStatusService {
  // Status Management
  changeStatus(contractId: string, newStatus: ContractStatus, reason?: string): Promise<Contract>;
  activate(contractId: string): Promise<Contract>;
  complete(contractId: string): Promise<Contract>;
  terminate(contractId: string, reason: string): Promise<Contract>;
  
  // Status History
  getStatusHistory(contractId: string): Promise<ContractStatusHistory[]>;
  addStatusHistory(contractId: string, history: ContractStatusHistory): Promise<void>;
  
  // Status Validation
  validateStatusTransition(currentStatus: ContractStatus, newStatus: ContractStatus): ValidationResult;
  canActivateContract(contractId: string): Promise<ValidationResult>;
  canCompleteContract(contractId: string): Promise<ValidationResult>;
}

@Injectable({ providedIn: 'root' })
export class ContractLifecycleService {
  // Lifecycle Management
  initializeContract(contractId: string): Promise<void>;
  activateContract(contractId: string): Promise<void>;
  completeContract(contractId: string): Promise<void>;
  terminateContract(contractId: string, reason: string): Promise<void>;
  
  // Lifecycle Checks
  checkContractHealth(contractId: string): Promise<HealthCheckResult>;
  checkExpiryStatus(contractId: string): Promise<ExpiryStatus>;
}
```

#### 狀態變更歷史
```typescript
interface ContractStatusHistory {
  id: string;
  contractId: string;
  previousStatus: ContractStatus;
  newStatus: ContractStatus;
  changedBy: string;
  changedAt: Date;
  reason?: string;
  metadata?: Record<string, any>;
}
```

#### 狀態轉換規則
| From | To | 條件 |
|------|----|----|
| draft | pending_activation | 合約資料完整 |
| pending_activation | active | 管理員確認 |
| active | completed | 所有任務完成 |
| any | terminated | 管理員決定 + 原因 |

### 影響範圍
- **新增 Service**: ContractStatusService, ContractLifecycleService
- **Firestore Subcollection**: /contracts/{id}/statusHistory
- **Event Bus**: 狀態變更事件（SETC-015）

### 驗收條件
- [ ] ContractStatusService 實作完成
- [ ] ContractLifecycleService 實作完成
- [ ] 所有狀態轉換邏輯實作
- [ ] 狀態歷史記錄功能完成
- [ ] 狀態轉換驗證完整
- [ ] 單元測試覆蓋率 > 80%

---

## 🔍 分析階段

### 步驟 1: 查詢官方文件 (Context7)

#### 狀態機模式
**主題**: state-machine-pattern, lifecycle-management

**關鍵發現**:
- ✅ 使用 State Machine Pattern
- ✅ 定義明確的狀態轉換規則
- ✅ 記錄狀態變更歷史
- ✅ 驗證狀態轉換合法性

### 步驟 2: 循序思考分析 (Sequential Thinking)

#### 架構決策

**問題 1**: 狀態歷史應該如何儲存？
- **決策**: 使用 Subcollection `/contracts/{id}/statusHistory`
- **理由**:
  - 與合約資料分離
  - 查詢效能更好
  - 支援無限歷史記錄

**問題 2**: 如何防止非法狀態轉換？
- **決策**: 實作狀態轉換驗證器
- **理由**:
  - 集中驗證邏輯
  - 易於測試
  - 防止資料不一致

**問題 3**: 合約啟用是否需要檢查前置條件？
- **決策**: 實作 canActivateContract() 驗證
- **理由**:
  - 確保資料完整性
  - 防止啟用不完整合約
  - 提供明確錯誤訊息

### 步驟 3: 制定開發計畫 (Software Planning Tool)

#### 實施計畫

**Phase 1: StatusService 實作** (4 小時)
- 實作狀態轉換方法
- 實作狀態歷史記錄
- 實作驗證邏輯

**Phase 2: LifecycleService 實作** (3 小時)
- 實作生命週期管理方法
- 實作健康檢查
- 實作過期檢查

**Phase 3: 測試** (5 小時)
- 測試狀態轉換
- 測試歷史記錄
- 測試驗證邏輯
- 測試生命週期流程

---

## 📐 規劃階段

### 實施步驟

#### Phase 1: ContractStatusService 實作 (4 小時)
- [ ] 實作 changeStatus()
- [ ] 實作 activate()
- [ ] 實作 complete()
- [ ] 實作 terminate()
- [ ] 實作 getStatusHistory()
- [ ] 實作 validateStatusTransition()

#### Phase 2: ContractLifecycleService 實作 (3 小時)
- [ ] 實作 initializeContract()
- [ ] 實作 activateContract()
- [ ] 實作 completeContract()
- [ ] 實作 terminateContract()
- [ ] 實作 checkContractHealth()
- [ ] 實作 checkExpiryStatus()

#### Phase 3: 狀態轉換驗證 (2 小時)
- [ ] 實作狀態轉換規則
- [ ] 實作前置條件檢查
- [ ] 實作錯誤處理

#### Phase 4: 測試 (5 小時)
- [ ] 測試所有狀態轉換
- [ ] 測試非法轉換阻擋
- [ ] 測試歷史記錄
- [ ] 測試生命週期流程
- [ ] 整合測試

### 檔案清單

#### 新增檔案
```
src/app/core/blueprint/modules/implementations/contract/
├── services/
│   ├── contract-status.service.ts
│   ├── contract-status.service.spec.ts
│   ├── contract-lifecycle.service.ts
│   ├── contract-lifecycle.service.spec.ts
│   ├── status-transition-validator.ts
│   └── status-transition-validator.spec.ts
```

---

## 📜 開發規範

### 規範檢查清單

#### ⭐ 必須使用工具
- [x] Context7 - 已查詢狀態機模式文檔
- [x] Sequential Thinking - 已完成架構決策分析
- [x] Software Planning Tool - 已制定實施計畫

#### 奧卡姆剃刀原則
- [x] KISS - 狀態轉換邏輯簡潔
- [x] MVP - 專注核心狀態管理
- [x] SRP - 每個方法職責單一

---

## ✅ 檢查清單

### 📋 程式碼審查檢查點
- [ ] 狀態轉換邏輯完整
- [ ] 歷史記錄功能完整
- [ ] 驗證邏輯完整
- [ ] 生命週期管理完整
- [ ] 測試覆蓋率 > 80%

---

**文件版本**: 1.0.0  
**最後更新**: 2025-12-15  
**下一步**: SETC-014 Contract Work Items Management
