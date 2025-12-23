/**
 * Module Manager Component
 *
 * Main interface for managing Blueprint modules.
 * Provides module list, search, filtering, and bulk operations.
 *
 * @author GigHub Development Team
 * @date 2025-12-11
 */

import { Component, OnInit, inject, signal, computed, DestroyRef, input, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ModuleStatus } from '../../shared/enums/module-status.enum';
import { BlueprintModuleDocument } from '@core/blueprint/domain/models';
import { STColumn, STData } from '@delon/abc/st';
import { ModalHelper } from '@delon/theme';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';

import { ModuleCardComponent } from './components/module-card.component';
import { ModuleConfigFormComponent } from './components/module-config-form.component';
import { ModuleDependencyGraphComponent } from './components/module-dependency-graph.component';
import { ModuleStatusBadgeComponent } from './components/module-status-badge.component';
import { ModuleManagerService } from './module-manager.service';

@Component({
  selector: 'app-module-manager',
  standalone: true,
  imports: [SHARED_IMPORTS, ModuleCardComponent],
  template: `
    <page-header [title]="'模組管理'">
      <ng-template #extra>
        <button nz-button nzType="primary" (click)="registerModule()">
          <span nz-icon nzType="plus" nzTheme="outline"></span>
          註冊模組
        </button>
        <button nz-button (click)="refresh()">
          <span nz-icon nzType="reload" nzTheme="outline"></span>
          重新整理
        </button>
        <button nz-button (click)="showDependencyGraph()">
          <span nz-icon nzType="apartment" nzTheme="outline"></span>
          依賴圖
        </button>
      </ng-template>
    </page-header>

    <!-- Statistics -->
    <nz-card [nzTitle]="'模組統計'" class="mb-3">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="4">
          <nz-statistic [nzValue]="stats().total" [nzTitle]="'總模組數'" [nzPrefix]="totalIcon"> </nz-statistic>
        </nz-col>
        <nz-col [nzSpan]="4">
          <nz-statistic [nzValue]="stats().enabled" [nzTitle]="'已啟用'" [nzValueStyle]="{ color: '#52c41a' }"> </nz-statistic>
        </nz-col>
        <nz-col [nzSpan]="4">
          <nz-statistic [nzValue]="stats().disabled" [nzTitle]="'已停用'" [nzValueStyle]="{ color: '#8c8c8c' }"> </nz-statistic>
        </nz-col>
        <nz-col [nzSpan]="4">
          <nz-statistic [nzValue]="stats().running" [nzTitle]="'運行中'" [nzValueStyle]="{ color: '#1890ff' }"> </nz-statistic>
        </nz-col>
        <nz-col [nzSpan]="4">
          <nz-statistic [nzValue]="stats().failed" [nzTitle]="'失敗'" [nzValueStyle]="{ color: '#ff4d4f' }"> </nz-statistic>
        </nz-col>
        <nz-col [nzSpan]="4">
          <nz-statistic [nzValue]="stats().uninitialized" [nzTitle]="'未初始化'" [nzValueStyle]="{ color: '#faad14' }"> </nz-statistic>
        </nz-col>
      </nz-row>
    </nz-card>

    <!-- Filters & Actions -->
    <nz-card class="mb-3">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="8">
          <nz-input-group [nzPrefix]="searchIcon">
            <input nz-input placeholder="搜尋模組名稱或描述" [(ngModel)]="searchText" (ngModelChange)="onSearchChange()" />
          </nz-input-group>
        </nz-col>
        <nz-col [nzSpan]="4">
          <nz-select nzPlaceHolder="狀態篩選" [(ngModel)]="statusFilter" (ngModelChange)="onFilterChange()" style="width: 100%">
            <nz-option nzValue="all" nzLabel="全部"></nz-option>
            <nz-option nzValue="enabled" nzLabel="已啟用"></nz-option>
            <nz-option nzValue="disabled" nzLabel="已停用"></nz-option>
            <nz-option nzValue="failed" nzLabel="失敗"></nz-option>
          </nz-select>
        </nz-col>
        <nz-col [nzSpan]="4">
          <nz-radio-group [(ngModel)]="viewMode" (ngModelChange)="onViewModeChange()">
            <label nz-radio-button nzValue="grid">
              <span nz-icon nzType="appstore" nzTheme="outline"></span>
              網格
            </label>
            <label nz-radio-button nzValue="table">
              <span nz-icon nzType="unordered-list" nzTheme="outline"></span>
              列表
            </label>
          </nz-radio-group>
        </nz-col>
        <nz-col [nzSpan]="8" class="text-right">
          @if (selectedCount() > 0) {
            <nz-space>
              <span *nzSpaceItem>已選取 {{ selectedCount() }} 個模組</span>
              <button *nzSpaceItem nz-button nzType="primary" nzSize="small" (click)="bulkEnable()"> 批次啟用 </button>
              <button *nzSpaceItem nz-button nzSize="small" (click)="bulkDisable()"> 批次停用 </button>
              <button *nzSpaceItem nz-button nzDanger nzSize="small" (click)="clearSelection()"> 清除選取 </button>
            </nz-space>
          }
        </nz-col>
      </nz-row>
    </nz-card>

    <!-- Loading State -->
    @if (loading()) {
      <nz-card>
        <div class="text-center py-5">
          <nz-spin nzSimple [nzSize]="'large'"></nz-spin>
          <p class="mt-3">載入模組中...</p>
        </div>
      </nz-card>
    }

    <!-- Error State -->
    @else if (error()) {
      <nz-alert nzType="error" nzMessage="載入失敗" [nzDescription]="error()" nzShowIcon nzCloseable (nzOnClose)="clearError()"> </nz-alert>
    }

    <!-- Grid View -->
    @else if (viewMode === 'grid') {
      @if (filteredModules().length === 0) {
        <nz-empty [nzNotFoundContent]="'沒有找到模組'" [nzNotFoundFooter]="emptyFooter"> </nz-empty>
        <ng-template #emptyFooter>
          <button nz-button nzType="primary" (click)="registerModule()"> 註冊第一個模組 </button>
        </ng-template>
      } @else {
        <nz-row [nzGutter]="[16, 16]">
          @for (module of filteredModules(); track module.id) {
            @if (module.id) {
              <nz-col [nzSpan]="8">
                <app-module-card
                  [module]="module"
                  [selected]="isSelected(module.id)"
                  (selectionChange)="toggleSelection(module.id)"
                  (enableChange)="onEnableChange(module)"
                  (configClick)="openConfig(module)"
                  (deleteClick)="deleteModule(module)"
                >
                </app-module-card>
              </nz-col>
            }
          }
        </nz-row>
      }
    }

    <!-- Table View -->
    @else {
      <nz-card>
        <st
          #st
          [data]="filteredModules()"
          [columns]="columns"
          [loading]="loading()"
          [page]="{ show: true, showSize: true }"
          (change)="onTableChange($event)"
        >
        </st>
      </nz-card>
    }

    <!-- Icons -->
    <ng-template #searchIcon>
      <span nz-icon nzType="search" nzTheme="outline"></span>
    </ng-template>
    <ng-template #totalIcon>
      <span nz-icon nzType="appstore" nzTheme="outline"></span>
    </ng-template>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .mb-3 {
        margin-bottom: 1.5rem;
      }

      .text-center {
        text-align: center;
      }

      .text-right {
        text-align: right;
      }

      .py-5 {
        padding-top: 3rem;
        padding-bottom: 3rem;
      }

      .mt-3 {
        margin-top: 1rem;
      }
    `
  ]
})
export class ModuleManagerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(ModuleManagerService);
  private modal = inject(ModalHelper);
  private message = inject(NzMessageService);
  private destroyRef = inject(DestroyRef);

  // Inputs
  blueprintId = input.required<string>();

  // Component state
  searchText = '';
  statusFilter: 'all' | 'enabled' | 'disabled' | 'failed' = 'all';
  viewMode: 'grid' | 'table' = 'grid';
  blueprintName = signal<string>('Blueprint');

  // Service state
  loading = this.service.loading;
  error = this.service.error;
  modules = this.service.modules;
  stats = this.service.moduleStats;
  selectedModules = this.service.selectedModules;

  // Computed
  selectedCount = computed(() => this.selectedModules().size);

  filteredModules = computed(() => {
    let filtered = this.modules();

    // Search filter
    if (this.searchText) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter(m => m.name.toLowerCase().includes(search) || m.moduleType.toLowerCase().includes(search));
    }

    // Status filter
    if (this.statusFilter !== 'all') {
      switch (this.statusFilter) {
        case 'enabled':
          filtered = filtered.filter(m => m.enabled);
          break;
        case 'disabled':
          filtered = filtered.filter(m => !m.enabled);
          break;
        case 'failed':
          filtered = filtered.filter(m => m.status === ModuleStatus.ERROR);
          break;
      }
    }

    return filtered;
  });

  // Table columns
  columns: STColumn[] = [
    {
      title: '選取',
      type: 'checkbox',
      index: 'id',
      selections: [
        {
          text: '全選',
          select: () => this.service.selectAll()
        },
        {
          text: '清除',
          select: () => this.service.clearSelection()
        }
      ]
    },
    {
      title: '模組名稱',
      index: 'name',
      sort: true
    },
    {
      title: '狀態',
      index: 'status',
      type: 'badge',
      badge: {
        [ModuleStatus.RUNNING]: { text: '運行中', color: 'success' },
        [ModuleStatus.STOPPED]: { text: '已停止', color: 'default' },
        [ModuleStatus.ERROR]: { text: '錯誤', color: 'error' },
        [ModuleStatus.UNINITIALIZED]: { text: '未初始化', color: 'warning' }
      }
    },
    {
      title: '啟用',
      index: 'enabled',
      type: 'yn',
      yn: {
        truth: true,
        yes: '是',
        no: '否'
      }
    },
    {
      title: '類型',
      index: 'moduleType'
    },
    {
      title: '版本',
      index: 'version'
    },
    {
      title: '更新時間',
      index: 'updatedAt',
      type: 'date',
      dateFormat: 'yyyy-MM-dd HH:mm'
    },
    {
      title: '操作',
      buttons: [
        {
          text: '配置',
          icon: 'setting',
          click: (record: any) => this.openConfig(record)
        },
        {
          text: '啟用',
          icon: 'check',
          iif: (record: any) => !record.enabled,
          click: (record: any) => this.enableModule(record)
        },
        {
          text: '停用',
          icon: 'stop',
          iif: (record: any) => record.enabled,
          click: (record: any) => this.disableModule(record)
        },
        {
          text: '刪除',
          icon: 'delete',
          type: 'del',
          pop: {
            title: '確定要刪除此模組嗎？',
            okType: 'danger',
            icon: 'delete'
          },
          click: (record: any) => this.deleteModule(record)
        }
      ]
    }
  ];

  ngOnInit(): void {
    // Load modules when component initializes
    // blueprintId is provided as input from parent component
    if (this.blueprintId()) {
      this.loadModules();
    }
  }

  async loadModules(): Promise<void> {
    try {
      await this.service.loadModules(this.blueprintId());
    } catch {
      this.message.error('載入模組失敗');
    }
  }

  async refresh(): Promise<void> {
    try {
      await this.service.reloadModules();
      this.message.success('已重新整理模組列表');
    } catch {
      this.message.error('重新整理失敗');
    }
  }

  registerModule(): void {
    // TODO: Open register module modal
    this.message.info('註冊模組功能開發中');
  }

  showDependencyGraph(): void {
    this.modal
      .create(ModuleDependencyGraphComponent, { modules: this.modules() }, { size: 'lg', modalOptions: { nzTitle: '模組依賴圖' } })
      .subscribe();
  }

  onSearchChange(): void {
    // Trigger re-computation of filteredModules
  }

  onFilterChange(): void {
    // Trigger re-computation of filteredModules
  }

  onViewModeChange(): void {
    // View mode changed
  }

  isSelected(moduleId: string): boolean {
    return this.selectedModules().has(moduleId);
  }

  toggleSelection(moduleId: string): void {
    this.service.toggleSelection(moduleId);
  }

  clearSelection(): void {
    this.service.clearSelection();
  }

  async bulkEnable(): Promise<void> {
    const ids = this.service.getSelectedIds();
    if (ids.length === 0) {
      this.message.warning('請先選取模組');
      return;
    }

    try {
      const result = await this.service.batchUpdateEnabled(ids, true);
      this.message.success(`成功啟用 ${result.success.length} 個模組`);
      if (result.failed.length > 0) {
        this.message.warning(`${result.failed.length} 個模組啟用失敗`);
      }
      this.service.clearSelection();
    } catch {
      this.message.error('批次啟用失敗');
    }
  }

  async bulkDisable(): Promise<void> {
    const ids = this.service.getSelectedIds();
    if (ids.length === 0) {
      this.message.warning('請先選取模組');
      return;
    }

    try {
      const result = await this.service.batchUpdateEnabled(ids, false);
      this.message.success(`成功停用 ${result.success.length} 個模組`);
      if (result.failed.length > 0) {
        this.message.warning(`${result.failed.length} 個模組停用失敗`);
      }
      this.service.clearSelection();
    } catch {
      this.message.error('批次停用失敗');
    }
  }

  onEnableChange(module: BlueprintModuleDocument): void {
    if (module.enabled) {
      this.disableModule(module);
    } else {
      this.enableModule(module);
    }
  }

  async enableModule(module: BlueprintModuleDocument): Promise<void> {
    if (!module.id) return;
    try {
      await this.service.enableModule(module.id);
      this.message.success(`已啟用模組: ${module.name}`);
    } catch {
      this.message.error('啟用模組失敗');
    }
  }

  async disableModule(module: BlueprintModuleDocument): Promise<void> {
    if (!module.id) return;
    try {
      await this.service.disableModule(module.id);
      this.message.success(`已停用模組: ${module.name}`);
    } catch {
      this.message.error('停用模組失敗');
    }
  }

  openConfig(module: BlueprintModuleDocument): void {
    this.modal
      .create(ModuleConfigFormComponent, { module }, { size: 'md', modalOptions: { nzTitle: `配置: ${module.name}` } })
      .subscribe((config: any) => {
        if (config) {
          this.updateConfig(module, config);
        }
      });
  }

  async updateConfig(module: BlueprintModuleDocument, config: any): Promise<void> {
    if (!module.id) return;
    try {
      await this.service.updateModuleConfig(module.id, config);
      this.message.success('配置已更新');
    } catch {
      this.message.error('更新配置失敗');
    }
  }

  async deleteModule(module: BlueprintModuleDocument): Promise<void> {
    if (!module.id) return;
    try {
      await this.service.deleteModule(module.id);
      this.message.success(`已刪除模組: ${module.name}`);
    } catch {
      this.message.error('刪除模組失敗');
    }
  }

  clearError(): void {
    // Error will be cleared on next operation
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onTableChange(_event: any): void {
    // Handle table pagination/sorting changes
  }
}
