import { Injectable } from '@angular/core';
import { DocumentData, Timestamp, orderBy, query, where } from '@angular/fire/firestore';

import { FirestoreBaseRepository } from '@core/data-access/repositories/base/firestore-base.repository';
import { TaskPriority, TaskStatus } from '@core/types/task/task.types';
import { TaskWithWBS } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TasksRepository extends FirestoreBaseRepository<TaskWithWBS> {
  protected collectionName = 'tasks';

  async findByBlueprintId(blueprintId: string): Promise<TaskWithWBS[]> {
    return this.executeWithRetry(async () => {
      const q = query(this.collectionRef, where('blueprint_id', '==', blueprintId), orderBy('created_at', 'desc'));
      return this.queryDocuments(q);
    });
  }

  async create(task: Omit<TaskWithWBS, 'id'>): Promise<TaskWithWBS> {
    return this.executeWithRetry(async () => this.createDocument(task));
  }

  async update(id: string, updates: Partial<TaskWithWBS>): Promise<TaskWithWBS> {
    return this.executeWithRetry(async () => this.updateDocument(id, updates));
  }

  async delete(id: string): Promise<void> {
    return this.executeWithRetry(async () => this.deleteDocument(id, false));
  }

  protected toEntity(data: DocumentData, id: string): TaskWithWBS {
    return {
      id,
      blueprintId: data['blueprint_id'] ?? data['blueprintId'] ?? '',
      title: data['title'] ?? '',
      description: data['description'] ?? '',
      status: this.mapStatus(data['status']),
      priority: this.mapPriority(data['priority']),
      assigneeType: data['assignee_type'] ?? data['assigneeType'],
      assigneeId: data['assignee_id'] ?? data['assigneeId'],
      assigneeName: data['assignee_name'] ?? data['assigneeName'],
      assigneeTeamId: data['assignee_team_id'] ?? data['assigneeTeamId'],
      assigneeTeamName: data['assignee_team_name'] ?? data['assigneeTeamName'],
      assigneePartnerId: data['assignee_partner_id'] ?? data['assigneePartnerId'],
      assigneePartnerName: data['assignee_partner_name'] ?? data['assigneePartnerName'],
      creatorId: data['creator_id'] ?? data['creatorId'] ?? '',
      creatorName: data['creator_name'] ?? data['creatorName'],
      dueDate: this.toDate(data['due_date']),
      startDate: this.toDate(data['start_date']),
      completedDate: this.toDate(data['completed_date']),
      estimatedHours: data['estimated_hours'],
      actualHours: data['actual_hours'],
      estimatedBudget: data['estimated_budget'],
      actualBudget: data['actual_budget'],
      progress: data['progress'],
      parentId: data['parent_id'] ?? data['parentId'] ?? null,
      dependencies: (data['dependencies'] as string[]) ?? [],
      tags: data['tags'] ?? [],
      attachments: data['attachments'] ?? [],
      metadata: data['metadata'] ?? {},
      createdAt: this.toDate(data['created_at']) ?? new Date(),
      updatedAt: this.toDate(data['updated_at']) ?? new Date(),
      deletedAt: data['deleted_at'] ? this.toDate(data['deleted_at']) : null,
      level: data['level'],
      orderIndex: data['order_index'],
      wbsCode: data['wbs_code'],
      path: data['path'] ?? [],
      plannedStartDate: this.toDate(data['planned_start_date']),
      plannedEndDate: this.toDate(data['planned_end_date']),
      actualStartDate: this.toDate(data['actual_start_date']),
      actualEndDate: this.toDate(data['actual_end_date']),
      blockedBy: data['blocked_by'] ?? []
    };
  }

  protected override toDocument(entity: Partial<TaskWithWBS>): DocumentData {
    const doc: DocumentData = {};

    if (entity.blueprintId !== undefined) doc['blueprint_id'] = entity.blueprintId;
    if (entity.title !== undefined) doc['title'] = entity.title;
    if (entity.description !== undefined) doc['description'] = entity.description;
    if (entity.status !== undefined) doc['status'] = entity.status.toUpperCase();
    if (entity.priority !== undefined) doc['priority'] = entity.priority.toUpperCase();
    if (entity.assigneeType !== undefined) doc['assignee_type'] = entity.assigneeType;
    if (entity.assigneeId !== undefined) doc['assignee_id'] = entity.assigneeId;
    if (entity.assigneeName !== undefined) doc['assignee_name'] = entity.assigneeName;
    if (entity.assigneeTeamId !== undefined) doc['assignee_team_id'] = entity.assigneeTeamId;
    if (entity.assigneeTeamName !== undefined) doc['assignee_team_name'] = entity.assigneeTeamName;
    if (entity.assigneePartnerId !== undefined) doc['assignee_partner_id'] = entity.assigneePartnerId;
    if (entity.assigneePartnerName !== undefined) doc['assignee_partner_name'] = entity.assigneePartnerName;
    if (entity.creatorId !== undefined) doc['creator_id'] = entity.creatorId;
    if (entity.creatorName !== undefined) doc['creator_name'] = entity.creatorName;
    if (entity.dueDate !== undefined) doc['due_date'] = this.toTimestamp(entity.dueDate);
    if (entity.startDate !== undefined) doc['start_date'] = this.toTimestamp(entity.startDate);
    if (entity.completedDate !== undefined) doc['completed_date'] = this.toTimestamp(entity.completedDate);
    if (entity.estimatedHours !== undefined) doc['estimated_hours'] = entity.estimatedHours;
    if (entity.actualHours !== undefined) doc['actual_hours'] = entity.actualHours;
    if (entity.estimatedBudget !== undefined) doc['estimated_budget'] = entity.estimatedBudget;
    if (entity.actualBudget !== undefined) doc['actual_budget'] = entity.actualBudget;
    if (entity.progress !== undefined) doc['progress'] = entity.progress;
    if (entity.parentId !== undefined) doc['parent_id'] = entity.parentId;
    if (entity.dependencies !== undefined) doc['dependencies'] = entity.dependencies;
    if (entity.tags !== undefined) doc['tags'] = entity.tags;
    if (entity.attachments !== undefined) doc['attachments'] = entity.attachments;
    if (entity.metadata !== undefined) doc['metadata'] = entity.metadata;
    if (entity.createdAt !== undefined) doc['created_at'] = this.toTimestamp(entity.createdAt);
    if (entity.updatedAt !== undefined) doc['updated_at'] = this.toTimestamp(entity.updatedAt);
    if (entity.deletedAt !== undefined) doc['deleted_at'] = this.toTimestamp(entity.deletedAt ?? undefined) ?? null;
    if (entity.level !== undefined) doc['level'] = entity.level;
    if (entity.orderIndex !== undefined) doc['order_index'] = entity.orderIndex;
    if (entity.wbsCode !== undefined) doc['wbs_code'] = entity.wbsCode;
    if (entity.path !== undefined) doc['path'] = entity.path;
    if (entity.plannedStartDate !== undefined) doc['planned_start_date'] = this.toTimestamp(entity.plannedStartDate);
    if (entity.plannedEndDate !== undefined) doc['planned_end_date'] = this.toTimestamp(entity.plannedEndDate);
    if (entity.actualStartDate !== undefined) doc['actual_start_date'] = this.toTimestamp(entity.actualStartDate);
    if (entity.actualEndDate !== undefined) doc['actual_end_date'] = this.toTimestamp(entity.actualEndDate);
    if (entity.blockedBy !== undefined) doc['blocked_by'] = entity.blockedBy;

    return doc;
  }

  private toDate(value: unknown): Date | undefined {
    if (!value) return undefined;
    if (value instanceof Timestamp) return value.toDate();
    if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
      return (value as { toDate: () => Date }).toDate();
    }
    return new Date(value as string);
  }

  private toTimestamp(value: Date | null | undefined): Timestamp | undefined {
    if (value === null || value === undefined) return undefined;
    return value instanceof Date ? Timestamp.fromDate(value) : Timestamp.fromDate(new Date(value));
  }

  private mapStatus(value: string | undefined): TaskStatus {
    const status = (value || '').toUpperCase();
    const map: Record<string, TaskStatus> = {
      PENDING: TaskStatus.PENDING,
      TODO: TaskStatus.PENDING,
      IN_PROGRESS: TaskStatus.IN_PROGRESS,
      IN_REVIEW: TaskStatus.ON_HOLD,
      REVIEW: TaskStatus.ON_HOLD,
      ON_HOLD: TaskStatus.ON_HOLD,
      COMPLETED: TaskStatus.COMPLETED,
      CANCELLED: TaskStatus.CANCELLED
    };

    return map[status] || TaskStatus.PENDING;
  }

  private mapPriority(value: string | undefined): TaskPriority {
    const priority = (value || '').toUpperCase();
    const map: Record<string, TaskPriority> = {
      LOW: TaskPriority.LOW,
      MEDIUM: TaskPriority.MEDIUM,
      HIGH: TaskPriority.HIGH,
      CRITICAL: TaskPriority.CRITICAL
    };

    return map[priority] || TaskPriority.MEDIUM;
  }

}
