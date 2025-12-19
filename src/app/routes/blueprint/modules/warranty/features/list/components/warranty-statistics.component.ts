/**
 * Warranty Statistics Component
 * 保固統計元件
 *
 * 顯示保固統計卡片
 *
 * @module WarrantyStatisticsComponent
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

/**
 * 保固統計資料結構
 */
export interface WarrantyStatistics {
  active: number;
  expiring: number;
  expired: number;
  completed: number;
}

/**
 * 保固統計元件
 */
@Component({
  selector: 'app-warranty-statistics',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stats-bar" style="margin-bottom: 16px; display: flex; gap: 24px; flex-wrap: wrap;">
      <nz-statistic nzTitle="活動中" [nzValue]="statistics().active" nzPrefix="🟢" />
      <nz-statistic nzTitle="即將到期" [nzValue]="statistics().expiring" nzPrefix="🟡" />
      <nz-statistic nzTitle="已過期" [nzValue]="statistics().expired" nzPrefix="🔴" />
      <nz-statistic nzTitle="已完成" [nzValue]="statistics().completed" nzPrefix="✅" />
    </div>
  `,
  styles: [
    `
      .stats-bar ::ng-deep .ant-statistic {
        min-width: 100px;
      }
      .stats-bar ::ng-deep .ant-statistic-title {
        font-size: 12px;
        color: #999;
      }
      .stats-bar ::ng-deep .ant-statistic-content {
        font-size: 20px;
      }
    `
  ]
})
export class WarrantyStatisticsComponent {
  /**
   * 統計資料
   */
  statistics = input.required<WarrantyStatistics>();
}
