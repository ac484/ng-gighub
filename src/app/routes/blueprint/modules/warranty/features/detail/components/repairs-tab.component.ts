/**
 * Repairs Tab Component
 * 維修頁籤元件
 *
 * 顯示保固相關的維修記錄摘要
 *
 * @module RepairsTabComponent
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

/**
 * 維修記錄介面 (暫時定義，未來從 core 匯入)
 */
interface WarrantyRepair {
  id: string;
  repairNumber: string;
  description: string;
  status: string;
  repairDate?: Date;
}

/**
 * 維修頁籤元件
 */
@Component({
  selector: 'app-repairs-tab',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (repairs().length > 0) {
      <nz-list [nzDataSource]="repairs()" nzBordered>
        <nz-list-item *ngFor="let repair of repairs()">
          <nz-list-item-meta [nzTitle]="repair.repairNumber" [nzDescription]="repair.description"> </nz-list-item-meta>
          <div>
            狀態：<nz-tag>{{ getStatusText(repair.status) }}</nz-tag>
            @if (repair.repairDate) {
              <div style="margin-top: 4px;"> 維修日期：{{ repair.repairDate | date: 'yyyy-MM-dd' }} </div>
            }
          </div>
        </nz-list-item>
      </nz-list>
    } @else {
      <nz-empty nzNotFoundContent="暫無維修記錄" />
    }
  `
})
export class RepairsTabComponent {
  /**
   * 維修記錄列表
   */
  repairs = input<WarrantyRepair[]>([]);

  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      pending: '待處理',
      in_progress: '維修中',
      completed: '已完成',
      verified: '已驗收'
    };
    return statusMap[status] || '未知';
  }
}
