# Angular CDK 模組

此目錄包含 Angular CDK（Component Dev Kit）模組的配置和匯出。

## 模組說明

| CDK 模組      | 解決什麼             | 使用場景                           |
| ----------- | ---------------- | ------------------------------ |
| Overlay     | 所有浮層             | Modal、Dropdown、Tooltip、Popover  |
| Portal      | 動態內容             | 動態渲染元件到 DOM 任意位置              |
| A11y        | 可存取性             | 焦點管理、鍵盤導航、ARIA 屬性（已包含在 SHARED_IMPORTS） |
| Scrolling   | 大量資料效能           | 虛擬滾動、無限滾動                      |
| Layout      | RWD / Breakpoint | 響應式佈局、斷點檢測                     |
| Observers   | DOM / Resize 感知  | ResizeObserver、IntersectionObserver（已包含在 SHARED_IMPORTS） |
| DragDrop    | 拖放功能             | 拖放排序、列表重排                      |
| Tree        | 樹狀結構             | 樹狀列表、階層資料展示                    |
| Platform    | 平台檢測             | 瀏覽器、行動裝置檢測（已包含在 SHARED_IMPORTS） |

## 使用方式

### 基本使用（已包含在 SHARED_IMPORTS）

以下模組已自動包含在 `SHARED_IMPORTS` 中，無需額外導入：

- `A11yModule` - 可存取性功能
- `ObserversModule` - DOM 觀察器
- `PlatformModule` - 平台檢測

```typescript
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [SHARED_IMPORTS] // 已包含 A11y、Observers、Platform
})
export class ExampleComponent {}
```

### 按需導入可選模組

對於特定功能，需要額外導入對應的 CDK 模組：

```typescript
import { SHARED_IMPORTS, OPTIONAL_CDK_MODULES } from '@shared';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [
    SHARED_IMPORTS,
    OPTIONAL_CDK_MODULES.overlay,   // 使用浮層功能
    OPTIONAL_CDK_MODULES.scrolling, // 使用虛擬滾動
    OPTIONAL_CDK_MODULES.layout     // 使用響應式佈局
  ]
})
export class ExampleComponent {}
```

## 各模組使用範例

### Overlay - 浮層

```typescript
import { OverlayModule } from '@angular/cdk/overlay';
import { Component, inject } from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';

@Component({
  selector: 'app-tooltip',
  standalone: true,
  imports: [SHARED_IMPORTS, OPTIONAL_CDK_MODULES.overlay]
})
export class TooltipComponent {
  private overlay = inject(Overlay);

  showTooltip() {
    const overlayRef = this.overlay.create({
      positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
      hasBackdrop: true
    });
  }
}
```

### Portal - 動態內容

```typescript
import { PortalModule } from '@angular/cdk/portal';
import { Component, ViewChild, TemplateRef } from '@angular/core';
import { CdkPortal } from '@angular/cdk/portal';

@Component({
  selector: 'app-dynamic',
  standalone: true,
  imports: [SHARED_IMPORTS, OPTIONAL_CDK_MODULES.portal],
  template: `
    <ng-template cdkPortal>
      <div>動態內容</div>
    </ng-template>
  `
})
export class DynamicComponent {
  @ViewChild(CdkPortal) portal!: CdkPortal;
}
```

### Scrolling - 虛擬滾動

```typescript
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-virtual-scroll',
  standalone: true,
  imports: [SHARED_IMPORTS, OPTIONAL_CDK_MODULES.scrolling],
  template: `
    <cdk-virtual-scroll-viewport itemSize="50" class="viewport">
      <div *cdkVirtualFor="let item of items">{{ item }}</div>
    </cdk-virtual-scroll-viewport>
  `
})
export class VirtualScrollComponent {
  items = Array.from({ length: 10000 }, (_, i) => `Item ${i}`);
}
```

### Layout - 響應式佈局

```typescript
import { LayoutModule, BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, inject } from '@angular/core';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-responsive',
  standalone: true,
  imports: [SHARED_IMPORTS, OPTIONAL_CDK_MODULES.layout]
})
export class ResponsiveComponent {
  private breakpointObserver = inject(BreakpointObserver);

  isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(map(result => result.matches));
}
```

### Observers - DOM 觀察器

```typescript
// 已包含在 SHARED_IMPORTS 中
import { Component, ElementRef, inject, AfterViewInit } from '@angular/core';
import { ResizeObserver } from '@angular/cdk/observers';

@Component({
  selector: 'app-resize',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div cdkObserveContent (cdkObserveContent)="onContentChange($event)">
      內容變化時觸發
    </div>
  `
})
export class ResizeComponent implements AfterViewInit {
  private elementRef = inject(ElementRef);

  ngAfterViewInit() {
    // 使用 ResizeObserver 監聽元素大小變化
  }

  onContentChange(event: MutationRecord[]) {
    console.log('內容已變化', event);
  }
}
```

### A11y - 可存取性

```typescript
// 已包含在 SHARED_IMPORTS 中
import { Component } from '@angular/core';
import { FocusMonitor } from '@angular/cdk/a11y';

@Component({
  selector: 'app-accessible',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <button cdkTrapFocus>焦點陷阱</button>
    <div cdkMonitorElementFocus>監聽焦點</div>
  `
})
export class AccessibleComponent {}
```

## 最佳實踐

1. **優先使用 SHARED_IMPORTS**：大多數情況下，`SHARED_IMPORTS` 已包含必要的 CDK 模組
2. **按需導入**：僅在需要特定功能時導入可選模組，避免不必要的 bundle 大小增加
3. **可存取性優先**：使用 A11y 模組確保應用程式符合可存取性標準
4. **效能優化**：對於大量資料列表，使用 Scrolling 模組的虛擬滾動功能
5. **響應式設計**：使用 Layout 模組處理不同螢幕尺寸的佈局

## 相關文件

- [Angular CDK 官方文件](https://material.angular.io/cdk)
- [專案 AGENTS.md](../../AGENTS.md)
- [共享模組配置](../shared-imports.ts)

