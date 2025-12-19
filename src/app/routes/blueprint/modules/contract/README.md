# Contract Module

合約管理模組 - 結構化設計遵循單一職責原則

## 模組說明

合約模組透過 **blueprint 詳情頁的 Tab** 顯示（使用 `contract-module-view.component.ts`），與其他模組（財務、安全、品質等）保持一致的使用體驗。因功能複雜度較高，實作細節組織在 `contract/` 子目錄中。

## 目錄結構

```
modules/
├── contract-module-view.component.ts       # 主視圖（顯示在 Blueprint Tab 中）
├── contract-creation-wizard.component.ts   # 建立精靈
├── contract-detail-drawer.component.ts     # 詳情抽屜
├── contract-modal.component.ts             # 快速彈窗
└── contract/                               # 複雜功能實作（未來擴展用）
    ├── list/                               # 列表相關（預留）
    ├── detail/                             # 詳情相關（預留）
    ├── form/                               # 表單相關（預留）
    └── README.md                           # 說明文件
```

## 使用方式

### 1. 在 Blueprint 詳情頁顯示
合約功能整合在藍圖詳情頁的「合約域」Tab 中：

```
/blueprints/user/:id  →  Blueprint 詳情頁  →  「合約域」Tab
```

### 2. 合約 CRUD 操作
- **查看**: 點擊「查看」按鈕 → 開啟 `ContractDetailDrawerComponent`（右側抽屜）
- **新增**: 點擊「新增合約」→ 顯示 `ContractCreationWizardComponent`（精靈模式）
- **編輯**: 點擊「編輯」→ 開啟 `ContractModalComponent`（彈窗編輯）
- **刪除**: 點擊「刪除」→ 確認對話框

## 資料模型

### Contract (合約)
```typescript
interface Contract {
  id: string;
  blueprintId: string;
  contractNumber: string;
  title: string;
  description?: string;
  owner: ContractParty;          // 甲方
  contractor: ContractParty;     // 乙方
  totalAmount: number;
  currency: string;
  lineItems?: ContractLineItem[]; // 合約細項
  status: ContractStatus;
  startDate: Date;
  endDate: Date;
  originalFiles: FileAttachment[];
  // ... 其他欄位
}
```

### ContractParty (合約方)
```typescript
interface ContractParty {
  id: string;
  name: string;                  // 名稱
  contactPerson: string;         // 聯絡人
  contactPhone: string;          // 電話
  contactEmail: string;          // 信箱
  address?: string;
  taxId?: string;
}
```

### ContractLineItem (合約細項)
```typescript
interface ContractLineItem {
  id: string;
  itemNumber: number;            // 號碼
  itemCode: string;              // 項次
  name: string;                  // 名稱
  quantity: number;              // 數量
  unit: string;                  // 單位
  unitPrice: number;             // 單價
  amount: number;                // 金額
  discountPercent?: number;      // 折扣
  subtotal: number;              // 小記
  remarks?: string;              // 備註
}
```

## 元件說明

### ContractModuleViewComponent (主視圖)
- **位置**: `modules/contract-module-view.component.ts`
- **用途**: 顯示於 Blueprint 詳情頁的 Tab 中
- **功能**:
  - 統計資訊卡片（總計、各狀態數量）
  - 合約列表（ST Table）
  - 狀態篩選
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

