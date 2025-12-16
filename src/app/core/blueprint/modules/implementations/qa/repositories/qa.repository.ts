/**
 * QA Repository - Quality assurance defect tracking
 * Collection path: blueprints/{blueprintId}/qa_defects/{defectId}
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

import { QADefect, DefectStatus, CreateQADefectData, UpdateQADefectData, QAQueryOptions } from '../models';

@Injectable({ providedIn: 'root' })
export class QaRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly parentCollection = 'blueprints';
  private readonly subcollectionName = 'qa_defects';

  private getDefectsCollection(blueprintId: string): CollectionReference {
    return collection(this.firestore, this.parentCollection, blueprintId, this.subcollectionName);
  }

  private toQADefect(data: Record<string, unknown>, id: string): QADefect {
    return {
      id,
      blueprintId: (data['blueprintId'] as string) || '',
      title: data['title'] as string,
      description: data['description'] as string,
      severity: data['severity'] as QADefect['severity'],
      status: data['status'] as DefectStatus,
      location: data['location'] as string | undefined,
      photos: (data['photos'] as string[]) || undefined,
      assigneeId: data['assigneeId'] as string | undefined,
      resolvedDate: data['resolvedDate']
        ? data['resolvedDate'] instanceof Timestamp
          ? (data['resolvedDate'] as Timestamp).toDate()
          : (data['resolvedDate'] as Date)
        : undefined,
      metadata: (data['metadata'] as Record<string, unknown>) || {},
      createdBy: data['createdBy'] as string,
      createdAt: data['createdAt'] instanceof Timestamp ? (data['createdAt'] as Timestamp).toDate() : (data['createdAt'] as Date),
      updatedAt: data['updatedAt'] instanceof Timestamp ? (data['updatedAt'] as Timestamp).toDate() : (data['updatedAt'] as Date)
    };
  }

  findByBlueprintId(blueprintId: string, options?: QAQueryOptions): Observable<QADefect[]> {
    const constraints: QueryConstraint[] = [];

    if (options?.severity) constraints.push(where('severity', '==', options.severity));
    if (options?.status) constraints.push(where('status', '==', options.status));
    if (options?.assigneeId) constraints.push(where('assigneeId', '==', options.assigneeId));

    constraints.push(orderBy('createdAt', 'desc'));
    if (options?.limit) constraints.push(limit(options.limit));

    const q = query(this.getDefectsCollection(blueprintId), ...constraints);
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(docSnap => this.toQADefect(docSnap.data(), docSnap.id))),
      catchError(error => {
        this.logger.error('[QaRepository]', 'findByBlueprintId failed', error as Error);
        return of([]);
      })
    );
  }

  findById(blueprintId: string, defectId: string): Observable<QADefect | null> {
    return from(getDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, defectId))).pipe(
      map(snapshot => (snapshot.exists() ? this.toQADefect(snapshot.data(), snapshot.id) : null)),
      catchError(error => {
        this.logger.error('[QaRepository]', 'findById failed', error as Error);
        return of(null);
      })
    );
  }

  async create(blueprintId: string, data: CreateQADefectData): Promise<QADefect> {
    const now = Timestamp.now();
    const docData = {
      blueprintId,
      title: data.title,
      description: data.description,
      severity: data.severity,
      status: DefectStatus.OPEN,
      location: data.location || null,
      photos: [],
      assigneeId: data.assigneeId || null,
      metadata: {},
      createdBy: data.createdBy,
      createdAt: now,
      updatedAt: now
    };

    try {
      const docRef = await addDoc(this.getDefectsCollection(blueprintId), docData);
      const snapshot = await getDoc(docRef);
      return snapshot.exists() ? this.toQADefect(snapshot.data(), snapshot.id) : this.toQADefect(docData, docRef.id);
    } catch (error) {
      this.logger.error('[QaRepository]', 'create failed', error as Error);
      throw error;
    }
  }

  async update(blueprintId: string, defectId: string, data: UpdateQADefectData): Promise<void> {
    const docData: Record<string, unknown> = { ...data, updatedAt: Timestamp.now() };

    if (data.resolvedDate) docData['resolvedDate'] = Timestamp.fromDate(data.resolvedDate);

    try {
      await updateDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, defectId), docData);
    } catch (error) {
      this.logger.error('[QaRepository]', 'update failed', error as Error);
      throw error;
    }
  }

  async delete(blueprintId: string, defectId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, defectId));
    } catch (error) {
      this.logger.error('[QaRepository]', 'delete failed', error as Error);
      throw error;
    }
  }

  /**
   * @deprecated Use findByBlueprintId() instead. This method exists for backward compatibility with stub services.
   */
  async findAll(): Promise<unknown[]> {
    this.logger.warn('[QaRepository]', 'findAll() is deprecated. Use findByBlueprintId() instead.');
    return [];
  }
}
