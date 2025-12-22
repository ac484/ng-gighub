import { Injectable } from '@angular/core';
import { query, where, orderBy, DocumentData, Timestamp } from '@angular/fire/firestore';
import { FirestoreBaseRepository } from '@core/data-access/repositories/base/firestore-base.repository';
import { TaskModel } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TasksRepository extends FirestoreBaseRepository<TaskModel> {
  protected collectionName = 'tasks';

  async findByBlueprintId(blueprintId: string): Promise<TaskModel[]> {
    return this.executeWithRetry(async () => {
      const q = query(
        this.collectionRef,
        where('blueprint_id', '==', blueprintId),
        orderBy('created_at', 'desc')
      );
      return this.queryDocuments(q);
    });
  }

  protected toEntity(data: DocumentData, id: string): TaskModel {
    return {
      id,
      blueprintId: data['blueprint_id'] ?? data['blueprintId'] ?? '',
      title: data['title'] ?? '',
      status: data['status'],
      createdAt: this.toDate(data['created_at']),
      updatedAt: this.toDate(data['updated_at'])
    };
  }

  protected override toDocument(entity: Partial<TaskModel>): DocumentData {
    const doc: DocumentData = {};

    if (entity.blueprintId !== undefined) doc['blueprint_id'] = entity.blueprintId;
    if (entity.title !== undefined) doc['title'] = entity.title;
    if (entity.status !== undefined) doc['status'] = entity.status;
    if (entity.createdAt !== undefined) doc['created_at'] = this.toTimestamp(entity.createdAt);
    if (entity.updatedAt !== undefined) doc['updated_at'] = this.toTimestamp(entity.updatedAt);

    return doc;
  }

  private toDate(value: any): Date | undefined {
    if (!value) return undefined;
    if (value instanceof Timestamp) return value.toDate();
    if (typeof value.toDate === 'function') return value.toDate();
    return new Date(value);
  }

  private toTimestamp(value: Date | undefined): Timestamp | undefined {
    return value ? Timestamp.fromDate(value) : undefined;
  }
}
