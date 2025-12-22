/**
 * Workflow Module View Component
 * 流程域視圖元件 - 顯示於藍圖詳情頁面的 Tab 中
 *
 * 功能：
 * - 流程統計摘要
 * - 自訂流程管理 (工作流程設計)
 * - 狀態機管理
 * - 自動化觸發器
 * - 審批流程追蹤
 * - 流程範本管理
 *
 * @module WorkflowModuleViewComponent
 * @author GigHub Development Team
 * @date 2025-12-17
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input, signal, computed } from '@angular/core';
import { WorkflowStatus } from '@core/blueprint/modules/implementations/workflow/models';
import { ApprovalService } from '@core/blueprint/modules/implementations/workflow/services/approval.service';
import { AutomationService } from '@core/blueprint/modules/implementations/workflow/services/automation.service';
import { CustomWorkflowService } from '@core/blueprint/modules/implementations/workflow/services/custom-workflow.service';
import { StateMachineService } from '@core/blueprint/modules/implementations/workflow/services/state-machine.service';
import { TemplateService } from '@core/blueprint/modules/implementations/workflow/services/template.service';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';

/** 自訂流程介面 */
interface CustomWorkflow {
  id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  currentStep: number;
  totalSteps: number;
  assigneeName?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** 狀態機介面 */
interface StateMachine {
  id: string;
  name: string;
  currentState: string;
  states: string[];
  transitions: number;
  createdAt: Date;
}

/** 自動化觸發器介面 */
interface AutomationTrigger {
  id: string;
  name: string;
  triggerType: 'event' | 'schedule' | 'condition';
  enabled: boolean;
  lastTriggered?: Date;
  executionCount: number;
}

/** 審批流程介面 */
interface ApprovalWorkflow {
  id: string;
  title: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected' | 'in_progress';
  currentApprover?: string;
  submittedAt: Date;
  priority: 'high' | 'medium' | 'low';
}

/** 流程範本介面 */
interface WorkflowTemplate {
  id: string;
  name: string;
  category: string;
  description?: string;
  usageCount: number;
  createdAt: Date;
}

@Component({
  selector: 'app-workflow-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzStatisticModule, NzAlertModule, NzEmptyModule, NzStepsModule, NzTimelineModule],
  template: `
    <!-- Statistics Card -->
    <nz-card nzTitle="流程統計" [nzExtra]="statsExtra" class="mb-md">
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
              <nz-statistic [nzValue]="workflows().length" nzTitle="自訂流程" [nzPrefix]="workflowIcon" />
              <ng-template #workflowIcon>
                <span nz-icon nzType="apartment" style="color: #1890ff;"></span>
              </ng-template>
              <div class="stat-detail">
                <span class="success">{{ activeWorkflowCount() }} 進行中</span>
              </div>
            </nz-card>
          </nz-col>
          <nz-col [nzXs]="12" [nzSm]="6">
            <nz-card nzSize="small" [nzHoverable]="true" (click)="activeTabIndex = 1">
              <nz-statistic [nzValue]="stateMachines().length" nzTitle="狀態機" [nzPrefix]="stateIcon" />
              <ng-template #stateIcon>
                <span nz-icon nzType="cluster" style="color: #52c41a;"></span>
              </ng-template>
              <div class="stat-detail">
                <span>管理狀態轉換</span>
              </div>
            </nz-card>
          </nz-col>
          <nz-col [nzXs]="12" [nzSm]="6">
            <nz-card nzSize="small" [nzHoverable]="true" (click)="activeTabIndex = 2">
              <nz-statistic [nzValue]="automations().length" nzTitle="自動化觸發" [nzPrefix]="autoIcon" />
              <ng-template #autoIcon>
                <span nz-icon nzType="robot" style="color: #faad14;"></span>
              </ng-template>
              <div class="stat-detail">
                <span class="success">{{ enabledAutomationCount() }} 已啟用</span>
              </div>
            </nz-card>
          </nz-col>
          <nz-col [nzXs]="12" [nzSm]="6">
            <nz-card nzSize="small" [nzHoverable]="true" (click)="activeTabIndex = 3">
              <nz-statistic [nzValue]="approvals().length" nzTitle="審批流程" [nzPrefix]="approvalIcon" />
              <ng-template #approvalIcon>
                <span nz-icon nzType="audit" style="color: #eb2f96;"></span>
              </ng-template>
              <div class="stat-detail">
                <span class="warning">{{ pendingApprovalCount() }} 待審批</span>
              </div>
            </nz-card>
          </nz-col>
        </nz-row>
      }
    </nz-card>

    <!-- Workflow Tabs -->
    <nz-card>
      <nz-tabset [(nzSelectedIndex)]="activeTabIndex">
        <!-- 自訂流程 Tab -->
        <nz-tab nzTitle="自訂流程">
          <ng-template nz-tab>
            <div class="tab-header mb-md">
              <nz-row [nzGutter]="16" nzAlign="middle">
                <nz-col [nzFlex]="1">
                  <nz-alert nzType="info" [nzMessage]="workflowAlertMsg" nzShowIcon></nz-alert>
                  <ng-template #workflowAlertMsg>
                    共 {{ workflows().length }} 個自訂流程，{{ activeWorkflowCount() }} 個進行中
                  </ng-template>
                </nz-col>
                <nz-col>
                  <button nz-button nzType="primary" (click)="createWorkflow()">
                    <span nz-icon nzType="plus"></span>
                    建立流程
                  </button>
                </nz-col>
              </nz-row>
            </div>

            @if (workflows().length === 0) {
              <nz-empty nzNotFoundContent="暫無自訂流程">
                <ng-template nz-empty-footer>
                  <button nz-button nzType="primary" (click)="createWorkflow()">
                    <span nz-icon nzType="plus"></span>
                    建立第一個流程
                  </button>
                </ng-template>
              </nz-empty>
            } @else {
              <st [data]="workflows()" [columns]="workflowColumns" [loading]="loading()" />
            }
          </ng-template>
        </nz-tab>

        <!-- 狀態機 Tab -->
        <nz-tab nzTitle="狀態機">
          <ng-template nz-tab>
            <div class="tab-header mb-md">
              <nz-row [nzGutter]="16" nzAlign="middle">
                <nz-col [nzFlex]="1">
                  <nz-alert nzType="success" [nzMessage]="stateMachineAlertMsg" nzShowIcon></nz-alert>
                  <ng-template #stateMachineAlertMsg> 共 {{ stateMachines().length }} 個狀態機配置 </ng-template>
                </nz-col>
                <nz-col>
                  <button nz-button nzType="primary" (click)="createStateMachine()">
                    <span nz-icon nzType="plus"></span>
                    建立狀態機
                  </button>
                </nz-col>
              </nz-row>
            </div>

            @if (stateMachines().length === 0) {
              <nz-empty nzNotFoundContent="暫無狀態機配置">
                <ng-template nz-empty-footer>
                  <button nz-button nzType="primary" (click)="createStateMachine()">
                    <span nz-icon nzType="plus"></span>
                    建立狀態機
                  </button>
                </ng-template>
              </nz-empty>
            } @else {
              <st [data]="stateMachines()" [columns]="stateMachineColumns" [loading]="loading()" />
            }
          </ng-template>
        </nz-tab>

        <!-- 自動化觸發 Tab -->
        <nz-tab nzTitle="自動化觸發">
          <ng-template nz-tab>
            <div class="tab-header mb-md">
              <nz-row [nzGutter]="16" nzAlign="middle">
                <nz-col [nzFlex]="1">
                  <nz-alert nzType="warning" [nzMessage]="automationAlertMsg" nzShowIcon></nz-alert>
                  <ng-template #automationAlertMsg>
                    共 {{ automations().length }} 個自動化觸發器，{{ enabledAutomationCount() }} 個已啟用
                  </ng-template>
                </nz-col>
                <nz-col>
                  <button nz-button nzType="primary" (click)="createAutomation()">
                    <span nz-icon nzType="plus"></span>
                    新增觸發器
                  </button>
                </nz-col>
              </nz-row>
            </div>

            @if (automations().length === 0) {
              <nz-empty nzNotFoundContent="暫無自動化觸發器">
                <ng-template nz-empty-footer>
                  <button nz-button nzType="primary" (click)="createAutomation()">
                    <span nz-icon nzType="plus"></span>
                    建立觸發器
                  </button>
                </ng-template>
              </nz-empty>
            } @else {
              <st [data]="automations()" [columns]="automationColumns" [loading]="loading()" />
            }
          </ng-template>
        </nz-tab>

        <!-- 審批流程 Tab -->
        <nz-tab nzTitle="審批流程">
          <ng-template nz-tab>
            <div class="tab-header mb-md">
              <nz-row [nzGutter]="16" nzAlign="middle">
                <nz-col [nzFlex]="1">
                  @if (pendingApprovalCount() > 0) {
                    <nz-alert nzType="warning" [nzMessage]="approvalAlertMsg" nzShowIcon></nz-alert>
                    <ng-template #approvalAlertMsg> 您有 {{ pendingApprovalCount() }} 筆待審批項目 </ng-template>
                  } @else {
                    <nz-alert nzType="success" nzMessage="目前沒有待審批項目" nzShowIcon></nz-alert>
                  }
                </nz-col>
              </nz-row>
            </div>

            @if (approvals().length === 0) {
              <nz-empty nzNotFoundContent="暫無審批流程"></nz-empty>
            } @else {
              <nz-row [nzGutter]="24">
                <nz-col [nzXs]="24" [nzLg]="16">
                  <st [data]="approvals()" [columns]="approvalColumns" [loading]="loading()" />
                </nz-col>
                <nz-col [nzXs]="24" [nzLg]="8">
                  <nz-card nzTitle="審批時間軸" nzSize="small">
                    <nz-timeline>
                      @for (approval of approvals().slice(0, 5); track approval.id) {
                        <nz-timeline-item [nzColor]="getApprovalTimelineColor(approval.status)">
                          <div class="timeline-item">
                            <strong>{{ approval.title }}</strong>
                            <div class="timeline-meta">
                              <nz-tag [nzColor]="getApprovalStatusColor(approval.status)">
                                {{ getApprovalStatusText(approval.status) }}
                              </nz-tag>
                              <span class="text-grey">{{ approval.submittedAt | date: 'MM-dd HH:mm' }}</span>
                            </div>
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

        <!-- 流程範本 Tab -->
        <nz-tab nzTitle="流程範本">
          <ng-template nz-tab>
            <div class="tab-header mb-md">
              <nz-row [nzGutter]="16" nzAlign="middle">
                <nz-col [nzFlex]="1">
                  <nz-alert nzType="info" [nzMessage]="templateAlertMsg" nzShowIcon></nz-alert>
                  <ng-template #templateAlertMsg> 共 {{ templates().length }} 個流程範本可供使用 </ng-template>
                </nz-col>
                <nz-col>
                  <button nz-button nzType="primary" (click)="createTemplate()">
                    <span nz-icon nzType="plus"></span>
                    建立範本
                  </button>
                </nz-col>
              </nz-row>
            </div>

            @if (templates().length === 0) {
              <nz-empty nzNotFoundContent="暫無流程範本">
                <ng-template nz-empty-footer>
                  <button nz-button nzType="primary" (click)="createTemplate()">
                    <span nz-icon nzType="plus"></span>
                    建立範本
                  </button>
                </ng-template>
              </nz-empty>
            } @else {
              <nz-row [nzGutter]="[16, 16]">
                @for (template of templates(); track template.id) {
                  <nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
                    <nz-card nzSize="small" [nzHoverable]="true" (click)="useTemplate(template)">
                      <div class="template-card">
                        <div class="template-header">
                          <span nz-icon nzType="file-text" style="font-size: 24px; color: #722ed1;"></span>
                          <nz-tag>{{ template.category }}</nz-tag>
                        </div>
                        <h4>{{ template.name }}</h4>
                        <p class="text-grey">{{ template.description || '無描述' }}</p>
                        <div class="template-footer">
                          <span>
                            <span nz-icon nzType="thunderbolt"></span>
                            已使用 {{ template.usageCount }} 次
                          </span>
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

      .timeline-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 4px;
      }

      .template-card {
        text-align: center;
      }

      .template-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .template-card h4 {
        margin: 8px 0;
      }

      .template-card p {
        font-size: 12px;
        margin-bottom: 12px;
      }

      .template-footer {
        font-size: 12px;
        color: #999;
      }

      .text-grey {
        color: #999;
      }

      .mb-md {
        margin-bottom: 16px;
      }
    `
  ]
})
export class WorkflowModuleViewComponent implements OnInit {
  blueprintId = input.required<string>();

  readonly customWorkflowService = inject(CustomWorkflowService);
  readonly stateMachineService = inject(StateMachineService);
  readonly automationService = inject(AutomationService);
  readonly templateService = inject(TemplateService);
  readonly approvalService = inject(ApprovalService);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  // 狀態
  loading = signal(false);
  activeTabIndex = 0;

  // 資料
  workflows = signal<CustomWorkflow[]>([]);
  stateMachines = signal<StateMachine[]>([]);
  automations = signal<AutomationTrigger[]>([]);
  approvals = signal<ApprovalWorkflow[]>([]);
  templates = signal<WorkflowTemplate[]>([]);

  // 計算屬性
  activeWorkflowCount = computed(() => this.workflows().filter(w => w.status === WorkflowStatus.IN_PROGRESS).length);

  enabledAutomationCount = computed(() => this.automations().filter(a => a.enabled).length);

  pendingApprovalCount = computed(() => this.approvals().filter(a => a.status === 'pending' || a.status === 'in_progress').length);

  // 自訂流程欄位
  workflowColumns: STColumn[] = [
    { title: '流程名稱', index: 'name', width: 180 },
    {
      title: '狀態',
      index: 'status',
      width: 100,
      type: 'badge',
      badge: {
        pending: { text: '待處理', color: 'default' },
        in_progress: { text: '進行中', color: 'processing' },
        completed: { text: '已完成', color: 'success' },
        rejected: { text: '已拒絕', color: 'error' }
      }
    },
    {
      title: '進度',
      index: 'currentStep',
      width: 120,
      format: (item: CustomWorkflow) => `${item.currentStep} / ${item.totalSteps}`
    },
    { title: '負責人', index: 'assigneeName', width: 120 },
    { title: '更新時間', index: 'updatedAt', type: 'date', dateFormat: 'yyyy-MM-dd HH:mm', width: 150 },
    {
      title: '操作',
      width: 150,
      buttons: [
        { text: '查看', click: (record: CustomWorkflow) => this.viewWorkflow(record) },
        { text: '編輯', click: (record: CustomWorkflow) => this.editWorkflow(record) }
      ]
    }
  ];

  // 狀態機欄位
  stateMachineColumns: STColumn[] = [
    { title: '名稱', index: 'name', width: 180 },
    { title: '當前狀態', index: 'currentState', width: 120 },
    {
      title: '狀態數',
      index: 'states',
      width: 100,
      format: (item: StateMachine) => `${item.states.length} 個`
    },
    { title: '轉換數', index: 'transitions', width: 100 },
    { title: '建立時間', index: 'createdAt', type: 'date', dateFormat: 'yyyy-MM-dd', width: 120 },
    {
      title: '操作',
      width: 150,
      buttons: [
        { text: '查看', click: (record: StateMachine) => this.viewStateMachine(record) },
        { text: '編輯', click: (record: StateMachine) => this.editStateMachine(record) }
      ]
    }
  ];

  // 自動化觸發器欄位
  automationColumns: STColumn[] = [
    { title: '名稱', index: 'name', width: 180 },
    {
      title: '類型',
      index: 'triggerType',
      width: 100,
      type: 'badge',
      badge: {
        event: { text: '事件', color: 'processing' },
        schedule: { text: '排程', color: 'success' },
        condition: { text: '條件', color: 'warning' }
      }
    },
    {
      title: '狀態',
      index: 'enabled',
      width: 80,
      type: 'yn',
      yn: { truth: true }
    },
    { title: '執行次數', index: 'executionCount', type: 'number', width: 100 },
    { title: '上次觸發', index: 'lastTriggered', type: 'date', dateFormat: 'MM-dd HH:mm', width: 120 },
    {
      title: '操作',
      width: 150,
      buttons: [
        { text: '查看', click: (record: AutomationTrigger) => this.viewAutomation(record) },
        {
          text: '啟用',
          click: (record: AutomationTrigger) => this.toggleAutomation(record),
          iif: (record: AutomationTrigger) => !record.enabled
        },
        {
          text: '停用',
          click: (record: AutomationTrigger) => this.toggleAutomation(record),
          iif: (record: AutomationTrigger) => record.enabled
        }
      ]
    }
  ];

  // 審批流程欄位
  approvalColumns: STColumn[] = [
    { title: '標題', index: 'title', width: 200 },
    { title: '類型', index: 'type', width: 100 },
    {
      title: '狀態',
      index: 'status',
      width: 100,
      type: 'badge',
      badge: {
        pending: { text: '待審批', color: 'warning' },
        in_progress: { text: '審核中', color: 'processing' },
        approved: { text: '已通過', color: 'success' },
        rejected: { text: '已拒絕', color: 'error' }
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
    { title: '當前審批人', index: 'currentApprover', width: 120 },
    { title: '提交時間', index: 'submittedAt', type: 'date', dateFormat: 'yyyy-MM-dd HH:mm', width: 150 },
    {
      title: '操作',
      width: 120,
      buttons: [
        {
          text: '審批',
          click: (record: ApprovalWorkflow) => this.processApproval(record),
          iif: (record: ApprovalWorkflow) => record.status === 'pending' || record.status === 'in_progress'
        },
        { text: '查看', click: (record: ApprovalWorkflow) => this.viewApproval(record) }
      ]
    }
  ];

  ngOnInit(): void {
    const blueprintId = this.blueprintId();
    this.loadAllData(blueprintId);
  }

  /** 載入所有資料 */
  private loadAllData(blueprintId: string): void {
    this.loading.set(true);

    // 載入服務資料
    this.customWorkflowService.load(blueprintId);
    this.stateMachineService.load(blueprintId);
    this.automationService.load(blueprintId);
    this.templateService.load(blueprintId);
    this.approvalService.load(blueprintId);

    // 載入模擬資料
    this.loadMockData();
  }

  /** 載入模擬資料 */
  private loadMockData(): void {
    setTimeout(() => {
      const now = new Date();

      // 自訂流程
      this.workflows.set([
        {
          id: '1',
          name: '新專案啟動流程',
          description: '專案啟動的標準流程',
          status: WorkflowStatus.IN_PROGRESS,
          currentStep: 2,
          totalSteps: 5,
          assigneeName: '王經理',
          createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
        },
        {
          id: '2',
          name: '變更管理流程',
          description: '處理設計變更的審批流程',
          status: WorkflowStatus.PENDING,
          currentStep: 1,
          totalSteps: 4,
          assigneeName: '李工程師',
          createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000)
        },
        {
          id: '3',
          name: '驗收結案流程',
          description: '專案完成驗收流程',
          status: WorkflowStatus.COMPLETED,
          currentStep: 6,
          totalSteps: 6,
          assigneeName: '陳主管',
          createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
        }
      ]);

      // 狀態機
      this.stateMachines.set([
        {
          id: '1',
          name: '任務狀態機',
          currentState: '進行中',
          states: ['待處理', '進行中', '待審核', '已完成', '已關閉'],
          transitions: 8,
          createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
        },
        {
          id: '2',
          name: '請款單狀態機',
          currentState: '審核中',
          states: ['草稿', '已送出', '審核中', '已核准', '已付款'],
          transitions: 6,
          createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        }
      ]);

      // 自動化觸發器
      this.automations.set([
        {
          id: '1',
          name: '任務逾期提醒',
          triggerType: 'schedule',
          enabled: true,
          lastTriggered: new Date(now.getTime() - 2 * 60 * 60 * 1000),
          executionCount: 156
        },
        {
          id: '2',
          name: '新任務通知',
          triggerType: 'event',
          enabled: true,
          lastTriggered: new Date(now.getTime() - 30 * 60 * 1000),
          executionCount: 89
        },
        {
          id: '3',
          name: '預算超支警告',
          triggerType: 'condition',
          enabled: false,
          lastTriggered: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          executionCount: 12
        }
      ]);

      // 審批流程
      this.approvals.set([
        {
          id: '1',
          title: '變更設計申請 #2025-001',
          type: '設計變更',
          status: 'pending',
          currentApprover: '張副總',
          submittedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
          priority: 'high'
        },
        {
          id: '2',
          title: '請款單 INV-20251217-001',
          type: '請款審批',
          status: 'in_progress',
          currentApprover: '財務部',
          submittedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          priority: 'medium'
        },
        {
          id: '3',
          title: '加班申請 #12345',
          type: '加班申請',
          status: 'approved',
          currentApprover: '人資部',
          submittedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
          priority: 'low'
        }
      ]);

      // 流程範本
      this.templates.set([
        {
          id: '1',
          name: '標準審批流程',
          category: '審批',
          description: '適用於一般審批場景的標準流程範本',
          usageCount: 45,
          createdAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        },
        {
          id: '2',
          name: '快速審批流程',
          category: '審批',
          description: '適用於緊急事項的快速審批流程',
          usageCount: 23,
          createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
        },
        {
          id: '3',
          name: '多層審批流程',
          category: '審批',
          description: '適用於大型專案的多層級審批流程',
          usageCount: 12,
          createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        },
        {
          id: '4',
          name: '專案啟動流程',
          category: '專案',
          description: '新專案啟動的標準作業流程',
          usageCount: 8,
          createdAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000)
        }
      ]);

      this.loading.set(false);
    }, 500);
  }

  /** 重新整理資料 */
  refreshData(): void {
    this.loadAllData(this.blueprintId());
    this.message.success('資料已重新整理');
  }

  /** 建立自訂流程 */
  createWorkflow(): void {
    this.message.info('建立自訂流程功能開發中');
  }

  /** 查看自訂流程 */
  viewWorkflow(workflow: CustomWorkflow): void {
    this.modal.info({
      nzTitle: workflow.name,
      nzContent: `
        <p><strong>狀態：</strong>${this.getWorkflowStatusText(workflow.status)}</p>
        <p><strong>進度：</strong>${workflow.currentStep} / ${workflow.totalSteps} 步驟</p>
        <p><strong>負責人：</strong>${workflow.assigneeName || '未指派'}</p>
        <p><strong>描述：</strong>${workflow.description || '無'}</p>
      `
    });
  }

  /** 編輯自訂流程 */
  editWorkflow(workflow: CustomWorkflow): void {
    this.message.info(`編輯流程：${workflow.name}`);
  }

  /** 取得流程狀態文字 */
  getWorkflowStatusText(status: WorkflowStatus): string {
    const statusMap: Record<string, string> = {
      pending: '待處理',
      in_progress: '進行中',
      completed: '已完成',
      rejected: '已拒絕'
    };
    return statusMap[status] || status;
  }

  /** 建立狀態機 */
  createStateMachine(): void {
    this.message.info('建立狀態機功能開發中');
  }

  /** 查看狀態機 */
  viewStateMachine(machine: StateMachine): void {
    this.modal.info({
      nzTitle: machine.name,
      nzContent: `
        <p><strong>當前狀態：</strong>${machine.currentState}</p>
        <p><strong>可用狀態：</strong>${machine.states.join(' → ')}</p>
        <p><strong>轉換規則數：</strong>${machine.transitions} 個</p>
      `
    });
  }

  /** 編輯狀態機 */
  editStateMachine(machine: StateMachine): void {
    this.message.info(`編輯狀態機：${machine.name}`);
  }

  /** 新增自動化觸發器 */
  createAutomation(): void {
    this.message.info('新增自動化觸發器功能開發中');
  }

  /** 查看自動化觸發器 */
  viewAutomation(automation: AutomationTrigger): void {
    const typeMap: Record<string, string> = {
      event: '事件觸發',
      schedule: '排程觸發',
      condition: '條件觸發'
    };
    this.modal.info({
      nzTitle: automation.name,
      nzContent: `
        <p><strong>類型：</strong>${typeMap[automation.triggerType]}</p>
        <p><strong>狀態：</strong>${automation.enabled ? '已啟用' : '已停用'}</p>
        <p><strong>執行次數：</strong>${automation.executionCount} 次</p>
        <p><strong>上次觸發：</strong>${automation.lastTriggered ? automation.lastTriggered.toLocaleString() : '從未觸發'}</p>
      `
    });
  }

  /** 切換自動化觸發器狀態 */
  toggleAutomation(automation: AutomationTrigger): void {
    const action = automation.enabled ? '停用' : '啟用';
    this.message.success(`已${action}觸發器：${automation.name}`);
  }

  /** 處理審批 */
  processApproval(approval: ApprovalWorkflow): void {
    this.modal.confirm({
      nzTitle: '審批確認',
      nzContent: `確定要處理「${approval.title}」嗎？`,
      nzOkText: '通過',
      nzOkType: 'primary',
      nzCancelText: '拒絕',
      nzOnOk: () => this.message.success('已通過審批'),
      nzOnCancel: () => this.message.warning('已拒絕審批')
    });
  }

  /** 查看審批詳情 */
  viewApproval(approval: ApprovalWorkflow): void {
    this.modal.info({
      nzTitle: approval.title,
      nzContent: `
        <p><strong>類型：</strong>${approval.type}</p>
        <p><strong>狀態：</strong>${this.getApprovalStatusText(approval.status)}</p>
        <p><strong>優先級：</strong>${this.getPriorityText(approval.priority)}</p>
        <p><strong>當前審批人：</strong>${approval.currentApprover || '無'}</p>
        <p><strong>提交時間：</strong>${approval.submittedAt.toLocaleString()}</p>
      `
    });
  }

  /** 取得審批狀態文字 */
  getApprovalStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      pending: '待審批',
      in_progress: '審核中',
      approved: '已通過',
      rejected: '已拒絕'
    };
    return statusMap[status] || status;
  }

  /** 取得審批狀態顏色 */
  getApprovalStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      pending: 'warning',
      in_progress: 'processing',
      approved: 'success',
      rejected: 'error'
    };
    return colorMap[status] || 'default';
  }

  /** 取得審批時間軸顏色 */
  getApprovalTimelineColor(status: string): string {
    const colorMap: Record<string, string> = {
      pending: 'orange',
      in_progress: 'blue',
      approved: 'green',
      rejected: 'red'
    };
    return colorMap[status] || 'gray';
  }

  /** 取得優先級文字 */
  getPriorityText(priority: string): string {
    const priorityMap: Record<string, string> = {
      high: '高',
      medium: '中',
      low: '低'
    };
    return priorityMap[priority] || priority;
  }

  /** 建立流程範本 */
  createTemplate(): void {
    this.message.info('建立流程範本功能開發中');
  }

  /** 使用流程範本 */
  useTemplate(template: WorkflowTemplate): void {
    this.modal.confirm({
      nzTitle: '使用範本',
      nzContent: `確定要使用「${template.name}」範本建立新流程嗎？`,
      nzOnOk: () => this.message.success(`已使用範本「${template.name}」`)
    });
  }
}
