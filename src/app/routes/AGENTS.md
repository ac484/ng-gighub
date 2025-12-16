# Routes Module Agent Guide

The Routes module organizes all feature modules in the GigHub application using lazy-loading for optimal performance.

## Module Purpose

The routes directory contains:
- **Feature modules** organized by business domain
- **Lazy-loaded routes** for performance optimization
- **Module-level guards** for access control
- **Nested routing** for complex features
- **Module-specific AGENTS.md** for detailed context

## Routes Structure

```
src/app/routes/
├── routes.ts                   # Main routing configuration
├── blueprint/                  # Blueprint container module (AGENTS.md)
├── dashboard/                  # Dashboard views
├── passport/                   # Authentication flows
└── exception/                  # Error pages
```

## Main Routing Configuration

**規則**:
- 主路由配置檔案位於 `src/app/routes/routes.ts`
- 根路徑必須使用 `LayoutBasicComponent` 並使用 `authGuard` 保護
- 預設路由必須重定向到 `dashboard`
- 所有功能模組必須使用懶載入模式
- 認證路由必須使用 `LayoutPassportComponent`
- 異常路由不需要認證
- catch-all 路由必須重定向到 `/exception/404`

## Feature Module Patterns

### Module Routing Template

**規則**:
- 每個功能模組必須遵循標準路由模式
- 列表路由使用空路徑 `''`
- 詳情路由使用 `:id` 參數
- 編輯路由使用 `:id/edit` 路徑
- 所有路由必須設定 `title` 資料屬性
- 需要權限的路由必須使用 `permissionGuard`

### Lazy Loading Benefits

**規則**:
1. 必須使用懶載入以減少初始套件大小
2. 必須僅在需要時載入功能
3. 必須利用 Webpack 程式碼分割
4. 必須改善快取策略（未變更的模組保持快取）

### Route Data

**規則**:
- 必須使用路由 `data` 傳遞配置
- 必須包含 `title`（頁面標題）
- 可以包含 `breadcrumb`（麵包屑標籤）
- 可以包含 `permission`（所需權限）
- 可以包含 `module`（模組 ID，用於功能標誌）
- 可以包含 `showInMenu`（是否在側邊欄選單顯示）
- 可以包含 `icon`（選單圖示）
- 可以包含 `order`（選單順序）

## Route Guards

### Authentication Guard

**規則**:
- 必須檢查用戶是否已認證
- 如果未認證，必須重定向到登入頁面並帶上返回 URL
- 必須使用 `inject()` 注入服務

### Permission Guard

**規則**:
- 必須檢查用戶是否具有所需權限
- 如果沒有權限，必須重定向到 `/exception/403`
- 必須從路由參數中取得資源 ID
- 必須使用 `PermissionService` 檢查權限

### Module Enabled Guard

**規則**:
- 必須檢查藍圖是否啟用了指定模組
- 如果模組未啟用，必須重定向到藍圖詳情頁面並帶上錯誤查詢參數
- 必須從路由參數中取得 `blueprintId`
- 必須查詢 Firestore 檢查 `enabled_modules` 陣列

### Guard Composition

**規則**:
- 可以組合多個守衛：`[authGuard, permissionGuard('edit'), moduleEnabledGuard('task')]`
- 守衛執行順序：認證 → 權限 → 模組啟用
- 所有守衛必須通過才能存取路由

## Module Organization

### Foundation Layer Routes

**規則**:
- `/account/profile` - 用戶個人資料
- `/account/settings` - 用戶設定
- `/organization` - 組織列表
- `/organization/:id` - 組織詳情
- `/organization/:id/teams` - 團隊管理

### Container Layer Routes

**規則**:
- `/blueprint` - 藍圖列表
- `/blueprint/:id` - 藍圖詳情
- `/blueprint/:id/members` - 成員管理
- `/blueprint/:id/audit` - 稽核日誌
- `/blueprint/:id/settings` - 藍圖設定

### Business Layer Routes

**規則**:
- `/blueprint/:blueprintId/tasks` - 任務管理
- `/blueprint/:blueprintId/diary` - 施工日誌
- `/blueprint/:blueprintId/quality` - 品質控制
- `/blueprint/:blueprintId/financial` - 財務管理
- `/blueprint/:blueprintId/files` - 檔案管理

## Navigation Patterns

### Hierarchical Navigation

**規則**:
- 從藍圖列表到詳情：`router.navigate(['/blueprint', blueprintId])`
- 從藍圖詳情到任務：`router.navigate(['/blueprint', blueprintId, 'tasks'])`
- 從任務列表到詳情：`router.navigate(['/blueprint', blueprintId, 'tasks', taskId])`

### Relative Navigation

**規則**:
- 向上導航一層：`router.navigate(['../'], { relativeTo: this.route })`
- 導航到兄弟路由：`router.navigate(['../audit'], { relativeTo: this.route })`
- 帶查詢參數導航：`router.navigate(['/blueprint'], { queryParams: { status: 'active' } })`

### Programmatic Navigation

**規則**:
- 必須使用 `inject(Router)` 注入路由器
- 必須使用 `inject(ActivatedRoute)` 注入當前路由
- 可以使用 `window.history.back()` 返回上一頁
- 必須處理導航錯誤

## Route Parameters

### Reading Route Parameters

**規則**:
- 可以使用 `route.snapshot.paramMap.get('id')` 一次性讀取
- 可以使用 `route.paramMap.subscribe()` 響應式讀取
- 必須使用 `signal()` 儲存路由參數
- 必須在參數變更時重新載入資料

### Reading Query Parameters

**規則**:
- 可以使用 `route.snapshot.queryParamMap.get('status')` 一次性讀取
- 可以使用 `route.queryParamMap.subscribe()` 響應式讀取
- 必須使用查詢參數進行篩選和分頁

## Breadcrumbs

**規則**:
- 必須使用 `computed()` 計算麵包屑
- 麵包屑必須包含首頁、父級路由和當前路由
- 必須使用 `PageHeaderComponent` 顯示麵包屑
- 最後一項不能有路徑（當前頁面）

## Module-Specific AGENTS.md

**規則**:
- 每個主要功能模組必須有自己的 `AGENTS.md`
- Blueprint 模組：`src/app/routes/blueprint/AGENTS.md`
- 未來模組（Task、Diary、Quality）也必須建立 `AGENTS.md`

## Adding New Routes

**規則**:
1. 必須建立模組目錄：`src/app/routes/[module-name]/`
2. 必須建立路由檔案：`routes.ts`
3. 必須建立元件（使用 `ng generate component --standalone`）
4. 必須在主路由中註冊（`src/app/routes/routes.ts`）
5. 如果適用，必須加入側邊欄選單
6. 複雜模組必須建立 `AGENTS.md`

## Best Practices

### Route Design

**規則**:
1. 所有功能模組必須使用懶載入
2. 路由路徑必須簡單且描述性
3. 路由區段必須使用 kebab-case
4. 相關路由必須邏輯巢狀
5. 避免深度巢狀（最多 3-4 層）

### Guards

**規則**:
1. 必須仔細排序守衛（認證優先，然後權限）
2. 必須快取權限檢查（避免重複資料庫查詢）
3. 必須提供回饋（守衛失敗時顯示清楚的錯誤訊息）
4. 必須測試邊緣情況（處理缺失 ID、過期工作階段）

### Navigation

**規則**:
1. 盡可能使用相對導航
2. 如果需要，必須保留查詢參數：`{ queryParamsHandling: 'preserve' }`
3. 必須處理導航錯誤
4. 必須提供載入狀態（導航期間顯示載入器）

### Module Organization

**規則**:
1. 相關功能必須分組在同一目錄
2. 複雜功能必須建立模組級 `AGENTS.md`
3. 模組間必須使用一致的命名
4. 通用元件必須透過 shared 模組共享

## Troubleshooting

**規則**:
- 如果路由未找到，必須檢查路由路徑拼寫、驗證模組是否在主路由中註冊、檢查守衛是否阻擋存取、確保懶載入模組匯出路由
- 如果守衛阻擋存取，必須驗證用戶是否已認證、檢查用戶是否具有所需權限、確保藍圖中啟用了模組、檢查守衛邏輯是否有錯誤
- 如果麵包屑未顯示，必須驗證路由配置中的麵包屑資料、檢查元件是否使用 `PageHeaderComponent`、確保麵包屑項目格式正確
- 如果模組未載入，必須檢查瀏覽器控制台錯誤、驗證匯入路徑是否正確、確保模組匯出路由常數、檢查是否有循環依賴

## Related Documentation

- **[Root AGENTS.md](../../AGENTS.md)** - Project-wide context
- **[Blueprint Module](./blueprint/AGENTS.md)** - Blueprint specifics
- **[Core Services](../core/AGENTS.md)** - Guards and services

---

**Module Version**: 1.0.0  
**Last Updated**: 2025-12-09  
**Status**: Active Development
