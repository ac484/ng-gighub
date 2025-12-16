# Functions Shared Module

## 📋 概述

`functions-shared` 模組提供共享的工具函式、型別定義、常數和輔助函式,供其他 Firebase Functions 模組使用。此模組旨在減少程式碼重複,提高程式碼可維護性和一致性。

## 🎯 目標

- **程式碼重用**: 提供可在多個 Functions 中重用的通用工具
- **型別安全**: 集中管理 TypeScript 型別定義和介面
- **標準化**: 統一錯誤處理、日誌記錄和驗證邏輯
- **效能優化**: 提供優化的共享函式以提升整體效能

## 📦 核心功能

### 1. 工具函式 (Utilities)

```typescript
// 日期時間處理
export const formatDate = (date: Date): string => {
  return date.toISOString();
};

// 資料驗證
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 錯誤處理
export const createError = (code: string, message: string) => {
  return new HttpsError(code as FunctionsErrorCode, message);
};
```

### 2. 型別定義 (Types)

```typescript
// 使用者相關型別
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export enum UserRole {
  Admin = 'admin',
  Manager = 'manager',
  Worker = 'worker',
  Viewer = 'viewer'
}

// 專案相關型別
export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  organizationId: string;
}

export enum ProjectStatus {
  Active = 'active',
  Pending = 'pending',
  Completed = 'completed',
  Archived = 'archived'
}
```

### 3. 常數定義 (Constants)

```typescript
// Firebase Collections
export const COLLECTIONS = {
  USERS: 'users',
  PROJECTS: 'projects',
  TASKS: 'tasks',
  LOGS: 'logs',
  ORGANIZATIONS: 'organizations'
} as const;

// 錯誤訊息
export const ERROR_MESSAGES = {
  UNAUTHORIZED: '未授權的操作',
  INVALID_INPUT: '輸入資料無效',
  NOT_FOUND: '資源不存在',
  INTERNAL_ERROR: '內部伺服器錯誤'
} as const;

// 設定
export const CONFIG = {
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
  TIMEOUT: 60000, // 60 seconds
  REGION: 'asia-east1'
} as const;
```

### 4. 驗證函式 (Validators)

```typescript
import { HttpsError } from 'firebase-functions/v2/https';

export const validateRequired = (value: any, fieldName: string): void => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    throw new HttpsError('invalid-argument', `${fieldName} 為必填欄位`);
  }
};

export const validateAuth = (context: CallableContext): void => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', '使用者未登入');
  }
};

export const validateRole = (userRole: UserRole, requiredRole: UserRole): void => {
  const roleHierarchy = {
    admin: 4,
    manager: 3,
    worker: 2,
    viewer: 1
  };

  if (roleHierarchy[userRole] < roleHierarchy[requiredRole]) {
    throw new HttpsError('permission-denied', '權限不足');
  }
};
```

### 5. 日誌記錄 (Logging)

```typescript
import * as logger from 'firebase-functions/logger';

export class Logger {
  static info(message: string, data?: any): void {
    logger.info(message, data);
  }

  static error(message: string, error?: any): void {
    logger.error(message, {
      error: error?.message || error,
      stack: error?.stack
    });
  }

  static warn(message: string, data?: any): void {
    logger.warn(message, data);
  }

  static debug(message: string, data?: any): void {
    logger.debug(message, data);
  }
}
```

## 🔧 使用範例

### 在其他 Functions 中匯入

```typescript
// functions-scheduler/src/index.ts
import { 
  User, 
  UserRole, 
  COLLECTIONS, 
  validateAuth,
  Logger 
} from '../functions-shared/utils';

export const scheduledTask = onSchedule('0 2 * * *', async (event) => {
  Logger.info('Scheduled task started', { scheduleTime: event.scheduleTime });
  
  try {
    const usersRef = admin.firestore().collection(COLLECTIONS.USERS);
    const snapshot = await usersRef.where('role', '==', UserRole.Admin).get();
    
    Logger.info('Task completed', { userCount: snapshot.size });
  } catch (error) {
    Logger.error('Task failed', error);
    throw error;
  }
});
```

## 📂 建議目錄結構

```
functions-shared/
├── README.md
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # 主要匯出檔案
│   ├── types/                # 型別定義
│   │   ├── user.types.ts
│   │   ├── project.types.ts
│   │   └── common.types.ts
│   ├── constants/            # 常數定義
│   │   ├── collections.ts
│   │   ├── errors.ts
│   │   └── config.ts
│   ├── utils/                # 工具函式
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   └── helpers.ts
│   └── logger/               # 日誌工具
│       └── logger.ts
└── tests/                    # 單元測試
    └── utils.test.ts
```

## 🚀 安裝與設定

### 1. 安裝依賴

```bash
cd functions-shared
npm install
```

### 2. 建置模組

```bash
npm run build
```

### 3. 在其他模組中使用

```json
// functions-scheduler/package.json
{
  "dependencies": {
    "functions-shared": "file:../functions-shared"
  }
}
```

## 📝 開發指南

### 新增工具函式

1. 在 `src/utils/` 目錄下建立或更新檔案
2. 在 `src/index.ts` 中匯出函式
3. 新增對應的單元測試
4. 更新文檔

### 新增型別定義

1. 在 `src/types/` 目錄下建立型別檔案
2. 在 `src/index.ts` 中匯出型別
3. 確保型別與 Firestore 資料結構一致

## 🧪 測試

```bash
# 執行所有測試
npm test

# 執行特定測試
npm test -- validators.test.ts

# 測試覆蓋率
npm run test:coverage
```

## 📚 參考資源

- [Firebase Functions 文檔](https://firebase.google.com/docs/functions)
- [TypeScript 手冊](https://www.typescriptlang.org/docs/)
- [GigHub 專案架構文檔](../../docs/architecture.md)

## 🔄 版本管理

| 版本 | 日期 | 變更說明 |
|------|------|----------|
| 1.0.0 | 2024-12 | 初始版本 - 基礎工具函式和型別定義 |

## 👥 維護者

GigHub Development Team

## 📄 授權

MIT License
