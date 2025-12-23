/**
 * Defect Statistics Component
 * 缺失統計元件
 *
 * 顯示缺失統計資料
 *
 * @module DefectStatisticsComponent
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import type { DefectStatistics } from '../../core';
import { SHARED_IMPORTS } from '@shared';

/**
 * 缺失統計元件
 */
@Component({
  selector: 'app-defect-statistics',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (statistics(); as stats) {
      <div class="stats-bar" style="margin-bottom: 16px; display: flex; gap: 24px; flex-wrap: wrap;">
        <nz-statistic nzTitle="總缺失" [nzValue]="stats.total" />
        <nz-statistic nzTitle="嚴重" [nzValue]="stats.bySeverity.critical" nzPrefix="🔴" />
        <nz-statistic nzTitle="主要" [nzValue]="stats.bySeverity.major" nzPrefix="🟡" />
        <nz-statistic nzTitle="輕微" [nzValue]="stats.bySeverity.minor" nzPrefix="🟢" />
        <nz-statistic nzTitle="待處理" [nzValue]="stats.byStatus.open" />
        <nz-statistic nzTitle="已解決" [nzValue]="stats.byStatus.resolved" />
      </div>
    }
  `,
  styles: [
    `
      .stats-bar ::ng-deep .ant-statistic {
        min-width: 80px;
      }
      .stats-bar ::ng-deep .ant-statistic-title {
        font-size: 12px;
        color: #999;
      }
      .stats-bar ::ng-deep .ant-statistic-content {
        font-size: 18px;
      }
    `
  ]
})
export class DefectStatisticsComponent {
  /**
   * 統計資料
   */
  statistics = input<DefectStatistics | null>(null);
}
