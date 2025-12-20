/**
 * Invoice List Component
 *
 * SETC-069: Finance UI Components
 *
 * 請款列表元件，提供：
 * - 請款單列表顯示
 * - 狀態篩選
 * - 請款操作（送審、核准、退回）
 *
 * @module InvoiceListComponent
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import { Component, signal, input, output, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { STColumn, STChange } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';

import type { Invoice, InvoiceStatus, InvoiceType } from '../models/invoice.model';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-card [nzTitle]="titleTpl" [nzExtra]="extraTpl">
      <ng-template #titleTpl>
        <span>請款管理</span>
        <nz-badge [nzCount]="invoices().length" nzShowZero class="ml-sm" />
      </ng-template>

      <ng-template #extraTpl>
        <nz-space>
          <button *nzSpaceItem nz-button nzType="primary" (click)="onCreateInvoice()">
            <span nz-icon nzType="plus"></span>
            新增請款
          </button>
          <nz-select
            *nzSpaceItem
            [(ngModel)]="selectedStatus"
            nzPlaceHolder="狀態篩選"
            nzAllowClear
            (ngModelChange)="onFilterChange()"
            style="width: 120px"
          >
            @for (status of statusOptions; track status.value) {
              <nz-option [nzValue]="status.value" [nzLabel]="status.label" />
            }
          </nz-select>
          <nz-select
            *nzSpaceItem
            [(ngModel)]="selectedType"
            nzPlaceHolder="類型篩選"
            nzAllowClear
            (ngModelChange)="onFilterChange()"
            style="width: 120px"
          >
            <nz-option nzValue="receivable" nzLabel="應收款" />
            <nz-option nzValue="payable" nzLabel="應付款" />
          </nz-select>
        </nz-space>
      </ng-template>

      <st
        [data]="filteredInvoices()"
        [columns]="columns"
        [loading]="loading()"
        [page]="{ show: true, front: true, total: false }"
        (change)="handleTableChange($event)"
      />
    </nz-card>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .ml-sm {
        margin-left: 8px;
      }
    `
  ]
})
export class InvoiceListComponent implements OnInit {
  /** 藍圖 ID */
  blueprintId = input.required<string>();

  /** 請款列表 */
  invoices = input<Invoice[]>([]);

  /** 載入中狀態 */
  loading = input(false);

  /** 選中請款單事件 */
  readonly invoiceSelected = output<Invoice>();

  /** 新增請款事件 */
  readonly createInvoice = output<void>();

  /** 請款操作事件 */
  readonly invoiceAction = output<{ action: string; invoice: Invoice }>();

  selectedStatus: InvoiceStatus | null = null;
  selectedType: InvoiceType | null = null;

  columns: STColumn[] = [
    { title: '請款編號', index: 'invoiceNumber', width: 160 },
    {
      title: '類型',
      index: 'invoiceType',
      width: 90,
      type: 'tag',
      tag: {
        receivable: { text: '應收', color: 'blue' },
        payable: { text: '應付', color: 'orange' }
      }
    },
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
        invoiced: { text: '已開票', color: 'processing' },
        partial_paid: { text: '部分付', color: 'warning' },
        paid: { text: '已付款', color: 'success' },
        cancelled: { text: '已取消', color: 'default' }
      }
    },
    {
      title: '總金額',
      index: 'total',
      width: 120,
      type: 'currency',
      currency: { format: { ngCurrency: { display: 'symbol', currencyCode: 'TWD' } } }
    },
    {
      title: '已付金額',
      index: 'paidAmount',
      width: 100,
      type: 'currency'
    },
    {
      title: '到期日',
      index: 'dueDate',
      type: 'date',
      dateFormat: 'yyyy-MM-dd',
      width: 110
    },
    {
      title: '請款方',
      index: 'billingParty.name',
      width: 140
    },
    {
      title: '操作',
      width: 180,
      fixed: 'right',
      buttons: [
        {
          text: '查看',
          click: (item: Invoice) => this.viewInvoice(item)
        },
        {
          text: '送審',
          click: (item: Invoice) => this.submitInvoice(item),
          iif: (item: Invoice) => item.status === 'draft'
        },
        {
          text: '核准',
          click: (item: Invoice) => this.approveInvoice(item),
          iif: (item: Invoice) => item.status === 'submitted' || item.status === 'under_review',
          acl: 'invoice:approve'
        },
        {
          text: '退回',
          click: (item: Invoice) => this.rejectInvoice(item),
          iif: (item: Invoice) => item.status === 'submitted' || item.status === 'under_review',
          acl: 'invoice:approve'
        }
      ]
    }
  ];

  statusOptions = [
    { value: 'draft', label: '草稿' },
    { value: 'submitted', label: '已送審' },
    { value: 'under_review', label: '審核中' },
    { value: 'approved', label: '已核准' },
    { value: 'rejected', label: '退回' },
    { value: 'paid', label: '已付款' }
  ];

  /**
   * 篩選後的請款列表
   */
  filteredInvoices = signal<Invoice[]>([]);

  ngOnInit(): void {
    this.updateFilteredInvoices();
  }

  onFilterChange(): void {
    this.updateFilteredInvoices();
  }

  private updateFilteredInvoices(): void {
    let result = this.invoices();

    if (this.selectedStatus) {
      result = result.filter(inv => inv.status === this.selectedStatus);
    }

    if (this.selectedType) {
      result = result.filter(inv => inv.invoiceType === this.selectedType);
    }

    this.filteredInvoices.set(result);
  }

  onCreateInvoice(): void {
    this.createInvoice.emit();
  }

  viewInvoice(invoice: Invoice): void {
    this.invoiceSelected.emit(invoice);
  }

  submitInvoice(invoice: Invoice): void {
    this.invoiceAction.emit({ action: 'submit', invoice });
  }

  approveInvoice(invoice: Invoice): void {
    this.invoiceAction.emit({ action: 'approve', invoice });
  }

  rejectInvoice(invoice: Invoice): void {
    this.invoiceAction.emit({ action: 'reject', invoice });
  }

  handleTableChange(e: STChange): void {
    // 處理表格變更（排序、分頁等）
    if (e.type === 'click' && e.click?.item) {
      this.viewInvoice(e.click.item as Invoice);
    }
  }
}
