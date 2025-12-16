# SETC-010: Contract Repository 實作

> **任務 ID**: SETC-010  
> **任務名稱**: Contract Repository Implementation  
> **優先級**: P0 (Critical)  
> **預估工時**: 2 天  
> **依賴**: SETC-009  
> **狀態**: ✅ 已完成
> **完成日期**: 2025-12-15

---

## 📋 任務定義

### 名稱
Contract Repository 層實作與 Firestore 整合

### 背景 / 目的
基於 SETC-009 建立的模組基礎架構，實作 Repository 層以提供統一的資料存取介面。Repository 模式確保 Service 層不直接操作 Firestore，符合三層架構原則。

### 需求說明
1. 實作 ContractRepository 類別
2. 實作 ContractWorkItemRepository 類別
3. 建立 Firestore Security Rules
4. 實作 CRUD 操作
5. 實作查詢方法
6. 錯誤處理與日誌記錄

### In Scope / Out of Scope

#### ✅ In Scope
- ContractRepository 實作
- ContractWorkItemRepository 實作
- Firestore Security Rules v2
- 基礎 CRUD 操作
- 查詢方法
- 錯誤處理
- 單元測試

#### ❌ Out of Scope
- 業務邏輯（Service 層，SETC-011+）
- UI 元件（SETC-016）
- 狀態管理（Service 層）
- 事件發送（SETC-015）

### 功能行為
Repository 層提供乾淨的資料存取介面，隔離 Firestore 實作細節。

### 資料 / API

#### Firestore Collection 結構
```
/blueprints/{blueprintId}/contracts/{contractId}
  - id: string
  - contractNumber: string
  - title: string
  - owner: ContractParty
  - contractor: ContractParty
  - totalAmount: number
  - currency: string
  - status: ContractStatus
  - startDate: Timestamp
  - endDate: Timestamp
  - originalFiles: FileAttachment[]
  - createdBy: string
  - createdAt: Timestamp
  - updatedAt: Timestamp
  
  /workItems/{workItemId}  # Subcollection
    - id: string
    - code: string
    - name: string
    - description: string
    - unit: string
    - quantity: number
    - unitPrice: number
    - totalPrice: number
    - completedQuantity: number
    - completedAmount: number
    - completionPercentage: number
    - createdAt: Timestamp
    - updatedAt: Timestamp
```

#### Repository 介面

**ContractRepository**
```typescript
export class ContractRepository {
  // CRUD Operations
  create(blueprintId: string, data: CreateContractDto): Promise<Contract>;
  update(blueprintId: string, contractId: string, data: UpdateContractDto): Promise<Contract>;
  findById(blueprintId: string, contractId: string): Promise<Contract | null>;
  findAll(blueprintId: string, filters?: ContractFilters): Promise<Contract[]>;
  delete(blueprintId: string, contractId: string): Promise<void>;
  
  // Status Operations
  updateStatus(blueprintId: string, contractId: string, status: ContractStatus): Promise<void>;
  
  // Real-time Operations
  subscribeToContract(blueprintId: string, contractId: string): Observable<Contract>;
  subscribeToContracts(blueprintId: string, filters?: ContractFilters): Observable<Contract[]>;
}
```

**ContractWorkItemRepository**
```typescript
export class ContractWorkItemRepository {
  // CRUD Operations
  create(blueprintId: string, contractId: string, data: CreateWorkItemDto): Promise<ContractWorkItem>;
  update(blueprintId: string, contractId: string, workItemId: string, data: UpdateWorkItemDto): Promise<ContractWorkItem>;
  findById(blueprintId: string, contractId: string, workItemId: string): Promise<ContractWorkItem | null>;
  findAll(blueprintId: string, contractId: string): Promise<ContractWorkItem[]>;
  delete(blueprintId: string, contractId: string, workItemId: string): Promise<void>;
  
  // Progress Operations
  updateProgress(blueprintId: string, contractId: string, workItemId: string, progress: WorkItemProgress): Promise<void>;
  
  // Real-time Operations
  subscribeToWorkItems(blueprintId: string, contractId: string): Observable<ContractWorkItem[]>;
}
```

#### Firestore Security Rules v2

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper Functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isBlueprintMember(blueprintId) {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/blueprints/$(blueprintId)/members/$(request.auth.uid));
    }
    
    function hasContractRole(blueprintId, roles) {
      let member = get(/databases/$(database)/documents/blueprints/$(blueprintId)/members/$(request.auth.uid));
      return member.data.roles.hasAny(roles);
    }
    
    // Contract Rules
    match /blueprints/{blueprintId}/contracts/{contractId} {
      // Read: Blueprint members can read
      allow read: if isBlueprintMember(blueprintId);
      
      // Create: Contract managers can create
      allow create: if isBlueprintMember(blueprintId) && 
                      hasContractRole(blueprintId, ['contract_manager', 'admin']) &&
                      request.resource.data.blueprintId == blueprintId &&
                      request.resource.data.createdBy == request.auth.uid &&
                      request.resource.data.createdAt == request.time &&
                      request.resource.data.updatedAt == request.time;
      
      // Update: Contract managers can update
      allow update: if isBlueprintMember(blueprintId) && 
                      hasContractRole(blueprintId, ['contract_manager', 'admin']) &&
                      request.resource.data.blueprintId == resource.data.blueprintId &&
                      request.resource.data.createdBy == resource.data.createdBy &&
                      request.resource.data.createdAt == resource.data.createdAt &&
                      request.resource.data.updatedAt == request.time;
      
      // Delete: Only admins can delete
      allow delete: if isBlueprintMember(blueprintId) && 
                      hasContractRole(blueprintId, ['admin']);
      
      // WorkItems Subcollection
      match /workItems/{workItemId} {
        // Read: Blueprint members can read
        allow read: if isBlueprintMember(blueprintId);
        
        // Create: Contract managers can create
        allow create: if isBlueprintMember(blueprintId) && 
                        hasContractRole(blueprintId, ['contract_manager', 'admin']) &&
                        request.resource.data.createdAt == request.time &&
                        request.resource.data.updatedAt == request.time;
        
        // Update: Contract managers can update
        allow update: if isBlueprintMember(blueprintId) && 
                        hasContractRole(blueprintId, ['contract_manager', 'admin']) &&
                        request.resource.data.createdAt == resource.data.createdAt &&
                        request.resource.data.updatedAt == request.time;
        
        // Delete: Only admins can delete
        allow delete: if isBlueprintMember(blueprintId) && 
                        hasContractRole(blueprintId, ['admin']);
      }
    }
  }
}
```

### 影響範圍
- **新增 Repository 類別**: ContractRepository, ContractWorkItemRepository
- **Firestore Security Rules**: 新增 contracts collection 規則
- **測試檔案**: contract.repository.spec.ts, work-item.repository.spec.ts

### 驗收條件
- [ ] ContractRepository 實作完成
- [ ] ContractWorkItemRepository 實作完成
- [ ] Firestore Security Rules 部署完成
- [ ] 所有 CRUD 方法實作並測試
- [ ] 查詢方法實作並測試
- [ ] 即時訂閱方法實作並測試
- [ ] 單元測試覆蓋率 > 80%
- [ ] 錯誤處理完整
- [ ] TypeScript 編譯無錯誤

---

## 🔍 分析階段

### 步驟 1: 查詢官方文件 (Context7)

#### Firebase/Firestore 資料存取
**查詢庫**: `/websites/firebase_google`  
**主題**: firestore-crud, security-rules, subcollections, real-time-listeners

**關鍵發現**:
- ✅ 使用 Firestore Security Rules v2
- ✅ Subcollection 架構適合 WorkItems
- ✅ 使用 Snapshots 進行即時更新
- ✅ 使用 Composite Indexes 優化查詢
- ✅ 錯誤處理使用 FirestoreError

#### Angular Fire 整合
**查詢庫**: `/websites/firebase_google/angular`  
**主題**: angularfire, firestore-integration

**關鍵發現**:
- ✅ 使用 `inject(Firestore)` 注入
- ✅ 使用 `collection()`, `doc()`, `collectionData()`, `docData()`
- ✅ 使用 `addDoc()`, `updateDoc()`, `deleteDoc()`, `setDoc()`
- ✅ 使用 `query()`, `where()`, `orderBy()`, `limit()`

### 步驟 2: 循序思考分析 (Sequential Thinking)

#### 架構決策

**問題 1**: Repository 是否需要繼承基礎類別？
- **分析**: Issue Module 有 BaseRepository
- **決策**: 建立 BaseContractRepository 提供通用方法
- **理由**: 
  - 減少重複程式碼
  - 統一錯誤處理
  - 統一日誌記錄
  - 便於未來維護

**問題 2**: WorkItems 是否需要獨立 Repository？
- **分析**: WorkItems 是 Subcollection，但有獨立的 CRUD 需求
- **決策**: 建立獨立的 ContractWorkItemRepository
- **理由**:
  - 符合單一職責原則
  - API 更清晰易用
  - 便於單獨測試
  - 符合現有模組模式

**問題 3**: 如何處理 Firestore Timestamp 與 JavaScript Date？
- **分析**: Firestore 使用 Timestamp，TypeScript 使用 Date
- **決策**: Repository 層進行轉換
- **理由**:
  - Service 層不需關心 Firestore 細節
  - 統一資料類型
  - 符合架構分層原則

**問題 4**: 查詢方法應該如何設計？
- **分析**: 需要支援多種查詢條件（狀態、日期範圍、關鍵字）
- **決策**: 使用 ContractFilters 介面
- **理由**:
  - 類型安全
  - 易於擴展
  - 保持方法簽名簡潔

### 步驟 3: 制定開發計畫 (Software Planning Tool)

#### 實施計畫

**Phase 1: 基礎 Repository 建立** (3 小時)
```typescript
// base-contract.repository.ts
export abstract class BaseContractRepository {
  protected firestore = inject(Firestore);
  protected logger = inject(LoggerService);
  
  protected handleError(operation: string, error: any): never {
    this.logger.error(`${operation} failed`, error);
    throw this.mapFirestoreError(error);
  }
  
  protected mapFirestoreError(error: FirestoreError): Error {
    // 將 Firestore 錯誤映射為業務錯誤
  }
  
  protected timestampToDate(timestamp: Timestamp): Date {
    return timestamp.toDate();
  }
  
  protected dateToTimestamp(date: Date): Timestamp {
    return Timestamp.fromDate(date);
  }
}
```

**Phase 2: ContractRepository 實作** (4 小時)
1. 實作 CRUD 方法
2. 實作查詢方法
3. 實作即時訂閱方法
4. 實作錯誤處理

**Phase 3: WorkItemRepository 實作** (3 小時)
1. 實作 CRUD 方法
2. 實作進度更新方法
3. 實作即時訂閱方法
4. 實作錯誤處理

**Phase 4: Firestore Security Rules** (2 小時)
1. 撰寫 contracts collection 規則
2. 撰寫 workItems subcollection 規則
3. 測試規則
4. 部署規則

**Phase 5: 單元測試** (4 小時)
1. 測試 ContractRepository CRUD
2. 測試 ContractWorkItemRepository CRUD
3. 測試查詢方法
4. 測試錯誤處理

---

## 📐 規劃階段

### 實施步驟

#### Phase 1: 準備階段 (30 分鐘)
- [ ] 檢視 Issue Module Repository 實作
- [ ] 確認 Firestore 設定
- [ ] 準備測試資料

#### Phase 2: 基礎類別實作 (3 小時)
- [ ] 建立 BaseContractRepository
- [ ] 實作錯誤處理方法
- [ ] 實作類型轉換方法
- [ ] 實作日誌記錄

#### Phase 3: ContractRepository 實作 (4 小時)
- [ ] 實作 create() 方法
- [ ] 實作 update() 方法
- [ ] 實作 findById() 方法
- [ ] 實作 findAll() 方法
- [ ] 實作 delete() 方法
- [ ] 實作 updateStatus() 方法
- [ ] 實作 subscribeToContract() 方法
- [ ] 實作 subscribeToContracts() 方法

#### Phase 4: WorkItemRepository 實作 (3 小時)
- [ ] 實作 create() 方法
- [ ] 實作 update() 方法
- [ ] 實作 findById() 方法
- [ ] 實作 findAll() 方法
- [ ] 實作 delete() 方法
- [ ] 實作 updateProgress() 方法
- [ ] 實作 subscribeToWorkItems() 方法

#### Phase 5: Firestore Security Rules (2 小時)
- [ ] 撰寫 helper functions
- [ ] 撰寫 contracts read rules
- [ ] 撰寫 contracts write rules
- [ ] 撰寫 workItems rules
- [ ] 測試 security rules
- [ ] 部署到 Firestore

#### Phase 6: 單元測試 (4 小時)
- [ ] 測試 ContractRepository create
- [ ] 測試 ContractRepository read
- [ ] 測試 ContractRepository update
- [ ] 測試 ContractRepository delete
- [ ] 測試 ContractRepository queries
- [ ] 測試 WorkItemRepository CRUD
- [ ] 測試錯誤處理
- [ ] 測試即時訂閱

#### Phase 7: 驗證與整合 (30 分鐘)
- [ ] TypeScript 編譯檢查
- [ ] ESLint 檢查
- [ ] 測試覆蓋率檢查
- [ ] 與 SETC-009 整合驗證

### 檔案清單

#### 新增檔案
```
src/app/core/blueprint/modules/implementations/contract/
├── repositories/
│   ├── base-contract.repository.ts
│   ├── contract.repository.ts
│   ├── contract.repository.spec.ts
│   ├── contract-work-item.repository.ts
│   ├── contract-work-item.repository.spec.ts
│   └── index.ts
└── security-rules/
    └── contracts.rules

firestore.rules (更新)
```

#### 修改檔案
```
src/app/core/blueprint/modules/implementations/contract/README.md
```

---

## 📜 開發規範

### 規範檢查清單

#### ⭐ 必須使用工具
- [x] Context7 - 已查詢 Firebase/Firestore 與 Angular Fire 文檔
- [x] Sequential Thinking - 已完成架構決策分析
- [x] Software Planning Tool - 已制定實施計畫

#### 奧卡姆剃刀原則
- [x] KISS - Repository 方法保持簡潔
- [x] YAGNI - 不實作不需要的查詢方法
- [x] MVP - 專注核心 CRUD 功能
- [x] SRP - 每個 Repository 職責單一
- [x] 低耦合高內聚 - Repository 不依賴 Service 層

#### 🏗️ 三層架構嚴格分離
- [x] Repository 層不包含業務邏輯
- [x] 僅負責資料存取
- [x] 隔離 Firestore 實作細節

#### 📦 Repository 模式強制
- [x] 所有 Firestore 操作透過 Repository
- [x] 實作 Firestore Security Rules
- [x] Repository 放置在模組專屬目錄

#### 🔒 安全性原則
- [x] 實作 Firestore Security Rules v2
- [x] 基於 request.auth 驗證身份
- [x] 基於角色控制權限
- [x] 防止資料洩漏

#### ⚡ 效能優化原則
- [x] 使用 Subcollection 優化查詢
- [x] 使用 Composite Indexes
- [x] 即時訂閱使用 Snapshots
- [x] 錯誤處理避免重複查詢

---

## ✅ 檢查清單

### 📋 程式碼審查檢查點

#### Repository 實作檢查
- [ ] BaseContractRepository 完整
- [ ] ContractRepository 實作完成
- [ ] ContractWorkItemRepository 實作完成
- [ ] 錯誤處理完整
- [ ] 類型轉換正確

#### Security Rules 檢查
- [ ] Helper functions 完整
- [ ] Read rules 正確
- [ ] Write rules 正確
- [ ] 角色檢查正確
- [ ] 已測試並部署

#### 測試檢查
- [ ] ContractRepository 測試完整
- [ ] WorkItemRepository 測試完整
- [ ] 錯誤處理測試完整
- [ ] 測試覆蓋率 > 80%

### 💎 程式碼品質
- [ ] TypeScript 嚴格模式無錯誤
- [ ] ESLint 檢查通過
- [ ] 無使用 any 類型
- [ ] 命名清晰且符合規範

### 🏛️ 架構符合性
- [ ] 遵循 Repository 模式
- [ ] 不包含業務邏輯
- [ ] 正確隔離 Firestore 細節
- [ ] 符合三層架構

### ✨ 功能完整性
- [ ] CRUD 操作完整
- [ ] 查詢方法完整
- [ ] 即時訂閱完整
- [ ] 錯誤處理完整

---

## 🚀 實施指引

### 開發順序
1. **建立基礎類別** - BaseContractRepository 提供通用方法
2. **實作 ContractRepository** - 主要資料存取
3. **實作 WorkItemRepository** - Subcollection 存取
4. **撰寫 Security Rules** - 確保資料安全
5. **撰寫測試** - 確保功能正確

### 參考實作
- **Issue Module**: `src/app/core/blueprint/modules/implementations/issue/repositories/issue.repository.ts`
- **SETC-002**: Issue Repository 實作文檔

### 常見陷阱
⚠️ **Timestamp 轉換**: 務必正確處理 Firestore Timestamp 與 Date 轉換  
⚠️ **錯誤處理**: 捕捉並映射所有 Firestore 錯誤  
⚠️ **Security Rules**: 測試所有權限場景  
⚠️ **測試資料**: 使用 Firestore Emulator 進行測試

---

## 📞 支援與問題

### 問題回報
- Repository 實作問題: 參考 Issue Module Repository
- Firestore 問題: 參考 Firebase 文檔
- Security Rules 問題: 參考 Firestore Security Rules 文檔

### 相關資源
- Firebase 文檔: `/websites/firebase_google`
- Angular Fire 文檔: `/websites/firebase_google/angular`
- Issue Module Repository 參考
- SETC-009 基礎架構

---

**文件版本**: 1.0.0  
**最後更新**: 2025-12-15  
**下一步**: SETC-011 Contract Management Service
