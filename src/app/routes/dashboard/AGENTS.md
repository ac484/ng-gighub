# Dashboard Module Agent Guide

The Dashboard module provides overview and analytics views for GigHub users.

## Module Purpose

The Dashboard module offers:
- **Workplace Dashboard** - Main entry point with key metrics and quick actions
- **Analysis Dashboard** - Data visualization and reporting
- **Monitor Dashboard** - Real-time system monitoring
- **Customizable Widgets** - User-configurable dashboard cards
- **Context-Aware Data** - Adapts to current user/organization/blueprint context

## Module Structure

```
src/app/routes/dashboard/
├── AGENTS.md                           # This file
├── routes.ts                           # Module routing
├── context-dashboard.component.ts      # Context switcher component
├── workplace/                          # Main workplace dashboard
│   ├── workplace.component.ts          # Dashboard container
│   ├── workplace.component.html        # Dashboard template
│   └── workplace.component.scss        # Dashboard styles
├── analysis/                           # Analysis & reporting
│   ├── analysis.component.ts           # Analytics view
│   └── charts/                         # Chart components
│       ├── task-chart.component.ts
│       ├── progress-chart.component.ts
│       └── quality-chart.component.ts
├── monitor/                            # System monitoring
│   ├── monitor.component.ts            # Monitor view
│   └── widgets/                        # Monitor widgets
│       ├── cpu-usage.component.ts
│       ├── memory-usage.component.ts
│       └── api-health.component.ts
└── v1/                                 # Legacy dashboard (if exists)
    └── ...
```

## Dashboard Types

### Workplace Dashboard (Default)

**規則**:
- 用途：主要入口儀表板，顯示可操作的見解
- 必須顯示快速統計卡片（關鍵指標）
- 必須顯示最近活動（跨藍圖的最新操作）
- 必須顯示活躍任務（用戶分配的任務）
- 必須顯示藍圖列表（快速存取活躍專案）
- 必須提供快捷方式（常用操作）
- 必須提供日曆小工具（即將到來的事件和截止日期）
- 必須使用 `signal()` 管理狀態
- 必須使用 `computed()` 計算衍生指標
- 必須使用 ST 表格顯示藍圖列表

### Analysis Dashboard

**規則**:
- 用途：資料視覺化和報告以獲得見解
- 必須提供時間序列圖表（任務完成隨時間變化）
- 必須提供進度圖表（藍圖進度視覺化）
- 必須提供品質趨勢（問題追蹤和趨勢）
- 必須提供資源利用率（團隊成員工作量）
- 必須支援匯出報告功能（PDF/Excel）
- 必須提供日期範圍選擇器
- 必須使用 ECharts 進行圖表視覺化

### Monitor Dashboard

**規則**:
- 用途：即時系統健康監控
- 必須顯示系統健康狀態（API 正常運行時間和回應時間）
- 必須顯示資料庫效能（Firestore 查詢指標）
- 必須顯示用戶活動（活躍用戶和工作階段）
- 必須顯示錯誤追蹤（最近的錯誤和警告）
- 必須支援自動刷新（每 30 秒更新）
- 必須提供手動刷新按鈕

## Context Switching

**規則**:
- 必須支援在用戶/組織/藍圖上下文之間切換
- 必須使用 `signal()` 管理當前活動上下文
- 必須根據上下文載入相應的儀表板資料
- 必須保存用戶偏好設定

## Routing Configuration

**規則**:
- 根路徑 `/` 必須重定向到 `workplace`
- `/workplace` 路由必須顯示工作場所儀表板
- `/analysis` 路由必須顯示分析儀表板
- `/monitor` 路由必須使用 `adminGuard` 保護（僅管理員）
- 所有路由必須設定 `title` 資料屬性

## Best Practices

### Performance

**規則**:
1. 必須使用 `computed()` 計算衍生指標
2. 對於大型列表必須實作虛擬滾動
3. 必須在視窗可見時延遲載入圖表
4. 必須使用 TTL 快取 API 回應

### User Experience

**規則**:
1. 必須在資料載入期間顯示載入狀態
2. 必須提供空狀態和有用的操作
3. 必須使用樂觀 UI 更新
4. 必須提供用戶控制的自動刷新

### Data Visualization

**規則**:
1. 必須選擇適當的圖表類型
2. 必須使用一致的配色方案
3. 必須提供互動式工具提示
4. 必須支援匯出為 PDF/Excel

### Accessibility

**規則**:
1. 必須為圖表提供文字替代方案
2. 必須使用語義化 HTML
3. 必須支援鍵盤導航
4. 必須使用螢幕閱讀器進行測試

## Testing

**規則**:
- 必須為 `WorkplaceComponent` 編寫單元測試
- 必須測試指標計算是否正確
- 必須測試圖表資料載入
- 必須編寫 E2E 測試驗證儀表板功能

## Related Documentation

- **[App Module](../../AGENTS.md)** - Application structure
- **[Routes](../AGENTS.md)** - Routing overview
- **[Blueprint Module](../blueprint/AGENTS.md)** - Blueprint integration

---

**Module Version**: 1.0.0  
**Last Updated**: 2025-12-09  
**Status**: Active Development
