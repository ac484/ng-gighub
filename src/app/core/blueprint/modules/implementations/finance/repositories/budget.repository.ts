/**
 * Budget Repository - 預算資料存取層
 *
 * SETC-066: Budget Management Service
 *
 * Collection path: blueprints/{blueprintId}/budgets/{budgetId}
 *
 * @module BudgetRepository
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
  QueryConstraint
} from '@angular/fire/firestore';
import { LoggerService } from '@core';
import { Observable, from, map, catchError, of } from 'rxjs';

import type {
  Budget,
  BudgetItem,
  BudgetStatus,
  BudgetCategory,
  CreateBudgetDto,
  UpdateBudgetDto,
  BudgetQueryOptions
} from '../models/budget.model';

@Injectable({ providedIn: 'root' })
export class BudgetRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly parentCollection = 'blueprints';
  private readonly subcollectionName = 'budgets';

  /**
   * 取得預算 Collection 參考
   */
  private getBudgetCollection(blueprintId: string): CollectionReference {
    return collection(this.firestore, this.parentCollection, blueprintId, this.subcollectionName);
  }

  /**
   * 轉換 Firestore 文檔為 Budget 模型
   */
  private toBudget(data: Record<string, unknown>, id: string): Budget {
    return {
      id,
      blueprintId: (data['blueprintId'] as string) || '',
      budgetNumber: (data['budgetNumber'] as string) || '',
      name: (data['name'] as string) || '',
      description: data['description'] as string | undefined,
      category: (data['category'] as BudgetCategory) || 'other',
      fiscalYear: Number(data['fiscalYear']) || new Date().getFullYear(),
      totalAmount: Number(data['totalAmount']) || 0,
      allocatedAmount: Number(data['allocatedAmount']) || 0,
      spentAmount: Number(data['spentAmount']) || 0,
      remainingAmount: Number(data['remainingAmount']) || 0,
      items: (data['items'] as BudgetItem[]) || [],
      status: (data['status'] as BudgetStatus) || 'draft',
      utilizationRate: Number(data['utilizationRate']) || 0,
      warningThreshold: Number(data['warningThreshold']) || 80,
      criticalThreshold: Number(data['criticalThreshold']) || 95,
      startDate: data['startDate'] instanceof Timestamp ? (data['startDate'] as Timestamp).toDate() : new Date(data['startDate'] as string),
      endDate: data['endDate'] instanceof Timestamp ? (data['endDate'] as Timestamp).toDate() : new Date(data['endDate'] as string),
      createdBy: (data['createdBy'] as string) || '',
      createdAt: data['createdAt'] instanceof Timestamp ? (data['createdAt'] as Timestamp).toDate() : new Date(data['createdAt'] as string),
      updatedAt: data['updatedAt'] instanceof Timestamp ? (data['updatedAt'] as Timestamp).toDate() : new Date(data['updatedAt'] as string)
    };
  }

  /**
   * 依藍圖 ID 查詢預算
   */
  findByBlueprintId(blueprintId: string, options?: BudgetQueryOptions): Observable<Budget[]> {
    const constraints: QueryConstraint[] = [];

    if (options?.category) {
      constraints.push(where('category', '==', options.category));
    }
    if (options?.status) {
      constraints.push(where('status', '==', options.status));
    }
    if (options?.fiscalYear) {
      constraints.push(where('fiscalYear', '==', options.fiscalYear));
    }

    const sortField = options?.orderBy || 'createdAt';
    const sortDir = options?.orderDirection || 'desc';
    constraints.push(orderBy(sortField, sortDir));

    if (options?.limit) {
      constraints.push(limit(options.limit));
    }

    const q = query(this.getBudgetCollection(blueprintId), ...constraints);

    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(docSnap => this.toBudget(docSnap.data(), docSnap.id))),
      catchError(error => {
        this.logger.error('[BudgetRepository]', 'findByBlueprintId failed', error as Error);
        return of([]);
      })
    );
  }

  /**
   * 依 ID 查詢預算
   */
  findById(blueprintId: string, budgetId: string): Observable<Budget | null> {
    const docRef = doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, budgetId);

    return from(getDoc(docRef)).pipe(
      map(snapshot => (snapshot.exists() ? this.toBudget(snapshot.data(), snapshot.id) : null)),
      catchError(error => {
        this.logger.error('[BudgetRepository]', 'findById failed', error as Error);
        return of(null);
      })
    );
  }

  /**
   * 建立預算
   */
  async create(blueprintId: string, data: CreateBudgetDto): Promise<Budget> {
    const now = Timestamp.now();
    const budgetNumber = await this.generateBudgetNumber(blueprintId);

    // 計算項目金額
    const items: BudgetItem[] = (data.items || []).map((item, index) => ({
      id: `item-${Date.now()}-${index}`,
      code: item.code,
      name: item.name,
      description: item.description,
      budgetAmount: item.budgetAmount,
      spentAmount: 0,
      remainingAmount: item.budgetAmount,
      category: item.category
    }));

    const totalAmount = items.reduce((sum, item) => sum + item.budgetAmount, 0);

    const budgetData = {
      blueprintId,
      budgetNumber,
      name: data.name,
      description: data.description || '',
      category: data.category,
      fiscalYear: data.fiscalYear,
      totalAmount,
      allocatedAmount: totalAmount,
      spentAmount: 0,
      remainingAmount: totalAmount,
      items,
      status: 'active' as BudgetStatus,
      utilizationRate: 0,
      warningThreshold: data.warningThreshold || 80,
      criticalThreshold: data.criticalThreshold || 95,
      startDate: Timestamp.fromDate(data.startDate),
      endDate: Timestamp.fromDate(data.endDate),
      createdBy: data.createdBy,
      createdAt: now,
      updatedAt: now
    };

    try {
      const docRef = await addDoc(this.getBudgetCollection(blueprintId), budgetData);
      this.logger.info('[BudgetRepository]', `Budget created: ${docRef.id}`);

      return {
        id: docRef.id,
        ...budgetData,
        startDate: data.startDate,
        endDate: data.endDate,
        createdAt: now.toDate(),
        updatedAt: now.toDate()
      } as Budget;
    } catch (error) {
      this.logger.error('[BudgetRepository]', 'create failed', error as Error);
      throw error;
    }
  }

  /**
   * 更新預算
   */
  async update(blueprintId: string, budgetId: string, data: UpdateBudgetDto): Promise<void> {
    const docRef = doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, budgetId);

    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: Timestamp.now()
    };

    if (data.endDate) {
      updateData['endDate'] = Timestamp.fromDate(data.endDate);
    }

    try {
      await updateDoc(docRef, updateData);
      this.logger.info('[BudgetRepository]', `Budget updated: ${budgetId}`);
    } catch (error) {
      this.logger.error('[BudgetRepository]', 'update failed', error as Error);
      throw error;
    }
  }

  /**
   * 更新預算項目和金額
   */
  async updateBudgetAmounts(
    blueprintId: string,
    budgetId: string,
    updates: {
      spentAmount: number;
      remainingAmount: number;
      utilizationRate: number;
      items: BudgetItem[];
    }
  ): Promise<void> {
    const docRef = doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, budgetId);

    try {
      await updateDoc(docRef, {
        spentAmount: updates.spentAmount,
        remainingAmount: updates.remainingAmount,
        utilizationRate: updates.utilizationRate,
        items: updates.items,
        updatedAt: Timestamp.now()
      });
      this.logger.info('[BudgetRepository]', `Budget amounts updated: ${budgetId}`);
    } catch (error) {
      this.logger.error('[BudgetRepository]', 'updateBudgetAmounts failed', error as Error);
      throw error;
    }
  }

  /**
   * 刪除預算
   */
  async delete(blueprintId: string, budgetId: string): Promise<void> {
    const docRef = doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, budgetId);

    try {
      await deleteDoc(docRef);
      this.logger.info('[BudgetRepository]', `Budget deleted: ${budgetId}`);
    } catch (error) {
      this.logger.error('[BudgetRepository]', 'delete failed', error as Error);
      throw error;
    }
  }

  /**
   * 同步查詢預算 (Promise 版本)
   */
  async findByBlueprint(blueprintId: string, options?: BudgetQueryOptions): Promise<Budget[]> {
    const constraints: QueryConstraint[] = [];

    if (options?.category) {
      constraints.push(where('category', '==', options.category));
    }
    if (options?.status) {
      constraints.push(where('status', '==', options.status));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    if (options?.limit) {
      constraints.push(limit(options.limit));
    }

    const q = query(this.getBudgetCollection(blueprintId), ...constraints);

    try {
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => this.toBudget(docSnap.data(), docSnap.id));
    } catch (error) {
      this.logger.error('[BudgetRepository]', 'findByBlueprint failed', error as Error);
      return [];
    }
  }

  /**
   * 生成預算編號
   */
  private async generateBudgetNumber(blueprintId: string): Promise<string> {
    const budgets = await this.findByBlueprint(blueprintId);
    const count = budgets.length + 1;
    const year = new Date().getFullYear();
    return `BUD-${year}-${String(count).padStart(4, '0')}`;
  }
}
