/**
 * Acceptance Repository - Formal acceptance process management
 * Collection path: blueprints/{blueprintId}/acceptance_records/{recordId}
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

import { AcceptanceRecord, AcceptanceStatus, CreateAcceptanceData, UpdateAcceptanceData, AcceptanceQueryOptions } from '../models';

@Injectable({ providedIn: 'root' })
export class AcceptanceRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly parentCollection = 'blueprints';
  private readonly subcollectionName = 'acceptance_records';

  private getAcceptanceCollection(blueprintId: string): CollectionReference {
    return collection(this.firestore, this.parentCollection, blueprintId, this.subcollectionName);
  }

  private toAcceptanceRecord(data: Record<string, unknown>, id: string): AcceptanceRecord {
    return {
      id,
      blueprintId: (data['blueprintId'] as string) || '',
      title: data['title'] as string,
      description: data['description'] as string | undefined,
      status: data['status'] as AcceptanceStatus,
      reviewerId: data['reviewerId'] as string | undefined,
      reviewerName: data['reviewerName'] as string | undefined,
      reviewDate: data['reviewDate']
        ? data['reviewDate'] instanceof Timestamp
          ? (data['reviewDate'] as Timestamp).toDate()
          : (data['reviewDate'] as Date)
        : undefined,
      notes: data['notes'] as string | undefined,
      attachments: (data['attachments'] as string[]) || undefined,
      metadata: (data['metadata'] as Record<string, unknown>) || {},
      createdBy: data['createdBy'] as string,
      createdAt: data['createdAt'] instanceof Timestamp ? (data['createdAt'] as Timestamp).toDate() : (data['createdAt'] as Date),
      updatedAt: data['updatedAt'] instanceof Timestamp ? (data['updatedAt'] as Timestamp).toDate() : (data['updatedAt'] as Date)
    };
  }

  findByBlueprintId(blueprintId: string, options?: AcceptanceQueryOptions): Observable<AcceptanceRecord[]> {
    const constraints: QueryConstraint[] = [];

    if (options?.status) constraints.push(where('status', '==', options.status));
    if (options?.reviewerId) constraints.push(where('reviewerId', '==', options.reviewerId));

    constraints.push(orderBy('createdAt', 'desc'));
    if (options?.limit) constraints.push(limit(options.limit));

    const q = query(this.getAcceptanceCollection(blueprintId), ...constraints);
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(docSnap => this.toAcceptanceRecord(docSnap.data(), docSnap.id))),
      catchError(error => {
        this.logger.error('[AcceptanceRepository]', 'findByBlueprintId failed', error as Error);
        return of([]);
      })
    );
  }

  findById(blueprintId: string, recordId: string): Observable<AcceptanceRecord | null> {
    return from(getDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, recordId))).pipe(
      map(snapshot => (snapshot.exists() ? this.toAcceptanceRecord(snapshot.data(), snapshot.id) : null)),
      catchError(error => {
        this.logger.error('[AcceptanceRepository]', 'findById failed', error as Error);
        return of(null);
      })
    );
  }

  async create(blueprintId: string, data: CreateAcceptanceData): Promise<AcceptanceRecord> {
    const now = Timestamp.now();
    const docData = {
      blueprintId,
      title: data.title,
      description: data.description || '',
      status: AcceptanceStatus.PENDING,
      reviewerId: data.reviewerId || null,
      reviewerName: null,
      notes: null,
      attachments: [],
      metadata: {},
      createdBy: data.createdBy,
      createdAt: now,
      updatedAt: now
    };

    try {
      const docRef = await addDoc(this.getAcceptanceCollection(blueprintId), docData);
      const snapshot = await getDoc(docRef);
      return snapshot.exists() ? this.toAcceptanceRecord(snapshot.data(), snapshot.id) : this.toAcceptanceRecord(docData, docRef.id);
    } catch (error) {
      this.logger.error('[AcceptanceRepository]', 'create failed', error as Error);
      throw error;
    }
  }

  async update(blueprintId: string, recordId: string, data: UpdateAcceptanceData): Promise<void> {
    const docData: Record<string, unknown> = { ...data, updatedAt: Timestamp.now() };

    if (data.reviewDate) docData['reviewDate'] = Timestamp.fromDate(data.reviewDate);

    try {
      await updateDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, recordId), docData);
    } catch (error) {
      this.logger.error('[AcceptanceRepository]', 'update failed', error as Error);
      throw error;
    }
  }

  async delete(blueprintId: string, recordId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, recordId));
    } catch (error) {
      this.logger.error('[AcceptanceRepository]', 'delete failed', error as Error);
      throw error;
    }
  }

  /**
   * @deprecated Use findByBlueprintId() instead. This method exists for backward compatibility with stub services.
   */
  async findAll(): Promise<unknown[]> {
    this.logger.warn('[AcceptanceRepository]', 'findAll() is deprecated. Use findByBlueprintId() instead.');
    return [];
  }
}
