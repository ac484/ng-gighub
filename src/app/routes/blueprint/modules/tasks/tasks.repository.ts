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
  Timestamp
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

  async createTask(payload: { blueprintId: string; title: string; status: TaskStatus }): Promise<Task> {
    const now = new Date();
    const data: TaskDocument = {
      blueprintId: payload.blueprintId,
      title: payload.title,
      status: payload.status,
      createdAt: now
    };
    const docData = data as DocumentData;
    const docRef = await addDoc(this.collectionRef, docData);
    return this.toEntity(docData, docRef.id);
  }

  async deleteTask(taskId: string): Promise<void> {
    const ref = doc(this.firestore, `${this.collectionName}/${taskId}`);
    await deleteDoc(ref);
  }

  private toEntity(data: DocumentData, id: string): Task {
    const docData = data as TaskDocument;
    const createdAtRaw = docData.createdAt;
    const createdAt = createdAtRaw instanceof Timestamp ? createdAtRaw.toDate() : new Date(createdAtRaw);
    return {
      id,
      blueprintId: docData.blueprintId,
      title: docData.title,
      status: docData.status ?? 'pending',
      createdAt
    };
  }
}
