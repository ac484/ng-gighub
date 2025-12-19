/**
 * Contract Work Item Repository
 *
 * Provides type-safe data access to the Firestore workItems subcollection.
 * Implements CRUD operations for work items within a contract.
 *
 * Collection path: blueprints/{blueprintId}/contracts/{contractId}/workItems/{workItemId}
 *
 * @author GigHub Development Team
 * @date 2025-12-15
 */

import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  Timestamp,
  collectionData
} from '@angular/fire/firestore';
import { LoggerService } from '@core';
import { Observable, from, map, catchError, of } from 'rxjs';

import type { ContractWorkItem, WorkItemProgress, CreateWorkItemDto, UpdateWorkItemDto } from '../../data/models';

@Injectable({ providedIn: 'root' })
export class ContractWorkItemRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly workItemsSubcollection = 'workItems';

  /**
   * Get workItems subcollection reference for a contract
   */
  private getWorkItemsCollection(blueprintId: string, contractId: string) {
    return collection(this.firestore, 'blueprints', blueprintId, 'contracts', contractId, this.workItemsSubcollection);
  }

  /**
   * Get a single workItem document reference
   */
  private getWorkItemDocRef(blueprintId: string, contractId: string, workItemId: string) {
    return doc(this.firestore, 'blueprints', blueprintId, 'contracts', contractId, this.workItemsSubcollection, workItemId);
  }

  /**
   * Helper to get timestamp in milliseconds from various formats
   */
  private getTimeInMs(timestamp: unknown): number {
    if (!timestamp) return 0;
    if (typeof (timestamp as Timestamp).toMillis === 'function') {
      return (timestamp as Timestamp).toMillis();
    }
    if (timestamp instanceof Date) {
      return timestamp.getTime();
    }
    return 0;
  }

  /**
   * Create a new work item
   */
  async create(blueprintId: string, contractId: string, data: CreateWorkItemDto): Promise<ContractWorkItem> {
    try {
      const now = Timestamp.now();
      const totalPrice = data.quantity * data.unitPrice;

      const docData = {
        contractId,
        code: data.code,
        name: data.name,
        description: data.description,
        category: data.category || null,
        unit: data.unit,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        totalPrice,
        linkedTaskIds: [] as string[],
        completedQuantity: 0,
        completedAmount: 0,
        completionPercentage: 0,
        createdAt: now,
        updatedAt: now
      };

      const workItemsRef = this.getWorkItemsCollection(blueprintId, contractId);
      const docRef = await addDoc(workItemsRef, docData);

      this.logger.info('[ContractWorkItemRepository]', `Work item created: ${docRef.id}`);

      return {
        id: docRef.id,
        contractId,
        code: data.code,
        name: data.name,
        description: data.description,
        category: data.category,
        unit: data.unit,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        totalPrice,
        linkedTaskIds: [],
        completedQuantity: 0,
        completedAmount: 0,
        completionPercentage: 0,
        createdAt: now.toDate(),
        updatedAt: now.toDate()
      };
    } catch (error) {
      this.logger.error('[ContractWorkItemRepository]', 'create failed', error as Error);
      throw new Error(`Failed to create work item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find work item by ID (Promise version)
   */
  async findByIdOnce(blueprintId: string, contractId: string, workItemId: string): Promise<ContractWorkItem | null> {
    try {
      const docRef = this.getWorkItemDocRef(blueprintId, contractId, workItemId);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        return null;
      }

      return this.convertTimestamps(snapshot.data(), snapshot.id);
    } catch (error) {
      this.logger.error('[ContractWorkItemRepository]', 'findByIdOnce failed', error as Error);
      return null;
    }
  }

  /**
   * Find work item by ID (Observable version)
   */
  findById(blueprintId: string, contractId: string, workItemId: string): Observable<ContractWorkItem | null> {
    const docRef = this.getWorkItemDocRef(blueprintId, contractId, workItemId);

    return from(getDoc(docRef)).pipe(
      map(snapshot => {
        if (!snapshot.exists()) return null;
        return this.convertTimestamps(snapshot.data(), snapshot.id);
      }),
      catchError(error => {
        this.logger.error('[ContractWorkItemRepository]', 'findById failed', error as Error);
        return of(null);
      })
    );
  }

  /**
   * Find all work items for a contract
   */
  findByContract(blueprintId: string, contractId: string): Observable<ContractWorkItem[]> {
    const workItemsRef = this.getWorkItemsCollection(blueprintId, contractId);
    const workItemsQuery = query(workItemsRef);

    return from(getDocs(workItemsQuery)).pipe(
      map(snapshot => {
        const workItems = snapshot.docs.map(docSnap => this.convertTimestamps(docSnap.data(), docSnap.id));

        // Sort by code
        workItems.sort((a, b) => a.code.localeCompare(b.code));

        return workItems;
      }),
      catchError(error => {
        this.logger.error('[ContractWorkItemRepository]', 'findByContract failed', error as Error);
        return of([]);
      })
    );
  }

  /**
   * Subscribe to real-time work items updates
   */
  subscribeToWorkItems(blueprintId: string, contractId: string): Observable<ContractWorkItem[]> {
    const workItemsRef = this.getWorkItemsCollection(blueprintId, contractId);

    return collectionData(workItemsRef, { idField: 'id' }).pipe(
      map(docs => {
        const workItems = docs.map(data => this.convertTimestamps(data as Record<string, unknown>, data['id'] as string));

        workItems.sort((a, b) => a.code.localeCompare(b.code));

        return workItems;
      }),
      catchError(error => {
        this.logger.error('[ContractWorkItemRepository]', 'subscribeToWorkItems failed', error as Error);
        return of([]);
      })
    );
  }

  /**
   * Update a work item
   */
  async update(blueprintId: string, contractId: string, workItemId: string, data: UpdateWorkItemDto): Promise<ContractWorkItem> {
    try {
      const docRef = this.getWorkItemDocRef(blueprintId, contractId, workItemId);

      // Calculate new total price if quantity or unit price changed
      const current = await this.findByIdOnce(blueprintId, contractId, workItemId);
      if (!current) {
        throw new Error(`Work item ${workItemId} not found`);
      }

      const quantity = data.quantity ?? current.quantity;
      const unitPrice = data.unitPrice ?? current.unitPrice;
      const totalPrice = quantity * unitPrice;

      const updateData: Record<string, unknown> = {
        ...data,
        totalPrice,
        updatedAt: Timestamp.now()
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      await updateDoc(docRef, updateData);

      const updated = await this.findByIdOnce(blueprintId, contractId, workItemId);
      if (!updated) {
        throw new Error(`Work item ${workItemId} not found after update`);
      }

      this.logger.info('[ContractWorkItemRepository]', `Work item updated: ${workItemId}`);
      return updated;
    } catch (error) {
      this.logger.error('[ContractWorkItemRepository]', 'update failed', error as Error);
      throw new Error(`Failed to update work item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update work item progress
   */
  async updateProgress(blueprintId: string, contractId: string, workItemId: string, progress: WorkItemProgress): Promise<void> {
    try {
      const docRef = this.getWorkItemDocRef(blueprintId, contractId, workItemId);

      // Get current work item to calculate percentage
      const current = await this.findByIdOnce(blueprintId, contractId, workItemId);
      if (!current) {
        throw new Error(`Work item ${workItemId} not found`);
      }

      const completionPercentage = current.quantity > 0 ? Math.round((progress.completedQuantity / current.quantity) * 100) : 0;

      await updateDoc(docRef, {
        completedQuantity: progress.completedQuantity,
        completedAmount: progress.completedAmount,
        completionPercentage: Math.min(completionPercentage, 100),
        updatedAt: Timestamp.now()
      });

      this.logger.info('[ContractWorkItemRepository]', `Work item progress updated: ${workItemId}`);
    } catch (error) {
      this.logger.error('[ContractWorkItemRepository]', 'updateProgress failed', error as Error);
      throw new Error(`Failed to update work item progress: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Link a task to a work item
   */
  async linkTask(blueprintId: string, contractId: string, workItemId: string, taskId: string): Promise<void> {
    try {
      const current = await this.findByIdOnce(blueprintId, contractId, workItemId);
      if (!current) {
        throw new Error(`Work item ${workItemId} not found`);
      }

      const linkedTaskIds = current.linkedTaskIds || [];
      if (!linkedTaskIds.includes(taskId)) {
        linkedTaskIds.push(taskId);

        const docRef = this.getWorkItemDocRef(blueprintId, contractId, workItemId);
        await updateDoc(docRef, {
          linkedTaskIds,
          updatedAt: Timestamp.now()
        });

        this.logger.info('[ContractWorkItemRepository]', `Task ${taskId} linked to work item ${workItemId}`);
      }
    } catch (error) {
      this.logger.error('[ContractWorkItemRepository]', 'linkTask failed', error as Error);
      throw new Error(`Failed to link task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Unlink a task from a work item
   */
  async unlinkTask(blueprintId: string, contractId: string, workItemId: string, taskId: string): Promise<void> {
    try {
      const current = await this.findByIdOnce(blueprintId, contractId, workItemId);
      if (!current) {
        throw new Error(`Work item ${workItemId} not found`);
      }

      const linkedTaskIds = (current.linkedTaskIds || []).filter((id: string) => id !== taskId);

      const docRef = this.getWorkItemDocRef(blueprintId, contractId, workItemId);
      await updateDoc(docRef, {
        linkedTaskIds,
        updatedAt: Timestamp.now()
      });

      this.logger.info('[ContractWorkItemRepository]', `Task ${taskId} unlinked from work item ${workItemId}`);
    } catch (error) {
      this.logger.error('[ContractWorkItemRepository]', 'unlinkTask failed', error as Error);
      throw new Error(`Failed to unlink task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a work item
   */
  async delete(blueprintId: string, contractId: string, workItemId: string): Promise<void> {
    try {
      const docRef = this.getWorkItemDocRef(blueprintId, contractId, workItemId);
      await deleteDoc(docRef);
      this.logger.info('[ContractWorkItemRepository]', `Work item deleted: ${workItemId}`);
    } catch (error) {
      this.logger.error('[ContractWorkItemRepository]', 'delete failed', error as Error);
      throw new Error(`Failed to delete work item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert Firestore Timestamps to JavaScript Dates
   */
  private convertTimestamps(data: Record<string, unknown>, id: string): ContractWorkItem {
    const converted: Record<string, unknown> = { ...data, id };

    if (converted['createdAt'] instanceof Timestamp) {
      converted['createdAt'] = (converted['createdAt'] as Timestamp).toDate();
    }
    if (converted['updatedAt'] instanceof Timestamp) {
      converted['updatedAt'] = (converted['updatedAt'] as Timestamp).toDate();
    }

    // Handle null values for optional fields
    if (converted['category'] === null) {
      delete converted['category'];
    }

    return converted as unknown as ContractWorkItem;
  }
}
