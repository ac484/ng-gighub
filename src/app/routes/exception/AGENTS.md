# Exception Module Agent Guide

The Exception module provides standardized error pages for HTTP and application errors in GigHub.

## Module Purpose

The Exception module offers:
- **403 Forbidden** - Access denied page
- **404 Not Found** - Page not found
- **500 Server Error** - Internal server error
- **Trigger Component** - Manual error testing
- **Consistent Design** - ng-zorro-antd Result component
- **User-Friendly Messages** - Clear error communication

## Module Structure

```
src/app/routes/exception/
├── AGENTS.md                    # This file
├── routes.ts                    # Module routing
├── exception.component.ts       # Reusable exception component
└── trigger.component.ts         # Error trigger for testing
```

## Exception Pages

### 403 Forbidden

**規則**:
- 用途：當用戶缺乏請求資源的權限時顯示
- 在路由守衛中使用：如果沒有權限，必須重定向到 `/exception/403`
- 必須顯示清楚的錯誤訊息
- 必須提供返回首頁和返回上一頁的按鈕

### 404 Not Found

**規則**:
- 用途：當請求的路由/資源不存在時顯示
- 在 catch-all 路由中使用：`{ path: '**', redirectTo: '/exception/404' }`
- 必須顯示清楚的錯誤訊息
- 必須提供返回首頁和返回上一頁的按鈕

### 500 Server Error

**規則**:
- 用途：當伺服器遇到錯誤時顯示
- 在錯誤攔截器中使用：如果錯誤狀態碼 >= 500，必須導航到 `/exception/500`
- 必須顯示清楚的錯誤訊息
- 必須提供返回首頁和返回上一頁的按鈕

## Exception Component

**規則**:
- 必須使用 `input()` 接收 `type` 參數（'403' | '404' | '500'）
- 必須使用 `computed()` 計算配置（標題、描述、圖示）
- 必須使用 ng-zorro-antd 的 `nz-result` 元件
- 必須提供 `goHome()` 方法導航到首頁
- 必須提供 `goBack()` 方法返回上一頁
- 必須根據錯誤類型顯示適當的狀態和訊息

## Trigger Component

**規則**:
- 用途：手動觸發錯誤以測試錯誤處理（僅開發環境）
- 必須提供導航到異常頁面的按鈕（403、404、500）
- 必須提供觸發 HTTP 錯誤的按鈕（404、500）
- 必須提供觸發執行時錯誤的按鈕
- 必須提供觸發非同步錯誤的按鈕

## Global Error Handler

**規則**:
- 必須實作 `ErrorHandler` 介面
- 必須在 `app.config.ts` 中註冊為 `ErrorHandler` 提供者
- 必須處理 HTTP 錯誤、Firebase 錯誤和一般錯誤
- 必須根據錯誤類型導航到適當的異常頁面
- 必須記錄所有錯誤到 `LoggerService`
- 必須顯示用戶友善的錯誤訊息

## HTTP Error Interceptor

**規則**:
- 必須使用 `HttpInterceptorFn` 實作
- 必須在 `app.config.ts` 中註冊為 HTTP 攔截器
- 必須處理 401（未授權）、403（禁止）、404（未找到）、500+（伺服器錯誤）狀態碼
- 401 錯誤必須重定向到登入頁面
- 403 錯誤必須導航到 `/exception/403`
- 500+ 錯誤必須導航到 `/exception/500`
- 必須顯示適當的錯誤訊息
- 必須使用 `throwError()` 重新拋出錯誤

## Custom Error Classes

**規則**:
- 必須定義 `ErrorSeverity` 枚舉（Low、Medium、High、Critical）
- 必須建立 `AppError` 基礎錯誤類別
- 必須建立 `PermissionDeniedError` 錯誤類別
- 必須建立 `ResourceNotFoundError` 錯誤類別
- 必須建立 `ValidationError` 錯誤類別
- 所有錯誤類別必須包含 `code`、`severity`、`recoverable` 和 `context` 屬性

## Error Boundary Component

**規則**:
- 必須使用 `signal()` 管理錯誤狀態
- 必須提供 `catchError()` 方法捕獲錯誤
- 必須根據錯誤類型顯示適當的結果頁面
- 如果錯誤可恢復，必須提供重試按鈕
- 必須提供重置錯誤狀態的方法
- 必須使用 `<ng-content />` 顯示子元件內容

## Best Practices

### Error Handling Strategy

**規則**:
1. 客戶端驗證：在 API 呼叫前捕獲錯誤
2. HTTP 攔截器：全域處理 HTTP 錯誤
3. 全域錯誤處理器：捕獲未處理的錯誤
4. 錯誤邊界：元件層級的錯誤包含

### User Communication

**規則**:
1. 必須提供清楚的訊息說明問題
2. 必須提供可操作的回饋和下一步
3. 必須使用一致的設計（ng-zorro Result 元件）
4. 必須提供有用的連結（支援或文件）

### Error Logging

**規則**:
1. 必須記錄所有錯誤到 `LoggerService`
2. 必須包含相關的上下文資訊
3. 必須設定錯誤嚴重性等級
4. 必須在生產環境中將錯誤發送到後端進行分析

### Development vs Production

**規則**:
1. 開發環境：必須顯示詳細的錯誤訊息
2. 生產環境：必須顯示用戶友善的訊息
3. 堆疊追蹤：僅在開發環境中顯示
4. 錯誤報告：在生產環境中必須發送到監控服務

## Testing

**規則**:
- 必須為 `ExceptionComponent` 編寫單元測試
- 必須測試 404 頁面顯示
- 必須測試錯誤處理器行為
- 必須測試 HTTP 攔截器
- 必須編寫 E2E 測試驗證錯誤頁面顯示

## Troubleshooting

**規則**:
- 如果錯誤未被全域處理器捕獲，必須確保 `GlobalErrorHandler` 在 `app.config.ts` 中註冊
- 如果 HTTP 錯誤未觸發攔截器，必須驗證 `errorInterceptor` 已註冊到 `provideHttpClient`
- 如果錯誤頁面未顯示，必須檢查異常路由是否正確註冊
- 如果出現無限錯誤循環，必須確保錯誤處理器不會拋出新錯誤

## Related Documentation

- **[App Module](../../AGENTS.md)** - Application configuration
- **[Core Services](../../core/AGENTS.md)** - Error services
- **[Routes](../AGENTS.md)** - Routing configuration

---

**Module Version**: 1.0.0  
**Last Updated**: 2025-12-09  
**Status**: Production Ready
