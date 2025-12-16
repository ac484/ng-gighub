/**
 * Finance Repository - Payment, invoice, and budget tracking
 * Collection path: blueprints/{blueprintId}/finance_records/{recordId}
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

import { FinanceRecord, PaymentStatus, CreateFinanceData, UpdateFinanceData, FinanceQueryOptions } from '../models';

@Injectable({ providedIn: 'root' })
export class FinanceRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly parentCollection = 'blueprints';
  private readonly subcollectionName = 'finance_records';

  private getFinanceCollection(blueprintId: string): CollectionReference {
    return collection(this.firestore, this.parentCollection, blueprintId, this.subcollectionName);
  }

  private toFinanceRecord(data: Record<string, unknown>, id: string): FinanceRecord {
    return {
      id,
      blueprintId: (data['blueprintId'] as string) || '',
      type: data['type'] as FinanceRecord['type'],
      title: data['title'] as string,
      amount: Number(data['amount']) || 0,
      currency: data['currency'] as string,
      status: data['status'] as PaymentStatus,
      dueDate: data['dueDate']
        ? data['dueDate'] instanceof Timestamp
          ? (data['dueDate'] as Timestamp).toDate()
          : (data['dueDate'] as Date)
        : undefined,
      paidDate: data['paidDate']
        ? data['paidDate'] instanceof Timestamp
          ? (data['paidDate'] as Timestamp).toDate()
          : (data['paidDate'] as Date)
        : undefined,
      description: data['description'] as string | undefined,
      attachments: (data['attachments'] as string[]) || undefined,
      metadata: (data['metadata'] as Record<string, unknown>) || {},
      createdBy: data['createdBy'] as string,
      createdAt: data['createdAt'] instanceof Timestamp ? (data['createdAt'] as Timestamp).toDate() : (data['createdAt'] as Date),
      updatedAt: data['updatedAt'] instanceof Timestamp ? (data['updatedAt'] as Timestamp).toDate() : (data['updatedAt'] as Date)
    };
  }

  findByBlueprintId(blueprintId: string, options?: FinanceQueryOptions): Observable<FinanceRecord[]> {
    const constraints: QueryConstraint[] = [];

    if (options?.type) constraints.push(where('type', '==', options.type));
    if (options?.status) constraints.push(where('status', '==', options.status));

    constraints.push(orderBy('createdAt', 'desc'));
    if (options?.limit) constraints.push(limit(options.limit));

    const q = query(this.getFinanceCollection(blueprintId), ...constraints);
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(docSnap => this.toFinanceRecord(docSnap.data(), docSnap.id))),
      catchError(error => {
        this.logger.error('[FinanceRepository]', 'findByBlueprintId failed', error as Error);
        return of([]);
      })
    );
  }

  findById(blueprintId: string, recordId: string): Observable<FinanceRecord | null> {
    return from(getDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, recordId))).pipe(
      map(snapshot => (snapshot.exists() ? this.toFinanceRecord(snapshot.data(), snapshot.id) : null)),
      catchError(error => {
        this.logger.error('[FinanceRepository]', 'findById failed', error as Error);
        return of(null);
      })
    );
  }

  async create(blueprintId: string, data: CreateFinanceData): Promise<FinanceRecord> {
    const now = Timestamp.now();
    const docData = {
      blueprintId,
      type: data.type,
      title: data.title,
      amount: data.amount,
      currency: data.currency || 'TWD',
      status: PaymentStatus.PENDING,
      dueDate: data.dueDate ? Timestamp.fromDate(data.dueDate) : null,
      description: data.description || '',
      attachments: [],
      metadata: {},
      createdBy: data.createdBy,
      createdAt: now,
      updatedAt: now
    };

    try {
      const docRef = await addDoc(this.getFinanceCollection(blueprintId), docData);
      const snapshot = await getDoc(docRef);
      return snapshot.exists() ? this.toFinanceRecord(snapshot.data(), snapshot.id) : this.toFinanceRecord(docData, docRef.id);
    } catch (error) {
      this.logger.error('[FinanceRepository]', 'create failed', error as Error);
      throw error;
    }
  }

  async update(blueprintId: string, recordId: string, data: UpdateFinanceData): Promise<void> {
    const docData: Record<string, unknown> = { ...data, updatedAt: Timestamp.now() };

    if (data.dueDate) docData['dueDate'] = Timestamp.fromDate(data.dueDate);
    if (data.paidDate) docData['paidDate'] = Timestamp.fromDate(data.paidDate);

    try {
      await updateDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, recordId), docData);
    } catch (error) {
      this.logger.error('[FinanceRepository]', 'update failed', error as Error);
      throw error;
    }
  }

  async delete(blueprintId: string, recordId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, recordId));
    } catch (error) {
      this.logger.error('[FinanceRepository]', 'delete failed', error as Error);
      throw error;
    }
  }

  /**
   * @deprecated Use findByBlueprintId() instead. This method exists for backward compatibility with stub services.
   */
  async findAll(): Promise<unknown[]> {
    this.logger.warn('[FinanceRepository]', 'findAll() is deprecated. Use findByBlueprintId() instead.');
    return [];
  }
}
