/**
 * Contract Module View Component
 * 合約域視圖元件 - 顯示於藍圖詳情頁面的 Tab 中
 *
 * ✅ Updated: 2025-12-15
 * - 整合 Contract Module 服務
 * - 使用 Angular 20 Signals 管理狀態
 * - 使用 ng-alain ST 元件顯示清單
 * - 提供合約 CRUD 功能
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input, signal, computed, effect } from '@angular/core';
import type { Contract, ContractStatus, ContractStatistics } from '@core/blueprint/modules/implementations/contract/models';
import { ContractCreationService } from '@core/blueprint/modules/implementations/contract/services/contract-creation.service';
import { ContractManagementService } from '@core/blueprint/modules/implementations/contract/services/contract-management.service';
import { STColumn, STChange } from '@delon/abc/st';
import { ModalHelper } from '@delon/theme';
import { SHARED_IMPORTS } from '@shared';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { ContractModalComponent } from './contract-modal.component';

@Component({
  selector: 'app-contract-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzStatisticModule, NzEmptyModule, NzBadgeModule, NzTagModule],
  template: `
    <!-- Statistics Card -->
    <nz-card nzTitle="合約統計" class="mb-md">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="4">
          <nz-statistic [nzValue]="statistics().total" nzTitle="總計" />
        </nz-col>
        <nz-col [nzSpan]="4">
          <nz-statistic [nzValue]="statistics().draft" nzTitle="草稿" [nzPrefix]="draftIcon" />
          <ng-template #draftIcon>
            <span nz-icon nzType="file-text" style="color: #8c8c8c;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="4">
          <nz-statistic [nzValue]="statistics().pendingActivation" nzTitle="待生效" [nzPrefix]="pendingIcon" />
          <ng-template #pendingIcon>
            <span nz-icon nzType="clock-circle" style="color: #1890ff;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="4">
          <nz-statistic [nzValue]="statistics().active" nzTitle="已生效" [nzPrefix]="activeIcon" />
          <ng-template #activeIcon>
            <span nz-icon nzType="check-circle" style="color: #52c41a;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="4">
          <nz-statistic [nzValue]="statistics().completed" nzTitle="已完成" [nzPrefix]="completedIcon" />
          <ng-template #completedIcon>
            <span nz-icon nzType="trophy" style="color: #722ed1;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="4">
          <nz-statistic [nzValue]="statistics().terminated" nzTitle="已終止" [nzPrefix]="terminatedIcon" />
          <ng-template #terminatedIcon>
            <span nz-icon nzType="close-circle" style="color: #ff4d4f;"></span>
          </ng-template>
        </nz-col>
      </nz-row>
    </nz-card>

    <!-- Value Statistics -->
    <nz-card nzTitle="合約金額" class="mb-md">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="12">
          <nz-statistic [nzValue]="statistics().totalValue" nzTitle="合約總金額" nzPrefix="$" [nzValueStyle]="{ color: '#1890ff' }" />
        </nz-col>
        <nz-col [nzSpan]="12">
          <nz-statistic [nzValue]="statistics().activeValue" nzTitle="生效中金額" nzPrefix="$" [nzValueStyle]="{ color: '#52c41a' }" />
        </nz-col>
      </nz-row>
    </nz-card>

    <!-- Action Toolbar -->
    <nz-card class="mb-md">
      <nz-row [nzGutter]="16" nzAlign="middle">
        <nz-col [nzFlex]="'auto'">
          <button nz-button nzType="primary" (click)="createContract()" class="mr-sm">
            <span nz-icon nzType="plus"></span>
            新增合約
          </button>
          <button nz-button (click)="loadContracts()">
            <span nz-icon nzType="reload"></span>
            重新載入
          </button>
        </nz-col>
        <nz-col [nzFlex]="'none'">
          <nz-input-group [nzPrefix]="searchPrefix" style="width: 240px;">
            <input nz-input placeholder="搜尋合約..." [(ngModel)]="searchText" (ngModelChange)="onSearchChange()" />
          </nz-input-group>
          <ng-template #searchPrefix>
            <span nz-icon nzType="search"></span>
          </ng-template>
        </nz-col>
      </nz-row>
    </nz-card>

    <!-- Contracts List -->
    <nz-card nzTitle="合約列表">
      @if (loading()) {
        <nz-spin nzSimple />
      } @else if (filteredContracts().length === 0) {
        <nz-empty nzNotFoundContent="暫無合約記錄">
          <ng-template #nzNotFoundFooter>
            <button nz-button nzType="primary" (click)="createContract()">
              <span nz-icon nzType="plus"></span>
              新增第一份合約
            </button>
          </ng-template>
        </nz-empty>
      } @else {
        <st
          [data]="filteredContracts()"
          [columns]="columns"
          [loading]="loading()"
          [page]="{ front: true, show: true }"
          (change)="handleTableChange($event)"
        />
      }
    </nz-card>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `
  ]
})
export class ContractModuleViewComponent implements OnInit {
  blueprintId = input.required<string>();

  private readonly managementService = inject(ContractManagementService);
  private readonly creationService = inject(ContractCreationService);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);
  private readonly modalHelper = inject(ModalHelper);

  // State signals
  contracts = signal<Contract[]>([]);
  loading = signal(false);
  searchText = '';

  // Filtered contracts based on search
  filteredContracts = computed(() => {
    const list = this.contracts();
    if (!this.searchText.trim()) {
      return list;
    }
    const search = this.searchText.toLowerCase();
    return list.filter(
      c =>
        c.contractNumber.toLowerCase().includes(search) ||
        c.title.toLowerCase().includes(search) ||
        c.owner.name.toLowerCase().includes(search) ||
        c.contractor.name.toLowerCase().includes(search)
    );
  });

  // Computed statistics
  statistics = computed<ContractStatistics>(() => {
    const contractList = this.contracts();
    const activeContracts = contractList.filter(c => c.status === 'active');
    return {
      total: contractList.length,
      draft: contractList.filter(c => c.status === 'draft').length,
      pendingActivation: contractList.filter(c => c.status === 'pending_activation').length,
      active: activeContracts.length,
      completed: contractList.filter(c => c.status === 'completed').length,
      terminated: contractList.filter(c => c.status === 'terminated').length,
      totalValue: contractList.reduce((sum, c) => sum + c.totalAmount, 0),
      activeValue: activeContracts.reduce((sum, c) => sum + c.totalAmount, 0)
    };
  });

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
          click: record => this.viewContract(record as Contract)
        },
        {
          text: '編輯',
          icon: 'edit',
          iif: record => this.canEdit(record as Contract),
          click: record => this.editContract(record as Contract)
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
          click: record => this.deleteContract(record as Contract)
        }
      ]
    }
  ];

  constructor() {
    // Effect to reload contracts when blueprintId changes
    effect(() => {
      const id = this.blueprintId();
      if (id) {
        this.loadContracts();
      }
    });
  }

  ngOnInit(): void {
    // Initial load handled by effect - no action needed
    return;
  }

  /**
   * Load contracts from the service
   */
  async loadContracts(): Promise<void> {
    const blueprintId = this.blueprintId();
    if (!blueprintId) return;

    this.loading.set(true);
    try {
      const contractList = await this.managementService.list(blueprintId);
      this.contracts.set(contractList);
    } catch (error) {
      this.message.error('載入合約列表失敗');
      console.error('[ContractModuleView]', 'loadContracts failed', error);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Handle search text change
   */
  onSearchChange(): void {
    // Trigger recomputation of filteredContracts
    // The computed signal will automatically update
  }

  /**
   * Create a new contract
   */
  createContract(): void {
    this.modalHelper
      .createStatic(ContractModalComponent, { blueprintId: this.blueprintId() }, { size: 'lg', modalOptions: { nzTitle: '新增合約' } })
      .subscribe(result => {
        if (result) {
          this.loadContracts();
        }
      });
  }

  /**
   * View contract details
   */
  viewContract(contract: Contract): void {
    const content = [
      `合約編號: ${this.escapeHtml(contract.contractNumber)}`,
      `合約名稱: ${this.escapeHtml(contract.title)}`,
      `描述: ${this.escapeHtml(contract.description || '無')}`,
      ``,
      `【業主資訊】`,
      `名稱: ${this.escapeHtml(contract.owner.name)}`,
      `聯絡人: ${this.escapeHtml(contract.owner.contactPerson)}`,
      `電話: ${this.escapeHtml(contract.owner.contactPhone)}`,
      ``,
      `【承商資訊】`,
      `名稱: ${this.escapeHtml(contract.contractor.name)}`,
      `聯絡人: ${this.escapeHtml(contract.contractor.contactPerson)}`,
      `電話: ${this.escapeHtml(contract.contractor.contactPhone)}`,
      ``,
      `【合約金額】`,
      `金額: ${contract.currency} ${contract.totalAmount.toLocaleString()}`,
      ``,
      `【合約期間】`,
      `開始日期: ${this.formatDate(contract.startDate)}`,
      `結束日期: ${this.formatDate(contract.endDate)}`,
      `狀態: ${this.getStatusText(contract.status)}`
    ].join('\n');

    this.modal.info({
      nzTitle: `合約詳情: ${this.escapeHtml(contract.contractNumber)}`,
      nzContent: content,
      nzWidth: 600,
      nzOkText: '關閉'
    });
  }

  /**
   * Edit contract
   */
  editContract(contract: Contract): void {
    this.modalHelper
      .createStatic(
        ContractModalComponent,
        { blueprintId: this.blueprintId(), contract },
        { size: 'lg', modalOptions: { nzTitle: `編輯合約: ${contract.contractNumber}` } }
      )
      .subscribe(result => {
        if (result) {
          this.loadContracts();
        }
      });
  }

  /**
   * Delete contract
   */
  async deleteContract(contract: Contract): Promise<void> {
    try {
      await this.managementService.delete(this.blueprintId(), contract.id);
      this.message.success(`合約 ${contract.contractNumber} 已刪除`);
      await this.loadContracts();
    } catch (error) {
      this.message.error('刪除合約失敗');
      console.error('[ContractModuleView]', 'deleteContract failed', error);
    }
  }

  /**
   * Check if contract can be edited
   */
  canEdit(contract: Contract): boolean {
    // Draft and pending_activation contracts can be edited
    return contract.status === 'draft' || contract.status === 'pending_activation';
  }

  /**
   * Check if contract can be deleted
   */
  canDelete(contract: Contract): boolean {
    // Only draft contracts can be deleted
    return contract.status === 'draft';
  }

  /**
   * Handle table change events
   */
  handleTableChange(event: STChange): void {
    if (event.type === 'click') {
      // Handle row click if needed
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Format date for display
   */
  private formatDate(date: Date | undefined): string {
    if (!date) return '未設定';
    return new Date(date).toLocaleDateString('zh-TW');
  }

  /**
   * Get status text in Chinese
   */
  private getStatusText(status: ContractStatus): string {
    const statusMap: Record<ContractStatus, string> = {
      draft: '草稿',
      pending_activation: '待生效',
      active: '已生效',
      completed: '已完成',
      terminated: '已終止'
    };
    return statusMap[status] || status;
  }
}
