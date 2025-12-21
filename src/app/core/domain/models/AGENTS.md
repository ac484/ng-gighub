# Core Domain Models Agent Guide

## Title + Scope
Scope: Domain model definitions under src/app/core/domain/models.

## Purpose / Responsibility
Ensure domain models are consistent, typed, and shared across features while avoiding business logic or UI concerns.

## Hard Rules / Constraints
- NO UI components.
- NO feature-specific logic inside models.
- NO direct Firebase access; models remain pure types/interfaces/classes.

## Allowed / Expected Content
- Domain model interfaces/types/classes used across modules.
- Serialization helpers or mappers tied to these models.
- Documentation/tests for model contracts.

## Structure / Organization
- Individual model files grouped by domain concept; barrel exports where appropriate.

## Integration / Dependencies
- Used by services, repositories, and stores; avoid circular deps and feature-specific imports.
- Keep models framework-agnostic.

## Best Practices / Guidelines
- Maintain strict typing, prefer readonly properties where possible, and include JSDoc for clarity.
- Keep models minimal and reuse shared types.

## Related Docs / References
- ../types/AGENTS.md
- ../../AGENTS.md (Core overview)
- ../../services/AGENTS.md

## Metadata
Version: 1.1.0
Status: Active
Audience: AI Coding Agents

---

# Core Models Agent Guide

The Core Models directory contains all data model definitions used across the GigHub application.

## Module Purpose

**規則**:
- 定義應用程式的核心資料結構
- 提供 TypeScript 介面和類型定義
- 確保型別安全和資料一致性
- 作為與 Firebase/Firestore 資料結構的契約
- 提供資料驗證和轉換邏輯

## Module Structure

**規則**:
- `src/app/core/models/AGENTS.md` - 本文件
- `audit-log.model.ts` - 稽核日誌資料模型
- `blueprint.model.ts` - Blueprint 主要資料模型
- `blueprint-config.model.ts` - Blueprint 配置資料模型
- `blueprint-module.model.ts` - Blueprint 模組資料模型
- `index.ts` - 公開 API 匯出

## Model Definitions

### audit-log.model.ts

**規則**:
- 定義 `AuditLogDocument` 介面（完整稽核日誌文件）
- 定義 `CreateAuditLogData` 介面（建立稽核日誌所需資料）
- 定義 `AuditLogQueryOptions` 介面（查詢選項）
- 定義 `AuditLogSummary` 介面（摘要統計）
- 定義列舉類型：`AuditEventType`、`AuditCategory`、`AuditSeverity`、`ActorType`、`AuditStatus`
- 必須包含完整的 JSDoc 註解
- 必須定義所有必填和選填欄位
- 必須與 Firestore schema 保持一致

### blueprint.model.ts

**規則**:
- 定義 `Blueprint` 介面（主要 Blueprint 資料結構）
- 定義 `CreateBlueprintRequest` 介面（建立 Blueprint 請求）
- 定義 `UpdateBlueprintRequest` 介面（更新 Blueprint 請求）
- 定義列舉類型：`BlueprintStatus`、`OwnerType`、`ContextType`
- 必須包含 `id`、`name`、`slug`、`owner_type`、`owner_id`、`status` 等欄位
- 必須包含 `enabled_modules`（啟用的模組列表）
- 必須包含 `module_settings`（模組設定）
- 必須包含時間戳記：`created_at`、`updated_at`

### blueprint-config.model.ts

**規則**:
- 定義 `BlueprintConfig` 介面（Blueprint 配置）
- 定義 `ModuleConfig` 介面（單一模組配置）
- 定義 `ConfigValidationRule` 介面（配置驗證規則）
- 必須支援動態配置欄位
- 必須包含驗證邏輯
- 必須提供預設值

### blueprint-module.model.ts

**規則**:
- 定義 `BlueprintModuleDocument` 介面（模組文件）
- 定義 `CreateModuleData` 介面（建立模組資料）
- 定義 `UpdateModuleData` 介面（更新模組資料）
- 定義 `BatchResult` 介面（批次操作結果）
- 定義列舉類型：`ModuleStatus`
- 必須包含模組元資料（名稱、版本、描述）
- 必須包含模組狀態和配置
- 必須包含依賴關係資訊

## Best Practices

**規則**:
1. 所有介面必須使用 `export` 關鍵字
2. 列舉類型必須使用 `export enum`
3. 必須使用 TypeScript 嚴格類型
4. 禁止使用 `any` 類型
5. 必須為所有公開介面提供 JSDoc 註解
6. 必須使用 `readonly` 標記不可變欄位
7. 必須使用 `?` 標記選填欄位
8. 必須使用聯合類型進行狀態管理
9. 必須與 Firestore 資料結構保持同步

## Import Conventions

**規則**:
- 從 `@core/models` 匯入：`import { Blueprint, BlueprintStatus } from '@core/models'`
- 不使用相對路徑：❌ `import { Blueprint } from '../models/blueprint.model'`
- 使用 barrel exports：所有 models 通過 `index.ts` 匯出

## Usage Examples

```typescript
// ✅ 正確用法
import { Blueprint, BlueprintStatus, CreateBlueprintRequest } from '@core/models';

const blueprint: Blueprint = {
  id: 'uuid-here',
  name: 'My Project',
  slug: 'my-project',
  owner_type: 'user',
  owner_id: 'user-id',
  status: BlueprintStatus.Active,
  enabled_modules: ['tasks', 'logs'],
  module_settings: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const request: CreateBlueprintRequest = {
  name: 'New Project',
  slug: 'new-project',
  owner_type: 'user',
  owner_id: 'user-id'
};

// ❌ 錯誤用法 - 不要使用 any
const blueprint: any = { ... };

// ❌ 錯誤用法 - 不要使用相對路徑
import { Blueprint } from './blueprint.model';
```

## Validation

**規則**:
- Models 應該是純資料結構，不包含邏輯
- 驗證邏輯應該在 Services 或 Validators 中實作
- Models 可以包含 helper 方法用於資料轉換
- Models 必須保持不可變性（使用 `readonly` 屬性）

## Related Documentation

- **[Core Services](../AGENTS.md)** - 使用這些 models 的服務
- **[Repositories](../repositories/AGENTS.md)** - 使用這些 models 進行資料存取
- **[Blueprint System](../blueprint/AGENTS.md)** - Blueprint 相關 models

---

**Module Version**: 1.1.0  
**Last Updated**: 2025-12-11  
**Status**: Active
