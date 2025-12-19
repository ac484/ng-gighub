/**
 * Acceptance Module View Component
 * 驗收域視圖元件 - 顯示於藍圖詳情頁面的 Tab 中
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input } from '@angular/core';
import { ConclusionService } from '@core/blueprint/modules/implementations/acceptance/services/conclusion.service';
import { PreliminaryService } from '@core/blueprint/modules/implementations/acceptance/services/preliminary.service';
import { ReInspectionService } from '@core/blueprint/modules/implementations/acceptance/services/re-inspection.service';
import { RequestService } from '@core/blueprint/modules/implementations/acceptance/services/request.service';
import { ReviewService } from '@core/blueprint/modules/implementations/acceptance/services/review.service';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';

@Component({
  selector: 'app-acceptance-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzStatisticModule, NzEmptyModule],
  template: `
    <!-- Acceptance Statistics Card -->
    <nz-card nzTitle="驗收統計" class="mb-md">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="24">
          <nz-statistic [nzValue]="requestService.data().length" nzTitle="驗收記錄" />
        </nz-col>
      </nz-row>
    </nz-card>

    <!-- Acceptance List -->
    <nz-card nzTitle="驗收列表">
      @if (requestService.loading()) {
        <nz-spin nzSimple />
      } @else if (requestService.data().length === 0) {
        <nz-empty nzNotFoundContent="暫無驗收記錄" />
      } @else {
        <st [data]="requestService.data()" [columns]="requestColumns" />
      }
    </nz-card>
  `,
  styles: []
})
export class AcceptanceModuleViewComponent implements OnInit {
  blueprintId = input.required<string>();

  readonly requestService = inject(RequestService);
  readonly reviewService = inject(ReviewService);
  readonly preliminaryService = inject(PreliminaryService);
  readonly reInspectionService = inject(ReInspectionService);
  readonly conclusionService = inject(ConclusionService);
  private readonly message = inject(NzMessageService);

  requestColumns: STColumn[] = this.withActions(
    [
      { title: '驗收項目', index: 'item' },
      { title: '申請人', index: 'requester', width: '120px' },
      { title: '狀態', index: 'status', width: '100px' },
      { title: '申請時間', index: 'requestedAt', type: 'date', width: '180px' }
    ],
    '驗收'
  );

  ngOnInit(): void {
    const blueprintId = this.blueprintId();
    this.requestService.load(blueprintId);
    // Load others for potential future use
    this.conclusionService.load(blueprintId);
    this.reviewService.load(blueprintId);
    this.preliminaryService.load(blueprintId);
    this.reInspectionService.load(blueprintId);
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

  notifyPending(context: string, action: string, record?: { item?: string }): void {
    const item = record?.item;
    const detail = item ? `：${item}` : '';
    this.message.info(`${context}${action}功能待實作${detail}`);
  }
}
