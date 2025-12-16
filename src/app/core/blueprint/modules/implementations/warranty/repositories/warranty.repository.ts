/**
 * Warranty Repository - 保固記錄資料存取層
 *
 * SETC-033: Warranty Repository Implementation
 *
 * Collection path: blueprints/{blueprintId}/warranties/{warrantyId}
 *
 * @module WarrantyRepository
 * @author GigHub Development Team
 * @date 2025-12-16
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
  QueryConstraint,
  serverTimestamp,
  collectionData
} from '@angular/fire/firestore';
import { LoggerService } from '@core';
import { Observable, from, map, catchError, of } from 'rxjs';

import type { Warranty, WarrantyStatus, CreateWarrantyOptions, UpdateWarrantyOptions } from '../models/warranty.model';

/**
 * 保固查詢選項
 */
export interface WarrantyQueryOptions {
  /** 狀態篩選 */
  status?: WarrantyStatus | WarrantyStatus[];
  /** 合約 ID */
  contractId?: string;
  /** 驗收 ID */
  acceptanceId?: string;
  /** 排序欄位 */
  orderByField?: 'createdAt' | 'endDate' | 'startDate';
  /** 排序方向 */
  orderDirection?: 'asc' | 'desc';
  /** 結果限制 */
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class WarrantyRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly parentCollection = 'blueprints';
  private readonly subcollectionName = 'warranties';

  /**
   * 取得保固 Collection 參考
   */
  private getWarrantiesCollection(blueprintId: string): CollectionReference {
    return collection(this.firestore, this.parentCollection, blueprintId, this.subcollectionName);
  }

  /**
   * 轉換 Firestore 資料為 Warranty 型別
   */
  private toWarranty(data: Record<string, unknown>, id: string): Warranty {
    return {
      id,
      blueprintId: (data['blueprintId'] as string) || '',
      acceptanceId: (data['acceptanceId'] as string) || '',
      contractId: (data['contractId'] as string) || '',
      taskIds: (data['taskIds'] as string[]) || [],
      warrantyNumber: (data['warrantyNumber'] as string) || '',
      warrantyType: (data['warrantyType'] as Warranty['warrantyType']) || 'standard',
      items: (data['items'] as Warranty['items']) || [],
      startDate: this.toDate(data['startDate']),
      endDate: this.toDate(data['endDate']),
      periodInMonths: Number(data['periodInMonths']) || 12,
      warrantor: (data['warrantor'] as Warranty['warrantor']) || {
        id: '',
        name: '',
        contactName: '',
        contactPhone: '',
        contactEmail: '',
        address: ''
      },
      status: (data['status'] as WarrantyStatus) || 'pending',
      defectCount: Number(data['defectCount']) || 0,
      repairCount: Number(data['repairCount']) || 0,
      notificationSettings: (data['notificationSettings'] as Warranty['notificationSettings']) || {
        enabled: true,
        notifyDaysBefore: [30, 14, 7, 1],
        notifyEmails: []
      },
      notes: data['notes'] as string | undefined,
      createdBy: (data['createdBy'] as string) || '',
      createdAt: this.toDate(data['createdAt']),
      updatedBy: data['updatedBy'] as string | undefined,
      updatedAt: this.toDate(data['updatedAt'])
    };
  }

  /**
   * 轉換 Firestore Timestamp 或 Date 為 Date
   */
  private toDate(value: unknown): Date {
    if (value instanceof Timestamp) {
      return value.toDate();
    }
    if (value instanceof Date) {
      return value;
    }
    return new Date();
  }

  /**
   * 產生保固編號
   */
  private generateWarrantyNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `WRT-${year}${month}-${random}`;
  }

  /**
   * 建立保固記錄
   */
  async create(blueprintId: string, options: CreateWarrantyOptions): Promise<Warranty> {
    const now = new Date();
    const startDate = now;
    const periodInMonths = options.periodInMonths ?? 12;
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + periodInMonths);

    const docData = {
      blueprintId,
      acceptanceId: options.acceptanceId,
      contractId: options.contractId,
      taskIds: options.taskIds,
      warrantyNumber: this.generateWarrantyNumber(),
      warrantyType: options.warrantyType ?? 'standard',
      items: (options.items ?? []).map((item, index) => ({
        ...item,
        id: `item-${index + 1}`,
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        status: 'active' as const
      })),
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(endDate),
      periodInMonths,
      warrantor: options.warrantor,
      status: 'pending' as WarrantyStatus,
      defectCount: 0,
      repairCount: 0,
      notificationSettings: {
        enabled: true,
        notifyDaysBefore: [30, 14, 7, 1],
        notifyEmails: []
      },
      createdBy: options.createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    try {
      const docRef = await addDoc(this.getWarrantiesCollection(blueprintId), docData);
      this.logger.info('[WarrantyRepository]', `Created warranty ${docRef.id}`);

      const snapshot = await getDoc(docRef);
      return snapshot.exists()
        ? this.toWarranty(snapshot.data(), snapshot.id)
        : this.toWarranty(docData as Record<string, unknown>, docRef.id);
    } catch (error) {
      this.logger.error('[WarrantyRepository]', 'create failed', error as Error);
      throw error;
    }
  }

  /**
   * 更新保固記錄
   */
  async update(blueprintId: string, warrantyId: string, options: UpdateWarrantyOptions): Promise<void> {
    const updateData: Record<string, unknown> = {
      updatedBy: options.updatedBy,
      updatedAt: serverTimestamp()
    };

    if (options.warrantyType !== undefined) {
      updateData['warrantyType'] = options.warrantyType;
    }
    if (options.warrantor !== undefined) {
      updateData['warrantor'] = options.warrantor;
    }
    if (options.notificationSettings !== undefined) {
      updateData['notificationSettings'] = options.notificationSettings;
    }
    if (options.notes !== undefined) {
      updateData['notes'] = options.notes;
    }

    try {
      await updateDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, warrantyId), updateData);
      this.logger.info('[WarrantyRepository]', `Updated warranty ${warrantyId}`);
    } catch (error) {
      this.logger.error('[WarrantyRepository]', 'update failed', error as Error);
      throw error;
    }
  }

  /**
   * 更新保固狀態
   */
  async updateStatus(blueprintId: string, warrantyId: string, status: WarrantyStatus, updatedBy: string): Promise<void> {
    try {
      await updateDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, warrantyId), {
        status,
        updatedBy,
        updatedAt: serverTimestamp()
      });
      this.logger.info('[WarrantyRepository]', `Updated warranty ${warrantyId} status to ${status}`);
    } catch (error) {
      this.logger.error('[WarrantyRepository]', 'updateStatus failed', error as Error);
      throw error;
    }
  }

  /**
   * 增加缺失計數
   */
  async incrementDefectCount(blueprintId: string, warrantyId: string): Promise<void> {
    const warranty = await this.getById(blueprintId, warrantyId);
    if (warranty) {
      await updateDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, warrantyId), {
        defectCount: (warranty.defectCount ?? 0) + 1,
        updatedAt: serverTimestamp()
      });
    }
  }

  /**
   * 增加維修計數
   */
  async incrementRepairCount(blueprintId: string, warrantyId: string): Promise<void> {
    const warranty = await this.getById(blueprintId, warrantyId);
    if (warranty) {
      await updateDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, warrantyId), {
        repairCount: (warranty.repairCount ?? 0) + 1,
        updatedAt: serverTimestamp()
      });
    }
  }

  /**
   * 刪除保固記錄
   */
  async delete(blueprintId: string, warrantyId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, warrantyId));
      this.logger.info('[WarrantyRepository]', `Deleted warranty ${warrantyId}`);
    } catch (error) {
      this.logger.error('[WarrantyRepository]', 'delete failed', error as Error);
      throw error;
    }
  }

  /**
   * 取得保固記錄 by ID
   */
  async getById(blueprintId: string, warrantyId: string): Promise<Warranty | null> {
    try {
      const snapshot = await getDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, warrantyId));
      return snapshot.exists() ? this.toWarranty(snapshot.data(), snapshot.id) : null;
    } catch (error) {
      this.logger.error('[WarrantyRepository]', 'getById failed', error as Error);
      return null;
    }
  }

  /**
   * 取得藍圖的所有保固記錄
   */
  findByBlueprintId(blueprintId: string, options?: WarrantyQueryOptions): Observable<Warranty[]> {
    const constraints: QueryConstraint[] = [];

    if (options?.status) {
      if (Array.isArray(options.status)) {
        constraints.push(where('status', 'in', options.status));
      } else {
        constraints.push(where('status', '==', options.status));
      }
    }

    if (options?.contractId) {
      constraints.push(where('contractId', '==', options.contractId));
    }

    if (options?.acceptanceId) {
      constraints.push(where('acceptanceId', '==', options.acceptanceId));
    }

    const orderField = options?.orderByField ?? 'createdAt';
    const orderDir = options?.orderDirection ?? 'desc';
    constraints.push(orderBy(orderField, orderDir));

    if (options?.limit) {
      constraints.push(limit(options.limit));
    }

    const q = query(this.getWarrantiesCollection(blueprintId), ...constraints);

    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(docSnap => this.toWarranty(docSnap.data(), docSnap.id))),
      catchError(error => {
        this.logger.error('[WarrantyRepository]', 'findByBlueprintId failed', error as Error);
        return of([]);
      })
    );
  }

  /**
   * 取得藍圖的保固記錄（即時更新）
   */
  getByBlueprintId$(blueprintId: string): Observable<Warranty[]> {
    const col = this.getWarrantiesCollection(blueprintId);
    const q = query(col, orderBy('createdAt', 'desc'));

    return collectionData(q, { idField: 'id' }).pipe(
      map(docs => docs.map(data => this.toWarranty(data as Record<string, unknown>, (data as Record<string, string>)['id']))),
      catchError(error => {
        this.logger.error('[WarrantyRepository]', 'getByBlueprintId$ failed', error as Error);
        return of([]);
      })
    );
  }

  /**
   * 取得驗收對應的保固記錄
   */
  async getByAcceptanceId(blueprintId: string, acceptanceId: string): Promise<Warranty | null> {
    try {
      const q = query(this.getWarrantiesCollection(blueprintId), where('acceptanceId', '==', acceptanceId), limit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return this.toWarranty(snapshot.docs[0].data(), snapshot.docs[0].id);
    } catch (error) {
      this.logger.error('[WarrantyRepository]', 'getByAcceptanceId failed', error as Error);
      return null;
    }
  }

  /**
   * 取得指定狀態的保固記錄
   */
  async getByStatus(blueprintId: string, statuses: WarrantyStatus[]): Promise<Warranty[]> {
    try {
      const q = query(this.getWarrantiesCollection(blueprintId), where('status', 'in', statuses), orderBy('endDate', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => this.toWarranty(docSnap.data(), docSnap.id));
    } catch (error) {
      this.logger.error('[WarrantyRepository]', 'getByStatus failed', error as Error);
      return [];
    }
  }

  /**
   * 取得即將到期的保固記錄
   */
  async getExpiringWarranties(blueprintId: string, withinDays = 30): Promise<Warranty[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + withinDays);

    try {
      const q = query(
        this.getWarrantiesCollection(blueprintId),
        where('status', 'in', ['active', 'expiring']),
        where('endDate', '>=', Timestamp.fromDate(now)),
        where('endDate', '<=', Timestamp.fromDate(futureDate)),
        orderBy('endDate', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => this.toWarranty(docSnap.data(), docSnap.id));
    } catch (error) {
      this.logger.error('[WarrantyRepository]', 'getExpiringWarranties failed', error as Error);
      return [];
    }
  }

  /**
   * 取得已過期的保固記錄
   */
  async getExpiredWarranties(blueprintId: string): Promise<Warranty[]> {
    const now = new Date();

    try {
      const q = query(
        this.getWarrantiesCollection(blueprintId),
        where('status', 'in', ['active', 'expiring']),
        where('endDate', '<', Timestamp.fromDate(now)),
        orderBy('endDate', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => this.toWarranty(docSnap.data(), docSnap.id));
    } catch (error) {
      this.logger.error('[WarrantyRepository]', 'getExpiredWarranties failed', error as Error);
      return [];
    }
  }
}
