/**
 * Communication Module View Component
 * 通訊域視圖元件 - 顯示於藍圖詳情頁面的 Tab 中
 *
 * 功能：
 * - 通訊統計摘要
 * - 系統通知管理
 * - 群組訊息
 * - 任務提醒
 * - 推播通知設定
 *
 * @module CommunicationModuleViewComponent
 * @author GigHub Development Team
 * @date 2025-12-17
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input, signal, computed } from '@angular/core';
import { GroupMessageService } from '@core/blueprint/modules/implementations/communication/services/group-message.service';
import { PushNotificationService } from '@core/blueprint/modules/implementations/communication/services/push-notification.service';
import { SystemNotificationService } from '@core/blueprint/modules/implementations/communication/services/system-notification.service';
import { TaskReminderService } from '@core/blueprint/modules/implementations/communication/services/task-reminder.service';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';

/** 系統通知介面 */
interface SystemNotification {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: Date;
  sourceModule?: string;
}

/** 群組訊息介面 */
interface GroupMessage {
  id: string;
  groupName: string;
  senderName: string;
  senderAvatar?: string;
  message: string;
  attachments?: number;
  createdAt: Date;
  unreadCount?: number;
}

/** 任務提醒介面 */
interface TaskReminder {
  id: string;
  taskName: string;
  reminderType: 'deadline' | 'overdue' | 'assignment' | 'update';
  dueDate?: Date;
  priority: 'high' | 'medium' | 'low';
  isActive: boolean;
  createdAt: Date;
}

/** 推播設定介面 */
interface PushSetting {
  id: string;
  name: string;
  category: string;
  description: string;
  enabled: boolean;
  channels: Array<'email' | 'push' | 'sms'>;
}

@Component({
  selector: 'app-communication-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzStatisticModule, NzEmptyModule, NzAlertModule, NzTimelineModule, NzListModule, NzAvatarModule],
  template: `
    <!-- Statistics Card -->
    <nz-card nzTitle="通訊統計" [nzExtra]="statsExtra" class="mb-md">
      <ng-template #statsExtra>
        <button nz-button nzType="link" (click)="refreshData()">
          <span nz-icon nzType="reload"></span>
          重新整理
        </button>
      </ng-template>

      @if (loading()) {
        <div style="text-align: center; padding: 24px;">
          <nz-spin nzSimple></nz-spin>
        </div>
      } @else {
        <nz-row [nzGutter]="[16, 16]">
          <nz-col [nzXs]="12" [nzSm]="6">
            <nz-card nzSize="small" [nzHoverable]="true" (click)="activeTabIndex = 0">
              <nz-statistic [nzValue]="notifications().length" nzTitle="系統通知" [nzPrefix]="notifyIcon" />
              <ng-template #notifyIcon>
                <span nz-icon nzType="bell" style="color: #1890ff;"></span>
              </ng-template>
              <div class="stat-detail">
                @if (unreadNotificationCount() > 0) {
                  <span class="warning">{{ unreadNotificationCount() }} 則未讀</span>
                } @else {
                  <span class="success">全部已讀</span>
                }
              </div>
            </nz-card>
          </nz-col>
          <nz-col [nzXs]="12" [nzSm]="6">
            <nz-card nzSize="small" [nzHoverable]="true" (click)="activeTabIndex = 1">
              <nz-statistic [nzValue]="messages().length" nzTitle="群組訊息" [nzPrefix]="msgIcon" />
              <ng-template #msgIcon>
                <span nz-icon nzType="message" style="color: #52c41a;"></span>
              </ng-template>
              <div class="stat-detail">
                @if (unreadMessageCount() > 0) {
                  <span class="warning">{{ unreadMessageCount() }} 則未讀</span>
                } @else {
                  <span>暫無新訊息</span>
                }
              </div>
            </nz-card>
          </nz-col>
          <nz-col [nzXs]="12" [nzSm]="6">
            <nz-card nzSize="small" [nzHoverable]="true" (click)="activeTabIndex = 2">
              <nz-statistic [nzValue]="reminders().length" nzTitle="任務提醒" [nzPrefix]="reminderIcon" />
              <ng-template #reminderIcon>
                <span nz-icon nzType="clock-circle" style="color: #faad14;"></span>
              </ng-template>
              <div class="stat-detail">
                @if (activeReminderCount() > 0) {
                  <span class="warning">{{ activeReminderCount() }} 則待處理</span>
                } @else {
                  <span class="success">暫無待處理</span>
                }
              </div>
            </nz-card>
          </nz-col>
          <nz-col [nzXs]="12" [nzSm]="6">
            <nz-card nzSize="small" [nzHoverable]="true" (click)="activeTabIndex = 3">
              <nz-statistic [nzValue]="pushSettings().length" nzTitle="推播設定" [nzPrefix]="pushIcon" />
              <ng-template #pushIcon>
                <span nz-icon nzType="notification" style="color: #722ed1;"></span>
              </ng-template>
              <div class="stat-detail">
                <span>{{ enabledPushCount() }} 項已啟用</span>
              </div>
            </nz-card>
          </nz-col>
        </nz-row>
      }
    </nz-card>

    <!-- Communication Tabs -->
    <nz-card>
      <nz-tabset [(nzSelectedIndex)]="activeTabIndex">
        <!-- 系統通知 Tab -->
        <nz-tab nzTitle="系統通知">
          <ng-template nz-tab>
            <div class="tab-header mb-md">
              <nz-row [nzGutter]="16" nzAlign="middle">
                <nz-col [nzFlex]="1">
                  @if (unreadNotificationCount() > 0) {
                    <nz-alert nzType="warning" [nzMessage]="notifyAlertMsg" nzShowIcon></nz-alert>
                    <ng-template #notifyAlertMsg> 您有 {{ unreadNotificationCount() }} 則未讀通知 </ng-template>
                  } @else {
                    <nz-alert nzType="success" nzMessage="所有通知已讀取" nzShowIcon></nz-alert>
                  }
                </nz-col>
                <nz-col>
                  <nz-space>
                    <button *nzSpaceItem nz-button (click)="markAllAsRead()">
                      <span nz-icon nzType="check"></span>
                      全部已讀
                    </button>
                    <button *nzSpaceItem nz-button nzType="default" nzDanger (click)="clearAllNotifications()">
                      <span nz-icon nzType="delete"></span>
                      清除全部
                    </button>
                  </nz-space>
                </nz-col>
              </nz-row>
            </div>

            @if (notifications().length === 0) {
              <nz-empty nzNotFoundContent="暫無系統通知"></nz-empty>
            } @else {
              <nz-row [nzGutter]="24">
                <nz-col [nzXs]="24" [nzLg]="16">
                  <st [data]="notifications()" [columns]="notificationColumns" [loading]="loading()" />
                </nz-col>
                <nz-col [nzXs]="24" [nzLg]="8">
                  <nz-card nzTitle="最近通知" nzSize="small">
                    <nz-timeline>
                      @for (notif of notifications().slice(0, 5); track notif.id) {
                        <nz-timeline-item [nzColor]="getNotificationTimelineColor(notif.type)">
                          <div class="timeline-item">
                            <div class="timeline-header">
                              <strong [class.unread]="!notif.isRead">{{ notif.title }}</strong>
                            </div>
                            <p class="timeline-content">{{ notif.content }}</p>
                            <span class="timeline-time">{{ notif.createdAt | date: 'MM-dd HH:mm' }}</span>
                          </div>
                        </nz-timeline-item>
                      }
                    </nz-timeline>
                  </nz-card>
                </nz-col>
              </nz-row>
            }
          </ng-template>
        </nz-tab>

        <!-- 群組訊息 Tab -->
        <nz-tab nzTitle="群組訊息">
          <ng-template nz-tab>
            <div class="tab-header mb-md">
              <nz-row [nzGutter]="16" nzAlign="middle">
                <nz-col [nzFlex]="1">
                  <nz-alert nzType="info" [nzMessage]="msgAlertMsg" nzShowIcon></nz-alert>
                  <ng-template #msgAlertMsg> 共 {{ messages().length }} 個群組對話 </ng-template>
                </nz-col>
                <nz-col>
                  <button nz-button nzType="primary" (click)="createGroup()">
                    <span nz-icon nzType="plus"></span>
                    建立群組
                  </button>
                </nz-col>
              </nz-row>
            </div>

            @if (messages().length === 0) {
              <nz-empty nzNotFoundContent="暫無群組訊息">
                <ng-template nz-empty-footer>
                  <button nz-button nzType="primary" (click)="createGroup()">
                    <span nz-icon nzType="plus"></span>
                    建立第一個群組
                  </button>
                </ng-template>
              </nz-empty>
            } @else {
              <nz-list nzItemLayout="horizontal" [nzLoading]="loading()">
                @for (msg of messages(); track msg.id) {
                  <nz-list-item [nzActions]="[viewAction, replyAction]">
                    <ng-template #viewAction>
                      <a (click)="viewMessage(msg)">查看</a>
                    </ng-template>
                    <ng-template #replyAction>
                      <a (click)="replyMessage(msg)">回覆</a>
                    </ng-template>
                    <nz-list-item-meta [nzAvatar]="avatarTpl" [nzTitle]="titleTpl" [nzDescription]="msg.message">
                      <ng-template #avatarTpl>
                        <nz-avatar [nzText]="msg.groupName.charAt(0)" [style.background-color]="getAvatarColor(msg.groupName)"></nz-avatar>
                      </ng-template>
                      <ng-template #titleTpl>
                        <span>{{ msg.groupName }}</span>
                        @if (msg.unreadCount && msg.unreadCount > 0) {
                          <nz-badge [nzCount]="msg.unreadCount" nzSize="small" style="margin-left: 8px;"></nz-badge>
                        }
                        <span class="text-grey" style="margin-left: 12px; font-size: 12px;">
                          {{ msg.senderName }} · {{ msg.createdAt | date: 'MM-dd HH:mm' }}
                        </span>
                      </ng-template>
                    </nz-list-item-meta>
                  </nz-list-item>
                }
              </nz-list>
            }
          </ng-template>
        </nz-tab>

        <!-- 任務提醒 Tab -->
        <nz-tab nzTitle="任務提醒">
          <ng-template nz-tab>
            <div class="tab-header mb-md">
              <nz-row [nzGutter]="16" nzAlign="middle">
                <nz-col [nzFlex]="1">
                  @if (activeReminderCount() > 0) {
                    <nz-alert nzType="warning" [nzMessage]="reminderAlertMsg" nzShowIcon></nz-alert>
                    <ng-template #reminderAlertMsg> 您有 {{ activeReminderCount() }} 則待處理提醒 </ng-template>
                  } @else {
                    <nz-alert nzType="success" nzMessage="暫無待處理提醒" nzShowIcon></nz-alert>
                  }
                </nz-col>
                <nz-col>
                  <button nz-button nzType="primary" (click)="createReminder()">
                    <span nz-icon nzType="plus"></span>
                    新增提醒
                  </button>
                </nz-col>
              </nz-row>
            </div>

            @if (reminders().length === 0) {
              <nz-empty nzNotFoundContent="暫無任務提醒"></nz-empty>
            } @else {
              <st [data]="reminders()" [columns]="reminderColumns" [loading]="loading()" />
            }
          </ng-template>
        </nz-tab>

        <!-- 推播設定 Tab -->
        <nz-tab nzTitle="推播設定">
          <ng-template nz-tab>
            <div class="tab-header mb-md">
              <nz-alert nzType="info" nzMessage="管理您的通知偏好設定，選擇希望接收通知的方式" nzShowIcon></nz-alert>
            </div>

            @if (pushSettings().length === 0) {
              <nz-empty nzNotFoundContent="暫無推播設定"></nz-empty>
            } @else {
              <nz-row [nzGutter]="[16, 16]">
                @for (setting of pushSettings(); track setting.id) {
                  <nz-col [nzXs]="24" [nzMd]="12">
                    <nz-card nzSize="small" [nzHoverable]="true">
                      <div class="push-setting-card">
                        <div class="push-setting-header">
                          <div class="push-setting-info">
                            <h4>{{ setting.name }}</h4>
                            <nz-tag>{{ setting.category }}</nz-tag>
                          </div>
                          <nz-switch [ngModel]="setting.enabled" (ngModelChange)="togglePushSetting(setting, $event)"></nz-switch>
                        </div>
                        <p class="text-grey">{{ setting.description }}</p>
                        <div class="push-channels">
                          <span class="channel-label">通知管道：</span>
                          @for (channel of setting.channels; track channel) {
                            <nz-tag [nzColor]="getChannelColor(channel)">
                              <span nz-icon [nzType]="getChannelIcon(channel)"></span>
                              {{ getChannelName(channel) }}
                            </nz-tag>
                          }
                        </div>
                      </div>
                    </nz-card>
                  </nz-col>
                }
              </nz-row>
            }
          </ng-template>
        </nz-tab>
      </nz-tabset>
    </nz-card>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .stat-detail {
        margin-top: 8px;
        font-size: 12px;
        color: #666;
      }

      .stat-detail .success {
        color: #52c41a;
      }

      .stat-detail .warning {
        color: #faad14;
      }

      .tab-header {
        padding: 8px 0;
      }

      .timeline-item {
        padding: 4px 0;
      }

      .timeline-header {
        margin-bottom: 4px;
      }

      .timeline-header .unread {
        color: #1890ff;
      }

      .timeline-content {
        font-size: 12px;
        color: #666;
        margin: 4px 0;
      }

      .timeline-time {
        font-size: 11px;
        color: #999;
      }

      .text-grey {
        color: #999;
      }

      .mb-md {
        margin-bottom: 16px;
      }

      .push-setting-card h4 {
        margin: 0 0 8px 0;
        display: inline-block;
      }

      .push-setting-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 8px;
      }

      .push-setting-info {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .push-setting-card p {
        font-size: 12px;
        margin-bottom: 12px;
      }

      .push-channels {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-wrap: wrap;
      }

      .channel-label {
        font-size: 12px;
        color: #666;
        margin-right: 4px;
      }
    `
  ]
})
export class CommunicationModuleViewComponent implements OnInit {
  blueprintId = input.required<string>();

  readonly notificationService = inject(SystemNotificationService);
  readonly messageService = inject(GroupMessageService);
  readonly reminderService = inject(TaskReminderService);
  readonly pushService = inject(PushNotificationService);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  // 狀態
  loading = signal(false);
  activeTabIndex = 0;

  // 資料
  notifications = signal<SystemNotification[]>([]);
  messages = signal<GroupMessage[]>([]);
  reminders = signal<TaskReminder[]>([]);
  pushSettings = signal<PushSetting[]>([]);

  // 計算屬性
  unreadNotificationCount = computed(() => this.notifications().filter(n => !n.isRead).length);

  unreadMessageCount = computed(() => this.messages().reduce((sum, m) => sum + (m.unreadCount || 0), 0));

  activeReminderCount = computed(() => this.reminders().filter(r => r.isActive).length);

  enabledPushCount = computed(() => this.pushSettings().filter(s => s.enabled).length);

  // 通知欄位
  notificationColumns: STColumn[] = [
    {
      title: '',
      index: 'isRead',
      width: 40,
      format: (item: SystemNotification) => (item.isRead ? '' : '●'),
      className: 'text-center'
    },
    { title: '標題', index: 'title', width: 200 },
    { title: '內容', index: 'content' },
    {
      title: '類型',
      index: 'type',
      width: 80,
      type: 'badge',
      badge: {
        info: { text: '資訊', color: 'processing' },
        success: { text: '成功', color: 'success' },
        warning: { text: '警告', color: 'warning' },
        error: { text: '錯誤', color: 'error' }
      }
    },
    { title: '來源', index: 'sourceModule', width: 100 },
    { title: '時間', index: 'createdAt', type: 'date', dateFormat: 'MM-dd HH:mm', width: 120 },
    {
      title: '操作',
      width: 120,
      buttons: [
        {
          text: '已讀',
          click: (record: SystemNotification) => this.markAsRead(record),
          iif: (record: SystemNotification) => !record.isRead
        },
        { text: '刪除', click: (record: SystemNotification) => this.deleteNotification(record) }
      ]
    }
  ];

  // 提醒欄位
  reminderColumns: STColumn[] = [
    { title: '任務名稱', index: 'taskName', width: 200 },
    {
      title: '類型',
      index: 'reminderType',
      width: 100,
      type: 'badge',
      badge: {
        deadline: { text: '到期提醒', color: 'warning' },
        overdue: { text: '逾期提醒', color: 'error' },
        assignment: { text: '指派通知', color: 'processing' },
        update: { text: '更新通知', color: 'default' }
      }
    },
    {
      title: '優先級',
      index: 'priority',
      width: 80,
      type: 'badge',
      badge: {
        high: { text: '高', color: 'error' },
        medium: { text: '中', color: 'warning' },
        low: { text: '低', color: 'default' }
      }
    },
    { title: '到期日', index: 'dueDate', type: 'date', dateFormat: 'yyyy-MM-dd', width: 120 },
    {
      title: '狀態',
      index: 'isActive',
      width: 80,
      type: 'yn',
      yn: { truth: true, yes: '待處理', no: '已處理' }
    },
    {
      title: '操作',
      width: 150,
      buttons: [
        { text: '完成', click: (record: TaskReminder) => this.completeReminder(record), iif: (record: TaskReminder) => record.isActive },
        { text: '延後', click: (record: TaskReminder) => this.postponeReminder(record), iif: (record: TaskReminder) => record.isActive },
        { text: '查看任務', click: (record: TaskReminder) => this.viewTask(record) }
      ]
    }
  ];

  ngOnInit(): void {
    this.loadAllData();
  }

  /** 載入所有資料 */
  private loadAllData(): void {
    this.loading.set(true);

    // 載入服務資料
    this.notificationService.load();
    this.messageService.load();
    this.reminderService.load();
    this.pushService.load();

    // 載入模擬資料
    this.loadMockData();
  }

  /** 載入模擬資料 */
  private loadMockData(): void {
    setTimeout(() => {
      const now = new Date();

      // 系統通知
      this.notifications.set([
        {
          id: '1',
          title: '任務指派通知',
          content: '您被指派了新任務「結構工程審核」',
          type: 'info',
          isRead: false,
          createdAt: new Date(now.getTime() - 30 * 60 * 1000),
          sourceModule: '任務管理'
        },
        {
          id: '2',
          title: '審批已通過',
          content: '您提交的請款單 INV-20251217-001 已通過審批',
          type: 'success',
          isRead: false,
          createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
          sourceModule: '財務'
        },
        {
          id: '3',
          title: '任務即將到期',
          content: '任務「材料採購」將於明天到期，請儘快處理',
          type: 'warning',
          isRead: true,
          createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
          sourceModule: '任務管理'
        },
        {
          id: '4',
          title: '系統維護通知',
          content: '系統將於本週六凌晨 2:00-4:00 進行維護',
          type: 'info',
          isRead: true,
          createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          sourceModule: '系統'
        },
        {
          id: '5',
          title: '品質檢驗失敗',
          content: 'A棟 3F 混凝土強度檢驗未達標準',
          type: 'error',
          isRead: false,
          createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
          sourceModule: '品質管理'
        }
      ]);

      // 群組訊息
      this.messages.set([
        {
          id: '1',
          groupName: '專案管理群組',
          senderName: '王經理',
          message: '今天下午 3 點開會討論下週進度',
          attachments: 1,
          createdAt: new Date(now.getTime() - 15 * 60 * 1000),
          unreadCount: 3
        },
        {
          id: '2',
          groupName: '工程討論區',
          senderName: '李工程師',
          message: '鋼筋綁紮已完成，請安排檢驗',
          createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
          unreadCount: 1
        },
        {
          id: '3',
          groupName: '財務團隊',
          senderName: '陳會計',
          message: '本月請款單已全部處理完成',
          createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
          unreadCount: 0
        },
        {
          id: '4',
          groupName: '安全督導群組',
          senderName: '張安全官',
          message: '本週安全巡檢報告已上傳，請查閱',
          attachments: 2,
          createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
          unreadCount: 0
        }
      ]);

      // 任務提醒
      this.reminders.set([
        {
          id: '1',
          taskName: '材料採購確認',
          reminderType: 'deadline',
          dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
          priority: 'high',
          isActive: true,
          createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          id: '2',
          taskName: '結構工程審核',
          reminderType: 'assignment',
          priority: 'medium',
          isActive: true,
          createdAt: new Date(now.getTime() - 30 * 60 * 1000)
        },
        {
          id: '3',
          taskName: '月度報告提交',
          reminderType: 'overdue',
          dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          priority: 'high',
          isActive: true,
          createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
        },
        {
          id: '4',
          taskName: '安全設備檢查',
          reminderType: 'update',
          priority: 'low',
          isActive: false,
          createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        }
      ]);

      // 推播設定
      this.pushSettings.set([
        {
          id: '1',
          name: '任務指派通知',
          category: '任務',
          description: '當有新任務指派給您時發送通知',
          enabled: true,
          channels: ['email', 'push']
        },
        {
          id: '2',
          name: '任務到期提醒',
          category: '任務',
          description: '在任務到期前一天發送提醒',
          enabled: true,
          channels: ['email', 'push', 'sms']
        },
        {
          id: '3',
          name: '審批通知',
          category: '流程',
          description: '當有待審批項目或審批結果時通知',
          enabled: true,
          channels: ['email', 'push']
        },
        {
          id: '4',
          name: '系統公告',
          category: '系統',
          description: '接收系統維護和重要公告',
          enabled: false,
          channels: ['email']
        },
        {
          id: '5',
          name: '品質異常警報',
          category: '品質',
          description: '當品質檢驗不合格時立即通知',
          enabled: true,
          channels: ['push', 'sms']
        },
        {
          id: '6',
          name: '財務通知',
          category: '財務',
          description: '請款單、付款單相關通知',
          enabled: true,
          channels: ['email']
        }
      ]);

      this.loading.set(false);
    }, 500);
  }

  /** 重新整理資料 */
  refreshData(): void {
    this.loadAllData();
    this.message.success('資料已重新整理');
  }

  /** 標記通知為已讀 */
  markAsRead(notification: SystemNotification): void {
    this.notifications.update(list => list.map(n => (n.id === notification.id ? { ...n, isRead: true } : n)));
    this.message.success('已標記為已讀');
  }

  /** 標記所有通知為已讀 */
  markAllAsRead(): void {
    this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
    this.message.success('已全部標記為已讀');
  }

  /** 刪除通知 */
  deleteNotification(notification: SystemNotification): void {
    this.modal.confirm({
      nzTitle: '確認刪除',
      nzContent: `確定要刪除通知「${notification.title}」嗎？`,
      nzOnOk: () => {
        this.notifications.update(list => list.filter(n => n.id !== notification.id));
        this.message.success('已刪除通知');
      }
    });
  }

  /** 清除所有通知 */
  clearAllNotifications(): void {
    this.modal.confirm({
      nzTitle: '確認清除',
      nzContent: '確定要清除所有通知嗎？此操作無法復原。',
      nzOkDanger: true,
      nzOnOk: () => {
        this.notifications.set([]);
        this.message.success('已清除所有通知');
      }
    });
  }

  /** 取得通知時間軸顏色 */
  getNotificationTimelineColor(type: string): string {
    const colorMap: Record<string, string> = {
      info: 'blue',
      success: 'green',
      warning: 'orange',
      error: 'red'
    };
    return colorMap[type] || 'gray';
  }

  /** 建立群組 */
  createGroup(): void {
    this.message.info('建立群組功能開發中');
  }

  /** 查看訊息 */
  viewMessage(msg: GroupMessage): void {
    this.modal.info({
      nzTitle: msg.groupName,
      nzContent: `
        <p><strong>發送者：</strong>${msg.senderName}</p>
        <p><strong>訊息：</strong>${msg.message}</p>
        <p><strong>時間：</strong>${msg.createdAt.toLocaleString()}</p>
        ${msg.attachments ? `<p><strong>附件：</strong>${msg.attachments} 個檔案</p>` : ''}
      `
    });
  }

  /** 回覆訊息 */
  replyMessage(msg: GroupMessage): void {
    this.message.info(`回覆「${msg.groupName}」功能開發中`);
  }

  /** 取得頭像顏色 */
  getAvatarColor(name: string): string {
    const colors = ['#f56a00', '#7265e6', '#ffbf00', '#00a2ae', '#eb2f96', '#1890ff'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }

  /** 新增提醒 */
  createReminder(): void {
    this.message.info('新增提醒功能開發中');
  }

  /** 完成提醒 */
  completeReminder(reminder: TaskReminder): void {
    this.reminders.update(list => list.map(r => (r.id === reminder.id ? { ...r, isActive: false } : r)));
    this.message.success('已完成提醒');
  }

  /** 延後提醒 */
  postponeReminder(reminder: TaskReminder): void {
    this.message.info(`延後「${reminder.taskName}」提醒功能開發中`);
  }

  /** 查看任務 */
  viewTask(reminder: TaskReminder): void {
    this.message.info(`查看任務「${reminder.taskName}」`);
  }

  /** 切換推播設定 */
  togglePushSetting(setting: PushSetting, enabled: boolean): void {
    this.pushSettings.update(list => list.map(s => (s.id === setting.id ? { ...s, enabled } : s)));
    this.message.success(`已${enabled ? '啟用' : '停用'}「${setting.name}」`);
  }

  /** 取得管道顏色 */
  getChannelColor(channel: string): string {
    const colorMap: Record<string, string> = {
      email: 'blue',
      push: 'green',
      sms: 'orange'
    };
    return colorMap[channel] || 'default';
  }

  /** 取得管道圖示 */
  getChannelIcon(channel: string): string {
    const iconMap: Record<string, string> = {
      email: 'mail',
      push: 'bell',
      sms: 'mobile'
    };
    return iconMap[channel] || 'notification';
  }

  /** 取得管道名稱 */
  getChannelName(channel: string): string {
    const nameMap: Record<string, string> = {
      email: '電子郵件',
      push: '推播通知',
      sms: '簡訊'
    };
    return nameMap[channel] || channel;
  }
}
