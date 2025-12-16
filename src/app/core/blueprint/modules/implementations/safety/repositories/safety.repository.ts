/**
 * Safety Repository
 *
 * Data access layer for safety management.
 * Handles all Firestore operations for safety inspections within a blueprint.
 *
 * Collection path: blueprints/{blueprintId}/safety_inspections/{inspectionId}
 *
 * Following Occam's Razor: Simple repository implementation for safety management
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
  SafetyInspection,
  InspectionStatus,
  InspectionType,
  CreateSafetyInspectionData,
  UpdateSafetyInspectionData,
  SafetyInspectionQueryOptions
} from '../models/safety-inspection.model';

/**
 * Safety Repository Service
 *
 * Manages CRUD operations for safety inspections within a blueprint.
 */
@Injectable({
  providedIn: 'root'
})
export class SafetyRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly parentCollection = 'blueprints';
  private readonly subcollectionName = 'safety_inspections';

  /**
   * Get safety inspections subcollection reference
   */
  private getInspectionsCollection(blueprintId: string): CollectionReference {
    return collection(this.firestore, this.parentCollection, blueprintId, this.subcollectionName);
  }

  /**
   * Convert Firestore data to SafetyInspection entity
   */
  private toSafetyInspection(data: Record<string, unknown>, id: string): SafetyInspection {
    return {
      id,
      blueprintId: (data['blueprintId'] as string) || '',
      inspectionNumber: data['inspectionNumber'] as string,
      type: data['type'] as InspectionType,
      status: data['status'] as InspectionStatus,
      result: data['result'] as SafetyInspection['result'],
      inspectorId: data['inspectorId'] as string,
      inspectorName: data['inspectorName'] as string,
      scheduledDate:
        data['scheduledDate'] instanceof Timestamp ? (data['scheduledDate'] as Timestamp).toDate() : (data['scheduledDate'] as Date),
      startTime: data['startTime']
        ? data['startTime'] instanceof Timestamp
          ? (data['startTime'] as Timestamp).toDate()
          : (data['startTime'] as Date)
        : undefined,
      endTime: data['endTime']
        ? data['endTime'] instanceof Timestamp
          ? (data['endTime'] as Timestamp).toDate()
          : (data['endTime'] as Date)
        : undefined,
      location: data['location'] as string,
      description: data['description'] as string | undefined,
      findings: (data['findings'] as SafetyInspection['findings']) || [],
      correctiveActions: (data['correctiveActions'] as string[]) || undefined,
      attachments: (data['attachments'] as string[]) || undefined,
      metadata: (data['metadata'] as Record<string, unknown>) || {},
      createdBy: data['createdBy'] as string,
      createdAt: data['createdAt'] instanceof Timestamp ? (data['createdAt'] as Timestamp).toDate() : (data['createdAt'] as Date),
      updatedAt: data['updatedAt'] instanceof Timestamp ? (data['updatedAt'] as Timestamp).toDate() : (data['updatedAt'] as Date)
    };
  }

  /**
   * Find all safety inspections for a blueprint
   */
  findByBlueprintId(blueprintId: string, options?: SafetyInspectionQueryOptions): Observable<SafetyInspection[]> {
    const constraints: QueryConstraint[] = [];

    if (options?.type) {
      constraints.push(where('type', '==', options.type));
    }

    if (options?.status) {
      constraints.push(where('status', '==', options.status));
    }

    if (options?.result) {
      constraints.push(where('result', '==', options.result));
    }

    if (options?.inspectorId) {
      constraints.push(where('inspectorId', '==', options.inspectorId));
    }

    if (options?.startDate) {
      constraints.push(where('scheduledDate', '>=', Timestamp.fromDate(options.startDate)));
    }

    if (options?.endDate) {
      constraints.push(where('scheduledDate', '<=', Timestamp.fromDate(options.endDate)));
    }

    constraints.push(orderBy('scheduledDate', 'desc'));

    if (options?.limit) {
      constraints.push(limit(options.limit));
    }

    const q = query(this.getInspectionsCollection(blueprintId), ...constraints);

    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(docSnap => this.toSafetyInspection(docSnap.data(), docSnap.id))),
      catchError(error => {
        this.logger.error('[SafetyRepository]', 'findByBlueprintId failed', error as Error);
        return of([]);
      })
    );
  }

  /**
   * Find safety inspection by ID
   */
  findById(blueprintId: string, inspectionId: string): Observable<SafetyInspection | null> {
    return from(getDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, inspectionId))).pipe(
      map(snapshot => (snapshot.exists() ? this.toSafetyInspection(snapshot.data(), snapshot.id) : null)),
      catchError(error => {
        this.logger.error('[SafetyRepository]', 'findById failed', error as Error);
        return of(null);
      })
    );
  }

  /**
   * Create a new safety inspection
   */
  async create(blueprintId: string, data: CreateSafetyInspectionData): Promise<SafetyInspection> {
    const now = Timestamp.now();
    const docData = {
      blueprintId,
      inspectionNumber: data.inspectionNumber,
      type: data.type,
      status: InspectionStatus.SCHEDULED,
      inspectorId: data.inspectorId,
      inspectorName: data.inspectorName,
      scheduledDate: Timestamp.fromDate(data.scheduledDate),
      location: data.location,
      description: data.description || '',
      findings: [],
      correctiveActions: [],
      attachments: [],
      metadata: {},
      createdBy: data.createdBy,
      createdAt: now,
      updatedAt: now
    };

    try {
      const docRef = await addDoc(this.getInspectionsCollection(blueprintId), docData);
      this.logger.info('[SafetyRepository]', `Safety inspection created: ${docRef.id}`);

      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return this.toSafetyInspection(snapshot.data(), snapshot.id);
      }

      return this.toSafetyInspection(docData, docRef.id);
    } catch (error) {
      this.logger.error('[SafetyRepository]', 'create failed', error as Error);
      throw error;
    }
  }

  /**
   * Update a safety inspection
   */
  async update(blueprintId: string, inspectionId: string, data: UpdateSafetyInspectionData): Promise<void> {
    const docData: Record<string, unknown> = {
      ...data,
      updatedAt: Timestamp.now()
    };

    // Convert dates to Timestamps
    if (data.startTime) {
      docData['startTime'] = Timestamp.fromDate(data.startTime);
    }
    if (data.endTime) {
      docData['endTime'] = Timestamp.fromDate(data.endTime);
    }

    try {
      await updateDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, inspectionId), docData);
      this.logger.info('[SafetyRepository]', `Safety inspection updated: ${inspectionId}`);
    } catch (error) {
      this.logger.error('[SafetyRepository]', 'update failed', error as Error);
      throw error;
    }
  }

  /**
   * Delete a safety inspection (soft delete recommended in production)
   */
  async delete(blueprintId: string, inspectionId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, inspectionId));
      this.logger.info('[SafetyRepository]', `Safety inspection deleted: ${inspectionId}`);
    } catch (error) {
      this.logger.error('[SafetyRepository]', 'delete failed', error as Error);
      throw error;
    }
  }

  /**
   * Get inspection count by status
   */
  async getCountByStatus(blueprintId: string): Promise<Record<string, number>> {
    try {
      const snapshot = await getDocs(this.getInspectionsCollection(blueprintId));
      const counts: Record<string, number> = {};

      Object.values(InspectionStatus).forEach(status => {
        counts[status] = 0;
      });

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const status = data['status'] as string;
        if (status) {
          counts[status] = (counts[status] || 0) + 1;
        }
      });

      return counts;
    } catch (error) {
      this.logger.error('[SafetyRepository]', 'getCountByStatus failed', error as Error);
      throw error;
    }
  }

  /**
   * @deprecated Use findByBlueprintId() instead. This method exists for backward compatibility with stub services.
   * Legacy method for stub services that don't have blueprintId context.
   */
  async findAll(): Promise<unknown[]> {
    this.logger.warn('[SafetyRepository]', 'findAll() is deprecated. Use findByBlueprintId() instead.');
    return [];
  }
}
