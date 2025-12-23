/**
 * Warranty Repair Repository - 保固維修資料存取層
 *
 * SETC-033: Warranty Repository Implementation
 *
 * Collection path: blueprints/{blueprintId}/warranties/{warrantyId}/repairs/{repairId}
 *
 * @module WarrantyRepairRepository
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

import type {
  WarrantyRepair,
  RepairStatus,
  CreateRepairOptions,
  UpdateRepairOptions,
  CompleteRepairOptions,
  VerifyRepairOptions
} from '../models/warranty-repair.model';

@Injectable({ providedIn: 'root' })
export class WarrantyRepairRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly parentCollection = 'blueprints';
  private readonly warrantiesCollection = 'warranties';
  private readonly repairsCollection = 'repairs';

  /**
   * 取得維修 Collection 參考
   */
  private getRepairsCollection(blueprintId: string, warrantyId: string): CollectionReference {
    return collection(this.firestore, this.parentCollection, blueprintId, this.warrantiesCollection, warrantyId, this.repairsCollection);
  }

  /**
   * 轉換 Firestore 資料為 WarrantyRepair 型別
   */
  private toRepair(data: Record<string, unknown>, id: string): WarrantyRepair {
    return {
      id,
      warrantyId: (data['warrantyId'] as string) || '',
      defectId: (data['defectId'] as string) || '',
      blueprintId: (data['blueprintId'] as string) || '',
      repairNumber: (data['repairNumber'] as string) || '',
      description: (data['description'] as string) || '',
      repairMethod: (data['repairMethod'] as string) || '',
      contractor: (data['contractor'] as WarrantyRepair['contractor']) || {
        id: '',
        name: '',
        contactName: '',
        contactPhone: '',
        contactEmail: '',
        address: ''
      },
      assignedWorkers: (data['assignedWorkers'] as string[]) || [],
      scheduledDate: this.toOptionalDate(data['scheduledDate']),
      startedDate: this.toOptionalDate(data['startedDate']),
      completedDate: this.toOptionalDate(data['completedDate']),
      verifiedDate: this.toOptionalDate(data['verifiedDate']),
      status: (data['status'] as RepairStatus) || 'pending',
      cost: data['cost'] as number | undefined,
      costResponsibility: (data['costResponsibility'] as WarrantyRepair['costResponsibility']) || 'warrantor',
      completionPhotos: (data['completionPhotos'] as WarrantyRepair['completionPhotos']) || [],
      completionNotes: data['completionNotes'] as string | undefined,
      verifiedBy: data['verifiedBy'] as string | undefined,
      verificationNotes: data['verificationNotes'] as string | undefined,
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
   * 轉換 Firestore Timestamp 或 Date 為可選 Date
   */
  private toOptionalDate(value: unknown): Date | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    if (value instanceof Timestamp) {
      return value.toDate();
    }
    if (value instanceof Date) {
      return value;
    }
    return undefined;
  }

  /**
   * 產生維修編號
   */
  private generateRepairNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RPR-${year}${month}-${random}`;
  }

  /**
   * 建立維修記錄
   */
  async create(blueprintId: string, warrantyId: string, options: CreateRepairOptions): Promise<WarrantyRepair> {
    const docData = {
      warrantyId,
      defectId: options.defectId,
      blueprintId,
      repairNumber: this.generateRepairNumber(),
      description: options.description,
      repairMethod: options.repairMethod ?? '',
      contractor: options.contractor,
      assignedWorkers: [],
      status: 'pending' as RepairStatus,
      costResponsibility: options.costResponsibility ?? 'warrantor',
      completionPhotos: [],
      createdBy: options.createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    try {
      const col = this.getRepairsCollection(blueprintId, warrantyId);
      const docRef = await addDoc(col, docData);
      this.logger.info('[WarrantyRepairRepository]', `Created repair ${docRef.id}`);

      const snapshot = await getDoc(docRef);
      return snapshot.exists() ? this.toRepair(snapshot.data(), snapshot.id) : this.toRepair(docData as Record<string, unknown>, docRef.id);
    } catch (error) {
      this.logger.error('[WarrantyRepairRepository]', 'create failed', error as Error);
      throw error;
    }
  }

  /**
   * 更新維修記錄
   */
  async update(blueprintId: string, warrantyId: string, repairId: string, options: UpdateRepairOptions): Promise<void> {
    const updateData: Record<string, unknown> = {
      updatedBy: options.updatedBy,
      updatedAt: serverTimestamp()
    };

    if (options.description !== undefined) updateData['description'] = options.description;
    if (options.repairMethod !== undefined) updateData['repairMethod'] = options.repairMethod;
    if (options.assignedWorkers !== undefined) updateData['assignedWorkers'] = options.assignedWorkers;
    if (options.scheduledDate !== undefined) updateData['scheduledDate'] = Timestamp.fromDate(options.scheduledDate);
    if (options.cost !== undefined) updateData['cost'] = options.cost;
    if (options.costResponsibility !== undefined) updateData['costResponsibility'] = options.costResponsibility;

    try {
      await updateDoc(
        doc(this.firestore, this.parentCollection, blueprintId, this.warrantiesCollection, warrantyId, this.repairsCollection, repairId),
        updateData
      );
      this.logger.info('[WarrantyRepairRepository]', `Updated repair ${repairId}`);
    } catch (error) {
      this.logger.error('[WarrantyRepairRepository]', 'update failed', error as Error);
      throw error;
    }
  }

  /**
   * 更新維修狀態
   */
  async updateStatus(blueprintId: string, warrantyId: string, repairId: string, status: RepairStatus, updatedBy: string): Promise<void> {
    const updateData: Record<string, unknown> = {
      status,
      updatedBy,
      updatedAt: serverTimestamp()
    };

    // 根據狀態設置相應的時間戳
    if (status === 'in_progress') {
      updateData['startedDate'] = serverTimestamp();
    } else if (status === 'completed') {
      updateData['completedDate'] = serverTimestamp();
    } else if (status === 'verified') {
      updateData['verifiedDate'] = serverTimestamp();
    }

    try {
      await updateDoc(
        doc(this.firestore, this.parentCollection, blueprintId, this.warrantiesCollection, warrantyId, this.repairsCollection, repairId),
        updateData
      );
      this.logger.info('[WarrantyRepairRepository]', `Updated repair ${repairId} status to ${status}`);
    } catch (error) {
      this.logger.error('[WarrantyRepairRepository]', 'updateStatus failed', error as Error);
      throw error;
    }
  }

  /**
   * 完成維修
   */
  async complete(blueprintId: string, warrantyId: string, repairId: string, options: CompleteRepairOptions): Promise<void> {
    const updateData: Record<string, unknown> = {
      status: 'completed' as RepairStatus,
      completedDate: serverTimestamp(),
      updatedBy: options.updatedBy,
      updatedAt: serverTimestamp()
    };

    if (options.completionPhotos !== undefined) {
      updateData['completionPhotos'] = options.completionPhotos;
    }
    if (options.completionNotes !== undefined) {
      updateData['completionNotes'] = options.completionNotes;
    }

    try {
      await updateDoc(
        doc(this.firestore, this.parentCollection, blueprintId, this.warrantiesCollection, warrantyId, this.repairsCollection, repairId),
        updateData
      );
      this.logger.info('[WarrantyRepairRepository]', `Completed repair ${repairId}`);
    } catch (error) {
      this.logger.error('[WarrantyRepairRepository]', 'complete failed', error as Error);
      throw error;
    }
  }

  /**
   * 驗收維修
   */
  async verify(blueprintId: string, warrantyId: string, repairId: string, options: VerifyRepairOptions): Promise<void> {
    const status: RepairStatus = options.passed ? 'verified' : 'failed';
    const updateData: Record<string, unknown> = {
      status,
      verifiedBy: options.verifiedBy,
      verifiedDate: serverTimestamp(),
      updatedBy: options.verifiedBy,
      updatedAt: serverTimestamp()
    };

    if (options.verificationNotes !== undefined) {
      updateData['verificationNotes'] = options.verificationNotes;
    }

    try {
      await updateDoc(
        doc(this.firestore, this.parentCollection, blueprintId, this.warrantiesCollection, warrantyId, this.repairsCollection, repairId),
        updateData
      );
      this.logger.info('[WarrantyRepairRepository]', `Verified repair ${repairId} - ${options.passed ? 'passed' : 'failed'}`);
    } catch (error) {
      this.logger.error('[WarrantyRepairRepository]', 'verify failed', error as Error);
      throw error;
    }
  }

  /**
   * 刪除維修記錄
   */
  async delete(blueprintId: string, warrantyId: string, repairId: string): Promise<void> {
    try {
      await deleteDoc(
        doc(this.firestore, this.parentCollection, blueprintId, this.warrantiesCollection, warrantyId, this.repairsCollection, repairId)
      );
      this.logger.info('[WarrantyRepairRepository]', `Deleted repair ${repairId}`);
    } catch (error) {
      this.logger.error('[WarrantyRepairRepository]', 'delete failed', error as Error);
      throw error;
    }
  }

  /**
   * 取得維修記錄 by ID
   */
  async getById(blueprintId: string, warrantyId: string, repairId: string): Promise<WarrantyRepair | null> {
    try {
      const snapshot = await getDoc(
        doc(this.firestore, this.parentCollection, blueprintId, this.warrantiesCollection, warrantyId, this.repairsCollection, repairId)
      );
      return snapshot.exists() ? this.toRepair(snapshot.data(), snapshot.id) : null;
    } catch (error) {
      this.logger.error('[WarrantyRepairRepository]', 'getById failed', error as Error);
      return null;
    }
  }

  /**
   * 取得缺失對應的維修記錄
   */
  async getByDefectId(blueprintId: string, warrantyId: string, defectId: string): Promise<WarrantyRepair | null> {
    try {
      const col = this.getRepairsCollection(blueprintId, warrantyId);
      const q = query(col, where('defectId', '==', defectId));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return this.toRepair(snapshot.docs[0].data(), snapshot.docs[0].id);
    } catch (error) {
      this.logger.error('[WarrantyRepairRepository]', 'getByDefectId failed', error as Error);
      return null;
    }
  }

  /**
   * 取得保固的所有維修記錄
   */
  async getByWarrantyId(blueprintId: string, warrantyId: string): Promise<WarrantyRepair[]> {
    try {
      const col = this.getRepairsCollection(blueprintId, warrantyId);
      const q = query(col, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => this.toRepair(docSnap.data(), docSnap.id));
    } catch (error) {
      this.logger.error('[WarrantyRepairRepository]', 'getByWarrantyId failed', error as Error);
      return [];
    }
  }

  /**
   * 取得保固的維修記錄（即時更新）
   */
  getByWarrantyId$(blueprintId: string, warrantyId: string): Observable<WarrantyRepair[]> {
    const col = this.getRepairsCollection(blueprintId, warrantyId);
    const q = query(col, orderBy('createdAt', 'desc'));

    return collectionData(q, { idField: 'id' }).pipe(
      map(docs => docs.map(data => this.toRepair(data as Record<string, unknown>, (data as Record<string, string>)['id']))),
      catchError(error => {
        this.logger.error('[WarrantyRepairRepository]', 'getByWarrantyId$ failed', error as Error);
        return of([]);
      })
    );
  }

  /**
   * 取得進行中的維修記錄
   */
  async getActiveRepairs(blueprintId: string, warrantyId: string): Promise<WarrantyRepair[]> {
    try {
      const col = this.getRepairsCollection(blueprintId, warrantyId);
      const q = query(col, where('status', 'in', ['pending', 'scheduled', 'in_progress']), orderBy('scheduledDate', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => this.toRepair(docSnap.data(), docSnap.id));
    } catch (error) {
      this.logger.error('[WarrantyRepairRepository]', 'getActiveRepairs failed', error as Error);
      return [];
    }
  }

  /**
   * 取得指定狀態的維修記錄
   */
  async getByStatus(blueprintId: string, warrantyId: string, statuses: RepairStatus[]): Promise<WarrantyRepair[]> {
    try {
      const col = this.getRepairsCollection(blueprintId, warrantyId);
      const q = query(col, where('status', 'in', statuses), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => this.toRepair(docSnap.data(), docSnap.id));
    } catch (error) {
      this.logger.error('[WarrantyRepairRepository]', 'getByStatus failed', error as Error);
      return [];
    }
  }
}
