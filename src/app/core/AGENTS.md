# Core Services Agent Guide

The Core module contains essential services, guards, interceptors, and infrastructure that support the entire GigHub application.

## Module Purpose

**規則**:
- Core 服務提供應用程式範圍內使用的單例服務
- 提供 HTTP 攔截器處理請求/回應
- 提供路由守衛進行導航控制
- 提供錯誤處理基礎設施
- 提供 Repository 模式進行資料存取
- 提供應用程式啟動邏輯

## Module Structure

**規則**:
- `src/app/core/models/` - 核心資料模型（audit-log.model、blueprint.model、blueprint-config.model、blueprint-module.model）
- `src/app/core/repositories/` - 統一資料存取層（account、audit-log、organization、organization-member、team、team-member、log、task、storage）
- `src/app/core/stores/` - 集中狀態管理（log.store、task.store）
- `src/app/core/services/` - 全域單例服務（firebase-auth、logger、supabase）
- `src/app/core/blueprint/` - Blueprint 核心系統
  - `blueprint/repositories/` - Blueprint 專屬 repositories（blueprint、blueprint-member、blueprint-module、audit-log）
  - `blueprint/services/` - Blueprint 服務層（blueprint.service、validation.service、dependency-validator.service）
  - `blueprint/modules/implementations/` - Blueprint 模組實作（logs、tasks）
  - `blueprint/container/` - Blueprint 容器（lifecycle-manager、module-registry、resource-provider）
  - `blueprint/events/` - 事件系統（event-bus）
  - `blueprint/config/` - 配置管理
  - `blueprint/context/` - 執行上下文
- `src/app/core/errors/` - 自訂錯誤類別（blueprint-error、permission-denied-error、validation-error、module-not-found-error）
- `src/app/core/startup/` - 應用程式初始化（startup.service.ts）
- `src/app/core/i18n/` - 國際化（i18n.service.ts）
- `src/app/core/index.ts` - 公開 API 匯出

## Key Services

### FirebaseAuthService

**規則**:
- 位置：`src/app/core/services/firebase-auth.service.ts`
- 必須使用 `@angular/fire/auth` 的 `Auth` 服務
- 必須使用 `providedIn: 'root'` 作為單例服務
- 必須使用 `inject()` 注入依賴
- 必須提供 `user$` Observable 監聽認證狀態
- 必須提供 `currentUser` getter 取得當前用戶
- 必須實作 `signIn()`、`signUp()`、`signOut()` 方法
- 必須實作社交登入方法（Google、GitHub）
- 必須實作郵件驗證和密碼重置方法

### FirestoreService (Optional Wrapper)

**規則**:
- 位置：`src/app/core/services/firestore.service.ts`（如果存在）
- 目的：集中 Firestore 存取
- 必須提供 `collection<T>()` 方法取得集合引用
- 必須提供 `doc<T>()` 方法取得文件引用
- 必須提供 `getDoc<T>()` 方法取得文件資料
- 必須提供 `getCollection$<T>()` 方法取得集合 Observable

### SupabaseService (Statistics Only)

**規則**:
- 位置：`src/app/core/services/supabase.service.ts`
- ⚠️ **僅用於統計查詢**，不能用於主要應用程式資料
- 必須使用 Supabase 客戶端進行唯讀查詢
- 必須僅查詢統計資料表
- 所有主要應用程式資料（blueprints、tasks 等）必須使用 Firebase/Firestore
- 必須使用 `providedIn: 'root'` 作為單例服務
- 必須在文件註明僅用於統計查詢

### LoggerService

**規則**:
- 位置：`src/app/core/services/logger.service.ts`
- 必須提供結構化日誌記錄功能
- 必須支援多個日誌等級（Debug、Info、Warn、Error、Critical）
- 必須根據環境設定最小日誌等級（生產環境：Warn，開發環境：Debug）
- 必須包含時間戳記和上下文資訊
- 必須在生產環境中發送 Critical 錯誤到監控服務
- 必須避免記錄敏感資料
- 必須使用 `providedIn: 'root'` 作為單例服務

### PermissionService

**規則**:
- 位置：`src/app/core/services/permission.service.ts`
- 目的：客戶端權限檢查，帶快取
- 必須實作權限檢查方法：`canRead()`、`canEdit()`、`canDelete()`、`canManageMembers()`、`canManageSettings()`
- 必須實作快取機制（5 分鐘 TTL）
- 必須檢查擁有者權限
- 必須檢查成員角色權限
- 必須提供 `clearCache()` 方法清除快取
- 必須使用 `providedIn: 'root'` 作為單例服務

### ValidationService

**規則**:
- 位置：`src/app/core/services/validation.service.ts`
- 目的：基於 Schema 的宣告式驗證
- 必須定義 ValidationRule 介面（type、value、message）
- 必須定義 ValidationSchema 介面
- 必須定義 ValidationResult 介面（valid、errors）
- 必須實作 `validate()` 方法驗證資料
- 必須支援驗證規則類型：required、minLength、maxLength、pattern、custom
- 必須返回驗證結果和錯誤訊息

## Route Guards

### AuthGuard

**規則**:
- 位置：`src/app/core/guards/auth.guard.ts`
- 目的：確保用戶已認證
- 必須實作 `CanActivateFn` 介面
- 必須檢查用戶是否已認證
- 如果未認證，必須重定向到登入頁面並帶上返回 URL
- 必須使用 `inject()` 注入服務

### PermissionGuard

**規則**:
- 位置：`src/app/core/guards/permission.guard.ts`
- 目的：檢查用戶是否具有所需權限
- 必須實作 `CanActivateFn` 介面
- 必須從路由參數中取得資源 ID
- 必須使用 `PermissionService` 檢查權限
- 如果沒有權限，必須重定向到 `/exception/403`
- 必須使用 `inject()` 注入服務

### ModuleEnabledGuard

**規則**:
- 位置：`src/app/core/guards/module-enabled.guard.ts`
- 目的：檢查 Blueprint 是否啟用了指定模組
- 必須實作 `CanActivateFn` 介面
- 必須從路由參數中取得 `blueprintId`
- 必須查詢 Firestore 檢查 `enabled_modules` 陣列
- 如果模組未啟用，必須重定向到 Blueprint 詳情頁面並帶上錯誤查詢參數
- 必須使用 `inject()` 注入服務

## Error Handling

### Custom Error Classes

**規則**:
- 必須定義 ErrorSeverity 枚舉（Critical、High、Medium、Low）
- BlueprintError 必須繼承自 Error，包含 `severity`、`recoverable`、`context` 屬性
- PermissionDeniedError 必須繼承自 BlueprintError，設定 `severity: High`、`recoverable: false`
- ValidationError 必須繼承自 BlueprintError，包含 `errors` 屬性（Record<string, string[]>），設定 `severity: Medium`、`recoverable: true`
- ModuleNotFoundError 必須繼承自 BlueprintError，設定 `severity: High`、`recoverable: false`
- 必須在 Service 方法中使用 try-catch 包裝，拋出類型化錯誤
- 必須在 Repository 層將 Firestore 錯誤轉換為領域錯誤

## Repository Pattern

### Base Repository Structure

**規則**:
- 必須使用抽象類別 `BaseRepository<T>` 作為基礎
- 必須使用 `inject(Firestore)` 注入 Firestore
- 必須使用 `inject(LoggerService)` 注入日誌服務
- 必須定義抽象屬性 `collectionName`
- 必須實作 `findById(id)` 方法（根據 ID 查找實體）
- 必須實作 `list(filter?)` 方法（列出實體，支援篩選）
- 必須實作 `create(entity)` 方法（建立實體，自動設定 created_at 和 updated_at）
- 必須實作 `update(id, entity)` 方法（更新實體，自動設定 updated_at）
- 必須實作 `softDelete(id)` 方法（軟刪除，設定 deleted_at）
- 必須在查詢中過濾 `deleted_at == null`
- 必須使用 try-catch 處理錯誤並記錄日誌

### Concrete Repository Example

**規則**:
- 必須繼承自 `BaseRepository<T>`
- 必須實作 `collectionName` getter
- 可以實作額外的查詢方法（例如：`findBySlug()`、`findByOwnerId()`）
- 必須使用 @angular/fire 的查詢功能（query、where、orderBy）

## Startup Service

**規則**:
- 位置：`src/app/core/startup/startup.service.ts`
- 目的：在啟動時初始化應用程式
- 必須使用 `providedIn: 'root'` 作為單例服務
- 必須實作 `load()` 方法執行啟動邏輯
- 必須檢查認證狀態
- 必須載入用戶偏好設定
- 必須初始化服務
- 必須在 `app.config.ts` 中使用 `APP_INITIALIZER` 註冊

## Enterprise Service Patterns

### Service 生命週期管理 (Service Lifecycle)

**規則**:
- Singleton Services（全域服務）：必須使用 `providedIn: 'root'`，生命週期與應用程式相同，狀態在路由變更之間保持，不需要實作 `ngOnDestroy`
- Scoped Services（範圍服務）：必須在元件中提供，生命週期僅在元件樹內，元件銷毀時銷毀，必須實作 `ngOnDestroy` 進行清理

### 共享狀態管理 (Shared State Management)

**規則**:
- 必須使用 Signal-based State Service
- 必須使用私有可寫入的 signal（`private _state = signal<AppState>(initialState)`）
- 必須提供公開唯讀的 signal（`state = this._state.asReadonly()`）
- 必須使用 `computed()` 計算衍生狀態
- 必須提供狀態變更方法（`setLoading()`、`updateState()`）

### 事件驅動服務 (Event-Driven Services)

**規則**:
- 必須使用 `Subject<AppEvent>` 管理事件
- 必須提供 `events$` Observable 流
- 必須實作 `emit()` 方法發送事件
- 必須實作 `on(type)` 方法訂閱特定類型的事件

### Repository 擴展模式 (Repository Extension)

**規則**:
- 必須使用抽象類別 `FirestoreRepository<T>` 作為基礎
- 必須定義抽象屬性 `collectionPath`
- 必須實作 `findAll()` 方法列出所有實體
- 必須實作 `findById(id)` 方法根據 ID 查找實體
- 必須使用 TypeScript 泛型提高可重用性

## Best Practices

### Service Design

**規則**:
1. 必須保持服務專注和單一職責
2. 必須使用依賴注入提高可測試性
3. 必須使用 `providedIn: 'root'` 作為單例
4. 必須為公開 API 提供 JSDoc 註解

### Error Handling

**規則**:
1. 必須使用自訂錯誤類別處理特定場景
2. 必須在錯誤物件中包含上下文
3. 必須使用適當的嚴重性記錄錯誤
4. 必須提供用戶友好的錯誤訊息

### Repository Pattern

**規則**:
1. 必須抽象資料庫操作
2. 必須一致地處理錯誤
3. 必須使用 TypeScript 泛型提高可重用性
4. 必須實作軟刪除以保留資料

### Guards

**規則**:
1. 必須保持守衛邏輯簡單
2. 必須返回 UrlTree 進行重定向
3. 必須使用 `[guard1, guard2]` 組合守衛進行複雜檢查
4. 必須在適當時候快取權限結果

### Logging

**規則**:
1. 必須使用適當的日誌等級
2. 必須包含相關上下文
3. 必須避免記錄敏感資料
4. 必須為開發/生產配置不同的等級

## Related Documentation

**規則**:
- 必須參考 Root AGENTS.md 獲取專案總覽
- 必須參考 Blueprint Module AGENTS.md 獲取 Blueprint 特定資訊
- 必須參考 Shared Components AGENTS.md 獲取可重用元件

---

**Module Version**: 1.0.0  
**Last Updated**: 2025-12-09  
**Status**: Production Ready
