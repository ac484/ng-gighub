/**
 * Angular CDK 模組配置
 *
 * 此檔案整合了 Angular CDK 的常用模組，供 Standalone Components 使用。
 *
 * CDK 模組分類：
 * - SHARED_CDK_MODULES: 常用模組（包含在 SHARED_IMPORTS 中）
 * - OPTIONAL_CDK_MODULES: 可選模組（按需導入）
 *
 * 使用方式：
 * ```typescript
 * import { SHARED_IMPORTS, OPTIONAL_CDK_MODULES } from '@shared';
 *
 * @Component({
 *   imports: [
 *     SHARED_IMPORTS,
 *     OPTIONAL_CDK_MODULES.overlay,
 *     OPTIONAL_CDK_MODULES.portal
 *   ]
 * })
 * export class ExampleComponent {}
 * ```
 */

// Overlay - 所有浮層（Modal、Dropdown、Tooltip、Popover 等）
import { A11yModule } from '@angular/cdk/a11y';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { LayoutModule } from '@angular/cdk/layout';
import { ObserversModule } from '@angular/cdk/observers';
import { OverlayModule } from '@angular/cdk/overlay';
// Portal - 動態內容（動態渲染元件到 DOM）
import { PlatformModule } from '@angular/cdk/platform';
import { PortalModule } from '@angular/cdk/portal';
// A11y - 可存取性（焦點管理、鍵盤導航、ARIA 屬性等）
// Scrolling - 大量資料效能（虛擬滾動、無限滾動）
import { ScrollingModule } from '@angular/cdk/scrolling';
// Layout - RWD / Breakpoint（響應式佈局、斷點檢測）
// Observers - DOM / Resize 感知（ResizeObserver、IntersectionObserver）
// DragDrop - 拖放功能（已在專案中使用）
// Tree - 樹狀結構（已在專案中使用）
import { CdkTreeModule } from '@angular/cdk/tree';
// Platform - 平台檢測（已在專案中使用）

/**
 * 常用 CDK 模組
 * 包含在 SHARED_IMPORTS 中，適用於大多數元件
 *
 * 規則：
 * - A11yModule: 可存取性功能，大多數元件都需要
 * - ObserversModule: DOM 觀察器，常用於響應式設計
 * - PlatformModule: 平台檢測，常用於條件渲染
 */
export const SHARED_CDK_MODULES = [
  /** A11y - 可存取性（焦點管理、鍵盤導航） */
  A11yModule,

  /** Observers - DOM 觀察器（ResizeObserver、IntersectionObserver） */
  ObserversModule,

  /** Platform - 平台檢測（瀏覽器、行動裝置等） */
  PlatformModule
];

/**
 * 可選 CDK 模組
 * 按需導入，不包含在 SHARED_IMPORTS 中
 *
 * 規則：
 * - 僅在需要特定功能時導入
 * - 避免不必要的 bundle 大小增加
 */
export const OPTIONAL_CDK_MODULES = {
  /** Overlay - 所有浮層（Modal、Dropdown、Tooltip、Popover） */
  overlay: OverlayModule,

  /** Portal - 動態內容（動態渲染元件到 DOM） */
  portal: PortalModule,

  /** Scrolling - 大量資料效能（虛擬滾動、無限滾動） */
  scrolling: ScrollingModule,

  /** Layout - RWD / Breakpoint（響應式佈局、斷點檢測） */
  layout: LayoutModule,

  /** DragDrop - 拖放功能 */
  dragDrop: DragDropModule,

  /** Tree - 樹狀結構 */
  tree: CdkTreeModule
} as const;
