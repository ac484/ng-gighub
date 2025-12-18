---
description: 'GigHub Firestore Security Rules 最佳實踐與多租戶資料隔離'
applyTo: 'firestore.rules, **/*.ts'
---

# GigHub Security Rules

> **專案專用**: Firestore Security Rules 設計與實作

## 🔒 核心原則 (MUST) 🔴

### 1. Security Rules 是第一道防線

**禁止**:
- ❌ 在客戶端信任使用者輸入
- ❌ 只在應用層做權限檢查
- ❌ 認為 Firebase Admin SDK 會繞過所有規則

**必須**:
- ✅ 所有 collection 都有 Security Rules
- ✅ 實作多租戶資料隔離
- ✅ 驗證使用者權限與角色
- ✅ 二次驗證資料完整性

### 2. 多租戶架構原則

GigHub 使用 Blueprint 作為多租戶的權限邊界：

```
User → Organization → Blueprint → Resources
                ↓
              Team / Partner
```

**資料隔離策略**: 專用成員集合 (Dedicated Membership Collection)

## 📐 Security Rules 架構

### 整體結構

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 1. 全域輔助函數
    function isAuthenticated() { }
    function getCurrentUserId() { }
    
    // 2. Blueprint 相關函數
    function isBlueprintMember(blueprintId) { }
    function hasPermission(blueprintId, permission) { }
    
    // 3. 資料驗證函數
    function validateTaskData(data) { }
    
    // 4. 集合規則
    match /blueprints/{blueprintId} { }
    match /blueprintMembers/{memberId} { }
    match /tasks/{taskId} { }
    match /users/{userId} { }
    match /organizations/{orgId} { }
  }
}
```

### 完整 Security Rules 範例

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ========================================
    // 全域輔助函數
    // ========================================
    
    /**
     * 檢查使用者是否已認證
     */
    function isAuthenticated() {
      return request.auth != null;
    }
    
    /**
     * 獲取當前使用者 ID
     */
    function getCurrentUserId() {
      return request.auth.uid;
    }
    
    /**
     * 檢查是否為系統管理員
     */
    function isSystemAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(getCurrentUserId())).data.role == 'admin';
    }
    
    // ========================================
    // Blueprint 相關函數
    // ========================================
    
    /**
     * 檢查使用者是否為 Blueprint 成員
     */
    function isBlueprintMember(blueprintId) {
      let memberId = getCurrentUserId() + '_' + blueprintId;
      return exists(/databases/$(database)/documents/blueprintMembers/$(memberId));
    }
    
    /**
     * 檢查使用者在 Blueprint 中的角色
     */
    function getBlueprintMemberRole(blueprintId) {
      let memberId = getCurrentUserId() + '_' + blueprintId;
      let member = get(/databases/$(database)/documents/blueprintMembers/$(memberId));
      return member.data.role;
    }
    
    /**
     * 檢查使用者是否為 Blueprint Owner 或 Admin
     */
    function isBlueprintOwnerOrAdmin(blueprintId) {
      let role = getBlueprintMemberRole(blueprintId);
      return role in ['owner', 'admin'];
    }
    
    /**
     * 檢查使用者是否有特定權限
     */
    function hasPermission(blueprintId, permission) {
      let memberId = getCurrentUserId() + '_' + blueprintId;
      let member = get(/databases/$(database)/documents/blueprintMembers/$(memberId));
      return permission in member.data.permissions;
    }
    
    /**
     * 檢查 Blueprint Member 是否處於活躍狀態
     */
    function isMemberActive(blueprintId) {
      let memberId = getCurrentUserId() + '_' + blueprintId;
      let member = get(/databases/$(database)/documents/blueprintMembers/$(memberId));
      return member.data.status == 'active';
    }
    
    // ========================================
    // 組織相關函數
    // ========================================
    
    /**
     * 檢查使用者是否為組織成員
     */
    function isOrganizationMember(orgId) {
      let memberId = getCurrentUserId() + '_' + orgId;
      return exists(/databases/$(database)/documents/organizationMembers/$(memberId));
    }
    
    /**
     * 檢查使用者是否為組織 Owner 或 Admin
     */
    function isOrganizationOwnerOrAdmin(orgId) {
      let memberId = getCurrentUserId() + '_' + orgId;
      let member = get(/databases/$(database)/documents/organizationMembers/$(memberId));
      return member.data.role in ['owner', 'admin'];
    }
    
    // ========================================
    // 資料驗證函數
    // ========================================
    
    /**
     * 驗證任務資料結構
     */
    function validateTaskData(data) {
      return data.keys().hasAll(['blueprintId', 'title', 'status']) &&
             data.title is string &&
             data.title.size() > 0 &&
             data.title.size() <= 200 &&
             data.status in ['pending', 'in-progress', 'completed', 'archived'];
    }
    
    /**
     * 驗證 Blueprint 資料結構
     */
    function validateBlueprintData(data) {
      return data.keys().hasAll(['name', 'ownerType', 'ownerId']) &&
             data.name is string &&
             data.name.size() > 0 &&
             data.name.size() <= 100 &&
             data.ownerType in ['user', 'organization'];
    }
    
    // ========================================
    // Users Collection
    // ========================================
    
    match /users/{userId} {
      // 使用者只能讀取自己的資料
      allow read: if isAuthenticated() && getCurrentUserId() == userId;
      
      // 使用者可以更新自己的資料 (但不能修改 role)
      allow update: if isAuthenticated() && 
                       getCurrentUserId() == userId &&
                       !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role']);
      
      // 只有系統管理員可以創建和刪除使用者
      allow create, delete: if isSystemAdmin();
    }
    
    // ========================================
    // Organizations Collection
    // ========================================
    
    match /organizations/{orgId} {
      // 組織成員可以讀取
      allow read: if isAuthenticated() && isOrganizationMember(orgId);
      
      // 只有 Owner/Admin 可以更新組織資料
      allow update: if isAuthenticated() && isOrganizationOwnerOrAdmin(orgId);
      
      // 認證使用者可以創建組織
      allow create: if isAuthenticated();
      
      // 只有 Owner 可以刪除組織 (實際上應該是軟刪除)
      allow delete: if isAuthenticated() && isOrganizationOwnerOrAdmin(orgId);
    }
    
    // ========================================
    // Organization Members Collection
    // ========================================
    
    match /organizationMembers/{memberId} {
      // 組織成員可以讀取成員列表
      allow read: if isAuthenticated() && 
                     isOrganizationMember(resource.data.organizationId);
      
      // 只有 Owner/Admin 可以新增/移除成員
      allow create, update, delete: if isAuthenticated() && 
                                        isOrganizationOwnerOrAdmin(resource.data.organizationId);
    }
    
    // ========================================
    // Blueprints Collection
    // ========================================
    
    match /blueprints/{blueprintId} {
      // Blueprint 成員可以讀取
      allow read: if isAuthenticated() && isBlueprintMember(blueprintId);
      
      // 只有 Owner/Admin 可以更新 Blueprint
      allow update: if isAuthenticated() && 
                       isBlueprintOwnerOrAdmin(blueprintId) &&
                       validateBlueprintData(request.resource.data);
      
      // 認證使用者可以創建 Blueprint
      allow create: if isAuthenticated() && 
                       validateBlueprintData(request.resource.data);
      
      // 只有 Owner 可以刪除 Blueprint (實際上應該是軟刪除)
      allow delete: if isAuthenticated() && isBlueprintOwnerOrAdmin(blueprintId);
      
      // ========================================
      // Tasks Subcollection
      // ========================================
      
      match /tasks/{taskId} {
        // Blueprint 成員可以讀取任務
        allow read: if isAuthenticated() && 
                       isBlueprintMember(blueprintId) &&
                       isMemberActive(blueprintId);
        
        // 有 task:create 權限的成員可以創建任務
        allow create: if isAuthenticated() && 
                         isBlueprintMember(blueprintId) &&
                         isMemberActive(blueprintId) &&
                         hasPermission(blueprintId, 'task:create') &&
                         validateTaskData(request.resource.data) &&
                         request.resource.data.blueprintId == blueprintId;
        
        // 有 task:update 權限或任務被指派人可以更新任務
        allow update: if isAuthenticated() && 
                         isBlueprintMember(blueprintId) &&
                         isMemberActive(blueprintId) &&
                         (hasPermission(blueprintId, 'task:update') || 
                          resource.data.assignedTo == getCurrentUserId()) &&
                         validateTaskData(request.resource.data);
        
        // 只有有 task:delete 權限的成員可以刪除任務
        allow delete: if isAuthenticated() && 
                         isBlueprintMember(blueprintId) &&
                         isMemberActive(blueprintId) &&
                         hasPermission(blueprintId, 'task:delete');
      }
    }
    
    // ========================================
    // Blueprint Members Collection
    // ========================================
    
    match /blueprintMembers/{memberId} {
      // Blueprint 成員可以讀取成員列表
      allow read: if isAuthenticated() && 
                     isBlueprintMember(resource.data.blueprintId);
      
      // 只有 Owner/Admin 可以新增/修改/移除成員
      allow create, update: if isAuthenticated() && 
                               isBlueprintOwnerOrAdmin(resource.data.blueprintId);
      
      // 只有 Owner 可以刪除成員 (實際上應該是軟刪除)
      allow delete: if isAuthenticated() && 
                       isBlueprintOwnerOrAdmin(resource.data.blueprintId);
    }
    
    // ========================================
    // Audit Logs Collection (只寫不讀)
    // ========================================
    
    match /auditLogs/{logId} {
      // 只允許寫入，不允許讀取 (除了系統管理員)
      allow read: if isSystemAdmin();
      allow create: if isAuthenticated();
      allow update, delete: if false;  // 審計日誌不可修改或刪除
    }
  }
}
```

## 🧪 Security Rules 測試

### 使用 Firebase Emulator 測試

```bash
# 啟動 Emulator
firebase emulators:start

# 執行 Security Rules 測試
npm run test:rules
```

### 測試範例

```javascript
// firestore.rules.spec.js
const firebase = require('@firebase/rules-unit-testing');
const { readFileSync } = require('fs');

describe('Firestore Security Rules', () => {
  let testEnv;
  
  beforeAll(async () => {
    testEnv = await firebase.initializeTestEnvironment({
      projectId: 'gighub-test',
      firestore: {
        rules: readFileSync('firestore.rules', 'utf8'),
      },
    });
  });
  
  afterAll(async () => {
    await testEnv.cleanup();
  });
  
  beforeEach(async () => {
    await testEnv.clearFirestore();
  });
  
  describe('Tasks Collection', () => {
    it('should allow authenticated blueprint member to read tasks', async () => {
      const userId = 'user1';
      const blueprintId = 'blueprint1';
      
      // 設定測試資料
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`blueprintMembers/${userId}_${blueprintId}`).set({
          blueprintId,
          userId,
          role: 'member',
          status: 'active',
          permissions: ['task:read']
        });
        
        await context.firestore().doc(`blueprints/${blueprintId}/tasks/task1`).set({
          blueprintId,
          title: 'Test Task',
          status: 'pending'
        });
      });
      
      // 測試讀取權限
      const authenticatedContext = testEnv.authenticatedContext(userId);
      await firebase.assertSucceeds(
        authenticatedContext.firestore().doc(`blueprints/${blueprintId}/tasks/task1`).get()
      );
    });
    
    it('should deny unauthenticated user to read tasks', async () => {
      const blueprintId = 'blueprint1';
      
      // 設定測試資料
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`blueprints/${blueprintId}/tasks/task1`).set({
          blueprintId,
          title: 'Test Task',
          status: 'pending'
        });
      });
      
      // 測試未認證使用者
      const unauthenticatedContext = testEnv.unauthenticatedContext();
      await firebase.assertFails(
        unauthenticatedContext.firestore().doc(`blueprints/${blueprintId}/tasks/task1`).get()
      );
    });
    
    it('should allow member with task:create permission to create task', async () => {
      const userId = 'user1';
      const blueprintId = 'blueprint1';
      
      // 設定測試資料
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`blueprintMembers/${userId}_${blueprintId}`).set({
          blueprintId,
          userId,
          role: 'member',
          status: 'active',
          permissions: ['task:create']
        });
      });
      
      // 測試創建權限
      const authenticatedContext = testEnv.authenticatedContext(userId);
      await firebase.assertSucceeds(
        authenticatedContext.firestore().doc(`blueprints/${blueprintId}/tasks/task2`).set({
          blueprintId,
          title: 'New Task',
          status: 'pending'
        })
      );
    });
  });
});
```

## ✅ Security Rules 檢查清單

### 設計檢查 (MUST) 🔴

- [ ] 所有集合都有 Security Rules
- [ ] 實作多租戶資料隔離
- [ ] 使用 BlueprintMember 檢查成員資格
- [ ] 驗證使用者權限 (permissions array)
- [ ] 檢查成員狀態 (active/suspended/revoked)
- [ ] 資料驗證函數完整
- [ ] 防止權限提升攻擊

### 效能檢查 (SHOULD) ⚠️

- [ ] 減少 `get()` 呼叫次數
- [ ] 使用 `exists()` 而非 `get()` (當只需檢查存在)
- [ ] 避免巢狀 `get()` 呼叫
- [ ] 使用索引加速查詢

### 測試檢查 (SHOULD) ⚠️

- [ ] 測試認證使用者可以讀取
- [ ] 測試未認證使用者被拒絕
- [ ] 測試無權限成員被拒絕
- [ ] 測試資料驗證規則
- [ ] 測試跨 Blueprint 存取被拒絕

## 🚫 常見錯誤模式

### ❌ 錯誤: 在客戶端做權限檢查

```typescript
// ❌ 錯誤: 只在客戶端檢查
async deleteTask(taskId: string): Promise<void> {
  // ❌ 不安全，使用者可以繞過
  if (this.permissionService.hasPermission('task:delete')) {
    await this.taskRepository.delete(taskId);
  }
}
```

### ✅ 正確: Security Rules + 客戶端檢查

```typescript
// ✅ 正確: 雙重檢查
async deleteTask(taskId: string): Promise<void> {
  // ✅ UI 層檢查 (提供使用者回饋)
  if (!this.permissionService.hasPermission('task:delete')) {
    throw new Error('You do not have permission to delete tasks');
  }
  
  // ✅ Security Rules 會再次驗證 (防止繞過)
  await this.taskRepository.delete(taskId);
}
```

```javascript
// ✅ Firestore Security Rules
match /tasks/{taskId} {
  // ✅ 後端驗證 (真正的安全防線)
  allow delete: if isAuthenticated() && 
                   isBlueprintMember(resource.data.blueprintId) &&
                   hasPermission(resource.data.blueprintId, 'task:delete');
}
```

## 📚 參考資料

- Firestore Security Rules: https://firebase.google.com/docs/firestore/security/get-started
- Rules Language: https://firebase.google.com/docs/rules/rules-language
- Unit Testing: https://firebase.google.com/docs/rules/unit-tests
- Multi-tenancy: https://firebase.google.com/docs/firestore/solutions/multi-tenancy

---

**版本**: v1.0  
**最後更新**: 2025-12-18  
**維護者**: GigHub 開發團隊
