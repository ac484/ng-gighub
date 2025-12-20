/**
 * Log Module View Component
 * 日誌域視圖元件 - 顯示於藍圖詳情頁面的 Tab 中
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input } from '@angular/core';
import { ActivityLogService } from '@core/blueprint/modules/implementations/log/services/activity-log.service';
import { AttachmentService } from '@core/blueprint/modules/implementations/log/services/attachment.service';
import { ChangeHistoryService } from '@core/blueprint/modules/implementations/log/services/change-history.service';
import { CommentService } from '@core/blueprint/modules/implementations/log/services/comment.service';
import { SystemEventService } from '@core/blueprint/modules/implementations/log/services/system-event.service';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';

@Component({
  selector: 'app-log-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzStatisticModule, NzEmptyModule],
  template: `
    <!-- Statistics Card -->
    <nz-card nzTitle="日誌統計" class="mb-md">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="activityLogService.data().length" nzTitle="活動記錄" [nzPrefix]="activityIcon" />
          <ng-template #activityIcon>
            <span nz-icon nzType="file-text" style="color: #1890ff;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="systemEventService.data().length" nzTitle="系統事件" [nzPrefix]="eventIcon" />
          <ng-template #eventIcon>
            <span nz-icon nzType="notification" style="color: #52c41a;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="commentService.data().length" nzTitle="評論" [nzPrefix]="commentIcon" />
          <ng-template #commentIcon>
            <span nz-icon nzType="message" style="color: #faad14;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="attachmentService.data().length" nzTitle="附件" [nzPrefix]="attachmentIcon" />
          <ng-template #attachmentIcon>
            <span nz-icon nzType="paper-clip" style="color: #722ed1;"></span>
          </ng-template>
        </nz-col>
      </nz-row>
    </nz-card>

    <!-- Tabs for Sub-modules -->
    <nz-card>
      <nz-tabset>
        <nz-tab nzTitle="活動記錄">
          @if (activityLogService.loading()) {
            <nz-spin nzSimple />
          } @else if (activityLogService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無活動記錄" />
          } @else {
            <st [data]="activityLogService.data()" [columns]="activityColumns" />
          }
        </nz-tab>
        <nz-tab nzTitle="系統事件">
          @if (systemEventService.loading()) {
            <nz-spin nzSimple />
          } @else if (systemEventService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無系統事件" />
          } @else {
            <st [data]="systemEventService.data()" [columns]="eventColumns" />
          }
        </nz-tab>
        <nz-tab nzTitle="評論">
          @if (commentService.loading()) {
            <nz-spin nzSimple />
          } @else if (commentService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無評論" />
          } @else {
            <st [data]="commentService.data()" [columns]="commentColumns" />
          }
        </nz-tab>
        <nz-tab nzTitle="附件">
          @if (attachmentService.loading()) {
            <nz-spin nzSimple />
          } @else if (attachmentService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無附件" />
          } @else {
            <st [data]="attachmentService.data()" [columns]="attachmentColumns" />
          }
        </nz-tab>
        <nz-tab nzTitle="變更歷史">
          @if (changeHistoryService.loading()) {
            <nz-spin nzSimple />
          } @else if (changeHistoryService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無變更歷史" />
          } @else {
            <st [data]="changeHistoryService.data()" [columns]="changeHistoryColumns" />
          }
        </nz-tab>
      </nz-tabset>
    </nz-card>
  `,
  styles: []
})
export class LogModuleViewComponent implements OnInit {
  blueprintId = input.required<string>();

  // Inject services
  readonly activityLogService = inject(ActivityLogService);
  readonly systemEventService = inject(SystemEventService);
  readonly commentService = inject(CommentService);
  readonly attachmentService = inject(AttachmentService);
  readonly changeHistoryService = inject(ChangeHistoryService);

  // Table columns
  activityColumns: STColumn[] = [
    { title: '時間', index: 'timestamp', type: 'date', width: '180px' },
    { title: '操作', index: 'action', width: '150px' },
    { title: '使用者', index: 'userId', width: '150px' },
    { title: '資源', index: 'resourceType', width: '120px' }
  ];

  eventColumns: STColumn[] = [
    { title: '時間', index: 'timestamp', type: 'date', width: '180px' },
    { title: '事件類型', index: 'eventType', width: '150px' },
    { title: '嚴重程度', index: 'severity', width: '100px' }
  ];

  commentColumns: STColumn[] = [
    { title: '時間', index: 'createdAt', type: 'date', width: '180px' },
    { title: '作者', index: 'author', width: '150px' },
    { title: '內容', index: 'content' }
  ];

  attachmentColumns: STColumn[] = [
    { title: '檔名', index: 'fileName' },
    { title: '類型', index: 'fileType', width: '120px' },
    { title: '大小', index: 'fileSize', width: '100px' },
    { title: '上傳時間', index: 'uploadedAt', type: 'date', width: '180px' }
  ];

  changeHistoryColumns: STColumn[] = [
    { title: '時間', index: 'timestamp', type: 'date', width: '180px' },
    { title: '變更類型', index: 'changeType', width: '120px' },
    { title: '欄位', index: 'field', width: '150px' },
    { title: '操作者', index: 'userId', width: '150px' }
  ];

  ngOnInit(): void {
    // Load data for all sub-modules (stub data will be returned)
    this.activityLogService.load();
    this.systemEventService.load();
    this.commentService.load();
    this.attachmentService.load();
    this.changeHistoryService.load();
  }
}
