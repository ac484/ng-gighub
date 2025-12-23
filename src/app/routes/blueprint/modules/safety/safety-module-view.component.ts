/**
 * Safety Module View Component
 * 安全域視圖元件 - 簡化版
 *
 * 設計原則：問題透過問題模組處理，因此設計不用過度
 *
 * @module SafetyModuleViewComponent
 * @author GigHub Development Team
 * @date 2025-12-17
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input, signal } from '@angular/core';
import { IncidentReportService } from './core/services/incident-report.service';
import { SafetyInspectionService } from './core/services/safety-inspection.service';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';

@Component({
  selector: 'app-safety-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzStatisticModule, NzEmptyModule, NzAlertModule, NzResultModule],
  template: `
    <!-- 安全統計 -->
    <nz-card nzTitle="安全管理" [nzExtra]="safetyExtra" class="mb-md">
      <ng-template #safetyExtra>
        <button nz-button nzType="link" (click)="refreshData()">
          <span nz-icon nzType="reload"></span>
        </button>
      </ng-template>

      <nz-row [nzGutter]="[16, 16]">
        <nz-col [nzXs]="12" [nzSm]="8">
          <nz-card nzSize="small" [nzHoverable]="true">
            <nz-statistic [nzValue]="stats().inspections" nzTitle="安全巡檢" [nzValueStyle]="{ color: '#1890ff' }">
              <ng-template #nzPrefix>
                <span nz-icon nzType="safety"></span>
              </ng-template>
            </nz-statistic>
          </nz-card>
        </nz-col>
        <nz-col [nzXs]="12" [nzSm]="8">
          <nz-card nzSize="small" [nzHoverable]="true">
            <nz-statistic
              [nzValue]="stats().incidents"
              nzTitle="事故報告"
              [nzValueStyle]="{ color: stats().incidents > 0 ? '#ff4d4f' : '#52c41a' }"
            >
              <ng-template #nzPrefix>
                <span nz-icon nzType="warning"></span>
              </ng-template>
            </nz-statistic>
          </nz-card>
        </nz-col>
        <nz-col [nzXs]="24" [nzSm]="8">
          <nz-card nzSize="small" [nzHoverable]="true">
            <nz-statistic [nzValue]="stats().safetyDays" nzTitle="安全工作日" nzSuffix="天" [nzValueStyle]="{ color: '#52c41a' }">
              <ng-template #nzPrefix>
                <span nz-icon nzType="check-circle"></span>
              </ng-template>
            </nz-statistic>
          </nz-card>
        </nz-col>
      </nz-row>
    </nz-card>

    <!-- 安全模組說明 -->
    <nz-card>
      <nz-alert
        nzType="info"
        nzMessage="安全模組簡化版"
        nzDescription="本模組提供基礎安全記錄功能。安全相關問題請使用「問題」模組進行追蹤管理。"
        nzShowIcon
        class="mb-md"
      >
      </nz-alert>

      <nz-tabset>
        <!-- 安全巡檢 Tab -->
        <nz-tab nzTitle="安全巡檢">
          <ng-template nz-tab>
            <div class="mb-md" style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #666;">記錄日常安全巡檢結果</span>
              <button nz-button nzType="primary" (click)="addInspection()">
                <span nz-icon nzType="plus"></span>
                新增巡檢
              </button>
            </div>

            @if (inspectionService.loading()) {
              <div style="text-align: center; padding: 24px;">
                <nz-spin nzSimple></nz-spin>
              </div>
            } @else if (inspections().length === 0) {
              <nz-empty nzNotFoundContent="暫無安全巡檢記錄"></nz-empty>
            } @else {
              <st [data]="inspections()" [columns]="inspectionColumns" />
            }
          </ng-template>
        </nz-tab>

        <!-- 事故記錄 Tab -->
        <nz-tab [nzTitle]="incidentTabTitle">
          <ng-template #incidentTabTitle>
            事故記錄
            @if (stats().incidents > 0) {
              <nz-badge [nzCount]="stats().incidents" nzSize="small" style="margin-left: 4px;"></nz-badge>
            }
          </ng-template>
          <ng-template nz-tab>
            <div class="mb-md" style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #666;">記錄安全事故及處理情況</span>
              <button nz-button nzType="default" nzDanger (click)="reportIncident()">
                <span nz-icon nzType="warning"></span>
                報告事故
              </button>
            </div>

            @if (incidents().length === 0) {
              <nz-result nzStatus="success" nzTitle="無事故記錄" nzSubTitle="目前沒有安全事故記錄，繼續保持安全作業！"> </nz-result>
            } @else {
              <st [data]="incidents()" [columns]="incidentColumns" />
            }
          </ng-template>
        </nz-tab>
      </nz-tabset>

      <nz-divider></nz-divider>

      <!-- 導航至問題模組 -->
      <div style="text-align: center; padding: 16px;">
        <p style="color: #666; margin-bottom: 12px;">
          <span nz-icon nzType="info-circle"></span>
          安全相關問題請使用問題模組進行完整追蹤
        </p>
        <button nz-button nzType="link">
          <span nz-icon nzType="arrow-right"></span>
          前往問題模組
        </button>
      </div>
    </nz-card>
  `,
  styles: [
    `
      .mb-md {
        margin-bottom: 16px;
      }
    `
  ]
})
export class SafetyModuleViewComponent implements OnInit {
  blueprintId = input.required<string>();

  readonly inspectionService = inject(SafetyInspectionService);
  readonly incidentService = inject(IncidentReportService);
  private readonly message = inject(NzMessageService);

  // 狀態
  stats = signal({ inspections: 0, incidents: 0, safetyDays: 0 });
  inspections = signal<Array<{ id: string; item: string; inspector: string; result: string; inspectedAt: Date }>>([]);
  incidents = signal<Array<{ id: string; description: string; severity: string; reportedAt: Date; status: string }>>([]);

  // 安全巡檢欄位
  inspectionColumns: STColumn[] = [
    { title: '巡檢項目', index: 'item', width: 200 },
    { title: '巡檢人', index: 'inspector', width: 120 },
    {
      title: '結果',
      index: 'result',
      width: 100,
      type: 'badge',
      badge: {
        pass: { text: '合格', color: 'success' },
        fail: { text: '不合格', color: 'error' },
        pending: { text: '待確認', color: 'warning' }
      }
    },
    { title: '時間', index: 'inspectedAt', type: 'date', dateFormat: 'yyyy-MM-dd HH:mm', width: 150 },
    {
      title: '操作',
      width: 120,
      buttons: [{ text: '查看', click: (record: { item: string }) => this.message.info(`查看巡檢：${record.item}`) }]
    }
  ];

  // 事故記錄欄位
  incidentColumns: STColumn[] = [
    { title: '事故描述', index: 'description', width: 200 },
    {
      title: '嚴重程度',
      index: 'severity',
      width: 100,
      type: 'badge',
      badge: {
        low: { text: '輕微', color: 'default' },
        medium: { text: '中等', color: 'warning' },
        high: { text: '嚴重', color: 'error' }
      }
    },
    { title: '報告時間', index: 'reportedAt', type: 'date', dateFormat: 'yyyy-MM-dd HH:mm', width: 150 },
    {
      title: '狀態',
      index: 'status',
      width: 100,
      type: 'badge',
      badge: {
        reported: { text: '已報告', color: 'default' },
        investigating: { text: '調查中', color: 'processing' },
        resolved: { text: '已解決', color: 'success' }
      }
    },
    {
      title: '操作',
      width: 120,
      buttons: [{ text: '查看', click: (record: { description: string }) => this.message.info(`查看事故：${record.description}`) }]
    }
  ];

  ngOnInit(): void {
    const blueprintId = this.blueprintId();
    this.inspectionService.load(blueprintId);
    this.incidentService.load(blueprintId);
    this.loadMockData();
  }

  /** 載入模擬資料 */
  private loadMockData(): void {
    this.stats.set({
      inspections: 15,
      incidents: 0,
      safetyDays: 120
    });

    this.inspections.set([
      { id: '1', item: '工地圍籬檢查', inspector: '安全員A', result: 'pass', inspectedAt: new Date() },
      { id: '2', item: '電氣設備檢查', inspector: '安全員B', result: 'pass', inspectedAt: new Date() },
      { id: '3', item: '高空作業安全', inspector: '安全員A', result: 'pending', inspectedAt: new Date() }
    ]);
  }

  /** 重新整理 */
  refreshData(): void {
    const blueprintId = this.blueprintId();
    this.inspectionService.load(blueprintId);
    this.message.success('資料已重新整理');
  }

  /** 新增巡檢 */
  addInspection(): void {
    this.message.info('新增安全巡檢功能開發中');
  }

  /** 報告事故 */
  reportIncident(): void {
    this.message.info('報告事故功能開發中');
  }
}
