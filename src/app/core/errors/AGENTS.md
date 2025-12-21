# Core Errors Agent Guide

## Title + Scope
Scope: Custom error classes and error handling conventions under src/app/core/errors.

## Purpose / Responsibility
Provide typed error hierarchy, context metadata, and severity guidance for GigHub core and feature modules.

## Hard Rules / Constraints
- NO UI components.
- NO feature-specific business logic; errors should remain generic and domain-specific only as defined.
- NO direct Firebase access; errors wrap repository/service outcomes.

## Allowed / Expected Content
- Base and specialized error classes, severity enums, and related utilities.
- Public exports and documentation for error usage.

## Structure / Organization
- blueprint-error.ts, permission-denied-error.ts, validation-error.ts, module-not-found-error.ts, index.ts
- AGENTS.md describing usage boundaries.

## Integration / Dependencies
- Errors consumed by services/repositories; avoid cross-feature coupling.
- Logging handled by core logger; do not log sensitive data in error constructors.

## Best Practices / Guidelines
- Maintain structured context data, use Result pattern for propagation, and keep errors serializable when possible.
- Use discriminated unions or enums for error codes.

## Related Docs / References
- ../AGENTS.md (Core overview)
- ../services/AGENTS.md
- ../../routes/AGENTS.md

## Metadata
Version: 1.1.0
Status: Active
Audience: AI Coding Agents

---

# Core Errors Agent Guide

The Core Errors module defines custom error classes for the GigHub application.

## Module Purpose

The Core Errors module provides:
- **Custom Error Classes** - Typed error classes for different scenarios
- **Error Hierarchy** - Base error class with specialized subclasses
- **Error Context** - Structured error information with context
- **Error Severity** - Error severity levels for handling

## Module Structure

```
src/app/core/errors/
├── AGENTS.md                    # This file
├── index.ts                     # Public API exports
├── blueprint-error.ts           # Base error class
├── permission-denied-error.ts   # Permission errors
├── validation-error.ts          # Validation errors
└── module-not-found-error.ts    # Module errors
```

## Error Classes

### BlueprintError (Base Class)

**規則**:
- 必須是所有 Blueprint 相關錯誤的基礎類別
- 必須繼承自 `Error`
- 必須包含 `severity` 屬性（ErrorSeverity 枚舉）
- 必須包含 `recoverable` 屬性（布林值）
- 必須包含 `context` 屬性（選填的 Record<string, any>）
- 必須包含 `code` 屬性（字串錯誤代碼）

### PermissionDeniedError

**規則**:
- 必須繼承自 `BlueprintError`
- 必須設定 `severity` 為 `High`
- 必須設定 `recoverable` 為 `false`
- 必須在權限檢查失敗時使用
- 必須包含相關的資源和操作資訊

### ValidationError

**規則**:
- 必須繼承自 `BlueprintError`
- 必須設定 `severity` 為 `Medium`
- 必須設定 `recoverable` 為 `true`
- 必須包含 `errors` 屬性（Record<string, string[]>）
- 必須在表單驗證失敗時使用

### ModuleNotFoundError

**規則**:
- 必須繼承自 `BlueprintError`
- 必須設定 `severity` 為 `High`
- 必須設定 `recoverable` 為 `false`
- 必須在模組不存在時使用
- 必須包含模組 ID 資訊

## Error Severity Levels

**規則**:
- `Critical`: 系統級錯誤，需立即處理
- `High`: 功能無法使用，需修復
- `Medium`: 部分功能受影響，可降級使用
- `Low`: 不影響核心功能，可忽略

## Best Practices

**規則**:
1. 必須使用適當的錯誤類別而非通用 Error
2. 必須提供清楚的錯誤訊息
3. 必須包含相關的上下文資訊
4. 必須設定正確的嚴重性等級
5. 必須標記錯誤是否可恢復
6. 必須使用錯誤代碼進行錯誤分類
7. 必須在日誌中記錄錯誤詳情

## Usage Patterns

**規則**:
- 在 Service 層拋出類型化錯誤
- 在 Repository 層將 Firestore 錯誤轉換為領域錯誤
- 在 UI 層捕獲錯誤並顯示適當的訊息
- 在 GlobalErrorHandler 中處理未捕獲的錯誤

## Related Documentation

- **[Core Services](../AGENTS.md)** - Core infrastructure
- **[Exception Module](../../routes/exception/AGENTS.md)** - Error pages

---

**Module Version**: 1.1.0  
**Last Updated**: 2025-12-09  
**Status**: Production Ready

