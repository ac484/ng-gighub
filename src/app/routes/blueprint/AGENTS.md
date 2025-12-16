# Blueprint Module Agent Guide

The Blueprint module is the **Container Layer** core of GigHub - it provides the logical container for all project-related data and operations.

## Module Purpose

**規則**:
- Blueprint 代表一個建築專案工作區
- 包含任務、日誌條目、品質檢查和財務資料
- 管理成員權限和存取控制
- 追蹤稽核日誌以符合規範
- 配置啟用的模組和設定
- 支援用戶擁有和組織擁有的上下文

## Module Structure

**規則**:
- `src/app/routes/blueprint/AGENTS.md` - 本文件
- `blueprint-list.component.ts` - 列表/索引視圖（使用 ST table）
- `blueprint-detail.component.ts` - 詳情視圖（模組儀表板）
- `blueprint-modal.component.ts` - 建立/編輯模態框
- `routes.ts` - 模組路由
- `members/blueprint-members.component.ts` - 成員管理
- `members/member-modal.component.ts` - 新增/編輯成員
- `audit/audit-logs.component.ts` - 稽核日誌檢視器
- `container/` - 容器儀表板元件
- `components/` - 共享頁面子元件

**重要變更**:
- ⚠️ **Models 已移至** `@core/models` - 使用 `import { BlueprintModel } from '@core/models'`
- ⚠️ **Repositories 已移至** `@core/blueprint/repositories` - 使用 `import { BlueprintRepository } from '@core/blueprint/repositories'`
- ⚠️ **Services 已移至** `@core/blueprint/services` - 使用 `import { BlueprintService } from '@core/blueprint/services'`
- ⚠️ **Module Implementations 已移至** `@core/blueprint/modules/implementations` - logs 和 tasks 模組現在是核心實作
- ⚠️ **Module Manager 已移至** `@features/module-manager` - 獨立功能模組

## Data Models

### Blueprint

**規則**:
- 必須包含 `id`（UUID 主鍵）
- 必須包含 `name`（顯示名稱，最少 3 個字元）
- 必須包含 `slug`（URL 友好的識別符，唯一）
- 可以包含 `description`（選填描述）
- 必須包含 `owner_type`（'user' | 'organization'）
- 必須包含 `owner_id`（用戶 ID 或組織 ID）
- 必須包含 `status`（'draft' | 'active' | 'archived'）
- 必須包含 `visibility`（'public' | 'private'）
- 必須包含 `enabled_modules`（字串陣列，例如：['task', 'diary', 'quality', 'financial']）
- 必須包含 `module_settings`（Record<string, any>）
- 必須包含 `created_at`、`updated_at`（字串）
- 可以包含 `deleted_at`（軟刪除）
- 必須包含 `created_by`、`updated_by`（字串）

### BlueprintMember

**規則**:
- 必須包含 `id`、`blueprint_id`、`account_id`（用戶/Bot ID）
- 必須包含 `role`（'viewer' | 'contributor' | 'maintainer'，系統角色，影響權限）
- 可以包含 `business_role`（'project_manager' | 'site_supervisor' | 'engineer' | 'quality_inspector' | 'architect' | 'contractor' | 'client'，業務角色，用於顯示）
- 必須包含 `is_external`（布林值，外部承包商標記）
- 必須包含 `granted_at`、`granted_by`（字串）

### AuditLog

**規則**:
- 必須包含 `id`、`blueprint_id`
- 必須包含 `entity_type`（'Blueprint' | 'Member' | 'Task' | 'Log' | 'Quality' | 'Module'）
- 必須包含 `entity_id`、`operation`（'Create' | 'Update' | 'Delete' | 'Access' | 'PermissionGrant'）
- 必須包含 `actor_id`、`actor_name`、`timestamp`
- 可以包含 `changes`、`metadata`（Record<string, any>）

## Enterprise Architecture Patterns

### 奧卡姆剃刀原則 (Occam's Razor Principle)

**規則**:
- 核心理念："如無必要，勿增實體" - 保持最小化複雜度
- 必須使用單一資料流，所有狀態變更通過 Signal 流動
- 必須使用最少抽象層，僅三層（UI → Service → Repository）
- 禁止使用 Redux/NgRx（Signals 已足夠）
- 禁止建立 Facade 層（直接注入 Service）
- 禁止實作複雜狀態機（使用簡單 status enum）
- 必須使用組合優於繼承，使用組合模式而非深層繼承

### 共享上下文 (Shared Context)

**規則**:
- 上下文流程架構：User Context (Firebase Auth) → Blueprint Context (Container) → Module Context (Task/Diary/Quality)
- BlueprintContextService 必須提供當前 Blueprint 上下文給所有子模組
- 必須使用 `signal<Blueprint | null>(null)` 保存當前 Blueprint
- 必須使用 `computed()` 計算衍生狀態（blueprintId、enabledModules、canEdit）
- 必須實作 `setBlueprint()` 方法設定 Blueprint
- 必須實作 `isModuleEnabled()` 方法檢查模組是否啟用
- 必須在子模組中使用 `inject(BlueprintContextService)` 注入上下文
- 上下文邊界：Route-level Context（從 URL 取得 Blueprint ID）、Component-level Context（元件作用域的提供者）、Module-level Context（功能模組內共享）

### 事件系統 (Event System)

**規則**:
- Blueprint 模組必須提供三種事件入口點：Domain Events（領域事件）、Event Bus Pattern（事件匯流排模式）、Event Usage Pattern（事件使用模式）
- 必須定義 BlueprintEventType 枚舉（Created、Updated、Deleted、MemberAdded、MemberRemoved、ModuleEnabled、ModuleDisabled）
- 必須定義 BlueprintEvent 介面（type、blueprintId、timestamp、actor、data）
- BlueprintEventBus 必須實作 `events$` Observable 流
- 必須提供過濾的流（created$、updated$）
- 必須實作 `emit()` 方法發送事件
- 必須實作 `forBlueprint()` 方法訂閱特定 Blueprint 的事件
- 事件流程：User Action (UI) → Component Method → Service Method → Repository Operation → Event Bus Emit → Event Subscribers
- 事件命名必須遵循規範：`[module].[action]`（例如：`task.created`、`diary.updated`）

### 錯誤邊界 (Error Boundaries)

**規則**:
- 必須實作四層錯誤防護：UI 層（Error Boundary Component）、Service 層（Try-catch 包裝）、Repository 層（Firestore 錯誤轉換）、Global 層（GlobalErrorHandler）
- 必須定義錯誤分類：BlueprintErrorSeverity（Low、Medium、High、Critical）
- BlueprintError 必須繼承自 Error，包含 `code`、`severity`、`recoverable`、`context`
- 必須定義特定錯誤類型：BlueprintNotFoundError、BlueprintPermissionError
- Error Boundary Component 必須捕獲並顯示錯誤
- 必須實作 `catchError()` 方法處理錯誤
- 必須實作 `retry()` 方法重試操作
- 必須實作 `goBack()` 方法返回上一頁
- Service 層必須使用 try-catch 包裝，拋出類型化錯誤
- Repository 層必須將 Firestore 錯誤轉換為領域錯誤
- GlobalErrorHandler 必須根據錯誤嚴重性顯示適當的訊息

### 生命週期管理 (Lifecycle Management)

**規則**:
- 元件生命週期必須遵循四個階段：Construction（僅注入依賴）、Initialization（在 `ngOnInit` 中執行業務邏輯）、Active（使用 Signals 處理響應式）、Cleanup（在 `ngOnDestroy` 中清理）
- 禁止在 constructor 中執行業務邏輯
- 必須使用 `takeUntilDestroyed()` 管理訂閱（自動清理）
- 必須使用 Signals 進行響應式狀態管理（無需手動清理）
- 禁止手動管理 subscriptions（不使用 `takeUntilDestroyed()`）
- Service 生命週期：Singleton service（`providedIn: 'root'`）生命週期與應用程式相同，Scoped service（在元件中提供）生命週期與元件相同
- 非同步生命週期必須使用 `signal(false)` 管理 loading 狀態，使用 `signal<Error | null>(null)` 管理 error 狀態

### 系統化模塊擴展 (Systematic Module Extension)

**規則**:
- 必須使用 Module Registry Pattern 註冊模塊定義
- ModuleDefinition 必須包含 `id`、`name`、`icon`、`description`、`route`、`requiredPermission`、`dependencies`（可選）、`configSchema`（可選）
- 新增模組必須遵循六個階段：規劃（定義模組 ID、設計資料模型、規劃 UI 元件結構、確認依賴、設計權限需求）、註冊（在 `module-registry.ts` 註冊、更新 Blueprint 介面、建立 Firestore collection、建立 Security Rules）、實作（建立模組目錄、建立 AGENTS.md、實作資料模型、實作 Repository、實作 Service、實作元件、建立路由配置）、整合（註冊路由、加入守衛、整合到 Blueprint Detail 頁面、加入側邊欄選單、實作事件整合）、測試（單元測試、元件測試、整合測試、權限測試、E2E 測試）、文件（更新模組 AGENTS.md、更新 Blueprint AGENTS.md、建立使用者指南、建立 API 文件）
- 模組服務必須實作 CRUD 操作（list、getById、create、update、delete）
- 模組服務必須在操作後透過 EventBus 發送事件
- Blueprint Detail Component 必須動態載入啟用的模組

## Components Overview

### BlueprintListComponent

**規則**:
- 目的：顯示所有可存取的 Blueprints 的主要入口點
- 必須使用 ST table 進行列表顯示，包含分頁
- 必須支援狀態篩選（draft/active/archived）
- 必須支援擁有者類型篩選
- 必須提供快速操作（view、edit、delete）
- 必須提供建立新 Blueprint 的模態框
- 必須使用 `signal<Blueprint[]>([])` 管理 Blueprints 列表
- 必須使用 `signal(false)` 管理 loading 狀態
- 必須使用 `signal<string>('all')` 管理選中的狀態
- 必須實作 `loadBlueprints()` 方法載入並顯示 Blueprints
- 必須實作 `create()` 方法開啟建立模態框
- 必須實作 `edit(blueprint)` 方法開啟編輯模態框
- 必須實作 `delete(blueprint)` 方法進行軟刪除（帶確認）

### BlueprintDetailComponent

**規則**:
- 目的：顯示完整的 Blueprint 資訊和快速操作
- 必須顯示基本資訊（name、slug、status、owner）
- 必須顯示啟用的模組網格（帶圖示）
- 必須提供快速操作按鈕（members、settings、audit、export）
- 必須提供麵包屑導航
- 必須提供基於權限的 UI 控制
- 必須使用 `signal<Blueprint | null>(null)` 管理 Blueprint
- 必須使用 `signal(false)` 管理 loading 狀態
- 必須使用 `signal(false)` 管理權限狀態（canEdit、canDelete、canManageMembers）
- 必須使用 `computed()` 計算啟用的模組資訊
- 必須在 `ngOnInit` 中載入 Blueprint 並檢查權限
- 必須實作 `checkPermissions()` 方法檢查權限

### BlueprintModalComponent

**規則**:
- 目的：統一的建立/編輯模態框，包含表單驗證
- 必須使用 Reactive Form 進行表單管理
- 必須實作表單驗證（name、slug、owner_type、owner_id、enabled_modules）
- 必須自動從 name 生成 slug（僅在建立模式）
- 必須提供模組選擇複選框
- 必須提供擁有者類型/ID 選擇
- 必須提供狀態和可見性切換
- 必須在 `ngOnInit` 中監聽 name 變更並自動生成 slug
- 必須實作 `generateSlug()` 方法生成 slug
- 必須實作 `save()` 方法保存資料
- 必須使用 ValidationService 進行驗證
- 必須在驗證失敗時顯示錯誤

### BlueprintMembersComponent

**規則**:
- 目的：管理 Blueprint 成員存取和角色
- 必須使用 ST table 顯示所有成員
- 必須顯示角色徽章（viewer/contributor/maintainer）
- 必須顯示業務角色
- 必須提供新增/編輯/移除成員的操作
- 必須顯示外部成員指示器
- 必須實作 `addMember()` 方法新增成員
- 必須實作 `removeMember()` 方法移除成員（帶確認）

### AuditLogsComponent

**規則**:
- 目的：檢視不可變的稽核追蹤
- 必須使用 ST table 顯示所有稽核日誌
- 必須支援按實體類型篩選
- 必須支援按操作篩選
- 必須格式化時間戳記
- 必須提供詳情視圖模態框
- 必須使用 `signal<string>('all')` 管理選中的實體類型和操作
- 必須使用 `computed()` 計算篩選後的日誌

## Permission System

### Role Hierarchy

**規則**:
- Maintainer（維護者）：所有權限、管理成員、管理設定、刪除 Blueprint、所有模組的完整 CRUD
- Contributor（貢獻者）：讀取 Blueprint、編輯 Blueprint、任務/日誌/品質的 CRUD、無法管理成員/設定
- Viewer（檢視者）：所有模組的唯讀存取

### Permission Checks

**規則**:
- 客戶端（UI 控制）：必須在元件中使用 `permissionService.canEdit(blueprintId)` 檢查權限，必須使用 `signal(false)` 管理權限狀態，必須在模板中使用 `@if (canEdit())` 控制 UI 顯示
- 伺服器端（Firestore Security Rules）：必須在 `firestore.rules` 中實作權限檢查，必須使用 `canReadBlueprint()` 函數檢查讀取權限，必須使用 `canEditBlueprint()` 函數檢查編輯權限，必須使用 `hasRole()` 函數檢查用戶角色，必須檢查擁有者（owner_type 和 owner_id），必須檢查成員（blueprint_members collection）

### Firestore Security Rules Structure

**規則**:
- 主要規則檔案：`firestore.rules` 在專案根目錄
- 關鍵函數：`canReadBlueprint()`（檢查讀取權限）、`canEditBlueprint()`（檢查編輯權限）、`hasRole()`（檢查用戶在 Blueprint 中的角色）、`isOwner()`（檢查用戶是否擁有 Blueprint）
- 受保護的集合：`blueprints`（主要 Blueprint 文件）、`blueprint_members`（成員角色和權限）、`blueprint_tasks`（任務）、`blueprint_logs`（活動日誌）、`blueprint_audit`（稽核日誌，不可變）
- 稽核日誌規則：允許讀取（如果可讀取 Blueprint）、允許建立（系統建立）、禁止更新和刪除（不可變）
- 成員管理規則：允許讀取（如果可讀取 Blueprint）、允許寫入（僅 maintainer）

## Validation

**規則**:
- 必須使用基於 Schema 的驗證
- BlueprintCreateSchema 必須驗證：name（必填、最少 3 個字元、最多 100 個字元）、slug（必填、只能包含小寫字母、數字和連字符）、owner_type（必填）、owner_id（必填）、enabled_modules（至少需要啟用一個模組）
- BlueprintUpdateSchema 必須驗證：name（最少 3 個字元、最多 100 個字元）、slug（只能包含小寫字母、數字和連字符）
- 必須使用 ValidationService 進行驗證

## Services & Repositories

### BlueprintService

**規則**:
- 位置：`src/app/shared/services/blueprint/blueprint.service.ts`
- 必須實作 CRUD 操作：`list()`、`getById(id)`、`create(data)`、`update(id, data)`、`delete(id)`
- 必須實作成員管理：`listMembers(blueprintId)`、`addMember(blueprintId, data)`、`updateMember(blueprintId, memberId, data)`、`removeMember(blueprintId, memberId)`
- 必須實作稽核日誌：`getAuditLogs(blueprintId)`
- 必須實作模組管理：`enableModule(blueprintId, moduleId)`、`disableModule(blueprintId, moduleId)`

### BlueprintRepository

**規則**:
- 位置：`src/app/core/infra/repositories/blueprint/blueprint.repository.ts`
- 職責：直接 Firestore 資料庫存取、使用 @angular/fire 建立查詢、資料轉換、錯誤處理
- 必須實作 `list()` 方法（查詢未刪除的 Blueprints，按建立時間降序）
- 必須實作 `getById(id)` 方法（根據 ID 取得 Blueprint）
- 必須實作 `create(data)` 方法（建立新的 Blueprint，自動設定 created_at 和 updated_at）
- 必須實作 `update(id, data)` 方法（更新 Blueprint，自動設定 updated_at）
- 必須實作 `findBySlug(slug)` 方法（根據 slug 查找 Blueprint）
- 必須實作 `findByOwnerId(ownerId, ownerType)` 方法（根據擁有者查找 Blueprints）

## Available Modules

**規則**:
- Blueprints 可以啟用以下業務模組：task（任務管理）、diary（施工日誌）、quality（品質管理）、financial（財務管理）、file（文件管理）、notification（通知系統）、timeline（時間軸）

## Common Operations

**規則**:
- 建立 Blueprint：必須開啟建立模態框，必須驗證表單，必須在成功後重新載入列表並顯示成功訊息
- 新增成員：必須開啟新增成員模態框，必須在成功後重新載入成員列表並顯示成功訊息
- 檢視稽核日誌：必須從詳情頁面導航到稽核日誌頁面

## Integration Points

**規則**:
- 與基礎層整合：Account Service（驗證 owner_id 存在）、Organization Service（檢查組織成員資格）、Team Service（管理團隊級存取）
- 與業務層整合：Task Module（限定在 blueprint_id 範圍內）、Diary Module（限定在 blueprint_id 範圍內）、Quality Module（限定在 blueprint_id 範圍內）、Financial Module（限定在 blueprint_id 範圍內）
- 與外部服務整合：Firebase Auth（用戶身份和會話管理）、Firebase Storage（Blueprint 文件上傳）、Firestore Realtime（即時更新以進行協作）

## Testing

**規則**:
- 單元測試：必須測試元件在初始化時載入 Blueprints，必須測試狀態篩選功能
- E2E 測試：必須測試完整的 Blueprint 建立流程

## Troubleshooting

**規則**:
- 成員新增後未顯示：必須檢查 Firestore Security Rules 中的 `blueprint_members` collection
- 即使作為擁有者也無法編輯 Blueprint：必須驗證 `firestore.rules` 中的 `canEditBlueprint()` 函數是否包含擁有者檢查
- Slug 驗證失敗：必須確保 slug 只包含小寫字母、數字和連字符
- 模組未出現在詳情視圖中：必須檢查 `enabled_modules` 陣列是否包含模組 ID

## Best Practices

**規則**:
1. 必須在顯示 UI 控制項之前檢查權限
2. 必須使用軟刪除（設定 `deleted_at`）而非硬刪除
3. 必須在客戶端和伺服器端都進行驗證以確保安全
4. 必須將重要操作記錄到 audit_logs 表
5. 必須對影響多個表的操作使用交易
6. 必須快取權限檢查（5 分鐘 TTL）以提高效能
7. 必須遵循命名約定以保持一致性
8. 必須為關鍵業務邏輯撰寫測試

## Related Documentation

**規則**:
- 必須參考 Root AGENTS.md 獲取專案總覽
- 必須參考 Blueprint Architecture 獲取詳細設計
- 必須參考 Permission System 獲取授權指南
- 必須參考 Firestore Rules 獲取安全規則
- 必須參考 Firebase Console 進行資料庫管理

---

**Module Version**: 1.0.0  
**Last Updated**: 2025-12-09  
**Status**: Production Ready
