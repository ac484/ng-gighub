/**
 * 共享導入配置
 *
 * 此檔案整合了 Angular、ng-zorro-antd 和 @delon 的常用模組，
 * 供 Standalone Components 使用。
 *
 * 使用方式：
 * ```typescript
 * import { SHARED_IMPORTS } from '@shared';
 *
 * @Component({
 *   selector: 'app-example',
 *   standalone: true,
 *   imports: [SHARED_IMPORTS]
 * })
 * export class ExampleComponent {}
 * ```
 *
 * 對於特殊需求，可以額外導入可選模組：
 * ```typescript
 * import { SHARED_IMPORTS, OPTIONAL_ZORRO_MODULES, OPTIONAL_DELON_MODULES, OPTIONAL_CDK_MODULES } from '@shared';
 *
 * @Component({
 *   imports: [
 *     SHARED_IMPORTS,
 *     OPTIONAL_ZORRO_MODULES.divider,
 *     OPTIONAL_DELON_MODULES.sv,
 *     OPTIONAL_CDK_MODULES.overlay,
 *     OPTIONAL_CDK_MODULES.scrolling
 *   ]
 * })
 * ```
 */

import { CommonModule, AsyncPipe, JsonPipe, NgTemplateOutlet } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink } from '@angular/router';
import { DatePipe, I18nPipe } from '@delon/theme';

import { SHARED_CDK_MODULES } from './cdk/shared-cdk.module';
import { SHARED_DELON_MODULES } from './shared-delon.module';
import { SHARED_ZORRO_MODULES } from './shared-zorro.module';

// 匯出可選模組供按需使用
export { OPTIONAL_DELON_MODULES } from './shared-delon.module';
export { OPTIONAL_ZORRO_MODULES } from './shared-zorro.module';
export { OPTIONAL_CDK_MODULES } from './cdk/shared-cdk.module';

/**
 * 核心 Angular 模組
 * 包含表單、路由、常用管道等基礎功能
 */
const CORE_ANGULAR_MODULES = [
  /** CommonModule - 提供 *ngIf, *ngFor 等常用指令 */
  CommonModule,

  /** 表單模組 */
  FormsModule,
  ReactiveFormsModule,

  /** 路由模組 */
  RouterLink,
  RouterOutlet,

  /** 常用指令 */
  NgTemplateOutlet,

  /** 常用管道 */
  I18nPipe,
  JsonPipe,
  DatePipe,
  AsyncPipe
];

/**
 * 標準共享導入
 * 包含：
 * - Angular 核心模組 (表單、路由、管道)
 * - Angular CDK 常用模組 (A11y、Observers、Platform)
 * - ng-zorro-antd 常用模組
 * - @delon 常用模組
 *
 * 適用於 80% 以上的元件
 *
 * @note Angular CDK 模組按需直接引入
 * ng-zorro-antd 已包含大部分 CDK 功能，無需額外抽象層
 * 如需使用 CDK，請直接在元件中引入：
 * - DragDropModule - 拖放功能
 * - ScrollingModule - 虛擬滾動
 * - A11yModule - 無障礙功能
 */
export const SHARED_IMPORTS = [...CORE_ANGULAR_MODULES, ...SHARED_CDK_MODULES, ...SHARED_DELON_MODULES, ...SHARED_ZORRO_MODULES];
