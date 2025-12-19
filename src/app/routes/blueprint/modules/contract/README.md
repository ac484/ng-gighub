# Contract Module (Refactored)

合約管理模組 - 採用功能導向架構設計

## 🎯 架構原則

本模組遵循以下核心原則:
- **高內聚 (High Cohesion)**: 相關功能組織在同一 feature 中
- **低耦合 (Low Coupling)**: Features 間透過明確接口溝通
- **可擴展性 (Extensibility)**: 易於新增 features 或擴展現有功能
- **可維護性 (Maintainability)**: 清晰結構，小型專注元件

## 📁 目錄結構 (Feature-Based)

```
contract/
├── contract-module-view-refactored.component.ts  # 主協調器 (thin orchestrator)
├── index.ts                                      # Public API
├── README.md                                     # 本文件
│
├── features/                                     # 功能模組
│   ├── list/                                     # 🔍 列表功能
│   │   ├── contract-list.component.ts            # Feature 主元件
│   │   ├── components/
│   │   │   ├── contract-statistics.component.ts  # 統計卡片
│   │   │   ├── contract-filters.component.ts     # 搜尋與操作
│   │   │   └── contract-table.component.ts       # 表格顯示
│   │   └── index.ts
│   │
│   ├── create/                                   # ➕ 建立功能
│   │   ├── contract-creation-wizard.component.ts # Feature 主元件
│   │   ├── components/
│   │   │   ├── basic-info-step.component.ts      # 步驟 1
│   │   │   ├── confirm-step.component.ts         # 步驟 2
│   │   │   └── completion-step.component.ts      # 步驟 3
│   │   └── index.ts
│   │
│   ├── detail/                                   # 👁️ 詳情功能
│   │   ├── contract-detail-drawer.component.ts   # Feature 主元件
│   │   ├── components/
│   │   │   ├── basic-info-tab.component.ts       # 基本資訊 Tab
│   │   │   ├── parties-tab.component.ts          # 合約方 Tab
│   │   │   ├── attachments-tab.component.ts      # 附件 Tab
│   │   │   └── history-tab.component.ts          # 歷史記錄 Tab
│   │   └── index.ts
│   │
│   └── edit/                                     # ✏️ 編輯功能
│       ├── contract-edit-modal.component.ts      # Feature 主元件
│       ├── components/
│       │   ├── contract-form.component.ts        # 合約表單
│       │   ├── owner-form.component.ts           # 業主表單
│       │   └── contractor-form.component.ts      # 承商表單
│       └── index.ts
│
├── shared/                                       # 🔄 共享元件
│   ├── components/
│   │   └── contract-status-badge.component.ts    # 狀態標籤
│   └── index.ts
│
└── [legacy files]                                # 📦 舊版相容檔案
    ├── contract-module-view.component.ts
    ├── contract-creation-wizard.component.ts
    ├── contract-detail-drawer.component.ts
    └── contract-modal.component.ts
```

## 🎨 架構設計

### 主協調器 (Main Orchestrator)

**`ContractModuleViewComponent`** - Thin orchestration layer

責任:
- 管理高層狀態 (contracts, loading, wizard mode)
- 協調 features 互動
- 處理 feature 事件

特點:
- **Thin Layer**: 最小化邏輯，委託給 features
- **Event-Driven**: 透過 inputs/outputs 與 features 溝通
- **Stateful**: 只管理必要的全域狀態

### Features 架構

每個 feature 是自包含的功能模組:

#### 1. List Feature 🔍

**職責**: 顯示合約列表與統計資訊

**元件**:
- `ContractListComponent` - Feature 協調器
- `ContractStatisticsComponent` - 統計卡片 (total, by status, by value)
- `ContractFiltersComponent` - 搜尋與操作按鈕
- `ContractTableComponent` - ST Table 顯示

**接口**:
```typescript
@Input() contracts: Contract[]
@Input() statistics: ContractStatistics
@Input() loading: boolean
@Output() create: void
@Output() quickCreate: void
@Output() reload: void
@Output() viewContract: Contract
@Output() editContract: Contract
@Output() deleteContract: Contract
```

#### 2. Create Feature ➕

**職責**: 引導合約建立流程

**元件**:
- `ContractCreationWizardComponent` - 精靈協調器
- `BasicInfoStepComponent` - 基本資訊輸入 (步驟 1)
- `ConfirmStepComponent` - 資料確認 (步驟 2)
- `CompletionStepComponent` - 完成通知 (步驟 3)

**接口**:
```typescript
@Input() blueprintId: string
@Output() contractCreated: Contract
@Output() cancelled: void
```

#### 3. Detail Feature 👁️

**職責**: 顯示合約詳情與歷史

**元件**:
- `ContractDetailDrawerComponent` - 抽屜協調器
- `BasicInfoTabComponent` - 基本資訊 Tab
- `PartiesTabComponent` - 合約方資訊 Tab
- `AttachmentsTabComponent` - 附件列表 Tab
- `HistoryTabComponent` - 歷史記錄 Tab

**接口**:
```typescript
@Input() contract: Contract | null
@Output() edit: Contract
@Output() activate: Contract
@Output() download: Contract
```

#### 4. Edit Feature ✏️

**職責**: 編輯合約資訊

**元件**:
- `ContractEditModalComponent` - Modal 協調器
- `ContractFormComponent` - 基本資訊表單
- `OwnerFormComponent` - 業主資訊表單
- `ContractorFormComponent` - 承商資訊表單

**接口**:
```typescript
// Via Modal Data
blueprintId: string
contract?: Contract  // 編輯模式
```

### 共享元件 🔄

**可重用元件**, 無外部依賴:

- `ContractStatusBadgeComponent` - 狀態標籤顯示

## 📋 使用方式

### 匯入與使用

```typescript
// 主視圖 (使用重構版本)
import { ContractModuleViewComponent } from './contract';

// 或獨立使用 features
import { ContractListComponent } from './contract/features/list';
import { ContractCreationWizardComponent } from './contract/features/create';
import { ContractDetailDrawerComponent } from './contract/features/detail';
import { ContractEditModalComponent } from './contract/features/edit';

// 共享元件
import { ContractStatusBadgeComponent } from './contract/shared';
```

### Blueprint 整合

合約模組整合在 Blueprint 詳情頁的 Tab 中:

```
/blueprints/user/:id  →  Blueprint Detail  →  「合約域」Tab
                                          ↓
                          ContractModuleViewComponent
```

### Feature 互動流程

```
User Action → Main Orchestrator → Feature Component → Event → Orchestrator → Update State
```

**範例 - 查看合約**:
1. User 點擊「查看」
2. `ContractListComponent` 發出 `viewContract` 事件
3. Orchestrator 接收事件
4. Orchestrator 開啟 `ContractDetailDrawerComponent`
5. User 互動完成，關閉 Drawer
6. Orchestrator 重新載入列表

## 🧩 擴展性範例

### 新增 Feature

**範例: 新增 "審核" Feature**

1. 建立 feature 目錄:
```
features/approval/
├── contract-approval.component.ts
├── components/
│   ├── approval-form.component.ts
│   └── approval-history.component.ts
└── index.ts
```

2. 定義接口:
```typescript
@Input() contract: Contract
@Output() approved: ApprovalResult
@Output() rejected: ApprovalResult
```

3. 在 Orchestrator 整合:
```typescript
openApproval(contract: Contract): void {
  // Open approval feature
}
```

### 新增子元件

**範例: 在 List Feature 新增排序**

1. 建立元件:
```
features/list/components/contract-sort.component.ts
```

2. 在 ContractListComponent 整合:
```typescript
<app-contract-sort (sortChange)="onSortChange($event)" />
```

## 🎯 設計原則

### 單一職責原則 (Single Responsibility)
- 每個元件只負責一件事
- 協調器元件只協調，不包含 UI 邏輯
- 子元件只處理自己的 UI 邏輯

### 開放/封閉原則 (Open/Closed)
- Features 對擴展開放
- Features 對修改封閉
- 新增功能不需修改現有 features

### 依賴反轉原則 (Dependency Inversion)
- 依賴抽象 (interfaces), 不依賴具體實作
- Features 透過 inputs/outputs 溝通
- No direct feature-to-feature dependencies

## 💡 最佳實踐

### 元件大小
- **Orchestrator**: < 200 lines
- **Feature Main Component**: < 150 lines
- **Sub Components**: < 100 lines

### 命名規範
- Feature folders: lowercase with dash (e.g., `list`, `create`)
- Components: feature-action.component.ts (e.g., `contract-list.component.ts`)
- Sub-components: descriptive name (e.g., `contract-statistics.component.ts`)

### 狀態管理
- **Global State**: Orchestrator (contracts, loading)
- **Feature State**: Feature main component (currentStep, formData)
- **Local State**: Sub-components (expanded, selected)

### 事件處理
- Use outputs for feature → orchestrator communication
- Use inputs for orchestrator → feature data flow
- Keep events semantic (e.g., `contractCreated`, not `buttonClicked`)

## 📚 資料模型

[保留原有的資料模型定義...]


  - 搜尋功能
  - 新增/查看/編輯/刪除操作

### ContractCreationWizardComponent (建立精靈)
- **位置**: `modules/contract-creation-wizard.component.ts`
- **用途**: 引導式合約建立流程
- **流程**:
  1. 填寫基本資料（合約編號、名稱、金額）
  2. 填寫甲方/乙方資料
  3. 確認資料
  4. 完成

### ContractDetailDrawerComponent (詳情抽屜)
- **位置**: `modules/contract-detail-drawer.component.ts`
- **用途**: 右側滑出的合約詳情面板
- **功能**:
  - 基本資料展示（nz-descriptions）
  - 甲方/乙方資料
  - 合約細項表格
  - 合約檔案列表
  - 合約條款展示
  - 操作按鈕（編輯、刪除）

### ContractModalComponent (快速彈窗)
- **位置**: `modules/contract-modal.component.ts`
- **用途**: 快速編輯合約
- **功能**:
  - 基本資料表單
  - 甲方/乙方資料表單
  - 儲存/取消

## 欄位說明

### 基本資料
- **合約編號**: 系統自動產生或手動輸入
- **合約名稱**: 必填
- **合約金額**: 必填，數字格式

### 甲方/乙方資料
- **名稱**: 必填
- **聯絡人**: 選填
- **電話**: 選填
- **信箱**: 選填

### 合約細項
- **號碼**: 排序用
- **項次**: 項目代碼
- **名稱**: 項目名稱
- **數量**: 數量
- **單位**: 計量單位 (個、件、式、m² 等)
- **單價**: 單位價格
- **金額**: 數量 × 單價
- **折扣**: 折扣百分比 (0-100)
- **小記**: 折扣後金額
- **備註**: 選填

**注意**: 因為未來要做 OCR 識別，所有欄位暫時不強制要求。

## 設計原則

### 1. 與其他模組保持一致
- 統一透過 Blueprint 詳情頁的 Tab 存取
- 使用相同的 UI 模式（統計卡片 + 列表）
- 統一的操作方式（查看/新增/編輯/刪除）

### 2. 職責分離
- **contract-module-view.component**: 主視圖，顯示列表和統計
- **contract-creation-wizard.component**: 新增流程
- **contract-detail-drawer.component**: 詳情展示
- **contract-modal.component**: 快速編輯

### 3. 現代化 UI
- 使用 ng-zorro-antd 元件庫
- nz-drawer 顯示詳情
- nz-modal 快速編輯
- st (Simple Table) 顯示列表
- nz-descriptions 展示詳情

### 4. 可擴展性
- `contract/` 子目錄預留未來擴展
- 可添加更複雜的功能（如審批流程、版本控制）
- 保持模組化和鬆耦合

## contract/ 子目錄說明

`contract/` 子目錄是為複雜功能預留的擴展空間，目前包含：

- **list/**: 預留給未來可能的獨立列表頁（如果需要脫離 Blueprint 頁面）
- **detail/**: 預留給未來可能的完整詳情頁（多頁籤、複雜互動）
- **form/**: 預留給未來可能的複雜表單（進階編輯、批次操作）

**目前這些組件不使用**，因為：
1. 合約功能整合在 Blueprint 詳情頁中
2. Drawer/Modal 已足夠應付當前需求
3. 保持與其他模組（財務、安全、品質）一致的 UX

## 開發指南

### 新增功能
1. 評估是否需要修改主視圖 (`contract-module-view.component.ts`)
2. 決定使用 Drawer 還是 Modal 展示
3. 如需新增複雜流程，考慮創建新的 wizard 元件
4. 保持與現有模組的一致性

### 修改現有功能
1. 修改對應元件（module-view/wizard/drawer/modal）
2. 更新相關的 Service/Facade 呼叫
3. 確保不影響其他模組

### 未來擴展方向
- OCR 識別功能（細項自動識別）
- 電子簽章功能
- 版本控制功能
- 審批流程功能
- 合約模板管理

## 技術棧

- Angular 20.x
- ng-alain 20.x
- ng-zorro-antd 20.x
- Signals for state management
- Standalone Components
- TypeScript 5.x

## 維護者

GigHub Development Team

