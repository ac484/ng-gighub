/**
 * @delon 模組導入配置
 * 根據使用頻率和功能分類：
 * 1. SHARED_DELON_MODULES - 常用模組 (包含在 SHARED_IMPORTS)
 * 2. OPTIONAL_DELON_MODULES - 可選模組 (按需導入)
 */

// 常用 @delon 模組
import { PageHeaderModule } from '@delon/abc/page-header';
import { SEModule } from '@delon/abc/se';
import { STModule } from '@delon/abc/st';
// 可選模組
import { SVModule } from '@delon/abc/sv';
import { ACLDirective, ACLIfDirective } from '@delon/acl';
import { DelonFormModule } from '@delon/form';
import { CurrencyPricePipe } from '@delon/util';

/**
 * 常用 @delon 模組 (包含在 SHARED_IMPORTS)
 * 適用於大部分業務元件
 */
export const SHARED_DELON_MODULES = [
  /** 動態表單模組 - Delon 表單系統 */
  DelonFormModule,

  /** 簡易表格模組 - 強大的表格元件 */
  STModule,

  /** 編輯表單模組 - 用於編輯場景 */
  SEModule,

  /** 頁面標題模組 - 頁面標題與麵包屑 */
  PageHeaderModule
];

/**
 * 可選 @delon 模組 (按需導入)
 * 用於特定場景
 *
 * @example
 * ```typescript
 * import { SHARED_IMPORTS, OPTIONAL_DELON_MODULES } from '@shared';
 *
 * @Component({
 *   imports: [
 *     SHARED_IMPORTS,
 *     OPTIONAL_DELON_MODULES.sv,
 *     ...OPTIONAL_DELON_MODULES.acl
 *   ]
 * })
 * ```
 */
export const OPTIONAL_DELON_MODULES = {
  /** 查看詳情模組 - 用於顯示詳情資訊 */
  sv: SVModule,

  /** 權限控制指令 - 用於權限控制 */
  acl: [ACLDirective, ACLIfDirective],

  /** 貨幣價格管道 - 用於貨幣格式化 */
  currencyPrice: CurrencyPricePipe
} as const;
