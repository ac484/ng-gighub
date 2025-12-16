/**
 * Finance Module View Component
 * 財務域視圖元件 - 顯示於藍圖詳情頁面的 Tab 中
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input } from '@angular/core';
import { BudgetService } from '@core/blueprint/modules/implementations/finance/services/budget.service';
import { CostManagementService } from '@core/blueprint/modules/implementations/finance/services/cost-management.service';
import { FinancialReportService } from '@core/blueprint/modules/implementations/finance/services/financial-report.service';
import { InvoiceService } from '@core/blueprint/modules/implementations/finance/services/invoice.service';
import { LedgerService } from '@core/blueprint/modules/implementations/finance/services/ledger.service';
import { PaymentService } from '@core/blueprint/modules/implementations/finance/services/payment.service';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';

@Component({
  selector: 'app-finance-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzStatisticModule, NzEmptyModule],
  template: `
    <!-- Finance Statistics Card -->
    <nz-card nzTitle="財務統計" class="mb-md">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="invoiceService.data().length" nzTitle="請款" [nzPrefix]="invoiceIcon" />
          <ng-template #invoiceIcon>
            <span nz-icon nzType="file-text" style="color: #52c41a;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="paymentService.data().length" nzTitle="付款" [nzPrefix]="paymentIcon" />
          <ng-template #paymentIcon>
            <span nz-icon nzType="transaction" style="color: #faad14;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="costService.data().length" nzTitle="成本" [nzPrefix]="costIcon" />
          <ng-template #costIcon>
            <span nz-icon nzType="dollar" style="color: #1890ff;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="0" nzTitle="統計" [nzPrefix]="reportIcon" />
          <ng-template #reportIcon>
            <span nz-icon nzType="bar-chart" style="color: #722ed1;"></span>
          </ng-template>
        </nz-col>
      </nz-row>
    </nz-card>

    <!-- Finance Tabs -->
    <nz-card>
      <nz-tabset>
        <nz-tab nzTitle="請款">
          @if (invoiceService.loading()) {
            <nz-spin nzSimple />
          } @else if (invoiceService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無請款記錄" />
          } @else {
            <st [data]="invoiceService.data()" [columns]="invoiceColumns" />
          }
        </nz-tab>
        <nz-tab nzTitle="付款">
          @if (paymentService.loading()) {
            <nz-spin nzSimple />
          } @else if (paymentService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無付款記錄" />
          } @else {
            <st [data]="paymentService.data()" [columns]="paymentColumns" />
          }
        </nz-tab>
        <nz-tab nzTitle="成本">
          @if (costService.loading()) {
            <nz-spin nzSimple />
          } @else if (costService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無成本記錄" />
          } @else {
            <st [data]="costService.data()" [columns]="costColumns" />
          }
        </nz-tab>
        <nz-tab nzTitle="統計">
          <nz-empty nzNotFoundContent="財務統計功能開發中" />
        </nz-tab>
      </nz-tabset>
    </nz-card>
  `,
  styles: []
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

  invoiceColumns: STColumn[] = this.withActions(
    [
      { title: '請款單號', index: 'invoiceNumber', width: '150px' },
      { title: '金額', index: 'amount', width: '120px' },
      { title: '狀態', index: 'status', width: '100px' },
      { title: '申請日期', index: 'requestedAt', type: 'date', width: '180px' }
    ],
    '請款'
  );

  paymentColumns: STColumn[] = this.withActions(
    [
      { title: '付款對象', index: 'payee' },
      { title: '金額', index: 'amount', width: '120px' },
      { title: '付款方式', index: 'method', width: '100px' },
      { title: '付款日期', index: 'paidAt', type: 'date', width: '180px' }
    ],
    '付款'
  );

  costColumns: STColumn[] = this.withActions(
    [
      { title: '成本項目', index: 'item' },
      { title: '金額', index: 'amount', width: '120px' },
      { title: '類別', index: 'category', width: '100px' },
      { title: '日期', index: 'date', type: 'date', width: '180px' }
    ],
    '成本'
  );

  ngOnInit(): void {
    const blueprintId = this.blueprintId();
    this.invoiceService.load(blueprintId);
    this.paymentService.load(blueprintId);
    this.costService.load(blueprintId);
    // Load others for potential future use
    this.budgetService.load(blueprintId);
    this.ledgerService.load(blueprintId);
    this.financialReportService.load(blueprintId);
  }

  private withActions(columns: STColumn[], context: string): STColumn[] {
    return [...columns, this.createActionColumn(context)];
  }

  private createActionColumn(context: string): STColumn {
    return {
      title: '操作',
      width: 160,
      buttons: [
        { text: '查看', click: record => this.notifyPending(context, '查看', record) },
        { text: '編輯', click: record => this.notifyPending(context, '編輯', record) },
        { text: '刪除', click: record => this.notifyPending(context, '刪除', record) }
      ]
    };
  }

  notifyPending(context: string, action: string, record?: { item?: string; reportName?: string; invoiceNumber?: string }): void {
    const title = record?.item || record?.reportName || record?.invoiceNumber;
    const detail = title ? `：${title}` : '';
    this.message.info(`${context}${action}功能待實作${detail}`);
  }
}
