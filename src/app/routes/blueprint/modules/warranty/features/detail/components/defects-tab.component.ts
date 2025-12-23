/**
 * Defects Tab Component
 * 缺失頁籤元件
 *
 * 顯示保固相關的缺失列表摘要
 *
 * @module DefectsTabComponent
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import type { WarrantyDefect } from '../../../core';
import { SHARED_IMPORTS } from '@shared';

/**
 * 缺失頁籤元件
 */
@Component({
  selector: 'app-defects-tab',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (defects().length > 0) {
      <nz-list [nzDataSource]="defects()" nzBordered>
        <nz-list-item *ngFor="let defect of defects()">
          <nz-list-item-meta [nzTitle]="defectTitle" [nzDescription]="defect.description">
            <ng-template #defectTitle>
              {{ defect.defectNumber }} -
              <nz-tag [nzColor]="getSeverityColor(defect.severity)">
                {{ getSeverityText(defect.severity) }}
              </nz-tag>
              <nz-tag>{{ getStatusText(defect.status) }}</nz-tag>
            </ng-template>
          </nz-list-item-meta>
          <ul nz-list-item-actions>
            <nz-list-item-action>
              <a (click)="viewDefect.emit(defect)">查看</a>
            </nz-list-item-action>
          </ul>
        </nz-list-item>
      </nz-list>
    } @else {
      <nz-empty nzNotFoundContent="暫無缺失記錄" />
    }
  `
})
export class DefectsTabComponent {
  /**
   * 缺失列表
   */
  defects = input<WarrantyDefect[]>([]);

  /**
   * 查看缺失事件
   */
  viewDefect = output<WarrantyDefect>();

  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'major':
        return 'warning';
      case 'minor':
        return 'success';
      default:
        return 'default';
    }
  }

  getSeverityText(severity: string): string {
    switch (severity) {
      case 'critical':
        return '嚴重';
      case 'major':
        return '主要';
      case 'minor':
        return '輕微';
      default:
        return '未知';
    }
  }

  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      reported: '已回報',
      confirmed: '已確認',
      under_repair: '維修中',
      repaired: '已維修',
      verified: '已驗收',
      closed: '已結案',
      rejected: '已拒絕'
    };
    return statusMap[status] || '未知';
  }
}
