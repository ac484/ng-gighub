/**
 * Communication Module View Component
 * 通訊域視圖元件
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input } from '@angular/core';
import { GroupMessageService } from '@core/blueprint/modules/implementations/communication/services/group-message.service';
import { PushNotificationService } from '@core/blueprint/modules/implementations/communication/services/push-notification.service';
import { SystemNotificationService } from '@core/blueprint/modules/implementations/communication/services/system-notification.service';
import { TaskReminderService } from '@core/blueprint/modules/implementations/communication/services/task-reminder.service';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';

@Component({
  selector: 'app-communication-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzStatisticModule, NzEmptyModule, NzAlertModule],
  template: `
    <nz-card nzTitle="通訊統計" class="mb-md">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="24">
          <nz-statistic [nzValue]="notificationService.data().length" nzTitle="系統通知" />
        </nz-col>
      </nz-row>
    </nz-card>

    <!-- Simplified Communication Module -->
    <nz-card>
      <nz-alert
        nzType="info"
        nzMessage="通訊模組簡化版"
        nzDescription="本模組提供基礎通知功能。更多通訊功能將在後續版本中開發。"
        nzShowIcon
      />
      <nz-divider />
      <nz-tabset>
        <nz-tab nzTitle="系統通知">
          @if (notificationService.loading()) {
            <nz-spin nzSimple />
          } @else if (notificationService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無系統通知" />
          } @else {
            <st [data]="notificationService.data()" [columns]="notificationColumns" />
          }
        </nz-tab>
      </nz-tabset>
    </nz-card>
  `,
  styles: []
})
export class CommunicationModuleViewComponent implements OnInit {
  blueprintId = input.required<string>();

  readonly notificationService = inject(SystemNotificationService);
  readonly messageService = inject(GroupMessageService);
  readonly reminderService = inject(TaskReminderService);
  readonly pushService = inject(PushNotificationService);
  private readonly message = inject(NzMessageService);

  notificationColumns: STColumn[] = this.withActions(
    [
      { title: '通知內容', index: 'content' },
      { title: '類型', index: 'type', width: '100px' },
      { title: '時間', index: 'createdAt', type: 'date', width: '180px' }
    ],
    '系統通知'
  );

  ngOnInit(): void {
    this.notificationService.load();
    // Load others for potential future use
    this.messageService.load();
    this.reminderService.load();
    this.pushService.load();
  }

  private withActions(columns: STColumn[], context: string): STColumn[] {
    return [...columns, this.createActionColumn(context)];
  }

  private createActionColumn(context: string): STColumn {
    return {
      title: '操作',
      width: 160,
      buttons: [
        { text: '查看', click: record => this.notifyPending(context, '查看', record) },
        { text: '編輯', click: record => this.notifyPending(context, '編輯', record) },
        { text: '刪除', click: record => this.notifyPending(context, '刪除', record) }
      ]
    };
  }

  notifyPending(
    context: string,
    action: string,
    record?: { content?: string; message?: string; taskName?: string; recipient?: string }
  ): void {
    const title = record?.content || record?.message || record?.taskName || record?.recipient;
    const detail = title ? `：${title}` : '';
    this.message.info(`${context}${action}功能待實作${detail}`);
  }
}
