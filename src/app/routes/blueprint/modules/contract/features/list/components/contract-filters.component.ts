/**
 * Contract Filters Component
 * 合約篩選元件 - 提供搜尋和操作按鈕
 *
 * Feature: List
 * Responsibility: Provide search and action controls
 * Interface: Emits events for create/reload/search actions
 */

import { Component, ChangeDetectionStrategy, signal, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-contract-filters',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, FormsModule],
  template: `
    <nz-card class="mb-md">
      <nz-row [nzGutter]="16" nzAlign="middle">
        <nz-col [nzFlex]="'auto'">
          <button nz-button nzType="primary" (click)="onCreate()" class="mr-sm">
            <span nz-icon nzType="plus"></span>
            新增合約
          </button>
          <button 
            nz-button 
            (click)="onQuickCreate()" 
            class="mr-sm" 
            nz-tooltip 
            nzTooltipTitle="快速建立（跳過上傳與解析）"
          >
            <span nz-icon nzType="thunderbolt"></span>
            快速建立
          </button>
          <button nz-button (click)="onReload()">
            <span nz-icon nzType="reload"></span>
            重新載入
          </button>
        </nz-col>
        <nz-col [nzFlex]="'none'">
          <nz-input-group [nzPrefix]="searchPrefix" style="width: 240px;">
            <input 
              nz-input 
              placeholder="搜尋合約..." 
              [(ngModel)]="searchText" 
              (ngModelChange)="onSearchChange()" 
            />
          </nz-input-group>
          <ng-template #searchPrefix>
            <span nz-icon nzType="search"></span>
          </ng-template>
        </nz-col>
      </nz-row>
    </nz-card>
  `
})
export class ContractFiltersComponent {
  searchText = '';

  // Outputs
  readonly create = output<void>();
  readonly quickCreate = output<void>();
  readonly reload = output<void>();
  readonly searchChange = output<string>();

  onCreate(): void {
    this.create.emit();
  }

  onQuickCreate(): void {
    this.quickCreate.emit();
  }

  onReload(): void {
    this.reload.emit();
  }

  onSearchChange(): void {
    this.searchChange.emit(this.searchText);
  }
}
