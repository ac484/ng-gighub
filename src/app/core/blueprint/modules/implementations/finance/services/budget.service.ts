/**
 * Budget Service
 *
 * SETC-066: Budget Management Service
 *
 * 提供預算管理功能，包括：
 * - 預算編列與分類
 * - 預算執行追蹤
 * - 預算預警機制
 * - 預算變更管理
 *
 * @module BudgetService
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import { Injectable, signal, inject } from '@angular/core';
import { LoggerService } from '@core';
import { lastValueFrom } from 'rxjs';

import { EnhancedEventBusService } from '../../../../events/enhanced-event-bus.service';
import type {
  Budget,
  BudgetSummary,
  BudgetAlert,
  BudgetThreshold,
  ExpenseRecord,
  CreateBudgetDto,
  UpdateBudgetDto,
  CategoryBudget
} from '../models/budget.model';
import { BudgetRepository } from '../repositories/budget.repository';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private readonly repository = inject(BudgetRepository);
  private readonly eventBus = inject(EnhancedEventBusService);
  private readonly logger = inject(LoggerService);

  // Signals
  data = signal<Budget[]>([]);
  loading = signal(false);
  error = signal<Error | null>(null);

  /**
   * Load data
   */
  async load(blueprintId: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const result = await lastValueFrom(this.repository.findByBlueprintId(blueprintId));
      this.data.set(result);
    } catch (err) {
      this.error.set(err as Error);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * 建立預算
   */
  async createBudget(data: CreateBudgetDto): Promise<Budget> {
    this.logger.info('[BudgetService]', `Creating budget: ${data.name}`);

    try {
      const budget = await this.repository.create(data.blueprintId, data);

      // 更新本地狀態
      this.data.update(budgets => [budget, ...budgets]);

      // 發送事件
      this.eventBus.emit('budget.created', {
        budgetId: budget.id,
        blueprintId: budget.blueprintId,
        totalAmount: budget.totalAmount,
        timestamp: new Date()
      });

      this.logger.info('[BudgetService]', `Budget created: ${budget.id}`);
      return budget;
    } catch (err) {
      this.logger.error('[BudgetService]', 'createBudget failed', err as Error);
      throw err;
    }
  }

  /**
   * 更新預算
   */
  async updateBudget(blueprintId: string, budgetId: string, data: UpdateBudgetDto): Promise<void> {
    this.logger.info('[BudgetService]', `Updating budget: ${budgetId}`);

    try {
      await this.repository.update(blueprintId, budgetId, data);

      // 更新本地狀態
      this.data.update(budgets => budgets.map(b => (b.id === budgetId ? { ...b, ...data, updatedAt: new Date() } : b)));

      this.eventBus.emit('budget.updated', {
        budgetId,
        blueprintId,
        timestamp: new Date()
      });

      this.logger.info('[BudgetService]', `Budget updated: ${budgetId}`);
    } catch (err) {
      this.logger.error('[BudgetService]', 'updateBudget failed', err as Error);
      throw err;
    }
  }

  /**
   * 記錄支出
   */
  async recordExpense(budgetId: string, expense: ExpenseRecord): Promise<Budget> {
    this.logger.info('[BudgetService]', `Recording expense for budget: ${budgetId}`);

    const budget = this.data().find(b => b.id === budgetId);
    if (!budget) {
      throw new Error(`Budget ${budgetId} not found`);
    }

    // 計算新的支出金額
    const newSpentAmount = budget.spentAmount + expense.amount;
    const newRemainingAmount = budget.totalAmount - newSpentAmount;
    const utilizationRate = budget.totalAmount > 0 ? Math.round((newSpentAmount / budget.totalAmount) * 100) : 0;

    // 檢查是否超出預算
    if (newSpentAmount > budget.totalAmount) {
      this.eventBus.emit('budget.exceeded', {
        budgetId,
        budgetName: budget.name,
        excessAmount: newSpentAmount - budget.totalAmount,
        timestamp: new Date()
      });
    }

    // 更新預算項目
    const items = budget.items.map(item => {
      if (item.id === expense.budgetItemId) {
        return {
          ...item,
          spentAmount: item.spentAmount + expense.amount,
          remainingAmount: item.budgetAmount - (item.spentAmount + expense.amount)
        };
      }
      return item;
    });

    // 更新 Repository
    await this.repository.updateBudgetAmounts(budget.blueprintId, budgetId, {
      spentAmount: newSpentAmount,
      remainingAmount: newRemainingAmount,
      utilizationRate,
      items
    });

    // 更新本地狀態
    const updatedBudget: Budget = {
      ...budget,
      spentAmount: newSpentAmount,
      remainingAmount: newRemainingAmount,
      utilizationRate,
      items,
      updatedAt: new Date()
    };

    this.data.update(budgets => budgets.map(b => (b.id === budgetId ? updatedBudget : b)));

    // 檢查並發送預警
    await this.checkAndEmitAlerts(updatedBudget);

    this.eventBus.emit('budget.expense_recorded', {
      budgetId,
      expenseAmount: expense.amount,
      newUtilization: utilizationRate,
      timestamp: new Date()
    });

    return updatedBudget;
  }

  /**
   * 取得預算摘要
   */
  async getBudgetSummary(blueprintId: string): Promise<BudgetSummary> {
    const budgets = await this.repository.findByBlueprint(blueprintId);

    const totalBudget = budgets.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
    const totalRemaining = budgets.reduce((sum, b) => sum + b.remainingAmount, 0);
    const overallUtilization = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    // 按類別統計
    const byCategory: Record<string, CategoryBudget> = {};
    for (const budget of budgets) {
      const category = budget.category || 'other';
      if (!byCategory[category]) {
        byCategory[category] = {
          totalBudget: 0,
          totalSpent: 0,
          totalRemaining: 0
        };
      }
      byCategory[category].totalBudget += budget.totalAmount;
      byCategory[category].totalSpent += budget.spentAmount;
      byCategory[category].totalRemaining += budget.remainingAmount;
    }

    // 取得預警
    const alerts = await this.checkBudgetAlerts(blueprintId);

    return {
      blueprintId,
      totalBudget,
      totalSpent,
      totalRemaining,
      overallUtilization,
      byCategory,
      alerts
    };
  }

  /**
   * 檢查預算預警
   */
  async checkBudgetAlerts(blueprintId: string): Promise<BudgetAlert[]> {
    const budgets = await this.repository.findByBlueprint(blueprintId);
    const alerts: BudgetAlert[] = [];

    for (const budget of budgets) {
      if (budget.utilizationRate >= 100) {
        alerts.push({
          budgetId: budget.id,
          budgetName: budget.name,
          alertType: 'exceeded',
          utilizationRate: budget.utilizationRate,
          message: `預算 "${budget.name}" 已超支`
        });
      } else if (budget.utilizationRate >= budget.criticalThreshold) {
        alerts.push({
          budgetId: budget.id,
          budgetName: budget.name,
          alertType: 'critical',
          utilizationRate: budget.utilizationRate,
          message: `預算 "${budget.name}" 已達警示閾值 (${budget.utilizationRate}%)`
        });
      } else if (budget.utilizationRate >= budget.warningThreshold) {
        alerts.push({
          budgetId: budget.id,
          budgetName: budget.name,
          alertType: 'warning',
          utilizationRate: budget.utilizationRate,
          message: `預算 "${budget.name}" 已達預警閾值 (${budget.utilizationRate}%)`
        });
      }
    }

    return alerts;
  }

  /**
   * 設定預算閾值
   */
  async setBudgetThreshold(blueprintId: string, budgetId: string, threshold: BudgetThreshold): Promise<void> {
    await this.repository.update(blueprintId, budgetId, {
      warningThreshold: threshold.warningThreshold,
      criticalThreshold: threshold.criticalThreshold
    } as UpdateBudgetDto);

    this.data.update(budgets => budgets.map(b => (b.id === budgetId ? { ...b, ...threshold, updatedAt: new Date() } : b)));
  }

  /**
   * 刪除預算
   */
  async deleteBudget(blueprintId: string, budgetId: string): Promise<void> {
    await this.repository.delete(blueprintId, budgetId);

    this.data.update(budgets => budgets.filter(b => b.id !== budgetId));

    this.eventBus.emit('budget.deleted', {
      budgetId,
      blueprintId,
      timestamp: new Date()
    });
  }

  /**
   * Clear state
   */
  clearState(): void {
    this.data.set([]);
    this.error.set(null);
  }

  // ============ Private Methods ============

  /**
   * 檢查並發送預警事件
   */
  private async checkAndEmitAlerts(budget: Budget): Promise<void> {
    if (budget.utilizationRate >= budget.criticalThreshold) {
      this.eventBus.emit('budget.critical_alert', {
        budgetId: budget.id,
        budgetName: budget.name,
        utilizationRate: budget.utilizationRate,
        timestamp: new Date()
      });
    } else if (budget.utilizationRate >= budget.warningThreshold) {
      this.eventBus.emit('budget.warning_alert', {
        budgetId: budget.id,
        budgetName: budget.name,
        utilizationRate: budget.utilizationRate,
        timestamp: new Date()
      });
    }
  }
}
