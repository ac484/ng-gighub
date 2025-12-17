/**
 * NG-ZORRO 模組導入配置
 * 根據使用頻率分為三個級別：
 * 1. COMMON_ZORRO_MODULES - 高頻使用 (>50% 元件使用)
 * 2. MODERATE_ZORRO_MODULES - 中頻使用 (20-50% 元件使用)
 * 3. OPTIONAL_ZORRO_MODULES - 低頻使用 (<20% 元件使用，按需導入)
 */

// 高頻使用模組 - 包含在 SHARED_IMPORTS 中
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCalendarModule } from 'ng-zorro-antd/calendar';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';

// 中頻使用模組 - 包含在 SHARED_IMPORTS 中
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSegmentedModule } from 'ng-zorro-antd/segmented';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';

// 低頻使用模組 - 按需導入 (不包含在 SHARED_IMPORTS)
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzUploadModule } from 'ng-zorro-antd/upload';

/**
 * 常用 NG-ZORRO 模組 (包含在 SHARED_IMPORTS)
 * 使用頻率: 高頻 + 中頻
 * 適用於大部分元件
 */
export const SHARED_ZORRO_MODULES = [
  // 高頻使用 (>50% 元件使用)
  NzButtonModule,
  NzCardModule,
  NzFormModule,
  NzGridModule,
  NzIconModule,
  NzInputModule,
  NzListModule,
  NzToolTipModule,
  NzDropDownModule,
  NzTabsModule,
  NzBreadCrumbModule,

  // 中頻使用 (20-50% 元件使用)
  NzAlertModule,
  NzAvatarModule,
  NzBadgeModule,
  NzCheckboxModule,
  NzDatePickerModule,
  NzDividerModule,
  NzDrawerModule,
  NzInputNumberModule,
  NzModalModule,
  NzPopconfirmModule,
  NzPopoverModule,
  NzProgressModule,
  NzRadioModule,
  NzResultModule,
  NzSelectModule,
  NzSpaceModule,
  NzSpinModule,
  NzStatisticModule,
  NzSwitchModule,
  NzTableModule,
  NzTagModule,
  NzUploadModule,
  // New modules for todo/schedule features
  NzCalendarModule,
  NzEmptyModule,
  NzSegmentedModule,
  NzTimePickerModule,
  NzTimelineModule
];

/**
 * 可選 NG-ZORRO 模組 (按需導入)
 * 使用頻率: 低頻 (<20% 元件使用)
 *
 * @example
 * ```typescript
 * import { SHARED_IMPORTS, OPTIONAL_ZORRO_MODULES } from '@shared';
 *
 * @Component({
 *   imports: [SHARED_IMPORTS, OPTIONAL_ZORRO_MODULES.divider]
 * })
 * ```
 */
export const OPTIONAL_ZORRO_MODULES = {
  /** 分隔線模組 - 用於視覺分隔 */
  divider: NzDividerModule,

  /** 氣泡確認框模組 - 用於危險操作確認 */
  popconfirm: NzPopconfirmModule,

  /** 進度條模組 - 用於顯示進度 */
  progress: NzProgressModule,

  /** 間距模組 - 用於設置元件間距 */
  space: NzSpaceModule,

  /** 時間選擇器模組 - 用於選擇時間 */
  timePicker: NzTimePickerModule
} as const;
