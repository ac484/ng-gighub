/**
 * Contract Lifecycle Service
 *
 * Manages contract lifecycle from creation to completion/termination.
 * Implements SETC-013: Contract Status & Lifecycle Service.
 *
 * @author GigHub Development Team
 * @date 2025-12-15
 */

import { Injectable, inject, signal } from '@angular/core';

import type { Contract, ContractStatus } from '../models';
import { ContractStatusService, ContractHealthCheck, ContractExpiryStatus } from './contract-status.service';
import { ContractRepository } from '../repositories/contract.repository';
import { ContractWorkItemRepository } from '../repositories/work-item.repository';

/**
 * Lifecycle phase information
 */
export interface ContractLifecyclePhase {
  phase: 'creation' | 'activation' | 'execution' | 'completion' | 'closed';
  status: ContractStatus;
  enteredAt: Date;
  description: string;
}

/**
 * Contract progress summary
 */
export interface ContractProgressSummary {
  contractId: string;
  totalWorkItems: number;
  completedWorkItems: number;
  totalAmount: number;
  completedAmount: number;
  progressPercentage: number;
  estimatedCompletionDate?: Date;
}

@Injectable({ providedIn: 'root' })
export class ContractLifecycleService {
  private readonly repository = inject(ContractRepository);
  private readonly workItemRepository = inject(ContractWorkItemRepository);
  private readonly statusService = inject(ContractStatusService);

  // State signals
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Readonly state accessors
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /**
   * Initialize a new contract (set up initial state)
   */
  async initializeContract(blueprintId: string, contractId: string, createdBy: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const contract = await this.repository.findByIdOnce(blueprintId, contractId);
      if (!contract) {
        throw new Error(`Contract ${contractId} not found`);
      }

      if (contract.status !== 'draft') {
        throw new Error('Contract already initialized');
      }

      // Add initial status history
      await this.statusService.addStatusHistory(blueprintId, contractId, {
        id: '',
        contractId,
        previousStatus: 'draft',
        newStatus: 'draft',
        changedBy: createdBy,
        changedAt: new Date(),
        reason: 'Contract created'
      });

      console.log('[ContractLifecycleService]', `Contract ${contractId} initialized`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize contract';
      this._error.set(message);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Activate a contract (draft/pending → active)
   */
  async activateContract(blueprintId: string, contractId: string, activatedBy: string): Promise<Contract> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const contract = await this.repository.findByIdOnce(blueprintId, contractId);
      if (!contract) {
        throw new Error(`Contract ${contractId} not found`);
      }

      // If draft, first submit for activation
      if (contract.status === 'draft') {
        await this.statusService.submitForActivation(blueprintId, contractId, activatedBy);
      }

      // Activate the contract
      const activatedContract = await this.statusService.activate(blueprintId, contractId, activatedBy);

      console.log('[ContractLifecycleService]', `Contract ${contractId} activated`);
      return activatedContract;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to activate contract';
      this._error.set(message);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Complete a contract (active → completed)
   */
  async completeContract(blueprintId: string, contractId: string, completedBy: string): Promise<Contract> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const completedContract = await this.statusService.complete(blueprintId, contractId, completedBy);
      console.log('[ContractLifecycleService]', `Contract ${contractId} completed`);
      return completedContract;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete contract';
      this._error.set(message);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Terminate a contract
   */
  async terminateContract(blueprintId: string, contractId: string, terminatedBy: string, reason: string): Promise<Contract> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const terminatedContract = await this.statusService.terminate(blueprintId, contractId, terminatedBy, reason);
      console.log('[ContractLifecycleService]', `Contract ${contractId} terminated: ${reason}`);
      return terminatedContract;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to terminate contract';
      this._error.set(message);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Check contract health status
   */
  async checkContractHealth(blueprintId: string, contractId: string): Promise<ContractHealthCheck> {
    try {
      const contract = await this.repository.findByIdOnce(blueprintId, contractId);
      if (!contract) {
        return {
          contractId,
          status: 'draft',
          isHealthy: false,
          issues: ['Contract not found']
        };
      }

      const issues: string[] = [];

      // Check expiry
      const expiryStatus = this.checkExpiryStatus(contract);
      if (expiryStatus.isExpired) {
        issues.push('Contract has expired');
      } else if (expiryStatus.isExpiring && expiryStatus.daysUntilExpiry !== null) {
        issues.push(`Contract expires in ${expiryStatus.daysUntilExpiry} days`);
      }

      // Check progress for active contracts
      let progressPercentage: number | undefined;
      if (contract.status === 'active') {
        const progress = await this.calculateProgress(blueprintId, contractId);
        progressPercentage = progress.progressPercentage;

        if (progress.progressPercentage < 50 && expiryStatus.daysUntilExpiry !== null && expiryStatus.daysUntilExpiry < 30) {
          issues.push('Low progress with approaching deadline');
        }
      }

      // Check required fields
      if (!contract.owner || !contract.owner.name) {
        issues.push('Owner information is missing');
      }
      if (!contract.contractor || !contract.contractor.name) {
        issues.push('Contractor information is missing');
      }

      return {
        contractId,
        status: contract.status,
        isHealthy: issues.length === 0,
        issues,
        expiryDays: expiryStatus.daysUntilExpiry ?? undefined,
        progressPercentage
      };
    } catch (err) {
      console.error('[ContractLifecycleService]', 'checkContractHealth failed', err);
      return {
        contractId,
        status: 'draft',
        isHealthy: false,
        issues: ['Failed to check contract health']
      };
    }
  }

  /**
   * Check contract expiry status
   */
  checkExpiryStatus(contract: Contract): ContractExpiryStatus {
    if (!contract.endDate) {
      return {
        contractId: contract.id,
        isExpired: false,
        isExpiring: false,
        daysUntilExpiry: null,
        expiryDate: null
      };
    }

    const now = new Date();
    const endDate = new Date(contract.endDate);
    const timeDiff = endDate.getTime() - now.getTime();
    const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    return {
      contractId: contract.id,
      isExpired: daysUntilExpiry < 0,
      isExpiring: daysUntilExpiry >= 0 && daysUntilExpiry <= 30,
      daysUntilExpiry,
      expiryDate: endDate
    };
  }

  /**
   * Calculate contract progress
   */
  async calculateProgress(blueprintId: string, contractId: string): Promise<ContractProgressSummary> {
    try {
      const contract = await this.repository.findByIdOnce(blueprintId, contractId);
      if (!contract) {
        throw new Error(`Contract ${contractId} not found`);
      }

      const workItems = await this.workItemRepository.findByContract(blueprintId, contractId);

      let totalAmount = 0;
      let completedAmount = 0;
      let completedWorkItems = 0;

      for (const item of workItems) {
        totalAmount += item.totalAmount || 0;
        completedAmount += item.completedAmount || 0;

        if (item.completionPercentage >= 100) {
          completedWorkItems++;
        }
      }

      const progressPercentage = totalAmount > 0 ? Math.round((completedAmount / totalAmount) * 100) : 0;

      return {
        contractId,
        totalWorkItems: workItems.length,
        completedWorkItems,
        totalAmount,
        completedAmount,
        progressPercentage
      };
    } catch (err) {
      console.error('[ContractLifecycleService]', 'calculateProgress failed', err);
      return {
        contractId,
        totalWorkItems: 0,
        completedWorkItems: 0,
        totalAmount: 0,
        completedAmount: 0,
        progressPercentage: 0
      };
    }
  }

  /**
   * Get current lifecycle phase
   */
  getLifecyclePhase(contract: Contract): ContractLifecyclePhase {
    const statusPhaseMap: Record<ContractStatus, ContractLifecyclePhase['phase']> = {
      draft: 'creation',
      pending_activation: 'activation',
      active: 'execution',
      completed: 'closed',
      terminated: 'closed'
    };

    const phaseDescriptions: Record<ContractLifecyclePhase['phase'], string> = {
      creation: '合約建立階段',
      activation: '合約審核階段',
      execution: '合約執行階段',
      completion: '合約完成階段',
      closed: '合約已結案'
    };

    const phase = statusPhaseMap[contract.status];

    return {
      phase,
      status: contract.status,
      enteredAt: contract.updatedAt || contract.createdAt,
      description: phaseDescriptions[phase]
    };
  }

  /**
   * Get next available actions for a contract
   */
  getNextActions(contract: Contract): string[] {
    const actions: string[] = [];

    switch (contract.status) {
      case 'draft':
        actions.push('submit_for_activation', 'edit', 'delete');
        break;
      case 'pending_activation':
        actions.push('activate', 'edit', 'terminate');
        break;
      case 'active':
        actions.push('create_task', 'complete', 'terminate');
        break;
      case 'completed':
        actions.push('view_only');
        break;
      case 'terminated':
        actions.push('view_only');
        break;
    }

    return actions;
  }

  /**
   * Get action labels in Chinese
   */
  getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      submit_for_activation: '提交審核',
      activate: '生效合約',
      complete: '完成合約',
      terminate: '終止合約',
      edit: '編輯',
      delete: '刪除',
      create_task: '建立任務',
      view_only: '僅可查看'
    };
    return labels[action] || action;
  }

  /**
   * Find contracts requiring attention
   */
  async findContractsRequiringAttention(blueprintId: string): Promise<Contract[]> {
    try {
      const contracts = await this.repository.findByBlueprint(blueprintId);
      const contractsNeedingAttention: Contract[] = [];

      for (const contract of contracts) {
        if (contract.status === 'active') {
          const expiryStatus = this.checkExpiryStatus(contract);

          // Contract is expiring soon
          if (expiryStatus.isExpiring || expiryStatus.isExpired) {
            contractsNeedingAttention.push(contract);
            continue;
          }

          // Check health
          const health = await this.checkContractHealth(blueprintId, contract.id);
          if (!health.isHealthy) {
            contractsNeedingAttention.push(contract);
          }
        } else if (contract.status === 'pending_activation') {
          // Pending contracts need activation
          contractsNeedingAttention.push(contract);
        }
      }

      return contractsNeedingAttention;
    } catch (err) {
      console.error('[ContractLifecycleService]', 'findContractsRequiringAttention failed', err);
      return [];
    }
  }
}
