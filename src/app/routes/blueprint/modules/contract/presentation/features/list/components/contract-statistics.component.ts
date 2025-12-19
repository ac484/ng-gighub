/**
 * Contract Statistics Component
 * 合約統計元件 - 顯示合約統計資訊
 *
 * Feature: List
 * Responsibility: Display contract statistics cards
 * Coupling: Minimal - only requires statistics data input
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import type { ContractStatistics } from '@routes/blueprint/modules/contract/data/models';
import { SHARED_IMPORTS } from '@shared';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';

@Component({
  selector: 'app-contract-statistics',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzStatisticModule],
  template: `
    <!-- Status Statistics -->
    <nz-card nzTitle="合約統計" class="mb-md">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="4">
          <nz-statistic [nzValue]="statistics().total" nzTitle="總計" />
        </nz-col>
        <nz-col [nzSpan]="4">
          <nz-statistic [nzValue]="statistics().draft" nzTitle="草稿" [nzPrefix]="draftIcon" />
          <ng-template #draftIcon>
            <span nz-icon nzType="file-text" style="color: #8c8c8c;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="4">
          <nz-statistic [nzValue]="statistics().pendingActivation" nzTitle="待生效" [nzPrefix]="pendingIcon" />
          <ng-template #pendingIcon>
            <span nz-icon nzType="clock-circle" style="color: #1890ff;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="4">
          <nz-statistic [nzValue]="statistics().active" nzTitle="已生效" [nzPrefix]="activeIcon" />
          <ng-template #activeIcon>
            <span nz-icon nzType="check-circle" style="color: #52c41a;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="4">
          <nz-statistic [nzValue]="statistics().completed" nzTitle="已完成" [nzPrefix]="completedIcon" />
          <ng-template #completedIcon>
            <span nz-icon nzType="trophy" style="color: #722ed1;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="4">
          <nz-statistic [nzValue]="statistics().terminated" nzTitle="已終止" [nzPrefix]="terminatedIcon" />
          <ng-template #terminatedIcon>
            <span nz-icon nzType="close-circle" style="color: #ff4d4f;"></span>
          </ng-template>
        </nz-col>
      </nz-row>
    </nz-card>

    <!-- Value Statistics -->
    <nz-card nzTitle="合約金額" class="mb-md">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="12">
          <nz-statistic [nzValue]="statistics().totalValue" nzTitle="合約總金額" nzPrefix="$" [nzValueStyle]="{ color: '#1890ff' }" />
        </nz-col>
        <nz-col [nzSpan]="12">
          <nz-statistic [nzValue]="statistics().activeValue" nzTitle="生效中金額" nzPrefix="$" [nzValueStyle]="{ color: '#52c41a' }" />
        </nz-col>
      </nz-row>
    </nz-card>
  `
})
export class ContractStatisticsComponent {
  statistics = input.required<ContractStatistics>();
}
