# Functions Analytics Module

## 📋 概述

`functions-analytics` 模組負責處理數據分析和統計報表生成。提供專案績效追蹤、使用者行為分析、資料洞察和自動化報表功能,支援管理層決策和業務優化。

## 🎯 目標

- **數據洞察**: 提供深入的業務數據分析和洞察
- **自動化報表**: 定期生成和發送統計報表
- **效能監控**: 追蹤系統使用情況和效能指標
- **趨勢分析**: 識別業務趨勢和模式

## 📦 核心功能

### 1. 專案績效分析 (Project Performance Analytics)

```typescript
import { onCall } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

export interface ProjectAnalyticsRequest {
  projectId: string;
  startDate: string;
  endDate: string;
  metrics?: string[];
}

export interface ProjectAnalyticsResult {
  projectId: string;
  period: {
    start: string;
    end: string;
  };
  performance: {
    completionRate: number;
    averageTaskDuration: number;
    onTimeDeliveryRate: number;
    budgetUtilization: number;
  };
  productivity: {
    tasksCompletedPerDay: number;
    averageTeamSize: number;
    utilizationRate: number;
  };
  quality: {
    defectRate: number;
    reworkRate: number;
    inspectionPassRate: number;
  };
  trends: {
    metric: string;
    values: number[];
    dates: string[];
  }[];
}

export const analyzeProjectPerformance = onCall<ProjectAnalyticsRequest>({
  region: 'asia-east1',
  memory: '512MiB',
  timeoutSeconds: 120
}, async (request) => {
  const { projectId, startDate, endDate, metrics = [] } = request.data;

  logger.info('分析專案績效', { projectId, startDate, endDate });

  try {
    // 取得專案任務數據
    const tasksSnapshot = await admin.firestore()
      .collection('tasks')
      .where('projectId', '==', projectId)
      .where('createdAt', '>=', new Date(startDate))
      .where('createdAt', '<=', new Date(endDate))
      .get();

    const tasks = tasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // 計算完成率
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const completionRate = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100) 
      : 0;

    // 生成趨勢數據
    const trends = generateTrends(tasks, startDate, endDate);

    const result: ProjectAnalyticsResult = {
      projectId,
      period: { start: startDate, end: endDate },
      performance: {
        completionRate,
        averageTaskDuration: 0,
        onTimeDeliveryRate: 0,
        budgetUtilization: 0
      },
      productivity: {
        tasksCompletedPerDay: 0,
        averageTeamSize: 0,
        utilizationRate: 0
      },
      quality: {
        defectRate: 0,
        reworkRate: 0,
        inspectionPassRate: 0
      },
      trends
    };

    logger.info('專案績效分析完成', { projectId });
    return result;
  } catch (error) {
    logger.error('專案績效分析失敗', error);
    throw new HttpsError('internal', '分析失敗');
  }
});
```

### 2. 使用者行為分析 (User Behavior Analytics)

```typescript
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

export const trackUserActivity = onDocumentCreated({
  document: 'user_activities/{activityId}',
  region: 'asia-east1'
}, async (event) => {
  const activityId = event.params.activityId;
  const activity = event.data?.data();

  if (!activity) return;

  logger.info('追蹤使用者活動', { activityId, activity });

  try {
    const { userId, action, timestamp } = activity;

    // 更新使用者統計
    const userStatsRef = admin.firestore()
      .collection('user_stats')
      .doc(userId);

    await userStatsRef.set({
      userId,
      totalActions: admin.firestore.FieldValue.increment(1),
      lastActivity: timestamp,
      [`actions.${action}`]: admin.firestore.FieldValue.increment(1)
    }, { merge: true });

    // 記錄每日活躍使用者 (DAU)
    const dateKey = new Date(timestamp).toISOString().split('T')[0];
    await admin.firestore()
      .collection('daily_active_users')
      .doc(dateKey)
      .set({
        [`users.${userId}`]: true,
        date: dateKey
      }, { merge: true });

    logger.info('使用者活動追蹤完成', { userId, action });
  } catch (error) {
    logger.error('使用者活動追蹤失敗', error);
    throw error;
  }
});
```

### 3. 自動化報表生成 (Automated Report Generation)

```typescript
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

export const generateDailyReport = onSchedule({
  schedule: '0 1 * * *', // 每天凌晨 1 點
  timeZone: 'Asia/Taipei',
  region: 'asia-east1',
  retryCount: 2
}, async (event) => {
  logger.info('生成每日報表', { scheduleTime: event.scheduleTime });

  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateKey = yesterday.toISOString().split('T')[0];

    // 統計每日活躍使用者
    const dauDoc = await admin.firestore()
      .collection('daily_active_users')
      .doc(dateKey)
      .get();

    const dau = dauDoc.exists 
      ? Object.keys(dauDoc.data()?.users || {}).length 
      : 0;

    // 統計任務完成數
    const tasksSnapshot = await admin.firestore()
      .collection('tasks')
      .where('status', '==', 'completed')
      .where('completedAt', '>=', yesterday)
      .where('completedAt', '<', new Date())
      .get();

    const tasksCompleted = tasksSnapshot.size;

    // 儲存報表
    await admin.firestore()
      .collection('daily_reports')
      .doc(dateKey)
      .set({
        date: dateKey,
        metrics: {
          dailyActiveUsers: dau,
          tasksCompleted
        },
        generatedAt: new Date()
      });

    logger.info('每日報表生成完成', { date: dateKey, dau, tasksCompleted });

    return { success: true };
  } catch (error) {
    logger.error('每日報表生成失敗', error);
    throw error;
  }
});
```

## 📂 目錄結構

```
functions-analytics/
├── README.md
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # 主要匯出檔案
│   ├── project/              # 專案分析
│   │   └── performance.ts
│   ├── user/                 # 使用者分析
│   │   ├── behavior.ts
│   │   └── engagement.ts
│   ├── reports/              # 報表生成
│   │   ├── daily.ts
│   │   ├── weekly.ts
│   │   └── monthly.ts
│   └── utils/                # 工具函式
│       └── aggregation.ts
└── tests/
    └── analytics.test.ts
```

## 🚀 部署

### 1. 本地測試

```bash
cd functions-analytics
npm install
npm run build

# 使用 Firebase Emulator
firebase emulators:start --only functions,firestore
```

### 2. 部署

```bash
firebase deploy --only functions:analytics
```

## 📊 使用範例

### 從前端呼叫分析函式

```typescript
// Angular Component
import { inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

export class AnalyticsDashboardComponent {
  private functions = inject(Functions);

  async loadProjectAnalytics(projectId: string) {
    const analyzePerformance = httpsCallable(
      this.functions, 
      'analyzeProjectPerformance'
    );
    
    const result = await analyzePerformance({ 
      projectId,
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    });
    
    console.log('專案分析結果:', result.data);
  }
}
```

## 🧪 測試

### 單元測試

```typescript
import * as admin from 'firebase-admin';
import * as test from 'firebase-functions-test';

const testEnv = test();

describe('analyzeProjectPerformance', () => {
  it('應該正確計算專案績效指標', async () => {
    const wrapped = testEnv.wrap(analyzeProjectPerformance);
    
    const result = await wrapped({
      data: { 
        projectId: 'test-project',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      },
      auth: { uid: 'test-user' }
    });

    expect(result.performance.completionRate).toBeGreaterThanOrEqual(0);
    expect(result.performance.completionRate).toBeLessThanOrEqual(100);
  });
});
```

## 🔧 故障排除

### 常見問題

1. **分析逾時**
   - 增加函式逾時時間 (`timeoutSeconds`)
   - 優化查詢效能
   - 使用索引加速查詢

2. **記憶體不足**
   - 增加記憶體配置 (`memory`)
   - 分批處理大量資料

3. **數據不一致**
   - 確認時區設定
   - 驗證資料完整性

## 📚 參考資源

- [Firebase Functions 文檔](https://firebase.google.com/docs/functions)
- [Firestore 查詢文檔](https://firebase.google.com/docs/firestore/query-data)
- [Cloud Scheduler](https://cloud.google.com/scheduler/docs)

## 🔄 版本管理

| 版本 | 日期 | 變更說明 |
|------|------|----------|
| 1.0.0 | 2024-12 | 初始版本 - 基礎分析功能 |

## 👥 維護者

GigHub Development Team

## 📄 授權

MIT License
