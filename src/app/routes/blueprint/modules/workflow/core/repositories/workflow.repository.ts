/**
 * Workflow Repository - Simple workflow instance management
 * Collection path: blueprints/{blueprintId}/workflows/{workflowId}
 *
 * @author GigHub Development Team
 * @date 2025-12-13
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
  where,
  orderBy,
  limit,
  Timestamp,
  CollectionReference,
  QueryConstraint
} from '@angular/fire/firestore';
import { LoggerService } from '@core';
import { Observable, from, map, catchError, of } from 'rxjs';

import { WorkflowInstance, WorkflowStatus, CreateWorkflowData, UpdateWorkflowData, WorkflowQueryOptions } from '../models';

@Injectable({ providedIn: 'root' })
export class WorkflowRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly parentCollection = 'blueprints';
  private readonly subcollectionName = 'workflows';

  private getWorkflowsCollection(blueprintId: string): CollectionReference {
    return collection(this.firestore, this.parentCollection, blueprintId, this.subcollectionName);
  }

  private toWorkflowInstance(data: Record<string, unknown>, id: string): WorkflowInstance {
    return {
      id,
      blueprintId: (data['blueprintId'] as string) || '',
      workflowName: data['workflowName'] as string,
      description: data['description'] as string | undefined,
      status: data['status'] as WorkflowStatus,
      currentStep: Number(data['currentStep']) || 0,
      totalSteps: Number(data['totalSteps']) || 1,
      assigneeId: data['assigneeId'] as string | undefined,
      metadata: (data['metadata'] as Record<string, unknown>) || {},
      createdBy: data['createdBy'] as string,
      createdAt: data['createdAt'] instanceof Timestamp ? (data['createdAt'] as Timestamp).toDate() : (data['createdAt'] as Date),
      updatedAt: data['updatedAt'] instanceof Timestamp ? (data['updatedAt'] as Timestamp).toDate() : (data['updatedAt'] as Date)
    };
  }

  findByBlueprintId(blueprintId: string, options?: WorkflowQueryOptions): Observable<WorkflowInstance[]> {
    const constraints: QueryConstraint[] = [];

    if (options?.status) constraints.push(where('status', '==', options.status));
    if (options?.assigneeId) constraints.push(where('assigneeId', '==', options.assigneeId));

    constraints.push(orderBy('createdAt', 'desc'));
    if (options?.limit) constraints.push(limit(options.limit));

    const q = query(this.getWorkflowsCollection(blueprintId), ...constraints);
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(docSnap => this.toWorkflowInstance(docSnap.data(), docSnap.id))),
      catchError(error => {
        this.logger.error('[WorkflowRepository]', 'findByBlueprintId failed', error as Error);
        return of([]);
      })
    );
  }

  findById(blueprintId: string, workflowId: string): Observable<WorkflowInstance | null> {
    return from(getDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, workflowId))).pipe(
      map(snapshot => (snapshot.exists() ? this.toWorkflowInstance(snapshot.data(), snapshot.id) : null)),
      catchError(error => {
        this.logger.error('[WorkflowRepository]', 'findById failed', error as Error);
        return of(null);
      })
    );
  }

  async create(blueprintId: string, data: CreateWorkflowData): Promise<WorkflowInstance> {
    const now = Timestamp.now();
    const docData = {
      blueprintId,
      workflowName: data.workflowName,
      description: data.description || '',
      status: WorkflowStatus.PENDING,
      currentStep: 0,
      totalSteps: data.totalSteps,
      assigneeId: data.assigneeId || null,
      metadata: {},
      createdBy: data.createdBy,
      createdAt: now,
      updatedAt: now
    };

    try {
      const docRef = await addDoc(this.getWorkflowsCollection(blueprintId), docData);
      const snapshot = await getDoc(docRef);
      return snapshot.exists() ? this.toWorkflowInstance(snapshot.data(), snapshot.id) : this.toWorkflowInstance(docData, docRef.id);
    } catch (error) {
      this.logger.error('[WorkflowRepository]', 'create failed', error as Error);
      throw error;
    }
  }

  async update(blueprintId: string, workflowId: string, data: UpdateWorkflowData): Promise<void> {
    const docData: Record<string, unknown> = { ...data, updatedAt: Timestamp.now() };

    try {
      await updateDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, workflowId), docData);
    } catch (error) {
      this.logger.error('[WorkflowRepository]', 'update failed', error as Error);
      throw error;
    }
  }

  async delete(blueprintId: string, workflowId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, workflowId));
    } catch (error) {
      this.logger.error('[WorkflowRepository]', 'delete failed', error as Error);
      throw error;
    }
  }

  /**
   * @deprecated Use findByBlueprintId() instead. This method exists for backward compatibility with stub services.
   */
  async findAll(): Promise<unknown[]> {
    this.logger.warn('[WorkflowRepository]', 'findAll() is deprecated. Use findByBlueprintId() instead.');
    return [];
  }
}
