/**
 * Safety Module View Component
 * 安全域視圖元件
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input } from '@angular/core';
import { IncidentReportService } from '@core/blueprint/modules/implementations/safety/services/incident-report.service';
import { RiskAssessmentService } from '@core/blueprint/modules/implementations/safety/services/risk-assessment.service';
import { SafetyInspectionService } from '@core/blueprint/modules/implementations/safety/services/safety-inspection.service';
import { SafetyTrainingService } from '@core/blueprint/modules/implementations/safety/services/safety-training.service';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';

@Component({
  selector: 'app-safety-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzStatisticModule, NzEmptyModule, NzAlertModule],
  template: `
    <nz-card nzTitle="安全統計" class="mb-md">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="24">
          <nz-statistic [nzValue]="inspectionService.data().length" nzTitle="安全記錄" />
        </nz-col>
      </nz-row>
    </nz-card>

    <!-- Simplified Safety Module -->
    <nz-card>
      <nz-alert
        nzType="info"
        nzMessage="安全模組簡化版"
        nzDescription="本模組提供基礎安全記錄功能。完整的安全管理功能將在後續版本中開發。"
        nzShowIcon
      />
      <nz-divider />
      <nz-tabset>
        <nz-tab nzTitle="安全記錄">
          @if (inspectionService.loading()) {
            <nz-spin nzSimple />
          } @else if (inspectionService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無安全記錄" />
          } @else {
            <st [data]="inspectionService.data()" [columns]="inspectionColumns" />
          }
        </nz-tab>
      </nz-tabset>
    </nz-card>
  `,
  styles: []
})
export class SafetyModuleViewComponent implements OnInit {
  blueprintId = input.required<string>();

  readonly inspectionService = inject(SafetyInspectionService);
  readonly riskService = inject(RiskAssessmentService);
  readonly incidentService = inject(IncidentReportService);
  readonly trainingService = inject(SafetyTrainingService);
  private readonly message = inject(NzMessageService);

  inspectionColumns: STColumn[] = this.withActions(
    [
      { title: '巡檢項目', index: 'item' },
      { title: '巡檢人', index: 'inspector', width: '120px' },
      { title: '結果', index: 'result', width: '100px' },
      { title: '時間', index: 'inspectedAt', type: 'date', width: '180px' }
    ],
    '安全巡檢'
  );

  ngOnInit(): void {
    const blueprintId = this.blueprintId();
    this.inspectionService.load(blueprintId);
    // Load others for potential future use
    this.riskService.load(blueprintId);
    this.incidentService.load(blueprintId);
    this.trainingService.load(blueprintId);
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

  notifyPending(context: string, action: string, record?: { item?: string; description?: string; course?: string }): void {
    const title = record?.item || record?.description || record?.course;
    const detail = title ? `：${title}` : '';
    this.message.info(`${context}${action}功能待實作${detail}`);
  }
}
