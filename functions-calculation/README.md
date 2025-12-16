# Functions Calculation Module

## 📋 概述

`functions-calculation` 模組負責處理複雜的計算邏輯和資料分析任務。提供專案進度計算、成本分析、統計報表生成等功能,支援工地施工管理的各種計算需求。

## 🎯 目標

- **精確計算**: 提供準確的專案進度和成本計算
- **效能最佳化**: 優化大量資料的計算效能
- **可擴展性**: 支援新增自訂計算邏輯
- **即時更新**: 提供即時的計算結果和統計資料

## 📦 核心功能

### 1. 專案進度計算 (Project Progress Calculation)

```typescript
import { onCall } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

export interface CalculateProgressRequest {
  projectId: string;
  includeSubTasks?: boolean;
}

export interface ProgressResult {
  projectId: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  progressPercentage: number;
  estimatedCompletion: Date | null;
}

export const calculateProjectProgress = onCall<CalculateProgressRequest>({
  region: 'asia-east1'
}, async (request) => {
  const { projectId, includeSubTasks = false } = request.data;

  logger.info('計算專案進度', { projectId, includeSubTasks });

  try {
    // 取得所有任務
    const tasksRef = admin.firestore()
      .collection('tasks')
      .where('projectId', '==', projectId);

    const snapshot = await tasksRef.get();
    
    let totalTasks = 0;
    let completedTasks = 0;
    let inProgressTasks = 0;
    let pendingTasks = 0;
    let overdueTasks = 0;
    const now = new Date();

    snapshot.docs.forEach(doc => {
      const task = doc.data();
      totalTasks++;

      switch (task.status) {
        case 'completed':
          completedTasks++;
          break;
        case 'in-progress':
          inProgressTasks++;
          break;
        case 'pending':
          pendingTasks++;
          break;
      }

      // 檢查是否逾期
      if (task.dueDate && new Date(task.dueDate) < now && task.status !== 'completed') {
        overdueTasks++;
      }
    });

    const progressPercentage = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100) 
      : 0;

    // 估算完成時間
    const estimatedCompletion = estimateCompletionDate(
      completedTasks,
      totalTasks,
      snapshot.docs.map(d => d.data())
    );

    const result: ProgressResult = {
      projectId,
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      overdueTasks,
      progressPercentage,
      estimatedCompletion
    };

    logger.info('專案進度計算完成', result);

    return result;
  } catch (error) {
    logger.error('專案進度計算失敗', error);
    throw new HttpsError('internal', '計算失敗');
  }
});

function estimateCompletionDate(
  completed: number,
  total: number,
  tasks: any[]
): Date | null {
  if (completed === 0) return null;

  // 計算平均完成速度
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const avgCompletionTime = calculateAverageCompletionTime(completedTasks);
  
  const remainingTasks = total - completed;
  const estimatedDays = remainingTasks * avgCompletionTime;
  
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + estimatedDays);
  
  return estimatedDate;
}

function calculateAverageCompletionTime(tasks: any[]): number {
  if (tasks.length === 0) return 7; // 預設 7 天

  const completionTimes = tasks.map(task => {
    const created = new Date(task.createdAt);
    const completed = new Date(task.completedAt);
    return (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // 轉換為天數
  });

  const sum = completionTimes.reduce((a, b) => a + b, 0);
  return Math.ceil(sum / completionTimes.length);
}
```

### 2. 成本計算 (Cost Calculation)

```typescript
export interface CalculateCostRequest {
  projectId: string;
  includeForecast?: boolean;
}

export interface CostResult {
  projectId: string;
  totalBudget: number;
  actualCost: number;
  remainingBudget: number;
  costPercentage: number;
  isOverBudget: boolean;
  forecastedCost?: number;
  categories: {
    labor: number;
    materials: number;
    equipment: number;
    other: number;
  };
}

export const calculateProjectCost = onCall<CalculateCostRequest>({
  region: 'asia-east1'
}, async (request) => {
  const { projectId, includeForecast = false } = request.data;

  logger.info('計算專案成本', { projectId });

  try {
    // 取得專案資料
    const projectDoc = await admin.firestore()
      .collection('projects')
      .doc(projectId)
      .get();

    if (!projectDoc.exists) {
      throw new HttpsError('not-found', '專案不存在');
    }

    const project = projectDoc.data()!;
    const totalBudget = project.budget || 0;

    // 取得所有費用記錄
    const expensesSnapshot = await admin.firestore()
      .collection('expenses')
      .where('projectId', '==', projectId)
      .get();

    let actualCost = 0;
    const categories = {
      labor: 0,
      materials: 0,
      equipment: 0,
      other: 0
    };

    expensesSnapshot.docs.forEach(doc => {
      const expense = doc.data();
      const amount = expense.amount || 0;
      
      actualCost += amount;

      switch (expense.category) {
        case 'labor':
          categories.labor += amount;
          break;
        case 'materials':
          categories.materials += amount;
          break;
        case 'equipment':
          categories.equipment += amount;
          break;
        default:
          categories.other += amount;
      }
    });

    const remainingBudget = totalBudget - actualCost;
    const costPercentage = totalBudget > 0 
      ? Math.round((actualCost / totalBudget) * 100) 
      : 0;
    const isOverBudget = actualCost > totalBudget;

    const result: CostResult = {
      projectId,
      totalBudget,
      actualCost,
      remainingBudget,
      costPercentage,
      isOverBudget,
      categories
    };

    // 如果需要預測
    if (includeForecast) {
      const progress = await calculateProjectProgress(
        { data: { projectId }, auth: request.auth }
      );
      result.forecastedCost = forecastTotalCost(
        actualCost,
        progress.progressPercentage
      );
    }

    logger.info('專案成本計算完成', result);

    return result;
  } catch (error) {
    logger.error('專案成本計算失敗', error);
    throw new HttpsError('internal', '計算失敗');
  }
});

function forecastTotalCost(
  actualCost: number,
  progressPercentage: number
): number {
  if (progressPercentage === 0) return actualCost;
  
  return Math.round((actualCost / progressPercentage) * 100);
}
```

### 3. 工時統計 (Work Hours Statistics)

```typescript
export interface CalculateWorkHoursRequest {
  projectId?: string;
  userId?: string;
  startDate: string;
  endDate: string;
}

export interface WorkHoursResult {
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  breakdownByUser: {
    userId: string;
    userName: string;
    hours: number;
  }[];
  breakdownByDay: {
    date: string;
    hours: number;
  }[];
}

export const calculateWorkHours = onCall<CalculateWorkHoursRequest>({
  region: 'asia-east1'
}, async (request) => {
  const { projectId, userId, startDate, endDate } = request.data;

  logger.info('計算工時統計', { projectId, userId, startDate, endDate });

  try {
    let query = admin.firestore()
      .collection('work_logs')
      .where('date', '>=', new Date(startDate))
      .where('date', '<=', new Date(endDate));

    if (projectId) {
      query = query.where('projectId', '==', projectId);
    }

    if (userId) {
      query = query.where('userId', '==', userId);
    }

    const snapshot = await query.get();

    let totalHours = 0;
    let regularHours = 0;
    let overtimeHours = 0;
    const userHours = new Map<string, { name: string; hours: number }>();
    const dayHours = new Map<string, number>();

    snapshot.docs.forEach(doc => {
      const log = doc.data();
      const hours = log.hours || 0;
      
      totalHours += hours;

      // 計算正常和加班時數
      if (hours > 8) {
        regularHours += 8;
        overtimeHours += (hours - 8);
      } else {
        regularHours += hours;
      }

      // 按使用者統計
      const userId = log.userId;
      const current = userHours.get(userId) || { 
        name: log.userName, 
        hours: 0 
      };
      current.hours += hours;
      userHours.set(userId, current);

      // 按日期統計
      const dateKey = log.date.toDate().toISOString().split('T')[0];
      const dayTotal = dayHours.get(dateKey) || 0;
      dayHours.set(dateKey, dayTotal + hours);
    });

    const result: WorkHoursResult = {
      totalHours: Math.round(totalHours * 10) / 10,
      regularHours: Math.round(regularHours * 10) / 10,
      overtimeHours: Math.round(overtimeHours * 10) / 10,
      breakdownByUser: Array.from(userHours.entries()).map(([userId, data]) => ({
        userId,
        userName: data.name,
        hours: Math.round(data.hours * 10) / 10
      })),
      breakdownByDay: Array.from(dayHours.entries()).map(([date, hours]) => ({
        date,
        hours: Math.round(hours * 10) / 10
      }))
    };

    logger.info('工時統計完成', result);

    return result;
  } catch (error) {
    logger.error('工時統計失敗', error);
    throw new HttpsError('internal', '計算失敗');
  }
});
```

### 4. 品質指標計算 (Quality Metrics)

```typescript
export interface CalculateQualityMetricsRequest {
  projectId: string;
}

export interface QualityMetricsResult {
  projectId: string;
  overallScore: number;
  inspectionPassRate: number;
  defectRate: number;
  reworkRate: number;
  safetyIncidents: number;
  complianceScore: number;
  breakdown: {
    category: string;
    score: number;
    issues: number;
  }[];
}

export const calculateQualityMetrics = onCall<CalculateQualityMetricsRequest>({
  region: 'asia-east1'
}, async (request) => {
  const { projectId } = request.data;

  logger.info('計算品質指標', { projectId });

  try {
    // 取得檢查記錄
    const inspectionsSnapshot = await admin.firestore()
      .collection('inspections')
      .where('projectId', '==', projectId)
      .get();

    let totalInspections = 0;
    let passedInspections = 0;
    let totalDefects = 0;
    let reworkItems = 0;
    let safetyIncidents = 0;

    const categoryScores = new Map<string, { total: number; passed: number; issues: number }>();

    inspectionsSnapshot.docs.forEach(doc => {
      const inspection = doc.data();
      totalInspections++;

      if (inspection.status === 'passed') {
        passedInspections++;
      }

      if (inspection.defects) {
        totalDefects += inspection.defects.length;
      }

      if (inspection.requiresRework) {
        reworkItems++;
      }

      if (inspection.category === 'safety' && inspection.status === 'failed') {
        safetyIncidents++;
      }

      // 按類別統計
      const category = inspection.category || 'general';
      const current = categoryScores.get(category) || { 
        total: 0, 
        passed: 0, 
        issues: 0 
      };
      current.total++;
      if (inspection.status === 'passed') current.passed++;
      current.issues += (inspection.defects?.length || 0);
      categoryScores.set(category, current);
    });

    const inspectionPassRate = totalInspections > 0 
      ? Math.round((passedInspections / totalInspections) * 100) 
      : 0;
    
    const defectRate = totalInspections > 0 
      ? Math.round((totalDefects / totalInspections) * 100) 
      : 0;
    
    const reworkRate = totalInspections > 0 
      ? Math.round((reworkItems / totalInspections) * 100) 
      : 0;

    // 計算整體分數
    const overallScore = calculateOverallQualityScore({
      inspectionPassRate,
      defectRate,
      reworkRate,
      safetyIncidents
    });

    const result: QualityMetricsResult = {
      projectId,
      overallScore,
      inspectionPassRate,
      defectRate,
      reworkRate,
      safetyIncidents,
      complianceScore: inspectionPassRate,
      breakdown: Array.from(categoryScores.entries()).map(([category, data]) => ({
        category,
        score: data.total > 0 ? Math.round((data.passed / data.total) * 100) : 0,
        issues: data.issues
      }))
    };

    logger.info('品質指標計算完成', result);

    return result;
  } catch (error) {
    logger.error('品質指標計算失敗', error);
    throw new HttpsError('internal', '計算失敗');
  }
});

function calculateOverallQualityScore(metrics: {
  inspectionPassRate: number;
  defectRate: number;
  reworkRate: number;
  safetyIncidents: number;
}): number {
  const weights = {
    inspectionPass: 0.4,
    defect: 0.3,
    rework: 0.2,
    safety: 0.1
  };

  let score = 0;
  
  // 檢查通過率貢獻
  score += metrics.inspectionPassRate * weights.inspectionPass;
  
  // 缺陷率影響（反向）
  score += (100 - metrics.defectRate) * weights.defect;
  
  // 返工率影響（反向）
  score += (100 - metrics.reworkRate) * weights.rework;
  
  // 安全事件影響（每個事件扣分）
  const safetyPenalty = Math.min(metrics.safetyIncidents * 10, 100);
  score += (100 - safetyPenalty) * weights.safety;

  return Math.round(score);
}
```

## 📂 目錄結構

```
functions-calculation/
├── README.md
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # 主要匯出檔案
│   ├── progress/             # 進度計算
│   │   └── project-progress.ts
│   ├── cost/                 # 成本計算
│   │   ├── cost-calculator.ts
│   │   └── budget-forecast.ts
│   ├── workhours/            # 工時統計
│   │   └── hours-calculator.ts
│   ├── quality/              # 品質指標
│   │   └── metrics-calculator.ts
│   └── utils/                # 計算工具
│       ├── statistics.ts
│       └── forecasting.ts
└── tests/
    └── calculations.test.ts
```

## 🚀 使用範例

### 從前端呼叫計算函式

```typescript
// Angular Component
import { inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

export class ProjectDashboardComponent {
  private functions = inject(Functions);

  async loadProjectProgress(projectId: string) {
    const calculateProgress = httpsCallable(
      this.functions, 
      'calculateProjectProgress'
    );
    
    const result = await calculateProgress({ projectId });
    console.log('專案進度:', result.data);
  }

  async loadProjectCost(projectId: string) {
    const calculateCost = httpsCallable(
      this.functions, 
      'calculateProjectCost'
    );
    
    const result = await calculateCost({ 
      projectId, 
      includeForecast: true 
    });
    console.log('專案成本:', result.data);
  }
}
```

## 🧪 測試

### 單元測試範例

```typescript
describe('calculateProjectProgress', () => {
  it('應該正確計算專案進度', async () => {
    const wrapped = test().wrap(calculateProjectProgress);
    
    const result = await wrapped({
      data: { projectId: 'test-project' },
      auth: { uid: 'test-user' }
    });

    expect(result.progressPercentage).toBeGreaterThanOrEqual(0);
    expect(result.progressPercentage).toBeLessThanOrEqual(100);
    expect(result.totalTasks).toBeGreaterThan(0);
  });
});
```

## 📊 效能最佳化

### 快取策略

```typescript
import { RuntimeOptions } from 'firebase-functions/v2';

const cacheOptions: RuntimeOptions = {
  memory: '512MiB',
  timeoutSeconds: 60,
  maxInstances: 10
};

// 使用快取減少重複計算
const progressCache = new Map<string, { 
  result: ProgressResult; 
  timestamp: number 
}>();

const CACHE_TTL = 5 * 60 * 1000; // 5 分鐘

function getCachedProgress(projectId: string): ProgressResult | null {
  const cached = progressCache.get(projectId);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.result;
  }
  
  return null;
}
```

## 🔧 故障排除

### 常見問題

1. **計算逾時**
   - 增加函式逾時設定
   - 優化查詢效能
   - 使用索引加速

2. **記憶體不足**
   - 增加記憶體配置
   - 分批處理大量資料
   - 使用串流查詢

3. **結果不準確**
   - 檢查資料完整性
   - 驗證計算邏輯
   - 確認時區設定

## 📚 參考資源

- [Firebase Functions 文檔](https://firebase.google.com/docs/functions)
- [Firestore 查詢最佳化](https://firebase.google.com/docs/firestore/query-data/queries)
- [JavaScript 數學運算](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math)

## 🔄 版本管理

| 版本 | 日期 | 變更說明 |
|------|------|----------|
| 1.0.0 | 2024-12 | 初始版本 - 基礎計算功能 |

## 👥 維護者

GigHub Development Team

## 📄 授權

MIT License
