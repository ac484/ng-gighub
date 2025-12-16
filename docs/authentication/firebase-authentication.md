# Firebase Authentication Integration

## 概述 (Overview)

本文檔說明 GigHub 應用程式如何整合 Firebase Authentication 與現有的 @delon/auth 系統 (DA_SERVICE_TOKEN)。整合提供基於 Firebase 的電子郵件/密碼身份驗證，同時保持與現有 ng-alain 身份驗證模式的兼容性。

---

## 架構 (Architecture)

### 元件 (Components)

1. **Firebase Configuration** (`src/app/app.config.ts`)
   - 配置 Firebase 服務 (Auth, Firestore, Analytics 等)
   - 整合 reCAPTCHA Enterprise 進行機器人防護
   - 向 Angular 應用程式提供 Firebase 服務

2. **FirebaseAuthService** (`src/app/core/services/firebase-auth.service.ts`)
   - **應用程式的主要身份驗證服務**
   - 橋接 Firebase Auth 與 @delon/auth 的 DA_SERVICE_TOKEN
   - 提供身份驗證方法（登入、註冊、登出）
   - 同步 Firebase 用戶狀態與 Delon token 服務
   - 處理錯誤訊息和 i18n 整合

3. **Login Component** (`src/app/routes/passport/login/`)
   - 更新為使用 FirebaseAuthService 而非模擬 HTTP 呼叫
   - 電子郵件/密碼表單驗證
   - 與 StartupService 整合以進行應用程式初始化

### 資料流 (Data Flow)

```
用戶輸入 → Login Component → FirebaseAuthService → Firebase Auth
                ↓                    ↓
          表單驗證          同步到 DA_SERVICE_TOKEN
                ↓                    ↓
          錯誤處理            StartupService 載入
                ↓                    ↓
          UI 回饋            導航到儀表板
```

---

## 配置 (Configuration)

### Firebase 配置

`src/app/app.config.ts` 中的 Firebase 配置包含：

```typescript
const firebaseProviders: Array<Provider | EnvironmentProviders> = [
  provideFirebaseApp(() => initializeApp({
    apiKey: "AIzaSyCJ-eayGjJwBKsNIh3oEAG2GjbfTrvAMEI",
    authDomain: "elite-chiller-455712-c4.firebaseapp.com",
    projectId: "elite-chiller-455712-c4",
    storageBucket: "elite-chiller-455712-c4.firebasestorage.app",
    messagingSenderId: "7807661688",
    appId: "1:7807661688:web:5f96a5fe30b799f31d1f8d",
    measurementId: "G-5KJJ3DD2G7"
  })),
  provideAuth_alias(() => getAuth()),
  provideAnalytics(() => getAnalytics()),
  // ... 其他 Firebase 服務
  provideAppCheck(() => {
    const provider = new ReCaptchaEnterpriseProvider('6LcGnSUsAAAAAMIm1aYeWqoYNEmLphGIbwEfWJlc');
    return initializeAppCheck(undefined, { provider, isTokenAutoRefreshEnabled: true });
  }),
];
```

### reCAPTCHA 配置

- **Site Key**: `6LcGnSUsAAAAAMIm1aYeWqoYNEmLphGIbwEfWJlc`
- **Provider**: ReCaptchaEnterpriseProvider
- **自動刷新**: 已啟用

### Firebase 專案資訊

- **Project ID**: elite-chiller-455712-c4
- **Auth Domain**: elite-chiller-455712-c4.firebaseapp.com
- **API Key**: AIzaSyCJ-eayGjJwBKsNIh3oEAG2GjbfTrvAMEI

---

## 使用方法 (Usage)

### 使用電子郵件/密碼登入

```typescript
import { FirebaseAuthService } from '@core';

export class LoginComponent {
  private readonly firebaseAuth = inject(FirebaseAuthService);

  async signIn(email: string, password: string) {
    try {
      const user = await this.firebaseAuth.signInWithEmailAndPassword(email, password);
      // 用戶已驗證並設置 token
      this.router.navigateByUrl('/dashboard');
    } catch (error) {
      // 使用 i18n 訊息處理錯誤
      this.error = error.message;
    }
  }
}
```

### 使用電子郵件/密碼註冊

```typescript
async signUp(email: string, password: string) {
  try {
    const user = await this.firebaseAuth.signUpWithEmailAndPassword(email, password);
    // 用戶已創建並驗證
  } catch (error) {
    this.error = error.message;
  }
}
```

### 登出

```typescript
async signOut() {
  await this.firebaseAuth.signOut();
  // Token 已清除並重定向到登入頁面
}
```

### 檢查身份驗證狀態

```typescript
// Observable
this.firebaseAuth.isAuthenticated$.subscribe(isAuth => {
  console.log('用戶已驗證:', isAuth);
});

// 同步
const user = this.firebaseAuth.currentUser;
if (user) {
  console.log('用戶電子郵件:', user.email);
}
```

---

## Token 同步 (Token Synchronization)

`FirebaseAuthService` 自動同步 Firebase 身份驗證狀態與 @delon/auth token 服務：

### 1. 登入時

當用戶登入時，服務會：
- 獲取 Firebase ID token
- 創建符合 @delon/auth ITokenModel 介面的 token 物件
- 在 DA_SERVICE_TOKEN 中設置 token

### 2. Token 結構

```typescript
{
  token: string;      // Firebase ID token
  email: string;      // 用戶電子郵件
  uid: string;        // Firebase 用戶 ID
  name: string;       // 顯示名稱或電子郵件
  expired: number;    // Token 過期時間戳記（1 小時）
}
```

### 3. 登出時

當用戶登出時：
- 從 DA_SERVICE_TOKEN 清除 token
- 重定向到登入頁面

---

## 錯誤處理 (Error Handling)

服務為 Firebase Auth 錯誤提供 i18n 友好的錯誤訊息：

| Firebase 錯誤代碼 | i18n Key | 描述 |
|-------------------|----------|-------------|
| `auth/invalid-email` | `validation.email.wrong-format` | 無效的電子郵件格式 |
| `auth/user-disabled` | `auth.user-disabled` | 帳戶已停用 |
| `auth/user-not-found` | `auth.invalid-credentials` | 找不到用戶 |
| `auth/wrong-password` | `auth.invalid-credentials` | 密碼錯誤 |
| `auth/email-already-in-use` | `auth.email-already-exists` | 電子郵件已註冊 |
| `auth/weak-password` | `validation.password.strength.short` | 密碼太弱 |
| `auth/too-many-requests` | `auth.too-many-requests` | 超出速率限制 |

---

## 國際化 (Internationalization)

為 Firebase 身份驗證添加的 i18n 鍵（在 `src/assets/tmp/i18n/zh-TW.json` 中）：

```json
{
  "app.login.email-placeholder": "電子郵件",
  "app.login.password-placeholder": "密碼",
  "auth.user-disabled": "此帳戶已被停用",
  "auth.invalid-credentials": "電子郵件或密碼無效",
  "auth.email-already-exists": "此電子郵件已被使用",
  "auth.operation-not-allowed": "此操作不允許",
  "auth.too-many-requests": "請求過多，請稍後再試",
  "auth.unknown-error": "發生未知錯誤，請稍後再試"
}
```

---

## 安全考量 (Security Considerations)

1. **reCAPTCHA Enterprise**: 防護機器人和自動化攻擊
2. **密碼要求**: 最少 6 個字符（由 Firebase 強制執行）
3. **Token 過期**: ID token 在 1 小時後過期
4. **自動 Token 刷新**: Firebase 自動刷新 token
5. **僅 HTTPS**: Firebase Auth 在生產環境中需要 HTTPS

---

## 從模擬身份驗證遷移 (Migration from Mock Auth)

先前的實作使用模擬 HTTP 呼叫進行身份驗證。新的實作：

### 之前（模擬 HTTP）

```typescript
this.http.post('/login/account', { userName, password })
  .subscribe(res => {
    this.tokenService.set(res.user);
  });
```

### 之後（Firebase Auth）

```typescript
await this.firebaseAuth.signInWithEmailAndPassword(email, password);
// Token 由 FirebaseAuthService 自動設置
```

---

## 測試 (Testing)

### 創建測試用戶

在 Firebase 中創建測試用戶：

1. 前往 Firebase Console → Authentication
2. 使用電子郵件/密碼添加用戶
3. 在登入表單中使用這些憑證

### 本地開發

使用 Firebase 模擬器進行本地開發：

```typescript
// 在 app.config.ts 中（僅開發環境）
provideAuth(() => {
  const auth = getAuth();
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  return auth;
})
```

---

## 故障排除 (Troubleshooting)

### 問題: "auth/operation-not-allowed"

**解決方案**: 在 Firebase Console → Authentication → Sign-in methods 中啟用電子郵件/密碼身份驗證

### 問題: "auth/too-many-requests"

**解決方案**: 等待幾分鐘或通過 Firebase Console 重置密碼

### 問題: Token 未同步

**解決方案**: 檢查是否已注入 FirebaseAuthService 並調用了建構函式

### 問題: reCAPTCHA 未載入

**解決方案**: 驗證 site key 是否正確以及 Firebase Console 中是否已啟用 reCAPTCHA Enterprise

---

## 未來增強功能 (Future Enhancements)

1. **社交身份驗證**: 添加 Google、Facebook、GitHub 登入
2. **手機身份驗證**: 添加基於 SMS 的身份驗證
3. **密碼重置**: 實作忘記密碼流程
4. **電子郵件驗證**: 要求新用戶進行電子郵件驗證
5. **多因素身份驗證**: 添加 2FA 支援

---

## 實作摘要 (Implementation Summary)

### 問題陳述

應用程式在嘗試整合 Firebase 與 @angular/fire 時出現以下錯誤：

1. **重複的 `providers` 鍵** 在 `app.config.ts` ApplicationConfig 物件中
2. **無效的 Firebase 配置屬性**: `projectNumber` 和 `version` 在 FirebaseOptions 中不存在
3. **缺少 reCAPTCHA site key** 在 ReCaptchaEnterpriseProvider 建構函式中
4. **沒有整合** Firebase Auth 與 @delon/auth 的 DA_SERVICE_TOKEN

### 解決方案概述

成功整合 Firebase Authentication 與現有 @delon/auth 系統：

1. ✅ 修復重複 providers 屬性問題
2. ✅ 更正 Firebase 初始化配置
3. ✅ 添加 reCAPTCHA Enterprise site key
4. ✅ 創建 FirebaseAuthService 橋接
5. ✅ 更新登入元件以使用 Firebase Auth
6. ✅ 添加全面的 i18n 支援
7. ✅ 記錄整合

### 修改的檔案

1. `src/app/app.config.ts` - 修復 Firebase 配置和 providers
2. `src/app/core/services/firebase-auth.service.ts` - 新增橋接服務
3. `src/app/core/index.ts` - 匯出 FirebaseAuthService
4. `src/app/routes/passport/login/login.component.ts` - 使用 Firebase Auth
5. `src/app/routes/passport/login/login.component.html` - 更新表單欄位
6. `src/assets/tmp/i18n/zh-TW.json` - 添加 Firebase 錯誤訊息

### 建置結果

✅ **建置狀態**: SUCCESS

```
Application bundle generation complete. [19.256 seconds]
Initial total: 3.25 MB | 667.30 kB (gzipped)
```

### 主要優勢

1. **安全性**: Firebase Auth 提供企業級身份驗證與 reCAPTCHA 防護
2. **兼容性**: 與現有 @delon/auth 系統無縫整合
3. **可維護性**: 使用專用的 FirebaseAuthService 清晰分離關注點
4. **用戶體驗**: 使用 i18n 支援提供更好的錯誤訊息
5. **可擴展性**: 易於擴展社交登入、手機身份驗證等

---

## 參考資料 (References)

- [AngularFire Documentation](https://github.com/angular/angularfire)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [@delon/auth Documentation](https://ng-alain.com/auth)
- [reCAPTCHA Enterprise](https://cloud.google.com/recaptcha-enterprise/docs)

---

## 版本資訊 (Version Information)

- **@angular/fire**: 20.0.1
- **Angular**: 20.3.0
- **ng-alain**: 20.1.0
- **Firebase SDK**: 包含在 @angular/fire 中

---

## 依賴項 (Dependencies)

所有依賴項已在 package.json 中存在：
- `@angular/fire`: 20.0.1 ✅
- `@angular/core`: 20.3.0 ✅
- `@delon/auth`: 20.1.0 ✅

無需額外套件！

---

## 結論 (Conclusion)

Firebase Authentication 整合已完成並準備好進行測試。該解決方案：
- 修復所有編譯錯誤
- 提供 Firebase Auth 與 @delon/auth 之間的清晰橋接
- 保持與現有 ng-alain 模式的兼容性
- 包含全面的文檔
- 遵循 Angular 和 TypeScript 最佳實踐

應用程式現在可以使用 Firebase 進行真實的身份驗證，而不是模擬 HTTP 呼叫。

---

*文件版本: 1.0.0*  
*最後更新: 2025-01-09*  
*作者: GitHub Copilot AI Agent*  
*專案: GigHub - 工地施工進度追蹤管理系統*
