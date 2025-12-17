/**
 * Material Module View Component
 * 材料域視圖元件 - 已清除所有程式碼和標籤
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-material-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-empty nzNotFoundContent="材料模組已清除" />
  `,
  styles: []
})
export class MaterialModuleViewComponent {
  blueprintId = input.required<string>();
}
