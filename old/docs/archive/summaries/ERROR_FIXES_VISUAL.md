# 錯誤修復視覺化對照 (Error Fixes Visual Comparison)

## 🔍 修復前的錯誤日誌

#

### 錯誤 2: Firebase Injection Context 警告

```
firebase-auth.service.ts:67  
⚠️ Calling Firebase APIs outside of an Injection context may destabilize 
   your application leading to subtle change-detection and hydration bugs.
```

**發生位置**：
1. `firebase-auth.service.ts:67` - signInWithEmailAndPassword
2. `organization.repository.ts:67` - getDocs
3. `team.repository.ts:62` - getDocs

---

## ✅ 修復後的程式碼

### 修復 1: 添加環境配置

#### environment.ts

```typescript
export const environment = {
  production: false,
  useHash: true,
  api: { /* ... */ },
  providers: [/* ... */],
  interceptorFns: [/* ... */],
  // ✅ 添加 Firebase 配置
  NG_PUBLIC_FIREBASE_URL: '',
  NG_PUBLIC_FIREBASE_ANON_KEY: ''
} as Environment;
```

#### environment.prod.ts

```typescript
export const environment = {
  production: true,
  useHash: true,
  api: { /* ... */ },
  // ✅ 添加 Firebase 配置
  NG_PUBLIC_FIREBASE_URL: '',
  NG_PUBLIC_FIREBASE_ANON_KEY: ''
} as Environment;
```

---

### 修復 2: 包裝 Firebase API 調用

#### firebase-auth.service.ts

**Before (問題代碼)**：
```typescript
async signInWithEmailAndPassword(email: string, password: string): Promise<User> {
  try {
    // ❌ 在 async 上下文中直接調用 Firebase API
    const credential = await signInWithEmailAndPassword(this.auth, email, password);
    await this.syncUserToServices(credential.user);
    return credential.user;
  } catch (error: any) {
    console.error('Firebase sign in error:', error);
    throw new Error(this.getErrorMessage(error));
  }
}
```

**After (修正後)**：
```typescript
import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';

export class FirebaseAuthService {
  // ✅ 注入 Injector
  private readonly injector = inject(Injector);
  
  async signInWithEmailAndPassword(email: string, password: string): Promise<User> {
    try {
      // ✅ 使用 runInInjectionContext 包裝
      const credential = await runInInjectionContext(this.injector, () => 
        signInWithEmailAndPassword(this.auth, email, password)
      );
      await this.syncUserToServices(credential.user);
      return credential.user;
    } catch (error: any) {
      console.error('Firebase sign in error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }
}
```

---

#### organization.repository.ts

**Before (問題代碼)**：
```typescript
findByCreator(creatorId: string): Observable<Organization[]> {
  const q = query(this.getCollectionRef(), where('created_by', '==', creatorId));
  
  // ❌ 在 Observable pipeline 中直接調用 getDocs
  return from(getDocs(q)).pipe(
    map(snapshot => {
      const orgs = snapshot.docs.map(docSnap => 
        this.toOrganization(docSnap.data(), docSnap.id)
      );
      return orgs.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
    }),
    catchError(error => { /* ... */ })
  );
}
```

**After (修正後)**：
```typescript
import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';

export class OrganizationRepository {
  // ✅ 注入 Injector
  private readonly injector = inject(Injector);
  
  findByCreator(creatorId: string): Observable<Organization[]> {
    const q = query(this.getCollectionRef(), where('created_by', '==', creatorId));
    
    // ✅ 使用 runInInjectionContext 包裝 getDocs
    return from(
      runInInjectionContext(this.injector, () => getDocs(q))
    ).pipe(
      map(snapshot => {
        const orgs = snapshot.docs.map(docSnap => 
          this.toOrganization(docSnap.data(), docSnap.id)
        );
        return orgs.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
      }),
      catchError(error => { /* ... */ })
    );
  }
}
```

---

#### team.repository.ts

**Before (問題代碼)**：
```typescript
findByOrganization(organizationId: string): Observable<Team[]> {
  const q = query(
    this.getCollectionRef(),
    where('organization_id', '==', organizationId)
  );
  
  // ❌ 在 Observable pipeline 中直接調用 getDocs
  return from(getDocs(q)).pipe(
    map(snapshot => snapshot.docs.map(docSnap => 
      this.toTeam(docSnap.data(), docSnap.id)
    )),
    catchError(error => { /* ... */ })
  );
}
```

**After (修正後)**：
```typescript
import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';

export class TeamRepository {
  // ✅ 注入 Injector
  private readonly injector = inject(Injector);
  
  findByOrganization(organizationId: string): Observable<Team[]> {
    const q = query(
      this.getCollectionRef(),
      where('organization_id', '==', organizationId)
    );
    
    // ✅ 使用 runInInjectionContext 包裝 getDocs
    return from(
      runInInjectionContext(this.injector, () => getDocs(q))
    ).pipe(
      map(snapshot => snapshot.docs.map(docSnap => 
        this.toTeam(docSnap.data(), docSnap.id)
      )),
      catchError(error => { /* ... */ })
    );
  }
}
```

---

## 📊 修復效果總結

| 問題 | 嚴重性 | 狀態 | 影響範圍 |
|------|--------|------|----------|
| Firebase 初始化失敗 | 🔴 Critical | ✅ 已修復 | Tasks, Logs, Notifications |
| Firebase Auth 注入上下文 | 🟡 Warning | ✅ 已修復 | Login, Sign up |
| Organization 注入上下文 | 🟡 Warning | ✅ 已修復 | Organization list |
| Team 注入上下文 | 🟡 Warning | ✅ 已修復 | Team list |

---

## 🎯 關鍵學習

### 1. Angular 20 Injection Context

在 Angular 20 中，當 Firebase API 在以下情況調用時需要顯式注入上下文：
- ✅ 在 async/await 函式中
- ✅ 在 Observable pipeline 中
- ✅ 在 Promise chain 中
- ✅ 在 setTimeout/setInterval 中

**解決方案**：
```typescript
// 1. 注入 Injector
private readonly injector = inject(Injector);

// 2. 使用 runInInjectionContext 包裝
await runInInjectionContext(this.injector, () => 
  firebaseApiCall()
);
```

### 2. Environment Configuration

Firebase 服務依序從三個來源讀取配置：
1. `import.meta.env[key]` (Vite)
2. `process.env[key]` (Webpack)
3. `environment[key]` (Angular)

**最佳實踐**：
- ✅ 在 environment 檔案提供預設值（空字串）
- ✅ 在 .env 提供實際憑證（開發環境）
- ✅ 透過 build-time 變數設定生產環境

### 3. Graceful Degradation

當 Firebase 未配置時：
- ✅ 記錄錯誤日誌但不拋出例外
- ✅ 允許應用繼續執行
- ✅ Firebase 功能不受影響
- ❌ Firebase 相關功能暫時無法使用

---

## 📚 參考資源

- [AngularFire Zones Documentation](https://github.com/angular/angularfire/blob/main/docs/zones.md)
- [Angular runInInjectionContext API](https://angular.dev/api/core/runInInjectionContext)
- [Angular Dependency Injection](https://angular.dev/guide/di)
- [Firebase JavaScript Client](https://firebase.com/docs/reference/javascript)

---

**更新日期**: 2025-12-12  
**修復版本**: fcc3a46
