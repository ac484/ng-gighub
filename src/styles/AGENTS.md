# Styles Agent Guide

The Styles module contains global styles, theme definitions, and style utilities for the GigHub application.

## Module Purpose

The Styles module provides:
- **Global Styles** - Application-wide style definitions
- **Theme Configuration** - Azure Dragon theme variables and colors
- **Utility Classes** - Reusable CSS utility classes
- **Component Styles** - Global component style enhancements
- **Animations** - Animation definitions

## Module Structure

```
src/styles/
├── AGENTS.md                    # This file
├── index.less                   # Main stylesheet entry
└── theme.less                   # Theme variables and colors
```

## Style Files

### index.less

**規則**:
- 必須是主要的樣式表入口點
- 必須匯入主題變數檔案
- 必須包含全域元件樣式增強
- 必須包含 Azure Dragon 主題工具類
- 必須包含動畫定義
- 必須包含無障礙改進
- 必須包含全域覆蓋樣式

### theme.less

**規則**:
- 必須定義 Azure Dragon 主題顏色變數
- 必須定義漸層變數
- 必須定義間距變數
- 必須定義字體變數
- 必須定義陰影變數
- 必須與 ng-zorro-antd 主題整合

## Style Categories

### Utility Classes

**規則**:
- 必須提供背景顏色工具類（`.azure-bg-primary`、`.azure-bg-gradient` 等）
- 必須提供文字顏色工具類（`.azure-text-primary` 等）
- 必須提供間距工具類
- 必須提供佈局工具類
- 必須使用 `!important` 確保優先級（如適用）

### Component Styles

**規則**:
- 必須增強 ng-zorro-antd 元件樣式
- 必須保持與 Ant Design 設計規範一致
- 必須提供懸停狀態改進
- 必須確保響應式設計

### Animations

**規則**:
- 必須定義過渡動畫
- 必須定義載入動畫
- 必須確保動畫效能
- 必須提供動畫工具類

## Theme Integration

**規則**:
- 必須與 ng-zorro-antd 主題系統整合
- 必須使用 Less 變數系統
- 必須支援主題切換（如實作）
- 必須保持顏色一致性

## Best Practices

**規則**:
1. 必須使用 Less 變數而非硬編碼顏色值
2. 必須遵循 Azure Dragon 設計規範
3. 必須保持樣式模組化和可重用
4. 必須避免過度使用 `!important`
5. 必須確保響應式設計
6. 必須優化 CSS 效能
7. 必須遵循無障礙設計準則

## Style Organization

**規則**:
- 全域樣式必須放在 `styles/` 目錄
- 元件樣式必須放在元件目錄（元件作用域）
- 共享樣式必須放在 `shared/` 目錄
- 必須避免樣式衝突

## Related Documentation

- **[App Module](../app/AGENTS.md)** - Application structure
- **[Layout Module](../app/layout/AGENTS.md)** - Layout styles

---

**Module Version**: 1.0.0  
**Last Updated**: 2025-12-09  
**Status**: Production Ready

