/**
 * Contract Event Service
 *
 * Handles event emission and subscription for contract-related events.
 * Integrates with the Blueprint Event Bus for cross-module communication.
 * Implements SETC-015: Contract Event Integration.
 *
 * @author GigHub Development Team
 * @date 2025-12-15
 */

import { Injectable, inject, OnDestroy } from '@angular/core';
import { BlueprintEventBus } from '@core/blueprint/events/event-bus';
import type { IBlueprintEvent, EventHandler } from '@core/blueprint/events/event-bus.interface';
import { BlueprintEventType } from '@core/blueprint/events/event-types';

import type { Contract, ContractStatus, ContractWorkItem } from '../models';

/**
 * Contract event payload types
 */
export interface ContractCreatedPayload {
  contract: Contract;
}

export interface ContractUpdatedPayload {
  contract: Contract;
  changes: Partial<Contract>;
}

export interface ContractDeletedPayload {
  blueprintId: string;
  contractId: string;
}

export interface ContractStatusChangedPayload {
  contract: Contract;
  previousStatus: ContractStatus;
  newStatus: ContractStatus;
  reason?: string;
}

export interface ContractFilePayload {
  blueprintId: string;
  contractId: string;
  fileId: string;
  fileName: string;
  fileUrl?: string;
}

export interface WorkItemCreatedPayload {
  blueprintId: string;
  contractId: string;
  workItem: ContractWorkItem;
}

export interface WorkItemUpdatedPayload {
  blueprintId: string;
  contractId: string;
  workItem: ContractWorkItem;
  changes: Partial<ContractWorkItem>;
}

export interface WorkItemDeletedPayload {
  blueprintId: string;
  contractId: string;
  workItemId: string;
}

export interface WorkItemProgressPayload {
  blueprintId: string;
  contractId: string;
  workItem: ContractWorkItem;
  previousProgress: number;
  newProgress: number;
}

export interface WorkItemTaskLinkPayload {
  blueprintId: string;
  contractId: string;
  workItemId: string;
  taskId: string;
}

@Injectable({ providedIn: 'root' })
export class ContractEventService implements OnDestroy {
  private readonly eventBus = inject(BlueprintEventBus);
  private readonly subscriptions: Array<() => void> = [];
  private readonly MODULE_SOURCE = 'contract';

  // ===============================
  // Event Emission - Contract
  // ===============================

  /**
   * Emit contract created event
   */
  emitContractCreated(contract: Contract): void {
    this.emit<ContractCreatedPayload>(BlueprintEventType.CONTRACT_CREATED, { contract }, contract.blueprintId);
  }

  /**
   * Emit contract updated event
   */
  emitContractUpdated(contract: Contract, changes: Partial<Contract>): void {
    this.emit<ContractUpdatedPayload>(BlueprintEventType.CONTRACT_UPDATED, { contract, changes }, contract.blueprintId);
  }

  /**
   * Emit contract deleted event
   */
  emitContractDeleted(blueprintId: string, contractId: string): void {
    this.emit<ContractDeletedPayload>(BlueprintEventType.CONTRACT_DELETED, { blueprintId, contractId }, blueprintId);
  }

  /**
   * Emit contract status changed event
   */
  emitStatusChanged(contract: Contract, previousStatus: ContractStatus, reason?: string): void {
    this.emit<ContractStatusChangedPayload>(
      BlueprintEventType.CONTRACT_STATUS_CHANGED,
      { contract, previousStatus, newStatus: contract.status, reason },
      contract.blueprintId
    );
  }

  /**
   * Emit contract activated event
   */
  emitContractActivated(contract: Contract): void {
    this.emit<ContractCreatedPayload>(BlueprintEventType.CONTRACT_ACTIVATED, { contract }, contract.blueprintId);
  }

  /**
   * Emit contract completed event
   */
  emitContractCompleted(contract: Contract): void {
    this.emit<ContractCreatedPayload>(BlueprintEventType.CONTRACT_COMPLETED, { contract }, contract.blueprintId);
  }

  /**
   * Emit contract terminated event
   */
  emitContractTerminated(contract: Contract, reason?: string): void {
    this.emit<ContractStatusChangedPayload>(
      BlueprintEventType.CONTRACT_TERMINATED,
      { contract, previousStatus: 'active', newStatus: 'terminated', reason },
      contract.blueprintId
    );
  }

  // ===============================
  // Event Emission - Files
  // ===============================

  /**
   * Emit file uploaded event
   */
  emitFileUploaded(blueprintId: string, contractId: string, fileId: string, fileName: string, fileUrl?: string): void {
    this.emit<ContractFilePayload>(
      BlueprintEventType.CONTRACT_FILE_UPLOADED,
      { blueprintId, contractId, fileId, fileName, fileUrl },
      blueprintId
    );
  }

  /**
   * Emit file removed event
   */
  emitFileRemoved(blueprintId: string, contractId: string, fileId: string, fileName: string): void {
    this.emit<ContractFilePayload>(BlueprintEventType.CONTRACT_FILE_REMOVED, { blueprintId, contractId, fileId, fileName }, blueprintId);
  }

  // ===============================
  // Event Emission - Work Items
  // ===============================

  /**
   * Emit work item created event
   */
  emitWorkItemCreated(blueprintId: string, contractId: string, workItem: ContractWorkItem): void {
    this.emit<WorkItemCreatedPayload>(BlueprintEventType.CONTRACT_WORK_ITEM_ADDED, { blueprintId, contractId, workItem }, blueprintId);
  }

  /**
   * Emit work item updated event
   */
  emitWorkItemUpdated(blueprintId: string, contractId: string, workItem: ContractWorkItem, changes: Partial<ContractWorkItem>): void {
    this.emit<WorkItemUpdatedPayload>(
      BlueprintEventType.CONTRACT_WORK_ITEM_UPDATED,
      { blueprintId, contractId, workItem, changes },
      blueprintId
    );
  }

  /**
   * Emit work item deleted event
   */
  emitWorkItemDeleted(blueprintId: string, contractId: string, workItemId: string): void {
    this.emit<WorkItemDeletedPayload>(BlueprintEventType.CONTRACT_WORK_ITEM_DELETED, { blueprintId, contractId, workItemId }, blueprintId);
  }

  /**
   * Emit work item progress updated event
   */
  emitWorkItemProgressUpdated(blueprintId: string, contractId: string, workItem: ContractWorkItem, previousProgress: number): void {
    this.emit<WorkItemProgressPayload>(
      BlueprintEventType.CONTRACT_WORK_ITEM_PROGRESS_UPDATED,
      { blueprintId, contractId, workItem, previousProgress, newProgress: workItem.completionPercentage },
      blueprintId
    );
  }

  /**
   * Emit work item task linked event
   */
  emitWorkItemTaskLinked(blueprintId: string, contractId: string, workItemId: string, taskId: string): void {
    this.emit<WorkItemTaskLinkPayload>(
      BlueprintEventType.CONTRACT_WORK_ITEM_TASK_LINKED,
      { blueprintId, contractId, workItemId, taskId },
      blueprintId
    );
  }

  /**
   * Emit work item task unlinked event
   */
  emitWorkItemTaskUnlinked(blueprintId: string, contractId: string, workItemId: string, taskId: string): void {
    this.emit<WorkItemTaskLinkPayload>(
      BlueprintEventType.CONTRACT_WORK_ITEM_TASK_UNLINKED,
      { blueprintId, contractId, workItemId, taskId },
      blueprintId
    );
  }

  // ===============================
  // Event Subscription
  // ===============================

  /**
   * Subscribe to contract created events
   */
  onContractCreated(handler: EventHandler<ContractCreatedPayload>): () => void {
    return this.subscribe(BlueprintEventType.CONTRACT_CREATED, handler);
  }

  /**
   * Subscribe to contract updated events
   */
  onContractUpdated(handler: EventHandler<ContractUpdatedPayload>): () => void {
    return this.subscribe(BlueprintEventType.CONTRACT_UPDATED, handler);
  }

  /**
   * Subscribe to contract deleted events
   */
  onContractDeleted(handler: EventHandler<ContractDeletedPayload>): () => void {
    return this.subscribe(BlueprintEventType.CONTRACT_DELETED, handler);
  }

  /**
   * Subscribe to contract status changed events
   */
  onStatusChanged(handler: EventHandler<ContractStatusChangedPayload>): () => void {
    return this.subscribe(BlueprintEventType.CONTRACT_STATUS_CHANGED, handler);
  }

  /**
   * Subscribe to contract activated events
   */
  onContractActivated(handler: EventHandler<ContractCreatedPayload>): () => void {
    return this.subscribe(BlueprintEventType.CONTRACT_ACTIVATED, handler);
  }

  /**
   * Subscribe to contract completed events
   */
  onContractCompleted(handler: EventHandler<ContractCreatedPayload>): () => void {
    return this.subscribe(BlueprintEventType.CONTRACT_COMPLETED, handler);
  }

  /**
   * Subscribe to contract terminated events
   */
  onContractTerminated(handler: EventHandler<ContractStatusChangedPayload>): () => void {
    return this.subscribe(BlueprintEventType.CONTRACT_TERMINATED, handler);
  }

  /**
   * Subscribe to work item created events
   */
  onWorkItemCreated(handler: EventHandler<WorkItemCreatedPayload>): () => void {
    return this.subscribe(BlueprintEventType.CONTRACT_WORK_ITEM_ADDED, handler);
  }

  /**
   * Subscribe to work item updated events
   */
  onWorkItemUpdated(handler: EventHandler<WorkItemUpdatedPayload>): () => void {
    return this.subscribe(BlueprintEventType.CONTRACT_WORK_ITEM_UPDATED, handler);
  }

  /**
   * Subscribe to work item deleted events
   */
  onWorkItemDeleted(handler: EventHandler<WorkItemDeletedPayload>): () => void {
    return this.subscribe(BlueprintEventType.CONTRACT_WORK_ITEM_DELETED, handler);
  }

  /**
   * Subscribe to work item progress events
   */
  onWorkItemProgressUpdated(handler: EventHandler<WorkItemProgressPayload>): () => void {
    return this.subscribe(BlueprintEventType.CONTRACT_WORK_ITEM_PROGRESS_UPDATED, handler);
  }

  /**
   * Subscribe to work item task link events
   */
  onWorkItemTaskLinked(handler: EventHandler<WorkItemTaskLinkPayload>): () => void {
    return this.subscribe(BlueprintEventType.CONTRACT_WORK_ITEM_TASK_LINKED, handler);
  }

  /**
   * Subscribe to work item task unlink events
   */
  onWorkItemTaskUnlinked(handler: EventHandler<WorkItemTaskLinkPayload>): () => void {
    return this.subscribe(BlueprintEventType.CONTRACT_WORK_ITEM_TASK_UNLINKED, handler);
  }

  // ===============================
  // Helper Methods
  // ===============================

  /**
   * Emit an event to the event bus
   */
  private emit<T>(type: BlueprintEventType, payload: T, blueprintId: string): void {
    this.eventBus.emit(type, payload, this.MODULE_SOURCE, blueprintId);
  }

  /**
   * Subscribe to an event type
   */
  private subscribe<T>(type: BlueprintEventType, handler: EventHandler<T>): () => void {
    const unsubscribe = this.eventBus.on(type, handler);
    this.subscriptions.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Get contract event history
   */
  getContractEventHistory(limit = 100): IBlueprintEvent[] {
    // Get all contract events from history
    const allHistory = this.eventBus.getHistory(undefined, 1000);
    return allHistory.filter(event => event.type.startsWith('CONTRACT_')).slice(0, limit);
  }

  /**
   * Cleanup on service destruction
   */
  ngOnDestroy(): void {
    // Unsubscribe from all events
    for (const unsubscribe of this.subscriptions) {
      unsubscribe();
    }
    this.subscriptions.length = 0;
  }
}
