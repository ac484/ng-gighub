/**
 * Material Repository
 * Data access layer for material management.
 * Collection path: blueprints/{blueprintId}/materials/{materialId}
 * Following Occam's Razor: Simple material inventory management
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

import { MaterialItem, MaterialStatus, CreateMaterialData, UpdateMaterialData, MaterialQueryOptions } from '../models';

@Injectable({ providedIn: 'root' })
export class MaterialRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly parentCollection = 'blueprints';
  private readonly subcollectionName = 'materials';

  private getMaterialsCollection(blueprintId: string): CollectionReference {
    return collection(this.firestore, this.parentCollection, blueprintId, this.subcollectionName);
  }

  private toMaterialItem(data: Record<string, unknown>, id: string): MaterialItem {
    const quantity = Number(data['quantity']) || 0;
    const minQuantity = Number(data['minQuantity']) || 0;
    let status = data['status'] as MaterialStatus;

    // Auto-calculate status if not set
    if (!status) {
      if (quantity === 0) status = MaterialStatus.OUT_OF_STOCK;
      else if (quantity <= minQuantity) status = MaterialStatus.LOW_STOCK;
      else status = MaterialStatus.IN_STOCK;
    }

    return {
      id,
      blueprintId: (data['blueprintId'] as string) || '',
      name: data['name'] as string,
      description: data['description'] as string | undefined,
      category: data['category'] as string,
      unit: data['unit'] as string,
      quantity,
      minQuantity,
      status,
      location: data['location'] as string | undefined,
      supplier: data['supplier'] as string | undefined,
      cost: data['cost'] as number | undefined,
      metadata: (data['metadata'] as Record<string, unknown>) || {},
      createdBy: data['createdBy'] as string,
      createdAt: data['createdAt'] instanceof Timestamp ? (data['createdAt'] as Timestamp).toDate() : (data['createdAt'] as Date),
      updatedAt: data['updatedAt'] instanceof Timestamp ? (data['updatedAt'] as Timestamp).toDate() : (data['updatedAt'] as Date)
    };
  }

  findByBlueprintId(blueprintId: string, options?: MaterialQueryOptions): Observable<MaterialItem[]> {
    const constraints: QueryConstraint[] = [];

    if (options?.category) constraints.push(where('category', '==', options.category));
    if (options?.status) constraints.push(where('status', '==', options.status));

    constraints.push(orderBy('name', 'asc'));
    if (options?.limit) constraints.push(limit(options.limit));

    const q = query(this.getMaterialsCollection(blueprintId), ...constraints);
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(docSnap => this.toMaterialItem(docSnap.data(), docSnap.id))),
      catchError(error => {
        this.logger.error('[MaterialRepository]', 'findByBlueprintId failed', error as Error);
        return of([]);
      })
    );
  }

  findById(blueprintId: string, materialId: string): Observable<MaterialItem | null> {
    return from(getDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, materialId))).pipe(
      map(snapshot => (snapshot.exists() ? this.toMaterialItem(snapshot.data(), snapshot.id) : null)),
      catchError(error => {
        this.logger.error('[MaterialRepository]', 'findById failed', error as Error);
        return of(null);
      })
    );
  }

  async create(blueprintId: string, data: CreateMaterialData): Promise<MaterialItem> {
    const now = Timestamp.now();
    const quantity = data.quantity || 0;
    const minQuantity = data.minQuantity || 0;
    let status: MaterialStatus;

    if (quantity === 0) status = MaterialStatus.OUT_OF_STOCK;
    else if (quantity <= minQuantity) status = MaterialStatus.LOW_STOCK;
    else status = MaterialStatus.IN_STOCK;

    const docData = {
      blueprintId,
      name: data.name,
      description: data.description || '',
      category: data.category,
      unit: data.unit,
      quantity,
      minQuantity,
      status,
      location: data.location || null,
      supplier: data.supplier || null,
      cost: data.cost || null,
      metadata: {},
      createdBy: data.createdBy,
      createdAt: now,
      updatedAt: now
    };

    try {
      const docRef = await addDoc(this.getMaterialsCollection(blueprintId), docData);
      const snapshot = await getDoc(docRef);
      return snapshot.exists() ? this.toMaterialItem(snapshot.data(), snapshot.id) : this.toMaterialItem(docData, docRef.id);
    } catch (error) {
      this.logger.error('[MaterialRepository]', 'create failed', error as Error);
      throw error;
    }
  }

  async update(blueprintId: string, materialId: string, data: UpdateMaterialData): Promise<void> {
    const docData: Record<string, unknown> = { ...data, updatedAt: Timestamp.now() };

    // Auto-calculate status if quantity changed
    if (data.quantity !== undefined) {
      const minQty = data.minQuantity !== undefined ? data.minQuantity : 0;
      if (data.quantity === 0) docData['status'] = MaterialStatus.OUT_OF_STOCK;
      else if (data.quantity <= minQty) docData['status'] = MaterialStatus.LOW_STOCK;
      else docData['status'] = MaterialStatus.IN_STOCK;
    }

    try {
      await updateDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, materialId), docData);
    } catch (error) {
      this.logger.error('[MaterialRepository]', 'update failed', error as Error);
      throw error;
    }
  }

  async delete(blueprintId: string, materialId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, materialId));
    } catch (error) {
      this.logger.error('[MaterialRepository]', 'delete failed', error as Error);
      throw error;
    }
  }

  /**
   * @deprecated Use findByBlueprintId() instead. This method exists for backward compatibility with stub services.
   */
  async findAll(): Promise<unknown[]> {
    this.logger.warn('[MaterialRepository]', 'findAll() is deprecated. Use findByBlueprintId() instead.');
    return [];
  }
}
