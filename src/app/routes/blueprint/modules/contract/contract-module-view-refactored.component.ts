/**
 * Contract Module View Component (Refactored)
 * 合約域視圖元件 - 顯示於藍圖詳情頁面的 Tab 中
 *
 * 🎯 Architecture: Feature-Based with High Cohesion & Low Coupling
 *
 * Responsibility: Thin orchestrator layer - coordinates features
 * - Manages high-level state (contracts, loading, wizard mode)
 * - Delegates UI rendering to feature components
 * - Handles feature interactions via events
 *
 * Cohesion: High - single responsibility (orchestration)
 * Coupling: Low - features communicate via clear interfaces
 * Extensibility: Easy - add new features without modifying existing ones
 *
 * ✅ Updated: 2025-12-19
 * - Refactored to feature-based architecture
 * - Extracted list, create, detail, edit features
 * - Reduced coupling between components
 * - Improved maintainability and extensibility
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input, signal, computed, effect } from '@angular/core';
import { ContractFacade } from '@core/blueprint/modules/implementations/contract/facades';
import type { Contract, ContractStatistics } from '@core/blueprint/modules/implementations/contract/models';
import { FirebaseService } from '@core/services/firebase.service';
import { ModalHelper } from '@delon/theme';
import { SHARED_IMPORTS } from '@shared';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { NzMessageService } from 'ng-zorro-antd/message';

// Feature imports - each feature is self-contained
import { ContractCreationWizardComponent } from './features/create';
import { ContractDetailDrawerComponent } from './features/detail';
import { ContractEditModalComponent } from './features/edit';
import { ContractListComponent } from './features/list';

@Component({
  selector: 'app-contract-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SHARED_IMPORTS,
    ContractListComponent,
    ContractCreationWizardComponent
    // Detail and Edit features loaded dynamically
  ],
  template: `
    <!-- Creation Wizard Mode -->
    @if (showCreationWizard()) {
      <app-contract-creation-wizard
        [blueprintId]="blueprintId()"
        (contractCreated)="onWizardCompleted($event)"
        (cancelled)="onWizardCancelled()"
      />
    } @else {
      <!-- List Mode -->
      <app-contract-list
        [contracts]="contracts()"
        [statistics]="statistics()"
        [loading]="loading()"
        (create)="startCreationWizard()"
        (quickCreate)="createContractQuick()"
        (reload)="loadContracts()"
        (viewContract)="viewContract($event)"
        (editContract)="editContract($event)"
        (deleteContract)="deleteContract($event)"
      />
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
  private readonly firebase = inject(FirebaseService);
  private readonly message = inject(NzMessageService);
  private readonly modalHelper = inject(ModalHelper);
  private readonly drawerService = inject(NzDrawerService);

  // High-level state
  contracts = signal<Contract[]>([]);
  loading = signal(false);
  showCreationWizard = signal(false);
  private facadeInitialized = signal(false);

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

  constructor() {
    // Effect to initialize facade and reload contracts when blueprintId changes
    effect(() => {
      const id = this.blueprintId();
      const user = this.firebase.currentUser();

      if (id && user) {
        // Initialize facade with blueprintId and userId
        this.facade.initialize(id, user.uid);
        this.facadeInitialized.set(true);
        this.loadContracts();
      }
    });
  }

  ngOnInit(): void {
    // Initial load handled by effect
  }

  /**
   * Load contracts from the service
   */
  async loadContracts(): Promise<void> {
    const blueprintId = this.blueprintId();
    if (!blueprintId || !this.facadeInitialized()) {
      console.warn('[ContractModuleView]', 'Cannot load contracts: facade not initialized');
      return;
    }

    this.loading.set(true);
    try {
      await this.facade.loadContracts();
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
    this.loadContracts();
  }

  /**
   * Quick create contract (skip upload and parsing)
   */
  createContractQuick(): void {
    this.modalHelper
      .createStatic(
        ContractEditModalComponent,
        { blueprintId: this.blueprintId() },
        { size: 'lg', modalOptions: { nzTitle: '快速新增合約' } }
      )
      .subscribe(result => {
        if (result) {
          this.loadContracts();
        }
      });
  }

  /**
   * View contract details - Opens drawer
   */
  viewContract(contract: Contract): void {
    const drawerRef = this.drawerService.create<ContractDetailDrawerComponent, { contract: Contract }>({
      nzTitle: `合約詳情: ${contract.contractNumber}`,
      nzContent: ContractDetailDrawerComponent,
      nzWidth: 720,
      nzContentParams: {
        contract: contract as any
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
      this.loadContracts();
    });
  }

  /**
   * Edit contract
   */
  editContract(contract: Contract): void {
    this.modalHelper
      .createStatic(
        ContractEditModalComponent,
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
   * Activate contract
   */
  private async activateContract(contract: Contract): Promise<void> {
    try {
      // TODO: Implement contract activation
      this.message.success(`合約 ${contract.contractNumber} 已生效`);
    } catch (error) {
      this.message.error('生效合約失敗');
      console.error('[ContractModuleView]', 'activateContract failed', error);
    }
  }

  /**
   * Download contract
   */
  private downloadContract(contract: Contract): void {
    // TODO: Implement contract download
    this.message.info('下載功能開發中');
  }
}
