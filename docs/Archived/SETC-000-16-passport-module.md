# SETC-000-16: Passport Module (身份驗證模組)

> **模組 ID**: `passport`  
> **版本**: 1.0.0  
> **狀態**: ✅ 已實作完成  
> **優先級**: P0 (核心)  
> **架構**: Foundation Layer - Authentication  
> **歸檔日期**: 2025-12-16

---

## 📋 模組概述

Passport 模組處理所有身份驗證與使用者入門流程，使用 Firebase Authentication (@angular/fire/auth) 作為主要身份提供者。

### 業務範圍

所有身份驗證與入門流程，包括：
- 登入 (Email/Password + 社交登入)
- 註冊 (新使用者註冊與郵件驗證)
- 密碼重設 (忘記密碼流程)
- 鎖定畫面 (工作階段鎖定)
- OAuth 回調處理

### 核心特性

- ✅ **Email/Password 認證**: 傳統帳密登入
- ✅ **社交登入**: Google OAuth、GitHub OAuth
- ✅ **郵件驗證**: 註冊後發送驗證信
- ✅ **密碼重設**: 忘記密碼流程
- ✅ **記住我功能**: 持久化登入狀態
- ✅ **鎖定畫面**: 工作階段安全鎖定
- ✅ **返回 URL**: 登入後重定向到原頁面

---

## 🏗️ 架構設計

### 目錄結構

```
src/app/routes/passport/
├── AGENTS.md                    # 模組指引
├── routes.ts                    # 路由配置
├── callback.component.ts        # OAuth 回調處理器
├── login/                       # 登入流程
│   ├── login.component.ts       # 登入元件
│   ├── login.component.html     # 登入模板
│   └── login.component.scss     # 登入樣式
├── register/                    # 註冊流程
│   ├── register.component.ts    # 註冊元件
│   ├── register.component.html  # 註冊模板
│   └── register.component.scss  # 註冊樣式
├── register-result/             # 註冊結果頁
│   ├── register-result.component.ts
│   └── register-result.component.html
└── lock/                        # 鎖定畫面
    ├── lock.component.ts
    └── lock.component.html
```

### 認證策略

```
使用者提交憑證
    ↓
Firebase Auth 驗證
    ↓
返回 ID Token
    ↓
儲存在 FirebaseAuth 服務
    ↓
重定向到儀表板/返回 URL
    ↓
Token 自動刷新
```

---

## 📦 核心功能

### 1️⃣ Login Component (登入元件)

**職責**: 處理使用者登入流程

**核心功能**:
- Email/Password 登入
- Google/GitHub 社交登入
- 記住我功能
- 忘記密碼連結
- 返回 URL 重定向

**實作規範**:
```typescript
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private auth = inject(Auth);
  private router = inject(Router);
  
  // Signals
  loading = signal(false);
  socialLoading = signal(false);
  
  // Reactive Form
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [false]
  });
  
  // Email/Password Login
  async onSubmit(): Promise<void> {
    if (!this.loginForm.valid) return;
    
    this.loading.set(true);
    try {
      const { email, password } = this.loginForm.value;
      await signInWithEmailAndPassword(this.auth, email!, password!);
      this.router.navigate([this.returnUrl || '/dashboard']);
    } catch (error) {
      this.handleFirebaseError(error);
    } finally {
      this.loading.set(false);
    }
  }
  
  // Social Login
  async socialLogin(provider: 'google' | 'github'): Promise<void> {
    this.socialLoading.set(true);
    try {
      const authProvider = provider === 'google' 
        ? new GoogleAuthProvider()
        : new GithubAuthProvider();
      await signInWithPopup(this.auth, authProvider);
      this.router.navigate([this.returnUrl || '/dashboard']);
    } catch (error) {
      this.handleFirebaseError(error);
    } finally {
      this.socialLoading.set(false);
    }
  }
}
```

### 2️⃣ Register Component (註冊元件)

**職責**: 處理新使用者註冊流程

**核心功能**:
- 使用者註冊表單
- 密碼強度驗證
- 條款與條件勾選
- 郵件驗證發送
- 社交註冊支援

**密碼驗證規則**:
- 至少 8 個字元
- 包含大寫字母
- 包含小寫字母
- 包含數字
- 包含特殊字元

**實作規範**:
```typescript
registerForm = this.fb.group({
  displayName: ['', [Validators.required, Validators.minLength(2)]],
  email: ['', [Validators.required, Validators.email]],
  password: ['', [
    Validators.required,
    Validators.minLength(8),
    this.passwordStrengthValidator
  ]],
  confirmPassword: ['', Validators.required],
  agreeTerms: [false, Validators.requiredTrue]
}, {
  validators: this.passwordMatchValidator
});

async onSubmit(): Promise<void> {
  if (!this.registerForm.valid) return;
  
  this.loading.set(true);
  try {
    const { email, password, displayName } = this.registerForm.value;
    
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(
      this.auth, email!, password!
    );
    
    // Update display name
    await updateProfile(userCredential.user, { displayName });
    
    // Send email verification
    await sendEmailVerification(userCredential.user);
    
    // Navigate to result page
    this.router.navigate(['/passport/register-result']);
  } catch (error) {
    this.handleFirebaseError(error);
  } finally {
    this.loading.set(false);
  }
}
```

### 3️⃣ Lock Screen Component (鎖定畫面)

**職責**: 工作階段安全鎖定

**核心功能**:
- 顯示當前使用者頭像
- 要求密碼解鎖
- 以不同使用者登入選項
- 自動鎖定 (非活動時間後)

**實作規範**:
```typescript
@Component({
  selector: 'app-lock',
  standalone: true,
  template: `
    <div class="lock-screen">
      <img [src]="currentUser()?.photoURL || defaultAvatar" />
      <h2>{{ currentUser()?.displayName }}</h2>
      <form [formGroup]="unlockForm" (ngSubmit)="unlock()">
        <input 
          type="password" 
          formControlName="password" 
          placeholder="輸入密碼解鎖"
        />
        <button type="submit" [disabled]="loading()">解鎖</button>
      </form>
      <a (click)="loginAsOther()">以其他使用者登入</a>
    </div>
  `
})
export class LockComponent {
  currentUser = signal<User | null>(null);
  loading = signal(false);
  
  async unlock(): Promise<void> {
    const password = this.unlockForm.value.password;
    
    try {
      // Re-authenticate with Firebase
      const credential = EmailAuthProvider.credential(
        this.currentUser()!.email!,
        password!
      );
      await reauthenticateWithCredential(this.currentUser()!, credential);
      
      // Unlock successful
      this.router.navigate(['/dashboard']);
    } catch (error) {
      this.msg.error('密碼錯誤');
    }
  }
}
```

### 4️⃣ Password Reset (密碼重設)

**職責**: 忘記密碼流程

**核心功能**:
- 發送密碼重設郵件
- 驗證重設連結
- 設定新密碼

---

## 🔌 Firebase Authentication 整合

### 支援的認證方式

| 方式 | 狀態 | 說明 |
|------|------|------|
| Email/Password | ✅ 已實作 | 傳統帳密登入 |
| Google OAuth | ✅ 已實作 | Google 帳號登入 |
| GitHub OAuth | ✅ 已實作 | GitHub 帳號登入 |
| Email Link | 📋 可選 | 無密碼登入 |
| Phone | 📋 可選 | 手機號碼驗證 |

### Firebase Auth 配置

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => {
      const auth = getAuth();
      // Enable persistence
      setPersistence(auth, browserLocalPersistence);
      return auth;
    })
  ]
};
```

---

## 🔒 安全性特性

### 1. 郵件驗證
註冊後自動發送驗證郵件，未驗證使用者功能受限。

### 2. 密碼強度要求
強制密碼複雜度規則，提升帳號安全性。

### 3. 工作階段管理
支援「記住我」與自動登出機制。

### 4. OAuth 安全
使用 Firebase OAuth 流程，不儲存第三方憑證。

### 5. CSRF 保護
Firebase SDK 內建 CSRF token 保護。

---

## 📡 路由配置

```typescript
// passport/routes.ts
export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    data: { title: '登入' }
  },
  {
    path: 'register',
    component: RegisterComponent,
    data: { title: '註冊' }
  },
  {
    path: 'register-result',
    component: RegisterResultComponent,
    data: { title: '註冊成功' }
  },
  {
    path: 'lock',
    component: LockComponent,
    canActivate: [authGuard],
    data: { title: '鎖定畫面' }
  },
  {
    path: 'callback',
    component: CallbackComponent
  }
];
```

---

## 🎨 UI/UX 特性

### 響應式設計
- 桌面: 左右分欄 (品牌 + 表單)
- 平板/行動: 上下堆疊

### 表單驗證
- 即時驗證回饋
- 清晰的錯誤訊息
- 視覺提示 (圖示、顏色)

### 載入狀態
- 按鈕載入指示器
- 禁用表單防止重複提交

---

## 🧪 錯誤處理

### Firebase 錯誤代碼對應

| Firebase 錯誤 | 使用者訊息 |
|--------------|-----------|
| `auth/user-not-found` | 此帳號不存在 |
| `auth/wrong-password` | 密碼錯誤 |
| `auth/email-already-in-use` | 此郵件已被註冊 |
| `auth/weak-password` | 密碼強度不足 |
| `auth/invalid-email` | 郵件格式錯誤 |
| `auth/user-disabled` | 此帳號已被停用 |
| `auth/too-many-requests` | 嘗試次數過多，請稍後再試 |

---

## 📝 待實作功能

1. ⏳ **Email Link 認證**: 無密碼登入
2. ⏳ **雙因素驗證 (2FA)**: 額外安全層級
3. ⏳ **手機號碼驗證**: SMS 驗證碼
4. ⏳ **生物辨識**: 指紋/臉部辨識 (PWA)
5. ⏳ **社交帳號綁定**: 綁定多個社交帳號
6. ⏳ **裝置管理**: 查看與管理登入裝置

---

## 🔗 相關模組

- **User Module**: 使用者個人資料管理
- **Organization Module**: 登入後組織選擇
- **Layout Module**: Passport Layout 整合
- **Log Module**: 記錄登入活動

---

## 📚 參考資源

- [Passport 模組 AGENTS.md](../../src/app/routes/passport/AGENTS.md)
- [Firebase Authentication 文檔](https://firebase.google.com/docs/auth)
- [核心開發規範](../discussions/⭐.md)

---

**文檔維護**: 2025-12-16  
**維護者**: Architecture Team  
**歸檔原因**: 備查使用，記錄模組功能與架構設計
