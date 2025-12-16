# Core Types Agent Guide

The Core Types module defines all core TypeScript type definitions, interfaces, and enums used across the GigHub application.

## Module Purpose

The Core Types module provides:
- **Type Definitions** - Core data model interfaces
- **Enums** - Status, role, and configuration enums
- **Type Utilities** - Type helper functions and utilities
- **Type Exports** - Centralized type exports

## Module Structure

```
src/app/core/types/
├── AGENTS.md                    # This file
├── index.ts                     # Public API exports
├── account.types.ts             # Account types
├── audit/                       # Audit log types
├── blueprint/                   # Blueprint types
├── configuration/               # Configuration types
├── events/                      # Event types
├── module/                      # Module types
└── permission/                  # Permission types
```

## Type Categories

### Account Types

**規則**:
- 必須定義用戶帳號相關的介面和類型
- 必須包含用戶基本資訊類型
- 必須包含帳號狀態類型
- 必須匯出所有帳號相關類型

### Audit Types

**規則**:
- 必須定義稽核日誌相關的介面和類型
- 必須包含操作類型枚舉
- 必須包含實體類型枚舉
- 必須定義稽核日誌介面結構

### Blueprint Types

**規則**:
- 必須定義 Blueprint 相關的介面和類型
- 必須包含 Blueprint 狀態枚舉
- 必須包含擁有者類型枚舉
- 必須定義 Blueprint 介面結構
- 必須定義 Blueprint 成員介面

### Configuration Types

**規則**:
- 必須定義配置相關的介面和類型
- 必須包含模組配置類型
- 必須包含應用程式配置類型
- 必須支援配置驗證

### Event Types

**規則**:
- 必須定義事件相關的介面和類型
- 必須包含事件類型枚舉
- 必須定義事件介面結構
- 必須支援事件資料類型

### Module Types

**規則**:
- 必須定義模組相關的介面和類型
- 必須包含模組狀態枚舉
- 必須定義模組介面結構
- 必須支援模組元資料類型

### Permission Types

**規則**:
- 必須定義權限相關的介面和類型
- 必須包含權限等級枚舉
- 必須包含角色枚舉
- 必須定義權限介面結構

## Best Practices

**規則**:
1. 必須使用 `interface` 而非 `type` 定義物件類型
2. 必須使用 `enum` 定義固定值集合
3. 必須使用描述性的類型名稱
4. 必須為所有公開類型提供 JSDoc 註解
5. 必須避免使用 `any` 類型，使用 `unknown` 配合類型守衛
6. 必須使用 TypeScript 嚴格模式
7. 必須在 `index.ts` 中匯出所有公開類型

## Type Organization

**規則**:
- 相關類型必須組織在同一檔案或目錄
- 每個類型檔案必須有明確的職責
- 必須避免循環依賴
- 必須使用統一的命名規範

## Related Documentation

- **[Core Module](../AGENTS.md)** - Core infrastructure overview
- **[Blueprint Module](../../routes/blueprint/AGENTS.md)** - Blueprint implementation

---

**Module Version**: 1.0.0  
**Last Updated**: 2025-12-09  
**Status**: Production Ready

