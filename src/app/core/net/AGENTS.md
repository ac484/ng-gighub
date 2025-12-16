# Core Network Agent Guide

The Core Network module provides HTTP interceptors and network-related utilities for the GigHub application.

## Module Purpose

The Core Network module provides:
- **HTTP Interceptors** - Request/response interceptors
- **Token Refresh** - Authentication token refresh mechanism
- **Network Helpers** - Network utility functions
- **Default Interceptor** - Default HTTP interceptor configuration

## Module Structure

```
src/app/core/net/
├── AGENTS.md                    # This file
├── index.ts                     # Public API exports
├── default.interceptor.ts       # Default HTTP interceptor
├── refresh-token.ts             # Token refresh mechanism
└── helper.ts                    # Network helper functions
```

## HTTP Interceptors

### Default Interceptor

**規則**:
- 必須實作 `HttpInterceptorFn` 介面
- 必須處理請求標頭設定
- 必須處理回應轉換
- 必須實作錯誤處理
- 必須使用 `inject()` 注入依賴

### Token Refresh

**規則**:
- 必須提供 `provideBindAuthRefresh` 函數
- 必須處理 token 過期情況
- 必須自動刷新過期的 token
- 必須重試失敗的請求
- 必須避免無限刷新循環

## Network Helpers

**規則**:
- 必須提供網路請求輔助函數
- 必須處理常見的網路操作
- 必須提供錯誤處理工具
- 必須支援請求取消功能

## Best Practices

**規則**:
1. 必須在攔截器中處理認證 token
2. 必須實作 token 自動刷新機制
3. 必須處理網路錯誤和超時
4. 必須記錄網路請求日誌（開發環境）
5. 必須避免在攔截器中執行長時間操作
6. 必須使用 RxJS 運算子處理請求/回應
7. 必須提供清晰的錯誤訊息

## Integration

**規則**:
- 必須在 `app.config.ts` 中註冊攔截器
- 必須使用 `withInterceptors()` 提供攔截器
- 必須確保攔截器執行順序正確
- 必須與 Firebase Auth 整合

## Related Documentation

- **[Core Services](../AGENTS.md)** - Core infrastructure
- **[App Module](../../AGENTS.md)** - Application configuration

---

**Module Version**: 1.0.0  
**Last Updated**: 2025-12-09  
**Status**: Production Ready

