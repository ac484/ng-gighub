# Layout Module Agent Guide

The Layout module provides different layout templates for various application contexts in GigHub.

## Module Purpose

The Layout module offers:
- **Basic Layout** - Main authenticated user interface with sidebar and header
- **Blank Layout** - Minimal layout for focused tasks
- **Passport Layout** - Authentication and onboarding flows
- **Responsive Design** - Mobile-first responsive layouts
- **Layout Switching** - Context-based layout selection via routing

## Module Structure

```
src/app/layout/
├── AGENTS.md                          # This file
├── index.ts                           # Public exports
├── basic/                             # Main app layout
│   ├── basic.component.ts             # Layout container
│   ├── basic.component.html           # Layout template
│   ├── basic.component.scss           # Layout styles
│   └── widgets/                       # Layout widgets
│       ├── header/                    # Top header bar
│       ├── sidebar/                   # Left sidebar menu
│       ├── user/                      # User dropdown
│       └── notification/              # Notification center
├── blank/                             # Minimal layout
│   ├── blank.component.ts             # Simple container
│   └── blank.component.html           # Minimal template
└── passport/                          # Auth layout
    ├── passport.component.ts          # Auth container
    ├── passport.component.html        # Auth template
    └── passport.component.scss        # Auth styles
```

## Layout Types

### Basic Layout (LayoutBasicComponent)

**規則**:
- 用途：已認證用戶的主要應用程式佈局
- 必須包含頂部標題列（標誌、麵包屑、用戶選單、通知）
- 必須包含左側邊欄（可折疊的導航選單，帶圖示）
- 必須包含主要內容區域（功能模組的路由出口）
- 可以包含頁尾（版權和連結）
- 必須支援響應式設計（在行動裝置上折疊邊欄）
- 必須使用 `signal()` 管理邊欄折疊狀態
- 必須使用 ng-zorro-antd 的 `nz-layout`、`nz-sider`、`nz-header`、`nz-content` 元件

### Blank Layout (LayoutBlankComponent)

**規則**:
- 用途：全螢幕或專注任務的最小佈局
- 不能包含標題/邊欄（僅內容區域）
- 必須是簡單的容器（最小樣式）
- 必須支援全螢幕功能（無干擾）
- 必須僅包含 `<router-outlet />`

### Passport Layout (LayoutPassportComponent)

**規則**:
- 用途：認證和入門流程佈局
- 必須居中顯示內容（專注於認證表單）
- 必須包含品牌圖像（標誌和行銷內容）
- 必須優化表單輸入（針對表單輸入優化）
- 不能包含導航（乾淨、無干擾）
- 必須使用響應式網格佈局（桌面：左右分欄，行動：上下堆疊）

## Layout Widgets

### Header Component

**規則**:
- 必須包含標誌/品牌（可點擊的標誌導航到首頁）
- 必須包含動態麵包屑（導航路徑）
- 可以包含搜尋功能（全域搜尋）
- 必須包含通知（帶徽章的鈴鐺圖示）
- 必須包含用戶選單（帶下拉選單的頭像：個人資料、設定、登出）
- 可以包含主題切換（深色/淺色模式）
- 必須使用 `output()` 發出 `toggleSidebar` 和 `logout` 事件
- 必須使用 `signal()` 管理麵包屑、通知計數、用戶頭像狀態

### Sidebar Component

**規則**:
- 必須包含選單項目（圖示 + 標籤導航）
- 必須支援子選單（可展開的巢狀選單）
- 必須顯示活動指示器（突出顯示當前路由）
- 必須支援折疊（折疊時僅顯示圖示）
- 必須基於權限顯示（隱藏用戶無法存取的項目）
- 必須使用 `input()` 接收 `collapsed` 狀態
- 必須使用 `computed()` 過濾基於權限的選單項目

### Notification Component

**規則**:
- 必須顯示徽章計數（顯示未讀計數）
- 必須顯示通知列表（最近的通知）
- 必須支援標記為已讀（個別或批量操作）
- 必須支援篩選（依類型或日期）
- 必須支援即時更新（Firestore 訂閱）
- 必須使用 `signal()` 管理通知列表狀態

## Responsive Design

### Breakpoints

**規則**:
- 必須使用行動優先設計方法
- 斷點定義：XS (0px)、SM (576px)、MD (768px)、LG (992px)、XL (1200px)、XXL (1600px)

### Mobile Behavior

**規則**:
- 邊欄：桌面 (≥992px) 持久邊欄可折疊，平板 (768px-991px) 可折疊邊欄覆蓋，行動 (<768px) 預設隱藏抽屜覆蓋
- 標題：桌面完整麵包屑所有圖示可見，平板縮短麵包屑基本圖示，行動漢堡選單僅用戶頭像
- 內容：所有尺寸流體寬度帶最大約束，行動裝置增加填充更大的點擊目標

### Implementation

**規則**:
- 必須使用 `BreakpointObserver` 觀察斷點
- 必須使用 `signal()` 管理 `isMobile` 和 `isTablet` 狀態
- 必須使用 `computed()` 計算邊欄模式（行動裝置為 'over'，桌面為 'side'）
- 必須使用 `takeUntilDestroyed()` 管理訂閱

## Layout Switching

**規則**:
- 必須基於路由選擇佈局
- 基本佈局用於已認證路由（使用 `authGuard`）
- 護照佈局用於認證路由（不需要守衛）
- 空白佈局用於特殊路由（預覽等）
- 必須在 `routes.ts` 中配置佈局元件

## Theme Support

**規則**:
- 必須使用 ng-zorro-antd 主題設定
- 必須在 `app.config.ts` 中使用 `provideNzConfig` 設定主題顏色
- 可以支援深色模式（可選）
- 如果實作深色模式，必須使用 `ThemeService` 管理主題狀態
- 必須使用 CSS 變數或 SCSS 變數管理主題顏色

## Best Practices

### Layout Components

**規則**:
1. 必須保持佈局簡單（專注於結構，而非業務邏輯）
2. 必須使用 signals 管理 UI 狀態（折疊、主題）
3. 必須提取小工具（可重用的標題、邊欄、頁尾元件）
4. 必須優先考慮響應式設計（行動優先方法）

### Performance

**規則**:
1. 必須延遲載入佈局元件（按需載入）
2. 所有佈局元件必須使用 OnPush 變更檢測
3. 必須最小化重新渲染（使用 signals 進行細粒度更新）
4. 對於長通知列表必須使用虛擬滾動

### Accessibility

**規則**:
1. 必須使用語義化 HTML（使用適當的 HTML5 元素）
2. 必須提供 ARIA 標籤（僅圖示按鈕）
3. 必須支援鍵盤導航（完整的鍵盤支援）
4. 必須管理焦點（在模態/抽屜中捕獲焦點）
5. 必須使用螢幕閱讀器進行測試

### State Management

**規則**:
1. 佈局狀態（邊欄折疊、主題）必須使用 signals
2. 用戶狀態必須來自 FirebaseAuth
3. 通知必須使用即時 Firestore 訂閱
4. 偏好設定必須持久化到 localStorage 或 Firestore

## Testing

**規則**:
- 必須為 `LayoutBasicComponent` 編寫單元測試
- 必須測試邊欄切換功能
- 必須測試響應式行為
- 必須編寫 E2E 測試驗證導航功能

## Troubleshooting

**規則**:
- 如果邊欄在行動裝置上未折疊，必須檢查 `BreakpointObserver` 是否正確設定 `isMobile` signal
- 如果用戶選單未顯示，必須驗證 Firebase Auth 已初始化且用戶已登入
- 如果通知未更新，必須檢查 `ngOnInit` 中的 Firestore 訂閱是否使用 `takeUntilDestroyed()`
- 如果路由變更時佈局閃爍，必須使用 `@defer` 延遲載入元件

## Related Documentation

- **[App Module](../AGENTS.md)** - Application bootstrap
- **[Routes](../routes/AGENTS.md)** - Feature modules
- **[Core Services](../core/AGENTS.md)** - Authentication
- **[Shared Components](../shared/AGENTS.md)** - Reusable UI

---

**Module Version**: 1.0.0  
**Last Updated**: 2025-12-09  
**Status**: Production Ready
