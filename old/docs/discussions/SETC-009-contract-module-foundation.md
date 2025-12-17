# SETC-009: Contract Module 基礎設定

> **任務 ID**: SETC-009  
> **任務名稱**: Contract Module Foundation Setup  
> **優先級**: P0 (Critical)  
> **預估工時**: 2 天  
> **依賴**: 無  
> **狀態**: ✅ 已完成
> **完成日期**: 2025-12-15

---

## 📋 任務定義

### 名稱
Contract Module 基礎設定與架構建立

### 背景 / 目的
根據 SETC.md 工作流程定義，合約管理是整個系統的起點（階段零）。本任務負責建立 Contract Module 的基礎架構，包括目錄結構、TypeScript 介面定義、模組配置與公開 API 契約。

### 需求說明
1. 建立 Contract Module 完整目錄結構
2. 定義 TypeScript 資料模型介面
3. 建立模組配置與元資料
4. 定義公開 API 契約
5. 建立模組文檔

### In Scope / Out of Scope

#### ✅ In Scope
- Contract Module 目錄結構
- TypeScript 介面與類型定義
- 模組配置檔案
- 公開 API 介面定義
- README 文檔

#### ❌ Out of Scope
- 實際業務邏輯實作（後續任務）
- Repository 實作（SETC-010）
- Service 實作（SETC-011+）
- UI 元件（SETC-016）
- 測試（SETC-017）

### 功能行為
建立完整的模組架構，為後續開發提供清晰的結構與契約。

### 資料 / API

#### 核心資料模型

**Contract** (合約)
```typescript
interface Contract {
  id: string;
  blueprintId: string;
  contractNumber: string;
  title: string;
  description?: string;
  
  // 合約雙方
  owner: ContractParty;
  contractor: ContractParty;
  
  // 金額
  totalAmount: number;
  currency: string;
  
  // 工項
  workItems: ContractWorkItem[];
  
  // 條款
  terms?: ContractTerm[];
  
  // 狀態
  status: ContractStatus;
  
  // 期限
  signedDate?: Date;
  startDate: Date;
  endDate: Date;
  
  // 文件
  originalFiles: FileAttachment[];
  parsedData?: ContractParsedData;
  
  // 審計
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt: Date;
}
```

**ContractWorkItem** (合約工項)
```typescript
interface ContractWorkItem {
  id: string;
  contractId: string;
  code: string;
  name: string;
  description: string;
  category?: string;
  
  // 數量與單位
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  
  // 關聯任務
  linkedTaskIds?: string[];
  
  // 執行狀態
  completedQuantity: number;
  completedAmount: number;
  completionPercentage: number;
  
  // 審計
  createdAt: Date;
  updatedAt: Date;
}
```

**ContractParty** (合約方資訊)
```typescript
interface ContractParty {
  id: string;
  name: string;
  type: 'owner' | 'contractor' | 'subcontractor';
  
  // 聯絡資訊
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  
  // 地址
  address?: string;
  
  // 稅務資訊
  taxId?: string;
  businessNumber?: string;
}
```

**ContractStatus** (合約狀態)
```typescript
type ContractStatus = 
  | 'draft'                // 草稿
  | 'pending_activation'   // 待生效
  | 'active'              // 已生效
  | 'completed'           // 已完成
  | 'terminated';         // 已終止
```

**ContractTerm** (合約條款)
```typescript
interface ContractTerm {
  id: string;
  category: string;
  title: string;
  content: string;
  order: number;
}
```

**FileAttachment** (檔案附件)
```typescript
interface FileAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: Date;
}
```

**ContractParsedData** (OCR/AI 解析資料 - 第一版不實作)
```typescript
interface ContractParsedData {
  parsingEngine: 'ocr' | 'ai';
  parsedAt: Date;
  confidence: number;
  extractedData: {
    contractNumber?: string;
    totalAmount?: number;
    parties?: Partial<ContractParty>[];
    workItems?: Partial<ContractWorkItem>[];
    terms?: Partial<ContractTerm>[];
  };
  needsVerification: boolean;
}
```

#### 公開 API 介面

```typescript
export interface IContractModuleApi {
  // 基礎 CRUD
  management: IContractManagementApi;
  
  // 合約上傳與解析
  upload: IContractUploadApi;
  
  // 合約狀態管理
  status: IContractStatusApi;
  
  // 工項管理
  workItems: IContractWorkItemsApi;
  
  // 合約變更
  changes: IContractChangesApi;
  
  // 事件
  events: IContractEventApi;
}

export interface IContractManagementApi {
  // 建立合約
  create(data: CreateContractDto): Promise<Contract>;
  
  // 更新合約
  update(id: string, data: UpdateContractDto): Promise<Contract>;
  
  // 取得合約
  getById(id: string): Promise<Contract | null>;
  
  // 查詢合約列表
  list(blueprintId: string, filters?: ContractFilters): Promise<Contract[]>;
  
  // 刪除合約（軟刪除）
  delete(id: string): Promise<void>;
  
  // 驗證合約是否可用於建立任務
  validateForTaskCreation(contractId: string): Promise<ValidationResult>;
}

export interface IContractUploadApi {
  // 上傳合約檔案
  uploadFile(contractId: string, file: File): Promise<FileAttachment>;
  
  // 觸發解析（第一版不實作）
  triggerParsing(contractId: string): Promise<void>;
  
  // 確認解析結果（第一版不實作）
  confirmParsedData(contractId: string, data: ContractParsedData): Promise<void>;
}

export interface IContractStatusApi {
  // 變更合約狀態
  changeStatus(contractId: string, newStatus: ContractStatus, reason?: string): Promise<Contract>;
  
  // 啟用合約
  activate(contractId: string): Promise<Contract>;
  
  // 完成合約
  complete(contractId: string): Promise<Contract>;
  
  // 終止合約
  terminate(contractId: string, reason: string): Promise<Contract>;
  
  // 取得狀態歷史
  getStatusHistory(contractId: string): Promise<ContractStatusHistory[]>;
}

export interface IContractWorkItemsApi {
  // 新增工項
  add(contractId: string, workItem: CreateWorkItemDto): Promise<ContractWorkItem>;
  
  // 更新工項
  update(contractId: string, workItemId: string, data: UpdateWorkItemDto): Promise<ContractWorkItem>;
  
  // 刪除工項
  delete(contractId: string, workItemId: string): Promise<void>;
  
  // 取得工項列表
  list(contractId: string): Promise<ContractWorkItem[]>;
  
  // 更新工項完成進度
  updateProgress(contractId: string, workItemId: string, progress: WorkItemProgress): Promise<ContractWorkItem>;
}
```

### 影響範圍
- **新增模組**: `src/app/core/blueprint/modules/implementations/contract/`
- **Blueprint Container**: 需註冊 Contract Module
- **Event Types**: 新增 Contract 相關事件定義
- **Firestore**: 需建立 `contracts` collection

### 驗收條件
- [ ] 目錄結構完整建立
- [ ] 所有 TypeScript 介面定義完成
- [ ] 模組配置檔案完整
- [ ] 公開 API 介面定義清晰
- [ ] README 文檔完整
- [ ] TypeScript 編譯無錯誤

---

## 🔍 分析階段

### 步驟 1: 查詢官方文件 (Context7)

#### Angular 20 架構模式
**查詢庫**: `/websites/angular_dev_v20`  
**主題**: signals, standalone-components, dependency-injection

**關鍵發現**:
- ✅ 使用 Standalone Components（無 NgModules）
- ✅ 使用 Signals 進行狀態管理
- ✅ 使用 `inject()` 函式注入依賴
- ✅ 使用新控制流語法（@if, @for, @switch）

#### Firebase/Firestore 資料模型
**查詢庫**: `/websites/firebase_google`  
**主題**: firestore, security-rules

**關鍵發現**:
- ✅ 使用 Firestore Security Rules v2
- ✅ Collection/Subcollection 架構
- ✅ 基於 request.auth 的身份驗證
- ✅ 基於 resource.data 的權限驗證

### 步驟 2: 循序思考分析 (Sequential Thinking)

#### 架構決策

**問題 1**: Contract Module 應該放在哪裡？
- **分析**: 根據 Blueprint Container 架構，Contract Module 屬於業務模組
- **決策**: 放在 `src/app/core/blueprint/modules/implementations/contract/`
- **理由**: 
  - 與其他業務模組（tasks, acceptance, finance）平行
  - 符合現有架構模式
  - 便於管理與維護

**問題 2**: 合約工項（WorkItems）應該是 Subcollection 還是獨立 Collection？
- **選項 A**: Subcollection - `/contracts/{contractId}/workItems/{workItemId}`
- **選項 B**: 獨立 Collection - `/contractWorkItems/{workItemId}`
- **分析**:
  - 工項強依賴於合約
  - 查詢通常以合約為範圍
  - 不需要跨合約查詢工項
- **決策**: 使用 Subcollection
- **理由**: 
  - 資料隔離性強
  - 查詢效能更好
  - 符合父子關係語義

**問題 3**: OCR/AI 解析功能應該如何處理？
- **分析**: SETC-ANALYSIS.md 建議第一版不實作
- **決策**: 保留介面定義，實作留空
- **理由**:
  - 符合 YAGNI 原則
  - 避免過度設計
  - 可在未來擴展
  - 先專注於核心功能

**問題 4**: 合約狀態變更是否需要歷史記錄？
- **分析**: 合約狀態變更是關鍵操作，需要審計追蹤
- **決策**: 建立 ContractStatusHistory
- **理由**:
  - 符合稽核需求
  - 可追溯狀態變更
  - 支援爭議解決

### 步驟 3: 制定開發計畫 (Software Planning Tool)

#### 實施計畫

**Phase 1: 目錄結構建立** (2 小時)
```
src/app/core/blueprint/modules/implementations/contract/
├── models/                      # 資料模型
│   ├── contract.model.ts        # 合約介面
│   ├── work-item.model.ts       # 工項介面
│   ├── contract-party.model.ts  # 合約方介面
│   └── index.ts                 # 匯出
├── repositories/                # 資料存取層（SETC-010）
│   └── .gitkeep
├── services/                    # 業務邏輯層（SETC-011+）
│   └── .gitkeep
├── config/                      # 模組配置
│   └── module.config.ts
├── exports/                     # 公開 API
│   ├── contract-api.interface.ts
│   └── index.ts
├── contract.module.ts           # Angular 模組（預留）
├── module.metadata.ts           # 模組元資料
└── README.md                    # 模組文檔
```

**Phase 2: TypeScript 介面定義** (3 小時)
1. 建立 `models/contract.model.ts`
2. 建立 `models/work-item.model.ts`
3. 建立 `models/contract-party.model.ts`
4. 建立 `models/index.ts` 統一匯出

**Phase 3: 公開 API 定義** (2 小時)
1. 建立 `exports/contract-api.interface.ts`
2. 定義所有公開介面
3. 建立 `exports/index.ts` 匯出

**Phase 4: 模組配置** (1 小時)
1. 建立 `module.metadata.ts`
2. 建立 `config/module.config.ts`
3. 定義模組資訊與設定

**Phase 5: 文檔撰寫** (2 小時)
1. 建立 README.md
2. 記錄模組用途與架構
3. 記錄 API 使用範例

---

## 📐 規劃階段

### 實施步驟

#### Phase 1: 準備階段 (30 分鐘)
- [ ] 確認 Blueprint Container 架構
- [ ] 檢視 Issue Module 實作參考
- [ ] 準備開發環境

#### Phase 2: 目錄結構建立 (2 小時)
- [ ] 建立主目錄 `contract/`
- [ ] 建立 `models/` 目錄
- [ ] 建立 `repositories/` 目錄（預留）
- [ ] 建立 `services/` 目錄（預留）
- [ ] 建立 `config/` 目錄
- [ ] 建立 `exports/` 目錄

#### Phase 3: 資料模型實作 (3 小時)
- [ ] 實作 `Contract` 介面
- [ ] 實作 `ContractWorkItem` 介面
- [ ] 實作 `ContractParty` 介面
- [ ] 實作 `ContractStatus` 類型
- [ ] 實作 `ContractTerm` 介面
- [ ] 實作 `FileAttachment` 介面
- [ ] 實作 `ContractParsedData` 介面
- [ ] 建立 DTOs（CreateContractDto, UpdateContractDto 等）

#### Phase 4: API 介面定義 (2 小時)
- [ ] 定義 `IContractModuleApi`
- [ ] 定義 `IContractManagementApi`
- [ ] 定義 `IContractUploadApi`
- [ ] 定義 `IContractStatusApi`
- [ ] 定義 `IContractWorkItemsApi`
- [ ] 定義 `IContractChangesApi`
- [ ] 定義 `IContractEventApi`

#### Phase 5: 模組配置 (1 小時)
- [ ] 建立 `module.metadata.ts`
- [ ] 建立 `module.config.ts`
- [ ] 定義事件類型常數

#### Phase 6: 文檔撰寫 (2 小時)
- [ ] 撰寫 README.md
- [ ] 記錄架構說明
- [ ] 記錄 API 使用範例
- [ ] 記錄資料模型說明

#### Phase 7: 驗證與測試 (30 分鐘)
- [ ] TypeScript 編譯檢查
- [ ] ESLint 檢查
- [ ] 檔案結構檢視
- [ ] 文檔完整性檢查

### 檔案清單

#### 新增檔案
```
src/app/core/blueprint/modules/implementations/contract/
├── models/
│   ├── contract.model.ts
│   ├── work-item.model.ts
│   ├── contract-party.model.ts
│   ├── dtos.ts
│   └── index.ts
├── repositories/
│   └── .gitkeep
├── services/
│   └── .gitkeep
├── config/
│   └── module.config.ts
├── exports/
│   ├── contract-api.interface.ts
│   └── index.ts
├── module.metadata.ts
└── README.md
```

#### 修改檔案
```
src/app/core/blueprint/modules/implementations/index.ts
src/app/core/blueprint/events/event-types.ts
```

---

## 📜 開發規範

### 規範檢查清單

#### ⭐ 必須使用工具
- [x] Context7 - 已查詢 Angular 20 與 Firebase 文檔
- [x] Sequential Thinking - 已完成架構決策分析
- [x] Software Planning Tool - 已制定實施計畫

#### 奧卡姆剃刀原則
- [x] KISS - 保持簡單設計
- [x] YAGNI - OCR/AI 解析功能第一版不實作
- [x] MVP - 專注核心資料模型與 API 定義
- [x] SRP - 每個介面職責單一
- [x] 低耦合高內聚 - 透過 API 介面與其他模組通訊

#### 🏗️ 三層架構嚴格分離
- [x] UI 層 - 預留，SETC-016 實作
- [x] Service 層 - 預留，SETC-011+ 實作
- [x] Repository 層 - 預留，SETC-010 實作
- [x] 無跨層直接依賴

#### 📦 Repository 模式強制
- [x] 禁止直接操作 Firestore - 預留 Repository 層
- [ ] Firestore Security Rules - SETC-010 實作
- [x] Repository 放置正確 - 模組專屬

#### 🔄 生命週期管理標準化
- [ ] N/A - 本任務不涉及元件生命週期

#### 🔗 上下文傳遞原則
- [x] Blueprint Context - 所有介面包含 blueprintId
- [ ] N/A - 服務層實作時處理

#### 📡 事件驅動架構
- [x] 事件類型預留定義 - 將在 SETC-015 實作
- [x] 事件命名規範 - `contract.*` 前綴

#### 🧩 模組擴展規範
- [x] 註冊階段 - 預留 module.metadata.ts
- [ ] 實作階段 - 後續 SETC 任務
- [ ] 整合階段 - SETC-015
- [ ] 測試階段 - SETC-017

#### 🔒 安全性原則
- [ ] Firestore Security Rules - SETC-010
- [ ] 權限檢查 - SETC-011+

#### ⚡ 效能優化原則
- [x] Firestore Subcollection 架構 - WorkItems 作為 Subcollection
- [ ] OnPush 變更檢測 - SETC-016

#### 🚫 禁止行為清單
- [x] 無建立 NgModule - 使用 Standalone
- [x] 無使用 any 類型 - 所有介面有明確類型
- [x] 無直接操作 Firestore - 預留 Repository

---

## ✅ 檢查清單

### 📋 程式碼審查檢查點

#### 架構檢查
- [x] 遵循三層架構（預留 Service 和 Repository）
- [x] 使用 TypeScript 5.9 嚴格模式
- [x] 正確使用 Standalone Components 架構

#### 資料模型檢查
- [ ] Contract 介面完整
- [ ] WorkItem 介面完整
- [ ] ContractParty 介面完整
- [ ] 所有必要 DTOs 已定義
- [ ] 類型匯出正確

#### API 介面檢查
- [ ] IContractModuleApi 完整
- [ ] 子介面定義清晰
- [ ] 方法簽名明確
- [ ] 返回類型正確

#### 文檔檢查
- [ ] README.md 完整
- [ ] API 使用範例清晰
- [ ] 架構說明完整
- [ ] 資料模型文檔完整

### 💎 程式碼品質
- [ ] TypeScript 嚴格模式無錯誤
- [ ] ESLint 檢查通過
- [ ] 無使用 any 類型
- [ ] 命名清晰且符合規範

### 🏛️ 架構符合性
- [x] 遵循 Blueprint Container 架構
- [x] 模組目錄結構正確
- [x] API 介面設計合理
- [x] 符合現有模組模式

### ✨ 功能完整性
- [ ] 資料模型定義完整
- [ ] API 介面覆蓋所有需求
- [ ] 預留擴展空間（OCR/AI）
- [ ] 符合 SETC.md 工作流程定義

### 📖 文檔完整性
- [ ] README 已撰寫
- [ ] API 文檔完整
- [ ] 架構圖已建立
- [ ] 使用範例清晰

---

## 🚀 實施指引

### 開發順序
1. **建立目錄結構** - 先建立完整的資料夾架構
2. **定義資料模型** - 從底層資料模型開始
3. **定義 API 介面** - 基於資料模型定義 API
4. **撰寫配置** - 建立模組配置檔案
5. **撰寫文檔** - 完整記錄模組資訊

### 參考實作
- **Issue Module**: `src/app/core/blueprint/modules/implementations/issue/`
- **SETC-001**: Issue Module 基礎設定文檔
- **SETC-002**: Issue Repository 實作文檔

### 常見陷阱
⚠️ **避免過度設計**: 不要實作第一版不需要的功能（如 OCR/AI）  
⚠️ **保持介面簡潔**: API 方法不要過多，保持單一職責  
⚠️ **預留擴展空間**: 介面設計考慮未來擴展性  
⚠️ **文檔要完整**: 清楚記錄設計決策與使用方式

---

## 📞 支援與問題

### 問題回報
- 技術問題: 參考 Issue Module 實作
- 架構問題: 參考 FINAL_PROJECT_STRUCTURE.md
- API 設計: 參考現有模組 API 介面

### 相關資源
- Angular 20 文檔: `/websites/angular_dev_v20`
- Firebase 文檔: `/websites/firebase_google`
- TypeScript 5.9 文檔
- Issue Module 實作參考

---

**文件版本**: 1.0.0  
**建立日期**: 2025-12-15  
**作者**: GitHub Copilot  
**狀態**: 📋 待開始
