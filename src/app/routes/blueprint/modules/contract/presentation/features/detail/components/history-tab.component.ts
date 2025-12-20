/**
 * History Tab Component
 * 歷史記錄標籤元件
 *
 * Feature: Detail
 * Responsibility: Display contract history and audit trail
 * Coupling: Low - only requires contract input
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import type { Contract } from '@routes/blueprint/modules/contract/data/models';
import { SHARED_IMPORTS } from '@shared';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';

@Component({
  selector: 'app-history-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzDescriptionsModule],
  template: `
    <nz-descriptions nzBordered [nzColumn]="1">
      <nz-descriptions-item nzTitle="建立者">
        {{ contract().createdBy }}
      </nz-descriptions-item>
      <nz-descriptions-item nzTitle="建立時間">
        {{ contract().createdAt | date: 'yyyy-MM-dd HH:mm' }}
      </nz-descriptions-item>
      <nz-descriptions-item nzTitle="最後更新">
        {{ contract().updatedAt | date: 'yyyy-MM-dd HH:mm' }}
      </nz-descriptions-item>
      @if (contract().activatedAt) {
        <nz-descriptions-item nzTitle="生效時間">
          {{ contract().activatedAt | date: 'yyyy-MM-dd HH:mm' }}
        </nz-descriptions-item>
      }
      @if (contract().activatedBy) {
        <nz-descriptions-item nzTitle="生效者">
          {{ contract().activatedBy }}
        </nz-descriptions-item>
      }
    </nz-descriptions>
  `
})
export class HistoryTabComponent {
  contract = input.required<Contract>();
}
