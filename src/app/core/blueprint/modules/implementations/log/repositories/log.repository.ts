/**
 * Log Repository
 *
 * Data access layer for activity log management.
 * Handles all Firestore operations for activity logs within a blueprint.
 *
 * Collection path: blueprints/{blueprintId}/activity_logs/{logId}
 *
 * Following Occam's Razor: Simple repository implementation for activity logging
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

import { ActivityLog, ActivityType, CreateActivityLogData, ActivityLogQueryOptions } from '../models/activity-log.model';

/**
 * Log Repository Service
 *
 * Manages CRUD operations for activity logs within a blueprint.
 * Activity logs are append-only - no updates or deletes.
 */
@Injectable({
  providedIn: 'root'
})
export class LogRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly parentCollection = 'blueprints';
  private readonly subcollectionName = 'activity_logs';

  /**
   * Get activity logs subcollection reference
   */
  private getLogsCollection(blueprintId: string): CollectionReference {
    return collection(this.firestore, this.parentCollection, blueprintId, this.subcollectionName);
  }

  /**
   * Convert Firestore data to ActivityLog entity
   */
  private toActivityLog(data: Record<string, unknown>, id: string): ActivityLog {
    return {
      id,
      blueprintId: (data['blueprintId'] as string) || '',
      userId: data['userId'] as string,
      userName: data['userName'] as string,
      action: data['action'] as string,
      actionType: data['actionType'] as ActivityType,
      resourceType: data['resourceType'] as string,
      resourceId: data['resourceId'] as string,
      description: data['description'] as string,
      metadata: (data['metadata'] as Record<string, unknown>) || {},
      ipAddress: data['ipAddress'] as string | undefined,
      userAgent: data['userAgent'] as string | undefined,
      timestamp: data['timestamp'] instanceof Timestamp ? (data['timestamp'] as Timestamp).toDate() : (data['timestamp'] as Date),
      createdAt: data['createdAt'] instanceof Timestamp ? (data['createdAt'] as Timestamp).toDate() : (data['createdAt'] as Date)
    };
  }

  /**
   * Find all activity logs for a blueprint
   */
  findByBlueprintId(blueprintId: string, options?: ActivityLogQueryOptions): Observable<ActivityLog[]> {
    const constraints: QueryConstraint[] = [];

    if (options?.userId) {
      constraints.push(where('userId', '==', options.userId));
    }

    if (options?.actionType) {
      if (Array.isArray(options.actionType)) {
        constraints.push(where('actionType', 'in', options.actionType));
      } else {
        constraints.push(where('actionType', '==', options.actionType));
      }
    }

    if (options?.resourceType) {
      constraints.push(where('resourceType', '==', options.resourceType));
    }

    if (options?.resourceId) {
      constraints.push(where('resourceId', '==', options.resourceId));
    }

    if (options?.startDate) {
      constraints.push(where('timestamp', '>=', Timestamp.fromDate(options.startDate)));
    }

    if (options?.endDate) {
      constraints.push(where('timestamp', '<=', Timestamp.fromDate(options.endDate)));
    }

    constraints.push(orderBy('timestamp', 'desc'));

    if (options?.limit) {
      constraints.push(limit(options.limit));
    }

    const q = query(this.getLogsCollection(blueprintId), ...constraints);

    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(docSnap => this.toActivityLog(docSnap.data(), docSnap.id))),
      catchError(error => {
        this.logger.error('[LogRepository]', 'findByBlueprintId failed', error as Error);
        return of([]);
      })
    );
  }

  /**
   * Find activity log by ID
   */
  findById(blueprintId: string, logId: string): Observable<ActivityLog | null> {
    return from(getDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, logId))).pipe(
      map(snapshot => (snapshot.exists() ? this.toActivityLog(snapshot.data(), snapshot.id) : null)),
      catchError(error => {
        this.logger.error('[LogRepository]', 'findById failed', error as Error);
        return of(null);
      })
    );
  }

  /**
   * Create a new activity log
   * Activity logs are append-only
   */
  async create(blueprintId: string, data: CreateActivityLogData): Promise<ActivityLog> {
    const now = Timestamp.now();
    const docData = {
      blueprintId,
      userId: data.userId,
      userName: data.userName,
      action: data.action,
      actionType: data.actionType,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      description: data.description,
      metadata: data.metadata || {},
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      timestamp: now,
      createdAt: now
    };

    try {
      const docRef = await addDoc(this.getLogsCollection(blueprintId), docData);
      this.logger.info('[LogRepository]', `Activity log created: ${docRef.id}`);

      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return this.toActivityLog(snapshot.data(), snapshot.id);
      }

      return this.toActivityLog(docData, docRef.id);
    } catch (error) {
      this.logger.error('[LogRepository]', 'create failed', error as Error);
      throw error;
    }
  }

  /**
   * Get activity log count by action type
   */
  async getCountByActionType(blueprintId: string): Promise<Record<string, number>> {
    try {
      const snapshot = await getDocs(this.getLogsCollection(blueprintId));
      const counts: Record<string, number> = {};

      Object.values(ActivityType).forEach(type => {
        counts[type] = 0;
      });

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const actionType = data['actionType'] as string;
        if (actionType) {
          counts[actionType] = (counts[actionType] || 0) + 1;
        }
      });

      return counts;
    } catch (error) {
      this.logger.error('[LogRepository]', 'getCountByActionType failed', error as Error);
      throw error;
    }
  }

  /**
   * Get recent activity logs
   */
  findRecent(blueprintId: string, limitCount = 50): Observable<ActivityLog[]> {
    const q = query(this.getLogsCollection(blueprintId), orderBy('timestamp', 'desc'), limit(limitCount));

    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(docSnap => this.toActivityLog(docSnap.data(), docSnap.id))),
      catchError(error => {
        this.logger.error('[LogRepository]', 'findRecent failed', error as Error);
        return of([]);
      })
    );
  }

  /**
   * @deprecated Use findByBlueprintId() instead. This method exists for backward compatibility with stub services.
   */
  async findAll(): Promise<unknown[]> {
    this.logger.warn('[LogRepository]', 'findAll() is deprecated. Use findByBlueprintId() instead.');
    return [];
  }
}
