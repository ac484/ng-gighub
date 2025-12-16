# Source Directory Agent Guide

The `src/` directory is the root source directory containing all application source code, assets, styles, and configuration files.

## Directory Purpose

The `src/` directory contains:
- **Application Entry Point** - `main.ts` bootstraps the Angular application
- **Application Code** - `app/` directory with all feature modules
- **Assets** - Static assets (images, fonts, icons)
- **Environments** - Environment configuration files
- **Styles** - Global styles and theme definitions
- **Type Definitions** - Global TypeScript type definitions

## Directory Structure

```
src/
├── AGENTS.md                    # This file
├── main.ts                      # Application bootstrap entry point
├── index.html                   # HTML entry point
├── typings.d.ts                 # Global type definitions
├── style-icons.ts               # Icon definitions
├── style-icons-auto.ts          # Auto-generated icon definitions
├── styles.less                  # Main stylesheet entry
├── app/                         # Application code (AGENTS.md)
├── assets/                      # Static assets
├── environments/                # Environment configs (AGENTS.md)
└── styles/                      # Style definitions (AGENTS.md)
```

## Key Files

### main.ts

**規則**:
- 必須是應用程式的唯一入口點
- 必須使用 `bootstrapApplication()` 啟動 Angular 應用程式
- 必須匯入 `AppComponent` 和 `appConfig`
- 必須處理啟動錯誤

### index.html

**規則**:
- 必須包含 `<app-root>` 根元件
- 必須包含必要的 meta 標籤
- 必須包含 favicon 連結
- 必須包含基本的 HTML5 結構

### typings.d.ts

**規則**:
- 必須定義全域類型聲明
- 必須擴展第三方庫的類型定義
- 必須避免與應用程式類型衝突

### style-icons.ts

**規則**:
- 必須定義應用程式使用的圖示
- 必須匯出圖示陣列供 ng-alain 使用
- 必須與 `style-icons-auto.ts` 保持同步

## Best Practices

**規則**:
1. 必須保持 `main.ts` 簡潔，僅包含啟動邏輯
2. 必須將所有應用程式邏輯放在 `app/` 目錄
3. 必須將靜態資源放在 `assets/` 目錄
4. 必須使用環境配置檔案管理不同環境的設定
5. 必須將全域樣式放在 `styles/` 目錄
6. 必須使用 TypeScript 嚴格模式
7. 必須遵循 Angular 專案結構規範

## Related Documentation

- **[App Module](./app/AGENTS.md)** - Application structure
- **[Environments](./environments/AGENTS.md)** - Environment configuration
- **[Styles](./styles/AGENTS.md)** - Style definitions

---

**Version**: 1.0.0  
**Last Updated**: 2025-12-09  
**Status**: Active

