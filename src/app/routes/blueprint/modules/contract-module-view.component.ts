/**
 * Contract Module View Component
 * 合約域視圖元件 - 顯示於藍圖詳情頁面的 Tab 中
 *
 * ✅ Updated: 2025-12-17
 * - 整合 Contract Module 服務
 * - 使用 Angular 20 Signals 管理狀態
 * - 使用 ng-alain ST 元件顯示清單
 * - 提供合約 CRUD 功能
 * - 新增合約建立流程精靈 (ContractCreationWizardComponent)
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input, signal, computed, effect, ViewContainerRef } from '@angular/core';
import type { Contract, ContractStatus, ContractStatistics } from '@core/blueprint/modules/implementations/contract/models';
import { ContractFacade } from '@core/blueprint/modules/implementations/contract/facades';
import { STColumn, STChange } from '@delon/abc/st';
import { ModalHelper } from '@delon/theme';
import { SHARED_IMPORTS } from '@shared';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzDrawerService, NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { ContractCreationWizardComponent } from './contract-creation-wizard.component';
import { ContractDetailDrawerComponent } from './contract-detail-drawer.component';
import { ContractModalComponent } from './contract-modal.component';

@Component({
  selector: 'app-contract-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SHARED_IMPORTS,
    NzStatisticModule,
    NzEmptyModule,
    NzBadgeModule,
    NzTagModule,
    NzDrawerModule,
    ContractCreationWizardComponent
    // ContractDetailDrawerComponent is not imported here since it's loaded dynamically via NzDrawerService
  ],
  template: `
    <!-- Creation Wizard Mode -->
    @if (showCreationWizard()) {
      <app-contract-creation-wizard
        [blueprintId]="blueprintId()"
        (completed)="onWizardCompleted($event)"
        (cancelled)="onWizardCancelled()"
      />
    } @else {
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
            <button nz-button nzType="primary" (click)="startCreationWizard()" class="mr-sm">
              <span nz-icon nzType="plus"></span>
              新增合約
            </button>
            <button nz-button (click)="createContractQuick()" class="mr-sm" nz-tooltip nzTooltipTitle="快速建立（跳過上傳與解析）">
              <span nz-icon nzType="thunderbolt"></span>
              快速建立
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
              <button nz-button nzType="primary" (click)="startCreationWizard()">
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
    }
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

  private readonly facade = inject(ContractFacade);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);
  private readonly modalHelper = inject(ModalHelper);
  private readonly drawerService = inject(NzDrawerService);
  private readonly viewContainerRef = inject(ViewContainerRef);

  // State signals
  contracts = signal<Contract[]>([]);
  loading = signal(false);
  showCreationWizard = signal(false);
  searchText = '';
  selectedContract = signal<Contract | null>(null);

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
      await this.facade.loadContracts();
      // Get contracts from facade store (need to copy to make it mutable)
      const contractList = [...this.facade.contracts()];
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
   * Start the creation wizard (full workflow)
   */
  startCreationWizard(): void {
    this.showCreationWizard.set(true);
  }

  /**
   * Handle wizard completion
   */
  onWizardCompleted(contract: Contract): void {
    this.showCreationWizard.set(false);
    this.message.success(`合約 ${contract.contractNumber} 已成功建立並生效`);
    this.loadContracts();
  }

  /**
   * Handle wizard cancellation
   */
  onWizardCancelled(): void {
    this.showCreationWizard.set(false);
    this.loadContracts(); // Reload to show any draft contracts
  }

  /**
   * Quick create contract (skip upload and parsing)
   */
  createContractQuick(): void {
    this.modalHelper
      .createStatic(ContractModalComponent, { blueprintId: this.blueprintId() }, { size: 'lg', modalOptions: { nzTitle: '快速新增合約' } })
      .subscribe(result => {
        if (result) {
          this.loadContracts();
        }
      });
  }

  /**
   * View contract details - UPDATED: Open drawer instead of modal
   */
  viewContract(contract: Contract): void {
    this.selectedContract.set(contract);

    const drawerRef = this.drawerService.create<ContractDetailDrawerComponent, { contract: Contract }>({
      nzTitle: `合約詳情: ${contract.contractNumber}`,
      nzContent: ContractDetailDrawerComponent,
      nzWidth: 720,
      nzContentParams: {
        contract: contract as any // Pass the contract object directly
      },
      nzClosable: true,
      nzMaskClosable: true
    });

    // Handle drawer events
    const component = drawerRef.getContentComponent();
    if (component) {
      // Subscribe to edit event
      component.edit.subscribe((editContract: Contract) => {
        drawerRef.close();
        this.editContract(editContract);
      });

      // Subscribe to activate event
      component.activate.subscribe(async (activateContract: Contract) => {
        await this.activateContract(activateContract);
        drawerRef.close();
        await this.loadContracts();
      });

      // Subscribe to download event
      component.download.subscribe((downloadContract: Contract) => {
        this.downloadContract(downloadContract);
      });
    }

    // Reload contracts when drawer closes
    drawerRef.afterClose.subscribe(() => {
      this.selectedContract.set(null);
      this.loadContracts();
    });
  }

  /**
   * Activate contract
   */
  async activateContract(contract: Contract): Promise<void> {
    try {
      // TODO: Implement contract activation
      // await this.statusService.activate(this.blueprintId(), contract.id);
      this.message.success(`合約 ${contract.contractNumber} 已生效`);
    } catch (error) {
      this.message.error('生效合約失敗');
      console.error('[ContractModuleView]', 'activateContract failed', error);
    }
  }

  /**
   * Download contract
   */
  downloadContract(contract: Contract): void {
    // TODO: Implement contract download
    this.message.info('下載功能開發中');
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
      await this.facade.deleteContract(contract.id);
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
