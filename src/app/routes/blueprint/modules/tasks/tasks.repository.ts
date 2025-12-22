import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  where,
  DocumentData,
  Timestamp,
  updateDoc
} from '@angular/fire/firestore';
import { LoggerService } from '@core/services/logger';

import { Task, TaskDocument, TaskStatus } from './tasks.model';

@Injectable({ providedIn: 'root' })
export class TasksRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly collectionName = 'tasks';
  private readonly collectionRef = collection(this.firestore, this.collectionName);

  async findByBlueprintId(blueprintId: string): Promise<Task[]> {
    try {
      const q = query(this.collectionRef, where('blueprintId', '==', blueprintId), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => this.toEntity(docSnap.data(), docSnap.id));
    } catch (error) {
      this.logger.error('[TasksRepository]', 'Failed to load tasks', error as Error, { blueprintId });
      throw error;
    }
  }

  async createTask(payload: {
    blueprintId: string;
    title: string;
    status: TaskStatus;
    description?: string;
    startAt?: Date | null;
    dueAt?: Date | null;
    parentId?: string | null;
    progress?: number;
  }): Promise<Task> {
    const now = new Date();
    const data: TaskDocument = {
      blueprintId: payload.blueprintId,
      title: payload.title,
      status: payload.status,
      description: payload.description,
      startAt: payload.startAt ?? now,
      dueAt: payload.dueAt ?? null,
      parentId: payload.parentId ?? null,
      progress: payload.progress ?? 0,
      createdAt: now,
      updatedAt: now
    };
    const docData: DocumentData = {
      ...data,
      startAt: data.startAt ? Timestamp.fromDate(data.startAt) : null,
      dueAt: data.dueAt ? Timestamp.fromDate(data.dueAt) : null,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    };
    const docRef = await addDoc(this.collectionRef, docData);
    return this.toEntity(docData, docRef.id);
  }

  async deleteTask(taskId: string): Promise<void> {
    const ref = doc(this.firestore, `${this.collectionName}/${taskId}`);
    await deleteDoc(ref);
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    const ref = doc(this.firestore, `${this.collectionName}/${taskId}`);
    const patch: DocumentData = {};

    if (updates.title !== undefined) patch['title'] = updates.title;
    if (updates.description !== undefined) patch['description'] = updates.description;
    if (updates.status !== undefined) patch['status'] = updates.status;
    if (updates.progress !== undefined) patch['progress'] = updates.progress;
    if (updates.parentId !== undefined) patch['parentId'] = updates.parentId ?? null;
    if (updates.startAt !== undefined) {
      patch['startAt'] = updates.startAt ? Timestamp.fromDate(updates.startAt) : null;
    }
    if (updates.dueAt !== undefined) {
      patch['dueAt'] = updates.dueAt ? Timestamp.fromDate(updates.dueAt) : null;
    }

    patch['updatedAt'] = Timestamp.fromDate(new Date());
    await updateDoc(ref, patch);
  }

  private toEntity(data: DocumentData, id: string): Task {
    const docData = data as TaskDocument;
    // Support legacy snake_case fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawStartAt = (docData as any).start_at ?? docData.startAt;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawDueAt = (docData as any).due_at ?? docData.dueAt;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawParentId = (docData as any).parent_id ?? docData.parentId ?? null;
    const createdAt = this.toDate(docData.createdAt) ?? new Date();
    return {
      id,
      blueprintId: docData.blueprintId,
      title: docData.title,
      status: this.mapStatus(docData.status as string),
      createdAt,
      description: docData.description,
      startAt: this.toDate(rawStartAt),
      dueAt: this.toDate(rawDueAt),
      progress: docData.progress ?? 0,
      parentId: rawParentId,
      updatedAt: this.toDate(docData.updatedAt)
    };
  }

  private mapStatus(status: string | undefined): TaskStatus {
    switch ((status || 'pending').toLowerCase()) {
      case 'in-progress':
      case 'in_progress':
        return 'in-progress';
      case 'completed':
        return 'completed';
      case 'pending':
      default:
        return 'pending';
    }
  }

  private toDate(value?: Date | Timestamp | null): Date | null {
    if (value === null || value === undefined) return null;
    if (value instanceof Timestamp) return value.toDate();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((value as any)?.toDate) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      return (value as any).toDate();
    }
    return new Date(value);
  }
}
