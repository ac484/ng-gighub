/**
 * QA Module View Component
 * 品質控管域視圖元件 - 顯示於藍圖詳情頁面的 Tab 中
 *
 * 設計原則：問題透過問題模組處理，因此設計不用過度
 *
 * @module QaModuleViewComponent
 * @author GigHub Development Team
 * @date 2025-12-17
 */

import { Component, ChangeDetectionStrategy, input, signal, inject, OnInit } from '@angular/core';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';

@Component({
  selector: 'app-qa-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzEmptyModule, NzResultModule, NzAlertModule, NzStatisticModule],
  template: `
    <!-- 品質統計 -->
    <nz-card nzTitle="品質管理" [nzExtra]="qaExtra" class="mb-md">
      <ng-template #qaExtra>
        <button nz-button nzType="link" (click)="refreshData()">
          <span nz-icon nzType="reload"></span>
        </button>
      </ng-template>

      <nz-row [nzGutter]="[16, 16]">
        <nz-col [nzXs]="12" [nzSm]="8">
          <nz-card nzSize="small" [nzHoverable]="true">
            <nz-statistic [nzValue]="stats().inspections" nzTitle="品質檢驗" [nzValueStyle]="{ color: '#1890ff' }">
              <ng-template #nzPrefix>
                <span nz-icon nzType="file-search"></span>
              </ng-template>
            </nz-statistic>
          </nz-card>
        </nz-col>
        <nz-col [nzXs]="12" [nzSm]="8">
          <nz-card nzSize="small" [nzHoverable]="true">
            <nz-statistic
              [nzValue]="stats().passRate"
              nzTitle="合格率"
              nzSuffix="%"
              [nzValueStyle]="{ color: stats().passRate >= 95 ? '#52c41a' : '#faad14' }"
            >
              <ng-template #nzPrefix>
                <span nz-icon nzType="check-circle"></span>
              </ng-template>
            </nz-statistic>
          </nz-card>
        </nz-col>
        <nz-col [nzXs]="24" [nzSm]="8">
          <nz-card nzSize="small" [nzHoverable]="true">
            <nz-statistic
              [nzValue]="stats().openIssues"
              nzTitle="待處理問題"
              [nzValueStyle]="{ color: stats().openIssues > 0 ? '#faad14' : '#52c41a' }"
            >
              <ng-template #nzPrefix>
                <span nz-icon nzType="exclamation-circle"></span>
              </ng-template>
            </nz-statistic>
          </nz-card>
        </nz-col>
      </nz-row>
    </nz-card>

    <!-- 品質模組內容 -->
    <nz-card>
      <nz-alert
        nzType="info"
        nzMessage="品質控管模組簡化版"
        nzDescription="NCR (不符合報告) 功能已遷移至「問題」模組，提供更完整的問題追蹤與管理功能。"
        nzShowIcon
        class="mb-md"
      >
      </nz-alert>

      <nz-tabset>
        <!-- 品質檢驗 Tab -->
        <nz-tab nzTitle="品質檢驗">
          <ng-template nz-tab>
            <div class="mb-md" style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #666;">記錄品質檢驗結果</span>
              <button nz-button nzType="primary" (click)="addInspection()">
                <span nz-icon nzType="plus"></span>
                新增檢驗
              </button>
            </div>

            @if (loading()) {
              <div style="text-align: center; padding: 24px;">
                <nz-spin nzSimple></nz-spin>
              </div>
            } @else if (inspections().length === 0) {
              <nz-empty nzNotFoundContent="暫無品質檢驗記錄"></nz-empty>
            } @else {
              <st [data]="inspections()" [columns]="inspectionColumns" />
            }
          </ng-template>
        </nz-tab>

        <!-- 品質標準 Tab -->
        <nz-tab nzTitle="品質標準">
          <ng-template nz-tab>
            <nz-alert
              nzType="warning"
              nzMessage="品質標準管理"
              nzDescription="品質標準與規範文件請使用「雲端」模組管理。"
              nzShowIcon
              class="mb-md"
            >
            </nz-alert>

            @if (standards().length === 0) {
              <nz-empty nzNotFoundContent="暫無品質標準記錄"></nz-empty>
            } @else {
              <nz-list [nzDataSource]="standards()" nzBordered>
                @for (standard of standards(); track standard.id) {
                  <nz-list-item>
                    <nz-list-item-meta [nzTitle]="standard.name" [nzDescription]="standard.description">
                      <nz-list-item-meta-avatar>
                        <nz-avatar nzIcon="file-text" [nzShape]="'square'" style="background-color: #1890ff;"></nz-avatar>
                      </nz-list-item-meta-avatar>
                    </nz-list-item-meta>
                  </nz-list-item>
                }
              </nz-list>
            }
          </ng-template>
        </nz-tab>
      </nz-tabset>

      <nz-divider></nz-divider>

      <!-- 導航至問題模組 -->
      <div style="text-align: center; padding: 16px;">
        <p style="color: #666; margin-bottom: 12px;">
          <span nz-icon nzType="arrow-right"></span>
          NCR 相關功能請使用「問題」模組
        </p>
        <p style="color: #999; font-size: 12px;"> 未來品質管理進階功能將在此模組重新設計 </p>
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
export class QaModuleViewComponent implements OnInit {
  blueprintId = input.required<string>();
  private readonly message = inject(NzMessageService);

  // 狀態
  loading = signal(false);
  stats = signal({ inspections: 0, passRate: 0, openIssues: 0 });
  inspections = signal<Array<{ id: string; item: string; inspector: string; result: string; inspectedAt: Date }>>([]);
  standards = signal<Array<{ id: string; name: string; description: string }>>([]);

  // 品質檢驗欄位
  inspectionColumns: STColumn[] = [
    { title: '檢驗項目', index: 'item', width: 200 },
    { title: '檢驗人', index: 'inspector', width: 120 },
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
      buttons: [{ text: '查看', click: (record: { item: string }) => this.message.info(`查看檢驗：${record.item}`) }]
    }
  ];

  ngOnInit(): void {
    this.loadMockData();
  }

  /** 載入模擬資料 */
  private loadMockData(): void {
    this.stats.set({
      inspections: 25,
      passRate: 96.5,
      openIssues: 2
    });

    this.inspections.set([
      { id: '1', item: '混凝土強度測試', inspector: '品管員A', result: 'pass', inspectedAt: new Date() },
      { id: '2', item: '鋼筋保護層檢查', inspector: '品管員B', result: 'pass', inspectedAt: new Date() },
      { id: '3', item: '防水層檢驗', inspector: '品管員A', result: 'pending', inspectedAt: new Date() }
    ]);

    this.standards.set([
      { id: '1', name: 'CNS 3090 混凝土標準', description: '混凝土強度與配比規範' },
      { id: '2', name: 'CNS 560 鋼筋標準', description: '鋼筋規格與品質要求' }
    ]);
  }

  /** 重新整理 */
  refreshData(): void {
    this.loadMockData();
    this.message.success('資料已重新整理');
  }

  /** 新增檢驗 */
  addInspection(): void {
    this.message.info('新增品質檢驗功能開發中');
  }
}
