/**
 * Contract Management Service
 *
 * Core business logic for contract CRUD operations, validation,
 * and business rule execution.
 *
 * @author GigHub Development Team
 * @date 2025-12-15
 */

import { Injectable, inject, signal } from '@angular/core';
import { LoggerService } from '@core';
import { Observable, firstValueFrom } from 'rxjs';

import type { Contract, ContractFilters, ContractStatistics, ValidationResult, CreateContractDto, UpdateContractDto } from '../models';
import { ContractRepository } from '../repositories/contract.repository';
import { ContractWorkItemRepository } from '../repositories/work-item.repository';

/**
 * Contract progress summary
 */
export interface ContractProgress {
  totalWorkItems: number;
  completedWorkItems: number;
  totalQuantity: number;
  completedQuantity: number;
  totalAmount: number;
  completedAmount: number;
  overallPercentage: number;
}

/**
 * Contract expiry status
 */
export interface ExpiryStatus {
  isExpired: boolean;
  isExpiring: boolean;
  daysUntilExpiry: number;
  expiryDate: Date;
}

@Injectable({ providedIn: 'root' })
export class ContractManagementService {
  private readonly contractRepository = inject(ContractRepository);
  private readonly workItemRepository = inject(ContractWorkItemRepository);
  private readonly logger = inject(LoggerService);

  // Service state signals
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  // Public readonly signals
  loading = this._loading.asReadonly();
  error = this._error.asReadonly();

  /**
   * Create a new contract
   */
  async create(blueprintId: string, data: CreateContractDto): Promise<Contract> {
    try {
      this._loading.set(true);
      this._error.set(null);

      // Validate contract data
      const validation = this.validateContractData(data);
      if (!validation.valid) {
        throw new Error(`Contract validation failed: ${validation.errors.join(', ')}`);
      }

      const contract = await this.contractRepository.create(blueprintId, data);

      this.logger.info('[ContractManagementService]', `Contract created: ${contract.id}`);
      return contract;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create contract';
      this._error.set(message);
      this.logger.error('[ContractManagementService]', 'create failed', error as Error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Get contract by ID
   */
  async getById(blueprintId: string, contractId: string): Promise<Contract | null> {
    try {
      this._loading.set(true);
      return await this.contractRepository.findByIdOnce(blueprintId, contractId);
    } catch (error) {
      this.logger.error('[ContractManagementService]', 'getById failed', error as Error);
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * List contracts for a blueprint
   */
  async list(blueprintId: string, filters?: ContractFilters): Promise<Contract[]> {
    try {
      this._loading.set(true);
      return await firstValueFrom(this.contractRepository.findByBlueprint(blueprintId, filters));
    } catch (error) {
      this.logger.error('[ContractManagementService]', 'list failed', error as Error);
      return [];
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Subscribe to real-time contract updates
   */
  subscribeToContract(blueprintId: string, contractId: string): Observable<Contract | null> {
    return this.contractRepository.subscribeToContract(blueprintId, contractId);
  }

  /**
   * Subscribe to real-time contracts list
   */
  subscribeToContracts(blueprintId: string, filters?: ContractFilters): Observable<Contract[]> {
    return this.contractRepository.subscribeToContracts(blueprintId, filters);
  }

  /**
   * Update a contract
   */
  async update(blueprintId: string, contractId: string, data: UpdateContractDto): Promise<Contract> {
    try {
      this._loading.set(true);
      this._error.set(null);

      // Get current contract
      const current = await this.contractRepository.findByIdOnce(blueprintId, contractId);
      if (!current) {
        throw new Error(`Contract ${contractId} not found`);
      }

      // Validate update is allowed based on status
      const updateValidation = this.validateContractUpdate(current, data);
      if (!updateValidation.valid) {
        throw new Error(`Update not allowed: ${updateValidation.errors.join(', ')}`);
      }

      const updated = await this.contractRepository.update(blueprintId, contractId, data);

      this.logger.info('[ContractManagementService]', `Contract updated: ${contractId}`);
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update contract';
      this._error.set(message);
      this.logger.error('[ContractManagementService]', 'update failed', error as Error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Delete a contract
   */
  async delete(blueprintId: string, contractId: string): Promise<void> {
    try {
      this._loading.set(true);
      this._error.set(null);

      // Get current contract
      const current = await this.contractRepository.findByIdOnce(blueprintId, contractId);
      if (!current) {
        throw new Error(`Contract ${contractId} not found`);
      }

      // Only draft contracts can be deleted
      if (current.status !== 'draft') {
        throw new Error(`Cannot delete contract in status: ${current.status}. Only draft contracts can be deleted.`);
      }

      await this.contractRepository.delete(blueprintId, contractId);

      this.logger.info('[ContractManagementService]', `Contract deleted: ${contractId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete contract';
      this._error.set(message);
      this.logger.error('[ContractManagementService]', 'delete failed', error as Error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Validate if a contract can be used for task creation
   */
  async validateForTaskCreation(blueprintId: string, contractId: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const contract = await this.contractRepository.findByIdOnce(blueprintId, contractId);

      if (!contract) {
        return { valid: false, errors: ['Contract not found'], warnings: [] };
      }

      // Check status
      if (contract.status !== 'active') {
        errors.push(`Contract must be active to create tasks. Current status: ${contract.status}`);
      }

      // Check expiry
      const expiryStatus = this.getExpiryStatus(contract);
      if (expiryStatus.isExpired) {
        errors.push(`Contract has expired on ${expiryStatus.expiryDate.toLocaleDateString()}`);
      } else if (expiryStatus.isExpiring) {
        warnings.push(`Contract will expire in ${expiryStatus.daysUntilExpiry} days`);
      }

      // Check work items
      const workItems = await firstValueFrom(this.workItemRepository.findByContract(blueprintId, contractId));

      if (workItems.length === 0) {
        errors.push('Contract has no work items');
      }

      // Check if any work items have remaining quantity
      const hasRemainingWork = workItems.some(item => item.completedQuantity < item.quantity);
      if (!hasRemainingWork && workItems.length > 0) {
        warnings.push('All work items are fully completed');
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      this.logger.error('[ContractManagementService]', 'validateForTaskCreation failed', error as Error);
      return {
        valid: false,
        errors: ['Failed to validate contract'],
        warnings: []
      };
    }
  }

  /**
   * Calculate contract progress
   */
  async calculateContractProgress(blueprintId: string, contractId: string): Promise<ContractProgress> {
    try {
      const workItems = await firstValueFrom(this.workItemRepository.findByContract(blueprintId, contractId));

      const totalWorkItems = workItems.length;
      const completedWorkItems = workItems.filter(item => item.completionPercentage >= 100).length;

      const totalQuantity = workItems.reduce((sum, item) => sum + item.quantity, 0);
      const completedQuantity = workItems.reduce((sum, item) => sum + item.completedQuantity, 0);

      const totalAmount = workItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const completedAmount = workItems.reduce((sum, item) => sum + item.completedAmount, 0);

      const overallPercentage = totalAmount > 0 ? Math.round((completedAmount / totalAmount) * 100) : 0;

      return {
        totalWorkItems,
        completedWorkItems,
        totalQuantity,
        completedQuantity,
        totalAmount,
        completedAmount,
        overallPercentage
      };
    } catch (error) {
      this.logger.error('[ContractManagementService]', 'calculateContractProgress failed', error as Error);
      return {
        totalWorkItems: 0,
        completedWorkItems: 0,
        totalQuantity: 0,
        completedQuantity: 0,
        totalAmount: 0,
        completedAmount: 0,
        overallPercentage: 0
      };
    }
  }

  /**
   * Check contract expiry status
   */
  checkContractExpiry(contract: Contract): ExpiryStatus {
    return this.getExpiryStatus(contract);
  }

  /**
   * Get expiry status for a contract
   */
  private getExpiryStatus(contract: Contract): ExpiryStatus {
    const now = new Date();
    const endDate = contract.endDate;
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      isExpired: daysUntilExpiry < 0,
      isExpiring: daysUntilExpiry >= 0 && daysUntilExpiry <= 30,
      daysUntilExpiry,
      expiryDate: endDate
    };
  }

  /**
   * Find contract by contract number
   */
  async findByContractNumber(blueprintId: string, contractNumber: string): Promise<Contract | null> {
    try {
      const contracts = await firstValueFrom(this.contractRepository.findByBlueprint(blueprintId));
      return contracts.find(c => c.contractNumber === contractNumber) || null;
    } catch (error) {
      this.logger.error('[ContractManagementService]', 'findByContractNumber failed', error as Error);
      return null;
    }
  }

  /**
   * Find active contracts
   */
  async findActiveContracts(blueprintId: string): Promise<Contract[]> {
    return firstValueFrom(this.contractRepository.findByStatus(blueprintId, 'active'));
  }

  /**
   * Find contracts expiring within specified days
   */
  async findExpiringContracts(blueprintId: string, withinDays: number): Promise<Contract[]> {
    try {
      const activeContracts = await this.findActiveContracts(blueprintId);
      const now = new Date();

      return activeContracts.filter(contract => {
        const daysUntilExpiry = Math.ceil((contract.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry >= 0 && daysUntilExpiry <= withinDays;
      });
    } catch (error) {
      this.logger.error('[ContractManagementService]', 'findExpiringContracts failed', error as Error);
      return [];
    }
  }

  /**
   * Get contract statistics
   */
  async getStatistics(blueprintId: string): Promise<ContractStatistics> {
    try {
      const statusCounts = await this.contractRepository.countByStatus(blueprintId);
      const contracts = await firstValueFrom(this.contractRepository.findByBlueprint(blueprintId));

      const totalValue = contracts.reduce((sum, c) => sum + c.totalAmount, 0);
      const activeContracts = contracts.filter(c => c.status === 'active');
      const activeValue = activeContracts.reduce((sum, c) => sum + c.totalAmount, 0);

      return {
        total: contracts.length,
        draft: statusCounts.draft,
        pendingActivation: statusCounts.pending_activation,
        active: statusCounts.active,
        completed: statusCounts.completed,
        terminated: statusCounts.terminated,
        totalValue,
        activeValue
      };
    } catch (error) {
      this.logger.error('[ContractManagementService]', 'getStatistics failed', error as Error);
      return {
        total: 0,
        draft: 0,
        pendingActivation: 0,
        active: 0,
        completed: 0,
        terminated: 0,
        totalValue: 0,
        activeValue: 0
      };
    }
  }

  /**
   * Validate contract creation data
   */
  private validateContractData(data: CreateContractDto): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!data.title?.trim()) {
      errors.push('Contract title is required');
    }

    if (!data.blueprintId) {
      errors.push('Blueprint ID is required');
    }

    // Owner validation
    if (!data.owner) {
      errors.push('Owner information is required');
    } else {
      if (!data.owner.name?.trim()) {
        errors.push('Owner name is required');
      }
      if (!data.owner.contactPerson?.trim()) {
        errors.push('Owner contact person is required');
      }
      if (!data.owner.contactPhone?.trim()) {
        errors.push('Owner contact phone is required');
      }
      if (!data.owner.contactEmail?.trim()) {
        errors.push('Owner contact email is required');
      }
    }

    // Contractor validation
    if (!data.contractor) {
      errors.push('Contractor information is required');
    } else {
      if (!data.contractor.name?.trim()) {
        errors.push('Contractor name is required');
      }
      if (!data.contractor.contactPerson?.trim()) {
        errors.push('Contractor contact person is required');
      }
      if (!data.contractor.contactPhone?.trim()) {
        errors.push('Contractor contact phone is required');
      }
      if (!data.contractor.contactEmail?.trim()) {
        errors.push('Contractor contact email is required');
      }
    }

    // Amount validation
    if (data.totalAmount <= 0) {
      errors.push('Contract amount must be greater than 0');
    }

    // Date validation
    if (!data.startDate) {
      errors.push('Start date is required');
    }
    if (!data.endDate) {
      errors.push('End date is required');
    }
    if (data.startDate && data.endDate) {
      if (data.startDate >= data.endDate) {
        errors.push('End date must be after start date');
      }

      const durationDays = Math.ceil((data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (durationDays < 1) {
        errors.push('Contract duration must be at least 1 day');
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate contract update based on current status
   */
  private validateContractUpdate(current: Contract, data: UpdateContractDto): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Active/completed/terminated contracts have restrictions
    if (current.status === 'active' || current.status === 'completed' || current.status === 'terminated') {
      // Cannot modify fundamental contract info
      if (data.owner) {
        errors.push('Cannot modify owner for contracts that are active or beyond');
      }
      if (data.contractor) {
        errors.push('Cannot modify contractor for contracts that are active or beyond');
      }
      if (data.totalAmount !== undefined) {
        errors.push('Cannot modify total amount for contracts that are active or beyond');
      }

      // Can only modify description, terms, and files
      const allowedFields = ['title', 'description', 'terms', 'originalFiles', 'parsedData', 'updatedBy'];
      const updateKeys = Object.keys(data).filter(k => data[k as keyof UpdateContractDto] !== undefined);
      const disallowedUpdates = updateKeys.filter(k => !allowedFields.includes(k));

      if (disallowedUpdates.length > 0) {
        warnings.push(`Fields that cannot be modified for active contracts: ${disallowedUpdates.join(', ')}`);
      }
    }

    // Date validation for updates
    if (data.startDate && data.endDate) {
      if (data.startDate >= data.endDate) {
        errors.push('End date must be after start date');
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}
