# Angular 20 現代化分析與重構建議

## 📋 Executive Summary (執行摘要)

根據 Context7 Angular 20 官方文檔分析，本專案存在多個需要現代化的模式。這些問題源於：
1. **方法對接不一致** - RxJS Observable 與 Signals 混用
2. **執行順序問題** - Effect 時序不當導致 race conditions
3. **不夠現代化** - 未使用 Angular 20 推薦的最佳實踐

本文件提供基於 Angular 20 官方最佳實踐的現代化重構方案。

---

## 🔍 Part 1: 當前問題分析 (基於 Context7 文檔)

### Issue #1: Effect 時序問題 - 違反 Angular 最佳實踐

**當前實作 (有問題):**
```typescript
// src/app/routes/blueprint/blueprint-list.component.ts
constructor() {
  effect(() => {
    const contextType = this.workspaceContext.contextType();
    const contextId = this.workspaceContext.contextId();
    
    // ❌ 問題：沒有檢查異步依賴是否就緒
    if (!contextId && contextType !== ContextType.USER) return;
    
    this.loadBlueprints();  // ⚠️ 可能在 auth 完成前執行
  });
}
```

**Context7 文檔指出的問題:**

根據 Angular 官方文檔，`effect()` 會在其依賴的 signals 變更時**立即同步執行**。當前實作的問題是：

1. **缺少異步狀態守衛** - 沒有檢查 `isAuthenticated()` 狀態
2. **執行順序混亂** - Effect 可能在 Firebase auth 完成前觸發
3. **副作用管理不當** - `loadBlueprints()` 包含 HTTP 請求等副作用

**Angular 20 推薦模式 (來自 Context7):**

```typescript
// ✅ 正確：使用 computed + effect 分離關注點
private readonly authenticated = this.workspaceContext.isAuthenticated;
private readonly contextType = this.workspaceContext.contextType;
private readonly contextId = this.workspaceContext.contextId;

// Computed signal - 純計算，無副作用
private readonly shouldLoadBlueprints = computed(() => {
  const isAuth = this.authenticated();
  const type = this.contextType();
  const id = this.contextId();
  
  // 明確的條件邏輯
  if (!isAuth) return false;
  if (type !== ContextType.USER && !id) return false;
  
  return true;
});

constructor() {
  // Effect - 只處理副作用
  effect(() => {
    if (this.shouldLoadBlueprints()) {
      this.loadBlueprints();
    }
  });
}
```

**為什麼這樣更好？**
1. **關注點分離** - Computed 處理邏輯，Effect 處理副作用
2. **可測試性** - `shouldLoadBlueprints` 可以獨立測試
3. **明確的依賴** - 所有依賴都在 computed 中明確列出
4. **符合 Angular 20 最佳實踐** - Effect 應該「thin and focused」

---

### Issue #2: RxJS 與 Signals 混用不當

**當前實作 (混亂):**
```typescript
// src/app/shared/services/workspace-context.service.ts
private readonly firebaseUser = toSignal(this.firebaseAuth.user$, { initialValue: null });

constructor() {
  effect(() => {
    const user = this.firebaseUser();  // Signal
    
    if (user) {
      // ⚠️ 問題：在 effect 中執行異步操作
      this.currentUserState.set(accountData);
      
      untracked(() => {
        this.loadUserData(user.uid);  // HTTP request
        this.restoreContext();        // 可能觸發其他 effects
      });
    }
  }, { allowSignalWrites: true });
}
```

**Context7 文檔指出的問題:**

1. **Effect 中的異步操作** - `loadUserData()` 是 HTTP 請求，應該分離
2. **使用 `untracked()` 掩蓋問題** - 這是「code smell」，表示設計有問題
3. **`allowSignalWrites: true`** - 這個選項應該謹慎使用，通常表示架構問題

**Angular 20 推薦模式 (基於 Context7 範例):**

根據 Angular 官方文檔的 `toSignal` 範例和 `PendingTasks` 模式：

```typescript
// ✅ 方案 A: 使用 RxJS operators 處理異步邏輯 (推薦)
private readonly user$ = this.firebaseAuth.user$.pipe(
  switchMap(user => {
    if (!user) return of(null);
    
    // 組合所有需要的異步操作
    return combineLatest([
      of(user),
      this.organizationRepo.findByCreator(user.uid),
      // ... 其他異步操作
    ]).pipe(
      map(([user, organizations]) => ({
        user,
        organizations,
        // ... 其他資料
      }))
    );
  }),
  shareReplay(1)  // ✅ Context7 推薦：避免重複請求
);

// 轉換為 Signal (只在最後轉換)
readonly userData = toSignal(this.user$, { 
  initialValue: null 
});

// ✅ Effect 變得簡單，只設定狀態
constructor() {
  effect(() => {
    const data = this.userData();
    if (data) {
      this.currentUserState.set(data.user);
      this.organizationsState.set(data.organizations);
      // 同步操作，無需 untracked
    }
  });
}
```

```typescript
// ✅ 方案 B: 使用 Signals + Computed (完全 Signal-based)
// 更現代，但需要重構更多

// 1. 基礎 Signal
private readonly _authUser = signal<User | null>(null);
private readonly _loadingState = signal<LoadingState>('idle');

// 2. Computed Signals (衍生狀態)
readonly isAuthenticated = computed(() => !!this._authUser());
readonly currentUser = computed(() => {
  const user = this._authUser();
  if (!user) return null;
  
  return {
    id: user.uid,
    name: user.displayName || user.email || '使用者',
    email: user.email || '',
    avatar_url: user.photoURL
  };
});

// 3. 使用 RxJS interop 處理 Firebase Observable
constructor() {
  // 訂閱 Firebase auth state
  this.firebaseAuth.user$.subscribe(user => {
    this._authUser.set(user);
    
    if (user) {
      this.loadUserData(user.uid);  // 明確的異步調用
    }
  });
}

// 4. 異步操作返回 Observable，不在 effect 中執行
private loadUserData(userId: string): void {
  this._loadingState.set('loading');
  
  this.organizationRepo.findByCreator(userId).subscribe({
    next: (organizations) => {
      this.organizationsState.set(organizations);
      this._loadingState.set('success');
    },
    error: (error) => {
      console.error('Failed to load organizations:', error);
      this._loadingState.set('error');
    }
  });
}
```

**為什麼方案 A 更好？**
1. **符合 RxJS 最佳實踐** - 在 Observable 管道中處理異步邏輯
2. **自動管理訂閱** - `toSignal` 自動處理 subscribe/unsubscribe
3. **避免 race conditions** - `switchMap` 自動取消前一個請求
4. **使用 `shareReplay(1)`** - Context7 推薦，避免重複請求
5. **更少的 effects** - 減少複雜度和潛在問題

---

### Issue #3: 防禦性檢查位置不當

**當前實作:**
```typescript
// src/app/routes/blueprint/blueprint-list.component.ts
private loadBlueprints(): void {
  const user = this.authService.currentUser;
  if (!user) {
    this.message.error('請先登入');  // ❌ UI 錯誤訊息
    return;
  }
  // ...
}
```

**Context7 文檔指出的問題:**

根據 Angular 20 錯誤處理最佳實踐：
1. **業務邏輯中的 UI 錯誤** - 違反關注點分離
2. **防禦性檢查應該在上層** - Effect/Guard 層級
3. **錯誤訊息應該集中管理** - 使用 i18n

**Angular 20 推薦模式:**

```typescript
// ✅ 方案 1: 在 Effect 層級檢查（推薦）
private readonly canLoadBlueprints = computed(() => {
  const isAuth = this.authenticated();
  const type = this.contextType();
  const id = this.contextId();
  
  return isAuth && (type === ContextType.USER || !!id);
});

constructor() {
  effect(() => {
    if (this.canLoadBlueprints()) {
      this.loadBlueprints();  // 保證 user 已認證
    }
  });
}

// 方法變得更乾淨
private loadBlueprints(): void {
  // ✅ 使用 non-null assertion，因為 computed 保證了
  const user = this.authService.currentUser!;
  
  // ... 業務邏輯
}
```

```typescript
// ✅ 方案 2: 使用 TypeScript 類型系統
private readonly canLoadBlueprints = computed<boolean>(() => {
  const isAuth = this.authenticated();
  const type = this.contextType();
  const id = this.contextId();
  
  return isAuth && (type === ContextType.USER || !!id);
});

// 建立類型守衛
private assertUserAuthenticated(): asserts this is { authService: { currentUser: User } } {
  if (!this.authService.currentUser) {
    throw new Error('User must be authenticated');
  }
}

private loadBlueprints(): void {
  this.assertUserAuthenticated();  // TypeScript 現在知道 currentUser 不是 null
  
  const user = this.authService.currentUser;
  // ... user 的類型現在是 User，不是 User | null
}
```

---

### Issue #4: 缺少 Loading State 管理

**當前實作:**
```typescript
loading = signal(false);

private loadBlueprints(): void {
  this.loading.set(true);
  this.service.getData().subscribe({
    next: (data) => {
      this.data.set(data);
      this.loading.set(false);
    },
    error: () => {
      this.loading.set(false);  // ⚠️ 容易忘記
    }
  });
}
```

**Context7 文檔推薦的模式:**

根據 Angular 20 Zoneless 範例（使用 `PendingTasks`）：

```typescript
// ✅ 現代化方案：統一的 AsyncState 模式
type LoadingState = 'idle' | 'loading' | 'success' | 'error';

interface AsyncState<T> {
  data: T | null;
  state: LoadingState;
  error: Error | null;
}

// 建立可重用的 helper
function createAsyncState<T>(initialData: T | null = null): {
  state: WritableSignal<AsyncState<T>>;
  load: (promise: Promise<T>) => Promise<void>;
  reset: () => void;
} {
  const state = signal<AsyncState<T>>({
    data: initialData,
    state: 'idle',
    error: null
  });

  const load = async (promise: Promise<T>) => {
    state.update(s => ({ ...s, state: 'loading', error: null }));
    
    try {
      const data = await promise;
      state.update(s => ({ ...s, data, state: 'success' }));
    } catch (error) {
      state.update(s => ({ 
        ...s, 
        state: 'error', 
        error: error as Error 
      }));
      throw error;  // Re-throw for error handling
    }
  };

  const reset = () => {
    state.set({ data: initialData, state: 'idle', error: null });
  };

  return { state: state.asReadonly(), load, reset };
}

// 使用方式
@Component({...})
export class BlueprintListComponent {
  private readonly service = inject(BlueprintService);
  
  // ✅ 簡潔的狀態管理
  private readonly blueprintsAsync = createAsyncState<Blueprint[]>([]);
  
  readonly blueprints = computed(() => this.blueprintsAsync.state().data || []);
  readonly loading = computed(() => this.blueprintsAsync.state().state === 'loading');
  readonly error = computed(() => this.blueprintsAsync.state().error);
  
  async loadBlueprints(): Promise<void> {
    const ownerType = this.getOwnerType();
    const ownerId = this.getOwnerId();
    
    await this.blueprintsAsync.load(
      firstValueFrom(this.service.getByOwner(ownerType, ownerId))
    );
  }
}
```

**Template 使用:**
```html
@if (loading()) {
  <nz-spin nzSimple />
} @else if (error()) {
  <nz-alert 
    nzType="error" 
    [nzMessage]="error()?.message || 'Failed to load'"
  />
} @else {
  <st [data]="blueprints()" [columns]="columns" />
}
```

---

## 🎯 Part 2: 完整重構方案 (基於 Angular 20 最佳實踐)

### 重構 #1: WorkspaceContextService (核心重構)

**目標:** 
- 使用 RxJS operators 處理異步邏輯
- 減少 effects 數量和複雜度
- 符合 Angular 20 Signal + RxJS interop 模式

```typescript
// src/app/shared/services/workspace-context.service.ts
import { Injectable, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FirebaseAuthService } from '@core';
import { SettingsService } from '@delon/theme';
import { OrganizationRepository, TeamRepository } from './';
import { 
  combineLatest, 
  switchMap, 
  map, 
  shareReplay, 
  of,
  catchError 
} from 'rxjs';

const STORAGE_KEY = 'workspace_context';

interface UserData {
  user: Account | null;
  organizations: Organization[];
  teams: Team[];
}

@Injectable({
  providedIn: 'root'
})
export class WorkspaceContextService {
  private readonly firebaseAuth = inject(FirebaseAuthService);
  private readonly organizationRepo = inject(OrganizationRepository);
  private readonly teamRepo = inject(TeamRepository);
  private readonly settingsService = inject(SettingsService);

  // === RxJS Pipeline: 處理所有異步邏輯 ===
  private readonly userData$ = this.firebaseAuth.user$.pipe(
    switchMap(user => {
      if (!user) {
        return of({ user: null, organizations: [], teams: [] });
      }

      // 轉換 Firebase user 為 Account
      const account: Account = {
        id: user.uid,
        uid: user.uid,
        name: user.displayName || user.email || '使用者',
        email: user.email || '',
        avatar_url: user.photoURL,
        created_at: new Date().toISOString()
      };

      // 並行載入組織和團隊
      return combineLatest([
        this.organizationRepo.findByCreator(user.uid),
        of(account)
      ]).pipe(
        switchMap(([organizations, account]) => {
          if (organizations.length === 0) {
            return of({ user: account, organizations: [], teams: [] });
          }

          // 載入所有組織的團隊
          const teamObservables = organizations.map(org => 
            this.teamRepo.findByOrganization(org.id)
          );

          return combineLatest(teamObservables).pipe(
            map(teamArrays => ({
              user: account,
              organizations,
              teams: teamArrays.flat()
            }))
          );
        }),
        catchError(error => {
          console.error('[WorkspaceContextService] Error loading user data:', error);
          return of({ user: account, organizations: [], teams: [] });
        })
      );
    }),
    shareReplay(1)  // ✅ Cache result, prevent duplicate requests
  );

  // === Signals: 只處理同步狀態 ===
  private readonly _userData = toSignal(this.userData$, {
    initialValue: { user: null, organizations: [], teams: [] }
  });

  // Context state (同步，可以直接修改)
  private readonly _contextType = signal<ContextType>(ContextType.USER);
  private readonly _contextId = signal<string | null>(null);

  // Public readonly signals
  readonly currentUser = computed(() => this._userData().user);
  readonly organizations = computed(() => this._userData().organizations);
  readonly teams = computed(() => this._userData().teams);
  readonly contextType = this._contextType.asReadonly();
  readonly contextId = this._contextId.asReadonly();

  // Derived state
  readonly isAuthenticated = computed(() => !!this.currentUser());
  
  readonly contextLabel = computed(() => {
    const type = this.contextType();
    const id = this.contextId();
    const user = this.currentUser();

    switch (type) {
      case ContextType.USER:
        if (!user) return '載入中...';
        return user.name;
        
      case ContextType.ORGANIZATION:
        const org = this.organizations().find(o => o.id === id);
        return org?.name || '組織';
        
      case ContextType.TEAM:
        const team = this.teams().find(t => t.id === id);
        return team?.name || '團隊';
        
      default:
        return '個人帳戶';
    }
  });

  readonly contextIcon = computed(() => {
    const iconMap = {
      [ContextType.USER]: 'user',
      [ContextType.ORGANIZATION]: 'team',
      [ContextType.TEAM]: 'usergroup-add',
      [ContextType.BOT]: 'robot'
    };
    return iconMap[this.contextType()] || 'user';
  });

  // ✅ 簡單的 effect：只同步狀態到 SettingsService
  constructor() {
    effect(() => {
      const user = this.currentUser();
      const type = this.contextType();
      const id = this.contextId();

      // 同步 avatar 和 name 到 SettingsService
      if (user) {
        let avatarUrl = user.avatar_url;
        let name = user.name;

        // 根據 context 調整顯示
        if (type === ContextType.ORGANIZATION) {
          const org = this.organizations().find(o => o.id === id);
          if (org) {
            avatarUrl = org.logo_url || avatarUrl;
            name = org.name;
          }
        } else if (type === ContextType.TEAM) {
          const team = this.teams().find(t => t.id === id);
          if (team) {
            const parentOrg = this.organizations().find(o => o.id === team.organization_id);
            avatarUrl = parentOrg?.logo_url || avatarUrl;
            name = team.name;
          }
        }

        this.settingsService.setUser({
          name,
          email: user.email,
          avatar: avatarUrl || './assets/tmp/img/avatar.jpg'
        });
      }
    });

    // 恢復 context (只在初始化時)
    this.restoreContext();
  }

  // === Context Management: 純同步操作 ===
  switchContext(type: ContextType, id: string | null): void {
    this._contextType.set(type);
    this._contextId.set(id);
    this.persistContext();
  }

  switchToUser(userId: string): void {
    this.switchContext(ContextType.USER, userId);
  }

  switchToOrganization(organizationId: string): void {
    this.switchContext(ContextType.ORGANIZATION, organizationId);
  }

  switchToTeam(teamId: string): void {
    this.switchContext(ContextType.TEAM, teamId);
  }

  // === Persistence ===
  private restoreContext(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { type, id } = JSON.parse(saved);
        this._contextType.set(type);
        this._contextId.set(id);
      }
    } catch (error) {
      console.error('[WorkspaceContextService] Failed to restore context:', error);
    }
  }

  private persistContext(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const state = {
        type: this.contextType(),
        id: this.contextId()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('[WorkspaceContextService] Failed to persist context:', error);
    }
  }

  // === Organization/Team Management ===
  addOrganization(org: Organization): void {
    // 觸發重新載入
    const user = this.currentUser();
    if (user) {
      // 這會自動觸發 userData$ 更新
      // 或者手動合併到現有 state
    }
  }

  // ... 其他方法類似
}
```

**重構的好處:**
1. ✅ **所有異步邏輯在 RxJS 管道中** - 清晰的資料流
2. ✅ **自動取消前一個請求** - `switchMap` 處理
3. ✅ **避免重複請求** - `shareReplay(1)`
4. ✅ **錯誤處理集中** - `catchError` 統一處理
5. ✅ **Effect 變簡單** - 只同步狀態，無副作用
6. ✅ **無需 `untracked()`** - 沒有複雜的依賴管理
7. ✅ **無需 `allowSignalWrites`** - 架構正確

---

### 重構 #2: BlueprintListComponent (簡化版)

```typescript
// src/app/routes/blueprint/blueprint-list.component.ts
@Component({
  selector: 'app-blueprint-list',
  standalone: true,
  imports: [SHARED_IMPORTS, NzSpaceModule],
  template: `
    <page-header [title]="'藍圖管理'" [action]="action">
      <ng-template #action>
        <button nz-button nzType="primary" (click)="create()">
          <span nz-icon nzType="plus"></span>
          建立藍圖
        </button>
      </ng-template>
    </page-header>

    <nz-card>
      @if (blueprintsState.state() === 'loading') {
        <nz-spin nzSimple />
      } @else if (blueprintsState.state() === 'error') {
        <nz-alert 
          nzType="error" 
          nzMessage="載入藍圖失敗"
          [nzDescription]="blueprintsState.error()?.message"
        />
      } @else {
        <st
          [data]="blueprints()"
          [columns]="columns"
          [page]="{ show: true, showSize: true }"
        ></st>
      }
    </nz-card>
  `
})
export class BlueprintListComponent {
  private readonly service = inject(BlueprintService);
  private readonly workspaceContext = inject(WorkspaceContextService);
  private readonly modal = inject(ModalHelper);
  private readonly message = inject(NzMessageService);

  // === Async State Management ===
  private readonly blueprintsState = createAsyncState<Blueprint[]>([]);
  
  readonly blueprints = computed(() => this.blueprintsState.state().data || []);
  readonly loading = computed(() => this.blueprintsState.state().state === 'loading');
  readonly error = computed(() => this.blueprintsState.state().error);

  // === Computed: 決定何時載入 ===
  private readonly loadParams = computed(() => {
    const isAuth = this.workspaceContext.isAuthenticated();
    const contextType = this.workspaceContext.contextType();
    const contextId = this.workspaceContext.contextId();
    const user = this.workspaceContext.currentUser();

    // 必須認證
    if (!isAuth || !user) return null;

    // 非 USER context 必須有 ID
    if (contextType !== ContextType.USER && !contextId) return null;

    // 計算 owner type 和 ID
    let ownerType: OwnerType;
    let ownerId: string;

    switch (contextType) {
      case ContextType.ORGANIZATION:
        ownerType = OwnerType.ORGANIZATION;
        ownerId = contextId || user.uid;
        break;

      case ContextType.TEAM:
        const team = this.workspaceContext.teams().find(t => t.id === contextId);
        ownerType = OwnerType.ORGANIZATION;
        ownerId = team?.organization_id || user.uid;
        break;

      default:
        ownerType = OwnerType.USER;
        ownerId = user.uid;
    }

    return { ownerType, ownerId };
  });

  // === Effect: 當參數變化時載入 ===
  constructor() {
    effect(() => {
      const params = this.loadParams();
      
      if (params) {
        // ✅ 明確的異步調用
        this.load(params.ownerType, params.ownerId);
      } else {
        // 清空資料
        this.blueprintsState.reset();
      }
    });
  }

  // === 方法：清晰簡潔 ===
  private async load(ownerType: OwnerType, ownerId: string): Promise<void> {
    try {
      await this.blueprintsState.load(
        firstValueFrom(this.service.getByOwner(ownerType, ownerId))
      );
    } catch (error) {
      console.error('[BlueprintList] Failed to load blueprints:', error);
      // Error 已經在 state 中，UI 會自動顯示
    }
  }

  async refresh(): Promise<void> {
    const params = this.loadParams();
    if (params) {
      await this.load(params.ownerType, params.ownerId);
    }
  }

  create(): void {
    this.modal.create(BlueprintModalComponent, { mode: 'create' })
      .subscribe(result => {
        if (result) {
          this.refresh();
        }
      });
  }

  // ... 其他方法類似
}
```

**重構的好處:**
1. ✅ **清晰的狀態管理** - `createAsyncState` 統一模式
2. ✅ **Computed 處理邏輯** - `loadParams` 集中所有條件
3. ✅ **Effect 只觸發載入** - 簡單且專注
4. ✅ **錯誤處理自動化** - State 自動管理錯誤
5. ✅ **Template 清晰** - 使用新的 `@if` 語法
6. ✅ **可測試性高** - 每個部分都可獨立測試

---

### 重構 #3: FirebaseAuthService (小調整)

```typescript
// src/app/core/services/firebase-auth.service.ts
@Injectable({
  providedIn: 'root'
})
export class FirebaseAuthService {
  private readonly auth = inject(Auth);
  private readonly tokenService = inject(DA_SERVICE_TOKEN);
  private readonly settingsService = inject(SettingsService);
  private readonly router = inject(Router);
  private readonly accountRepository = inject(AccountRepository);

  // ✅ 使用 RxJS authState (更現代)
  readonly user$ = authState(this.auth);

  // ✅ 同步 getter (向後兼容)
  get currentUser(): User | null {
    return this.auth.currentUser;
  }

  // ✅ 認證狀態 signal (可選)
  readonly isAuthenticated$ = this.user$.pipe(
    map(user => !!user),
    shareReplay(1)
  );

  constructor() {
    // ✅ 使用 RxJS 訂閱，不是 effect
    this.user$.subscribe(user => {
      if (user) {
        this.syncUserToServices(user);
      } else {
        this.clearServices();
      }
    });
  }

  // ... 其他方法保持不變

  private async syncUserToServices(user: User): Promise<void> {
    try {
      const idToken = await user.getIdToken();
      
      // ✅ 改進的 displayName 邏輯
      const displayName = this.getDisplayName(user);
      
      // Set token
      this.tokenService.set({
        token: idToken,
        email: user.email || '',
        uid: user.uid,
        name: displayName,
        expired: Date.now() + 3600000
      });

      // ⚠️ 注意：SettingsService 同步現在由 WorkspaceContextService 處理
      // 這裡只設定基本資訊
      this.settingsService.setUser({
        name: displayName,
        email: user.email || '',
        avatar: user.photoURL || this.generateAvatarUrl(user.email || '')
      });
    } catch (error) {
      console.error('Error syncing user to services:', error);
    }
  }

  // ✅ 抽取為獨立方法
  private getDisplayName(user: User): string {
    // 優先級：displayName > email 前綴 > email > UID 前綴
    if (user.displayName && user.displayName.toLowerCase() !== 'user') {
      return user.displayName;
    }
    
    if (user.email) {
      const prefix = user.email.split('@')[0];
      if (prefix && prefix.toLowerCase() !== 'user') {
        return prefix;
      }
      return user.email;
    }
    
    // 最後 fallback：使用 UID 前 8 碼
    return `用戶-${user.uid.substring(0, 8)}`;
  }

  private clearServices(): void {
    this.tokenService.clear();
    this.settingsService.setUser({});
  }

  // ... 其他方法保持不變
}
```

---

## 📊 Part 3: 遷移路線圖與優先級

### Phase 1: Critical Fixes (1-2 天)

#### 1.1 修復 Blueprint Effect Guard
- **檔案:** `blueprint-list.component.ts`
- **變更:** 添加 `isAuthenticated()` 檢查
- **工時:** 2 小時
- **風險:** 低

```typescript
// ✅ 快速修復 (不重構)
private readonly authenticated = this.workspaceContext.isAuthenticated;

constructor() {
  effect(() => {
    const isAuth = this.authenticated();
    const contextType = this.workspaceContext.contextType();
    const contextId = this.workspaceContext.contextId();
    
    // 等待認證
    if (!isAuth) return;
    
    // 其他檢查
    if (!contextId && contextType !== ContextType.USER) return;
    
    this.loadBlueprints();
  });
}
```

#### 1.2 修復 DisplayName Fallback
- **檔案:** `firebase-auth.service.ts`
- **變更:** 改進 `getDisplayName()` 邏輯
- **工時:** 1 小時
- **風險:** 極低

```typescript
private getDisplayName(user: User): string {
  if (user.displayName && user.displayName.toLowerCase() !== 'user') {
    return user.displayName;
  }
  if (user.email) {
    const prefix = user.email.split('@')[0];
    return prefix !== 'user' ? prefix : user.email;
  }
  return `用戶-${user.uid.substring(0, 8)}`;
}
```

#### 1.3 移除冗餘錯誤訊息
- **檔案:** `blueprint-list.component.ts`
- **變更:** 改為 console.warn
- **工時:** 30 分鐘
- **風險:** 極低

---

### Phase 2: 重構 WorkspaceContextService (3-5 天)

#### 2.1 建立 RxJS Pipeline
- **目標:** 所有異步邏輯移到 RxJS 管道
- **工時:** 8 小時
- **風險:** 中
- **測試:** 需要完整的認證流程測試

#### 2.2 簡化 Effects
- **目標:** 減少 effect 數量和複雜度
- **工時:** 4 小時
- **風險:** 低

#### 2.3 更新相依元件
- **目標:** BlueprintListComponent 等使用新 API
- **工時:** 4 小時
- **風險:** 低

---

### Phase 3: 建立 AsyncState Helper (2-3 天)

#### 3.1 建立 createAsyncState
- **檔案:** `src/app/shared/utils/async-state.ts`
- **工時:** 4 小時
- **風險:** 低

#### 3.2 遷移 BlueprintListComponent
- **工時:** 3 小時
- **風險:** 低

#### 3.3 遷移其他 List Components
- **工時:** 8 小時
- **風險:** 低

---

### Phase 4: 全面現代化 (1-2 週)

#### 4.1 Control Flow Migration
```bash
ng generate @angular/core:control-flow
```
- **工時:** 2 小時 (自動化)
- **風險:** 低

#### 4.2 Signal Inputs/Outputs Migration
```bash
ng generate @angular/core:signal-inputs-migration
```
- **工時:** 4 小時
- **風險:** 中

#### 4.3 統一錯誤處理
- **建立:** Global ErrorHandler + HTTP Interceptor
- **工時:** 8 小時
- **風險:** 中

---

## 🧪 Part 4: 測試策略

### Unit Tests

```typescript
describe('WorkspaceContextService', () => {
  let service: WorkspaceContextService;
  let firebaseAuth: jasmine.SpyObj<FirebaseAuthService>;

  beforeEach(() => {
    firebaseAuth = jasmine.createSpyObj('FirebaseAuthService', [], {
      user$: of(mockUser)
    });

    TestBed.configureTestingModule({
      providers: [
        WorkspaceContextService,
        { provide: FirebaseAuthService, useValue: firebaseAuth }
      ]
    });

    service = TestBed.inject(WorkspaceContextService);
  });

  it('should load user data when authenticated', (done) => {
    // ✅ 測試 RxJS pipeline
    service.currentUser.subscribe(user => {
      expect(user).toBeTruthy();
      expect(user?.name).toBe('Test User');
      done();
    });
  });

  it('should compute context label correctly', () => {
    service.switchToUser('user-123');
    
    // ✅ 測試 computed signal
    expect(service.contextLabel()).toBe('Test User');
  });
});
```

### Integration Tests

```typescript
describe('Blueprint List Integration', () => {
  it('should load blueprints after authentication', fakeAsync(() => {
    // Setup
    const fixture = TestBed.createComponent(BlueprintListComponent);
    const component = fixture.componentInstance;

    // ✅ 模擬認證流程
    authService.user$.next(mockUser);
    tick();

    // ✅ 檢查 effect 觸發
    expect(component.blueprints()).toHaveLength(3);
    expect(component.loading()).toBe(false);
  }));

  it('should not load blueprints when not authenticated', fakeAsync(() => {
    const fixture = TestBed.createComponent(BlueprintListComponent);
    const component = fixture.componentInstance;

    // ✅ 未認證
    authService.user$.next(null);
    tick();

    // ✅ 不應該載入
    expect(component.blueprints()).toHaveLength(0);
    expect(component.loading()).toBe(false);
  }));
});
```

---

## 📝 Part 5: 結論與建議

### 當前問題總結

1. **方法對接不一致** ✅ 已識別
   - RxJS Observable 與 Signals 混用不當
   - 應該在 RxJS 管道處理異步，最後才轉 Signal

2. **執行順序問題** ✅ 已識別
   - Effect 在依賴就緒前執行
   - 缺少適當的守衛和檢查

3. **不夠現代化** ✅ 已識別
   - 未使用 Angular 20 推薦模式
   - 應該使用 `toSignal`, `shareReplay`, `createAsyncState` 等

### 推薦實作順序

1. **立即 (本週):** Phase 1 - Critical Fixes
   - 快速解決使用者體驗問題
   - 風險低，影響大

2. **短期 (下週):** Phase 2 - 重構 WorkspaceContextService
   - 解決架構性問題
   - 為後續重構打基礎

3. **中期 (兩週內):** Phase 3 - AsyncState Helper
   - 統一狀態管理模式
   - 提升開發效率

4. **長期 (一個月):** Phase 4 - 全面現代化
   - Control Flow Migration
   - Signal I/O Migration
   - 錯誤處理統一

### 架構決策記錄 (ADR)

**決策:** 使用 RxJS for Async, Signals for Sync

**理由:**
1. ✅ Angular 20 官方推薦（Context7 文檔）
2. ✅ RxJS 擅長處理異步數據流
3. ✅ Signals 擅長處理同步反應式狀態
4. ✅ `toSignal` 提供完美的橋接
5. ✅ 減少 effects 複雜度

**替代方案:**
- 全部用 Signals：需要手動管理訂閱，更複雜
- 全部用 RxJS：失去 Signals 的細粒度反應性優勢

**結論:** 混合使用是最佳實踐

---

## 📚 參考資源

- [Angular 20 Signals 文檔](https://angular.dev/guide/signals)
- [Angular RxJS Interop](https://angular.dev/guide/signals/rxjs-interop)
- [Angular Effect 最佳實踐](https://angular.dev/guide/signals/queries)
- [Angular Zoneless Change Detection](https://angular.dev/guide/experimental/zoneless)
- Context7 Angular 20 Documentation (本分析基礎)

---

**文件版本:** 1.0  
**建立日期:** 2025-12-10  
**基於:** Context7 Angular 20 官方文檔分析  
**作者:** GitHub Copilot + Context7
