# Environments Agent Guide

The Environments module contains environment configuration files for different deployment environments.

## Module Purpose

The Environments module provides:
- **Environment Configuration** - Environment-specific settings
- **Build-time Configuration** - Configuration injected at build time
- **Environment Variables** - Environment variable management
- **Feature Flags** - Feature toggle configuration

## Module Structure

```
src/environments/
├── AGENTS.md                    # This file
├── environment.ts               # Development environment
└── environment.prod.ts          # Production environment
```

## Environment Files

### environment.ts (Development)

**規則**:
- 必須包含開發環境的配置
- 必須設定 `production: false`
- 必須使用本地 API 端點
- 必須啟用詳細日誌記錄
- 必須包含 Firebase 開發環境配置
- 必須啟用 Mock 資料（如適用）
- 必須包含開發工具設定

### environment.prod.ts (Production)

**規則**:
- 必須包含生產環境的配置
- 必須設定 `production: true`
- 必須使用生產 API 端點
- 必須僅記錄錯誤等級日誌
- 必須包含 Firebase 生產環境配置
- 必須停用 Mock 資料
- 必須包含生產優化設定

## Environment Interface

**規則**:
- 必須定義 `Environment` 介面（使用 @delon/theme）
- 必須包含 `production` 布林值
- 必須包含 `api` 配置物件
- 必須包含 `useHash` 路由設定
- 必須包含 `providers` 陣列
- 必須包含 `interceptorFns` 陣列

## Configuration Properties

### API Configuration

**規則**:
- `baseUrl` 必須設定 API 基礎 URL
- `refreshTokenEnabled` 必須設定是否啟用 token 刷新
- `refreshTokenType` 必須設定 token 刷新類型

### Providers

**規則**:
- 必須在開發環境中提供 Mock 配置
- 必須在生產環境中移除 Mock 配置
- 必須使用 `provideMockConfig()` 配置 Mock 資料

### Interceptors

**規則**:
- 必須在開發環境中啟用 `mockInterceptor`
- 必須在生產環境中移除 `mockInterceptor`
- 必須確保攔截器順序正確

## Best Practices

**規則**:
1. 絕對不能在環境檔案中提交敏感資訊（API keys、secrets）
2. 必須使用環境變數或構建時注入敏感資訊
3. 必須保持開發和生產環境配置一致
4. 必須使用 TypeScript 類型檢查環境配置
5. 必須在 `angular.json` 中配置檔案替換
6. 必須為每個環境提供完整的配置
7. 必須使用功能標誌控制功能開關

## Build Configuration

**規則**:
- 必須在 `angular.json` 中配置 `fileReplacements`
- 生產構建必須自動替換 `environment.ts` 為 `environment.prod.ts`
- 必須確保構建時正確注入環境配置

## Related Documentation

- **[App Module](../app/AGENTS.md)** - Application configuration
- **[Core Services](../app/core/AGENTS.md)** - Service configuration

---

**Module Version**: 1.0.0  
**Last Updated**: 2025-12-09  
**Status**: Production Ready

