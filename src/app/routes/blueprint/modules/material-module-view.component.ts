/**
 * Material Module View Component
 * 材料域視圖元件
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input } from '@angular/core';
import { ConsumptionService } from '@core/blueprint/modules/implementations/material/services/consumption.service';
import { EquipmentService } from '@core/blueprint/modules/implementations/material/services/equipment.service';
import { InventoryService } from '@core/blueprint/modules/implementations/material/services/inventory.service';
import { MaterialIssueService } from '@core/blueprint/modules/implementations/material/services/material-issue.service';
import { MaterialManagementService } from '@core/blueprint/modules/implementations/material/services/material-management.service';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';

@Component({
  selector: 'app-material-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzStatisticModule, NzEmptyModule],
  template: `
    <nz-card nzTitle="材料統計" class="mb-md">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="12">
          <nz-statistic [nzValue]="materialService.data().length" nzTitle="材料項目" />
        </nz-col>
        <nz-col [nzSpan]="12">
          <nz-statistic [nzValue]="inventoryService.data().length" nzTitle="庫存" />
        </nz-col>
      </nz-row>
    </nz-card>

    <!-- Simplified Material Tabs -->
    <nz-card>
      <nz-tabset>
        <nz-tab nzTitle="材料管理">
          @if (materialService.loading()) {
            <nz-spin nzSimple />
          } @else if (materialService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無材料記錄" />
          } @else {
            <st [data]="materialService.data()" [columns]="materialColumns" />
          }
        </nz-tab>
        <nz-tab nzTitle="領用與庫存">
          @if (issueService.loading()) {
            <nz-spin nzSimple />
          } @else if (issueService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無領用記錄" />
          } @else {
            <st [data]="issueService.data()" [columns]="issueColumns" />
          }
        </nz-tab>
      </nz-tabset>
    </nz-card>
  `,
  styles: []
})
export class MaterialModuleViewComponent implements OnInit {
  blueprintId = input.required<string>();

  readonly materialService = inject(MaterialManagementService);
  readonly issueService = inject(MaterialIssueService);
  readonly inventoryService = inject(InventoryService);
  readonly equipmentService = inject(EquipmentService);
  readonly consumptionService = inject(ConsumptionService);
  private readonly message = inject(NzMessageService);

  materialColumns: STColumn[] = this.withActions(
    [
      { title: '材料名稱', index: 'name' },
      { title: '規格', index: 'spec', width: '150px' },
      { title: '數量', index: 'quantity', width: '100px' }
    ],
    '材料管理'
  );

  issueColumns: STColumn[] = this.withActions(
    [
      { title: '材料', index: 'material' },
      { title: '數量', index: 'quantity', width: '100px' },
      { title: '領用人', index: 'issuer', width: '120px' },
      { title: '時間', index: 'issuedAt', type: 'date', width: '180px' }
    ],
    '領用記錄'
  );

  ngOnInit(): void {
    this.materialService.load();
    this.issueService.load();
    // Load for potential future use
    this.inventoryService.load();
    this.equipmentService.load();
    this.consumptionService.load();
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

  notifyPending(context: string, action: string, record?: { name?: string; item?: string }): void {
    const name = record?.name || record?.item;
    const detail = name ? `：${name}` : '';
    this.message.info(`${context}${action}功能待實作${detail}`);
  }
}
