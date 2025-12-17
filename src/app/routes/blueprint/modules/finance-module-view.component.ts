/**
 * Finance Module View Component
 * 財務域視圖元件 - 顯示於藍圖詳情頁面的 Tab 中
 *
 * SETC-030: Invoice/Payment UI Components
 *
 * 實現財務與成本階段完整 UI：
 * - 財務摘要（應收/應付/毛利）
 * - 請款/付款流程視覺化
 * - 可請款/可付款清單
 * - 審核流程追蹤
 * - 成本管理統計
 *
 * @module FinanceModuleViewComponent
 * @author GigHub Development Team
 * @date 2025-12-17
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input, signal, computed } from '@angular/core';
import type { FinancialSummary, Invoice, InvoiceStatus } from '@core/blueprint/modules/implementations/finance';
import { BudgetService } from '@core/blueprint/modules/implementations/finance/services/budget.service';
import { CostManagementService } from '@core/blueprint/modules/implementations/finance/services/cost-management.service';
import { FinancialReportService } from '@core/blueprint/modules/implementations/finance/services/financial-report.service';
import { InvoiceService } from '@core/blueprint/modules/implementations/finance/services/invoice.service';
import { LedgerService } from '@core/blueprint/modules/implementations/finance/services/ledger.service';
import { PaymentService } from '@core/blueprint/modules/implementations/finance/services/payment.service';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';

/**
 * 可請款/可付款項目
 */
interface BillableItem {
  id: string;
  taskName: string;
  contractAmount: number;
  billablePercentage: number;
  billableAmount: number;
  billedAmount: number;
  remainingAmount: number;
  type: 'receivable' | 'payable';
  party: string;
}

@Component({
  selector: 'app-finance-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzEmptyModule, NzStepsModule, NzTimelineModule, NzDescriptionsModule],
  templateUrl: './finance-module-view.component.html',
  styles: [
    `
      :host {
        display: block;
      }

      .mb-md {
        margin-bottom: 16px;
      }

      .summary-card {
        padding: 8px 0;
      }

      .summary-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
      }

      .summary-icon {
        font-size: 20px;
      }

      .receivable .summary-icon {
        color: #52c41a;
      }

      .payable .summary-icon {
        color: #faad14;
      }

      .profit .summary-icon {
        color: #1890ff;
      }

      .summary-title {
        font-size: 14px;
        font-weight: 500;
        color: #666;
      }

      .summary-detail {
        display: flex;
        justify-content: space-between;
        margin-top: 12px;
        font-size: 12px;
        color: #666;
      }

      .tab-header {
        padding: 8px 0;
      }

      .timeline-item {
        padding: 4px 0;
      }

      .timeline-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
      }

      .timeline-content {
        font-size: 12px;
        color: #666;
      }

      .timeline-actions {
        margin-top: 4px;
      }
    `
  ]
})
export class FinanceModuleViewComponent implements OnInit {
  blueprintId = input.required<string>();

  readonly costService = inject(CostManagementService);
  readonly invoiceService = inject(InvoiceService);
  readonly paymentService = inject(PaymentService);
  readonly budgetService = inject(BudgetService);
  readonly ledgerService = inject(LedgerService);
  readonly financialReportService = inject(FinancialReportService);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  // 狀態
  loading = signal(false);
  activeTabIndex = 0;
  workflowStep = signal(1);
  receivableStatusFilter = '';
  payableStatusFilter = '';

  // 財務摘要
  summary = signal<FinancialSummary>({
    blueprintId: '',
    receivables: { total: 0, collected: 0, pending: 0, collectionRate: 0 },
    payables: { total: 0, paid: 0, pending: 0, paymentRate: 0 },
    grossProfit: 0,
    grossProfitMargin: 0,
    asOf: new Date(),
    totalBilled: 0,
    totalReceived: 0,
    pendingReceivable: 0,
    overdueReceivable: 0,
    receivableInvoiceCount: 0,
    paidReceivableCount: 0,
    overdueInvoiceCount: 0,
    totalPayable: 0,
    totalPaid: 0,
    accountsReceivableBalance: 0,
    accountsPayableBalance: 0,
    monthlyBilled: 0,
    monthlyReceived: 0
  });

  // 可請款/付款項目
  receivableItems = signal<BillableItem[]>([]);
  payableItems = signal<BillableItem[]>([]);

  // 請款單列表
  private allReceivableInvoices = signal<Invoice[]>([]);
  private allPayableInvoices = signal<Invoice[]>([]);

  // 計算屬性
  totalReceivableAmount = computed(() => this.receivableItems().reduce((sum, item) => sum + item.remainingAmount, 0));

  totalPayableAmount = computed(() => this.payableItems().reduce((sum, item) => sum + item.remainingAmount, 0));

  filteredReceivableInvoices = computed(() => {
    const invoices = this.allReceivableInvoices();
    if (!this.receivableStatusFilter) return invoices;
    return invoices.filter(inv => inv.status === this.receivableStatusFilter);
  });

  filteredPayableInvoices = computed(() => {
    const invoices = this.allPayableInvoices();
    if (!this.payableStatusFilter) return invoices;
    return invoices.filter(inv => inv.status === this.payableStatusFilter);
  });

  pendingApprovalReceivables = computed(() =>
    this.allReceivableInvoices().filter(inv => inv.status === 'submitted' || inv.status === 'under_review')
  );

  pendingApprovalPayables = computed(() =>
    this.allPayableInvoices().filter(inv => inv.status === 'submitted' || inv.status === 'under_review')
  );

  costStats = computed(() => ({
    actualCost: this.summary().payables.paid,
    totalReceivable: this.summary().receivables.total,
    totalPayable: this.summary().payables.total
  }));

  // 狀態選項
  statusOptions = [
    { value: 'draft', label: '草稿' },
    { value: 'submitted', label: '已送出' },
    { value: 'under_review', label: '審核中' },
    { value: 'approved', label: '已核准' },
    { value: 'rejected', label: '已退回' },
    { value: 'invoiced', label: '已開票' },
    { value: 'partial_paid', label: '部分付款' },
    { value: 'paid', label: '已付款' },
    { value: 'cancelled', label: '已取消' }
  ];

  // 可請款/付款清單欄位
  billableColumns: STColumn[] = [
    { title: '任務名稱', index: 'taskName', width: 180 },
    { title: '對象', index: 'party', width: 150 },
    { title: '合約金額', index: 'contractAmount', type: 'number', width: 120 },
    {
      title: '可請款%',
      index: 'billablePercentage',
      type: 'number',
      width: 100,
      format: (item: BillableItem) => `${item.billablePercentage}%`
    },
    { title: '已請款', index: 'billedAmount', type: 'number', width: 120 },
    { title: '剩餘可請', index: 'remainingAmount', type: 'number', width: 120 },
    {
      title: '操作',
      width: 120,
      buttons: [{ text: '建立請款', click: (record: BillableItem) => this.createInvoiceFromItem(record) }]
    }
  ];

  // 請款單欄位
  invoiceColumns: STColumn[] = [
    { title: '編號', index: 'invoiceNumber', width: 150 },
    {
      title: '類型',
      index: 'invoiceType',
      width: 100,
      type: 'badge',
      badge: {
        receivable: { text: '請款', color: 'success' },
        payable: { text: '付款', color: 'warning' }
      }
    },
    { title: '對象', index: 'payingParty.name', width: 150 },
    { title: '金額', index: 'total', type: 'number', width: 120 },
    {
      title: '狀態',
      index: 'status',
      width: 100,
      type: 'badge',
      badge: {
        draft: { text: '草稿', color: 'default' },
        submitted: { text: '已送出', color: 'processing' },
        under_review: { text: '審核中', color: 'warning' },
        approved: { text: '已核准', color: 'success' },
        rejected: { text: '已退回', color: 'error' },
        invoiced: { text: '已開票', color: 'processing' },
        partial_paid: { text: '部分付款', color: 'warning' },
        paid: { text: '已付款', color: 'success' },
        cancelled: { text: '已取消', color: 'default' }
      }
    },
    { title: '到期日', index: 'dueDate', type: 'date', dateFormat: 'yyyy-MM-dd', width: 110 },
    {
      title: '操作',
      width: 180,
      buttons: [
        { text: '查看', click: (record: Invoice) => this.viewInvoice(record) },
        { text: '審核', click: (record: Invoice) => this.approveInvoice(record), iif: (record: Invoice) => this.canApprove(record) },
        { text: '送出', click: (record: Invoice) => this.submitInvoice(record), iif: (record: Invoice) => record.status === 'draft' }
      ]
    }
  ];

  // 成本欄位
  costColumns: STColumn[] = [
    { title: '成本項目', index: 'item', width: 180 },
    { title: '金額', index: 'amount', type: 'number', width: 120 },
    { title: '類別', index: 'category', width: 100 },
    { title: '日期', index: 'date', type: 'date', dateFormat: 'yyyy-MM-dd', width: 110 },
    {
      title: '操作',
      width: 120,
      buttons: [{ text: '查看', click: (record: { item?: string }) => this.message.info(`查看成本：${record.item}`) }]
    }
  ];

  /** 格式化百分比 */
  formatPercent = (percent: number): string => `${percent.toFixed(1)}%`;

  /** 格式化數字（千分位） */
  formatNumber(value: number): string {
    return value.toLocaleString('zh-TW');
  }

  ngOnInit(): void {
    const blueprintId = this.blueprintId();
    this.loadAllData(blueprintId);
  }

  /** 載入所有資料 */
  private loadAllData(blueprintId: string): void {
    this.loading.set(true);

    // 載入服務資料
    this.invoiceService.load(blueprintId);
    this.paymentService.load(blueprintId);
    this.costService.load(blueprintId);
    this.budgetService.load(blueprintId);
    this.ledgerService.load(blueprintId);
    this.financialReportService.load(blueprintId);

    // 載入模擬資料 (MVP)
    this.loadMockData(blueprintId);
  }

  /** 載入模擬資料 */
  private loadMockData(blueprintId: string): void {
    setTimeout(() => {
      // 財務摘要
      this.summary.set({
        blueprintId,
        receivables: { total: 2850000, collected: 1920000, pending: 930000, collectionRate: 67.4 },
        payables: { total: 1850000, paid: 1450000, pending: 400000, paymentRate: 78.4 },
        grossProfit: 470000,
        grossProfitMargin: 24.5,
        asOf: new Date(),
        totalBilled: 2850000,
        totalReceived: 1920000,
        pendingReceivable: 930000,
        overdueReceivable: 180000,
        receivableInvoiceCount: 12,
        paidReceivableCount: 8,
        overdueInvoiceCount: 2,
        totalPayable: 1850000,
        totalPaid: 1450000,
        accountsReceivableBalance: 930000,
        accountsPayableBalance: 400000,
        monthlyBilled: 450000,
        monthlyReceived: 320000
      });

      // 可請款項目
      this.receivableItems.set([
        {
          id: '1',
          taskName: '基礎工程-第一期',
          contractAmount: 500000,
          billablePercentage: 80,
          billableAmount: 400000,
          billedAmount: 320000,
          remainingAmount: 80000,
          type: 'receivable',
          party: '業主公司'
        },
        {
          id: '2',
          taskName: '結構工程-A棟',
          contractAmount: 800000,
          billablePercentage: 60,
          billableAmount: 480000,
          billedAmount: 300000,
          remainingAmount: 180000,
          type: 'receivable',
          party: '業主公司'
        },
        {
          id: '3',
          taskName: '機電工程-第一階段',
          contractAmount: 350000,
          billablePercentage: 100,
          billableAmount: 350000,
          billedAmount: 350000,
          remainingAmount: 0,
          type: 'receivable',
          party: '業主公司'
        }
      ]);

      // 可付款項目
      this.payableItems.set([
        {
          id: '4',
          taskName: '鋼筋採購',
          contractAmount: 420000,
          billablePercentage: 100,
          billableAmount: 420000,
          billedAmount: 380000,
          remainingAmount: 40000,
          type: 'payable',
          party: '承商A'
        },
        {
          id: '5',
          taskName: '混凝土工程',
          contractAmount: 280000,
          billablePercentage: 70,
          billableAmount: 196000,
          billedAmount: 150000,
          remainingAmount: 46000,
          type: 'payable',
          party: '承商B'
        }
      ]);

      // 請款單列表
      this.allReceivableInvoices.set(this.createMockInvoices('receivable', blueprintId));
      this.allPayableInvoices.set(this.createMockInvoices('payable', blueprintId));

      this.loading.set(false);
    }, 500);
  }

  /** 建立模擬請款單 */
  private createMockInvoices(type: 'receivable' | 'payable', blueprintId: string): Invoice[] {
    const now = new Date();
    const dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const prefix = type === 'receivable' ? 'INV' : 'PAY';

    return [
      this.createMockInvoice(`${prefix}-20251217-001`, type, 'approved', 150000, now, dueDate, blueprintId),
      this.createMockInvoice(`${prefix}-20251216-002`, type, 'submitted', 85000, now, dueDate, blueprintId),
      this.createMockInvoice(`${prefix}-20251215-003`, type, 'under_review', 42000, now, dueDate, blueprintId),
      this.createMockInvoice(`${prefix}-20251214-004`, type, 'draft', 68000, now, dueDate, blueprintId)
    ];
  }

  private createMockInvoice(
    invoiceNumber: string,
    invoiceType: 'receivable' | 'payable',
    status: InvoiceStatus,
    total: number,
    createdAt: Date,
    dueDate: Date,
    blueprintId: string
  ): Invoice {
    return {
      id: `mock-${invoiceNumber}`,
      blueprintId,
      invoiceNumber,
      invoiceType,
      contractId: 'contract-001',
      taskIds: ['task-001'],
      invoiceItems: [],
      subtotal: Math.round(total / 1.05),
      tax: total - Math.round(total / 1.05),
      taxRate: 0.05,
      total,
      billingPercentage: 100,
      billingParty: {
        id: 'org-001',
        name: invoiceType === 'receivable' ? '本公司' : '承商公司',
        taxId: '12345678',
        address: '台北市信義區',
        contactName: '王經理',
        contactPhone: '02-12345678',
        contactEmail: 'contact@example.com'
      },
      payingParty: {
        id: 'org-002',
        name: invoiceType === 'receivable' ? '業主公司' : '本公司',
        taxId: '87654321',
        address: '台北市中山區',
        contactName: '李會計',
        contactPhone: '02-87654321',
        contactEmail: 'accounting@example.com'
      },
      status,
      approvalWorkflow: {
        currentStep: status === 'approved' ? 2 : 1,
        totalSteps: 2,
        approvers: [],
        history: []
      },
      dueDate,
      attachments: [],
      createdBy: 'user-001',
      createdAt,
      updatedAt: createdAt
    };
  }

  /** 重新整理摘要 */
  refreshSummary(): void {
    this.loadAllData(this.blueprintId());
    this.message.success('資料已重新整理');
  }

  /** 篩選請款單 */
  filterInvoices(): void {
    // Signal computed 會自動更新
  }

  /** 取得毛利顏色樣式 */
  getProfitStyle(): Record<string, string> {
    const profit = this.summary().grossProfit;
    return {
      color: profit >= 0 ? '#3f8600' : '#cf1322',
      fontSize: '24px'
    };
  }

  /** 從可請款項目建立請款單 */
  createInvoiceFromItem(item: BillableItem): void {
    const typeLabel = item.type === 'receivable' ? '請款' : '付款';
    this.modal.confirm({
      nzTitle: `建立${typeLabel}單`,
      nzContent: `確定要為「${item.taskName}」建立${typeLabel}單嗎？金額：$${this.formatNumber(item.remainingAmount)}`,
      nzOkText: '確定',
      nzCancelText: '取消',
      nzOnOk: () => {
        this.message.success(`已建立${typeLabel}單草稿`);
      }
    });
  }

  /** 建立應收請款單 */
  createReceivableInvoice(): void {
    this.message.info('新增請款單功能開發中');
  }

  /** 建立應付付款單 */
  createPayableInvoice(): void {
    this.message.info('新增付款單功能開發中');
  }

  /** 查看請款單詳情 */
  viewInvoice(invoice: Invoice): void {
    const typeLabel = invoice.invoiceType === 'receivable' ? '請款單' : '付款單';
    const partyLabel = invoice.invoiceType === 'receivable' ? '付款方' : '收款方';
    this.modal.info({
      nzTitle: `${typeLabel}詳情`,
      nzContent:
        `<div>` +
        `<p><strong>編號：</strong>${invoice.invoiceNumber}</p>` +
        `<p><strong>金額：</strong>$${invoice.total.toLocaleString()}</p>` +
        `<p><strong>狀態：</strong>${this.getStatusLabel(invoice.status)}</p>` +
        `<p><strong>${partyLabel}：</strong>${invoice.payingParty.name}</p>` +
        `<p><strong>到期日：</strong>${invoice.dueDate.toLocaleDateString()}</p>` +
        `</div>`,
      nzWidth: 500
    });
  }

  /** 審核請款單 */
  approveInvoice(invoice: Invoice): void {
    this.modal.confirm({
      nzTitle: '審核請款單',
      nzContent: `確定要核准請款單 ${invoice.invoiceNumber} 嗎？金額：$${this.formatNumber(invoice.total)}`,
      nzOkText: '核准',
      nzCancelText: '取消',
      nzOnOk: () => {
        this.message.success('已核准');
      }
    });
  }

  /** 送出請款單 */
  submitInvoice(invoice: Invoice): void {
    this.modal.confirm({
      nzTitle: '確認送出',
      nzContent: `送出請款單 ${invoice.invoiceNumber} 後將進入審核流程，確定要送出嗎？`,
      nzOnOk: () => {
        this.message.success('已送出');
      }
    });
  }

  /** 判斷是否可審核 */
  canApprove(invoice: Invoice): boolean {
    return invoice.status === 'submitted' || invoice.status === 'under_review';
  }

  /** 取得狀態標籤 */
  getStatusLabel(status: InvoiceStatus): string {
    const option = this.statusOptions.find(s => s.value === status);
    return option?.label ?? status;
  }

  /** 取得狀態顏色 */
  getStatusColor(status: InvoiceStatus): string {
    const colorMap: Record<string, string> = {
      draft: 'default',
      submitted: 'processing',
      under_review: 'warning',
      approved: 'success',
      rejected: 'error',
      invoiced: 'cyan',
      partial_paid: 'orange',
      paid: 'green',
      cancelled: 'default'
    };
    return colorMap[status] ?? 'default';
  }

  /** 取得時間軸顏色 */
  getTimelineColor(status: InvoiceStatus): string {
    const colorMap: Record<string, string> = {
      draft: 'gray',
      submitted: 'blue',
      under_review: 'orange',
      approved: 'green',
      rejected: 'red',
      invoiced: 'blue',
      partial_paid: 'orange',
      paid: 'green',
      cancelled: 'gray'
    };
    return colorMap[status] ?? 'gray';
  }
}
