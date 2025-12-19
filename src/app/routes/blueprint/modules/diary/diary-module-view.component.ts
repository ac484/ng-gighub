/**
 * Diary Module View Component
 * 日誌模組視圖元件
 *
 * Main orchestrator for diary module
 * Coordinates list, create, edit, and delete features
 *
 * ✅ Follows feature-based architecture
 * ✅ High cohesion, low coupling
 * ✅ Thin orchestration layer
 *
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, OnInit, inject, input, computed } from '@angular/core';
import { ConstructionLogStore } from '@core/stores';
import { Log } from '@core/types/log/log.types';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';

import { DiaryListComponent } from './features/list';
import { DiaryEditModalComponent } from './features/edit';

@Component({
  selector: 'app-diary-module-view',
  standalone: true,
  imports: [SHARED_IMPORTS, DiaryListComponent],
  template: `
    <app-diary-list
      [diaries]="diaries()"
      [statistics]="statistics()"
      [loading]="loading()"
      [error]="error()"
      (create)="handleCreate()"
      (refresh)="handleRefresh()"
      (viewDiary)="handleView($event)"
      (editDiary)="handleEdit($event)"
      (deleteDiary)="handleDelete($event)"
    />
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `
  ]
})
export class DiaryModuleViewComponent implements OnInit {
  // Input from parent (Blueprint Detail)
  blueprintId = input.required<string>();

  // Injected services
  private logStore = inject(ConstructionLogStore);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);

  // State from store
  diaries = this.logStore.logs;
  loading = this.logStore.loading;
  error = this.logStore.error;

  // Computed statistics
  statistics = computed(() => ({
    total: this.logStore.totalCount(),
    thisMonth: this.logStore.thisMonthCount(),
    today: this.logStore.todayCount(),
    totalPhotos: this.logStore.totalPhotos()
  }));

  ngOnInit(): void {
    const id = this.blueprintId();
    if (id) {
      this.loadDiaries(id);
    }
  }

  private loadDiaries(blueprintId: string): void {
    this.logStore.loadLogs(blueprintId);
  }

  handleRefresh(): void {
    const id = this.blueprintId();
    if (id) {
      this.loadDiaries(id);
      this.message.success('重新整理完成');
    }
  }

  handleCreate(): void {
    const modalRef = this.modal.create({
      nzTitle: '新增工地施工日誌',
      nzContent: DiaryEditModalComponent,
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
        this.message.success('日誌新增成功');
      }
    });
  }

  handleView(diary: Log): void {
    this.modal.create({
      nzTitle: '查看工地施工日誌',
      nzContent: DiaryEditModalComponent,
      nzData: {
        blueprintId: this.blueprintId(),
        diary,
        mode: 'view'
      },
      nzWidth: 800,
      nzFooter: null
    });
  }

  handleEdit(diary: Log): void {
    const modalRef = this.modal.create({
      nzTitle: '編輯工地施工日誌',
      nzContent: DiaryEditModalComponent,
      nzData: {
        blueprintId: this.blueprintId(),
        diary,
        mode: 'edit'
      },
      nzWidth: 800,
      nzFooter: null,
      nzMaskClosable: false
    });

    modalRef.afterClose.subscribe(result => {
      if (result?.success) {
        this.message.success('日誌更新成功');
      }
    });
  }

  async handleDelete(diary: Log): Promise<void> {
    const blueprintId = this.blueprintId();
    if (!blueprintId || !diary.id) return;

    try {
      await this.logStore.deleteLog(blueprintId, diary.id);
      this.message.success('日誌刪除成功');
    } catch (error) {
      this.message.error('日誌刪除失敗');
    }
  }
}
