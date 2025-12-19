/**
 * Contract Detail Drawer Component (Refactored)
 * 合約詳情抽屜元件
 *
 * Feature: Detail
 * Responsibility: Orchestrate detail tabs and actions
 * Cohesion: High - manages detail view logic
 * Coupling: Low - uses tab components via interface
 * Extensibility: Easy to add new tabs
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input, output, computed } from '@angular/core';
import type { Contract } from '@core/blueprint/modules/implementations/contract/models';
import { SHARED_IMPORTS } from '@shared';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTabsModule } from 'ng-zorro-antd/tabs';

import { ContractStatusBadgeComponent } from '../../shared';
import { BasicInfoTabComponent } from './components/basic-info-tab.component';
import { PartiesTabComponent } from './components/parties-tab.component';
import { AttachmentsTabComponent } from './components/attachments-tab.component';
import { HistoryTabComponent } from './components/history-tab.component';

@Component({
  selector: 'app-contract-detail-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SHARED_IMPORTS,
    NzTabsModule,
    NzButtonModule,
    NzEmptyModule,
    ContractStatusBadgeComponent,
    BasicInfoTabComponent,
    PartiesTabComponent,
    AttachmentsTabComponent,
    HistoryTabComponent
  ],
  template: `
    <div class="contract-detail-drawer">
      @if (contract()) {
        <!-- Header Actions -->
        <div class="drawer-header-actions mb-md">
          <button nz-button nzType="primary" (click)="edit.emit(contract()!)">
            <span nz-icon nzType="edit"></span>
            編輯
          </button>
          <button nz-button nzType="default" (click)="download.emit(contract()!)" class="ml-sm">
            <span nz-icon nzType="download"></span>
            下載
          </button>
          @if (canActivate()) {
            <button nz-button nzType="default" (click)="activate.emit(contract()!)" class="ml-sm">
              <span nz-icon nzType="check-circle"></span>
              生效合約
            </button>
          }
        </div>

        <!-- Status Badge -->
        <div class="mb-md">
          <app-contract-status-badge [status]="contract()!.status" />
        </div>

        <!-- Tabs -->
        <nz-tabset>
          <nz-tab nzTitle="基本資訊">
            <app-basic-info-tab [contract]="contract()!" />
          </nz-tab>

          <nz-tab nzTitle="合約方">
            <app-parties-tab [contract]="contract()!" />
          </nz-tab>

          <nz-tab nzTitle="附件">
            <app-attachments-tab 
              [contract]="contract()!" 
              (downloadFile)="onDownloadFile($event)" 
            />
          </nz-tab>

          <nz-tab nzTitle="歷史記錄">
            <app-history-tab [contract]="contract()!" />
          </nz-tab>
        </nz-tabset>
      } @else {
        <nz-empty nzNotFoundContent="無合約資料"></nz-empty>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .contract-detail-drawer {
        padding: 0;
      }
      .drawer-header-actions {
        text-align: right;
      }
    `
  ]
})
export class ContractDetailDrawerComponent implements OnInit {
  // Inputs
  contract = input.required<Contract | null>();

  // Outputs
  readonly edit = output<Contract>();
  readonly activate = output<Contract>();
  readonly download = output<Contract>();

  // Computed
  canActivate = computed(() => {
    const contract = this.contract();
    return contract?.status === 'pending_activation';
  });

  ngOnInit(): void {
    // Component initialized
  }

  onDownloadFile(file: any): void {
    if (file.fileUrl) {
      window.open(file.fileUrl, '_blank');
    }
  }
}
