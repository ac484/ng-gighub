# Angular CDK 模組架構說明

## 📋 概述

本文檔說明 Angular CDK (Component Dev Kit) 模組在 GigHub 專案中的架構設計和使用方式。

## 🎯 快速開始

### 方式 1: 使用可選 CDK 模組

```typescript
import { SHARED_IMPORTS, OPTIONAL_CDK_MODULES } from '@shared';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [
    SHARED_IMPORTS,
    OPTIONAL_CDK_MODULES.scrolling,  // 虛擬滾動
    OPTIONAL_CDK_MODULES.a11y        // 可存取性
  ]
})
export class ExampleComponent {}
```

### 方式 2: 使用斷點服務

```typescript
import { BreakpointService } from '@core/services/layout/breakpoint.service';

@Component({
  template: `
    @if (breakpoint.isMobile()) {
      <app-mobile-view />
    } @else {
      <app-desktop-view />
    }
  `
})
export class ResponsiveComponent {
  breakpoint = inject(BreakpointService);
}
```

## 📚 文檔結構

```
docs/
├── architecture/
│   └── cdk-modules-placement-analysis.md    # 完整架構分析文檔
└── examples/
    └── cdk-usage-examples.md                # 使用範例文檔
```

## 🗂️ 檔案位置

### 核心檔案

| 檔案路徑 | 說明 |
|---------|------|
| `src/app/shared/shared-cdk.module.ts` | CDK 模組配置（可選模組定義） |
| `src/app/shared/shared-imports.ts` | 更新後的共享導入配置 |
| `src/app/core/services/layout/breakpoint.service.ts` | 斷點服務（響應式設計） |
| `src/app/core/services/layout/index.ts` | Layout 服務匯出 |

### 文檔檔案

| 檔案路徑 | 說明 |
|---------|------|
| `docs/architecture/cdk-modules-placement-analysis.md` | CDK 模組架構分析（完整） |
| `docs/examples/cdk-usage-examples.md` | 使用範例文檔 |
| `docs/architecture/CDK_MODULES_README.md` | 本文檔（快速參考） |

## 🔍 CDK 模組分類

### 1. 可選模組 (OPTIONAL_CDK_MODULES)

按需導入，不會增加初始 bundle size：

| 模組 | 用途 | 使用時機 |
|------|------|---------|
| `scrolling` | 虛擬滾動 | 資料量 > 1000 筆的列表 |
| `a11y` | 可存取性 | 需要焦點管理、鍵盤導航 |
| `observers` | DOM 監聽 | 需要監聽元素可見性、尺寸變化 |
| `overlay` | 浮層管理 | 自訂對話框（通常不需要，ng-zorro 已包含） |
| `portal` | 動態內容 | 動態元件載入（通常不需要，ng-zorro 已包含） |

### 2. 封裝服務

提供更高層次的 API：

| 服務 | 位置 | 用途 |
|------|------|------|
| `BreakpointService` | `@core/services/layout` | 響應式斷點偵測 |

## 🎨 設計原則

### 奧卡姆剃刀原則
- ✅ 簡單性優先：選擇最簡單的解決方案
- ✅ 避免過度設計：不創建不必要的抽象
- ✅ 務實主義：基於實際使用場景決策

### 按需導入策略
- ✅ 預設不載入：SHARED_CDK_MODULES 為空
- ✅ 需要時才導入：使用 OPTIONAL_CDK_MODULES
- ✅ 服務封裝：常用功能封裝為服務

### 與 ng-zorro 整合
- ✅ ng-zorro-antd 已包含 Overlay 和 Portal
- ✅ 避免重複導入相同功能
- ✅ 優先使用 ng-zorro 的高層組件

## 📊 決策總結

| CDK 模組 | 放置位置 | 載入策略 | 理由 |
|---------|---------|---------|------|
| Overlay | `OPTIONAL_CDK_MODULES` | 按需導入 | ng-zorro 已包含 |
| Portal | `OPTIONAL_CDK_MODULES` | 按需導入 | ng-zorro 已包含 |
| A11y | `OPTIONAL_CDK_MODULES` | 按需導入 | 不是所有元件都需要 |
| Scrolling | `OPTIONAL_CDK_MODULES` | 按需導入 | 特定場景才需要 |
| Layout | `core/services/layout/` | 服務封裝 | 全局需要，封裝為服務 |
| Observers | `OPTIONAL_CDK_MODULES` | 按需導入 | 使用頻率低 |

## 🚀 常見使用場景

### 場景 1: 大量資料列表

```typescript
import { OPTIONAL_CDK_MODULES } from '@shared';

@Component({
  imports: [SHARED_IMPORTS, OPTIONAL_CDK_MODULES.scrolling],
  template: `
    <cdk-virtual-scroll-viewport itemSize="50">
      @for (item of items(); track item.id) {
        <div>{{ item.name }}</div>
      }
    </cdk-virtual-scroll-viewport>
  `
})
```

### 場景 2: 響應式佈局

```typescript
import { BreakpointService } from '@core/services/layout';

@Component({
  template: `
    @if (breakpoint.isMobile()) {
      <app-mobile-layout />
    } @else {
      <app-desktop-layout />
    }
  `
})
export class LayoutComponent {
  breakpoint = inject(BreakpointService);
}
```

### 場景 3: 模態對話框焦點管理

```typescript
import { OPTIONAL_CDK_MODULES } from '@shared';

@Component({
  imports: [SHARED_IMPORTS, OPTIONAL_CDK_MODULES.a11y],
  template: `
    <div cdkTrapFocus [cdkTrapFocusAutoCapture]="true">
      <!-- 對話框內容 -->
    </div>
  `
})
```

## 📈 效能影響

### Bundle Size 影響
- **採用按需導入策略**：不會顯著增加初始 bundle size
- **ng-zorro 已包含**：Overlay (~15KB) 和 Portal (~8KB) 已在 ng-zorro 中
- **實際增加**：只有實際使用的模組才會被打包

### 最佳實踐
- ✅ 只導入需要的模組
- ✅ 大量資料（>1000 筆）使用虛擬滾動
- ✅ 使用 OnPush 變更檢測
- ❌ 不要全局導入所有模組

## 🔗 相關連結

### 內部文檔
- [完整架構分析](./cdk-modules-placement-analysis.md) - 詳細的設計決策和理由
- [使用範例](../examples/cdk-usage-examples.md) - 實際程式碼範例

### 外部資源
- [Angular CDK 官方文檔](https://material.angular.io/cdk/categories)
- [Angular CDK GitHub](https://github.com/angular/components/tree/main/src/cdk)

## ❓ 常見問題

### Q: 為什麼 SHARED_CDK_MODULES 是空的？
A: 因為 ng-zorro-antd 已經包含了大部分必要的 CDK 功能。按需導入可以保持 bundle size 最小化。

### Q: 什麼時候應該使用虛擬滾動？
A: 當資料量超過 1000 筆時。小於這個數量，虛擬滾動反而會降低效能。

### Q: 如何選擇使用 CDK 還是 ng-zorro 元件？
A: 優先使用 ng-zorro 的高層組件。只有在需要更細粒度控制時才直接使用 CDK。

### Q: BreakpointService 和 CSS 媒體查詢有什麼區別？
A: BreakpointService 提供程式化的斷點偵測，適合需要根據斷點執行邏輯的場景。簡單的樣式調整使用 CSS 媒體查詢即可。

## 📝 維護記錄

| 日期 | 版本 | 變更說明 |
|------|------|---------|
| 2025-12-13 | 1.0 | 初始版本，建立 CDK 模組架構 |

## 👥 貢獻者

- GitHub Copilot - 架構設計與實施
- GigHub 開發團隊 - 需求分析與驗證

---

**最後更新**: 2025-12-13  
**文檔狀態**: ✅ 已完成  
**維護者**: GigHub 開發團隊
