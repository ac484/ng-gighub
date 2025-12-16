# Shared Services Agent Guide

The Shared Services module contains reusable business logic services used across multiple feature modules in the GigHub application.

## ⚠️ Important: Shared Services vs Core Services

**規則**:
- **`src/app/shared/services/`**（本目錄）：共享業務服務，提供業務邏輯功能（Blueprint、Account、Organization、Team、Validation、Permission 等）
- **`src/app/core/services/`**（不同目錄）：核心基礎設施服務，提供應用程式級別的功能（認證、日誌、統計查詢）
- **區別**：
  - Shared Services：業務邏輯層，包含領域特定的服務，可在多個功能模組間共享
  - Core Services：基礎設施層，與業務邏輯無關，提供技術性功能
- **選擇原則**：
  - 業務邏輯、領域功能 → 放在 `shared/services/`（本目錄）
  - 技術性、基礎設施功能 → 放在 `core/services/`
- **禁止混淆**：不要將業務服務放在 `core/services/`，不要將基礎設施服務放在 `shared/services/`（本目錄）

## Module Purpose

**規則**:
- Shared Services 模組提供可重用的業務邏輯服務
- 提供領域特定的服務（Blueprint、Account、Organization、Team）
- 提供橫切關注點服務（Validation、Permission、Audit）
- 提供上下文管理服務（WorkspaceContext、MenuManagement）
- 這些服務可在多個功能模組間共享使用

## Module Structure

**規則**:
- `src/app/shared/services/AGENTS.md` - 本文件
- `account/` - 帳號相關服務
- `audit/` - 稽核相關服務
- `blueprint/` - Blueprint 相關服務
- `organization/` - 組織相關服務
- `permission/` - 權限相關服務
- `team/` - 團隊相關服務
- `validation/` - 驗證相關服務
- `menu-management.service.ts` - 選單管理服務
- `workspace-context.service.ts` - 工作區上下文服務
- `index.ts` - 公開 API 匯出

## Key Services

### BlueprintService

**規則**:
- 位置：`src/app/shared/services/blueprint/`
- 目的：Blueprint 業務邏輯服務
- 必須實作 Blueprint CRUD 操作
- 必須實作成員管理功能
- 必須實作模組管理功能
- 必須整合 Event Bus 發送領域事件
- 必須使用 `providedIn: 'root'` 作為單例服務

### AccountService

**規則**:
- 位置：`src/app/shared/services/account/`
- 目的：用戶帳號業務邏輯服務
- 必須實作帳號相關操作
- 必須使用 `providedIn: 'root'` 作為單例服務

### OrganizationService

**規則**:
- 位置：`src/app/shared/services/organization/`
- 目的：組織業務邏輯服務
- 必須實作組織 CRUD 操作
- 必須實作組織成員管理
- 必須使用 `providedIn: 'root'` 作為單例服務

### TeamService

**規則**:
- 位置：`src/app/shared/services/team/`
- 目的：團隊業務邏輯服務
- 必須實作團隊管理功能
- 必須使用 `providedIn: 'root'` 作為單例服務

### PermissionService

**規則**:
- 位置：`src/app/shared/services/permission/`
- 目的：權限檢查業務邏輯服務
- 必須實作權限檢查方法
- 必須實作權限快取機制
- 必須使用 `providedIn: 'root'` 作為單例服務

### ValidationService

**規則**:
- 位置：`src/app/shared/services/validation/`
- 目的：資料驗證業務邏輯服務
- 必須實作基於 Schema 的驗證
- 必須提供可重用的驗證規則
- 必須使用 `providedIn: 'root'` 作為單例服務

### AuditService

**規則**:
- 位置：`src/app/shared/services/audit/`
- 目的：稽核日誌業務邏輯服務
- 必須實作稽核日誌記錄功能
- 必須使用 `providedIn: 'root'` 作為單例服務

### WorkspaceContextService

**規則**:
- 位置：`src/app/shared/services/workspace-context.service.ts`
- 目的：工作區上下文管理服務
- 必須管理當前工作區上下文
- 必須使用 Signals 管理狀態
- 必須使用 `providedIn: 'root'` 作為單例服務

### MenuManagementService

**規則**:
- 位置：`src/app/shared/services/menu-management.service.ts`
- 目的：選單管理服務
- 必須管理應用程式選單結構
- 必須使用 `providedIn: 'root'` 作為單例服務

## Service Lifecycle

**規則**:
- 所有服務必須使用 `providedIn: 'root'` 作為單例
- 服務生命週期與應用程式相同
- 狀態在路由變更之間保持
- 不需要實作 `ngOnDestroy`

## Best Practices

**規則**:
1. 必須保持服務專注和單一職責
2. 必須使用依賴注入提高可測試性
3. 必須為公開 API 提供 JSDoc 註解
4. 必須實作適當的錯誤處理
5. 必須整合 Event Bus 發送領域事件
6. 必須使用 TypeScript 嚴格類型
7. 必須提供清晰的服務介面

## When to Use Shared Services vs Core Services

**規則**:
- **使用 Shared Services**（本目錄）當服務：
  - 包含業務邏輯
  - 與領域模型相關（Blueprint、Account、Organization）
  - 需要在多個功能模組間共享
  - 處理業務規則和驗證
- **使用 Core Services**（`core/services/`）當服務：
  - 提供技術性功能（認證、日誌）
  - 與業務邏輯無關
  - 是基礎設施層的一部分
  - 提供跨應用程式的通用功能

## Related Documentation

**規則**:
- 必須參考 Shared Module AGENTS.md 獲取共享模組總覽
- 必須參考 Core Services AGENTS.md 了解基礎設施服務（不要混淆）
- 必須參考 Blueprint Module AGENTS.md 獲取 Blueprint 特定資訊

---

**Module Version**: 1.0.0  
**Last Updated**: 2025-12-09  
**Status**: Production Ready

