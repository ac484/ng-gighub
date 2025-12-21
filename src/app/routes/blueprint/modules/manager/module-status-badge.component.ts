/**
 * Module Status Badge Component
 *
 * Displays module lifecycle status with appropriate badge styling.
 * Uses Angular 20 Signals and modern input() function.
 *
 * @author GigHub Development Team
 * @date 2025-12-10
 */

import { Component, input, computed } from '@angular/core';
import { ModuleStatus } from '@core/blueprint/modules/module-status.enum';
import { SHARED_IMPORTS } from '@shared';

/**
 * Badge configuration for each module status
 */
const STATUS_CONFIG: Record<ModuleStatus, { text: string; status: string; color: string }> = {
  [ModuleStatus.UNINITIALIZED]: { text: '未初始化', status: 'default', color: '#d9d9d9' },
  [ModuleStatus.INITIALIZING]: { text: '初始化中', status: 'processing', color: '#1890ff' },
  [ModuleStatus.INITIALIZED]: { text: '已初始化', status: 'default', color: '#52c41a' },
  [ModuleStatus.READY]: { text: '就緒', status: 'success', color: '#52c41a' },
  [ModuleStatus.STARTING]: { text: '啟動中', status: 'processing', color: '#1890ff' },
  [ModuleStatus.STARTED]: { text: '已啟動', status: 'success', color: '#52c41a' },
  [ModuleStatus.RUNNING]: { text: '運行中', status: 'success', color: '#52c41a' },
  [ModuleStatus.STOPPING]: { text: '停止中', status: 'warning', color: '#faad14' },
  [ModuleStatus.STOPPED]: { text: '已停止', status: 'default', color: '#d9d9d9' },
  [ModuleStatus.DISPOSED]: { text: '已釋放', status: 'default', color: '#8c8c8c' },
  [ModuleStatus.ERROR]: { text: '錯誤', status: 'error', color: '#ff4d4f' }
};

@Component({
  selector: 'app-module-status-badge',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: ` <nz-badge [nzStatus]="badgeStatus()" [nzText]="statusText()" [ngStyle]="{ color: badgeColor() }"> </nz-badge> `,
  styles: [
    `
      :host {
        display: inline-block;
      }
    `
  ]
})
export class ModuleStatusBadgeComponent {
  /** Module status input (required) */
  status = input.required<ModuleStatus>();

  /** Computed badge configuration */
  private config = computed(() => STATUS_CONFIG[this.status()]);

  /** Badge status (ng-zorro badge type) */
  badgeStatus = computed(() => this.config().status as any);

  /** Status text */
  statusText = computed(() => this.config().text);

  /** Badge color */
  badgeColor = computed(() => this.config().color);
}
