/**
 * Shared Module View Component
 * 共享域視圖元件 - 顯示於藍圖詳情頁面的 Tab 中
 * 未來會有多個子模組
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';

@Component({
  selector: 'app-shared-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzStatisticModule, NzEmptyModule, NzAlertModule],
  template: `
    <!-- Statistics Card -->
    <nz-card nzTitle="共享資源統計" class="mb-md">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="8">
          <nz-statistic [nzValue]="0" nzTitle="共享文件" [nzPrefix]="docIcon" />
          <ng-template #docIcon>
            <span nz-icon nzType="file-text" style="color: #1890ff;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="8">
          <nz-statistic [nzValue]="0" nzTitle="共享資源" [nzPrefix]="resourceIcon" />
          <ng-template #resourceIcon>
            <span nz-icon nzType="database" style="color: #52c41a;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="8">
          <nz-statistic [nzValue]="0" nzTitle="共享模板" [nzPrefix]="templateIcon" />
          <ng-template #templateIcon>
            <span nz-icon nzType="container" style="color: #722ed1;"></span>
          </ng-template>
        </nz-col>
      </nz-row>
    </nz-card>

    <!-- Shared Resources List -->
    <nz-card nzTitle="共享資源列表">
      <nz-empty nzNotFoundContent="暫無共享資源" nzNotFoundImage="simple" />
      <nz-alert
        nzType="info"
        nzMessage="共享模組開發中"
        nzDescription="此模組未來會包含多個子模組，用於管理跨藍圖的共享資源、文件和模板。"
        nzShowIcon
        class="mt-md"
      />
    </nz-card>
  `,
  styles: []
})
export class SharedModuleViewComponent implements OnInit {
  blueprintId = input.required<string>();
  private readonly message = inject(NzMessageService);

  ngOnInit(): void {
    // Placeholder - will be implemented with multiple sub-modules in the future
  }
}
