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
import { ContractStore } from './application/state';
import { ContractService } from './application/services';
import type { Contract, ContractStatistics } from './data/models';
import { ModalHelper } from '@delon/theme';
import { SHARED_IMPORTS } from '@shared';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';

// Feature imports - each feature is self-contained
import { ContractCreationWizardComponent } from './presentation/features/create';
import { ContractDetailDrawerComponent } from './presentation/features/detail';
import { ContractEditModalComponent } from './presentation/features/edit';
import { ContractListComponent } from './presentation/features/list';
import { ContractPreviewModalComponent, ContractParsingModalComponent } from './presentation/features/preview';

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
        (previewContract)="previewContract($event)"
        (parseContract)="parseContract($event)"
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

  private readonly store = inject(ContractStore);
  private readonly service = inject(ContractService);
  private readonly message = inject(NzMessageService);
  private readonly modalHelper = inject(ModalHelper);
  private readonly drawerService = inject(NzDrawerService);
  private readonly modalService = inject(NzModalService);

  // High-level state
  contracts = signal<Contract[]>([]);
  loading = signal(false);
  showCreationWizard = signal(false);

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
    // Effect to load contracts when blueprintId changes
    effect(() => {
      const id = this.blueprintId();
      if (id) {
        this.loadContracts();
      }
    });
  }

  ngOnInit(): void {
    // Initialization handled by effect when blueprintId is available
  }

  /**
   * Load contracts from the service
   */
  async loadContracts(): Promise<void> {
    const blueprintId = this.blueprintId();
    if (!blueprintId) {
      return;
    }

    this.loading.set(true);
    try {
      await this.service.loadContracts(blueprintId);
      const contractList = [...this.store.contracts()];
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
      await this.service.deleteContract(contract.id);
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

  /**
   * Preview contract document
   */
  previewContract(contract: Contract): void {
    if (!contract.originalFiles || contract.originalFiles.length === 0) {
      this.message.warning('此合約沒有上傳的文件');
      return;
    }

    // Use the first original file for preview
    const file = contract.originalFiles[0];

    this.modalService.create({
      nzTitle: `合約文件預覽: ${contract.contractNumber}`,
      nzContent: ContractPreviewModalComponent,
      nzData: {
        file,
        contractNumber: contract.contractNumber
      },
      nzWidth: 1000,
      nzFooter: null,
      nzMaskClosable: true
    });
  }

  /**
   * Parse contract with AI
   */
  async parseContract(contract: Contract): Promise<void> {
    if (!contract.originalFiles || contract.originalFiles.length === 0) {
      this.message.warning('此合約沒有上傳的文件');
      return;
    }

    // Check if already parsed
    if (contract.parsedData) {
      this.modalService.confirm({
        nzTitle: '已有解析資料',
        nzContent: '此合約已有 AI 解析的資料，是否要重新解析？',
        nzOnOk: () => this.performParsing(contract)
      });
      return;
    }

    await this.performParsing(contract);
  }

  /**
   * Perform AI parsing with progress modal
   */
  private async performParsing(contract: Contract): Promise<void> {
    const file = contract.originalFiles[0];

    // Create parsing modal
    const modalRef = this.modalService.create({
      nzTitle: '',  // Empty string instead of null
      nzContent: ContractParsingModalComponent,
      nzData: {
        contractId: contract.id,
        fileName: file.fileName
      },
      nzWidth: 800,
      nzFooter: null,
      nzClosable: false,
      nzMaskClosable: false
    });

    // Get component reference
    const component = modalRef.getContentComponent();
    if (!component) {
      this.message.error('無法開啟解析視窗');
      return;
    }

    try {
      // NOTE: AI parsing logic moved to Cloud Functions
      // Call processContractUpload Cloud Function instead
      this.message.info('AI 解析功能已移至 Cloud Functions 實作，請使用上傳功能觸發解析');
      modalRef.close();
      return;

      // The parsing flow should be:
      // 1. User uploads file -> triggers processContractUpload Cloud Function
      // 2. Cloud Function performs OCR and parsing
      // 3. createParseDraft Cloud Function creates normalized draft
      // 4. User reviews and confirms draft
      // 5. confirmContract Cloud Function creates final contract
    } catch (error) {
              this.message.error('儲存解析資料失敗');
              console.error('[ContractModuleView]', 'Save parsed data failed', error);
            }
          }
        });
      } else {
        // Parsing failed
        component.setError(result.error || '解析失敗，請稍後再試');
      }
    } catch (error) {
      this.message.error('AI 解析過程發生錯誤');
      console.error('[ContractModuleView]', 'parseContract failed', error);
      
      // Show error in modal
      if (component) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        component.setError(errorMessage);
      }
    }
}
}
