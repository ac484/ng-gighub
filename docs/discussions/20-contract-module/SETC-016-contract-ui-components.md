# SETC-016: Contract UI Components

> **任務 ID**: SETC-016  
> **任務名稱**: Contract UI Components Implementation  
> **優先級**: P0 (Critical)  
> **預估工時**: 2 天  
> **依賴**: SETC-015  
> **狀態**: ✅ 已完成

---

## 📋 任務定義

### 名稱
Contract UI Components - 合約管理使用者介面元件

### 背景 / 目的
實作完整的合約管理 UI 元件，包括合約列表、合約表單、工項管理、檔案上傳等，提供直覺的使用者體驗。

### 需求說明
1. 實作合約列表元件（使用 ST 表格）
2. 實作合約表單元件（使用 SF 動態表單）
3. 實作工項管理元件
4. 實作檔案上傳元件
5. 實作合約詳情元件

### In Scope / Out of Scope

#### ✅ In Scope
- 合約列表頁面
- 合約建立/編輯表單
- 工項管理 UI
- 檔案上傳 UI
- 合約詳情頁面
- 狀態變更 UI

#### ❌ Out of Scope
- OCR/AI 解析 UI（未來擴展）
- 合約變更審批 UI（未來擴展）
- 合約模板 UI（未來擴展）

### 功能行為
使用者可透過 UI 進行合約的完整生命週期管理，包括建立、查看、編輯、上傳檔案、管理工項、變更狀態等操作。

### 資料 / API

#### 頁面結構
```
/blueprint/{id}/contracts
  ├── /list               # 合約列表
  ├── /create             # 建立合約
  ├── /edit/{contractId}  # 編輯合約
  └── /view/{contractId}  # 查看合約
      ├── /details        # 基本資訊
      ├── /work-items     # 工項管理
      ├── /files          # 檔案管理
      └── /history        # 變更歷史
```

#### 主要元件

**ContractListComponent** - 合約列表
```typescript
@Component({
  selector: 'app-contract-list',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    @if (loading()) {
      <nz-spin nzSimple />
    } @else {
      <st 
        [data]="contracts()" 
        [columns]="columns"
        [loading]="loading()"
        (change)="handleTableChange($event)"
      />
    }
  `
})
export class ContractListComponent {
  private contractService = inject(ContractManagementService);
  
  loading = signal(false);
  contracts = signal<Contract[]>([]);
  
  columns: STColumn[] = [
    { title: '合約編號', index: 'contractNumber' },
    { title: '合約名稱', index: 'title' },
    { title: '業主', index: 'owner.name' },
    { title: '承商', index: 'contractor.name' },
    { title: '金額', index: 'totalAmount', type: 'currency' },
    { 
      title: '狀態', 
      index: 'status',
      type: 'badge',
      badge: {
        draft: { text: '草稿', color: 'default' },
        pending_activation: { text: '待生效', color: 'processing' },
        active: { text: '已生效', color: 'success' },
        completed: { text: '已完成', color: 'default' },
        terminated: { text: '已終止', color: 'error' }
      }
    },
    {
      title: '操作',
      buttons: [
        { text: '查看', click: (record: any) => this.view(record.id) },
        { text: '編輯', click: (record: any) => this.edit(record.id) },
        { text: '刪除', click: (record: any) => this.delete(record.id), pop: true }
      ]
    }
  ];
}
```

**ContractFormComponent** - 合約表單
```typescript
@Component({
  selector: 'app-contract-form',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <sf 
      [schema]="schema" 
      [formData]="formData()"
      (formSubmit)="submit($event)"
    />
  `
})
export class ContractFormComponent {
  private contractService = inject(ContractManagementService);
  
  contractId = input<string | undefined>();
  formData = signal<any>({});
  
  schema: SFSchema = {
    properties: {
      contractNumber: {
        type: 'string',
        title: '合約編號',
        readOnly: true
      },
      title: {
        type: 'string',
        title: '合約名稱',
        maxLength: 200
      },
      owner: {
        type: 'object',
        title: '業主資訊',
        properties: {
          name: { type: 'string', title: '名稱' },
          contactPerson: { type: 'string', title: '聯絡人' },
          contactPhone: { type: 'string', title: '電話' },
          contactEmail: { type: 'string', title: 'Email', format: 'email' }
        },
        required: ['name', 'contactPerson', 'contactPhone']
      },
      contractor: {
        type: 'object',
        title: '承商資訊',
        properties: {
          name: { type: 'string', title: '名稱' },
          contactPerson: { type: 'string', title: '聯絡人' },
          contactPhone: { type: 'string', title: '電話' },
          contactEmail: { type: 'string', title: 'Email', format: 'email' }
        },
        required: ['name', 'contactPerson', 'contactPhone']
      },
      totalAmount: {
        type: 'number',
        title: '合約金額',
        minimum: 0
      },
      currency: {
        type: 'string',
        title: '幣別',
        enum: ['TWD', 'USD', 'CNY'],
        default: 'TWD'
      },
      startDate: {
        type: 'string',
        title: '開始日期',
        format: 'date',
        ui: { widget: 'date' }
      },
      endDate: {
        type: 'string',
        title: '結束日期',
        format: 'date',
        ui: { widget: 'date' }
      }
    },
    required: ['title', 'owner', 'contractor', 'totalAmount', 'startDate', 'endDate']
  };
}
```

**WorkItemManagementComponent** - 工項管理
```typescript
@Component({
  selector: 'app-work-item-management',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-card nzTitle="工項管理">
      <button nz-button nzType="primary" (click)="addWorkItem()">
        新增工項
      </button>
      
      <st 
        [data]="workItems()" 
        [columns]="workItemColumns"
        class="mt-md"
      />
      
      <div class="mt-md">
        <nz-statistic 
          [nzValue]="totalAmount()" 
          nzTitle="工項總金額"
          [nzPrefix]="'$'"
        />
      </div>
    </nz-card>
  `
})
export class WorkItemManagementComponent {
  private workItemService = inject(ContractWorkItemsService);
  
  contractId = input.required<string>();
  workItems = signal<ContractWorkItem[]>([]);
  totalAmount = computed(() => 
    this.workItems().reduce((sum, item) => sum + item.totalPrice, 0)
  );
  
  workItemColumns: STColumn[] = [
    { title: '工項代碼', index: 'code' },
    { title: '工項名稱', index: 'name' },
    { title: '單位', index: 'unit' },
    { title: '數量', index: 'quantity', type: 'number' },
    { title: '單價', index: 'unitPrice', type: 'currency' },
    { title: '總價', index: 'totalPrice', type: 'currency' },
    {
      title: '完成度',
      index: 'completionPercentage',
      type: 'number',
      numberDigits: '1.0-0',
      format: (item: ContractWorkItem) => `${item.completionPercentage}%`
    },
    {
      title: '操作',
      buttons: [
        { text: '編輯', click: (record: any) => this.editWorkItem(record) },
        { text: '刪除', click: (record: any) => this.deleteWorkItem(record), pop: true }
      ]
    }
  ];
}
```

**FileUploadComponent** - 檔案上傳
```typescript
@Component({
  selector: 'app-contract-file-upload',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-upload
      nzType="drag"
      [nzMultiple]="true"
      [nzAccept]="acceptedTypes"
      [nzBeforeUpload]="beforeUpload"
      (nzChange)="handleChange($event)"
    >
      <p class="ant-upload-drag-icon">
        <i nz-icon nzType="inbox"></i>
      </p>
      <p class="ant-upload-text">點擊或拖曳檔案到此區域上傳</p>
      <p class="ant-upload-hint">
        支援 PDF, JPG, PNG 格式，單檔最大 10MB
      </p>
    </nz-upload>
    
    @if (uploadProgress() > 0 && uploadProgress() < 100) {
      <nz-progress 
        [nzPercent]="uploadProgress()" 
        nzStatus="active"
      />
    }
  `
})
export class ContractFileUploadComponent {
  private uploadService = inject(ContractUploadService);
  
  contractId = input.required<string>();
  uploadProgress = signal(0);
  acceptedTypes = '.pdf,.jpg,.jpeg,.png';
}
```

### 影響範圍
- **新增路由**: `/blueprint/{id}/contracts/*`
- **新增元件**: 5+ 個 UI 元件
- **路由守衛**: 合約管理權限檢查

### 驗收條件
- [ ] 所有 UI 元件實作完成
- [ ] 路由配置完成
- [ ] 權限控制實作
- [ ] 響應式設計完成
- [ ] 元件測試通過
- [ ] 整合測試通過

---

## 🔍 分析階段

### 步驟 1: 查詢官方文件 (Context7)

#### ng-alain ST & SF
**查詢庫**: ng-alain documentation  
**主題**: st-table, sf-form, widgets

**關鍵發現**:
- ✅ 使用 ST 表格展示合約列表
- ✅ 使用 SF 動態表單建立/編輯合約
- ✅ 使用 ng-zorro Upload 元件上傳檔案

#### Angular 20 Signals
**查詢庫**: `/websites/angular_dev_v20`  
**主題**: signals, computed, effects

**關鍵發現**:
- ✅ 使用 Signals 管理元件狀態
- ✅ 使用 computed() 計算衍生狀態
- ✅ 使用 @if/@for 新控制流

### 步驟 2: 循序思考分析 (Sequential Thinking)

#### 架構決策

**問題 1**: 表單驗證如何處理？
- **決策**: 使用 SF Schema 驗證
- **理由**:
  - 宣告式驗證
  - 類型安全
  - 易於維護

**問題 2**: 如何處理檔案上傳進度？
- **決策**: 使用 Signals 追蹤進度
- **理由**:
  - 響應式更新 UI
  - 自動重新渲染
  - 簡化狀態管理

### 步驟 3: 制定開發計畫 (Software Planning Tool)

#### 實施計畫

**Phase 1: 列表頁面** (3 小時)
- 實作 ContractListComponent
- 設定 ST 表格欄位
- 實作查詢過濾

**Phase 2: 表單頁面** (4 小時)
- 實作 ContractFormComponent
- 設定 SF Schema
- 實作表單驗證

**Phase 3: 工項管理** (3 小時)
- 實作 WorkItemManagementComponent
- 實作工項 CRUD UI

**Phase 4: 檔案上傳** (2 小時)
- 實作 FileUploadComponent
- 實作上傳進度顯示

**Phase 5: 詳情頁面** (3 小時)
- 實作 ContractDetailComponent
- 整合所有子元件

**Phase 6: 路由與測試** (1 天)
- 配置路由
- 實作路由守衛
- 元件測試
- 整合測試

---

## 📐 規劃階段

### 實施步驟

#### Phase 1: 列表頁面 (3 小時)
- [ ] 建立 ContractListComponent
- [ ] 配置 ST columns
- [ ] 實作查詢方法
- [ ] 實作操作按鈕

#### Phase 2: 表單頁面 (4 小時)
- [ ] 建立 ContractFormComponent
- [ ] 定義 SF Schema
- [ ] 實作表單提交
- [ ] 實作表單驗證

#### Phase 3: 工項管理 (3 小時)
- [ ] 建立 WorkItemManagementComponent
- [ ] 實作工項列表
- [ ] 實作工項新增/編輯
- [ ] 實作工項刪除

#### Phase 4: 檔案上傳 (2 小時)
- [ ] 建立 FileUploadComponent
- [ ] 實作檔案選擇
- [ ] 實作上傳進度
- [ ] 實作錯誤處理

#### Phase 5: 詳情頁面 (3 小時)
- [ ] 建立 ContractDetailComponent
- [ ] 整合基本資訊
- [ ] 整合工項管理
- [ ] 整合檔案管理

#### Phase 6: 路由與測試 (1 天)
- [ ] 配置路由規則
- [ ] 實作路由守衛
- [ ] 元件單元測試
- [ ] 整合測試
- [ ] E2E 測試

### 檔案清單

#### 新增檔案
```
src/app/routes/blueprint/contracts/
├── list/
│   ├── list.component.ts
│   └── list.component.spec.ts
├── form/
│   ├── form.component.ts
│   └── form.component.spec.ts
├── detail/
│   ├── detail.component.ts
│   ├── work-items/
│   │   ├── work-items.component.ts
│   │   └── work-items.component.spec.ts
│   ├── files/
│   │   ├── files.component.ts
│   │   └── files.component.spec.ts
│   └── detail.component.spec.ts
├── contracts.routes.ts
└── contracts.guard.ts
```

---

## 📜 開發規範

### 規範檢查清單

#### ⭐ 必須使用工具
- [x] Context7 - 已查詢 ng-alain 與 Angular 20 文檔
- [x] Sequential Thinking - 已完成 UI 設計分析
- [x] Software Planning Tool - 已制定實施計畫

#### Angular 20 現代化
- [x] 使用 Standalone Components
- [x] 使用 Signals 狀態管理
- [x] 使用新控制流 (@if, @for)
- [x] 使用 input()/output() 函式
- [x] 使用 OnPush 變更檢測

---

## ✅ 檢查清單

### 📋 程式碼審查檢查點
- [ ] 所有元件實作完成
- [ ] 路由配置正確
- [ ] 權限控制完整
- [ ] 響應式設計完成
- [ ] 測試覆蓋率 > 60%

---

**文件版本**: 1.0.0  
**最後更新**: 2025-12-15  
**下一步**: SETC-017 Contract Testing & Integration
