/**
 * Basic Info Tab Component
 * 基本資訊標籤元件
 *
 * Feature: Detail
 * Responsibility: Display contract basic information
 * Coupling: Low - only requires contract input
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import type { Contract } from '@routes/blueprint/modules/contract/data/models';
import { SHARED_IMPORTS } from '@shared';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';

@Component({
  selector: 'app-basic-info-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzDescriptionsModule],
  template: `
    <nz-descriptions nzTitle="合約摘要" nzBordered [nzColumn]="1" class="mt-md">
      <nz-descriptions-item nzTitle="合約編號">
        {{ contract().contractNumber }}
      </nz-descriptions-item>
      <nz-descriptions-item nzTitle="合約名稱">
        {{ contract().title }}
      </nz-descriptions-item>
      <nz-descriptions-item nzTitle="合約金額">
        {{ contract().currency }} {{ contract().totalAmount | number: '1.0-0' }}
      </nz-descriptions-item>
      <nz-descriptions-item nzTitle="開始日期">
        {{ contract().startDate | date: 'yyyy-MM-dd' }}
      </nz-descriptions-item>
      <nz-descriptions-item nzTitle="結束日期">
        {{ contract().endDate | date: 'yyyy-MM-dd' }}
      </nz-descriptions-item>
      @if (contract().description) {
        <nz-descriptions-item nzTitle="描述">
          {{ contract().description }}
        </nz-descriptions-item>
      }
    </nz-descriptions>
  `
})
export class BasicInfoTabComponent {
  contract = input.required<Contract>();
}
