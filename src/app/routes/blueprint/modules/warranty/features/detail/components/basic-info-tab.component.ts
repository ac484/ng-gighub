/**
 * Basic Info Tab Component
 * 基本資訊頁籤元件
 *
 * 顯示保固基本資訊
 *
 * @module BasicInfoTabComponent
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import type { Warranty } from '@core/blueprint/modules/implementations/warranty';
import { SHARED_IMPORTS } from '@shared';

import { WarrantyStatusBadgeComponent } from '../../../shared';

/**
 * 基本資訊頁籤元件
 */
@Component({
  selector: 'app-basic-info-tab',
  standalone: true,
  imports: [SHARED_IMPORTS, WarrantyStatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (warranty(); as w) {
      <nz-descriptions nzBordered [nzColumn]="2">
        <nz-descriptions-item nzTitle="保固編號">{{ w.warrantyNumber }}</nz-descriptions-item>
        <nz-descriptions-item nzTitle="保固類型">
          {{ w.warrantyType === 'standard' ? '標準保固' : w.warrantyType === 'extended' ? '延長保固' : '特殊保固' }}
        </nz-descriptions-item>
        <nz-descriptions-item nzTitle="保固期限">{{ w.periodInMonths }} 個月</nz-descriptions-item>
        <nz-descriptions-item nzTitle="狀態">
          <app-warranty-status-badge [status]="w.status" />
        </nz-descriptions-item>
        <nz-descriptions-item nzTitle="開始日期">{{ w.startDate | date: 'yyyy-MM-dd' }}</nz-descriptions-item>
        <nz-descriptions-item nzTitle="結束日期">{{ w.endDate | date: 'yyyy-MM-dd' }}</nz-descriptions-item>
        <nz-descriptions-item nzTitle="保固責任方" [nzSpan]="2">
          <div>
            <div
              ><strong>{{ w.warrantor.name }}</strong></div
            >
            <div>聯絡人：{{ w.warrantor.contactName }}</div>
            <div>電話：{{ w.warrantor.contactPhone }}</div>
            <div>信箱：{{ w.warrantor.contactEmail }}</div>
          </div>
        </nz-descriptions-item>
        <nz-descriptions-item nzTitle="缺失數">{{ w.defectCount }}</nz-descriptions-item>
        <nz-descriptions-item nzTitle="維修數">{{ w.repairCount }}</nz-descriptions-item>
      </nz-descriptions>
    }
  `
})
export class BasicInfoTabComponent {
  /**
   * 保固資料
   */
  warranty = input<Warranty | null>(null);
}
