# Passport Module Agent Guide

The Passport module handles all authentication and user onboarding flows for GigHub using Firebase Authentication (@angular/fire/auth).

## Module Purpose

The Passport module provides:
- **Login** - Email/password and social authentication (Google, GitHub)
- **Registration** - New user signup with email verification
- **Password Reset** - Forgot password flow
- **Lock Screen** - Session lock for security
- **Registration Result** - Post-registration confirmation
- **Firebase Auth Integration** - Using @angular/fire/auth

## Module Structure

```
src/app/routes/passport/
├── AGENTS.md                           # This file
├── routes.ts                           # Module routing
├── callback.component.ts               # OAuth callback handler
├── login/                              # Login flow
│   ├── login.component.ts              # Login form
│   ├── login.component.html            # Login template
│   └── login.component.scss            # Login styles
├── register/                           # Registration flow
│   ├── register.component.ts           # Registration form
│   ├── register.component.html         # Registration template
│   └── register.component.scss         # Registration styles
├── register-result/                    # Post-registration page
│   ├── register-result.component.ts    # Success page
│   └── register-result.component.html  # Success template
└── lock/                               # Lock screen
    ├── lock.component.ts               # Lock form
    └── lock.component.html             # Lock template
```

## Authentication Strategy

**規則**:
- 使用 Firebase Authentication (@angular/fire/auth) 作為主要身份提供者
- 支援的認證方式：Email/Password、Google OAuth、GitHub OAuth（選用）、Email Link（選用）
- 認證流程：用戶提交憑證 → Firebase Auth 驗證 → 返回 ID token → 儲存在 FirebaseAuth 服務 → 重定向到儀表板/返回 URL → Token 自動刷新

## Login Component

**規則**:
- 必須支援 Email/Password 登入
- 必須支援社交登入（Google/GitHub OAuth）
- 必須支援「記住我」功能
- 必須提供「忘記密碼」連結
- 必須提供註冊連結
- 必須支援返回 URL 重定向
- 必須使用 `signal()` 管理 `loading` 和 `socialLoading` 狀態
- 必須使用 Reactive Forms 建立登入表單
- 必須驗證表單欄位（email 必填且格式正確，password 必填且至少 6 個字元）
- 必須處理 Firebase 錯誤代碼並顯示適當的錯誤訊息
- 必須在登入成功後重定向到返回 URL 或預設儀表板

## Register Component

**規則**:
- 必須在註冊後發送郵件驗證
- 必須驗證密碼強度
- 必須提供「條款與條件」勾選框
- 必須支援用戶個人資料欄位（顯示名稱和選填欄位）
- 必須支援社交註冊（Google/GitHub 帳號建立）
- 必須使用 Reactive Forms 建立註冊表單
- 必須驗證密碼複雜度（大寫字母、小寫字母、數字、特殊字元）
- 必須驗證密碼確認是否匹配
- 必須在註冊成功後導航到註冊結果頁面

## Lock Screen Component

**規則**:
- 必須要求密碼才能解鎖
- 必須顯示當前用戶頭像
- 必須支援自動鎖定（非活動一段時間後）
- 必須提供「以不同用戶登入」選項
- 必須使用 Firebase Auth 重新驗證
- 必須在解鎖成功後導航到儀表板

## Firebase Auth Service

**規則**:
- 必須使用 `@angular/fire/auth` 的 `Auth` 服務
- 必須使用 `onAuthStateChanged` 監聽認證狀態變化
- 必須提供 `currentUserSignal` 作為 Signal
- 必須實作 `signIn()` 方法（Email/Password）
- 必須實作 `signUp()` 方法（Email/Password）
- 必須實作 `signOut()` 方法
- 必須實作 `signInWithGoogle()` 方法
- 必須實作 `signInWithGithub()` 方法
- 必須實作 `sendEmailVerification()` 方法
- 必須實作 `sendPasswordResetEmail()` 方法
- 必須提供 `isAuthenticated()` 和 `isEmailVerified()` 輔助方法

## Route Guards

### Auth Guard

**規則**:
- 必須檢查用戶是否已認證
- 如果未認證，必須重定向到登入頁面並帶上返回 URL
- 必須使用 `inject()` 注入 `FirebaseAuthService` 和 `Router`

### Guest Guard

**規則**:
- 必須防止已認證用戶存取登入頁面
- 如果已登入，必須重定向到儀表板
- 必須使用 `inject()` 注入 `FirebaseAuthService` 和 `Router`

## Routing Configuration

**規則**:
- `/login` 路由必須使用 `guestGuard` 保護
- `/register` 路由必須使用 `guestGuard` 保護
- `/register-result` 路由不需要守衛
- `/lock` 路由必須使用 `authGuard` 保護
- `/callback` 路由用於 OAuth 回調處理
- 所有路由必須設定 `title` 資料屬性

## Best Practices

### Security

**規則**:
1. 絕對不能以明文儲存密碼
2. 必須使用 Firebase 的安全認證
3. 必須實作郵件驗證
4. 必須強制執行強密碼政策
5. 生產環境必須僅使用 HTTPS

### User Experience

**規則**:
1. 必須顯示清楚的錯誤訊息
2. 必須提供載入狀態
3. 必須記住返回 URL
4. 必須自動聚焦輸入欄位
5. 必須支援鍵盤導航

### Firebase Integration

**規則**:
1. 必須處理所有 Firebase 錯誤代碼
2. 必須使用 Firebase Auth 狀態監聽器
3. 必須實作適當的 token 刷新
4. 必須設定 Firebase 持久性

### Testing

**規則**:
1. 必須在測試中模擬 Firebase Auth
2. 必須測試錯誤情境
3. 必須驗證守衛行為
4. 必須測試社交登入流程

## Troubleshooting

**規則**:
- 如果登入失敗並顯示 "auth/operation-not-allowed"，必須在 Firebase Console 啟用 Email/Password 認證
- 如果 Google 登入彈出視窗被阻擋，必須使用 `signInWithRedirect()` 而非 `signInWithPopup()`
- 如果未發送郵件驗證，必須檢查 Firebase 郵件範本設定
- 如果出現 token 過期錯誤，Firebase SDK 會自動刷新 token，必須確保適當的錯誤處理

## Related Documentation

- **[App Module](../../AGENTS.md)** - Application bootstrap
- **[Core Services](../../core/AGENTS.md)** - Auth service
- **[Firebase Auth Docs](https://firebase.google.com/docs/auth/web/start)** - Official documentation

---

**Module Version**: 1.0.0  
**Last Updated**: 2025-12-09  
**Status**: Production Ready
