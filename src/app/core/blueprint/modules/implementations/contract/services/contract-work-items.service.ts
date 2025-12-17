/**
 * Contract Work Items Service
 *
 * Manages contract work items including CRUD, progress tracking,
 * task linking, and statistics.
 * Implements SETC-014: Contract Work Items Management.
 *
 * @author GigHub Development Team
 * @date 2025-12-15
 */

import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type { ContractWorkItem } from '../models';
import type { CreateWorkItemDto, UpdateWorkItemDto } from '../models/dtos';
import { ContractRepository } from '../repositories/contract.repository';
import { ContractWorkItemRepository } from '../repositories/work-item.repository';

/**
 * Work item progress information
 */
export interface WorkItemProgress {
  completedQuantity: number;
  totalQuantity: number;
  completedAmount: number;
  totalAmount: number;
  completionPercentage: number;
}

/**
 * Work item statistics
 */
export interface WorkItemStatistics {
  totalItems: number;
  totalAmount: number;
  completedAmount: number;
  pendingAmount: number;
  completionPercentage: number;
  itemsByCategory: Record<string, number>;
}

/**
 * Validation result
 */
export interface WorkItemValidationResult {
  isValid: boolean;
  errors: string[];
}

@Injectable({ providedIn: 'root' })
export class ContractWorkItemsService {
  private readonly contractRepository = inject(ContractRepository);
  private readonly workItemRepository = inject(ContractWorkItemRepository);

  // State signals
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Readonly state accessors
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // ===============================
  // CRUD Operations
  // ===============================

  /**
   * Create a new work item
   */
  async create(blueprintId: string, contractId: string, data: CreateWorkItemDto): Promise<ContractWorkItem> {
    this._loading.set(true);
    this._error.set(null);

    try {
      // Validate data
      const validation = this.validateWorkItemData(data);
      if (!validation.isValid) {
        throw new Error(`Invalid work item data: ${validation.errors.join(', ')}`);
      }

      // Check contract exists
      const contract = await this.contractRepository.findByIdOnce(blueprintId, contractId);
      if (!contract) {
        throw new Error(`Contract ${contractId} not found`);
      }

      // Only allow adding work items to draft or pending_activation contracts
      if (contract.status !== 'draft' && contract.status !== 'pending_activation') {
        throw new Error('Cannot add work items to active, completed, or terminated contracts');
      }

      // Create work item (repository.create returns ContractWorkItem directly)
      const workItem = await this.workItemRepository.create(blueprintId, contractId, data);

      return workItem;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create work item';
      this._error.set(message);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Get work item by ID
   */
  async getById(blueprintId: string, contractId: string, workItemId: string): Promise<ContractWorkItem | null> {
    try {
      return await this.workItemRepository.findByIdOnce(blueprintId, contractId, workItemId);
    } catch (err) {
      console.error('[ContractWorkItemsService]', 'getById failed', err);
      throw err;
    }
  }

  /**
   * List all work items for a contract
   */
  async list(blueprintId: string, contractId: string): Promise<ContractWorkItem[]> {
    this._loading.set(true);
    this._error.set(null);

    try {
      // Convert Observable to Promise
      return await firstValueFrom(this.workItemRepository.findByContract(blueprintId, contractId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to list work items';
      this._error.set(message);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Update a work item
   */
  async update(blueprintId: string, contractId: string, workItemId: string, data: UpdateWorkItemDto): Promise<ContractWorkItem> {
    this._loading.set(true);
    this._error.set(null);

    try {
      // Check contract status
      const contract = await this.contractRepository.findByIdOnce(blueprintId, contractId);
      if (!contract) {
        throw new Error(`Contract ${contractId} not found`);
      }

      // Only allow updates to work items in draft or pending_activation contracts
      // Or progress updates to active contracts
      if (contract.status === 'completed' || contract.status === 'terminated') {
        throw new Error('Cannot update work items in completed or terminated contracts');
      }

      // If active, only allow progress updates
      if (contract.status === 'active') {
        const allowedFields = ['completedQuantity', 'completedAmount', 'completionPercentage'];
        const updateKeys = Object.keys(data);
        const hasNonProgressFields = updateKeys.some(key => !allowedFields.includes(key));

        if (hasNonProgressFields) {
          throw new Error('Active contracts only allow progress updates for work items');
        }
      }

      const workItem = await this.workItemRepository.update(blueprintId, contractId, workItemId, data);

      return workItem;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update work item';
      this._error.set(message);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Delete a work item
   */
  async delete(blueprintId: string, contractId: string, workItemId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      // Check contract status
      const contract = await this.contractRepository.findByIdOnce(blueprintId, contractId);
      if (!contract) {
        throw new Error(`Contract ${contractId} not found`);
      }

      // Only allow deletion from draft contracts
      if (contract.status !== 'draft') {
        throw new Error('Work items can only be deleted from draft contracts');
      }

      // Check if work item has linked tasks
      const workItem = await this.workItemRepository.findByIdOnce(blueprintId, contractId, workItemId);
      if (workItem && workItem.linkedTaskIds && workItem.linkedTaskIds.length > 0) {
        throw new Error('Cannot delete work item with linked tasks');
      }

      await this.workItemRepository.delete(blueprintId, contractId, workItemId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete work item';
      this._error.set(message);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  // ===============================
  // Progress Management
  // ===============================

  /**
   * Update work item progress
   */
  async updateProgress(
    blueprintId: string,
    contractId: string,
    workItemId: string,
    completedQuantity: number,
    completedAmount: number
  ): Promise<ContractWorkItem> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const workItem = await this.workItemRepository.findByIdOnce(blueprintId, contractId, workItemId);
      if (!workItem) {
        throw new Error(`Work item ${workItemId} not found`);
      }

      // Validate progress values
      if (completedQuantity < 0) {
        throw new Error('Completed quantity cannot be negative');
      }
      if (completedQuantity > workItem.quantity) {
        throw new Error('Completed quantity cannot exceed total quantity');
      }
      if (completedAmount < 0) {
        throw new Error('Completed amount cannot be negative');
      }
      if (completedAmount > workItem.totalPrice) {
        throw new Error('Completed amount cannot exceed total amount');
      }

      // Calculate completion percentage
      const completionPercentage = workItem.totalPrice > 0 ? Math.round((completedAmount / workItem.totalPrice) * 100) : 0;

      await this.workItemRepository.updateProgress(blueprintId, contractId, workItemId, {
        completedQuantity,
        completedAmount,
        completionPercentage
      });

      const updatedWorkItem = await this.workItemRepository.findByIdOnce(blueprintId, contractId, workItemId);
      if (!updatedWorkItem) {
        throw new Error('Failed to fetch updated work item');
      }

      return updatedWorkItem;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update work item progress';
      this._error.set(message);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Calculate progress for a work item
   */
  calculateProgress(workItem: ContractWorkItem): WorkItemProgress {
    return {
      completedQuantity: workItem.completedQuantity || 0,
      totalQuantity: workItem.quantity,
      completedAmount: workItem.completedAmount || 0,
      totalAmount: workItem.totalPrice,
      completionPercentage: workItem.completionPercentage || 0
    };
  }

  // ===============================
  // Task Association
  // ===============================

  /**
   * Link a task to a work item
   */
  async linkTask(blueprintId: string, contractId: string, workItemId: string, taskId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      // Validate link
      const validation = await this.validateTaskLink(blueprintId, contractId, workItemId, taskId);
      if (!validation.isValid) {
        throw new Error(`Cannot link task: ${validation.errors.join(', ')}`);
      }

      await this.workItemRepository.linkTask(blueprintId, contractId, workItemId, taskId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to link task';
      this._error.set(message);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Unlink a task from a work item
   */
  async unlinkTask(blueprintId: string, contractId: string, workItemId: string, taskId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await this.workItemRepository.unlinkTask(blueprintId, contractId, workItemId, taskId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unlink task';
      this._error.set(message);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Get linked task IDs for a work item
   */
  async getLinkedTasks(blueprintId: string, contractId: string, workItemId: string): Promise<string[]> {
    try {
      const workItem = await this.workItemRepository.findByIdOnce(blueprintId, contractId, workItemId);
      return workItem?.linkedTaskIds || [];
    } catch (err) {
      console.error('[ContractWorkItemsService]', 'getLinkedTasks failed', err);
      return [];
    }
  }

  /**
   * Validate task link
   */
  async validateTaskLink(blueprintId: string, contractId: string, workItemId: string, taskId: string): Promise<WorkItemValidationResult> {
    const errors: string[] = [];

    try {
      // Check work item exists
      const workItem = await this.workItemRepository.findByIdOnce(blueprintId, contractId, workItemId);
      if (!workItem) {
        errors.push('Work item not found');
        return { isValid: false, errors };
      }

      // Check if task already linked
      if (workItem.linkedTaskIds && workItem.linkedTaskIds.includes(taskId)) {
        errors.push('Task is already linked to this work item');
      }

      // Check if work item has remaining quantity/amount
      const remainingQuantity = workItem.quantity - (workItem.completedQuantity || 0);
      if (remainingQuantity <= 0) {
        errors.push('Work item has no remaining quantity');
      }

      // Future: Validate task exists and belongs to same contract
      // This would require injecting TaskRepository

      return { isValid: errors.length === 0, errors };
    } catch {
      return { isValid: false, errors: ['Failed to validate task link'] };
    }
  }

  // ===============================
  // Statistics
  // ===============================

  /**
   * Calculate total amount of work items
   */
  calculateTotalAmount(workItems: ContractWorkItem[]): number {
    return workItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  }

  /**
   * Calculate completed amount of work items
   */
  calculateCompletedAmount(workItems: ContractWorkItem[]): number {
    return workItems.reduce((sum, item) => sum + (item.completedAmount || 0), 0);
  }

  /**
   * Get work item statistics for a contract
   */
  async getWorkItemStatistics(blueprintId: string, contractId: string): Promise<WorkItemStatistics> {
    try {
      // Convert Observable to Promise
      const workItems = await firstValueFrom(this.workItemRepository.findByContract(blueprintId, contractId));

      const totalAmount = this.calculateTotalAmount(workItems);
      const completedAmount = this.calculateCompletedAmount(workItems);

      // Group by category
      const itemsByCategory: Record<string, number> = {};
      for (const item of workItems) {
        const category = item.category || 'uncategorized';
        itemsByCategory[category] = (itemsByCategory[category] || 0) + 1;
      }

      return {
        totalItems: workItems.length,
        totalAmount,
        completedAmount,
        pendingAmount: totalAmount - completedAmount,
        completionPercentage: totalAmount > 0 ? Math.round((completedAmount / totalAmount) * 100) : 0,
        itemsByCategory
      };
    } catch (err) {
      console.error('[ContractWorkItemsService]', 'getWorkItemStatistics failed', err);
      return {
        totalItems: 0,
        totalAmount: 0,
        completedAmount: 0,
        pendingAmount: 0,
        completionPercentage: 0,
        itemsByCategory: {}
      };
    }
  }

  // ===============================
  // Validation
  // ===============================

  /**
   * Validate work item data
   */
  validateWorkItemData(data: CreateWorkItemDto): WorkItemValidationResult {
    const errors: string[] = [];

    // Required fields
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Work item name is required');
    }
    if (data.name && data.name.length > 200) {
      errors.push('Work item name must be less than 200 characters');
    }

    // Quantity validation
    if (data.quantity === undefined || data.quantity <= 0) {
      errors.push('Quantity must be greater than 0');
    }

    // Price validation
    if (data.unitPrice === undefined || data.unitPrice < 0) {
      errors.push('Unit price must be non-negative');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate work items match contract total
   */
  validateWorkItemsTotal(workItems: ContractWorkItem[], contractTotal: number): WorkItemValidationResult {
    const errors: string[] = [];
    const workItemsTotal = this.calculateTotalAmount(workItems);

    if (Math.abs(workItemsTotal - contractTotal) > 0.01) {
      errors.push(`Work items total (${workItemsTotal}) does not match contract total (${contractTotal})`);
    }

    return { isValid: errors.length === 0, errors };
  }
}
