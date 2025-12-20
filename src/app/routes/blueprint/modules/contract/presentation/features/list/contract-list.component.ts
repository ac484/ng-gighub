/**
 * Contract List Component
 * 合約列表元件 - List Feature Main Component
 *
 * Feature: List
 * Responsibility: Orchestrate statistics, filters, and table components
 * Interface: Emits events for actions (create/view/edit/delete)
 * Cohesion: High - all list-related UI components
 * Coupling: Low - communicates via events only
 */

import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import type { Contract, ContractStatistics } from '@routes/blueprint/modules/contract/data/models';
import { SHARED_IMPORTS } from '@shared';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

import { ContractFiltersComponent } from './components/contract-filters.component';
import { ContractStatisticsComponent } from './components/contract-statistics.component';
import { ContractTableComponent } from './components/contract-table.component';

@Component({
  selector: 'app-contract-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzEmptyModule, ContractStatisticsComponent, ContractFiltersComponent, ContractTableComponent],
  template: `
    <!-- Statistics -->
    <app-contract-statistics [statistics]="statistics()" />

    <!-- Filters and Actions -->
    <app-contract-filters
      (create)="create.emit()"
      (quickCreate)="quickCreate.emit()"
      (reload)="reload.emit()"
      (searchChange)="onSearchChange($event)"
    />

    <!-- Contracts List -->
    <nz-card nzTitle="合約列表">
      @if (loading()) {
        <nz-spin nzSimple />
      } @else if (filteredContracts().length === 0) {
        <nz-empty nzNotFoundContent="暫無合約記錄">
          <ng-template #nzNotFoundFooter>
            <button nz-button nzType="primary" (click)="create.emit()">
              <span nz-icon nzType="plus"></span>
              新增第一份合約
            </button>
          </ng-template>
        </nz-empty>
      } @else {
        <app-contract-table
          [contracts]="filteredContracts()"
          [loading]="loading()"
          (viewContract)="viewContract.emit($event)"
          (editContract)="editContract.emit($event)"
          (deleteContract)="deleteContract.emit($event)"
          (previewContract)="previewContract.emit($event)"
          (parseContract)="parseContract.emit($event)"
        />
      }
    </nz-card>
  `
})
export class ContractListComponent {
  // Inputs
  contracts = input.required<Contract[]>();
  statistics = input.required<ContractStatistics>();
  loading = input<boolean>(false);

  // Search state (internal to list feature)
  private searchText = '';

  // Filtered contracts based on search
  filteredContracts = computed(() => {
    const list = this.contracts();
    if (!this.searchText.trim()) {
      return list;
    }
    const search = this.searchText.toLowerCase();
    return list.filter(
      c =>
        c.contractNumber.toLowerCase().includes(search) ||
        c.title.toLowerCase().includes(search) ||
        c.owner.name.toLowerCase().includes(search) ||
        c.contractor.name.toLowerCase().includes(search)
    );
  });

  // Outputs - Interface with parent
  readonly create = output<void>();
  readonly quickCreate = output<void>();
  readonly reload = output<void>();
  readonly viewContract = output<Contract>();
  readonly editContract = output<Contract>();
  readonly deleteContract = output<Contract>();
  readonly previewContract = output<Contract>();
  readonly parseContract = output<Contract>();

  /**
   * Handle search text change
   */
  onSearchChange(searchText: string): void {
    this.searchText = searchText;
  }
}
