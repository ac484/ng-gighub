# SETC-030: Invoice/Payment UI Components

> **任務 ID**: SETC-030  
> **任務名稱**: Invoice/Payment UI Components  
> **優先級**: P1 (Important)  
> **預估工時**: 3 天  
> **依賴**: SETC-029 (Payment Status Tracking)  
> **狀態**: ✅ 已完成
> **完成日期**: 2025-12-16

---

## 📋 任務定義

### 名稱
請款/付款 UI 元件實作

### 背景 / 目的
實作請款與付款管理的使用者介面，包括列表、詳情、審核介面、狀態看板等。使用 ng-alain 的 ST 表格和 SF 動態表單元件。

### 需求說明
1. 實作請款單列表元件
2. 實作付款單列表元件
3. 實作審核操作介面
4. 實作狀態看板
5. 實作詳情彈窗
6. 遵循 Angular 20 Standalone Components

### In Scope / Out of Scope

#### ✅ In Scope
- InvoiceListComponent
- PaymentListComponent
- InvoiceDetailComponent
- ApprovalDialogComponent
- FinanceDashboardComponent
- 狀態篩選與搜尋

#### ❌ Out of Scope
- 複雜圖表（未來階段）
- 匯出功能（未來階段）
- 打印功能（未來階段）

### 功能行為
提供完整的請款/付款管理介面，支援列表瀏覽、詳情查看、審核操作。

### 資料 / API

#### InvoiceListComponent

```typescript
@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <page-header [title]="pageTitle()">
      <ng-template #extra>
        <button nz-button nzType="primary" (click)="create()">
          <i nz-icon nzType="plus"></i>
          新增請款單
        </button>
      </ng-template>
    </page-header>

    <nz-card>
      <!-- 篩選區域 -->
      <div class="filter-bar mb-md">
        <nz-select [(ngModel)]="statusFilter" (ngModelChange)="reload()">
          <nz-option nzValue="" nzLabel="全部狀態"></nz-option>
          @for (status of statusOptions; track status.value) {
            <nz-option [nzValue]="status.value" [nzLabel]="status.label"></nz-option>
          }
        </nz-select>
        
        <nz-range-picker 
          [(ngModel)]="dateRange"
          (ngModelChange)="reload()">
        </nz-range-picker>
      </div>

      <!-- 表格 -->
      <st 
        [data]="invoices()" 
        [columns]="columns"
        [loading]="loading()"
        (change)="handleChange($event)">
      </st>
    </nz-card>
  `
})
export class InvoiceListComponent implements OnInit {
  private invoiceService = inject(InvoiceService);
  private modal = inject(NzModalService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // Signals
  invoices = signal<Invoice[]>([]);
  loading = signal(false);
  
  pageTitle = computed(() => 
    this.invoiceType === 'receivable' ? '請款單管理' : '付款單管理'
  );

  @Input() invoiceType: 'receivable' | 'payable' = 'receivable';

  statusOptions = [
    { value: 'draft', label: '草稿' },
    { value: 'submitted', label: '已送出' },
    { value: 'under_review', label: '審核中' },
    { value: 'approved', label: '已核准' },
    { value: 'rejected', label: '已退回' },
    { value: 'paid', label: '已付款' }
  ];

  columns: STColumn[] = [
    { title: '編號', index: 'invoiceNumber', width: 150 },
    { title: '合約', index: 'contractName' },
    { 
      title: '金額', 
      index: 'total',
      type: 'currency',
      currency: { format: { ngCurrency: { display: 'symbol' } } }
    },
    { 
      title: '狀態', 
      index: 'status',
      type: 'badge',
      badge: {
        draft: { text: '草稿', color: 'default' },
        submitted: { text: '已送出', color: 'processing' },
        under_review: { text: '審核中', color: 'warning' },
        approved: { text: '已核准', color: 'success' },
        rejected: { text: '已退回', color: 'error' },
        paid: { text: '已付款', color: 'success' }
      }
    },
    { title: '建立日期', index: 'createdAt', type: 'date' },
    {
      title: '操作',
      buttons: [
        { text: '查看', click: (record) => this.view(record) },
        { 
          text: '審核', 
          click: (record) => this.approve(record),
          iif: (record) => this.canApprove(record)
        },
        { 
          text: '送出', 
          click: (record) => this.submit(record),
          iif: (record) => record.status === 'draft'
        }
      ]
    }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.invoiceService.getByBlueprintId$(this.blueprintId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (invoices) => {
          this.invoices.set(invoices.filter(i => i.invoiceType === this.invoiceType));
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  view(record: Invoice): void {
    this.modal.create({
      nzTitle: '請款單詳情',
      nzContent: InvoiceDetailComponent,
      nzData: { invoice: record },
      nzWidth: 800
    });
  }

  approve(record: Invoice): void {
    this.modal.create({
      nzTitle: '審核請款單',
      nzContent: ApprovalDialogComponent,
      nzData: { invoice: record },
      nzOnOk: () => this.loadData()
    });
  }

  submit(record: Invoice): void {
    this.modal.confirm({
      nzTitle: '確認送出',
      nzContent: '送出後將進入審核流程，確定要送出嗎？',
      nzOnOk: () => this.invoiceService.submit(record.id)
    });
  }
}
```

#### ApprovalDialogComponent

```typescript
@Component({
  selector: 'app-approval-dialog',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="approval-dialog">
      <nz-descriptions [nzColumn]="2" nzBordered>
        <nz-descriptions-item nzTitle="請款編號">
          {{ invoice.invoiceNumber }}
        </nz-descriptions-item>
        <nz-descriptions-item nzTitle="金額">
          {{ invoice.total | currency }}
        </nz-descriptions-item>
      </nz-descriptions>

      <nz-divider nzText="審核意見"></nz-divider>

      <nz-form-item>
        <nz-form-label>審核結果</nz-form-label>
        <nz-form-control>
          <nz-radio-group [(ngModel)]="approvalResult">
            <label nz-radio nzValue="approve">核准</label>
            <label nz-radio nzValue="reject">退回</label>
          </nz-radio-group>
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label>備註</nz-form-label>
        <nz-form-control>
          <textarea 
            nz-input 
            [(ngModel)]="comments"
            [rows]="4"
            [placeholder]="approvalResult === 'reject' ? '請填寫退回原因' : '選填'">
          </textarea>
        </nz-form-control>
      </nz-form-item>
    </div>
  `
})
export class ApprovalDialogComponent {
  @Input() invoice!: Invoice;
  
  private invoiceApprovalService = inject(InvoiceApprovalService);
  private modal = inject(NzModalRef);
  private message = inject(NzMessageService);

  approvalResult: 'approve' | 'reject' = 'approve';
  comments = '';

  async confirm(): Promise<void> {
    if (this.approvalResult === 'reject' && !this.comments) {
      this.message.warning('退回時必須填寫原因');
      return;
    }

    try {
      if (this.approvalResult === 'approve') {
        await this.invoiceApprovalService.approve(
          this.invoice.id,
          this.getCurrentActor(),
          this.comments
        );
        this.message.success('審核通過');
      } else {
        await this.invoiceApprovalService.reject(
          this.invoice.id,
          this.getCurrentActor(),
          this.comments
        );
        this.message.success('已退回');
      }
      this.modal.close(true);
    } catch (error) {
      this.message.error('操作失敗');
    }
  }
}
```

#### FinanceDashboardComponent

```typescript
@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <page-header title="財務概覽"></page-header>

    <div nz-row [nzGutter]="16">
      <!-- 應收統計 -->
      <div nz-col [nzSpan]="12">
        <nz-card nzTitle="應收帳款">
          <nz-statistic
            [nzValue]="summary().receivables.total"
            nzTitle="總應收"
            [nzPrefix]="prefixTpl"
            [nzValueStyle]="{ color: '#3f8600' }">
          </nz-statistic>
          
          <nz-progress 
            [nzPercent]="summary().receivables.collectionRate"
            nzStatus="active">
          </nz-progress>
          
          <div class="stats-detail">
            <span>已收：{{ summary().receivables.collected | currency }}</span>
            <span>待收：{{ summary().receivables.pending | currency }}</span>
          </div>
        </nz-card>
      </div>

      <!-- 應付統計 -->
      <div nz-col [nzSpan]="12">
        <nz-card nzTitle="應付帳款">
          <nz-statistic
            [nzValue]="summary().payables.total"
            nzTitle="總應付"
            [nzPrefix]="prefixTpl"
            [nzValueStyle]="{ color: '#cf1322' }">
          </nz-statistic>
          
          <nz-progress 
            [nzPercent]="summary().payables.paymentRate"
            nzStatus="active">
          </nz-progress>
          
          <div class="stats-detail">
            <span>已付：{{ summary().payables.paid | currency }}</span>
            <span>待付：{{ summary().payables.pending | currency }}</span>
          </div>
        </nz-card>
      </div>
    </div>

    <!-- 毛利統計 -->
    <nz-card nzTitle="損益概覽" class="mt-md">
      <nz-statistic
        [nzValue]="summary().grossProfit"
        nzTitle="毛利"
        [nzSuffix]="'(' + summary().grossProfitMargin.toFixed(1) + '%)'">
      </nz-statistic>
    </nz-card>

    <ng-template #prefixTpl>$</ng-template>
  `
})
export class FinanceDashboardComponent implements OnInit {
  private trackingService = inject(PaymentStatusTrackingService);
  private blueprintContext = inject(BlueprintContextService);
  private destroyRef = inject(DestroyRef);

  summary = signal<FinancialSummary>({
    blueprintId: '',
    receivables: { total: 0, collected: 0, pending: 0, collectionRate: 0 },
    payables: { total: 0, paid: 0, pending: 0, paymentRate: 0 },
    grossProfit: 0,
    grossProfitMargin: 0,
    asOf: new Date()
  });

  ngOnInit(): void {
    this.loadSummary();
  }

  private loadSummary(): void {
    const blueprintId = this.blueprintContext.currentBlueprintId();
    if (blueprintId) {
      this.trackingService.getBlueprintFinancialSummary(blueprintId)
        .then(summary => this.summary.set(summary));
    }
  }
}
```

### 影響範圍
- `src/app/routes/finance/` - 財務模組路由
- `src/app/routes/blueprint/` - 藍圖內財務視圖

### 驗收條件
1. ✅ 列表元件正常運作
2. ✅ 篩選與搜尋功能
3. ✅ 審核操作介面完整
4. ✅ 狀態看板顯示正確
5. ✅ 響應式設計
6. ✅ 符合 ng-alain 設計規範

---

## 🔍 分析階段

### 步驟 1: Context7 查詢
**目的**: 查詢 ng-alain ST 表格與 ng-zorro 元件

**查詢重點**:
- ST 表格進階用法
- NzModal 動態載入
- NzStatistic 統計元件

### 步驟 2: Sequential Thinking 分析

**思考流程**:
1. **元件拆分**
   - 列表元件（共用）
   - 審核對話框
   - 詳情彈窗
   - 儀表板

2. **狀態管理**
   - 使用 Signals
   - 篩選條件
   - 載入狀態

3. **使用者體驗**
   - 操作確認
   - 錯誤提示
   - 載入指示

### 步驟 3: Software Planning Tool

**開發計畫**:
```
Day 1 (8 hours):
├── InvoiceListComponent
├── PaymentListComponent
└── 共用篩選邏輯

Day 2 (8 hours):
├── InvoiceDetailComponent
├── ApprovalDialogComponent
└── 審核流程 UI

Day 3 (8 hours):
├── FinanceDashboardComponent
├── 路由整合
└── 樣式調整
```

---

## 📐 規劃階段

### 實施步驟

#### Phase 1: 列表元件 (Day 1)

**檔案結構**:
```
src/app/routes/finance/
├── invoice-list/
│   └── invoice-list.component.ts
├── payment-list/
│   └── payment-list.component.ts
└── shared/
    └── finance-filter.component.ts
```

#### Phase 2: 詳情與審核 (Day 2)

**檔案**:
- `invoice-detail.component.ts`
- `approval-dialog.component.ts`

#### Phase 3: 儀表板 (Day 3)

**檔案**:
- `finance-dashboard.component.ts`
- `finance.routes.ts`

### 檔案清單

**新增檔案**:
- `src/app/routes/finance/invoice-list/invoice-list.component.ts`
- `src/app/routes/finance/payment-list/payment-list.component.ts`
- `src/app/routes/finance/invoice-detail/invoice-detail.component.ts`
- `src/app/routes/finance/approval-dialog/approval-dialog.component.ts`
- `src/app/routes/finance/finance-dashboard/finance-dashboard.component.ts`
- `src/app/routes/finance/finance.routes.ts`

**修改檔案**:
- `src/app/routes/routes.ts` (新增路由)

---

## 📜 開發規範

### ⭐ 必須遵循
- ✅ 使用 Standalone Components
- ✅ 使用 Signals 管理狀態
- ✅ 使用 ng-alain ST 表格
- ✅ 使用 SHARED_IMPORTS
- ✅ OnPush 變更檢測

### Angular 20 規範
- ✅ 新控制流語法 (@if, @for)
- ✅ 使用 inject() 注入依賴
- ✅ 使用 input() 取代 @Input()

---

## ✅ 檢查清單

### 架構檢查
- [ ] Standalone Components
- [ ] Signals 狀態管理
- [ ] OnPush 變更檢測

### 功能檢查
- [ ] 列表篩選正常
- [ ] 審核操作完整
- [ ] 儀表板顯示正確

### UI/UX 檢查
- [ ] 響應式設計
- [ ] 載入指示
- [ ] 錯誤處理
