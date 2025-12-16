# Blueprint Core Module Agent Guide

The Blueprint Core module provides core infrastructure and services for Blueprint functionality at the application core level.

## Module Purpose

The Blueprint Core module provides:
- **Blueprint Configuration** - Module configuration and settings
- **Blueprint Container** - Container management services
- **Blueprint Context** - Context management for Blueprint operations
- **Blueprint Events** - Event definitions and handling
- **Blueprint Modules** - Module registry and management

## Module Structure

```
src/app/core/blueprint/
├── AGENTS.md                    # This file
├── index.ts                     # Public API exports
├── config/                      # Configuration
├── container/                   # Container services
│   ├── blueprint-container.ts   # Main container
│   ├── lifecycle-manager.ts     # Lifecycle management
│   ├── module-registry.ts       # Module registration
│   └── resource-provider.ts     # Resource injection
├── context/                     # Context services
├── events/                      # Event definitions
│   ├── event-bus.ts            # Event bus implementation
│   ├── event-types.ts          # Event type definitions
│   └── index.ts
├── modules/                     # Module system
│   ├── module.interface.ts     # Module interface definition
│   ├── module-status.enum.ts   # Module status enum
│   ├── implementations/        # Concrete module implementations
│   │   ├── logs/              # Logs module
│   │   │   ├── logs.module.ts
│   │   │   ├── logs.service.ts
│   │   │   ├── logs.repository.ts
│   │   │   └── module.metadata.ts
│   │   └── tasks/             # Tasks module
│   │       ├── tasks.module.ts
│   │       ├── tasks.service.ts
│   │       ├── tasks.repository.ts
│   │       └── module.metadata.ts
│   └── index.ts
├── repositories/               # Blueprint-specific data access
│   ├── blueprint.repository.ts
│   ├── blueprint-member.repository.ts
│   ├── blueprint-module.repository.ts
│   ├── audit-log.repository.ts
│   └── index.ts
└── services/                   # Blueprint services
    ├── blueprint.service.ts
    ├── validation.service.ts
    ├── dependency-validator.service.ts
    └── index.ts
```

## Key Components

### Configuration

**規則**:
- 必須定義 Blueprint 模組的配置選項
- 必須提供預設配置值
- 必須支援配置驗證
- 必須匯出配置介面供其他模組使用

### Container

**規則**:
- 必須提供 Blueprint 容器管理服務
- 必須處理容器的生命週期
- 必須管理容器的狀態
- 必須提供容器操作的方法

### Context

**規則**:
- 必須提供 Blueprint 上下文管理服務
- 必須追蹤當前活動的 Blueprint
- 必須提供上下文切換功能
- 必須確保上下文的一致性

### Events

**規則**:
- 必須定義所有 Blueprint 相關事件類型
- 必須提供事件介面定義
- 必須確保事件命名一致性
- 必須支援事件訂閱和發送

### Modules

**規則**:
- 必須維護 Blueprint 模組註冊表
- 必須定義模組元資料
- 必須提供模組查詢功能
- 必須支援模組啟用/停用狀態管理
- 模組實作必須放在 `modules/implementations/` 目錄
- 每個模組必須包含：module.ts、service.ts、repository.ts、module.metadata.ts
- 模組必須實作 `IBlueprintModule` 介面

### Repositories

**規則**:
- Blueprint 專屬的 repositories 必須放在 `repositories/` 目錄
- 必須使用 `@angular/fire/firestore` 進行資料存取
- 必須實作 CRUD 操作
- 必須處理錯誤和驗證
- 必須使用 `@core/models` 定義資料模型
- 包含：blueprint.repository、blueprint-member.repository、blueprint-module.repository、audit-log.repository

### Services

**規則**:
- Blueprint 服務必須放在 `services/` 目錄
- 必須提供業務邏輯層
- 必須使用 repositories 進行資料存取
- 必須使用 Signals 管理狀態
- 必須使用 `inject()` 進行依賴注入
- 包含：blueprint.service、validation.service、dependency-validator.service

## Best Practices

**規則**:
1. 必須使用 `inject()` 進行依賴注入
2. 必須使用 Signals 管理狀態
3. 必須實作錯誤處理
4. 必須提供清晰的 API 介面
5. 必須遵循單一職責原則
6. 必須使用 TypeScript 嚴格類型
7. 必須提供 JSDoc 註解

## Related Documentation

- **[Core Services](../AGENTS.md)** - Core infrastructure
- **[Blueprint Module](../../routes/blueprint/AGENTS.md)** - Blueprint feature module

---

**Module Version**: 1.0.0  
**Last Updated**: 2025-12-09  
**Status**: Active Development

