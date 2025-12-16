/**
 * Communication Repository
 *
 * Data access layer for communication management.
 * Handles all Firestore operations for communications within a blueprint.
 *
 * Collection path: blueprints/{blueprintId}/communications/{communicationId}
 *
 * Following Occam's Razor: Simple repository for meetings, memos, and notices
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

import {
  CommunicationItem,
  CommunicationStatus,
  CommunicationType,
  CreateCommunicationData,
  UpdateCommunicationData,
  CommunicationQueryOptions
} from '../models';

@Injectable({ providedIn: 'root' })
export class CommunicationRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly parentCollection = 'blueprints';
  private readonly subcollectionName = 'communications';

  private getCommunicationsCollection(blueprintId: string): CollectionReference {
    return collection(this.firestore, this.parentCollection, blueprintId, this.subcollectionName);
  }

  private toCommunicationItem(data: Record<string, unknown>, id: string): CommunicationItem {
    return {
      id,
      blueprintId: (data['blueprintId'] as string) || '',
      type: data['type'] as CommunicationType,
      status: data['status'] as CommunicationStatus,
      title: data['title'] as string,
      content: data['content'] as string,
      participants: (data['participants'] as string[]) || [],
      attachments: (data['attachments'] as string[]) || undefined,
      date: data['date'] ? (data['date'] instanceof Timestamp ? (data['date'] as Timestamp).toDate() : (data['date'] as Date)) : undefined,
      location: data['location'] as string | undefined,
      metadata: (data['metadata'] as Record<string, unknown>) || {},
      createdBy: data['createdBy'] as string,
      createdAt: data['createdAt'] instanceof Timestamp ? (data['createdAt'] as Timestamp).toDate() : (data['createdAt'] as Date),
      updatedAt: data['updatedAt'] instanceof Timestamp ? (data['updatedAt'] as Timestamp).toDate() : (data['updatedAt'] as Date)
    };
  }

  findByBlueprintId(blueprintId: string, options?: CommunicationQueryOptions): Observable<CommunicationItem[]> {
    const constraints: QueryConstraint[] = [];

    if (options?.type) {
      constraints.push(where('type', '==', options.type));
    }

    if (options?.status) {
      constraints.push(where('status', '==', options.status));
    }

    if (options?.startDate) {
      constraints.push(where('date', '>=', Timestamp.fromDate(options.startDate)));
    }

    if (options?.endDate) {
      constraints.push(where('date', '<=', Timestamp.fromDate(options.endDate)));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    if (options?.limit) {
      constraints.push(limit(options.limit));
    }

    const q = query(this.getCommunicationsCollection(blueprintId), ...constraints);

    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(docSnap => this.toCommunicationItem(docSnap.data(), docSnap.id))),
      catchError(error => {
        this.logger.error('[CommunicationRepository]', 'findByBlueprintId failed', error as Error);
        return of([]);
      })
    );
  }

  findById(blueprintId: string, communicationId: string): Observable<CommunicationItem | null> {
    return from(getDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, communicationId))).pipe(
      map(snapshot => (snapshot.exists() ? this.toCommunicationItem(snapshot.data(), snapshot.id) : null)),
      catchError(error => {
        this.logger.error('[CommunicationRepository]', 'findById failed', error as Error);
        return of(null);
      })
    );
  }

  async create(blueprintId: string, data: CreateCommunicationData): Promise<CommunicationItem> {
    const now = Timestamp.now();
    const docData = {
      blueprintId,
      type: data.type,
      status: CommunicationStatus.DRAFT,
      title: data.title,
      content: data.content,
      participants: data.participants || [],
      attachments: data.attachments || [],
      date: data.date ? Timestamp.fromDate(data.date) : null,
      location: data.location || null,
      metadata: {},
      createdBy: data.createdBy,
      createdAt: now,
      updatedAt: now
    };

    try {
      const docRef = await addDoc(this.getCommunicationsCollection(blueprintId), docData);
      this.logger.info('[CommunicationRepository]', `Communication created: ${docRef.id}`);

      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return this.toCommunicationItem(snapshot.data(), snapshot.id);
      }

      return this.toCommunicationItem(docData, docRef.id);
    } catch (error) {
      this.logger.error('[CommunicationRepository]', 'create failed', error as Error);
      throw error;
    }
  }

  async update(blueprintId: string, communicationId: string, data: UpdateCommunicationData): Promise<void> {
    const docData: Record<string, unknown> = {
      ...data,
      updatedAt: Timestamp.now()
    };

    if (data.date) {
      docData['date'] = Timestamp.fromDate(data.date);
    }

    try {
      await updateDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, communicationId), docData);
      this.logger.info('[CommunicationRepository]', `Communication updated: ${communicationId}`);
    } catch (error) {
      this.logger.error('[CommunicationRepository]', 'update failed', error as Error);
      throw error;
    }
  }

  async delete(blueprintId: string, communicationId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, communicationId));
      this.logger.info('[CommunicationRepository]', `Communication deleted: ${communicationId}`);
    } catch (error) {
      this.logger.error('[CommunicationRepository]', 'delete failed', error as Error);
      throw error;
    }
  }

  /**
   * @deprecated Use findByBlueprintId() instead. This method exists for backward compatibility with stub services.
   */
  async findAll(): Promise<unknown[]> {
    this.logger.warn('[CommunicationRepository]', 'findAll() is deprecated. Use findByBlueprintId() instead.');
    return [];
  }
}
