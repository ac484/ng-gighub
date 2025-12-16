# SETC-069: Finance UI Components & Testing

> **任務編號**: SETC-069  
> **模組**: Finance Module (財務模組)  
> **優先級**: P1 (Important)  
> **預估工時**: 3 天  
> **依賴**: SETC-068  
> **狀態**: 📋 待開始

---

## 📋 任務概述

### 目標
實作 Finance Module 的 UI 元件庫和完整測試套件，提供請款管理、付款追蹤、預算概覽等視覺化元件。

### 範圍
- 請款列表元件
- 請款表單元件
- 付款列表元件
- 預算概覽元件
- 財務儀表板元件
- 單元測試與整合測試

---

## 🏗️ UI 元件實作

### 1. 請款列表元件

```typescript
import { Component, inject, signal, input, output, OnInit } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { STColumn } from '@delon/abc/st';
import { InvoiceRepository } from '../repositories/invoice.repository';
import { Invoice, InvoiceStatus } from '../models/invoice.model';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-card [nzTitle]="titleTpl" [nzExtra]="extraTpl">
      <ng-template #titleTpl>
        <span>請款管理</span>
        <nz-badge [nzCount]="invoices().length" nzShowZero class="ml-sm" />
      </ng-template>
      
      <ng-template #extraTpl>
        <nz-space>
          <button *nzSpaceItem nz-button nzType="primary" (click)="onCreateInvoice()">
            <i nz-icon nzType="plus"></i>
            新增請款
          </button>
          <nz-select 
            *nzSpaceItem
            [(ngModel)]="selectedStatus" 
            nzPlaceHolder="狀態篩選"
            nzAllowClear
            (ngModelChange)="loadInvoices()"
            style="width: 120px"
          >
            @for (status of statusOptions; track status.value) {
              <nz-option [nzValue]="status.value" [nzLabel]="status.label" />
            }
          </nz-select>
        </nz-space>
      </ng-template>

      <st 
        [data]="invoices()" 
        [columns]="columns"
        [loading]="loading()"
        [page]="{ show: true, pageSize: 15 }"
        (change)="handleTableChange($event)"
      />
    </nz-card>
  `
})
export class InvoiceListComponent implements OnInit {
  blueprintId = input.required<string>();
  
  invoiceSelected = output<Invoice>();
  createInvoice = output<void>();
  
  private repository = inject(InvoiceRepository);
  
  invoices = signal<Invoice[]>([]);
  loading = signal(false);
  selectedStatus: InvoiceStatus | null = null;
  
  columns: STColumn[] = [
    { title: '請款編號', index: 'invoiceNumber', width: 140 },
    { title: '標題', index: 'title', width: 200 },
    { 
      title: '狀態', 
      index: 'status',
      width: 100,
      type: 'badge',
      badge: {
        draft: { text: '草稿', color: 'default' },
        submitted: { text: '已送審', color: 'processing' },
        under_review: { text: '審核中', color: 'warning' },
        approved: { text: '已核准', color: 'success' },
        rejected: { text: '退回', color: 'error' },
        paid: { text: '已付款', color: 'purple' },
        cancelled: { text: '已取消', color: 'default' }
      }
    },
    { 
      title: '金額', 
      index: 'totalAmount',
      width: 120,
      type: 'currency',
      currency: { format: { ngCurrency: { display: 'code', currencyCode: 'TWD' }}}
    },
    { 
      title: '已付', 
      index: 'paidAmount',
      width: 100,
      type: 'currency'
    },
    { 
      title: '請款日期', 
      index: 'invoiceDate',
      type: 'date',
      width: 120
    },
    { 
      title: '付款狀態', 
      index: 'paymentStatus',
      width: 100,
      type: 'tag',
      tag: {
        unpaid: { text: '未付', color: 'default' },
        partial: { text: '部分', color: 'orange' },
        paid: { text: '已付', color: 'green' }
      }
    },
    {
      title: '操作',
      width: 150,
      buttons: [
        { text: '查看', click: (item: any) => this.viewInvoice(item) },
        { 
          text: '送審', 
          click: (item: any) => this.submitInvoice(item),
          iif: (item: any) => item.status === 'draft'
        },
        { 
          text: '核准', 
          click: (item: any) => this.approveInvoice(item),
          iif: (item: any) => item.status === 'submitted' || item.status === 'under_review',
          acl: 'invoice:approve'
        }
      ]
    }
  ];

  statusOptions = [
    { value: 'draft', label: '草稿' },
    { value: 'submitted', label: '已送審' },
    { value: 'approved', label: '已核准' },
    { value: 'rejected', label: '退回' },
    { value: 'paid', label: '已付款' }
  ];

  ngOnInit(): void {
    this.loadInvoices();
  }

  async loadInvoices(): Promise<void> {
    this.loading.set(true);
    try {
      const filters = this.selectedStatus ? { status: this.selectedStatus } : undefined;
      const invoices = await this.repository.findByBlueprint(this.blueprintId(), filters);
      this.invoices.set(invoices);
    } finally {
      this.loading.set(false);
    }
  }

  onCreateInvoice(): void {
    this.createInvoice.emit();
  }

  viewInvoice(invoice: Invoice): void {
    this.invoiceSelected.emit(invoice);
  }

  submitInvoice(invoice: Invoice): void {
    // TODO: 送審
  }

  approveInvoice(invoice: Invoice): void {
    // TODO: 核准
  }

  handleTableChange(e: any): void {
    // 處理表格變更
  }
}
```

### 2. 預算概覽元件

```typescript
import { Component, inject, signal, input, computed, OnInit } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { BudgetService } from '../services/budget.service';
import { BudgetSummary, BudgetAlert } from '../services/budget.interface';

@Component({
  selector: 'app-budget-overview',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-card nzTitle="預算概覽">
      @if (loading()) {
        <nz-spin nzSimple />
      } @else {
        <!-- 摘要卡片 -->
        <nz-row [nzGutter]="16" class="mb-md">
          <nz-col [nzSpan]="6">
            <nz-statistic 
              nzTitle="總預算" 
              [nzValue]="summary()?.totalBudget || 0"
              [nzPrefix]="'$'"
            />
          </nz-col>
          <nz-col [nzSpan]="6">
            <nz-statistic 
              nzTitle="已支出" 
              [nzValue]="summary()?.totalSpent || 0"
              [nzPrefix]="'$'"
              [nzValueStyle]="{ color: '#cf1322' }"
            />
          </nz-col>
          <nz-col [nzSpan]="6">
            <nz-statistic 
              nzTitle="剩餘預算" 
              [nzValue]="summary()?.totalRemaining || 0"
              [nzPrefix]="'$'"
              [nzValueStyle]="{ color: '#3f8600' }"
            />
          </nz-col>
          <nz-col [nzSpan]="6">
            <nz-statistic 
              nzTitle="執行率" 
              [nzValue]="summary()?.overallUtilization || 0"
              nzSuffix="%"
            />
          </nz-col>
        </nz-row>

        <!-- 進度條 -->
        <div class="mb-md">
          <nz-progress 
            [nzPercent]="summary()?.overallUtilization || 0"
            [nzStatus]="getProgressStatus(summary()?.overallUtilization || 0)"
            nzStrokeWidth="20"
          />
        </div>

        <!-- 預警列表 -->
        @if (summary()?.alerts && summary()!.alerts.length > 0) {
          <nz-alert 
            nzType="warning" 
            nzMessage="預算預警"
            [nzDescription]="alertsTpl"
            nzShowIcon
            class="mb-md"
          />
          <ng-template #alertsTpl>
            <ul>
              @for (alert of summary()!.alerts; track alert.budgetId) {
                <li>
                  <nz-tag [nzColor]="getAlertColor(alert.alertType)">
                    {{ getAlertLabel(alert.alertType) }}
                  </nz-tag>
                  {{ alert.message }}
                </li>
              }
            </ul>
          </ng-template>
        }

        <!-- 分類統計 -->
        <nz-table 
          [nzData]="categoryData()" 
          nzSize="small"
          [nzShowPagination]="false"
        >
          <thead>
            <tr>
              <th>分類</th>
              <th>預算</th>
              <th>已支出</th>
              <th>剩餘</th>
              <th>執行率</th>
            </tr>
          </thead>
          <tbody>
            @for (item of categoryData(); track item.category) {
              <tr>
                <td>{{ item.category }}</td>
                <td>{{ item.totalBudget | currency:'TWD' }}</td>
                <td>{{ item.totalSpent | currency:'TWD' }}</td>
                <td>{{ item.totalRemaining | currency:'TWD' }}</td>
                <td>
                  <nz-progress 
                    [nzPercent]="getUtilization(item)"
                    [nzStatus]="getProgressStatus(getUtilization(item))"
                    nzSize="small"
                  />
                </td>
              </tr>
            }
          </tbody>
        </nz-table>
      }
    </nz-card>
  `
})
export class BudgetOverviewComponent implements OnInit {
  blueprintId = input.required<string>();
  
  private budgetService = inject(BudgetService);
  
  loading = signal(false);
  summary = signal<BudgetSummary | null>(null);
  
  categoryData = computed(() => {
    const s = this.summary();
    if (!s?.byCategory) return [];
    
    return Object.entries(s.byCategory).map(([category, data]) => ({
      category,
      ...data
    }));
  });

  ngOnInit(): void {
    this.loadSummary();
  }

  async loadSummary(): Promise<void> {
    this.loading.set(true);
    try {
      const summary = await this.budgetService.getBudgetSummary(this.blueprintId());
      this.summary.set(summary);
    } finally {
      this.loading.set(false);
    }
  }

  getProgressStatus(percent: number): 'success' | 'normal' | 'exception' | 'active' {
    if (percent >= 100) return 'exception';
    if (percent >= 80) return 'active';
    return 'normal';
  }

  getAlertColor(type: string): string {
    const colors: Record<string, string> = {
      warning: 'orange',
      critical: 'red',
      exceeded: 'magenta'
    };
    return colors[type] || 'default';
  }

  getAlertLabel(type: string): string {
    const labels: Record<string, string> = {
      warning: '預警',
      critical: '警示',
      exceeded: '超支'
    };
    return labels[type] || type;
  }

  getUtilization(item: any): number {
    return item.totalBudget > 0 
      ? Math.round((item.totalSpent / item.totalBudget) * 100)
      : 0;
  }
}
```

### 3. 財務儀表板元件

```typescript
import { Component, inject, signal, input, OnInit } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { PaymentService } from '../services/payment.service';
import { PaymentSummary } from '../services/payment.interface';

@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-row [nzGutter]="16">
      <!-- 付款摘要 -->
      <nz-col [nzSpan]="12">
        <nz-card nzTitle="付款摘要">
          @if (loading()) {
            <nz-spin nzSimple />
          } @else {
            <nz-row [nzGutter]="16">
              <nz-col [nzSpan]="12">
                <nz-statistic 
                  nzTitle="已請款總額" 
                  [nzValue]="paymentSummary()?.totalInvoiced || 0"
                  [nzPrefix]="'$'"
                />
              </nz-col>
              <nz-col [nzSpan]="12">
                <nz-statistic 
                  nzTitle="已付款金額" 
                  [nzValue]="paymentSummary()?.totalPaid || 0"
                  [nzPrefix]="'$'"
                  [nzValueStyle]="{ color: '#3f8600' }"
                />
              </nz-col>
            </nz-row>
            <nz-row [nzGutter]="16" class="mt-md">
              <nz-col [nzSpan]="12">
                <nz-statistic 
                  nzTitle="待付款金額" 
                  [nzValue]="paymentSummary()?.totalPending || 0"
                  [nzPrefix]="'$'"
                  [nzValueStyle]="{ color: '#faad14' }"
                />
              </nz-col>
              <nz-col [nzSpan]="12">
                <nz-statistic 
                  nzTitle="逾期未付" 
                  [nzValue]="paymentSummary()?.totalOverdue || 0"
                  [nzPrefix]="'$'"
                  [nzValueStyle]="{ color: '#cf1322' }"
                />
              </nz-col>
            </nz-row>
            <div class="mt-md">
              <span>付款率:</span>
              <nz-progress 
                [nzPercent]="paymentSummary()?.paymentRate || 0"
                [nzStatus]="getPaymentStatus()"
              />
            </div>
          }
        </nz-card>
      </nz-col>

      <!-- 預算概覽 -->
      <nz-col [nzSpan]="12">
        <app-budget-overview [blueprintId]="blueprintId()" />
      </nz-col>
    </nz-row>
  `
})
export class FinanceDashboardComponent implements OnInit {
  blueprintId = input.required<string>();
  
  private paymentService = inject(PaymentService);
  
  loading = signal(false);
  paymentSummary = signal<PaymentSummary | null>(null);

  ngOnInit(): void {
    this.loadPaymentSummary();
  }

  async loadPaymentSummary(): Promise<void> {
    this.loading.set(true);
    try {
      const summary = await this.paymentService.getPaymentSummary(this.blueprintId());
      this.paymentSummary.set(summary);
    } finally {
      this.loading.set(false);
    }
  }

  getPaymentStatus(): 'success' | 'normal' | 'exception' | 'active' {
    const rate = this.paymentSummary()?.paymentRate || 0;
    if (rate >= 90) return 'success';
    if (rate >= 50) return 'active';
    return 'normal';
  }
}
```

---

## 🧪 測試規格

```typescript
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { InvoiceListComponent } from './invoice-list.component';
import { BudgetOverviewComponent } from './budget-overview.component';

describe('InvoiceListComponent', () => {
  let component: InvoiceListComponent;
  let fixture: ComponentFixture<InvoiceListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceListComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceListComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('blueprintId', 'bp-123');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load invoices on init', async () => {
    await fixture.whenStable();
    expect(component.invoices()).toBeDefined();
  });
});

describe('BudgetOverviewComponent', () => {
  let component: BudgetOverviewComponent;
  let fixture: ComponentFixture<BudgetOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetOverviewComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetOverviewComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('blueprintId', 'bp-123');
  });

  it('should calculate progress status correctly', () => {
    expect(component.getProgressStatus(100)).toBe('exception');
    expect(component.getProgressStatus(85)).toBe('active');
    expect(component.getProgressStatus(50)).toBe('normal');
  });
});
```

---

## ✅ 交付物

- [ ] `invoice-list.component.ts`
- [ ] `invoice-form.component.ts`
- [ ] `payment-list.component.ts`
- [ ] `budget-overview.component.ts`
- [ ] `finance-dashboard.component.ts`
- [ ] `*.spec.ts` - 所有單元測試
- [ ] 更新 `index.ts` 匯出

---

## 🎯 驗收標準

1. ✅ 所有 UI 元件正確渲染
2. ✅ 金額顯示格式正確
3. ✅ 與服務層正確整合
4. ✅ 權限控制正確
5. ✅ 單元測試覆蓋率 >80%
6. ✅ TypeScript 編譯無錯誤

---

**文件版本**: 1.0.0  
**建立日期**: 2025-12-15  
**最後更新**: 2025-12-15
