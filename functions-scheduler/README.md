# Functions Scheduler Module

## 📋 概述

`functions-scheduler` 模組負責處理所有基於時間排程的背景任務。使用 Firebase Cloud Scheduler 和 Cloud Functions 實現定期執行的自動化任務,如資料清理、報表生成、通知發送等。

## 🎯 目標

- **自動化任務**: 定期執行系統維護和資料處理任務
- **效能優化**: 在非高峰時段執行耗時操作
- **資料一致性**: 定期同步和驗證資料完整性
- **通知管理**: 定時發送提醒和報告給相關使用者

## 📦 核心功能

### 1. 每日清理任務 (Daily Cleanup)

```typescript
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import { COLLECTIONS } from '../functions-shared';

export const dailyCleanup = onSchedule({
  schedule: '0 2 * * *', // 每天凌晨 2:00
  timeZone: 'Asia/Taipei',
  retryCount: 3,
  region: 'asia-east1'
}, async (event) => {
  logger.info('開始每日清理任務', {
    scheduleTime: event.scheduleTime,
    jobName: event.jobName
  });

  try {
    // 刪除 30 天前的日誌
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logsRef = admin.firestore().collection(COLLECTIONS.LOGS);
    const snapshot = await logsRef
      .where('timestamp', '<', thirtyDaysAgo)
      .limit(500)
      .get();

    const batch = admin.firestore().batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    logger.info('每日清理任務完成', { 
      deletedCount: snapshot.size 
    });
  } catch (error) {
    logger.error('每日清理任務失敗', error);
    throw error;
  }
});
```

### 2. 每週報表生成 (Weekly Reports)

```typescript
export const weeklyReport = onSchedule({
  schedule: '0 9 * * 1', // 每週一上午 9:00
  timeZone: 'Asia/Taipei',
  region: 'asia-east1'
}, async (event) => {
  logger.info('開始生成週報', { scheduleTime: event.scheduleTime });

  try {
    const projectsRef = admin.firestore().collection(COLLECTIONS.PROJECTS);
    const snapshot = await projectsRef
      .where('status', '==', 'active')
      .get();

    const reports = [];
    for (const doc of snapshot.docs) {
      const project = doc.data();
      
      // 計算專案進度統計
      const stats = await calculateProjectStats(doc.id);
      
      reports.push({
        projectId: doc.id,
        projectName: project.name,
        ...stats
      });
    }

    // 發送報表給管理員
    await sendWeeklyReportEmail(reports);

    logger.info('週報生成完成', { 
      projectCount: reports.length 
    });
  } catch (error) {
    logger.error('週報生成失敗', error);
    throw error;
  }
});
```

### 3. 即將到期任務提醒 (Due Date Reminders)

```typescript
export const dueDateReminder = onSchedule({
  schedule: '0 8 * * *', // 每天早上 8:00
  timeZone: 'Asia/Taipei',
  region: 'asia-east1'
}, async (event) => {
  logger.info('檢查即將到期的任務');

  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    const tasksRef = admin.firestore().collection(COLLECTIONS.TASKS);
    const snapshot = await tasksRef
      .where('dueDate', '>=', tomorrow)
      .where('dueDate', '<', dayAfterTomorrow)
      .where('status', '!=', 'completed')
      .get();

    for (const doc of snapshot.docs) {
      const task = doc.data();
      await sendDueDateNotification(task);
    }

    logger.info('到期提醒發送完成', { 
      taskCount: snapshot.size 
    });
  } catch (error) {
    logger.error('到期提醒發送失敗', error);
    throw error;
  }
});
```

## 📂 目錄結構

```
functions-scheduler/
├── README.md
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # 主要匯出檔案
│   ├── cleanup/              # 清理任務
│   │   └── daily-cleanup.ts
│   ├── reports/              # 報表生成
│   │   ├── weekly-report.ts
│   │   └── monthly-report.ts
│   ├── notifications/        # 通知任務
│   │   ├── due-date-reminder.ts
│   │   └── overdue-alert.ts
│   ├── backup/               # 備份任務
│   │   └── daily-backup.ts
│   └── metrics/              # 效能統計
│       └── hourly-metrics.ts
└── tests/
    └── scheduler.test.ts
```

## 🚀 部署

### 1. 本地測試

```bash
cd functions-scheduler
npm install
npm run build
npm run serve
```

### 2. 部署到 Firebase

```bash
firebase deploy --only functions:scheduler
```

### 3. 查看排程狀態

```bash
firebase functions:log --only scheduler
```

## ⏰ 排程設定參考

### Cron 表達式格式

```
* * * * *
│ │ │ │ │
│ │ │ │ └─ 星期幾 (0-7, 0 和 7 都代表星期日)
│ │ │ └─── 月份 (1-12)
│ │ └───── 日期 (1-31)
│ └─────── 小時 (0-23)
└───────── 分鐘 (0-59)
```

### 常用排程範例

| 排程 | Cron 表達式 | 說明 |
|------|-------------|------|
| 每小時 | `0 * * * *` | 每小時的 0 分 |
| 每天凌晨 2 點 | `0 2 * * *` | 適合清理任務 |
| 每週一上午 9 點 | `0 9 * * 1` | 適合週報 |
| 每月 1 號凌晨 3 點 | `0 3 1 * *` | 適合月報 |
| 每 15 分鐘 | `*/15 * * * *` | 適合頻繁檢查 |

## 🧪 測試

```bash
# 執行測試
npm test

# 測試特定排程
npm test -- daily-cleanup.test.ts
```

## 📊 監控與日誌

### 查看日誌

```bash
# 查看所有排程日誌
firebase functions:log --only scheduler

# 查看特定函式日誌
firebase functions:log --only scheduler:dailyCleanup
```

## 🔧 故障排除

### 常見問題

1. **排程未執行**
   - 檢查 Cloud Scheduler 是否啟用
   - 驗證 Cron 表達式格式
   - 檢查時區設定

2. **執行逾時**
   - 增加 `timeoutSeconds` 設定
   - 優化查詢效能
   - 使用批次處理

3. **記憶體不足**
   - 增加 `memory` 配置
   - 減少一次處理的資料量
   - 使用分頁查詢

## 📚 參考資源

- [Cloud Scheduler 文檔](https://cloud.google.com/scheduler/docs)
- [Cron 表達式產生器](https://crontab.guru/)
- [Firebase Functions Scheduling](https://firebase.google.com/docs/functions/schedule-functions)

## 🔄 版本管理

| 版本 | 日期 | 變更說明 |
|------|------|----------|
| 1.0.0 | 2024-12 | 初始版本 - 基礎排程任務 |

## 👥 維護者

GigHub Development Team

## 📄 授權

MIT License
