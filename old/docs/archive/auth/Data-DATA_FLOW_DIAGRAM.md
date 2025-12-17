# 資料流程圖 (Data Flow Diagram)

## 修復前 (Before Fix)

```
使用者登入
    ↓
FirebaseAuthService.user$ 發射 User
    ↓
WorkspaceContextService.effect() 觸發
    ↓
currentUserState.set(user) ✅
    ↓
❌ 沒有載入組織和團隊資料
    ↓
organizationsState = [] (空陣列)
teamsState = [] (空陣列)
    ↓
頁面刷新
    ↓
❌ 資料消失
```

## 修復後 (After Fix)

```
使用者登入
    ↓
FirebaseAuthService.user$ 發射 User
    ↓
WorkspaceContextService.effect() 觸發
    ↓
currentUserState.set(user) ✅
    ↓
✅ loadUserData(user.uid) 自動執行
    ↓
OrganizationRepository.findByCreator(userId)
    ↓
Firebase Firestore 查詢 'organizations' collection
    ↓
organizationsState.set(organizations) ✅
    ↓
loadTeamsForOrganizations(orgIds)
    ↓
combineLatest([
    TeamRepository.findByOrganization(orgId1),
    TeamRepository.findByOrganization(orgId2),
    ...
])
    ↓
Firebase Firestore 查詢 'teams' collection
    ↓
teamsState.set(allTeams) ✅
    ↓
頁面刷新
    ↓
✅ effect() 再次執行
✅ 資料重新載入
✅ 組織和團隊保持顯示
```

## 藍圖載入流程 (Blueprint Loading Flow)

### 修復前 (Before Fix)

```
BlueprintListComponent.ngOnInit()
    ↓
loadBlueprints()
    ↓
固定載入 USER 上下文的藍圖
    ↓
❌ 不響應上下文變化
    ↓
切換到組織上下文
    ↓
❌ 藍圖列表不更新
```

### 修復後 (After Fix)

```
BlueprintListComponent 建構
    ↓
effect() 註冊
    ↓
監聽 workspaceContext.contextType()
監聽 workspaceContext.contextId()
    ↓
上下文變化 (USER → ORGANIZATION → TEAM)
    ↓
✅ effect() 自動觸發
    ↓
loadBlueprints() 自動執行
    ↓
根據上下文類型決定查詢參數:
- USER → OwnerType.USER + user.uid
- ORGANIZATION → OwnerType.ORGANIZATION + org.id
- TEAM → OwnerType.ORGANIZATION + team.organization_id
    ↓
BlueprintService.getByOwner(ownerType, ownerId)
    ↓
Firebase Firestore 查詢 'blueprints' collection
    ↓
blueprints.set(data) ✅
    ↓
✅ ST 表格自動更新顯示
```

## 元件通訊圖 (Component Communication)

```
┌─────────────────────────────────────────────────────┐
│                 Firebase Firestore                   │
│  collections: organizations, teams, blueprints       │
└────────────┬────────────────────────────────────────┘
             │
             │ getDocs()
             ↓
┌─────────────────────────────────────────────────────┐
│              Repository Layer                        │
│  - OrganizationRepository                           │
│  - TeamRepository                                   │
│  - BlueprintRepository                              │
└────────────┬────────────────────────────────────────┘
             │
             │ Observable<T[]>
             ↓
┌─────────────────────────────────────────────────────┐
│          WorkspaceContextService                     │
│  ┌────────────────────────────────────────────┐    │
│  │ firebaseUser = toSignal(user$)             │    │
│  │                                            │    │
│  │ effect(() => {                             │    │
│  │   if (firebaseUser()) {                    │    │
│  │     loadUserData(uid) ──┐                  │    │
│  │   }                      │                  │    │
│  │ })                       │                  │    │
│  └──────────────────────────┼──────────────────┘    │
│                             │                        │
│  ┌──────────────────────────↓──────────────────┐    │
│  │ organizationsState = signal([])             │    │
│  │ teamsState = signal([])                     │    │
│  │ loadingOrganizations = signal(false)        │    │
│  │ loadingTeams = signal(false)                │    │
│  └─────────────────────────────────────────────┘    │
└────────────┬────────────────────────────────────────┘
             │
             │ Signal<Organization[]>
             │ Signal<Team[]>
             ↓
┌─────────────────────────────────────────────────────┐
│       HeaderContextSwitcherComponent                 │
│  - 顯示組織列表                                       │
│  - 顯示團隊列表                                       │
│  - 切換上下文                                         │
└─────────────────────────────────────────────────────┘

             │
             │ contextType() / contextId()
             ↓
┌─────────────────────────────────────────────────────┐
│          BlueprintListComponent                      │
│  ┌────────────────────────────────────────────┐    │
│  │ effect(() => {                             │    │
│  │   const contextType = contextType()        │    │
│  │   const contextId = contextId()            │    │
│  │   loadBlueprints() ────────┐               │    │
│  │ })                          │               │    │
│  └─────────────────────────────┼───────────────┘    │
│                                │                     │
│  ┌─────────────────────────────↓───────────────┐    │
│  │ blueprints = signal([])                     │    │
│  │ loading = signal(false)                     │    │
│  └─────────────────────────────────────────────┘    │
└────────────┬────────────────────────────────────────┘
             │
             │ Signal<Blueprint[]>
             ↓
┌─────────────────────────────────────────────────────┐
│              ST Table Component                      │
│  - 顯示藍圖列表                                       │
│  - 分頁、排序、篩選                                   │
└─────────────────────────────────────────────────────┘
```

## Signal 響應式鏈 (Signal Reactive Chain)

```
Firebase Auth User 變化
    ↓ (Observable → Signal)
firebaseUser signal 更新
    ↓ (effect 追蹤)
loadUserData() 執行
    ↓ (Repository 查詢)
organizationsState signal 更新
    ↓ (combineLatest)
teamsState signal 更新
    ↓ (computed / derived)
contextLabel signal 自動更新
teamsByOrganization signal 自動更新
    ↓ (OnPush change detection)
HeaderContextSwitcherComponent 重新渲染
```

```
contextType signal 變化
    ↓ (effect 追蹤)
BlueprintListComponent.loadBlueprints() 執行
    ↓ (Service 查詢)
blueprints signal 更新
    ↓ (OnPush change detection)
ST Table 重新渲染
```

## 時序圖 (Sequence Diagram)

```
使用者       │  Auth      │  Context   │  Org Repo  │  Team Repo │  Firebase
            │  Service   │  Service   │            │            │
────────────┼────────────┼────────────┼────────────┼────────────┼──────────
            │            │            │            │            │
登入 ───────>│            │            │            │            │
            │            │            │            │            │
            │ user$ emit │            │            │            │
            │───────────>│            │            │            │
            │            │            │            │            │
            │            │ effect()   │            │            │
            │            │ trigger    │            │            │
            │            │─┐          │            │            │
            │            │ │          │            │            │
            │            │<┘          │            │            │
            │            │            │            │            │
            │            │ loadUser() │            │            │
            │            │───────────>│            │            │
            │            │            │            │            │
            │            │            │ getDocs()  │            │
            │            │            │───────────────────────>│
            │            │            │            │            │
            │            │            │ orgs data  │            │
            │            │            │<───────────────────────│
            │            │            │            │            │
            │            │ orgs data  │            │            │
            │            │<───────────│            │            │
            │            │            │            │            │
            │            │ set signal │            │            │
            │            │─┐          │            │            │
            │            │<┘          │            │            │
            │            │            │            │            │
            │            │ loadTeams()│            │            │
            │            │────────────┼───────────>│            │
            │            │            │            │            │
            │            │            │            │ getDocs()  │
            │            │            │            │───────────>│
            │            │            │            │            │
            │            │            │            │ teams data │
            │            │            │            │<───────────│
            │            │            │            │            │
            │            │            │ teams data │            │
            │            │<───────────┼────────────│            │
            │            │            │            │            │
            │            │ set signal │            │            │
            │            │─┐          │            │            │
            │            │<┘          │            │            │
            │            │            │            │            │
<────────────────────────│ UI update  │            │            │
顯示組織和團隊 <─────────│            │            │            │
```

## 錯誤處理流程 (Error Handling Flow)

```
loadUserData(userId)
    ↓
try {
    organizationRepo.findByCreator(userId)
        ↓
    success → organizationsState.set(data) ✅
        ↓
    loadTeamsForOrganizations(orgIds)
        ↓
    success → teamsState.set(teams) ✅
}
    ↓
catch (error) {
    logger.error(error) ❌
    organizationsState.set([]) 
    teamsState.set([])
    // 使用者看到空列表，但應用程式不會崩潰
}
```

## 關鍵設計決策 (Key Design Decisions)

### 1. 為什麼使用 Signals 而不是 BehaviorSubject？

**Signals 優點**:
- ✅ 更好的效能（細粒度更新）
- ✅ 更簡單的 API（no subscribe/unsubscribe）
- ✅ 自動變更偵測
- ✅ 類型安全
- ✅ Angular 20 官方推薦

### 2. 為什麼使用 effect() 而不是 ngOnInit()？

**effect() 優點**:
- ✅ 自動追蹤 Signal 依賴
- ✅ Signal 變化時自動重新執行
- ✅ 自動清理（元件銷毀時）
- ✅ 更響應式的設計

### 3. 為什麼使用 combineLatest 而不是 forkJoin？

**combineLatest 優點**:
- ✅ 持續發射最新值
- ✅ 任一來源更新時重新發射
- ✅ 適合長期訂閱

**forkJoin 缺點**:
- ❌ 只在所有完成時發射一次
- ❌ 不適合即時更新

### 4. 為什麼不使用即時訂閱（onSnapshot）？

**目前決策**:
- ✅ 減少 Firestore 讀取成本
- ✅ 簡化實作
- ✅ 滿足當前需求

**未來考量**:
- 如需即時同步，可升級為 `collectionData()`
- 適合多使用者協作場景

---

**圖表說明**:
- ✅ 成功路徑
- ❌ 問題點
- ↓ 資料流向
- → 方法呼叫
- ─┐ 內部處理
- <┘ 處理完成
