# Authentication Race Conditions - 深度分析報告

## 📋 Executive Summary (執行摘要)

本文件深入分析 GigHub 專案中的認證相關問題，包括：
1. 雙重「請先登入」訊息的本質原因
2. 'User' fallback 的多種本質處理方案
3. 專案中識別的 19 個邏輯問題詳細清單
4. 完整的解決方案與最佳實踐建議

---

## 1️⃣ 雙重「請先登入」訊息分析

### 問題描述

**現象:** 使用者已經登入，但頁面刷新時會彈出「請先登入」訊息，且出現兩次。

**為什麼這不是正常現象？**

這絕對不正常！使用者已經登入，系統不應該顯示任何「請先登入」的錯誤訊息，更不應該顯示兩次。這是一個嚴重的 UX (使用者體驗) 問題。

---

### 深層技術原因

#### 根本原因 #1: Angular Effect 執行時序問題

**程式碼位置:** `src/app/routes/blueprint/blueprint-list.component.ts:86-96`

```typescript
constructor() {
  // Auto-reload blueprints when workspace context changes
  effect(() => {
    const contextType = this.workspaceContext.contextType();
    const contextId = this.workspaceContext.contextId();
    
    // Skip if no context is set
    if (!contextId && contextType !== ContextType.USER) return;
    
    this.loadBlueprints();  // ⚠️ 問題：沒有檢查 isAuthenticated
  });
}
```

**問題分析:**
- Angular `effect()` 是一個 reactive primitive，會在其依賴的 signal 變更時自動執行
- 當頁面刷新時，`contextType()` 和 `contextId()` 立即有值（從 localStorage 恢復）
- 但此時 Firebase authentication 尚未完成，`currentUser` 仍是 `null`
- Effect 立即觸發 → `loadBlueprints()` 執行 → 檢查到 `!user` → 顯示錯誤（第 1 次）

---

#### 根本原因 #2: Firebase Auth State 變更觸發第二次

**程式碼位置:** `src/app/shared/services/workspace-context.service.ts:161-194`

```typescript
constructor() {
  effect(() => {
    const user = this.firebaseUser();  // Firebase auth observable → signal
    
    if (user) {
      // 設定 currentUserState
      this.currentUserState.set(accountData);
      
      untracked(() => {
        this.loadUserData(user.uid);
        this.restoreContext();  // ⚠️ 這會觸發 context 變更
      });
    } else {
      this.reset();
    }
  }, { allowSignalWrites: true });
}
```

**時序圖:**

```
T0: 頁面刷新
    ├─ Angular app 初始化
    └─ WorkspaceContextService constructor 執行

T1: Context 從 localStorage 恢復
    ├─ contextType = USER
    ├─ contextId = null
    └─ BlueprintListComponent effect 觸發 (第 1 次)
        └─ loadBlueprints() → !user → 錯誤訊息 #1 ❌

T2: Firebase Auth 狀態變更
    ├─ firebaseUser() 從 null → User object
    └─ WorkspaceContextService effect 執行
        └─ currentUserState.set(accountData)

T3: restoreContext() 執行
    ├─ 可能修改 contextType/contextId
    └─ BlueprintListComponent effect 再次觸發 (第 2 次)
        └─ 如果時序問題，currentUser 可能還沒完全同步
            └─ loadBlueprints() → !user → 錯誤訊息 #2 ❌

T4: 認證完全同步
    └─ 一切正常運作
```

---

#### 根本原因 #3: 冗餘的認證檢查

**程式碼位置:** `src/app/routes/blueprint/blueprint-list.component.ts:170-174`

```typescript
private loadBlueprints(): void {
  const user = this.authService.currentUser;
  if (!user) {
    this.message.error('請先登入');  // ⚠️ 這是 UI 錯誤訊息
    return;
  }
  // ...
}
```

**問題:**
- 這個檢查本身是防禦性的 (defensive)，但實作方式錯誤
- 使用 `this.message.error()` 會直接顯示 UI 錯誤訊息給使用者
- 在初始化階段，這個檢查會被觸發兩次（根據上述時序）
- 每次都顯示錯誤訊息 → 使用者看到兩次

---

### 為什麼會觸發兩次？詳細解釋

**第一次觸發:**
1. 頁面刷新
2. Angular 重新初始化
3. `BlueprintListComponent` constructor 執行
4. `effect()` 註冊，立即執行檢查
5. `contextType()` 和 `contextId()` 有值（localStorage）
6. 但 `this.authService.currentUser` 是 `null`（Firebase 尚未完成）
7. 條件 `if (!contextId && contextType !== ContextType.USER)` 不成立（允許執行）
8. 調用 `loadBlueprints()`
9. 檢查 `if (!user)` → 成立 → 顯示「請先登入」❌ (第 1 次)

**第二次觸發:**
1. Firebase Auth 完成初始化
2. `firebaseUser` signal 從 `null` 變成 User object
3. `WorkspaceContextService` 的 effect 執行
4. 設定 `currentUserState`
5. 調用 `restoreContext()` → 可能改變 `contextType` 或 `contextId`
6. 這觸發 `BlueprintListComponent` 的 effect 再次執行
7. 如果同步時序有延遲，`currentUser` 可能還沒完全更新
8. 再次調用 `loadBlueprints()`
9. 再次檢查 `if (!user)` → 如果還是 `null` → 再次顯示「請先登入」❌ (第 2 次)

---

### 本質問題總結

1. **沒有認證狀態守衛 (No Auth State Guard)**
   - Effect 沒有檢查 `isAuthenticated()` 狀態
   - 允許在認證未完成時執行業務邏輯

2. **不當的錯誤處理 (Improper Error Handling)**
   - 防禦性檢查使用 UI 錯誤訊息
   - 應該使用 console.warn 或 silent fail

3. **時序依賴混亂 (Timing Dependency Confusion)**
   - 多個 signals 和 effects 之間的依賴關係不清晰
   - 沒有明確的「認證完成」狀態

---

## 2️⃣ 'User' Fallback 的本質處理方案

### 問題背景

**程式碼位置:** `src/app/core/services/firebase-auth.service.ts:122`

```typescript
const displayName = user.displayName || user.email?.split('@')[0] || 'User';
```

**問題:** 
- 當 Firebase user 沒有 `displayName` 和 `email` 時，fallback 到 `'User'`
- 這個字串在某些渲染情境下會被轉換為大寫 `"USER"`
- 造成 UI 上顯示混淆的文字

---

### 方案 1: 改變 Fallback 值 (推薦 - 最簡單)

**實作:**
```typescript
// 優先級: displayName > email 前綴 > 完整 email > 中文預設值
const displayName = user.displayName 
  || user.email?.split('@')[0] 
  || user.email 
  || '使用者';
```

**優點:**
- ✅ 修改最小（1 行）
- ✅ 優先使用更具識別性的 email
- ✅ 中文預設值更清楚
- ✅ 在源頭修復（Single Source of Truth）

**缺點:**
- ⚠️ 仍然依賴 string fallback
- ⚠️ 如果 user 完全沒有資料，仍會顯示「使用者」

**適用場景:** 
- 快速修復
- 低風險
- Occam's Razor（最簡解決方案）

---

### 方案 2: 使用 UID 作為 Fallback

**實作:**
```typescript
const displayName = user.displayName 
  || user.email?.split('@')[0] 
  || user.email 
  || `User-${user.uid.substring(0, 8)}`;  // 使用 UID 前 8 碼
```

**優點:**
- ✅ 永遠有唯一識別碼
- ✅ 便於除錯和追蹤
- ✅ 不會顯示混淆的通用名稱

**缺點:**
- ⚠️ UID 對使用者不友善
- ⚠️ 可能洩露系統內部資訊

**適用場景:**
- 開發/測試環境
- Admin 介面
- 需要明確識別使用者時

---

### 方案 3: 強制要求 DisplayName/Email (最嚴格)

**實作:**
```typescript
private async syncUserToServices(user: User): Promise<void> {
  // 強制檢查
  if (!user.displayName && !user.email) {
    console.error('User missing required display name or email');
    // 導向到 profile completion 頁面
    this.router.navigate(['/profile/complete']);
    return;
  }
  
  const displayName = user.displayName || user.email!.split('@')[0];
  // ... rest of sync logic
}
```

**優點:**
- ✅ 確保所有使用者都有識別資訊
- ✅ 改善資料品質
- ✅ 不需要 fallback

**缺點:**
- ⚠️ 需要額外的 profile completion 流程
- ⚠️ 可能影響使用者體驗（額外步驟）
- ⚠️ 需要建立新的頁面/流程

**適用場景:**
- 正式生產環境
- 重視使用者資料完整性
- 願意投入開發 profile completion 功能

---

### 方案 4: 使用 Computed Signal with Loading State

**實作:**
```typescript
// workspace-context.service.ts
readonly contextLabel = computed(() => {
  const type = this.contextType();
  const id = this.contextId();
  const user = this.currentUser();

  switch (type) {
    case ContextType.USER:
      if (!user) return '載入中...';  // Loading state
      
      // 避免顯示 fallback 'User'
      const name = user.name;
      if (!name || name.toLowerCase() === 'user') {
        return user.email || '個人帳戶';
      }
      return name;
      
    case ContextType.ORGANIZATION:
      return this.organizations().find(o => o.id === id)?.name || '載入中...';
    // ... other cases
  }
});
```

**優點:**
- ✅ 在 UI 層處理顯示邏輯
- ✅ 提供清晰的 loading state
- ✅ 避免顯示混淆的預設值
- ✅ 不修改資料層

**缺點:**
- ⚠️ 重複檢查邏輯
- ⚠️ 不在源頭修復

**適用場景:**
- 需要更細緻的 UI 控制
- 有多個顯示位置需要不同邏輯
- 作為方案 1 的補充

---

### 方案 5: 使用 Avatar Service 統一管理

**實作:**
```typescript
@Injectable({ providedIn: 'root' })
export class AvatarService {
  /**
   * 取得使用者顯示名稱，確保有意義
   */
  getDisplayName(user: User): string {
    if (user.displayName && user.displayName.toLowerCase() !== 'user') {
      return user.displayName;
    }
    
    if (user.email) {
      return user.email.split('@')[0];
    }
    
    // 最後 fallback
    return `用戶 ${user.uid.substring(0, 8)}`;
  }
  
  /**
   * 取得 avatar URL
   */
  getAvatarUrl(user: User): string {
    if (user.photoURL) {
      return user.photoURL;
    }
    
    const name = this.getDisplayName(user);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`;
  }
}

// 在 FirebaseAuthService 使用
private async syncUserToServices(user: User): Promise<void> {
  const displayName = this.avatarService.getDisplayName(user);
  const avatarUrl = this.avatarService.getAvatarUrl(user);
  
  this.settingsService.setUser({
    name: displayName,
    email: user.email || '',
    avatar: avatarUrl
  });
}
```

**優點:**
- ✅ 集中管理顯示邏輯
- ✅ 易於測試
- ✅ 可重用於多個地方
- ✅ 符合 Single Responsibility Principle

**缺點:**
- ⚠️ 需要建立新的 service
- ⚠️ 增加抽象層

**適用場景:**
- 大型專案
- 需要統一管理使用者顯示邏輯
- 長期維護考量

---

### 推薦方案組合

**短期修復 (本次 PR):**
- ✅ **方案 1**: 改變 fallback 值為 `user.email || '使用者'`
- ✅ **方案 4**: 在 `contextLabel` computed signal 中防禦性檢查

**中期改進 (下個 Sprint):**
- 🔧 **方案 5**: 建立 `AvatarService` 統一管理
- 🔧 整合到所有顯示使用者資訊的地方

**長期規劃 (3-6 個月):**
- 🎯 **方案 3**: 實作 Profile Completion 流程
- 🎯 確保所有使用者都有完整的 displayName 和 email

---

## 3️⃣ 19 個邏輯問題詳細清單

### 分類說明

- 🚨 **Critical**: 影響核心功能，需立即修復
- ⚠️ **High**: 影響使用者體驗，短期內應處理
- 📋 **Medium**: 技術債務，中期優化
- 🔧 **Low**: 可選優化，長期規劃

---

### 🚨 Critical Priority (關鍵問題)

#### Issue #1: Avatar 顯示 "USER" 文字
- **類別**: Race Condition + 不當 Fallback
- **影響**: 使用者困惑，品牌形象
- **檔案**: `src/app/core/services/firebase-auth.service.ts:122`
- **原因**: 使用 `'User'` 作為 fallback，在某些情境下顯示為 "USER"
- **解決方案**: 改為 `user.email || '使用者'`
- **預計工時**: 10 分鐘
- **風險**: 低

#### Issue #2: 藍圖刷新後消失
- **類別**: Effect Guard 缺失
- **影響**: 資料遺失假象，使用者恐慌
- **檔案**: `src/app/routes/blueprint/blueprint-list.component.ts:86-96`
- **原因**: Effect 沒有檢查 `isAuthenticated()`，在 auth 完成前執行
- **解決方案**: 添加 `if (!isAuth) return;` guard
- **預計工時**: 20 分鐘
- **風險**: 低

#### Issue #3: 重複「請先登入」訊息
- **類別**: 冗餘檢查 + Race Condition
- **影響**: 嚴重的 UX 問題，使用者困擾
- **檔案**: `src/app/routes/blueprint/blueprint-list.component.ts:170-174`
- **原因**: 防禦性檢查使用 UI 錯誤訊息，觸發兩次
- **解決方案**: 改為 `console.warn` 或移除
- **預計工時**: 10 分鐘
- **風險**: 極低

---

### ⚠️ High Priority (高優先級)

#### Issue #4: 未遷移到新控制流語法
- **類別**: 現代化缺失
- **影響**: 未來維護困難，無法使用新特性
- **檔案**: 多個元件模板 (*.html)
- **原因**: 仍使用 `*ngIf`, `*ngFor`, `*ngSwitch`
- **應該使用**: `@if`, `@for`, `@switch`
- **解決方案**: 執行 `ng generate @angular/core:control-flow`
- **預計工時**: 1 小時（自動化）
- **風險**: 低（自動化工具）
- **參考**: [Angular Control Flow 文檔](https://angular.dev/guide/templates/control-flow)

#### Issue #5: 無統一錯誤處理策略
- **類別**: 架構設計缺失
- **影響**: 程式碼重複，錯誤處理不一致
- **檔案**: 多個元件
- **原因**: 每個元件都自己處理錯誤
- **解決方案**: 
  1. 實作 `GlobalErrorHandler implements ErrorHandler`
  2. 建立 `ErrorInterceptor implements HttpInterceptor`
  3. 統一錯誤訊息格式和顯示方式
- **預計工時**: 4 小時
- **風險**: 中（需要測試所有錯誤情境）

#### Issue #6: Magic Strings 到處都是
- **類別**: 可維護性問題
- **影響**: 難以重構，國際化困難
- **檔案**: 多個元件和服務
- **範例**: 
  - `'請先登入'` 應該是 `i18n.get('auth.please-login')`
  - `'workspace_context'` 應該是 `STORAGE_KEYS.WORKSPACE_CONTEXT`
- **解決方案**:
  1. 建立 `constants/` 目錄
  2. 定義 `STORAGE_KEYS`, `ERROR_MESSAGES` 等 constants
  3. 整合 i18n
- **預計工時**: 6 小時
- **風險**: 低

#### Issue #7: 無分頁實作
- **類別**: 效能/可擴充性問題
- **影響**: 大量資料時效能下降，記憶體浪費
- **檔案**: 
  - `src/app/routes/blueprint/blueprint-list.component.ts`
  - `src/app/shared/services/blueprint/blueprint.repository.ts`
- **原因**: `getByOwner()` 返回所有資料
- **解決方案**:
  1. 實作 cursor-based pagination
  2. 使用 Firestore `startAfter()`, `limit()`
  3. 整合 ST 表格的分頁功能
- **預計工時**: 8 小時
- **風險**: 中（需要調整 Repository API）

---

### 📋 Medium Priority (中優先級)

#### Issue #8: 無統一 Loading State 管理模式
- **類別**: 程式碼重複
- **影響**: 開發效率低，容易出錯
- **檔案**: 多個元件
- **原因**: 每個元件都要寫 `loading = signal(false)` 和管理邏輯
- **解決方案**: 建立 `AsyncStateSignal<T>` helper
- **範例實作**:
```typescript
export function asyncSignal<T>(
  fetcher: () => Observable<T>,
  options?: { initialValue?: T }
) {
  const data = signal(options?.initialValue);
  const loading = signal(false);
  const error = signal<Error | null>(null);
  
  const load = () => {
    loading.set(true);
    error.set(null);
    fetcher().subscribe({
      next: (value) => {
        data.set(value);
        loading.set(false);
      },
      error: (err) => {
        error.set(err);
        loading.set(false);
      }
    });
  };
  
  return {
    data: data.asReadonly(),
    loading: loading.asReadonly(),
    error: error.asReadonly(),
    load
  };
}
```
- **預計工時**: 4 小時
- **風險**: 低

#### Issue #9: 未遷移到 Signal-based I/O
- **類別**: 現代化缺失
- **影響**: 無法使用 Angular 19+ 新特性
- **檔案**: 多個元件
- **原因**: 仍使用 `@Input()`, `@Output()` decorators
- **應該使用**: `input()`, `output()`, `model()`
- **解決方案**: 逐步遷移元件
- **範例**:
```typescript
// OLD
@Input() data: any;
@Output() change = new EventEmitter<any>();

// NEW
data = input.required<any>();
change = output<any>();
value = model<string>('');  // Two-way binding
```
- **預計工時**: 12 小時（逐步進行）
- **風險**: 中（需要大量測試）

#### Issue #10: 無 Request Deduplication
- **類別**: 效能問題
- **影響**: 重複的 HTTP 請求，浪費資源
- **檔案**: Repository services
- **原因**: 多個元件同時請求相同資料
- **解決方案**: 使用 `shareReplay(1)` operator
- **範例**:
```typescript
getBlueprints(): Observable<Blueprint[]> {
  return this.http.get<Blueprint[]>('/api/blueprints').pipe(
    shareReplay(1)  // Cache and share result
  );
}
```
- **預計工時**: 2 小時
- **風險**: 低

#### Issue #11: 無持久化狀態策略
- **類別**: 架構設計缺失
- **影響**: 手動管理 localStorage，容易出錯
- **檔案**: `workspace-context.service.ts`, 其他服務
- **原因**: 手動 `localStorage.getItem/setItem`
- **解決方案**: 使用 `@delon/cache` 或建立 `PersistentSignal<T>`
- **範例**:
```typescript
import { LocalStorageService } from '@delon/cache';

readonly contextType = this.storage.get(
  'workspace_context_type',
  ContextType.USER
);
```
- **預計工時**: 3 小時
- **風險**: 低

#### Issue #12: Large Smart Components
- **類別**: 架構/可維護性問題
- **影響**: 元件過於複雜，難以測試和維護
- **檔案**: `blueprint-list.component.ts`, 其他 list components
- **原因**: 單一元件包含太多職責
- **解決方案**: 拆分為 Container/Presentation pattern
- **建議結構**:
```
blueprint-list.container.ts (Smart Component)
├── blueprint-list-table.component.ts (Presentation)
├── blueprint-list-filters.component.ts (Presentation)
└── blueprint-create-modal.component.ts (Presentation)
```
- **預計工時**: 8 小時（每個 feature）
- **風險**: 中（需要重構測試）

#### Issue #13: 無 Cache Invalidation 策略
- **類別**: 資料一致性問題
- **影響**: 資料可能過時
- **檔案**: Repository services
- **原因**: 沒有 cache TTL 或 invalidation 機制
- **解決方案**: 
  1. 整合 Firebase Realtime
  2. 或實作 TTL-based cache
  3. 提供手動 refresh button (已有 ✅)
- **預計工時**: 6 小時
- **風險**: 中（Realtime 整合複雜）

---

### 🔧 Low Priority (低優先級)

#### Issue #14: 未啟用 Zoneless Change Detection
- **類別**: 效能優化
- **影響**: Bundle size 較大，效能可提升
- **檔案**: `main.ts`
- **原因**: 仍使用 Zone.js
- **解決方案**: 
```typescript
import { provideExperimentalZonelessChangeDetection } from '@angular/core';

bootstrapApplication(AppComponent, {
  providers: [provideExperimentalZonelessChangeDetection()]
});
```
- **預計工時**: 1 小時（配置）+ 20 小時（測試）
- **風險**: 高（需確保所有 async 操作正確處理）
- **注意**: Experimental feature，需充分測試

#### Issue #15: 無 Optimistic Updates
- **類別**: UX enhancement
- **影響**: 操作延遲感
- **檔案**: Service layer (create/update/delete methods)
- **原因**: 所有 mutation 等待 server response
- **解決方案**: 實作 optimistic update pattern
- **範例**:
```typescript
async create(data: CreateRequest): Promise<Blueprint> {
  const tempId = generateTempId();
  const optimistic = { ...data, id: tempId };
  
  // Optimistic update
  this.blueprints.update(current => [...current, optimistic]);
  
  try {
    const result = await this.repository.create(data);
    // Replace temp with real
    this.blueprints.update(current => 
      current.map(b => b.id === tempId ? result : b)
    );
    return result;
  } catch (error) {
    // Rollback
    this.blueprints.update(current => 
      current.filter(b => b.id !== tempId)
    );
    throw error;
  }
}
```
- **預計工時**: 4 小時（每個 feature）
- **風險**: 中（需處理 rollback）

#### Issue #16: 無 Undo/Redo 支援
- **類別**: 進階功能
- **影響**: 使用者無法撤銷操作
- **檔案**: State management
- **原因**: 沒有 state history
- **解決方案**: 實作 Command Pattern + state history
- **預計工時**: 16 小時
- **風險**: 高（複雜的狀態管理）

#### Issue #17: 無多 Tab 同步
- **類別**: Nice-to-have
- **影響**: 多個 tab 狀態不一致
- **檔案**: `workspace-context.service.ts`
- **原因**: localStorage 不自動跨 tab 同步
- **解決方案**: 使用 `BroadcastChannel` API
- **範例**:
```typescript
private channel = new BroadcastChannel('workspace-context');

constructor() {
  this.channel.onmessage = (event) => {
    if (event.data.type === 'context-changed') {
      this.contextType.set(event.data.contextType);
      this.contextId.set(event.data.contextId);
    }
  };
}

switchContext(type: ContextType, id: string) {
  // ... update local state
  
  // Broadcast to other tabs
  this.channel.postMessage({
    type: 'context-changed',
    contextType: type,
    contextId: id
  });
}
```
- **預計工時**: 3 小時
- **風險**: 低

#### Issue #18: 無 Virtual Scrolling
- **類別**: 效能優化（條件性）
- **影響**: 大量資料時渲染效能差
- **檔案**: List components with ST table
- **原因**: 渲染所有項目
- **解決方案**: 使用 `nzVirtualScroll`
- **範例**:
```html
<nz-table 
  [nzVirtualScroll]="true" 
  [nzVirtualItemSize]="54"
  [nzVirtualMaxBufferPx]="300"
>
```
- **預計工時**: 2 小時
- **風險**: 低
- **注意**: 只在資料量 > 1000 時需要

#### Issue #19: 無圖片優化
- **類別**: 效能優化
- **影響**: 頁面載入較慢
- **檔案**: Avatar 相關元件
- **原因**: 圖片沒有 lazy loading 或 optimization
- **解決方案**:
  1. 使用 `loading="lazy"` 屬性
  2. 使用 responsive images
  3. 整合 CDN with image transformation
- **範例**:
```html
<img 
  [src]="avatar" 
  loading="lazy"
  alt="User avatar"
>
```
- **預計工時**: 2 小時
- **風險**: 極低

---

## 4️⃣ 優先級排序與路線圖

### Sprint 1: Critical Fixes (本次 PR) - 2-3 小時
1. ✅ Issue #1: Avatar "USER" display
2. ✅ Issue #2: Blueprint disappearance
3. ✅ Issue #3: Duplicate login messages

### Sprint 2: High Priority Quick Wins (1 週)
4. 🔧 Issue #4: Control flow migration (自動化)
5. 🔧 Issue #5: Global error handling
6. 🔧 Issue #6: Magic strings → constants + i18n

### Sprint 3: High Priority Scalability (1 週)
7. 🔧 Issue #7: Pagination implementation

### Sprint 4-5: Medium Priority Improvements (2-3 週)
8. 🔧 Issue #8: Loading state pattern
9. 🔧 Issue #10: Request deduplication
10. 🔧 Issue #11: Persistent state strategy
11. 🔧 Issue #13: Cache invalidation

### Sprint 6-8: Medium Priority Refactoring (3-4 週)
9. 🔧 Issue #9: Signal-based I/O migration (逐步)
12. 🔧 Issue #12: Component refactoring (逐步)

### Long-term: Low Priority Enhancements (3-6 個月)
14. 🎯 Issue #14: Zoneless (需充分測試)
15. 🎯 Issue #15: Optimistic updates
16. 🎯 Issue #16: Undo/Redo
17. 🎯 Issue #17: Multi-tab sync
18. 🎯 Issue #18: Virtual scrolling (條件性)
19. 🎯 Issue #19: Image optimization

---

## 5️⃣ 測試策略

### Critical Issues 測試

#### Test Case 1: 雙重登入訊息
**測試步驟:**
1. 開啟 Chrome DevTools Network tab
2. 登入應用
3. 重新整理頁面 (F5)
4. 觀察 console 和 UI

**預期結果:**
- ✅ 不應該出現「請先登入」錯誤訊息
- ✅ Console 可以有 debug log，但不應該有 error
- ✅ 藍圖正常載入

**失敗狀況:**
- ❌ 出現 UI 錯誤訊息
- ❌ 藍圖未載入或為空

#### Test Case 2: Avatar 顯示
**測試步驟:**
1. 建立測試帳號：
   - 有 displayName 的帳號
   - 只有 email 的帳號
   - displayName 為空字串的帳號
2. 依序登入各帳號
3. 檢查頭像顯示

**預期結果:**
- ✅ 有 displayName → 顯示 displayName
- ✅ 只有 email → 顯示 email 前綴（@之前）
- ✅ 都沒有 → 顯示「使用者」
- ✅ 永遠不顯示 "USER" 或 "User"

**失敗狀況:**
- ❌ 顯示 "USER" 或 "User"
- ❌ 顯示空白或 undefined

#### Test Case 3: Context 切換
**測試步驟:**
1. 建立 USER, ORGANIZATION, TEAM contexts
2. 在各 context 建立藍圖
3. 切換 context
4. 重新整理頁面
5. 再次切換 context

**預期結果:**
- ✅ 每次切換都正確載入對應藍圖
- ✅ 重新整理後仍保持正確 context
- ✅ 不出現錯誤訊息

**失敗狀況:**
- ❌ 切換後藍圖消失
- ❌ 重新整理後 context 丟失
- ❌ 出現錯誤訊息

---

## 6️⃣ 最佳實踐建議

### Angular 20 Signals 最佳實踐

1. **使用 computed 而非 manual tracking**
```typescript
// ❌ Bad
ngOnInit() {
  this.data$.subscribe(data => {
    this.filteredData = data.filter(...);
  });
}

// ✅ Good
readonly data = signal<Data[]>([]);
readonly filteredData = computed(() => 
  this.data().filter(...)
);
```

2. **使用 effect 處理 side effects**
```typescript
// ✅ Good
constructor() {
  effect(() => {
    const isAuth = this.authenticated();
    if (isAuth) {
      this.loadData();
    }
  });
}
```

3. **使用 untracked 避免不必要的依賴**
```typescript
effect(() => {
  const user = this.user();
  
  untracked(() => {
    // 這裡的 signal reads 不會建立依賴
    this.logger.log('User changed:', user);
  });
});
```

### Error Handling 最佳實踐

1. **分層錯誤處理**
```typescript
// Global Error Handler
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    // Log to monitoring service
    // Show user-friendly message
  }
}

// HTTP Interceptor
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  intercept(req, next) {
    return next.handle(req).pipe(
      catchError(error => {
        // Handle HTTP errors
        return throwError(() => error);
      })
    );
  }
}

// Component
this.service.getData().subscribe({
  error: (err) => {
    // Component-specific error handling
  }
});
```

### State Management 最佳實踐

1. **Single Source of Truth**
```typescript
// ✅ Good: State in service
@Injectable({ providedIn: 'root' })
export class DataService {
  private _data = signal<Data[]>([]);
  readonly data = this._data.asReadonly();
  
  updateData(data: Data[]) {
    this._data.set(data);
  }
}

// Component only reads
readonly data = this.dataService.data;
```

2. **Immutable Updates**
```typescript
// ✅ Good
this.items.update(current => [...current, newItem]);

// ❌ Bad
this.items().push(newItem);  // Mutates array!
```

---

## 7️⃣ 結論

### 問題嚴重性評估

1. **雙重「請先登入」問題:** 🚨 Critical
   - 嚴重影響使用者體驗
   - 造成使用者困惑和不信任
   - 必須立即修復

2. **'User' Fallback 問題:** ⚠️ High
   - 影響專業形象
   - 造成顯示混亂
   - 應儘快修復

3. **19 個邏輯問題:** 📊 Mixed
   - 3 個 Critical (本次修復)
   - 4 個 High (短期處理)
   - 6 個 Medium (中期優化)
   - 6 個 Low (長期規劃)

### 修復策略

**本次 PR (2-3 小時):**
- ✅ 修復 3 個 Critical issues
- ✅ ~20 lines 修改
- ✅ 最小風險
- ✅ 立即改善 UX

**後續 Sprints (3-6 個月):**
- 🔧 逐步處理 High/Medium priority issues
- 🔧 現代化 Angular code
- 🔧 改善架構和可維護性

### 長期目標

1. **Code Quality:** 從 4/5 星 → 5/5 星
2. **Maintainability:** 減少技術債務
3. **Performance:** 優化效能和 bundle size
4. **Developer Experience:** 更好的開發工具和模式

---

## 📚 參考資源

- [Angular Signals 文檔](https://angular.dev/guide/signals)
- [Angular Control Flow 文檔](https://angular.dev/guide/templates/control-flow)
- [ng-alain 文檔](https://ng-alain.com)
- [ng-zorro-antd 文檔](https://ng.ant.design)
- [Firebase Auth 文檔](https://firebase.google.com/docs/auth)
- [RxJS 最佳實踐](https://rxjs.dev/guide/overview)

---

**文件版本:** 1.0  
**建立日期:** 2025-12-10  
**最後更新:** 2025-12-10  
**作者:** GitHub Copilot Analysis
