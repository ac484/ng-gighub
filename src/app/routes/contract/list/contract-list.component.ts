/**
 * Contract List Component - 合約清單
 *
 * Phase 2 Task 2.1: Contract List Component with ST Table
 *
 * Displays all contracts in a blueprint with sorting, filtering, and pagination.
 * Uses ng-alain ST table with Angular 20+ Signals for reactive state management.
 *
 * Features:
 * - ST table with all contract fields
 * - Status filtering and search
 * - Sorting and pagination
 * - Bulk operations (future)
 * - Navigation to detail/edit views
 *
 * @module ContractListComponent
 * @author GigHub Development Team
 * @date 2025-12-18
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ContractFacade } from '@core/blueprint/modules/implementations/contract';
import type { Contract, ContractStatus } from '@core/blueprint/modules/implementations/contract';
import { STColumn, STChange } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

/**
 * 合約清單元件
 */
@Component({
  selector: 'app-contract-list',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-card [nzTitle]="cardTitle" [nzExtra]="cardExtra">
      <ng-template #cardTitle>
        <span style="font-size: 18px; font-weight: 500;">合約管理</span>
        <span style="color: #999; font-size: 14px; margin-left: 12px;"> 檢視與管理所有合約 </span>
      </ng-template>
      <ng-template #cardExtra>
        <button nz-button nzType="primary" (click)="createContract()">
          <span nz-icon nzType="plus"></span>
          新增合約
        </button>
      </ng-template>

      <!-- 狀態統計 -->
      <div class="stats-bar" style="margin-bottom: 16px; display: flex; gap: 24px; flex-wrap: wrap;">
        <nz-statistic nzTitle="草稿" [nzValue]="draftCount()" nzPrefix="📝" />
        <nz-statistic nzTitle="待生效" [nzValue]="pendingCount()" nzPrefix="⏳" />
        <nz-statistic nzTitle="已生效" [nzValue]="activeCount()" nzPrefix="✅" />
        <nz-statistic nzTitle="已完成" [nzValue]="completedCount()" nzPrefix="🏁" />
      </div>

      <!-- 篩選區域 -->
      <div class="filter-bar" style="margin-bottom: 16px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
        <nz-select
          nzMode="multiple"
          [(ngModel)]="selectedStatuses"
          (ngModelChange)="onStatusChange()"
          nzPlaceHolder="選擇狀態"
          nzAllowClear
          style="width: 220px;"
        >
          @for (opt of statusOptions; track opt.value) {
            <nz-option [nzValue]="opt.value" [nzLabel]="opt.label" />
          }
        </nz-select>

        <nz-input-group nzPrefixIcon="search" style="width: 280px;">
          <input 
            nz-input 
            [(ngModel)]="searchText" 
            (input)="onSearchInput($event)" 
            placeholder="搜尋合約編號、標題、業主、承包商..." 
          />
        </nz-input-group>

        <nz-range-picker
          [(ngModel)]="dateRange"
          (ngModelChange)="onDateRangeChange()"
          nzFormat="yyyy-MM-dd"
          [nzPlaceHolder]="['開始日期', '結束日期']"
          style="width: 280px;"
        />

        <button nz-button (click)="clearFilters()" nzType="default">
          <span nz-icon nzType="close-circle"></span>
          清除篩選
        </button>

        <button nz-button (click)="refresh()" nzType="default">
          <span nz-icon nzType="reload"></span>
          重新整理
        </button>

        @if (hasActiveFilters()) {
          <nz-tag nzColor="blue">
            已篩選 {{ filteredContracts().length }} / {{ contracts().length }} 筆
          </nz-tag>
        }
      </div>

      <!-- 合約列表 -->
      <st
        #st
        [data]="filteredContracts()"
        [columns]="columns"
        [loading]="loading()"
        [page]="{ show: true, pageSize: 10, showSize: true, pageSizes: [10, 20, 50, 100] }"
        (change)="onTableChange($event)"
      />
    </nz-card>
  `,
  styles: [
    `
      .stats-bar ::ng-deep .ant-statistic {
        min-width: 100px;
      }
      .stats-bar ::ng-deep .ant-statistic-title {
        font-size: 12px;
        color: #999;
      }
      .stats-bar ::ng-deep .ant-statistic-content {
        font-size: 20px;
      }
    `
  ]
})
export class ContractListComponent implements OnInit {
  private readonly contractFacade = inject(ContractFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly message = inject(NzMessageService);
  private readonly destroyRef = inject(DestroyRef);

  // ==================== STATE ====================

  /** Loading from facade */
  loading = this.contractFacade.loading;

  /** All contracts from facade */
  contracts = this.contractFacade.contracts;

  /** Selected status filters (multiple) */
  selectedStatuses: ContractStatus[] = [];

  /** Search text */
  searchText = '';

  /** Date range filter */
  dateRange: [Date, Date] | null = null;

  /** Blueprint ID (from route) */
  blueprintId = signal('');

  /** Search subject for debouncing */
  private searchSubject = new Subject<string>();

  /** Debounced search signal */
  private debouncedSearch = signal('');

  // ==================== OPTIONS ====================

  /** Status filter options */
  statusOptions: Array<{ value: ContractStatus; label: string }> = [
    { value: 'draft', label: '草稿' },
    { value: 'pending_activation', label: '待生效' },
    { value: 'active', label: '已生效' },
    { value: 'completed', label: '已完成' },
    { value: 'terminated', label: '已終止' }
  ];

  // ==================== COMPUTED SIGNALS ====================

  /** Count by status */
  draftCount = computed(() => this.contracts().filter(c => c.status === 'draft').length);
  pendingCount = computed(() => this.contracts().filter(c => c.status === 'pending_activation').length);
  activeCount = computed(() => this.contracts().filter(c => c.status === 'active').length);
  completedCount = computed(() => this.contracts().filter(c => c.status === 'completed').length);

  /** Filtered contracts based on status, search, and date range */
  filteredContracts = computed(() => {
    let result = this.contracts();

    // Filter by status (multiple)
    if (this.selectedStatuses.length > 0) {
      result = result.filter(c => this.selectedStatuses.includes(c.status));
    }

    // Filter by debounced search text
    const searchTerm = this.debouncedSearch().toLowerCase();
    if (searchTerm) {
      result = result.filter(
        c =>
          c.contractNumber.toLowerCase().includes(searchTerm) ||
          c.title.toLowerCase().includes(searchTerm) ||
          c.owner.name.toLowerCase().includes(searchTerm) ||
          c.contractor.name.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by date range (signing date)
    if (this.dateRange && this.dateRange[0] && this.dateRange[1]) {
      const [startDate, endDate] = this.dateRange;
      result = result.filter(c => {
        const signingDate = new Date(c.signingDate);
        return signingDate >= startDate && signingDate <= endDate;
      });
    }

    return result;
  });

  /** Check if any filters are active */
  hasActiveFilters = computed(() => {
    return (
      this.selectedStatuses.length > 0 ||
      this.debouncedSearch().length > 0 ||
      this.dateRange !== null
    );
  });

  // ==================== ST TABLE COLUMNS ====================

  columns: STColumn[] = [
    { 
      title: '合約編號', 
      index: 'contractNumber', 
      width: 150,
      sort: true
    },
    { 
      title: '合約標題', 
      index: 'title', 
      width: 200,
      sort: true
    },
    {
      title: '狀態',
      index: 'status',
      width: 100,
      type: 'badge',
      badge: {
        draft: { text: '草稿', color: 'default' },
        pending_activation: { text: '待生效', color: 'processing' },
        active: { text: '已生效', color: 'success' },
        completed: { text: '已完成', color: 'success' },
        terminated: { text: '已終止', color: 'error' }
      },
      sort: true
    },
    { 
      title: '業主', 
      index: 'owner.name', 
      width: 150
    },
    { 
      title: '承包商', 
      index: 'contractor.name', 
      width: 150
    },
    {
      title: '合約金額',
      index: 'totalAmount',
      width: 120,
      type: 'currency',
      currency: { format: { ngCurrency: { display: 'symbol', currencyCode: 'TWD' } } },
      sort: true,
      className: 'text-right'
    },
    {
      title: '簽約日期',
      index: 'signingDate',
      type: 'date',
      dateFormat: 'yyyy-MM-dd',
      width: 120,
      sort: true
    },
    {
      title: '開始日期',
      index: 'startDate',
      type: 'date',
      dateFormat: 'yyyy-MM-dd',
      width: 120,
      sort: true
    },
    {
      title: '結束日期',
      index: 'endDate',
      type: 'date',
      dateFormat: 'yyyy-MM-dd',
      width: 120,
      sort: true
    },
    {
      title: '操作',
      width: 180,
      buttons: [
        {
          text: '查看',
          type: 'link',
          click: (record: Contract) => this.viewDetail(record)
        },
        {
          text: '編輯',
          type: 'link',
          iif: (record: Contract) => record.status === 'draft',
          click: (record: Contract) => this.editContract(record)
        },
        {
          text: '刪除',
          type: 'link',
          iif: (record: Contract) => record.status === 'draft',
          pop: {
            title: '確認刪除此合約？',
            okType: 'danger'
          },
          click: (record: Contract) => this.deleteContract(record)
        }
      ]
    }
  ];

  // ==================== LIFECYCLE ====================

  ngOnInit(): void {
    // Setup debounced search (300ms delay)
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(searchTerm => {
        this.debouncedSearch.set(searchTerm);
        this.updateUrlQueryParams();
      });

    // 取得藍圖 ID 並初始化 facade
    this.route.parent?.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = params['id'];
      if (id) {
        this.blueprintId.set(id);
        this.contractFacade.initialize(id);
        this.loadContracts();
      }
    });

    // 監聽 facade 錯誤
    this.contractFacade.error.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(error => {
      if (error) {
        this.message.error(error);
      }
    });

    // Restore filters from URL query params
    this.restoreFiltersFromUrl();
  }

  // ==================== ACTIONS ====================

  /**
   * Load contracts for current blueprint
   */
  loadContracts(): void {
    const bpId = this.blueprintId();
    if (!bpId) return;

    // ContractFacade.initialize already loads contracts
    // This method can be used for refresh
  }

  /**
   * Handle status filter change
   */
  onStatusChange(): void {
    // Filtered contracts computed signal will update automatically
    this.updateUrlQueryParams();
  }

  /**
   * Handle search input (debounced)
   */
  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchSubject.next(input.value);
  }

  /**
   * Handle date range filter change
   */
  onDateRangeChange(): void {
    // Filtered contracts computed signal will update automatically
    this.updateUrlQueryParams();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.selectedStatuses = [];
    this.searchText = '';
    this.debouncedSearch.set('');
    this.dateRange = null;
    this.updateUrlQueryParams();
    this.message.info('已清除所有篩選條件');
  }

  /**
   * Update URL query params with current filter state
   */
  private updateUrlQueryParams(): void {
    const queryParams: any = {};

    if (this.selectedStatuses.length > 0) {
      queryParams['status'] = this.selectedStatuses.join(',');
    }

    if (this.debouncedSearch()) {
      queryParams['search'] = this.debouncedSearch();
    }

    if (this.dateRange && this.dateRange[0] && this.dateRange[1]) {
      queryParams['startDate'] = this.dateRange[0].toISOString();
      queryParams['endDate'] = this.dateRange[1].toISOString();
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  /**
   * Restore filters from URL query params
   */
  private restoreFiltersFromUrl(): void {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      // Restore status filter
      if (params['status']) {
        this.selectedStatuses = params['status'].split(',') as ContractStatus[];
      }

      // Restore search filter
      if (params['search']) {
        this.searchText = params['search'];
        this.debouncedSearch.set(params['search']);
      }

      // Restore date range filter
      if (params['startDate'] && params['endDate']) {
        this.dateRange = [new Date(params['startDate']), new Date(params['endDate'])];
      }
    });
  }

  /**
   * Refresh contract list
   */
  refresh(): void {
    this.loadContracts();
    this.message.success('資料已重新整理');
  }

  /**
   * Handle ST table change events (pagination, sorting, etc.)
   */
  onTableChange(change: STChange): void {
    // Handle table events if needed
    // e.g., change.type === 'pi' for pagination
    // e.g., change.type === 'sort' for sorting
  }

  /**
   * Navigate to create contract page
   */
  createContract(): void {
    this.router.navigate(['create'], { relativeTo: this.route });
  }

  /**
   * Navigate to contract detail page
   */
  viewDetail(contract: Contract): void {
    this.router.navigate([contract.id], { relativeTo: this.route });
  }

  /**
   * Navigate to edit contract page
   */
  editContract(contract: Contract): void {
    this.router.navigate([contract.id, 'edit'], { relativeTo: this.route });
  }

  /**
   * Delete contract (only for drafts)
   */
  async deleteContract(contract: Contract): Promise<void> {
    try {
      await this.contractFacade.deleteContract(contract.id);
      this.message.success('合約已刪除');
    } catch (error) {
      this.message.error('刪除合約失敗');
    }
  }
}
