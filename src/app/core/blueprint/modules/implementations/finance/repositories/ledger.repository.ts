/**
 * Ledger Repository - 帳務資料存取層
 *
 * SETC-067: Ledger & Accounting Service
 *
 * Collection path: blueprints/{blueprintId}/ledger_entries/{entryId}
 *
 * @module LedgerRepository
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

import type {
  LedgerEntry,
  LedgerLine,
  LedgerSourceType,
  LedgerEntryStatus,
  CreateLedgerEntryDto,
  LedgerQueryOptions
} from '../models/ledger.model';

@Injectable({ providedIn: 'root' })
export class LedgerRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly parentCollection = 'blueprints';
  private readonly subcollectionName = 'ledger_entries';

  /**
   * 取得分錄 Collection 參考
   */
  private getLedgerCollection(blueprintId: string): CollectionReference {
    return collection(this.firestore, this.parentCollection, blueprintId, this.subcollectionName);
  }

  /**
   * 轉換 Firestore 文檔為 LedgerEntry 模型
   */
  private toLedgerEntry(data: Record<string, unknown>, id: string): LedgerEntry {
    return {
      id,
      blueprintId: (data['blueprintId'] as string) || '',
      entryNumber: (data['entryNumber'] as string) || '',
      entryDate: data['entryDate'] instanceof Timestamp ? (data['entryDate'] as Timestamp).toDate() : new Date(data['entryDate'] as string),
      description: (data['description'] as string) || '',
      reference: data['reference'] as string | undefined,
      sourceType: (data['sourceType'] as LedgerSourceType) || 'manual',
      sourceId: data['sourceId'] as string | undefined,
      lines: (data['lines'] as LedgerLine[]) || [],
      totalDebit: Number(data['totalDebit']) || 0,
      totalCredit: Number(data['totalCredit']) || 0,
      isBalanced: Boolean(data['isBalanced']),
      status: (data['status'] as LedgerEntryStatus) || 'draft',
      postedAt:
        data['postedAt'] instanceof Timestamp
          ? (data['postedAt'] as Timestamp).toDate()
          : data['postedAt']
            ? new Date(data['postedAt'] as string)
            : undefined,
      fiscalYear: Number(data['fiscalYear']) || new Date().getFullYear(),
      fiscalPeriod: Number(data['fiscalPeriod']) || new Date().getMonth() + 1,
      createdBy: (data['createdBy'] as string) || '',
      createdAt: data['createdAt'] instanceof Timestamp ? (data['createdAt'] as Timestamp).toDate() : new Date(data['createdAt'] as string)
    };
  }

  /**
   * 依藍圖 ID 查詢分錄
   */
  findByBlueprintId(blueprintId: string, options?: LedgerQueryOptions): Observable<LedgerEntry[]> {
    const constraints: QueryConstraint[] = [];

    if (options?.sourceType) {
      constraints.push(where('sourceType', '==', options.sourceType));
    }
    if (options?.status) {
      constraints.push(where('status', '==', options.status));
    }
    if (options?.fiscalYear) {
      constraints.push(where('fiscalYear', '==', options.fiscalYear));
    }
    if (options?.fiscalPeriod) {
      constraints.push(where('fiscalPeriod', '==', options.fiscalPeriod));
    }

    const sortField = options?.orderBy || 'entryDate';
    const sortDir = options?.orderDirection || 'desc';
    constraints.push(orderBy(sortField, sortDir));

    if (options?.limit) {
      constraints.push(limit(options.limit));
    }

    const q = query(this.getLedgerCollection(blueprintId), ...constraints);

    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(docSnap => this.toLedgerEntry(docSnap.data(), docSnap.id))),
      catchError(error => {
        this.logger.error('[LedgerRepository]', 'findByBlueprintId failed', error as Error);
        return of([]);
      })
    );
  }

  /**
   * 依 ID 查詢分錄
   */
  findById(blueprintId: string, entryId: string): Observable<LedgerEntry | null> {
    const docRef = doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, entryId);

    return from(getDoc(docRef)).pipe(
      map(snapshot => (snapshot.exists() ? this.toLedgerEntry(snapshot.data(), snapshot.id) : null)),
      catchError(error => {
        this.logger.error('[LedgerRepository]', 'findById failed', error as Error);
        return of(null);
      })
    );
  }

  /**
   * 建立分錄
   */
  async create(blueprintId: string, data: CreateLedgerEntryDto): Promise<LedgerEntry> {
    const now = Timestamp.now();
    const entryNumber = await this.generateEntryNumber(blueprintId);
    const fiscalInfo = this.getFiscalPeriod(data.entryDate);

    // 計算借貸總額
    const lines: LedgerLine[] = data.lines.map((line, index) => ({
      id: `line-${Date.now()}-${index}`,
      accountCode: line.accountCode,
      accountName: line.accountName,
      debit: line.debit || 0,
      credit: line.credit || 0,
      description: line.description
    }));

    const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    const entryData = {
      blueprintId,
      entryNumber,
      entryDate: Timestamp.fromDate(data.entryDate),
      description: data.description,
      reference: data.reference || '',
      sourceType: data.sourceType,
      sourceId: data.sourceId || '',
      lines,
      totalDebit,
      totalCredit,
      isBalanced,
      status: 'posted' as LedgerEntryStatus,
      postedAt: now,
      fiscalYear: fiscalInfo.year,
      fiscalPeriod: fiscalInfo.period,
      createdBy: data.createdBy,
      createdAt: now
    };

    try {
      const docRef = await addDoc(this.getLedgerCollection(blueprintId), entryData);
      this.logger.info('[LedgerRepository]', `Ledger entry created: ${docRef.id}`);

      return {
        id: docRef.id,
        ...entryData,
        entryDate: data.entryDate,
        postedAt: now.toDate(),
        createdAt: now.toDate()
      } as LedgerEntry;
    } catch (error) {
      this.logger.error('[LedgerRepository]', 'create failed', error as Error);
      throw error;
    }
  }

  /**
   * 更新分錄狀態
   */
  async updateStatus(blueprintId: string, entryId: string, status: LedgerEntryStatus): Promise<void> {
    const docRef = doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, entryId);

    try {
      await updateDoc(docRef, { status });
      this.logger.info('[LedgerRepository]', `Ledger entry status updated: ${entryId} -> ${status}`);
    } catch (error) {
      this.logger.error('[LedgerRepository]', 'updateStatus failed', error as Error);
      throw error;
    }
  }

  /**
   * 同步查詢分錄 (Promise 版本)
   */
  async findByBlueprint(blueprintId: string, options?: LedgerQueryOptions): Promise<LedgerEntry[]> {
    const constraints: QueryConstraint[] = [];

    if (options?.sourceType) {
      constraints.push(where('sourceType', '==', options.sourceType));
    }
    if (options?.status) {
      constraints.push(where('status', '==', options.status));
    }

    constraints.push(orderBy('entryDate', 'desc'));

    if (options?.limit) {
      constraints.push(limit(options.limit));
    }

    const q = query(this.getLedgerCollection(blueprintId), ...constraints);

    try {
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => this.toLedgerEntry(docSnap.data(), docSnap.id));
    } catch (error) {
      this.logger.error('[LedgerRepository]', 'findByBlueprint failed', error as Error);
      return [];
    }
  }

  /**
   * 查詢指定期間的分錄
   */
  async findByPeriod(blueprintId: string, startDate: Date, endDate: Date): Promise<LedgerEntry[]> {
    const q = query(
      this.getLedgerCollection(blueprintId),
      where('entryDate', '>=', Timestamp.fromDate(startDate)),
      where('entryDate', '<=', Timestamp.fromDate(endDate)),
      orderBy('entryDate', 'asc')
    );

    try {
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => this.toLedgerEntry(docSnap.data(), docSnap.id));
    } catch (error) {
      this.logger.error('[LedgerRepository]', 'findByPeriod failed', error as Error);
      return [];
    }
  }

  /**
   * 依來源查詢分錄
   */
  async findBySource(blueprintId: string, sourceType: LedgerSourceType, sourceId: string): Promise<LedgerEntry[]> {
    const q = query(this.getLedgerCollection(blueprintId), where('sourceType', '==', sourceType), where('sourceId', '==', sourceId));

    try {
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => this.toLedgerEntry(docSnap.data(), docSnap.id));
    } catch (error) {
      this.logger.error('[LedgerRepository]', 'findBySource failed', error as Error);
      return [];
    }
  }

  /**
   * 生成分錄編號
   */
  private async generateEntryNumber(blueprintId: string): Promise<string> {
    const entries = await this.findByBlueprint(blueprintId, { limit: 1 });
    const count = entries.length + 1;
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    return `JE-${year}${month}-${String(count).padStart(5, '0')}`;
  }

  /**
   * 取得會計期間
   */
  private getFiscalPeriod(date: Date): { year: number; period: number } {
    return {
      year: date.getFullYear(),
      period: date.getMonth() + 1
    };
  }
}
