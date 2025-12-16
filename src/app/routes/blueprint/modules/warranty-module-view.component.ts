/**
 * Warranty Module View Component
 * 保固期管理域視圖元件 - 顯示於藍圖詳情頁面的 Tab 中
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';

@Component({
  selector: 'app-warranty-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzStatisticModule, NzEmptyModule, NzAlertModule],
  template: `
    <!-- Statistics Card -->
    <nz-card nzTitle="保固期統計" class="mb-md">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="8">
          <nz-statistic [nzValue]="0" nzTitle="保固項目" [nzPrefix]="warrantyIcon" />
          <ng-template #warrantyIcon>
            <span nz-icon nzType="safety-certificate" style="color: #1890ff;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="8">
          <nz-statistic [nzValue]="0" nzTitle="維修記錄" [nzPrefix]="repairIcon" />
          <ng-template #repairIcon>
            <span nz-icon nzType="tool" style="color: #52c41a;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="8">
          <nz-statistic [nzValue]="0" nzTitle="即將到期" [nzPrefix]="expiringIcon" />
          <ng-template #expiringIcon>
            <span nz-icon nzType="clock-circle" style="color: #faad14;"></span>
          </ng-template>
        </nz-col>
      </nz-row>
    </nz-card>

    <!-- Warranty List -->
    <nz-card nzTitle="保固期管理列表">
      <nz-empty nzNotFoundContent="暫無保固期記錄" nzNotFoundImage="simple" />
      <nz-alert
        nzType="info"
        nzMessage="保固期管理模組開發中"
        nzDescription="此模組將管理工程完工後的保固期，包括保固項目追蹤、維修記錄、到期提醒等功能。"
        nzShowIcon
        class="mt-md"
      />
    </nz-card>
  `,
  styles: []
})
export class WarrantyModuleViewComponent implements OnInit {
  blueprintId = input.required<string>();
  private readonly message = inject(NzMessageService);

  ngOnInit(): void {
    // Placeholder - warranty period management module
  }
}
