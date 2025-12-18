/**
 * Shared Module View Component
 * 共享域視圖元件 - 已清除所有程式碼和標籤
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-shared-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS],
  template: ` <nz-empty nzNotFoundContent="共享模組已清除" /> `,
  styles: []
})
export class SharedModuleViewComponent {
  blueprintId = input.required<string>();
}
