/**
 * Confirm Step Component
 * 確認資料步驟元件
 *
 * Feature: Create
 * Responsibility: Display contract data for confirmation
 * Interface: Form value input for display
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';

@Component({
  selector: 'app-confirm-step',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzDescriptionsModule],
  template: `
    <div class="step-content">
      <h3>確認合約資料</h3>
      <nz-descriptions nzBordered [nzColumn]="2">
        <nz-descriptions-item nzTitle="合約標題" [nzSpan]="2">
          {{ formValue().title }}
        </nz-descriptions-item>
        <nz-descriptions-item nzTitle="合約描述" [nzSpan]="2">
          {{ formValue().description || '-' }}
        </nz-descriptions-item>
        <nz-descriptions-item nzTitle="合約金額">
          {{ formValue().totalAmount | currency: 'TWD' }}
        </nz-descriptions-item>
        <nz-descriptions-item nzTitle="幣別">TWD</nz-descriptions-item>
        <nz-descriptions-item nzTitle="開始日期">
          {{ formValue().startDate | date: 'yyyy-MM-dd' }}
        </nz-descriptions-item>
        <nz-descriptions-item nzTitle="結束日期">
          {{ formValue().endDate | date: 'yyyy-MM-dd' }}
        </nz-descriptions-item>
      </nz-descriptions>
    </div>
  `,
  styles: [
    `
      .step-content {
        max-width: 800px;
        margin: 0 auto;
      }
    `
  ]
})
export class ConfirmStepComponent {
  formValue = input.required<any>();
}
