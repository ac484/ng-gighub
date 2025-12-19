/**
 * Contract Table Component
 * 合約表格元件 - 顯示合約列表
 *
 * Feature: List
 * Responsibility: Display contracts in table format with actions
 * Interface: Emits events for view/edit/delete actions
 */

import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import type { Contract } from '@core/blueprint/modules/implementations/contract/models';
import { STColumn, STChange } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-contract-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS],
  template: `
    <st
      [data]="contracts()"
      [columns]="columns"
      [loading]="loading()"
      [page]="{ front: true, show: true }"
      (change)="handleTableChange($event)"
    />
  `
})
export class ContractTableComponent {
  // Inputs
  contracts = input.required<Contract[]>();
  loading = input<boolean>(false);

  // Outputs
  readonly viewContract = output<Contract>();
  readonly editContract = output<Contract>();
  readonly deleteContract = output<Contract>();

  // Table columns definition
  columns: STColumn[] = [
    { title: '合約編號', index: 'contractNumber', width: 150 },
    { title: '合約名稱', index: 'title' },
    { title: '業主', index: 'owner.name', width: 150 },
    { title: '承商', index: 'contractor.name', width: 150 },
    {
      title: '金額',
      index: 'totalAmount',
      type: 'currency',
      width: 120,
      currency: { format: { ngCurrency: { display: 'code', currencyCode: 'TWD' } } }
    },
    {
      title: '狀態',
      index: 'status',
      width: 100,
      type: 'badge',
      badge: {
        draft: { text: '草稿', color: 'default' },
        pending_activation: { text: '待生效', color: 'processing' },
        active: { text: '已生效', color: 'success' },
        completed: { text: '已完成', color: 'success' },
        terminated: { text: '已終止', color: 'error' }
      }
    },
    { title: '開始日期', index: 'startDate', type: 'date', width: 120 },
    { title: '結束日期', index: 'endDate', type: 'date', width: 120 },
    {
      title: '操作',
      width: 180,
      buttons: [
        {
          text: '查看',
          icon: 'eye',
          click: record => this.viewContract.emit(record as Contract)
        },
        {
          text: '編輯',
          icon: 'edit',
          iif: record => this.canEdit(record as Contract),
          click: record => this.editContract.emit(record as Contract)
        },
        {
          text: '刪除',
          icon: 'delete',
          type: 'del',
          pop: {
            title: '確定要刪除此合約嗎？',
            okType: 'danger'
          },
          iif: record => this.canDelete(record as Contract),
          click: record => this.deleteContract.emit(record as Contract)
        }
      ]
    }
  ];

  /**
   * Check if contract can be edited
   */
  private canEdit(contract: Contract): boolean {
    return contract.status === 'draft' || contract.status === 'pending_activation';
  }

  /**
   * Check if contract can be deleted
   */
  private canDelete(contract: Contract): boolean {
    return contract.status === 'draft';
  }

  /**
   * Handle table change events
   */
  handleTableChange(event: STChange): void {
    // Future: Add sorting, filtering support
  }
}
