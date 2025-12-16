# GigHub Project Agent Guide

Welcome to the GigHub construction site progress tracking management system. This file provides context for AI coding agents to navigate and contribute to the project effectively.

## Project Overview

**GigHub** is an enterprise-level construction site management system built with modern web technologies:

- **Frontend**: Angular 20.3.x with Standalone Components & Signals
- **Admin Framework**: ng-alain 20.1.x (Delon components)
- **UI Library**: ng-zorro-antd 20.3.x (Ant Design for Angular)
- **Backend**: Firebase/Firestore with @angular/fire 20.0.1
- **Authentication**: Firebase Auth (@angular/fire/auth)
- **Database**: Firestore (@angular/fire/firestore)
- **Storage**: Firebase Storage (@angular/fire/storage)
- **Language**: TypeScript 5.9.x (strict mode)
- **Reactive**: RxJS 7.8.x
- **Package Manager**: Yarn 4.9.2

**規則**:
- Supabase (@supabase/supabase-js 2.86.x) 僅用於統計查詢，不是主要後端
- 所有主要應用程式資料（blueprints、tasks 等）必須使用 Firebase/Firestore

## Architecture

### Three-Layer Architecture

**規則**:
- 業務層 (Business Layer): Tasks、Construction Diary、Quality Control、Finance
- 容器層 (Container Layer): Blueprint、Permissions、Events、Configurations
- 基礎層 (Foundation Layer): Account、Auth、Organization、Teams

### Directory Structure

**規則**:
- `src/app/core/` - 核心服務、守衛、攔截器、models、repositories、stores、blueprint 系統
  - `core/models/` - 核心資料模型（audit-log、blueprint、blueprint-config、blueprint-module）
  - `core/repositories/` - 統一資料存取層（account、audit-log、organization、team、log、task、storage）
  - `core/stores/` - 集中狀態管理（log.store、task.store）
  - `core/blueprint/` - Blueprint 核心系統（container、events、config、context、modules）
    - `core/blueprint/repositories/` - Blueprint 專屬 repositories（blueprint、blueprint-member、blueprint-module、audit-log）
    - `core/blueprint/services/` - Blueprint 服務層（blueprint.service、validation.service、dependency-validator.service）
    - `core/blueprint/modules/implementations/` - Blueprint 模組實作（logs、tasks）
- `src/app/features/` - 可重用功能模組（module-manager）
- `src/app/routes/` - 頁面路由元件（懶載入）
- `src/app/shared/` - 共享 UI 元件、指令、管道與工具（不含業務邏輯）
- `src/app/layout/` - 應用程式佈局元件

## Working with This Project

### Common Tasks

**規則**:
1. 新增功能模組時，可重用功能放在 `src/app/features/[module-name]/`，頁面路由放在 `src/app/routes/[module-name]/`，包含模組級 `AGENTS.md`，並在路由檔案中註冊，遵循懶載入模式
2. 建立元件時，必須使用 standalone components（不使用 NgModules），從 `SHARED_IMPORTS` 匯入通用模組，使用 Signals 進行狀態管理，應用 `OnPush` 變更檢測
3. 新增服務時，全域服務放在 `src/app/core/services/`，Blueprint 相關服務放在 `src/app/core/blueprint/services/`，共享 UI 工具放在 `src/app/shared/services/`（僅 UI 相關），使用 `providedIn: 'root'` 作為單例，使用 `inject()` 函數進行依賴注入
4. 資料庫操作時，必須使用 Firestore via @angular/fire，使用 repository 模式進行資料存取，實作 Firestore Security Rules，遵循命名：`[entity].repository.ts`，一般 repositories 放在 `src/app/core/repositories/`，Blueprint 專屬 repositories 放在 `src/app/core/blueprint/repositories/`
5. 資料模型時，所有 models 必須放在 `src/app/core/models/`，使用 `@core/models` 匯入
6. 狀態管理時，Stores 必須放在 `src/app/core/stores/`，使用 Signals 實作，使用 `@core/stores` 匯入

### Code Standards

#### TypeScript

**規則**:
- 必須啟用嚴格模式
- 禁止使用 `any` 類型，使用 `unknown` 配合類型守衛
- 物件類型優先使用 `interface` 而非 `type` 別名
- 公開 API 必須使用 JSDoc
- Models 必須放在 `@core/models`
- Repositories 必須放在 `@core/repositories` 或 `@core/blueprint/repositories`
- Stores 必須放在 `@core/stores`

#### Angular Patterns

**規則**:
- 必須使用 Standalone Components（不使用 NgModules）
- 必須從 `@shared` 匯入 `SHARED_IMPORTS`
- 必須使用 Signals 進行狀態管理
- 必須應用 `OnPush` 變更檢測策略
- 必須使用 `inject()` 函數進行依賴注入

#### Naming Conventions

**規則**:
- 元件：`feature-name.component.ts`
- 服務：`feature-name.service.ts`
- 守衛：`feature-name.guard.ts`
- 模型：`feature-name.model.ts`
- 檔案名稱使用 kebab-case
- 類別名稱使用 PascalCase

### Permission System

**規則**:
- 專案使用階層式權限模型
- Blueprint (Container) 包含 Owner（完全控制）、Maintainer（管理成員與設定）、Contributor（編輯內容）、Viewer（唯讀）
- 在元件中使用 `permissionService.canEdit(blueprintId)` 檢查權限
- 在守衛中使用 `permissionService.hasRole(blueprintId, 'contributor')` 檢查角色
- 在 Firestore Security Rules 中實作權限檢查（見專案根目錄的 `firestore.rules`）

## Shared Context

### State Management

**規則**:
- 必須使用 Signals 管理本地元件狀態
- 必須使用 Services 管理跨元件共享狀態
- 必須使用 Firestore Snapshots 進行即時資料同步
- 禁止使用複雜狀態管理庫（不需要 NgRx）

### HTTP & API

**規則**:
- 必須使用 @angular/fire 服務（Firestore、Auth、Storage）
- 必須遵循 repository 模式進行資料存取
- 必須在 repositories 中實作錯誤處理
- 必須使用 RxJS 運算子進行資料轉換
- 必須使用 @angular/fire 的 `collectionData()` 和 `docData()` 取得 observables

### Forms

**規則**:
- 必須使用 Reactive Forms（`FormGroup`、`FormControl`）
- 必須使用 `Validators` 實作表單驗證
- 必須使用 ng-zorro 表單元件保持一致的 UI
- 必須將可重用的表單驗證器提取到共享服務

### Styling

**規則**:
- 必須使用 SCSS 進行樣式設計
- 必須遵循 Ant Design 指南
- 優先使用 ng-zorro 元件而非自訂 HTML
- 適當時使用 Tailwind 工具類
- 預設使用元件作用域樣式

## Module-Specific Agents

**規則**:
- 每個主要模組都有自己的 `AGENTS.md` 提供詳細上下文
- 核心架構模組：App Module、Layout Module、Core Services、Shared Components
- 基礎層模組：Passport Module、User Module、Organization Module、Team Module
- 容器層模組：Blueprint Module
- 業務層模組：Dashboard Module、Exception Module
- 模組導航：Routes Overview

## Adding New Modules

**規則**:
1. 規劃模組結構：必須建立模組目錄、包含 `AGENTS.md`、建立列表/詳情/模態元件
2. 定義資料模型：必須在 `src/app/core/types/[module].types.ts` 定義介面，包含 `id`、`blueprint_id`、`created_at`、`updated_at`、`deleted_at`（軟刪除）
3. 建立 Repository：必須在 `src/app/core/infra/repositories/[module]/[module].repository.ts` 實作，使用 @angular/fire 進行 Firestore 操作
4. 實作 Firestore Security Rules：必須在 `firestore.rules` 中實作權限檢查，使用 `canReadBlueprint()` 和 `canEditBlueprint()` 輔助函數
5. 建立 UI 元件：必須使用 ng-alain 的 ST table 進行列表顯示
6. 註冊路由：必須在 `src/app/routes/routes.ts` 中註冊，使用懶載入模式
7. 文件化：必須在 `src/app/routes/[module-name]/AGENTS.md` 中記錄模組目的、資料模型、關鍵元件、整合點、常見操作

## Testing

**規則**:
- 單元測試必須放在源檔案旁邊（`.spec.ts`）
- E2E 測試必須放在 `/e2e/` 目錄
- 執行測試：`yarn test`
- 執行 E2E：`yarn e2e`

## Build & Deploy

**規則**:
- 開發環境：`yarn start`（開發伺服器在 http://localhost:4200）
- 生產構建：`yarn build`（輸出到 `/dist`）
- 程式碼檢查與格式化：`yarn lint`（ESLint）、`yarn format`（Prettier）

## Getting Help

**規則**:
1. 必須先檢查模組特定的 AGENTS.md 獲取詳細上下文
2. 必須檢視類似模組的現有實作
3. 必須查閱 `/docs/architecture/` 中的架構文件
4. 必須檢查 `/docs/reference/api/` 中的 API 參考
5. 必須檢視 `/docs/guides/permission-system.md` 中的權限系統

## Enterprise Development Standards

### 奧卡姆剃刀原則 (Occam's Razor Principle)

**規則**:
1. 必須最小化層級，僅需三層（UI → Service → Repository）
2. 必須避免抽象過度，直接注入服務，不建立不必要的 Facade
3. 必須使用單一資料流，使用 Signals 而非複雜狀態管理
4. 必須使用組合優於繼承，使用服務組合而非深層繼承樹

### 共享上下文原則 (Shared Context Principles)

**規則**:
- 所有模組必須遵循統一的上下文傳遞模式：User Context (Auth) → Organization Context (Account) → Blueprint Context (Container) → Module Context (Business)
- 必須使用 `inject()` 注入上層上下文服務
- 必須使用 `signal()` 保存當前上下文狀態
- 必須使用 `computed()` 計算衍生狀態
- 上下文變更必須自動傳播到子元件

### 事件驅動架構 (Event-Driven Architecture)

**規則**:
- 所有模組事件必須透過 `BlueprintEventBus` 集中管理
- 事件命名必須遵循規範：`[module].[action]`（例如：`task.created`、`diary.updated`）
- 發送事件時必須包含 `type`、`blueprintId`、`timestamp`、`actor`、`data`
- 訂閱事件時必須使用 `takeUntilDestroyed()` 進行清理

### 錯誤處理標準 (Error Handling Standards)

**規則**:
- 必須實作四層錯誤防護：UI 層（Error Boundary Component）、Service 層（Try-catch 包裝）、Repository 層（Firestore 錯誤轉換）、Global 層（GlobalErrorHandler）
- 錯誤分級：`Critical`（系統級錯誤，需立即處理）、`High`（功能無法使用，需修復）、`Medium`（部分功能受影響，可降級使用）、`Low`（不影響核心功能，可忽略）
- 必須拋出類型化錯誤（繼承 BlueprintError）
- 必須包含錯誤上下文資訊

### 生命週期管理標準 (Lifecycle Management Standards)

**規則**:
- 元件生命週期必須遵循：Construction（僅注入依賴）→ Initialization（在 `ngOnInit` 中執行業務邏輯）→ Active（使用 Signals 處理響應式）→ Cleanup（在 `ngOnDestroy` 中清理）
- 禁止在 constructor 中執行業務邏輯
- 禁止手動管理 subscriptions，必須使用 `takeUntilDestroyed()`
- 禁止在 `ngOnDestroy` 中執行非同步操作
- 必須清理定時器與事件監聽器

### 模塊擴展規範 (Module Extension Standards)

**規則**:
1. 註冊階段：必須在 `module-registry.ts` 註冊模塊定義，定義模塊 ID、名稱、圖示、路由，聲明依賴的其他模塊
2. 實作階段：必須建立模塊目錄結構，實作 Repository → Service → Component，整合 Event Bus 發送領域事件，實作 Error Boundary
3. 整合階段：必須註冊路由與守衛，加入 Blueprint 模塊列表，更新 Firestore Security Rules，建立模塊專屬 AGENTS.md
4. 測試階段：必須進行單元測試（Service、Repository）、元件測試（UI Components）、整合測試（與 Blueprint 整合）、E2E 測試（完整使用者流程）

### 代碼審查檢查點 (Code Review Checklist)

**規則**:
- 架構檢查：必須遵循三層架構、使用 Signals 進行狀態管理、使用 Standalone Components、正確注入依賴
- 上下文檢查：必須正確傳遞 Blueprint Context、使用 `computed()` 計算衍生狀態、上下文清理正確實作
- 事件檢查：所有領域事件必須透過 EventBus 發送、事件命名必須遵循規範、事件訂閱必須使用 `takeUntilDestroyed()`
- 錯誤處理檢查：Service 方法必須包含 try-catch、必須拋出類型化錯誤、UI 必須使用 Error Boundary Component、錯誤分級必須正確設定
- 生命週期檢查：禁止在 constructor 執行業務邏輯、必須使用 `takeUntilDestroyed()` 管理訂閱、手動資源清理必須在 `ngOnDestroy`
- 文檔檢查：必須更新或建立模塊 AGENTS.md、程式碼必須包含 JSDoc 註解、複雜邏輯必須有文字說明
- 測試檢查：單元測試覆蓋率必須 > 80%、關鍵業務邏輯必須有測試、E2E 測試必須涵蓋主要流程

### AI 開發指引 (AI Development Guidelines)

#### 禁止行為

**規則**:
1. 禁止建立 NgModule（必須使用 Standalone Components）
2. 禁止使用 NgRx/Redux（必須使用 Signals）
3. 禁止建立 Facade 層（必須直接使用 Service）
4. 禁止手動管理訂閱（必須使用 `takeUntilDestroyed`）
5. 禁止使用 `any` 類型（必須使用 `unknown` + type guards）
6. 禁止忽略錯誤處理（必須 try-catch）
7. 禁止直接操作 Firestore（必須使用 Repository）
8. 禁止建立 SQL/RLS（必須使用 Firestore Security Rules）

#### 必須行為

**規則**:
1. 必須使用 Signals 管理狀態
2. 必須使用 `inject()` 注入依賴
3. 必須遵循三層架構
4. 必須透過 EventBus 發送事件
5. 必須實作 Error Boundary
6. 必須建立 AGENTS.md 文檔
7. 必須撰寫單元測試
8. 必須實作 Firestore Security Rules

#### 決策樹

**規則**:
- 需要狀態管理？是 → 使用 `signal()`，否 → 不需要狀態
- 需要衍生狀態？是 → 使用 `computed()`，否 → 直接使用原始 signal
- 需要訂閱？是 → 使用 `takeUntilDestroyed()`，否 → 不訂閱
- 需要新模塊？是 → 遵循「模塊擴展規範」，否 → 擴展現有模塊
- 遇到錯誤？可恢復 → 拋出 `recoverable=true` 錯誤，不可恢復 → 拋出 `recoverable=false` 錯誤

## Key Principles

**規則**:
1. Occam's Razor：保持實作簡單且專注
2. Type Safety：利用 TypeScript 嚴格模式
3. Modularity：模組間保持清晰的邊界
4. Security：始終實作 Firestore Security Rules
5. Documentation：新增功能時更新 AGENTS.md
6. Testing：為關鍵業務邏輯撰寫測試
7. Accessibility：遵循 WCAG 2.1 指南
8. Performance：使用 OnPush 變更檢測和懶載入

## Resources

**規則**:
- 專案文件：`/docs/`
- 架構文件：`/docs/architecture/`
- Blueprint 設計：`/BLUEPRINT_MODULE_DOCUMENTATION.md`
- GitHub Agents：`/.github/agents/`
- Copilot 設定：`/.github/COPILOT_SETUP.md`

---

**Version**: 1.0.0  
**Last Updated**: 2025-12-09  
**Maintained by**: GigHub Development Team
