# Functions Auth Module

## 📋 概述

`functions-auth` 模組負責處理使用者認證和授權相關的業務邏輯。提供自訂認證流程、使用者生命週期管理、權限控制和安全驗證功能,確保系統安全性和使用者資料保護。

## 🎯 目標

- **安全認證**: 提供多種安全的認證方式
- **使用者管理**: 自動化使用者生命週期處理
- **權限控制**: 實作細粒度的權限管理
- **審計追蹤**: 記錄所有認證相關活動

## 📦 核心功能

### 1. 使用者註冊處理 (User Registration)

```typescript
import { onUserCreated, BeforeCreateResponse } from 'firebase-functions/v2/identity';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

export const onUserRegister = onUserCreated({
  region: 'asia-east1'
}, async (event) => {
  const user = event.data;

  logger.info('新使用者註冊', {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName
  });

  try {
    // 1. 建立使用者資料文件
    await admin.firestore()
      .collection('users')
      .doc(user.uid)
      .set({
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        role: 'viewer', // 預設角色
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          creationTime: user.metadata.creationTime,
          lastSignInTime: user.metadata.lastSignInTime
        }
      });

    // 2. 設定預設使用者偏好
    await admin.firestore()
      .collection('user_preferences')
      .doc(user.uid)
      .set({
        notifications: {
          email: true,
          push: true,
          inApp: true
        },
        language: 'zh-TW',
        timezone: 'Asia/Taipei',
        theme: 'light'
      });

    // 3. 設定自訂聲明 (Custom Claims)
    await admin.auth().setCustomUserClaims(user.uid, {
      role: 'viewer',
      permissions: ['read:own']
    });

    // 4. 發送歡迎郵件
    await sendWelcomeEmail(user.email!, user.displayName);

    // 5. 記錄審計日誌
    await logAuditEvent({
      type: 'user.created',
      uid: user.uid,
      email: user.email,
      timestamp: new Date()
    });

    logger.info('使用者註冊處理完成', { uid: user.uid });
  } catch (error) {
    logger.error('使用者註冊處理失敗', error);
    throw error;
  }
});

async function sendWelcomeEmail(email: string, displayName: string | undefined) {
  logger.info('發送歡迎郵件', { email, displayName });
  // 整合 email 服務 (SendGrid, Mailgun, etc.)
}

async function logAuditEvent(event: any) {
  await admin.firestore()
    .collection('audit_logs')
    .add(event);
}
```

### 2. 使用者刪除處理 (User Deletion)

```typescript
import { onUserDeleted } from 'firebase-functions/v2/identity';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

export const onUserDelete = onUserDeleted({
  region: 'asia-east1'
}, async (event) => {
  const user = event.data;

  logger.info('使用者刪除', { uid: user.uid, email: user.email });

  try {
    const batch = admin.firestore().batch();

    // 1. 刪除使用者資料
    const userRef = admin.firestore().collection('users').doc(user.uid);
    batch.delete(userRef);

    // 2. 刪除使用者偏好設定
    const prefsRef = admin.firestore()
      .collection('user_preferences')
      .doc(user.uid);
    batch.delete(prefsRef);

    // 3. 刪除使用者統計
    const statsRef = admin.firestore()
      .collection('user_stats')
      .doc(user.uid);
    batch.delete(statsRef);

    await batch.commit();

    // 4. 匿名化使用者建立的內容
    await anonymizeUserContent(user.uid);

    // 5. 刪除使用者上傳的檔案
    await deleteUserFiles(user.uid);

    // 6. 記錄刪除事件
    await logAuditEvent({
      type: 'user.deleted',
      uid: user.uid,
      email: user.email,
      timestamp: new Date()
    });

    logger.info('使用者刪除處理完成', { uid: user.uid });
  } catch (error) {
    logger.error('使用者刪除處理失敗', error);
    throw error;
  }
});

async function anonymizeUserContent(uid: string) {
  const batch = admin.firestore().batch();

  // 匿名化任務
  const tasksSnapshot = await admin.firestore()
    .collection('tasks')
    .where('createdBy', '==', uid)
    .get();

  tasksSnapshot.docs.forEach(doc => {
    batch.update(doc.ref, {
      createdBy: '[deleted]',
      createdByName: '[已刪除的使用者]'
    });
  });

  // 匿名化評論
  const commentsSnapshot = await admin.firestore()
    .collection('comments')
    .where('userId', '==', uid)
    .get();

  commentsSnapshot.docs.forEach(doc => {
    batch.update(doc.ref, {
      userId: '[deleted]',
      userName: '[已刪除的使用者]'
    });
  });

  await batch.commit();
}

async function deleteUserFiles(uid: string) {
  const bucket = admin.storage().bucket();
  const [files] = await bucket.getFiles({
    prefix: `users/${uid}/`
  });

  await Promise.all(files.map(file => file.delete()));
}
```

### 3. 認證前驗證 (Before Sign-In Blocking)

```typescript
import { beforeUserSignedIn, BeforeSignInResponse } from 'firebase-functions/v2/identity';
import { HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

export const beforeSignIn = beforeUserSignedIn({
  region: 'asia-east1'
}, async (event) => {
  const user = event.data;

  logger.info('使用者登入驗證', { uid: user.uid, email: user.email });

  try {
    // 1. 檢查使用者狀態
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(user.uid)
      .get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      
      // 檢查帳號是否被停用
      if (userData?.status === 'suspended') {
        throw new HttpsError(
          'permission-denied',
          '您的帳號已被停用，請聯繫管理員'
        );
      }

      // 檢查帳號是否需要驗證
      if (userData?.requiresVerification && !user.emailVerified) {
        throw new HttpsError(
          'permission-denied',
          '請先驗證您的電子郵件地址'
        );
      }
    }

    // 2. 更新最後登入時間
    await admin.firestore()
      .collection('users')
      .doc(user.uid)
      .update({
        lastSignInAt: new Date(),
        'metadata.lastSignInTime': user.metadata.lastSignInTime
      });

    // 3. 記錄登入事件
    await admin.firestore()
      .collection('user_activities')
      .add({
        userId: user.uid,
        action: 'login',
        timestamp: new Date(),
        ip: event.ipAddress,
        userAgent: event.userAgent
      });

    // 4. 設定 Session Claims
    const response: BeforeSignInResponse = {
      sessionClaims: {
        signInTime: Date.now(),
        ipAddress: event.ipAddress
      }
    };

    logger.info('使用者登入驗證通過', { uid: user.uid });

    return response;
  } catch (error) {
    logger.error('使用者登入驗證失敗', error);
    throw error;
  }
});
```

### 4. 自訂認證 Claims (Custom Claims)

```typescript
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

export interface UpdateRoleRequest {
  uid: string;
  role: 'admin' | 'manager' | 'worker' | 'viewer';
  permissions?: string[];
}

export const updateUserRole = onCall<UpdateRoleRequest>({
  region: 'asia-east1',
  enforceAppCheck: true
}, async (request) => {
  // 驗證呼叫者權限
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '使用者未登入');
  }

  const callerToken = await admin.auth().getUser(request.auth.uid);
  const callerClaims = callerToken.customClaims;

  if (callerClaims?.role !== 'admin') {
    throw new HttpsError('permission-denied', '權限不足');
  }

  const { uid, role, permissions = [] } = request.data;

  logger.info('更新使用者角色', { uid, role, updatedBy: request.auth.uid });

  try {
    // 1. 驗證角色有效性
    const validRoles = ['admin', 'manager', 'worker', 'viewer'];
    if (!validRoles.includes(role)) {
      throw new HttpsError('invalid-argument', '無效的角色');
    }

    // 2. 根據角色設定權限
    const rolePermissions = getRolePermissions(role);
    const customClaims = {
      role,
      permissions: [...rolePermissions, ...permissions]
    };

    // 3. 更新 Custom Claims
    await admin.auth().setCustomUserClaims(uid, customClaims);

    // 4. 更新 Firestore 使用者資料
    await admin.firestore()
      .collection('users')
      .doc(uid)
      .update({
        role,
        permissions: customClaims.permissions,
        updatedAt: new Date(),
        updatedBy: request.auth.uid
      });

    // 5. 記錄角色變更
    await logAuditEvent({
      type: 'user.role_updated',
      uid,
      role,
      updatedBy: request.auth.uid,
      timestamp: new Date()
    });

    logger.info('使用者角色更新完成', { uid, role });

    return {
      success: true,
      uid,
      role,
      permissions: customClaims.permissions
    };
  } catch (error) {
    logger.error('使用者角色更新失敗', error);
    throw new HttpsError('internal', '角色更新失敗');
  }
});

function getRolePermissions(role: string): string[] {
  const rolePermissionsMap: Record<string, string[]> = {
    admin: [
      'read:all',
      'write:all',
      'delete:all',
      'manage:users',
      'manage:projects'
    ],
    manager: [
      'read:all',
      'write:own',
      'delete:own',
      'manage:team'
    ],
    worker: [
      'read:assigned',
      'write:assigned'
    ],
    viewer: [
      'read:own'
    ]
  };

  return rolePermissionsMap[role] || [];
}
```

### 5. 密碼重設處理 (Password Reset)

```typescript
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

export interface RequestPasswordResetRequest {
  email: string;
}

export const requestPasswordReset = onCall<RequestPasswordResetRequest>({
  region: 'asia-east1',
  cors: true
}, async (request) => {
  const { email } = request.data;

  logger.info('密碼重設請求', { email });

  try {
    // 1. 驗證使用者存在
    const user = await admin.auth().getUserByEmail(email);

    // 2. 生成密碼重設連結
    const resetLink = await admin.auth().generatePasswordResetLink(email, {
      url: 'https://gighub.app/reset-password-confirm'
    });

    // 3. 發送密碼重設郵件
    await sendPasswordResetEmail(email, resetLink);

    // 4. 記錄密碼重設請求
    await admin.firestore()
      .collection('password_reset_logs')
      .add({
        userId: user.uid,
        email,
        timestamp: new Date(),
        ip: request.rawRequest.ip,
        status: 'sent'
      });

    logger.info('密碼重設郵件已發送', { email });

    return { success: true, message: '密碼重設郵件已發送' };
  } catch (error) {
    logger.error('密碼重設請求失敗', error);
    
    // 安全考量：不透露使用者是否存在
    return { 
      success: true, 
      message: '如果該電子郵件存在，密碼重設郵件已發送' 
    };
  }
});

async function sendPasswordResetEmail(email: string, resetLink: string) {
  logger.info('發送密碼重設郵件', { email });
  // 整合 email 服務
}
```

## 📂 目錄結構

```
functions-auth/
├── README.md
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # 主要匯出檔案
│   ├── lifecycle/            # 使用者生命週期
│   │   ├── user-created.ts
│   │   └── user-deleted.ts
│   ├── blocking/             # 認證攔截
│   │   ├── before-sign-in.ts
│   │   └── before-create.ts
│   ├── claims/               # 自訂聲明
│   │   └── custom-claims.ts
│   ├── password/             # 密碼管理
│   │   └── reset.ts
│   └── utils/                # 工具函式
│       ├── validators.ts
│       └── permissions.ts
└── tests/
    └── auth.test.ts
```

## 🚀 部署

### 1. 本地測試

```bash
cd functions-auth
npm install
npm run build

# 使用 Firebase Emulator
firebase emulators:start --only functions,auth,firestore
```

### 2. 部署

```bash
firebase deploy --only functions:auth
```

## 🔐 安全性最佳實踐

### 1. 密碼策略

```typescript
// 實作強密碼驗證
function validatePasswordStrength(password: string): boolean {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return password.length >= minLength &&
         hasUpperCase &&
         hasLowerCase &&
         hasNumbers &&
         hasSpecialChar;
}
```

### 2. 防止暴力攻擊

```typescript
async function checkLoginAttempts(uid: string): Promise<boolean> {
  const attemptsDoc = await admin.firestore()
    .collection('login_attempts')
    .doc(uid)
    .get();

  if (attemptsDoc.exists) {
    const data = attemptsDoc.data();
    const attempts = data?.attempts || 0;
    const lastAttempt = data?.lastAttempt?.toDate();

    // 5 次失敗後鎖定 15 分鐘
    if (attempts >= 5) {
      const lockoutTime = 15 * 60 * 1000; // 15 分鐘
      const timeSinceLastAttempt = Date.now() - lastAttempt.getTime();
      
      if (timeSinceLastAttempt < lockoutTime) {
        return false; // 帳號被鎖定
      }
    }
  }

  return true; // 允許登入
}
```

## 🧪 測試

### 單元測試

```typescript
import * as admin from 'firebase-admin';
import * as test from 'firebase-functions-test';

const testEnv = test();

describe('onUserRegister', () => {
  it('應該建立使用者資料文件', async () => {
    const wrapped = testEnv.wrap(onUserRegister);
    
    const user = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User'
    };

    await wrapped({ data: user });

    const userDoc = await admin.firestore()
      .collection('users')
      .doc('test-uid')
      .get();

    expect(userDoc.exists).toBe(true);
    expect(userDoc.data()?.email).toBe('test@example.com');
  });
});
```

## 🔧 故障排除

### 常見問題

1. **Custom Claims 未生效**
   - 使用者需要重新登入以載入新的 claims
   - 或使用 `getIdToken(true)` 強制刷新 token

2. **Email 驗證連結失效**
   - 檢查 Firebase Console 中的授權網域設定
   - 確認連結未過期（預設 1 小時）

3. **權限驗證失敗**
   - 檢查 Firestore Security Rules
   - 驗證 Custom Claims 設定正確

## 📚 參考資源

- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Identity Platform Blocking Functions](https://firebase.google.com/docs/auth/extend-with-blocking-functions)
- [Custom Claims](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Security Best Practices](https://firebase.google.com/docs/auth/security)

## 🔄 版本管理

| 版本 | 日期 | 變更說明 |
|------|------|----------|
| 1.0.0 | 2024-12 | 初始版本 - 基礎認證功能 |

## 👥 維護者

GigHub Development Team

## 📄 授權

MIT License
