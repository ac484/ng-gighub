/**
 * Warranty Defect Repository - 保固缺失資料存取層
 *
 * SETC-033: Warranty Repository Implementation
 *
 * Collection path: blueprints/{blueprintId}/warranties/{warrantyId}/defects/{defectId}
 *
 * @module WarrantyDefectRepository
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
  Timestamp,
  CollectionReference,
  serverTimestamp,
  collectionData
} from '@angular/fire/firestore';
import { LoggerService } from '@core';
import { Observable, map, catchError, of } from 'rxjs';

import type { WarrantyDefect, WarrantyDefectStatus, CreateDefectOptions, UpdateDefectOptions } from '../models/warranty-defect.model';

@Injectable({ providedIn: 'root' })
export class WarrantyDefectRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly parentCollection = 'blueprints';
  private readonly warrantiesCollection = 'warranties';
  private readonly defectsCollection = 'defects';

  /**
   * 取得缺失 Collection 參考
   */
  private getDefectsCollection(blueprintId: string, warrantyId: string): CollectionReference {
    return collection(this.firestore, this.parentCollection, blueprintId, this.warrantiesCollection, warrantyId, this.defectsCollection);
  }

  /**
   * 轉換 Firestore 資料為 WarrantyDefect 型別
   */
  private toDefect(data: Record<string, unknown>, id: string): WarrantyDefect {
    return {
      id,
      warrantyId: (data['warrantyId'] as string) || '',
      blueprintId: (data['blueprintId'] as string) || '',
      defectNumber: (data['defectNumber'] as string) || '',
      description: (data['description'] as string) || '',
      location: (data['location'] as string) || '',
      category: (data['category'] as WarrantyDefect['category']) || 'other',
      severity: (data['severity'] as WarrantyDefect['severity']) || 'minor',
      discoveredDate: this.toDate(data['discoveredDate']),
      reportedBy: (data['reportedBy'] as string) || '',
      reporterContact: (data['reporterContact'] as string) || '',
      photos: (data['photos'] as WarrantyDefect['photos']) || [],
      documents: (data['documents'] as WarrantyDefect['documents']) || [],
      status: (data['status'] as WarrantyDefectStatus) || 'reported',
      repairId: data['repairId'] as string | undefined,
      issueId: data['issueId'] as string | undefined,
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
   * 產生缺失編號
   */
  private generateDefectNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `DEF-${year}${month}-${random}`;
  }

  /**
   * 建立缺失記錄
   */
  async create(blueprintId: string, warrantyId: string, options: CreateDefectOptions): Promise<WarrantyDefect> {
    const docData = {
      warrantyId,
      blueprintId,
      defectNumber: this.generateDefectNumber(),
      description: options.description,
      location: options.location,
      category: options.category,
      severity: options.severity,
      discoveredDate: Timestamp.fromDate(options.discoveredDate ?? new Date()),
      reportedBy: options.createdBy,
      reporterContact: options.reporterContact ?? '',
      photos: options.photos ?? [],
      documents: [],
      status: 'reported' as WarrantyDefectStatus,
      createdBy: options.createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    try {
      const col = this.getDefectsCollection(blueprintId, warrantyId);
      const docRef = await addDoc(col, docData);
      this.logger.info('[WarrantyDefectRepository]', `Created defect ${docRef.id}`);

      const snapshot = await getDoc(docRef);
      return snapshot.exists() ? this.toDefect(snapshot.data(), snapshot.id) : this.toDefect(docData as Record<string, unknown>, docRef.id);
    } catch (error) {
      this.logger.error('[WarrantyDefectRepository]', 'create failed', error as Error);
      throw error;
    }
  }

  /**
   * 更新缺失記錄
   */
  async update(blueprintId: string, warrantyId: string, defectId: string, options: UpdateDefectOptions): Promise<void> {
    const updateData: Record<string, unknown> = {
      updatedBy: options.updatedBy,
      updatedAt: serverTimestamp()
    };

    if (options.description !== undefined) updateData['description'] = options.description;
    if (options.location !== undefined) updateData['location'] = options.location;
    if (options.category !== undefined) updateData['category'] = options.category;
    if (options.severity !== undefined) updateData['severity'] = options.severity;
    if (options.status !== undefined) updateData['status'] = options.status;
    if (options.repairId !== undefined) updateData['repairId'] = options.repairId;
    if (options.issueId !== undefined) updateData['issueId'] = options.issueId;

    try {
      await updateDoc(
        doc(this.firestore, this.parentCollection, blueprintId, this.warrantiesCollection, warrantyId, this.defectsCollection, defectId),
        updateData
      );
      this.logger.info('[WarrantyDefectRepository]', `Updated defect ${defectId}`);
    } catch (error) {
      this.logger.error('[WarrantyDefectRepository]', 'update failed', error as Error);
      throw error;
    }
  }

  /**
   * 更新缺失狀態
   */
  async updateStatus(
    blueprintId: string,
    warrantyId: string,
    defectId: string,
    status: WarrantyDefectStatus,
    updatedBy: string
  ): Promise<void> {
    try {
      await updateDoc(
        doc(this.firestore, this.parentCollection, blueprintId, this.warrantiesCollection, warrantyId, this.defectsCollection, defectId),
        {
          status,
          updatedBy,
          updatedAt: serverTimestamp()
        }
      );
      this.logger.info('[WarrantyDefectRepository]', `Updated defect ${defectId} status to ${status}`);
    } catch (error) {
      this.logger.error('[WarrantyDefectRepository]', 'updateStatus failed', error as Error);
      throw error;
    }
  }

  /**
   * 刪除缺失記錄
   */
  async delete(blueprintId: string, warrantyId: string, defectId: string): Promise<void> {
    try {
      await deleteDoc(
        doc(this.firestore, this.parentCollection, blueprintId, this.warrantiesCollection, warrantyId, this.defectsCollection, defectId)
      );
      this.logger.info('[WarrantyDefectRepository]', `Deleted defect ${defectId}`);
    } catch (error) {
      this.logger.error('[WarrantyDefectRepository]', 'delete failed', error as Error);
      throw error;
    }
  }

  /**
   * 取得缺失記錄 by ID
   */
  async getById(blueprintId: string, warrantyId: string, defectId: string): Promise<WarrantyDefect | null> {
    try {
      const snapshot = await getDoc(
        doc(this.firestore, this.parentCollection, blueprintId, this.warrantiesCollection, warrantyId, this.defectsCollection, defectId)
      );
      return snapshot.exists() ? this.toDefect(snapshot.data(), snapshot.id) : null;
    } catch (error) {
      this.logger.error('[WarrantyDefectRepository]', 'getById failed', error as Error);
      return null;
    }
  }

  /**
   * 取得保固的所有缺失記錄
   */
  async getByWarrantyId(blueprintId: string, warrantyId: string): Promise<WarrantyDefect[]> {
    try {
      const col = this.getDefectsCollection(blueprintId, warrantyId);
      const q = query(col, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => this.toDefect(docSnap.data(), docSnap.id));
    } catch (error) {
      this.logger.error('[WarrantyDefectRepository]', 'getByWarrantyId failed', error as Error);
      return [];
    }
  }

  /**
   * 取得保固的缺失記錄（即時更新）
   */
  getByWarrantyId$(blueprintId: string, warrantyId: string): Observable<WarrantyDefect[]> {
    const col = this.getDefectsCollection(blueprintId, warrantyId);
    const q = query(col, orderBy('createdAt', 'desc'));

    return collectionData(q, { idField: 'id' }).pipe(
      map(docs => docs.map(data => this.toDefect(data as Record<string, unknown>, (data as Record<string, string>)['id']))),
      catchError(error => {
        this.logger.error('[WarrantyDefectRepository]', 'getByWarrantyId$ failed', error as Error);
        return of([]);
      })
    );
  }

  /**
   * 取得未結案的缺失記錄
   */
  async getOpenDefects(blueprintId: string, warrantyId: string): Promise<WarrantyDefect[]> {
    try {
      const col = this.getDefectsCollection(blueprintId, warrantyId);
      const q = query(
        col,
        where('status', 'in', ['reported', 'confirmed', 'under_repair', 'repaired']),
        orderBy('severity', 'desc'),
        orderBy('createdAt', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => this.toDefect(docSnap.data(), docSnap.id));
    } catch (error) {
      this.logger.error('[WarrantyDefectRepository]', 'getOpenDefects failed', error as Error);
      return [];
    }
  }

  /**
   * 取得指定狀態的缺失記錄
   */
  async getByStatus(blueprintId: string, warrantyId: string, statuses: WarrantyDefectStatus[]): Promise<WarrantyDefect[]> {
    try {
      const col = this.getDefectsCollection(blueprintId, warrantyId);
      const q = query(col, where('status', 'in', statuses), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => this.toDefect(docSnap.data(), docSnap.id));
    } catch (error) {
      this.logger.error('[WarrantyDefectRepository]', 'getByStatus failed', error as Error);
      return [];
    }
  }

  /**
   * 取得指定嚴重程度的缺失記錄
   */
  async getBySeverity(blueprintId: string, warrantyId: string, severity: WarrantyDefect['severity']): Promise<WarrantyDefect[]> {
    try {
      const col = this.getDefectsCollection(blueprintId, warrantyId);
      const q = query(col, where('severity', '==', severity), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => this.toDefect(docSnap.data(), docSnap.id));
    } catch (error) {
      this.logger.error('[WarrantyDefectRepository]', 'getBySeverity failed', error as Error);
      return [];
    }
  }
}
