/**
 * Work Item Service - 工項管理服務
 *
 * Business logic layer for contract work item management.
 * Coordinates work items with tasks and handles progress tracking.
 *
 * Responsibilities:
 * - Work item CRUD operations
 * - Progress calculation and updates
 * - Task linking/unlinking
 * - Validation and business rules
 *
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Injectable, inject } from '@angular/core';
import { LoggerService } from '@core';
import { EnhancedEventBusService } from '@core/blueprint/events/enhanced-event-bus.service';
import { SystemEventType } from '@core/blueprint/events/types/system-event-type.enum';
import { firstValueFrom } from 'rxjs';

import type { ContractWorkItem, CreateWorkItemDto, UpdateWorkItemDto, WorkItemProgress } from '../../data/models';
import { ContractWorkItemRepository } from '../../infrastructure/repositories';

/**
 * Work Item Statistics
 */
export interface WorkItemStatistics {
  /** Total work items */
  total: number;
  /** Total quantity */
  totalQuantity: number;
  /** Total price */
  totalPrice: number;
  /** Completed quantity */
  completedQuantity: number;
  /** Completed amount */
  completedAmount: number;
  /** Overall completion percentage */
  completionPercentage: number;
  /** Number of work items with linked tasks */
  withLinkedTasks: number;
}

/**
 * Work Item Service
 *
 * Provides business logic for work item operations.
 * Uses ContractWorkItemRepository for data access.
 */
@Injectable({ providedIn: 'root' })
export class WorkItemService {
  private readonly workItemRepo = inject(ContractWorkItemRepository);
  private readonly eventBus = inject(EnhancedEventBusService);
  private readonly logger = inject(LoggerService);

  // ============================================================================
  // Query Operations
  // ============================================================================

  /**
   * Get all work items for a contract
   */
  async getWorkItemsByContract(blueprintId: string, contractId: string): Promise<ContractWorkItem[]> {
    this.logger.debug('[WorkItemService]', 'getWorkItemsByContract', { blueprintId, contractId });

    try {
      const workItems = await firstValueFrom(this.workItemRepo.findByContract(blueprintId, contractId));
      return workItems || [];
    } catch (error) {
      this.logger.error('[WorkItemService]', 'Failed to get work items', error as Error, { contractId });
      throw error;
    }
  }

  /**
   * Get a single work item by ID
   */
  async getWorkItemById(blueprintId: string, contractId: string, workItemId: string): Promise<ContractWorkItem | null> {
    this.logger.debug('[WorkItemService]', 'getWorkItemById', { blueprintId, contractId, workItemId });

    try {
      return await this.workItemRepo.findByIdOnce(blueprintId, contractId, workItemId);
    } catch (error) {
      this.logger.error('[WorkItemService]', 'Failed to get work item', error as Error, { workItemId });
      throw error;
    }
  }

  /**
   * Get work item statistics for a contract
   */
  async getWorkItemStatistics(blueprintId: string, contractId: string): Promise<WorkItemStatistics> {
    this.logger.debug('[WorkItemService]', 'getWorkItemStatistics', { blueprintId, contractId });

    try {
      const workItems = await this.getWorkItemsByContract(blueprintId, contractId);

      const totalQuantity = workItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = workItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const completedQuantity = workItems.reduce((sum, item) => sum + item.completedQuantity, 0);
      const completedAmount = workItems.reduce((sum, item) => sum + item.completedAmount, 0);
      const withLinkedTasks = workItems.filter(item => item.linkedTaskIds && item.linkedTaskIds.length > 0).length;

      const completionPercentage = totalQuantity > 0 ? Math.round((completedQuantity / totalQuantity) * 100) : 0;

      return {
        total: workItems.length,
        totalQuantity,
        totalPrice,
        completedQuantity,
        completedAmount,
        completionPercentage: Math.min(completionPercentage, 100),
        withLinkedTasks
      };
    } catch (error) {
      this.logger.error('[WorkItemService]', 'Failed to get work item statistics', error as Error, { contractId });
      throw error;
    }
  }

  // ============================================================================
  // Create Operations
  // ============================================================================

  /**
   * Create a new work item
   */
  async createWorkItem(blueprintId: string, contractId: string, dto: CreateWorkItemDto, actorId: string): Promise<ContractWorkItem> {
    this.logger.info('[WorkItemService]', 'Creating work item', { blueprintId, contractId, code: dto.code });

    try {
      // Validate input
      this.validateCreateWorkItem(dto);

      // Check for duplicate code
      const existing = await this.getWorkItemsByContract(blueprintId, contractId);
      const duplicate = existing.find(item => item.code === dto.code);
      if (duplicate) {
        throw new Error(`Work item with code ${dto.code} already exists`);
      }

      // Create work item in repository
      const workItem = await this.workItemRepo.create(blueprintId, contractId, dto);

      // TODO: Emit domain event when EventBus API is updated
      // await this.eventBus.publishSystemEvent({ ... });

      this.logger.info('[WorkItemService]', 'Work item created successfully', {
        workItemId: workItem.id,
        code: workItem.code
      });

      return workItem;
    } catch (error) {
      this.logger.error('[WorkItemService]', 'Failed to create work item', error as Error, { contractId });
      throw error;
    }
  }

  /**
   * Batch create work items
   */
  async createWorkItemsBatch(
    blueprintId: string,
    contractId: string,
    items: CreateWorkItemDto[],
    actorId: string
  ): Promise<ContractWorkItem[]> {
    this.logger.info('[WorkItemService]', 'Batch creating work items', {
      blueprintId,
      contractId,
      count: items.length
    });

    const created: ContractWorkItem[] = [];
    const errors: Array<{ item: CreateWorkItemDto; error: string }> = [];

    for (const item of items) {
      try {
        const workItem = await this.createWorkItem(blueprintId, contractId, item, actorId);
        created.push(workItem);
      } catch (error) {
        this.logger.warn('[WorkItemService]', 'Failed to create work item in batch', {
          code: item.code,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        errors.push({
          item,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    if (errors.length > 0) {
      this.logger.warn('[WorkItemService]', `Batch create completed with ${errors.length} errors`, {
        errors
      });
    }

    this.logger.info('[WorkItemService]', 'Batch create completed', {
      total: items.length,
      created: created.length,
      failed: errors.length
    });

    return created;
  }

  // ============================================================================
  // Update Operations
  // ============================================================================

  /**
   * Update an existing work item
   */
  async updateWorkItem(
    blueprintId: string,
    contractId: string,
    workItemId: string,
    dto: UpdateWorkItemDto,
    actorId: string
  ): Promise<ContractWorkItem> {
    this.logger.info('[WorkItemService]', 'Updating work item', { blueprintId, contractId, workItemId });

    try {
      // Validate input
      this.validateUpdateWorkItem(dto);

      // Get existing work item to verify it exists
      const existing = await this.getWorkItemById(blueprintId, contractId, workItemId);
      if (!existing) {
        throw new Error(`Work item not found: ${workItemId}`);
      }

      // Check for duplicate code if code is being changed
      if (dto.code && dto.code !== existing.code) {
        const allItems = await this.getWorkItemsByContract(blueprintId, contractId);
        const duplicate = allItems.find(item => item.code === dto.code && item.id !== workItemId);
        if (duplicate) {
          throw new Error(`Work item with code ${dto.code} already exists`);
        }
      }

      // Update work item in repository
      const updated = await this.workItemRepo.update(blueprintId, contractId, workItemId, dto);

      // TODO: Emit domain event when EventBus API is updated

      this.logger.info('[WorkItemService]', 'Work item updated successfully', { workItemId });

      return updated;
    } catch (error) {
      this.logger.error('[WorkItemService]', 'Failed to update work item', error as Error, { workItemId });
      throw error;
    }
  }

  /**
   * Update work item progress
   */
  async updateWorkItemProgress(
    blueprintId: string,
    contractId: string,
    workItemId: string,
    progress: WorkItemProgress,
    actorId: string
  ): Promise<void> {
    this.logger.info('[WorkItemService]', 'Updating work item progress', {
      workItemId,
      completedQuantity: progress.completedQuantity
    });

    try {
      // Validate progress
      const workItem = await this.getWorkItemById(blueprintId, contractId, workItemId);
      if (!workItem) {
        throw new Error(`Work item not found: ${workItemId}`);
      }

      if (progress.completedQuantity < 0) {
        throw new Error('Completed quantity cannot be negative');
      }

      if (progress.completedQuantity > workItem.quantity) {
        throw new Error(`Completed quantity (${progress.completedQuantity}) cannot exceed total quantity (${workItem.quantity})`);
      }

      if (progress.completedAmount < 0) {
        throw new Error('Completed amount cannot be negative');
      }

      if (progress.completedAmount > workItem.totalPrice) {
        throw new Error(`Completed amount (${progress.completedAmount}) cannot exceed total price (${workItem.totalPrice})`);
      }

      // Update progress in repository
      await this.workItemRepo.updateProgress(blueprintId, contractId, workItemId, progress);

      // Calculate completion percentage
      const completionPercentage = workItem.quantity > 0 ? Math.round((progress.completedQuantity / workItem.quantity) * 100) : 0;

      // TODO: Emit domain event when EventBus API is updated

      this.logger.info('[WorkItemService]', 'Work item progress updated successfully', {
        workItemId,
        completionPercentage
      });
    } catch (error) {
      this.logger.error('[WorkItemService]', 'Failed to update work item progress', error as Error, { workItemId });
      throw error;
    }
  }

  // ============================================================================
  // Task Linking Operations
  // ============================================================================

  /**
   * Link a task to a work item
   */
  async linkTaskToWorkItem(blueprintId: string, contractId: string, workItemId: string, taskId: string, actorId: string): Promise<void> {
    this.logger.info('[WorkItemService]', 'Linking task to work item', { workItemId, taskId });

    try {
      // Verify work item exists
      const workItem = await this.getWorkItemById(blueprintId, contractId, workItemId);
      if (!workItem) {
        throw new Error(`Work item not found: ${workItemId}`);
      }

      // Check if already linked
      if (workItem.linkedTaskIds && workItem.linkedTaskIds.includes(taskId)) {
        this.logger.warn('[WorkItemService]', 'Task already linked to work item', { workItemId, taskId });
        return;
      }

      // Link task in repository
      await this.workItemRepo.linkTask(blueprintId, contractId, workItemId, taskId);

      // TODO: Emit domain event when EventBus API is updated

      this.logger.info('[WorkItemService]', 'Task linked to work item successfully', { workItemId, taskId });
    } catch (error) {
      this.logger.error('[WorkItemService]', 'Failed to link task to work item', error as Error, {
        workItemId,
        taskId
      });
      throw error;
    }
  }

  /**
   * Unlink a task from a work item
   */
  async unlinkTaskFromWorkItem(
    blueprintId: string,
    contractId: string,
    workItemId: string,
    taskId: string,
    actorId: string
  ): Promise<void> {
    this.logger.info('[WorkItemService]', 'Unlinking task from work item', { workItemId, taskId });

    try {
      // Verify work item exists
      const workItem = await this.getWorkItemById(blueprintId, contractId, workItemId);
      if (!workItem) {
        throw new Error(`Work item not found: ${workItemId}`);
      }

      // Check if task is linked
      if (!workItem.linkedTaskIds || !workItem.linkedTaskIds.includes(taskId)) {
        this.logger.warn('[WorkItemService]', 'Task not linked to work item', { workItemId, taskId });
        return;
      }

      // Unlink task in repository
      await this.workItemRepo.unlinkTask(blueprintId, contractId, workItemId, taskId);

      // TODO: Emit domain event when EventBus API is updated

      this.logger.info('[WorkItemService]', 'Task unlinked from work item successfully', { workItemId, taskId });
    } catch (error) {
      this.logger.error('[WorkItemService]', 'Failed to unlink task from work item', error as Error, {
        workItemId,
        taskId
      });
      throw error;
    }
  }

  // ============================================================================
  // Delete Operations
  // ============================================================================

  /**
   * Delete a work item
   */
  async deleteWorkItem(blueprintId: string, contractId: string, workItemId: string, actorId: string): Promise<void> {
    this.logger.info('[WorkItemService]', 'Deleting work item', { workItemId });

    try {
      // Get work item before deletion for event metadata
      const workItem = await this.getWorkItemById(blueprintId, contractId, workItemId);
      if (!workItem) {
        throw new Error(`Work item not found: ${workItemId}`);
      }

      // Check if work item has linked tasks
      if (workItem.linkedTaskIds && workItem.linkedTaskIds.length > 0) {
        throw new Error(
          `Cannot delete work item with linked tasks. Please unlink all tasks first. ` +
            `Linked tasks: ${workItem.linkedTaskIds.join(', ')}`
        );
      }

      // Check if work item has progress
      if (workItem.completedQuantity > 0 || workItem.completedAmount > 0) {
        throw new Error(
          `Cannot delete work item with progress. Completed quantity: ${workItem.completedQuantity}, ` +
            `Completed amount: ${workItem.completedAmount}`
        );
      }

      // Delete work item
      await this.workItemRepo.delete(blueprintId, contractId, workItemId);

      // TODO: Emit domain event when EventBus API is updated

      this.logger.info('[WorkItemService]', 'Work item deleted successfully', { workItemId });
    } catch (error) {
      this.logger.error('[WorkItemService]', 'Failed to delete work item', error as Error, { workItemId });
      throw error;
    }
  }

  // ============================================================================
  // Validation Methods
  // ============================================================================

  /**
   * Validate work item creation data
   */
  private validateCreateWorkItem(dto: CreateWorkItemDto): void {
    if (!dto.code || dto.code.trim().length === 0) {
      throw new Error('Work item code is required');
    }

    if (dto.code.length > 50) {
      throw new Error('Work item code must be less than 50 characters');
    }

    if (!dto.name || dto.name.trim().length === 0) {
      throw new Error('Work item name is required');
    }

    if (dto.name.length > 200) {
      throw new Error('Work item name must be less than 200 characters');
    }

    if (!dto.unit || dto.unit.trim().length === 0) {
      throw new Error('Work item unit is required');
    }

    if (!dto.quantity || dto.quantity <= 0) {
      throw new Error('Work item quantity must be greater than zero');
    }

    if (!dto.unitPrice || dto.unitPrice <= 0) {
      throw new Error('Work item unit price must be greater than zero');
    }
  }

  /**
   * Validate work item update data
   */
  private validateUpdateWorkItem(dto: UpdateWorkItemDto): void {
    if (dto.code !== undefined && dto.code.trim().length === 0) {
      throw new Error('Work item code cannot be empty');
    }

    if (dto.code !== undefined && dto.code.length > 50) {
      throw new Error('Work item code must be less than 50 characters');
    }

    if (dto.name !== undefined && dto.name.trim().length === 0) {
      throw new Error('Work item name cannot be empty');
    }

    if (dto.name !== undefined && dto.name.length > 200) {
      throw new Error('Work item name must be less than 200 characters');
    }

    if (dto.unit !== undefined && dto.unit.trim().length === 0) {
      throw new Error('Work item unit cannot be empty');
    }

    if (dto.quantity !== undefined && dto.quantity <= 0) {
      throw new Error('Work item quantity must be greater than zero');
    }

    if (dto.unitPrice !== undefined && dto.unitPrice <= 0) {
      throw new Error('Work item unit price must be greater than zero');
    }
  }
}
