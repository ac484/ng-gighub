# SETC-011: Contract Management Service

> **任務 ID**: SETC-011  
> **任務名稱**: Contract Management Service Implementation  
> **優先級**: P0 (Critical)  
> **預估工時**: 3 天  
> **依賴**: SETC-010  
> **狀態**: ✅ 已完成
> **完成日期**: 2025-12-15

---

## 📋 任務定義

### 名稱
Contract Management Service - 核心業務邏輯層實作

### 背景 / 目的
基於 SETC-010 的 Repository 層，實作 Service 層的核心業務邏輯。Contract Management Service 負責合約的 CRUD 操作、資料驗證、業務規則執行，並協調與其他模組的交互。

### 需求說明
1. 實作 ContractManagementService 類別
2. 實作 ContractCreationService 類別
3. 實作合約 CRUD 業務邏輯
4. 實作資料驗證
5. 實作業務規則檢查
6. 實作與 Task Module 的關聯驗證

### In Scope / Out of Scope

#### ✅ In Scope
- ContractManagementService 實作
- ContractCreationService 實作
- 合約 CRUD 業務邏輯
- 資料驗證邏輯
- 業務規則執行
- 合約與任務關聯驗證
- 單元測試

#### ❌ Out of Scope
- 檔案上傳功能（SETC-012）
- 狀態管理功能（SETC-013）
- 工項管理功能（SETC-014）
- 事件整合（SETC-015）
- UI 元件（SETC-016）

### 功能行為
Service 層執行業務邏輯，驗證資料完整性，協調 Repository 層操作，並執行業務規則。

### 資料 / API

#### Service 介面

**ContractManagementService**
```typescript
@Injectable({ providedIn: 'root' })
export class ContractManagementService {
  // CRUD Operations
  create(blueprintId: string, data: CreateContractDto): Promise<Contract>;
  update(contractId: string, data: UpdateContractDto): Promise<Contract>;
  getById(contractId: string): Promise<Contract>;
  list(blueprintId: string, filters?: ContractFilters): Promise<Contract[]>;
  delete(contractId: string): Promise<void>;
  
  // Business Logic
  validateForTaskCreation(contractId: string): Promise<ValidationResult>;
  calculateContractProgress(contractId: string): Promise<ContractProgress>;
  checkContractExpiry(contractId: string): Promise<ExpiryStatus>;
  
  // Query Helpers
  findByContractNumber(blueprintId: string, contractNumber: string): Promise<Contract | null>;
  findActiveContracts(blueprintId: string): Promise<Contract[]>;
  findExpiringContracts(blueprintId: string, withinDays: number): Promise<Contract[]>;
}
```

**ContractCreationService**
```typescript
@Injectable({ providedIn: 'root' })
export class ContractCreationService {
  // Contract Creation Workflow
  createDraft(blueprintId: string, data: CreateContractDto): Promise<Contract>;
  validateContractData(data: CreateContractDto): ValidationResult;
  validateContractParties(owner: ContractParty, contractor: ContractParty): ValidationResult;
  validateContractAmount(totalAmount: number, workItems: ContractWorkItem[]): ValidationResult;
  
  // Auto-generation
  generateContractNumber(blueprintId: string): Promise<string>;
  calculateWorkItemTotals(workItems: ContractWorkItem[]): number;
}
```

#### 業務規則

**合約建立驗證**
1. ✅ 合約編號必須唯一
2. ✅ 業主與承商資訊必須完整
3. ✅ 合約金額必須 > 0
4. ✅ 工項總金額必須等於合約金額
5. ✅ 開始日期必須早於結束日期
6. ✅ 合約期限不得少於 1 天

**任務建立驗證**
1. ✅ 合約必須處於 'active' 狀態
2. ✅ 合約未過期
3. ✅ 任務必須關聯到合約工項
4. ✅ 工項尚有未完成數量

**合約更新驗證**
1. ✅ 不可修改已生效合約的基礎資訊（合約編號、雙方、金額）
2. ✅ 只能更新描述、期限、附件
3. ✅ 狀態變更需透過專用 API（SETC-013）

### 影響範圍
- **新增 Service 類別**: ContractManagementService, ContractCreationService
- **Blueprint Container**: 註冊 Contract Management API
- **Event Bus**: 預留事件發送介面（SETC-015 實作）
- **測試檔案**: service 單元測試

### 驗收條件
- [ ] ContractManagementService 實作完成
- [ ] ContractCreationService 實作完成
- [ ] 所有業務規則實作並測試
- [ ] 資料驗證完整
- [ ] 單元測試覆蓋率 > 80%
- [ ] 與 Repository 層整合測試通過
- [ ] TypeScript 編譯無錯誤

---

## 🔍 分析階段

### 步驟 1: 查詢官方文件 (Context7)

#### Angular 20 Service 模式
**查詢庫**: `/websites/angular_dev_v20`  
**主題**: services, dependency-injection, signals

**關鍵發現**:
- ✅ 使用 `@Injectable({ providedIn: 'root' })` 單例模式
- ✅ 使用 `inject()` 函式注入依賴
- ✅ 使用 Signals 管理服務狀態
- ✅ 錯誤處理使用類型化錯誤

#### 業務邏輯設計模式
**查詢庫**: Design Patterns, Domain-Driven Design  
**主題**: service-layer, validation, business-rules

**關鍵發現**:
- ✅ Service 層負責業務邏輯與協調
- ✅ 使用 Validation Pattern 分離驗證邏輯
- ✅ 使用 Factory Pattern 處理複雜建立流程
- ✅ 使用 Strategy Pattern 處理不同業務規則

### 步驟 2: 循序思考分析 (Sequential Thinking)

#### 架構決策

**問題 1**: 應該拆分為幾個 Service 類別？
- **選項 A**: 單一 ContractService 處理所有功能
- **選項 B**: 拆分為 Management, Creation, Status, WorkItems
- **分析**:
  - Issue Module 採用多 Service 拆分模式
  - 符合單一職責原則
  - 便於測試與維護
- **決策**: 拆分為多個專職 Service
- **理由**:
  - ContractManagementService - CRUD 操作
  - ContractCreationService - 建立流程與驗證
  - ContractStatusService - 狀態管理（SETC-013）
  - ContractWorkItemsService - 工項管理（SETC-014）

**問題 2**: 驗證邏輯應該放在哪裡？
- **分析**: 驗證是業務規則的一部分
- **決策**: 在 ContractCreationService 中集中處理
- **理由**:
  - 驗證邏輯重用性高
  - 易於測試
  - 符合單一職責

**問題 3**: 如何處理合約編號生成？
- **分析**: 合約編號必須唯一且有意義
- **決策**: 使用 "Contract Number Generation Strategy"
- **理由**:
  - 格式: `CNT-{YYYYMMDD}-{序號}`
  - 自動生成避免衝突
  - 便於識別與追蹤

**問題 4**: 如何驗證合約是否可用於建立任務？
- **分析**: 需要檢查多個條件
- **決策**: 建立專用驗證方法 `validateForTaskCreation()`
- **理由**:
  - 集中驗證邏輯
  - 返回詳細驗證結果
  - 便於錯誤訊息展示

### 步驟 3: 制定開發計畫 (Software Planning Tool)

#### 實施計畫

**Phase 1: ContractManagementService 基礎** (4 小時)
```typescript
@Injectable({ providedIn: 'root' })
export class ContractManagementService {
  private repository = inject(ContractRepository);
  private blueprintContext = inject(BlueprintContextService);
  private logger = inject(LoggerService);
  
  // State
  private _contracts = signal<Contract[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  
  // Public readonly state
  contracts = this._contracts.asReadonly();
  loading = this._loading.asReadonly();
  error = this._error.asReadonly();
  
  // CRUD methods implementation
}
```

**Phase 2: ContractCreationService 實作** (4 小時)
1. 實作 createDraft() 方法
2. 實作驗證方法
3. 實作合約編號生成
4. 實作工項金額計算

**Phase 3: 業務規則實作** (5 小時)
1. 實作合約建立驗證規則
2. 實作任務建立驗證規則
3. 實作合約更新驗證規則
4. 實作錯誤處理

**Phase 4: 查詢方法實作** (3 小時)
1. 實作 findByContractNumber()
2. 實作 findActiveContracts()
3. 實作 findExpiringContracts()
4. 實作 calculateContractProgress()

**Phase 5: 單元測試** (8 小時)
1. 測試 CRUD 操作
2. 測試驗證邏輯
3. 測試業務規則
4. 測試查詢方法
5. 測試錯誤處理

---

## 📐 規劃階段

### 實施步驟

#### Phase 1: 準備階段 (30 分鐘)
- [ ] 檢視 Issue Module Service 實作
- [ ] 確認 Blueprint Context 整合
- [ ] 準備測試資料

#### Phase 2: ContractManagementService 實作 (4 小時)
- [ ] 建立 Service 類別
- [ ] 實作 create() 方法
- [ ] 實作 update() 方法
- [ ] 實作 getById() 方法
- [ ] 實作 list() 方法
- [ ] 實作 delete() 方法
- [ ] 實作 Signals 狀態管理

#### Phase 3: ContractCreationService 實作 (4 小時)
- [ ] 建立 Service 類別
- [ ] 實作 createDraft() 方法
- [ ] 實作 validateContractData() 方法
- [ ] 實作 validateContractParties() 方法
- [ ] 實作 validateContractAmount() 方法
- [ ] 實作 generateContractNumber() 方法
- [ ] 實作 calculateWorkItemTotals() 方法

#### Phase 4: 業務規則實作 (5 小時)
- [ ] 實作合約建立驗證
- [ ] 實作任務建立驗證 (validateForTaskCreation)
- [ ] 實作合約更新驗證
- [ ] 實作合約過期檢查 (checkContractExpiry)
- [ ] 實作合約進度計算 (calculateContractProgress)

#### Phase 5: 查詢方法實作 (3 小時)
- [ ] 實作 findByContractNumber()
- [ ] 實作 findActiveContracts()
- [ ] 實作 findExpiringContracts()
- [ ] 實作錯誤處理

#### Phase 6: 單元測試 (8 小時)
- [ ] 測試 ContractManagementService CRUD
- [ ] 測試 ContractCreationService 驗證
- [ ] 測試合約編號生成
- [ ] 測試業務規則
- [ ] 測試查詢方法
- [ ] 測試錯誤處理
- [ ] 測試 Signals 狀態更新

#### Phase 7: 整合驗證 (30 分鐘)
- [ ] TypeScript 編譯檢查
- [ ] ESLint 檢查
- [ ] 測試覆蓋率檢查
- [ ] 與 Repository 層整合驗證

### 檔案清單

#### 新增檔案
```
src/app/core/blueprint/modules/implementations/contract/
├── services/
│   ├── contract-management.service.ts
│   ├── contract-management.service.spec.ts
│   ├── contract-creation.service.ts
│   ├── contract-creation.service.spec.ts
│   ├── validation/
│   │   ├── contract-validator.ts
│   │   ├── contract-validator.spec.ts
│   │   └── validation-result.interface.ts
│   └── index.ts
```

#### 修改檔案
```
src/app/core/blueprint/modules/implementations/contract/README.md
src/app/core/blueprint/modules/implementations/contract/exports/contract-api.interface.ts
```

---

## 📜 開發規範

### 規範檢查清單

#### ⭐ 必須使用工具
- [x] Context7 - 已查詢 Angular 20 Service 模式文檔
- [x] Sequential Thinking - 已完成架構決策分析
- [x] Software Planning Tool - 已制定實施計畫

#### 奧卡姆剃刀原則
- [x] KISS - Service 方法保持簡潔
- [x] YAGNI - 不實作不需要的業務規則
- [x] MVP - 專注核心 CRUD 與驗證
- [x] SRP - 每個 Service 職責單一
- [x] 低耦合高內聚 - Service 透過 Repository 存取資料

#### 🏗️ 三層架構嚴格分離
- [x] Service 層僅包含業務邏輯
- [x] 不直接操作 Firestore
- [x] 透過 Repository 存取資料

#### 📡 事件驅動架構
- [x] 預留事件發送介面
- [x] SETC-015 將實作事件整合

#### 🔒 安全性原則
- [x] 資料驗證完整
- [x] 業務規則執行嚴格
- [x] 錯誤訊息不洩漏敏感資訊

#### ⚡ 效能優化原則
- [x] 使用 Signals 管理狀態
- [x] computed() 快取衍生狀態
- [x] 避免不必要的資料查詢

---

## ✅ 檢查清單

### 📋 程式碼審查檢查點

#### Service 實作檢查
- [ ] ContractManagementService 完整
- [ ] ContractCreationService 完整
- [ ] 驗證邏輯完整
- [ ] 業務規則完整
- [ ] 錯誤處理完整

#### 測試檢查
- [ ] CRUD 操作測試完整
- [ ] 驗證邏輯測試完整
- [ ] 業務規則測試完整
- [ ] 錯誤處理測試完整
- [ ] 測試覆蓋率 > 80%

### 💎 程式碼品質
- [ ] TypeScript 嚴格模式無錯誤
- [ ] ESLint 檢查通過
- [ ] 無使用 any 類型
- [ ] 命名清晰且符合規範

### 🏛️ 架構符合性
- [ ] 遵循三層架構
- [ ] Service 不直接操作 Firestore
- [ ] 正確使用 Repository
- [ ] 符合單一職責原則

### ✨ 功能完整性
- [ ] CRUD 操作完整
- [ ] 驗證邏輯完整
- [ ] 業務規則完整
- [ ] 查詢方法完整

---

## 🚀 實施指引

### 開發順序
1. **實作 Management Service** - 核心 CRUD 操作
2. **實作 Creation Service** - 建立流程與驗證
3. **實作業務規則** - 驗證與檢查邏輯
4. **實作查詢方法** - 輔助查詢功能
5. **撰寫測試** - 確保功能正確

### 參考實作
- **Issue Module**: `src/app/core/blueprint/modules/implementations/issue/services/issue-management.service.ts`
- **SETC-003**: Issue Management Service 文檔

### 常見陷阱
⚠️ **驗證邏輯**: 確保所有業務規則都經過測試  
⚠️ **錯誤處理**: 提供清晰的錯誤訊息  
⚠️ **狀態管理**: 正確更新 Signals 狀態  
⚠️ **依賴注入**: 使用 inject() 而非 constructor 注入

---

## 📞 支援與問題

### 問題回報
- Service 實作問題: 參考 Issue Module Service
- 驗證邏輯問題: 參考 Validation Patterns
- Signals 問題: 參考 Angular 20 文檔

### 相關資源
- Angular 20 文檔: `/websites/angular_dev_v20`
- Issue Module Service 參考
- SETC-010 Repository 層
- SETC-009 基礎架構

---

**文件版本**: 1.0.0  
**最後更新**: 2025-12-15  
**下一步**: SETC-012 Contract Upload & Parsing Service
