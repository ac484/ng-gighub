# SETC-066: Budget Management Service

> **任務編號**: SETC-066  
> **模組**: Finance Module (財務模組)  
> **優先級**: P1 (Important)  
> **預估工時**: 2 天  
> **依賴**: SETC-063  
> **狀態**: 📋 待開始

---

## 📋 任務概述

### 目標
實作預算管理服務，支援預算編列、預算追蹤、預算控管和預算預警。

### 範圍
- 預算項目建立與編輯
- 預算執行追蹤
- 預算控管機制
- 預算變更管理
- 預算預警通知

---

## 🏗️ 技術實作

### 服務介面

```typescript
import { Observable } from 'rxjs';

export interface IBudgetService {
  // CRUD
  createBudget(data: CreateBudgetInput): Promise<Budget>;
  updateBudget(id: string, data: UpdateBudgetInput): Promise<Budget>;
  deleteBudget(id: string): Promise<void>;
  
  // 預算項目
  addBudgetItem(budgetId: string, item: BudgetItem): Promise<Budget>;
  updateBudgetItem(budgetId: string, itemId: string, data: Partial<BudgetItem>): Promise<Budget>;
  removeBudgetItem(budgetId: string, itemId: string): Promise<Budget>;
  
  // 預算變更
  requestBudgetChange(budgetId: string, change: BudgetChangeRequest): Promise<BudgetChange>;
  approveBudgetChange(changeId: string): Promise<BudgetChange>;
  rejectBudgetChange(changeId: string, reason: string): Promise<BudgetChange>;
  
  // 執行追蹤
  recordExpense(budgetId: string, expense: ExpenseRecord): Promise<Budget>;
  getExpensesByBudget(budgetId: string): Promise<ExpenseRecord[]>;
  
  // 查詢
  getBudget(id: string): Promise<Budget | null>;
  getBudgetsByBlueprint(blueprintId: string): Observable<Budget[]>;
  getBudgetSummary(blueprintId: string): Promise<BudgetSummary>;
  
  // 預警
  checkBudgetAlerts(blueprintId: string): Promise<BudgetAlert[]>;
  setBudgetThreshold(budgetId: string, threshold: BudgetThreshold): Promise<Budget>;
}

export interface Budget {
  id: string;
  blueprintId: string;
  budgetNumber: string;
  
  // 基本資訊
  name: string;
  description?: string;
  category: BudgetCategory;
  fiscalYear: number;
  
  // 金額
  totalAmount: number;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  
  // 項目
  items: BudgetItem[];
  
  // 狀態
  status: BudgetStatus;
  utilizationRate: number;
  
  // 閾值
  warningThreshold: number; // 預警閾值 (%)
  criticalThreshold: number; // 警示閾值 (%)
  
  // 期間
  startDate: Date;
  endDate: Date;
  
  // 審計
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  category?: string;
}

export interface BudgetSummary {
  blueprintId: string;
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  overallUtilization: number;
  byCategory: Record<string, CategoryBudget>;
  alerts: BudgetAlert[];
}

export interface BudgetAlert {
  budgetId: string;
  budgetName: string;
  alertType: 'warning' | 'critical' | 'exceeded';
  utilizationRate: number;
  message: string;
}
```

### 服務實作

```typescript
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BudgetRepository } from '../repositories/budget.repository';
import { IEventBus } from '@core/blueprint/platform/event-bus';
import { 
  IBudgetService,
  Budget,
  CreateBudgetInput,
  BudgetSummary,
  BudgetAlert,
  ExpenseRecord
} from './budget.interface';

@Injectable({ providedIn: 'root' })
export class BudgetService implements IBudgetService {
  private repository = inject(BudgetRepository);
  private eventBus = inject(IEventBus);

  /**
   * 建立預算
   */
  async createBudget(data: CreateBudgetInput): Promise<Budget> {
    const budgetNumber = await this.generateBudgetNumber(data.blueprintId);
    
    const totalAmount = data.items?.reduce((sum, item) => sum + item.budgetAmount, 0) || 0;
    
    const budget = await this.repository.create({
      ...data,
      budgetNumber,
      totalAmount,
      allocatedAmount: totalAmount,
      spentAmount: 0,
      remainingAmount: totalAmount,
      utilizationRate: 0,
      status: 'active',
      warningThreshold: data.warningThreshold || 80,
      criticalThreshold: data.criticalThreshold || 95
    });
    
    this.eventBus.emit('budget.created', {
      budgetId: budget.id,
      blueprintId: budget.blueprintId,
      totalAmount: budget.totalAmount,
      timestamp: new Date()
    });
    
    return budget;
  }

  /**
   * 記錄支出
   */
  async recordExpense(budgetId: string, expense: ExpenseRecord): Promise<Budget> {
    const budget = await this.repository.findById(budgetId);
    if (!budget) {
      throw new Error(`Budget ${budgetId} not found`);
    }
    
    // 檢查是否超出預算
    const newSpentAmount = budget.spentAmount + expense.amount;
    if (newSpentAmount > budget.totalAmount) {
      this.eventBus.emit('budget.exceeded', {
        budgetId,
        budgetName: budget.name,
        excessAmount: newSpentAmount - budget.totalAmount,
        timestamp: new Date()
      });
    }
    
    const newRemainingAmount = budget.totalAmount - newSpentAmount;
    const utilizationRate = Math.round((newSpentAmount / budget.totalAmount) * 100);
    
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
    
    const updated = await this.repository.update(budgetId, {
      spentAmount: newSpentAmount,
      remainingAmount: newRemainingAmount,
      utilizationRate,
      items
    });
    
    // 檢查預警
    await this.checkAndEmitAlerts(updated);
    
    this.eventBus.emit('budget.expense_recorded', {
      budgetId,
      expenseAmount: expense.amount,
      newUtilization: utilizationRate,
      timestamp: new Date()
    });
    
    return updated;
  }

  /**
   * 取得預算摘要
   */
  async getBudgetSummary(blueprintId: string): Promise<BudgetSummary> {
    const budgets = await this.repository.findByBlueprint(blueprintId);
    
    const totalBudget = budgets.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
    const totalRemaining = budgets.reduce((sum, b) => sum + b.remainingAmount, 0);
    const overallUtilization = totalBudget > 0 
      ? Math.round((totalSpent / totalBudget) * 100) 
      : 0;
    
    // 按類別統計
    const byCategory: Record<string, any> = {};
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

  // ============ Private Methods ============

  private async generateBudgetNumber(blueprintId: string): Promise<string> {
    const budgets = await this.repository.findByBlueprint(blueprintId);
    const count = budgets.length + 1;
    const year = new Date().getFullYear();
    return `BUD-${year}-${String(count).padStart(4, '0')}`;
  }

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
```

---

## ✅ 交付物

- [ ] `budget.service.ts`
- [ ] `budget.interface.ts`
- [ ] `budget.service.spec.ts`
- [ ] 更新 `index.ts` 匯出

---

## 🎯 驗收標準

1. ✅ 預算 CRUD 功能完整
2. ✅ 預算追蹤計算正確
3. ✅ 預警機制運作正常
4. ✅ 預算變更流程完整
5. ✅ 事件正確發送
6. ✅ 單元測試覆蓋率 >80%

---

**文件版本**: 1.0.0  
**建立日期**: 2025-12-15  
**最後更新**: 2025-12-15
