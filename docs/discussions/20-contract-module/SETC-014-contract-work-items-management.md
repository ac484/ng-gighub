# SETC-014: Contract Work Items Management

> **任務 ID**: SETC-014  
> **任務名稱**: Contract Work Items Management Service  
> **優先級**: P0 (Critical)  
> **預估工時**: 2 天  
> **依賴**: SETC-011  
> **狀態**: ✅ 已完成

---

## 📋 任務定義

### 名稱
Contract Work Items Management Service - 合約工項管理服務

### 背景 / 目的
實作合約工項（Work Items）管理服務，支援工項 CRUD、進度追蹤、任務關聯驗證。工項是連接合約與任務的橋樑，是財務計算的基礎。

### 需求說明
1. 實作 ContractWorkItemsService 類別
2. 實作工項 CRUD 操作
3. 實作工項進度計算
4. 實作工項與任務關聯
5. 實作工項金額統計

### In Scope / Out of Scope

#### ✅ In Scope
- 工項 CRUD 操作
- 工項進度追蹤
- 工項與任務關聯
- 工項金額統計
- 工項完成度計算

#### ❌ Out of Scope
- 工項變更審批流程（未來擴展）
- 工項模板功能（未來擴展）

### 功能行為
管理合約下的所有工項，追蹤工項執行進度，關聯到具體任務，並計算工項完成金額。

### 資料 / API

#### Service 介面
```typescript
@Injectable({ providedIn: 'root' })
export class ContractWorkItemsService {
  // CRUD Operations
  create(contractId: string, data: CreateWorkItemDto): Promise<ContractWorkItem>;
  update(contractId: string, workItemId: string, data: UpdateWorkItemDto): Promise<ContractWorkItem>;
  getById(contractId: string, workItemId: string): Promise<ContractWorkItem>;
  list(contractId: string): Promise<ContractWorkItem[]>;
  delete(contractId: string, workItemId: string): Promise<void>;
  
  // Progress Management
  updateProgress(contractId: string, workItemId: string, progress: WorkItemProgress): Promise<ContractWorkItem>;
  calculateProgress(workItemId: string): Promise<WorkItemProgress>;
  
  // Task Association
  linkTask(workItemId: string, taskId: string): Promise<void>;
  unlinkTask(workItemId: string, taskId: string): Promise<void>;
  getLinkedTasks(workItemId: string): Promise<string[]>;
  validateTaskLink(workItemId: string, taskId: string): Promise<ValidationResult>;
  
  // Statistics
  calculateTotalAmount(workItems: ContractWorkItem[]): number;
  calculateCompletedAmount(workItems: ContractWorkItem[]): number;
  getWorkItemStatistics(contractId: string): Promise<WorkItemStatistics>;
}
```

#### 工項進度計算
```typescript
interface WorkItemProgress {
  completedQuantity: number;     // 已完成數量
  totalQuantity: number;          // 總數量
  completedAmount: number;        // 已完成金額
  totalAmount: number;            // 總金額
  completionPercentage: number;   // 完成百分比
}

interface WorkItemStatistics {
  totalItems: number;
  totalAmount: number;
  completedAmount: number;
  pendingAmount: number;
  completionPercentage: number;
  itemsByCategory: Record<string, number>;
}
```

#### 工項與任務關聯驗證
1. ✅ 任務必須屬於相同合約
2. ✅ 工項必須有剩餘數量
3. ✅ 工項未被刪除
4. ✅ 任務未重複關聯同一工項

### 影響範圍
- **新增 Service**: ContractWorkItemsService
- **Firestore Subcollection**: /contracts/{id}/workItems
- **任務模組整合**: 驗證任務與工項關聯

### 驗收條件
- [ ] ContractWorkItemsService 實作完成
- [ ] 工項 CRUD 功能完整
- [ ] 進度計算正確
- [ ] 任務關聯驗證完整
- [ ] 統計計算正確
- [ ] 單元測試覆蓋率 > 80%

---

## 🔍 分析階段

### 步驟 1: 查詢官方文件 (Context7)

#### Firestore Subcollection
**查詢庫**: `/websites/firebase_google`  
**主題**: subcollections, queries

**關鍵發現**:
- ✅ 使用 Subcollection 儲存工項
- ✅ 工項查詢限定在合約範圍
- ✅ 使用 Transaction 確保資料一致性

### 步驟 2: 循序思考分析 (Sequential Thinking)

#### 架構決策

**問題 1**: 工項進度如何計算？
- **決策**: 基於數量與金額雙重計算
- **理由**:
  - 數量進度：completedQuantity / quantity
  - 金額進度：completedAmount / totalPrice
  - 支援部分完成統計

**問題 2**: 工項與任務如何關聯？
- **決策**: 在工項中記錄 linkedTaskIds 陣列
- **理由**:
  - 一個工項可對應多個任務
  - 便於查詢工項下的所有任務
  - 支援任務解除關聯

**問題 3**: 如何防止工項金額與合約金額不一致？
- **決策**: 在 ContractCreationService 驗證
- **理由**:
  - 建立時強制驗證
  - 更新時重新驗證
  - 提供明確錯誤訊息

### 步驟 3: 制定開發計畫 (Software Planning Tool)

#### 實施計畫

**Phase 1: CRUD 實作** (3 小時)
- 實作工項建立
- 實作工項更新
- 實作工項查詢
- 實作工項刪除

**Phase 2: 進度管理** (3 小時)
- 實作進度更新
- 實作進度計算
- 實作統計計算

**Phase 3: 任務關聯** (3 小時)
- 實作任務連結
- 實作任務解除連結
- 實作關聯驗證

**Phase 4: 測試** (5 小時)
- 單元測試
- 整合測試
- 驗證測試

---

## 📐 規劃階段

### 實施步驟

#### Phase 1: CRUD 實作 (3 小時)
- [ ] 實作 create()
- [ ] 實作 update()
- [ ] 實作 getById()
- [ ] 實作 list()
- [ ] 實作 delete()

#### Phase 2: 進度管理 (3 小時)
- [ ] 實作 updateProgress()
- [ ] 實作 calculateProgress()
- [ ] 實作 calculateTotalAmount()
- [ ] 實作 calculateCompletedAmount()
- [ ] 實作 getWorkItemStatistics()

#### Phase 3: 任務關聯 (3 小時)
- [ ] 實作 linkTask()
- [ ] 實作 unlinkTask()
- [ ] 實作 getLinkedTasks()
- [ ] 實作 validateTaskLink()

#### Phase 4: 測試 (5 小時)
- [ ] 測試 CRUD 操作
- [ ] 測試進度計算
- [ ] 測試任務關聯
- [ ] 測試統計計算
- [ ] 整合測試

### 檔案清單

#### 新增檔案
```
src/app/core/blueprint/modules/implementations/contract/
├── services/
│   ├── contract-work-items.service.ts
│   ├── contract-work-items.service.spec.ts
│   └── work-item-progress-calculator.ts
```

---

## 📜 開發規範

### 規範檢查清單

#### ⭐ 必須使用工具
- [x] Context7 - 已查詢 Firestore Subcollection 文檔
- [x] Sequential Thinking - 已完成架構決策分析
- [x] Software Planning Tool - 已制定實施計畫

#### 奧卡姆剃刀原則
- [x] KISS - 進度計算邏輯簡潔
- [x] MVP - 專注核心工項管理
- [x] SRP - 每個方法職責單一

---

## ✅ 檢查清單

### 📋 程式碼審查檢查點
- [ ] CRUD 操作完整
- [ ] 進度計算正確
- [ ] 任務關聯功能完整
- [ ] 統計計算正確
- [ ] 測試覆蓋率 > 80%

---

**文件版本**: 1.0.0  
**最後更新**: 2025-12-15  
**下一步**: SETC-015 Contract Event Integration
