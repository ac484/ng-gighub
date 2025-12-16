/**
 * Workflow Module View Component
 * 流程域視圖元件 - 顯示於藍圖詳情頁面的 Tab 中
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input } from '@angular/core';
import { ApprovalService } from '@core/blueprint/modules/implementations/workflow/services/approval.service';
import { AutomationService } from '@core/blueprint/modules/implementations/workflow/services/automation.service';
import { CustomWorkflowService } from '@core/blueprint/modules/implementations/workflow/services/custom-workflow.service';
import { StateMachineService } from '@core/blueprint/modules/implementations/workflow/services/state-machine.service';
import { TemplateService } from '@core/blueprint/modules/implementations/workflow/services/template.service';
import { SHARED_IMPORTS } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';

@Component({
  selector: 'app-workflow-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzStatisticModule, NzAlertModule],
  template: `
    <!-- Statistics Card -->
    <nz-card nzTitle="流程統計" class="mb-md">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="customWorkflowService.data().length" nzTitle="自訂流程" [nzPrefix]="workflowIcon" />
          <ng-template #workflowIcon>
            <span nz-icon nzType="apartment" style="color: #1890ff;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="stateMachineService.data().length" nzTitle="狀態機" [nzPrefix]="stateIcon" />
          <ng-template #stateIcon>
            <span nz-icon nzType="cluster" style="color: #52c41a;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="automationService.data().length" nzTitle="自動化觸發" [nzPrefix]="autoIcon" />
          <ng-template #autoIcon>
            <span nz-icon nzType="robot" style="color: #faad14;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="templateService.data().length" nzTitle="流程範本" [nzPrefix]="templateIcon" />
          <ng-template #templateIcon>
            <span nz-icon nzType="container" style="color: #722ed1;"></span>
          </ng-template>
        </nz-col>
      </nz-row>
    </nz-card>

    <!-- Workflow Module Placeholder -->
    <nz-card>
      <nz-alert
        nzType="info"
        nzMessage="流程模組開發中"
        nzDescription="此模組將在 SETC 工作流程實施時完整開發。目前功能規劃包括：自訂流程、狀態機、自動化觸發與審批流程。"
        nzShowIcon
      />
    </nz-card>
  `,
  styles: []
})
export class WorkflowModuleViewComponent implements OnInit {
  blueprintId = input.required<string>();

  readonly customWorkflowService = inject(CustomWorkflowService);
  readonly stateMachineService = inject(StateMachineService);
  readonly automationService = inject(AutomationService);
  readonly templateService = inject(TemplateService);
  readonly approvalService = inject(ApprovalService);

  ngOnInit(): void {
    // Services loaded for future use, but UI simplified
    const blueprintId = this.blueprintId();
    this.customWorkflowService.load(blueprintId);
    this.stateMachineService.load(blueprintId);
    this.automationService.load(blueprintId);
    this.templateService.load(blueprintId);
    this.approvalService.load(blueprintId);
  }
}
