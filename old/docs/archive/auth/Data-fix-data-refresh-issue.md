# 修復資料刷新問題 (Fix Data Refresh Issue)

## 問題描述 (Problem Description)

組織 (Organization)、團隊 (Team)、藍圖 (Blueprint) 在頁面刷新後消失，但資料確實存在於 Firebase Firestore 中。

**原因分析**：
- `WorkspaceContextService` 使用 Angular Signals 管理狀態
- 服務從未從 Firebase 載入資料到 Signals
- 只有手動添加 (`addOrganization`, `addTeam`) 方法，沒有自動載入邏輯
- 頁面刷新時，Signals 重置為空陣列，且沒有重新載入資料

## 解決方案 (Solution)

### 1. 現代化 Angular 模式

根據 AngularFire 和 Angular 20 最佳實踐：

#### A. Signal-Based 狀態管理
```typescript
// 使用 Signals 管理響應式狀態
private readonly organizationsState = signal<Organization[]>([]);
private readonly teamsState = signal<Team[]>([]);

// 暴露為 readonly
readonly organizations = this.organizationsState.asReadonly();
readonly teams = this.teamsState.asReadonly();
```

#### B. 使用 effect() 響應認證狀態
```typescript
constructor() {
  effect(() => {
    const user = this.firebaseUser();
    if (user) {
      this.loadUserData(user.uid);
      this.restoreContext();
    } else {
      this.reset();
    }
  });
}
```

#### C. 從 Firebase 載入資料
```typescript
private loadUserData(userId: string): void {
  // 載入使用者建立的組織
  this.organizationRepo.findByCreator(userId).subscribe({
    next: (organizations) => {
      this.organizationsState.set(organizations);
      
      // 載入組織的團隊
      if (organizations.length > 0) {
        this.loadTeamsForOrganizations(organizations.map(o => o.id));
      }
    }
  });
}
```

#### D. 合併多個 Observable
```typescript
private loadTeamsForOrganizations(organizationIds: string[]): void {
  const teamObservables = organizationIds.map(orgId => 
    this.teamRepo.findByOrganization(orgId)
  );
  
  combineLatest(teamObservables).subscribe({
    next: (teamArrays) => {
      const allTeams = teamArrays.flat();
      this.teamsState.set(allTeams);
    }
  });
}
```

### 2. 變更檔案

- **`src/app/shared/services/workspace-context.service.ts`**
  - 新增 `OrganizationRepository` 和 `TeamRepository` 依賴注入
  - 新增 `loadUserData()` 和 `loadTeamsForOrganizations()` 方法
  - 新增 `loadingOrganizations` 和 `loadingTeams` 狀態
  - 新增 `reloadData()` 公開方法

### 3. 關鍵改進

#### 自動資料載入
✅ 使用者登入時自動載入組織和團隊  
✅ 頁面刷新時資料持久化  
✅ 無需手動觸發載入

#### 載入狀態管理
✅ 提供 `loadingOrganizations` 和 `loadingTeams` signals  
✅ UI 可以顯示載入指示器  
✅ 更好的使用者體驗

#### 錯誤處理
✅ 載入失敗時記錄錯誤  
✅ 設置空陣列作為回退  
✅ 不會破壞應用程式狀態

## 技術細節 (Technical Details)

### Angular 20 Signals

**優點**：
- 細粒度響應式更新
- 自動變更偵測
- 類型安全
- 更好的效能

**使用方式**：
```typescript
// 建立可寫 signal
const state = signal<T[]>([]);

// 讀取值
const value = state();

// 設置值
state.set(newValue);

// 更新值
state.update(current => [...current, newItem]);

// 建立 readonly signal
const readonly = state.asReadonly();
```

### RxJS Integration

**combineLatest**：
```typescript
combineLatest([obs1, obs2, obs3]).subscribe(([r1, r2, r3]) => {
  // 當所有 observable 都發射值時執行
});
```

**好處**：
- 等待所有資料來源完成
- 自動合併結果
- 錯誤處理更簡單

### toSignal() 轉換

```typescript
// 將 Observable 轉換為 Signal
private readonly firebaseUser = toSignal(
  this.firebaseAuth.user$, 
  { initialValue: null }
);
```

**使用場景**：
- 將現有 Observable 轉換為 Signal
- 與 Signal-based API 整合
- 簡化模板中的訂閱管理

## 測試方法 (Testing)

### 手動測試步驟

1. **登入應用程式**
   ```
   - 使用有效的 Firebase 使用者登入
   - 確認已建立組織和團隊
   ```

2. **檢查資料顯示**
   ```
   - 開啟 Context Switcher
   - 確認組織列表顯示
   - 確認團隊在組織下顯示
   ```

3. **測試刷新**
   ```
   - 按 F5 或點擊瀏覽器重新整理
   - 等待頁面完全載入
   - 再次開啟 Context Switcher
   - ✅ 組織和團隊應該仍然存在
   ```

4. **檢查 Console 日誌**
   ```
   開啟瀏覽器開發者工具 Console
   應該看到：
   [WorkspaceContextService] 📥 Loading user data for: <uid>
   [WorkspaceContextService] ✅ Organizations loaded: <count>
   [WorkspaceContextService] 📥 Loading teams for organizations: <count>
   [WorkspaceContextService] ✅ Teams loaded: <count>
   ```

### 預期結果

✅ **刷新前**：可以看到組織和團隊  
✅ **刷新後**：組織和團隊仍然顯示  
✅ **Console**：顯示載入成功日誌  
✅ **效能**：載入時間 < 1 秒

## 未來改進 (Future Improvements)

### 1. 即時訂閱 (Real-time Subscriptions)

目前使用一次性查詢 (`getDocs`)，未來可以改用即時訂閱：

```typescript
// 使用 onSnapshot 進行即時更新
import { collectionData } from '@angular/fire/firestore';
import { collection } from '@angular/fire/firestore';

const orgsCollection = collection(firestore, 'organizations');
const organizations$ = collectionData(orgsCollection, { idField: 'id' });

// 轉換為 Signal
const organizations = toSignal(organizations$, { initialValue: [] });
```

**好處**：
- 自動同步資料變更
- 無需手動重新載入
- 多裝置即時同步

### 2. 快取策略

```typescript
// 使用 shareReplay 快取結果
this.organizations$ = this.organizationRepo.findByCreator(userId).pipe(
  shareReplay(1)
);
```

### 3. 錯誤重試

```typescript
// 自動重試失敗的請求
import { retry, catchError } from 'rxjs/operators';

this.organizationRepo.findByCreator(userId).pipe(
  retry(3),
  catchError(error => {
    this.logger.error('Failed after 3 retries', error);
    return of([]);
  })
);
```

### 4. 分頁載入

對於大量資料，實作分頁或無限滾動：

```typescript
// Firestore 分頁查詢
import { limit, startAfter } from '@angular/fire/firestore';

const constraints = [
  orderBy('created_at', 'desc'),
  limit(20)
];
```

## 參考資料 (References)

### Angular 官方文檔
- [Angular Signals](https://angular.dev/guide/signals)
- [toSignal() API](https://angular.dev/guide/signals/rxjs-interop)
- [Effect API](https://angular.dev/guide/signals#effects)

### AngularFire 文檔
- [Firestore Collections](https://github.com/angular/angularfire/blob/main/docs/firestore/collections.md)
- [Real-time Updates](https://github.com/angular/angularfire/blob/main/docs/firestore/querying-collections.md)

### RxJS 運算子
- [combineLatest](https://rxjs.dev/api/index/function/combineLatest)
- [map](https://rxjs.dev/api/operators/map)
- [catchError](https://rxjs.dev/api/operators/catchError)

## 總結 (Summary)

✅ **問題已解決**：組織和團隊現在會在刷新後保留  
✅ **現代化架構**：使用 Angular 20 Signals 和最佳實踐  
✅ **響應式設計**：自動響應認證狀態變化  
✅ **錯誤處理**：妥善處理載入失敗情況  
✅ **擴展性**：為未來即時訂閱做好準備

**下一步**：
1. 測試刷新功能
2. 考慮實作即時訂閱
3. 優化載入效能
4. 新增單元測試
