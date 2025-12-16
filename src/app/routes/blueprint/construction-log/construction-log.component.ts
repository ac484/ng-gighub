/**
 * Construction Log Component
 * 工地施工日誌元件
 *
 * Features:
 * - Display construction logs with ST table
 * - Create/Edit logs with modal
 * - Photo upload with Supabase Storage
 * - Real-time updates
 *
 * ✅ Modernized with Angular 20 Signals and new control flow
 * ✅ Uses ng-alain ST table
 * ✅ Follows project architecture (Foundation Layer)
 *
 * @author GigHub Development Team
 * @date 2025-12-11
 */

import { Component, OnInit, inject, signal, computed, input } from '@angular/core';
import { ConstructionLogStore } from '@core/stores';
import { Log, CreateLogRequest, UpdateLogRequest } from '@core/types/log/log.types';
import { STColumn, STData, STChange } from '@delon/abc/st';
import { SFSchema } from '@delon/form';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';

import { ConstructionLogModalComponent } from './construction-log-modal.component';

@Component({
  selector: 'app-construction-log',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-card [nzTitle]="'工地施工日誌'" [nzExtra]="headerExtra">
      <!-- Statistics -->
      <nz-row [nzGutter]="16" class="mb-md">
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="logStore.totalCount()" [nzTitle]="'總日誌數'" [nzPrefix]="totalIconTpl" />
          <ng-template #totalIconTpl>
            <span nz-icon nzType="file-text" style="color: #1890ff;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="logStore.thisMonthCount()" [nzTitle]="'本月日誌'" [nzValueStyle]="{ color: '#52c41a' }" />
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="logStore.todayCount()" [nzTitle]="'今日日誌'" [nzValueStyle]="{ color: '#faad14' }" />
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="logStore.totalPhotos()" [nzTitle]="'總照片數'" [nzPrefix]="photoIconTpl" />
          <ng-template #photoIconTpl>
            <span nz-icon nzType="picture" style="color: #722ed1;"></span>
          </ng-template>
        </nz-col>
      </nz-row>

      <!-- Table -->
      @if (logStore.loading()) {
        <nz-spin nzSimple />
      } @else if (logStore.error()) {
        <nz-alert nzType="error" [nzMessage]="logStore.error()" nzShowIcon />
      } @else {
        <st
          [data]="logStore.logs()"
          [columns]="columns"
          [page]="{ show: true, showSize: true }"
          [loading]="logStore.loading()"
          (change)="handleTableChange($event)"
        />
      }

      <ng-template #headerExtra>
        <nz-space>
          <button *nzSpaceItem nz-button (click)="refresh()">
            <span nz-icon nzType="reload"></span>
            重新整理
          </button>
          <button *nzSpaceItem nz-button nzType="primary" (click)="createLog()">
            <span nz-icon nzType="plus"></span>
            新增日誌
          </button>
        </nz-space>
      </ng-template>
    </nz-card>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .mb-md {
        margin-bottom: 16px;
      }
    `
  ]
})
export class ConstructionLogComponent implements OnInit {
  // Input from parent
  blueprintId = input.required<string>();

  // Injected services
  readonly logStore = inject(ConstructionLogStore);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);

  // ST Table columns configuration
  columns: STColumn[] = [
    {
      title: '日期',
      index: 'date',
      type: 'date',
      dateFormat: 'yyyy-MM-dd',
      width: 120,
      sort: {
        default: 'descend'
      }
    },
    {
      title: '標題',
      index: 'title',
      width: 200
    },
    {
      title: '描述',
      index: 'description',
      width: 300,
      format: (item: any) => item.description || '-'
    },
    {
      title: '工時',
      index: 'workHours',
      width: 80,
      format: (item: any) => (item.workHours ? `${item.workHours}h` : '-')
    },
    {
      title: '工人數',
      index: 'workers',
      width: 80,
      format: (item: any) => item.workers || '-'
    },
    {
      title: '天氣',
      index: 'weather',
      width: 100,
      format: (item: any) => item.weather || '-'
    },
    {
      title: '溫度',
      index: 'temperature',
      width: 80,
      format: (item: any) => (item.temperature ? `${item.temperature}°C` : '-')
    },
    {
      title: '照片',
      index: 'photos',
      width: 80,
      format: (item: any) => {
        const count = item.photos?.length || 0;
        return count > 0 ? `${count} 張` : '-';
      }
    },
    {
      title: '建立時間',
      index: 'createdAt',
      type: 'date',
      dateFormat: 'yyyy-MM-dd HH:mm',
      width: 150,
      sort: true
    },
    {
      title: '操作',
      width: 180,
      buttons: [
        {
          text: '查看',
          icon: 'eye',
          click: (record: any) => this.viewLog(record)
        },
        {
          text: '編輯',
          icon: 'edit',
          click: (record: any) => this.editLog(record)
        },
        {
          text: '刪除',
          icon: 'delete',
          type: 'del',
          pop: {
            title: '確認刪除此日誌？',
            okType: 'danger'
          },
          click: (record: any) => this.deleteLog(record)
        }
      ]
    }
  ];

  ngOnInit(): void {
    const id = this.blueprintId();
    if (id) {
      this.loadLogs(id);
    }
  }

  loadLogs(blueprintId: string): void {
    this.logStore.loadLogs(blueprintId);
  }

  refresh(): void {
    const id = this.blueprintId();
    if (id) {
      this.loadLogs(id);
      this.message.success('重新整理完成');
    }
  }

  createLog(): void {
    const modalRef = this.modal.create({
      nzTitle: '新增工地施工日誌',
      nzContent: ConstructionLogModalComponent,
      nzData: {
        blueprintId: this.blueprintId(),
        mode: 'create'
      },
      nzWidth: 800,
      nzFooter: null,
      nzMaskClosable: false
    });

    modalRef.afterClose.subscribe(result => {
      if (result?.success) {
        // No need to refresh - store already updated the list with the new log
        this.message.success('日誌新增成功');
      }
    });
  }

  viewLog(log: Log): void {
    this.modal.create({
      nzTitle: '查看工地施工日誌',
      nzContent: ConstructionLogModalComponent,
      nzData: {
        blueprintId: this.blueprintId(),
        log,
        mode: 'view'
      },
      nzWidth: 800,
      nzFooter: null
    });
  }

  editLog(log: Log): void {
    const modalRef = this.modal.create({
      nzTitle: '編輯工地施工日誌',
      nzContent: ConstructionLogModalComponent,
      nzData: {
        blueprintId: this.blueprintId(),
        log,
        mode: 'edit'
      },
      nzWidth: 800,
      nzFooter: null,
      nzMaskClosable: false
    });

    modalRef.afterClose.subscribe(result => {
      if (result?.success) {
        // No need to refresh - store already updated the list with the edited log
        this.message.success('日誌更新成功');
      }
    });
  }

  async deleteLog(log: Log): Promise<void> {
    const blueprintId = this.blueprintId();
    if (!blueprintId || !log.id) return;

    try {
      await this.logStore.deleteLog(blueprintId, log.id);
      this.message.success('日誌刪除成功');
    } catch (error) {
      this.message.error('日誌刪除失敗');
    }
  }

  handleTableChange(event: STChange): void {
    // Future: Handle pagination, sorting, filtering
  }
}
