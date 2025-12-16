# App Module Agent Guide

The App module is the **entry point** of the GigHub application, responsible for bootstrapping and configuring the entire Angular application.

## Module Purpose

**規則**:
- App 模組作為應用程式啟動點，初始化 Angular 應用程式
- 提供根配置，提供應用程式範圍的配置和服務
- 協調佈局，根據上下文路由到不同的佈局元件
- 註冊全域提供者，註冊全域服務、攔截器和守衛
- 整合 Firebase，配置 @angular/fire 與 Firebase 服務

## Module Structure

**規則**:
- `src/app/AGENTS.md` - 本文件
- `src/app/app.component.ts` - 根元件
- `src/app/app.config.ts` - 應用程式配置（standalone）
- `src/app/core/` - 核心服務、models、repositories、stores、blueprint 系統
  - `core/models/` - 核心資料模型
  - `core/repositories/` - 統一資料存取層
  - `core/stores/` - 集中狀態管理
  - `core/blueprint/` - Blueprint 核心系統（含 repositories、services、modules/implementations）
- `src/app/features/` - 可重用功能模組（如 module-manager）
- `src/app/layout/` - 佈局元件
- `src/app/routes/` - 頁面路由元件
- `src/app/shared/` - 共享 UI 元件（僅 UI，無業務邏輯）

## Application Configuration

### app.config.ts

**規則**:
- 必須使用 standalone components 模式（Angular 19+）
- 必須使用 `provideZoneChangeDetection()` 配置 Zone 變更檢測
- 必須使用 `provideRouter()` 配置路由，啟用 `withComponentInputBinding()` 和 `withHashLocation()`
- 必須使用 `provideAnimations()` 配置動畫
- 必須使用 `provideHttpClient()` 配置 HTTP，使用 `withInterceptors()` 註冊攔截器
- 必須使用 `provideFirebaseApp()`、`provideAuth()`、`provideFirestore()`、`provideStorage()` 配置 Firebase
- 必須使用 `provideNgAlain()` 配置 ng-alain 管理框架

### app.component.ts

**規則**:
- 根元件必須是最小化的，僅渲染 router outlet
- 所有佈局邏輯必須委派給佈局元件
- 必須使用 standalone component

## Architecture Layers

### Foundation Layer (基礎層)

**規則**:
- 目的：核心基礎設施和身份管理
- 模組：Account & Auth（用戶身份、認證、會話管理）、Organization（多租戶組織管理）、Team（基於團隊的協作）
- 關鍵服務：`FirebaseAuthService`（Firebase 認證）、`AccountService`（用戶帳號操作）、`OrganizationService`（組織 CRUD）、`TeamService`（團隊管理）

### Container Layer (容器層)

**規則**:
- 目的：專案/工作區容器和配置
- 模組：Blueprint（主要專案容器，包含權限和設定）、Events（跨模組通訊的事件匯流排）、Permissions（細粒度存取控制）
- 關鍵服務：`BlueprintService`（Blueprint CRUD 操作）、`BlueprintEventBus`（事件驅動通訊）、`PermissionService`（權限檢查）

### Business Layer (業務層)

**規則**:
- 目的：領域特定的業務模組
- 模組：Tasks（任務管理和追蹤）、Diary（每日施工日誌）、Quality（品質控制和檢查）、Financial（預算和成本管理）
- 模式：所有業務模組都必須限定在 Blueprint 容器範圍內

## Bootstrap Process

**規則**:
- 初始化流程：`main.ts` → `bootstrapApplication(AppComponent, appConfig)` → 載入 `app.config.ts` 提供者 → 初始化 Firebase → 註冊路由（懶載入）→ 執行 `APP_INITIALIZER`（StartupService）→ 檢查認證狀態 → 渲染 AppComponent → 導航到初始路由 → 載入適當的佈局 → 載入功能模組（懶載入）
- `main.ts` 必須使用 `bootstrapApplication()` 啟動應用程式，必須處理啟動錯誤

## Firebase/Firestore Integration

**規則**:
- Firebase 必須在 `environment.ts` 中配置
- 必須使用 @angular/fire 提供的服務：Authentication（`provideAuth()`）、Firestore（`provideFirestore()`）、Storage（`provideStorage()`）、Functions（可選）
- 必須使用 `inject()` 注入 Firebase 服務（`Auth`、`Firestore`）

## HTTP Interceptors

### AuthInterceptor

**規則**:
- 必須自動將 Firebase Auth token 附加到請求
- 必須使用 `HttpInterceptorFn` 實作
- 必須使用 `inject(Auth)` 注入認證服務
- 必須處理 token 獲取失敗的情況

### ErrorInterceptor

**規則**:
- 必須處理 HTTP 請求的全域錯誤
- 必須記錄錯誤到 LoggerService
- 必須根據錯誤狀態碼顯示適當的錯誤訊息（401、403、500+）
- 必須使用 `NzMessageService` 顯示用戶友好的錯誤訊息

## State Management Strategy

### Signal-Based State

**規則**:
- 必須使用 Angular Signals（v19+）進行響應式狀態管理
- 優點：細粒度響應式、自動依賴追蹤、更好的效能、更簡單的程式碼
- 必須使用 `signal()` 定義可寫入的 signal
- 必須使用 `computed()` 定義計算的 signal（衍生狀態）
- 必須使用 `effect()` 處理副作用

### When to Use RxJS

**規則**:
- 必須在以下情況使用 RxJS：HTTP 請求（已返回 Observables）、WebSocket/即時資料（Firestore snapshots）、事件流（用戶輸入事件）、複雜的非同步流程（多個非同步操作）
- 必須使用 `toSignal()` 將 Observable 轉換為 Signal

## Routing Strategy

### Hash-Based Routing

**規則**:
- 必須使用基於 hash 的路由（`#/`）以獲得相容性
- 優點：無需伺服器配置、與 Firebase Hosting 相容、更容易部署
- URL 格式：`/#/dashboard`、`/#/blueprint`、`/#/blueprint/123`、`/#/passport/login`

### Route Input Binding

**規則**:
- 必須啟用現代 Angular 路由輸入綁定
- 路由參數必須自動注入為元件輸入
- 元件必須使用 `input.required<string>()` 接收路由參數

## Module Communication

### Event Bus Pattern

**規則**:
- 跨模組通訊必須透過 `BlueprintEventBus` 進行
- 發送事件時必須包含 `type`、`blueprintId`、`timestamp`、`actor`、`data`
- 訂閱事件時必須使用 `takeUntilDestroyed()` 進行清理
- 優點：鬆耦合、可擴展性、易於除錯、審計追蹤

## Environment Configuration

**規則**:
- 開發環境：`production: false`、使用本地 API 端點、啟用詳細日誌記錄、包含 Firebase 開發環境配置、啟用 Mock 資料（如適用）
- 生產環境：`production: true`、使用生產 API 端點、僅記錄錯誤等級日誌、包含 Firebase 生產環境配置、停用 Mock 資料
- 功能標誌必須在環境配置中定義

## Testing Strategy

**規則**:
- 單元測試：必須在隔離環境中測試元件、服務和管道
- 整合測試：必須測試模組整合和路由
- E2E 測試：必須使用 Playwright 測試完整的用戶流程

## Performance Optimization

**規則**:
- 所有功能模組必須使用懶載入
- 所有元件必須使用 `OnPush` 策略
- 最佳效能組合：Signals + OnPush
- 懶載入優點：更小的初始套件、更快的首次載入、更好的快取

## Security Best Practices

**規則**:
1. Firestore Security Rules：所有資料存取必須由伺服器端規則保護
2. Route Guards：受保護的路由必須使用功能守衛
3. Input Sanitization：必須使用 Angular 內建的清理功能清理用戶輸入
4. HTTPS Only：生產環境必須強制使用 HTTPS

## Common Patterns

### Service Injection

**規則**:
- 必須使用現代的 `inject()` 函數進行依賴注入

### Component Communication

**規則**:
- 必須使用 signals 和 outputs 進行元件通訊
- 父元件必須使用 `[data]="parentData()"` 傳遞資料
- 子元件必須使用 `input.required<Data>()` 接收資料
- 子元件必須使用 `output<Action>()` 發送事件

### Async Data Loading

**規則**:
- 必須使用 loading 和 error 狀態的模式
- 必須使用 `signal(false)` 管理 loading 狀態
- 必須使用 `signal<string | null>(null)` 管理 error 狀態
- 必須在 try-catch-finally 中處理非同步操作

## Troubleshooting

**規則**:
- Firebase 未初始化：必須檢查 `environment.ts` 是否有正確的 Firebase 配置
- 路由未載入：必須驗證路由路徑和懶載入匯入
- Signals 未更新 UI：必須確保使用 OnPush + signal 模式，必須呼叫 `.set()` 或 `.update()`
- HTTP 攔截器未工作：必須驗證攔截器是否在 `app.config.ts` 中註冊

## Related Documentation

**規則**:
- 必須參考 Root AGENTS.md 獲取專案總覽
- 必須參考 Core Services AGENTS.md 獲取核心基礎設施
- 必須參考 Layout AGENTS.md 獲取佈局系統
- 必須參考 Routes AGENTS.md 獲取功能模組
- 必須參考 Shared AGENTS.md 獲取可重用元件

## Development Commands

**規則**:
- 開發伺服器：`yarn start`（http://localhost:4200）
- 構建：`yarn build`（生產構建）、`yarn build:dev`（開發構建）
- 測試：`yarn test`（單元測試）、`yarn test:coverage`（含覆蓋率）、`yarn e2e`（E2E 測試）
- 程式碼檢查：`yarn lint`（TypeScript + SCSS）、`yarn lint:fix`（自動修復問題）
- 程式碼生成：`ng g component my-component --standalone`、`ng g service my-service`、`ng g guard my-guard --functional`

## Best Practices

**規則**:
1. 必須使用 Standalone Components（不使用 NgModules）
2. 必須使用 Signals（進行響應式狀態管理）
3. 必須使用 `inject()`（進行依賴注入）
4. 必須使用 OnPush（進行變更檢測）
5. 必須使用 Lazy Loading（進行功能模組載入）
6. 必須使用 Functional Guards（而非基於類別的）
7. 必須使用 Route Input Binding（獲得更乾淨的程式碼）
8. 必須使用 Firebase/Firestore（作為主要後端）
9. 必須使用 TypeScript Strict Mode（獲得類型安全）
10. 必須撰寫測試（針對關鍵功能）

---

**Module Version**: 1.0.0  
**Last Updated**: 2025-12-09  
**Status**: Production Ready
