/**
 * Contract Status Service
 *
 * Manages contract status transitions and status history.
 * Implements SETC-013: Contract Status & Lifecycle Service.
 *
 * @author GigHub Development Team
 * @date 2025-12-15
 */

import { Injectable, inject, signal } from '@angular/core';
import { Firestore, collection, getDocs, addDoc, query, orderBy, Timestamp } from '@angular/fire/firestore';

import { CONTRACT_STATUS_TRANSITIONS, CONTRACT_STATUS_LABELS } from '../config';
import type { Contract, ContractStatus, ContractStatusHistory } from '../models';
import { ContractRepository } from '../repositories/contract.repository';

/**
 * Validation result for status transitions
 */
export interface StatusValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Contract health check result
 */
export interface ContractHealthCheck {
  contractId: string;
  status: ContractStatus;
  isHealthy: boolean;
  issues: string[];
  expiryDays?: number;
  progressPercentage?: number;
}

/**
 * Expiry status information
 */
export interface ContractExpiryStatus {
  contractId: string;
  isExpired: boolean;
  isExpiring: boolean;
  daysUntilExpiry: number | null;
  expiryDate: Date | null;
}

@Injectable({ providedIn: 'root' })
export class ContractStatusService {
  private readonly firestore = inject(Firestore);
  private readonly repository = inject(ContractRepository);

  // State signals
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Readonly state accessors
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /**
   * Change contract status with validation
   */
  async changeStatus(
    blueprintId: string,
    contractId: string,
    newStatus: ContractStatus,
    changedBy: string,
    reason?: string
  ): Promise<Contract> {
    this._loading.set(true);
    this._error.set(null);

    try {
      // Get current contract
      const contract = await this.repository.findByIdOnce(blueprintId, contractId);
      if (!contract) {
        throw new Error(`Contract ${contractId} not found`);
      }

      // Validate transition
      const validation = this.validateStatusTransition(contract.status, newStatus);
      if (!validation.isValid) {
        throw new Error(`Invalid status transition: ${validation.errors.join(', ')}`);
      }

      // Record status history
      await this.addStatusHistory(blueprintId, contractId, {
        id: '',
        contractId,
        previousStatus: contract.status,
        newStatus,
        changedBy,
        changedAt: new Date(),
        reason: reason || `Status changed from ${contract.status} to ${newStatus}`
      });

      // Update contract status
      await this.repository.updateStatus(blueprintId, contractId, newStatus);

      // Return updated contract
      const updatedContract = await this.repository.findByIdOnce(blueprintId, contractId);
      if (!updatedContract) {
        throw new Error(`Failed to fetch updated contract ${contractId}`);
      }

      return updatedContract;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change contract status';
      this._error.set(message);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Activate a contract (pending_activation → active)
   */
  async activate(blueprintId: string, contractId: string, changedBy: string): Promise<Contract> {
    // Check if contract can be activated
    const canActivate = await this.canActivateContract(blueprintId, contractId);
    if (!canActivate.isValid) {
      throw new Error(`Cannot activate contract: ${canActivate.errors.join(', ')}`);
    }

    return this.changeStatus(blueprintId, contractId, 'active', changedBy, 'Contract activated');
  }

  /**
   * Submit contract for activation (draft → pending_activation)
   */
  async submitForActivation(blueprintId: string, contractId: string, changedBy: string): Promise<Contract> {
    // Validate contract can be submitted
    const contract = await this.repository.findByIdOnce(blueprintId, contractId);
    if (!contract) {
      throw new Error(`Contract ${contractId} not found`);
    }

    if (contract.status !== 'draft') {
      throw new Error('Only draft contracts can be submitted for activation');
    }

    // Validate required fields
    const validation = await this.canActivateContract(blueprintId, contractId);
    if (!validation.isValid) {
      throw new Error(`Contract not ready for activation: ${validation.errors.join(', ')}`);
    }

    return this.changeStatus(blueprintId, contractId, 'pending_activation', changedBy, 'Contract submitted for activation');
  }

  /**
   * Complete a contract (active → completed)
   */
  async complete(blueprintId: string, contractId: string, changedBy: string): Promise<Contract> {
    // Check if contract can be completed
    const canComplete = await this.canCompleteContract(blueprintId, contractId);
    if (!canComplete.isValid) {
      throw new Error(`Cannot complete contract: ${canComplete.errors.join(', ')}`);
    }

    return this.changeStatus(blueprintId, contractId, 'completed', changedBy, 'Contract completed');
  }

  /**
   * Terminate a contract (any status → terminated)
   */
  async terminate(blueprintId: string, contractId: string, changedBy: string, reason: string): Promise<Contract> {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Termination reason is required');
    }

    const contract = await this.repository.findByIdOnce(blueprintId, contractId);
    if (!contract) {
      throw new Error(`Contract ${contractId} not found`);
    }

    if (contract.status === 'terminated') {
      throw new Error('Contract is already terminated');
    }

    if (contract.status === 'completed') {
      throw new Error('Completed contracts cannot be terminated');
    }

    return this.changeStatus(blueprintId, contractId, 'terminated', changedBy, reason);
  }

  /**
   * Get status history for a contract
   */
  async getStatusHistory(blueprintId: string, contractId: string): Promise<ContractStatusHistory[]> {
    try {
      const historyCollection = collection(this.firestore, 'blueprints', blueprintId, 'contracts', contractId, 'statusHistory');
      const q = query(historyCollection, orderBy('changedAt', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          contractId,
          previousStatus: data['previousStatus'] as ContractStatus,
          newStatus: data['newStatus'] as ContractStatus,
          changedBy: data['changedBy'] as string,
          changedAt: data['changedAt'] instanceof Timestamp ? data['changedAt'].toDate() : new Date(data['changedAt']),
          reason: data['reason'] as string | undefined
        } as ContractStatusHistory;
      });
    } catch (err) {
      console.error('[ContractStatusService]', 'getStatusHistory failed', err);
      throw err;
    }
  }

  /**
   * Add status history record
   */
  async addStatusHistory(blueprintId: string, contractId: string, history: ContractStatusHistory): Promise<string> {
    try {
      const historyCollection = collection(this.firestore, 'blueprints', blueprintId, 'contracts', contractId, 'statusHistory');

      const docData = {
        contractId,
        previousStatus: history.previousStatus,
        newStatus: history.newStatus,
        changedBy: history.changedBy,
        changedAt: history.changedAt,
        reason: history.reason || null
      };

      const docRef = await addDoc(historyCollection, docData);
      return docRef.id;
    } catch (err) {
      console.error('[ContractStatusService]', 'addStatusHistory failed', err);
      throw err;
    }
  }

  /**
   * Validate status transition
   */
  validateStatusTransition(currentStatus: ContractStatus, newStatus: ContractStatus): StatusValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Get allowed transitions for current status
    const allowedTransitions = CONTRACT_STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      const currentLabel = CONTRACT_STATUS_LABELS[currentStatus] || currentStatus;
      const newLabel = CONTRACT_STATUS_LABELS[newStatus] || newStatus;
      errors.push(`Cannot transition from "${currentLabel}" to "${newLabel}"`);
    }

    // Special warnings
    if (newStatus === 'terminated') {
      warnings.push('Contract termination is irreversible');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Check if contract can be activated
   */
  async canActivateContract(blueprintId: string, contractId: string): Promise<StatusValidationResult> {
    const errors: string[] = [];

    try {
      const contract = await this.repository.findByIdOnce(blueprintId, contractId);
      if (!contract) {
        return { isValid: false, errors: ['Contract not found'] };
      }

      // Check current status
      if (contract.status !== 'draft' && contract.status !== 'pending_activation') {
        errors.push(`Contract must be in draft or pending_activation status (current: ${contract.status})`);
      }

      // Check required fields
      if (!contract.title || contract.title.trim().length === 0) {
        errors.push('Contract title is required');
      }

      if (!contract.owner || !contract.owner.name) {
        errors.push('Owner information is required');
      }

      if (!contract.contractor || !contract.contractor.name) {
        errors.push('Contractor information is required');
      }

      if (!contract.totalAmount || contract.totalAmount <= 0) {
        errors.push('Contract amount must be greater than 0');
      }

      if (!contract.startDate) {
        errors.push('Start date is required');
      }

      if (!contract.endDate) {
        errors.push('End date is required');
      }

      if (contract.startDate && contract.endDate && contract.startDate >= contract.endDate) {
        errors.push('End date must be after start date');
      }

      return { isValid: errors.length === 0, errors };
    } catch {
      return { isValid: false, errors: ['Failed to validate contract'] };
    }
  }

  /**
   * Check if contract can be completed
   */
  async canCompleteContract(blueprintId: string, contractId: string): Promise<StatusValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const contract = await this.repository.findByIdOnce(blueprintId, contractId);
      if (!contract) {
        return { isValid: false, errors: ['Contract not found'] };
      }

      // Check current status
      if (contract.status !== 'active') {
        errors.push(`Contract must be in active status to complete (current: ${contract.status})`);
      }

      // Future: Check if all tasks are completed
      // Future: Check if all payments are completed
      // Future: Check if acceptance is complete

      return { isValid: errors.length === 0, errors, warnings };
    } catch {
      return { isValid: false, errors: ['Failed to validate contract'] };
    }
  }

  /**
   * Get status label in Chinese
   */
  getStatusLabel(status: ContractStatus): string {
    return CONTRACT_STATUS_LABELS[status] || status;
  }

  /**
   * Check if status allows task creation
   */
  canCreateTasks(status: ContractStatus): boolean {
    return status === 'active';
  }

  /**
   * Check if status allows editing
   */
  canEdit(status: ContractStatus): boolean {
    return status === 'draft' || status === 'pending_activation';
  }

  /**
   * Check if status allows deletion
   */
  canDelete(status: ContractStatus): boolean {
    return status === 'draft';
  }
}
