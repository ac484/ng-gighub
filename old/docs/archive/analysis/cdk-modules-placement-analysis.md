# Angular CDK 模組架構分析與放置建議

## 📋 執行摘要

本文檔分析 Angular CDK 核心模組在 GigHub 專案中的最佳放置位置，遵循專案的三層架構模式，確保可維護性、可重用性和擴展性。

## 🎯 目標模組

| CDK 模組 | 功能描述 | 使用場景 |
|---------|---------|---------|
| **Overlay** | 浮層管理系統 | 對話框、下拉選單、提示框、彈出層 |
| **Portal** | 動態內容渲染 | 動態元件載入、內容投影 |
| **A11y** | 可存取性工具 | 鍵盤導航、焦點管理、螢幕閱讀器支援 |
| **Scrolling** | 虛擬滾動 | 大量資料列表、無限滾動 |
| **Layout** | 響應式佈局 | 斷點偵測、媒體查詢、RWD |
| **Observers** | DOM 監聽 | 元素可見性、尺寸變化、內容變化 |

## 🏗️ 當前專案架構

### 三層架構模式
```
Foundation Layer (基礎層)
├── Account (帳戶體系)
├── Auth (認證授權)
└── Organization (組織管理)

Container Layer (容器層)
├── Blueprint (藍圖系統)
├── Permissions (權限控制)
└── Events (事件總線)

Business Layer (業務層)
├── Tasks (任務模組)
├── Logs (日誌模組)
└── Quality (品質驗收)
```

### 目錄結構
```
src/app/
├── core/              # 核心服務和基礎設施
│   ├── facades/       # Facade 模式（業務邏輯封裝）
│   ├── infra/         # 基礎設施（Repository 模式）
│   ├── net/           # 網路層（HTTP 攔截器）
│   ├── services/      # 核心服務
│   └── stores/        # 狀態管理
├── shared/            # 共享元件和服務
│   ├── components/    # 共享元件
│   ├── services/      # 共享服務
│   ├── utils/         # 工具函數
│   └── shared-imports.ts  # 標準導入配置
├── layout/            # 佈局元件
└── routes/            # 路由模組（功能模組）
```

## 🔍 分析方法論

### 1. 奧卡姆剃刀原則
- **簡單性優先**：選擇最簡單、最直接的解決方案
- **避免過度設計**：不創建不必要的抽象層
- **務實主義**：基於實際使用場景決策

### 2. 模組分類標準

#### A. 基礎設施型模組
**特徵**：
- 被多個業務模組使用
- 提供底層功能支援
- 很少需要自訂
- 與業務邏輯無關

**放置位置**：`src/app/shared/` 或整合進 `SHARED_IMPORTS`

**適用模組**：A11y, Observers

#### B. 架構支撐型模組
**特徵**：
- 影響整體應用架構
- 需要統一管理
- 可能需要全局配置
- 跨多個層級使用

**放置位置**：`src/app/core/` 或 `src/app/shared/`

**適用模組**：Overlay, Portal, Layout

#### C. 功能增強型模組
**特徵**：
- 解決特定功能問題
- 按需導入
- 使用場景明確
- 可能需要配置

**放置位置**：按需導入，不放入 `SHARED_IMPORTS`

**適用模組**：Scrolling

## 📐 詳細分析

### 1. Overlay 模組 (浮層管理)

**功能**：提供浮層定位和管理服務

**使用場景**：
- 對話框 (Modal/Dialog)
- 下拉選單 (Dropdown)
- 提示框 (Tooltip)
- 彈出選單 (Popover)
- ng-zorro-antd 的大部分組件都依賴它

**決策分析**：
- ✅ ng-zorro-antd 內建依賴，不需要顯式導入
- ✅ 如需自訂浮層，可選擇性導入
- ⚠️ 通常透過 ng-zorro 元件使用，很少直接使用

**建議放置**：
```typescript
// 方案 A：不放入 SHARED_IMPORTS（因為 ng-zorro 已包含）
// 需要時按需導入：
import { OverlayModule } from '@angular/cdk/overlay';

// 方案 B：如需自訂服務，放入 core/services/
src/app/core/services/overlay/
├── custom-overlay.service.ts
└── overlay-config.ts
```

**推薦**：**方案 A** - 按需導入，不放入共享模組

---

### 2. Portal 模組 (動態內容)

**功能**：動態內容渲染和組件投影

**使用場景**：
- 動態載入元件
- 內容投影到不同位置
- 模態對話框內容
- 動態表單元件

**決策分析**：
- ✅ ng-zorro-antd 內建使用
- ⚠️ 進階場景才需要直接使用
- ⚠️ 大部分情況透過 ng-zorro 元件間接使用

**建議放置**：
```typescript
// 方案 A：不放入 SHARED_IMPORTS
// 需要時按需導入：
import { PortalModule } from '@angular/cdk/portal';

// 方案 B：如需封裝服務，放入 core/services/
src/app/core/services/portal/
└── dynamic-component.service.ts
```

**推薦**：**方案 A** - 按需導入

---

### 3. A11y 模組 (可存取性)

**功能**：提供可存取性工具和指令

**使用場景**：
- 鍵盤導航
- 焦點管理 (FocusTrap)
- 螢幕閱讀器支援
- ARIA 屬性管理

**決策分析**：
- ✅ 所有元件都應該考慮可存取性
- ✅ 符合 Web Content Accessibility Guidelines (WCAG)
- ✅ 提升使用者體驗
- ⚠️ 但實際使用頻率可能不高

**建議放置**：
```typescript
// 方案 A：放入 OPTIONAL_CDK_MODULES（推薦）
export const OPTIONAL_CDK_MODULES = {
  a11y: A11yModule,
  // ...
};

// 方案 B：建立專用的可存取性服務
src/app/shared/services/accessibility/
├── focus-manager.service.ts
├── aria-helper.service.ts
└── keyboard-navigation.service.ts
```

**推薦**：**方案 A** - 作為可選模組提供

---

### 4. Scrolling 模組 (虛擬滾動)

**功能**：虛擬滾動和滾動策略

**使用場景**：
- 大量資料列表（>1000 筆）
- 無限滾動
- 固定尺寸列表
- 動態尺寸列表

**決策分析**：
- ⚠️ 只在特定場景需要（大量資料）
- ⚠️ ng-zorro-antd 的 nz-table 已有虛擬滾動支援
- ⚠️ 使用場景明確，不應該預設載入

**建議放置**：
```typescript
// 方案 A：按需導入（推薦）
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  imports: [ScrollingModule, SHARED_IMPORTS]
})

// 方案 B：放入 OPTIONAL_CDK_MODULES
export const OPTIONAL_CDK_MODULES = {
  scrolling: ScrollingModule,
  // ...
};
```

**推薦**：**方案 A** - 按需導入

---

### 5. Layout 模組 (響應式佈局)

**功能**：斷點偵測和媒體查詢服務

**使用場景**：
- 響應式設計判斷
- 斷點變化監聽
- 不同螢幕尺寸的佈局調整
- 行動裝置適配

**決策分析**：
- ✅ 整個應用都需要 RWD 支援
- ✅ 佈局組件高頻使用
- ✅ ng-alain 的佈局系統可能已使用
- ⚠️ 但大部分情況用 CSS 媒體查詢就足夠

**建議放置**：
```typescript
// 方案 A：建立 core 服務封裝（推薦）
src/app/core/services/layout/
├── breakpoint.service.ts     // 斷點服務
├── responsive.service.ts     // 響應式服務
└── screen-size.service.ts    // 螢幕尺寸服務

// 在服務中使用 BreakpointObserver
import { BreakpointObserver } from '@angular/cdk/layout';

@Injectable({ providedIn: 'root' })
export class BreakpointService {
  private breakpointObserver = inject(BreakpointObserver);
  // ...
}

// 方案 B：放入 SHARED_IMPORTS
// 但這會增加 bundle size
```

**推薦**：**方案 A** - 封裝為 core 服務

---

### 6. Observers 模組 (DOM 監聽)

**功能**：監聽 DOM 變化和元素狀態

**使用場景**：
- 元素可見性偵測
- 尺寸變化監聽
- 內容變化監聽
- 交互觀察器 (Intersection Observer)

**決策分析**：
- ⚠️ 使用頻率較低
- ⚠️ 特定功能才需要
- ✅ 但提供的功能很有用
- ⚠️ 不應該預設載入

**建議放置**：
```typescript
// 方案 A：按需導入（推薦）
import { ObserversModule } from '@angular/cdk/observers';

// 方案 B：封裝為共享服務
src/app/shared/services/observers/
├── intersection.service.ts    // 交互觀察
├── resize.service.ts          // 尺寸變化
└── mutation.service.ts        // DOM 變化
```

**推薦**：**方案 A** - 按需導入

## 🎯 最終建議方案

### 架構決策

基於奧卡姆剃刀原則和實際需求，建議採用**混合策略**：

```typescript
// src/app/shared/shared-cdk.module.ts (新建)

/**
 * Angular CDK 模組配置
 * 
 * 策略：
 * 1. 常用模組：整合進 SHARED_IMPORTS
 * 2. 選用模組：提供 OPTIONAL_CDK_MODULES
 * 3. 進階功能：封裝為 core 服務
 */

import { A11yModule } from '@angular/cdk/a11y';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ObserversModule } from '@angular/cdk/observers';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';

/**
 * 可選 CDK 模組
 * 按需導入以優化 bundle size
 * 
 * 使用方式：
 * ```typescript
 * import { OPTIONAL_CDK_MODULES } from '@shared';
 * 
 * @Component({
 *   imports: [
 *     SHARED_IMPORTS,
 *     OPTIONAL_CDK_MODULES.scrolling
 *   ]
 * })
 * ```
 */
export const OPTIONAL_CDK_MODULES = {
  /** 可存取性 - 鍵盤導航、焦點管理 */
  a11y: A11yModule,
  
  /** 虛擬滾動 - 大量資料列表 */
  scrolling: ScrollingModule,
  
  /** DOM 監聽 - 元素可見性、尺寸變化 */
  observers: ObserversModule,
  
  /** 浮層管理 - 自訂對話框、彈出層（通常不需要，ng-zorro 已包含）*/
  overlay: OverlayModule,
  
  /** 動態內容 - 動態元件載入（通常不需要，ng-zorro 已包含）*/
  portal: PortalModule
} as const;

/**
 * 標準 CDK 導入
 * 目前為空，因為 ng-zorro-antd 已包含必要的 CDK 模組
 * 
 * 如果未來需要全局使用特定 CDK 模組，可以加入此陣列
 */
export const SHARED_CDK_MODULES: any[] = [
  // 暫時為空
  // 如需全局啟用，在此添加
];
```

### 封裝服務

對於需要全局配置或統一管理的功能，建立專用服務：

```typescript
// src/app/core/services/layout/breakpoint.service.ts

import { Injectable, inject, signal, computed } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * 斷點服務
 * 提供響應式設計斷點偵測
 */
@Injectable({ providedIn: 'root' })
export class BreakpointService {
  private breakpointObserver = inject(BreakpointObserver);
  
  // 當前斷點狀態
  private _currentBreakpoint = signal<string>('Unknown');
  
  // 公開只讀 signal
  currentBreakpoint = this._currentBreakpoint.asReadonly();
  
  // 計算屬性
  isMobile = computed(() => {
    const bp = this._currentBreakpoint();
    return bp === 'XSmall' || bp === 'Small';
  });
  
  isTablet = computed(() => this._currentBreakpoint() === 'Medium');
  isDesktop = computed(() => {
    const bp = this._currentBreakpoint();
    return bp === 'Large' || bp === 'XLarge';
  });
  
  constructor() {
    // 監聽斷點變化
    this.breakpointObserver
      .observe([
        Breakpoints.XSmall,
        Breakpoints.Small,
        Breakpoints.Medium,
        Breakpoints.Large,
        Breakpoints.XLarge
      ])
      .pipe(takeUntilDestroyed())
      .subscribe(result => {
        if (result.breakpoints[Breakpoints.XSmall]) {
          this._currentBreakpoint.set('XSmall');
        } else if (result.breakpoints[Breakpoints.Small]) {
          this._currentBreakpoint.set('Small');
        } else if (result.breakpoints[Breakpoints.Medium]) {
          this._currentBreakpoint.set('Medium');
        } else if (result.breakpoints[Breakpoints.Large]) {
          this._currentBreakpoint.set('Large');
        } else if (result.breakpoints[Breakpoints.XLarge]) {
          this._currentBreakpoint.set('XLarge');
        }
      });
  }
}
```

### 更新 shared-imports.ts

```typescript
// src/app/shared/shared-imports.ts

// ... 現有導入 ...

// CDK 模組
export { OPTIONAL_CDK_MODULES, SHARED_CDK_MODULES } from './shared-cdk.module';

// 更新 SHARED_IMPORTS
export const SHARED_IMPORTS = [
  ...CORE_ANGULAR_MODULES,
  ...SHARED_DELON_MODULES,
  ...SHARED_ZORRO_MODULES,
  ...SHARED_CDK_MODULES  // 添加 CDK 模組（目前為空）
];
```

## 📊 決策總結表

| CDK 模組 | 放置位置 | 載入策略 | 理由 |
|---------|---------|---------|------|
| **Overlay** | `OPTIONAL_CDK_MODULES` | 按需導入 | ng-zorro 已包含，很少需要直接使用 |
| **Portal** | `OPTIONAL_CDK_MODULES` | 按需導入 | ng-zorro 已包含，進階場景才需要 |
| **A11y** | `OPTIONAL_CDK_MODULES` | 按需導入 | 重要但不是所有元件都需要 |
| **Scrolling** | `OPTIONAL_CDK_MODULES` | 按需導入 | 特定場景（大量資料）才需要 |
| **Layout** | `core/services/layout/` | 服務封裝 | 全局需要，封裝為服務更好管理 |
| **Observers** | `OPTIONAL_CDK_MODULES` | 按需導入 | 使用頻率低，特定功能才需要 |

## 🚀 實施步驟

### Phase 1: 建立 CDK 模組配置（立即執行）
1. ✅ 創建 `src/app/shared/shared-cdk.module.ts`
2. ✅ 定義 `OPTIONAL_CDK_MODULES`
3. ✅ 定義 `SHARED_CDK_MODULES`（暫時為空）
4. ✅ 更新 `src/app/shared/shared-imports.ts`

### Phase 2: 建立封裝服務（按需執行）
1. ✅ 創建 `src/app/core/services/layout/breakpoint.service.ts`
2. ⏳ 創建其他必要的封裝服務（如需要）

### Phase 3: 文檔和測試（後續執行）
1. ⏳ 更新專案文檔
2. ⏳ 提供使用範例
3. ⏳ 編寫單元測試

### Phase 4: 團隊培訓（可選）
1. ⏳ 編寫最佳實踐指引
2. ⏳ 提供程式碼範例
3. ⏳ 團隊分享會

## 📚 使用範例

### 範例 1：使用虛擬滾動

```typescript
import { Component, signal } from '@angular/core';
import { SHARED_IMPORTS, OPTIONAL_CDK_MODULES } from '@shared';

@Component({
  selector: 'app-large-list',
  standalone: true,
  imports: [
    SHARED_IMPORTS,
    OPTIONAL_CDK_MODULES.scrolling  // 按需導入虛擬滾動
  ],
  template: `
    <cdk-virtual-scroll-viewport itemSize="50" class="list-viewport">
      @for (item of items(); track item.id) {
        <div class="list-item">{{ item.name }}</div>
      }
    </cdk-virtual-scroll-viewport>
  `,
  styles: [`
    .list-viewport {
      height: 500px;
    }
    .list-item {
      height: 50px;
    }
  `]
})
export class LargeListComponent {
  items = signal(Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`
  })));
}
```

### 範例 2：使用斷點服務

```typescript
import { Component, inject } from '@angular/core';
import { BreakpointService } from '@core/services/layout/breakpoint.service';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-responsive-layout',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="layout">
      @if (breakpoint.isMobile()) {
        <app-mobile-view />
      } @else if (breakpoint.isTablet()) {
        <app-tablet-view />
      } @else {
        <app-desktop-view />
      }
      
      <p>當前斷點: {{ breakpoint.currentBreakpoint() }}</p>
    </div>
  `
})
export class ResponsiveLayoutComponent {
  breakpoint = inject(BreakpointService);
}
```

### 範例 3：使用可存取性功能

```typescript
import { Component } from '@angular/core';
import { SHARED_IMPORTS, OPTIONAL_CDK_MODULES } from '@shared';

@Component({
  selector: 'app-accessible-dialog',
  standalone: true,
  imports: [
    SHARED_IMPORTS,
    OPTIONAL_CDK_MODULES.a11y  // 按需導入可存取性
  ],
  template: `
    <div cdkTrapFocus [cdkTrapFocusAutoCapture]="true">
      <h2>對話框標題</h2>
      <input type="text" placeholder="輸入內容">
      <button>確認</button>
      <button>取消</button>
    </div>
  `
})
export class AccessibleDialogComponent {}
```

## 🔄 遷移指引

### 從舊架構遷移

如果專案中已經有使用 CDK 模組，遷移步驟如下：

```typescript
// 舊方式（直接導入）
import { OverlayModule } from '@angular/cdk/overlay';
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  imports: [OverlayModule, ScrollingModule]
})

// 新方式（使用 OPTIONAL_CDK_MODULES）
import { SHARED_IMPORTS, OPTIONAL_CDK_MODULES } from '@shared';

@Component({
  imports: [
    SHARED_IMPORTS,
    OPTIONAL_CDK_MODULES.scrolling
  ]
})
```

## 🎓 最佳實踐

### 1. 按需導入原則
- ✅ 只導入實際使用的模組
- ✅ 避免全局導入所有 CDK 模組
- ✅ 使用 `OPTIONAL_CDK_MODULES` 集中管理

### 2. 服務封裝原則
- ✅ 將常用功能封裝為服務
- ✅ 使用 Signals 管理狀態
- ✅ 提供清晰的 API

### 3. 文檔先行原則
- ✅ 為每個服務提供 JSDoc 註解
- ✅ 提供使用範例
- ✅ 說明適用場景

### 4. 效能優化原則
- ✅ 避免不必要的模組載入
- ✅ 使用 OnPush 變更檢測
- ✅ 合理使用虛擬滾動

## 📈 影響範圍分析

### Bundle Size 影響
- **Overlay**: ~15KB (但 ng-zorro 已包含)
- **Portal**: ~8KB (但 ng-zorro 已包含)
- **A11y**: ~12KB (按需載入)
- **Scrolling**: ~10KB (按需載入)
- **Layout**: ~6KB (透過服務使用，影響極小)
- **Observers**: ~8KB (按需載入)

**總結**：採用按需導入策略，不會顯著增加初始 bundle size。

### 相容性影響
- ✅ 與現有 ng-zorro-antd 完全相容
- ✅ 與 ng-alain 架構完全相容
- ✅ 不影響現有程式碼

### 開發體驗影響
- ✅ 提供統一的導入方式
- ✅ 減少重複程式碼
- ✅ 提高程式碼可維護性

## 🎉 結論

基於奧卡姆剃刀原則和專案實際需求，建議採用**按需導入 + 服務封裝**的混合策略：

1. **大部分 CDK 模組**：透過 `OPTIONAL_CDK_MODULES` 提供，按需導入
2. **Layout 模組**：封裝為 `BreakpointService`，提供更好的 API
3. **Overlay/Portal**：通常透過 ng-zorro 使用，極少需要直接導入

這個方案：
- ✅ 保持 bundle size 最小化
- ✅ 提供清晰的使用方式
- ✅ 符合專案現有架構
- ✅ 易於維護和擴展
- ✅ 不增加學習成本

---

**文檔版本**: 1.0  
**建立日期**: 2025-12-13  
**作者**: GitHub Copilot  
**狀態**: ✅ 已完成分析，待實施
