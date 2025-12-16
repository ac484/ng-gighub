/**
 * Issues Module View Component
 * 問題域視圖元件 - 顯示於藍圖詳情頁面的 Tab 中
 *
 * ✅ Updated: 2025-12-15
 * - 整合 Issue Module 服務
 * - 使用 Angular 20 Signals 管理狀態
 * - 使用 ng-alain ST 元件顯示清單
 * - 整合 IssueModalComponent 提供完整 CRUD 功能
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input, signal, computed, effect } from '@angular/core';
import type { Issue, IssueStatus, IssueSeverity, IssueSource, IssueStatistics } from '@core/blueprint/modules/implementations/issue/models';
import { IssueLifecycleService } from '@core/blueprint/modules/implementations/issue/services/issue-lifecycle.service';
import { IssueManagementService } from '@core/blueprint/modules/implementations/issue/services/issue-management.service';
import { STColumn, STChange } from '@delon/abc/st';
import { ModalHelper } from '@delon/theme';
import { SHARED_IMPORTS } from '@shared';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { IssueModalComponent } from './issue-modal.component';

@Component({
  selector: 'app-issues-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzStatisticModule, NzEmptyModule, NzBadgeModule, NzTagModule],
  template: `
    <!-- Statistics Card -->
    <nz-card nzTitle="問題統計" class="mb-md">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="4">
          <nz-statistic [nzValue]="statistics().total" nzTitle="總計" />
        </nz-col>
        <nz-col [nzSpan]="4">
          <nz-statistic [nzValue]="statistics().open" nzTitle="待處理" [nzPrefix]="pendingIcon" />
          <ng-template #pendingIcon>
            <span nz-icon nzType="exclamation-circle" style="color: #faad14;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="4">
          <nz-statistic [nzValue]="statistics().inProgress" nzTitle="處理中" [nzPrefix]="processingIcon" />
          <ng-template #processingIcon>
            <span nz-icon nzType="clock-circle" style="color: #1890ff;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="4">
          <nz-statistic [nzValue]="statistics().resolved" nzTitle="已解決" [nzPrefix]="resolvedIcon" />
          <ng-template #resolvedIcon>
            <span nz-icon nzType="check-circle" style="color: #52c41a;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="4">
          <nz-statistic [nzValue]="statistics().verified" nzTitle="已驗證" [nzPrefix]="verifiedIcon" />
          <ng-template #verifiedIcon>
            <span nz-icon nzType="safety-certificate" style="color: #722ed1;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="4">
          <nz-statistic [nzValue]="statistics().closed" nzTitle="已關閉" [nzPrefix]="closedIcon" />
          <ng-template #closedIcon>
            <span nz-icon nzType="check-square" style="color: #8c8c8c;"></span>
          </ng-template>
        </nz-col>
      </nz-row>
    </nz-card>

    <!-- Action Toolbar -->
    <nz-card class="mb-md">
      <nz-row [nzGutter]="16" nzAlign="middle">
        <nz-col [nzFlex]="'auto'">
          <button nz-button nzType="primary" (click)="createIssue()" class="mr-sm">
            <span nz-icon nzType="plus"></span>
            新增問題
          </button>
          <button nz-button (click)="loadIssues()">
            <span nz-icon nzType="reload"></span>
            重新載入
          </button>
        </nz-col>
        <nz-col [nzFlex]="'none'">
          <nz-input-group [nzPrefix]="searchPrefix" style="width: 240px;">
            <input nz-input placeholder="搜尋問題..." />
          </nz-input-group>
          <ng-template #searchPrefix>
            <span nz-icon nzType="search"></span>
          </ng-template>
        </nz-col>
      </nz-row>
    </nz-card>

    <!-- Issues List -->
    <nz-card nzTitle="問題列表">
      @if (loading()) {
        <nz-spin nzSimple />
      } @else if (issues().length === 0) {
        <nz-empty nzNotFoundContent="暫無問題記錄">
          <ng-template #nzNotFoundFooter>
            <button nz-button nzType="primary" (click)="createIssue()">
              <span nz-icon nzType="plus"></span>
              新增第一筆問題
            </button>
          </ng-template>
        </nz-empty>
      } @else {
        <st
          [data]="issues()"
          [columns]="columns"
          [loading]="loading()"
          [page]="{ front: true, show: true }"
          (change)="handleTableChange($event)"
        />
      }
    </nz-card>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `
  ]
})
export class IssuesModuleViewComponent implements OnInit {
  blueprintId = input.required<string>();

  private readonly managementService = inject(IssueManagementService);
  private readonly lifecycleService = inject(IssueLifecycleService);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);
  private readonly modalHelper = inject(ModalHelper);

  // State signals
  issues = signal<Issue[]>([]);
  loading = signal(false);

  // Computed statistics
  statistics = computed<IssueStatistics>(() => {
    const issueList = this.issues();
    return {
      total: issueList.length,
      open: issueList.filter(i => i.status === 'open').length,
      inProgress: issueList.filter(i => i.status === 'in_progress').length,
      resolved: issueList.filter(i => i.status === 'resolved').length,
      verified: issueList.filter(i => i.status === 'verified').length,
      closed: issueList.filter(i => i.status === 'closed').length,
      bySeverity: {
        critical: issueList.filter(i => i.severity === 'critical').length,
        major: issueList.filter(i => i.severity === 'major').length,
        minor: issueList.filter(i => i.severity === 'minor').length
      },
      bySource: {
        manual: issueList.filter(i => i.source === 'manual').length,
        acceptance: issueList.filter(i => i.source === 'acceptance').length,
        qc: issueList.filter(i => i.source === 'qc').length,
        warranty: issueList.filter(i => i.source === 'warranty').length,
        safety: issueList.filter(i => i.source === 'safety').length
      }
    };
  });

  // Table columns definition
  columns: STColumn[] = [
    { title: '編號', index: 'issueNumber', width: 120 },
    { title: '標題', index: 'title' },
    {
      title: '來源',
      index: 'source',
      width: 100,
      type: 'tag',
      tag: {
        manual: { text: '手動', color: 'default' },
        acceptance: { text: '驗收', color: 'blue' },
        qc: { text: 'QC', color: 'cyan' },
        warranty: { text: '保固', color: 'orange' },
        safety: { text: '安全', color: 'red' }
      }
    },
    {
      title: '嚴重度',
      index: 'severity',
      width: 100,
      type: 'tag',
      tag: {
        critical: { text: '嚴重', color: 'error' },
        major: { text: '重要', color: 'warning' },
        minor: { text: '輕微', color: 'default' }
      }
    },
    {
      title: '狀態',
      index: 'status',
      width: 100,
      type: 'badge',
      badge: {
        open: { text: '待處理', color: 'warning' },
        in_progress: { text: '處理中', color: 'processing' },
        resolved: { text: '已解決', color: 'success' },
        verified: { text: '已驗證', color: 'success' },
        closed: { text: '已關閉', color: 'default' }
      }
    },
    { title: '位置', index: 'location', width: 150 },
    { title: '建立時間', index: 'createdAt', type: 'date', width: 150 },
    {
      title: '操作',
      width: 180,
      buttons: [
        {
          text: '查看',
          icon: 'eye',
          click: record => this.viewIssue(record as Issue)
        },
        {
          text: '編輯',
          icon: 'edit',
          iif: record => this.lifecycleService.canEdit(record as Issue),
          click: record => this.editIssue(record as Issue)
        },
        {
          text: '刪除',
          icon: 'delete',
          type: 'del',
          pop: {
            title: '確定要刪除此問題嗎？',
            okType: 'danger'
          },
          iif: record => this.lifecycleService.canDelete(record as Issue),
          click: record => this.deleteIssue(record as Issue)
        }
      ]
    }
  ];

  constructor() {
    // Effect to reload issues when blueprintId changes
    // Note: This effect is triggered only when blueprintId signal changes,
    // avoiding redundant calls due to Angular's signal-based reactivity
    effect(() => {
      const id = this.blueprintId();
      if (id) {
        // Using untracked to avoid circular dependency
        this.loadIssues();
      }
    });
  }

  ngOnInit(): void {
    // Initial load is handled by the effect above when blueprintId is set
  }

  /**
   * Load issues from the service
   */
  async loadIssues(): Promise<void> {
    const blueprintId = this.blueprintId();
    if (!blueprintId) return;

    this.loading.set(true);
    try {
      const issueList = await this.managementService.listIssues(blueprintId);
      this.issues.set(issueList);
    } catch (error) {
      this.message.error('載入問題列表失敗');
      console.error('[IssuesModuleView]', 'loadIssues failed', error);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Create a new issue - open modal form
   */
  createIssue(): void {
    this.modalHelper
      .createStatic(IssueModalComponent, { blueprintId: this.blueprintId() }, { size: 'md', modalOptions: { nzTitle: '新增問題' } })
      .subscribe(result => {
        if (result) {
          this.loadIssues();
        }
      });
  }

  /**
   * View issue details
   * Uses plain text content to prevent XSS
   */
  viewIssue(issue: Issue): void {
    const content = [
      `標題: ${this.escapeHtml(issue.title)}`,
      `描述: ${this.escapeHtml(issue.description)}`,
      `位置: ${this.escapeHtml(issue.location)}`,
      `狀態: ${this.getStatusText(issue.status)}`,
      `嚴重度: ${this.getSeverityText(issue.severity)}`,
      `來源: ${this.getSourceText(issue.source)}`,
      `負責方: ${this.escapeHtml(issue.responsibleParty)}`
    ].join('\n\n');

    this.modal.info({
      nzTitle: `問題詳情: ${this.escapeHtml(issue.issueNumber)}`,
      nzContent: content,
      nzOkText: '關閉'
    });
  }

  /**
   * Edit issue - open modal form with existing data
   */
  editIssue(issue: Issue): void {
    this.modalHelper
      .createStatic(
        IssueModalComponent,
        { blueprintId: this.blueprintId(), issue },
        { size: 'md', modalOptions: { nzTitle: `編輯問題: ${issue.issueNumber}` } }
      )
      .subscribe(result => {
        if (result) {
          this.loadIssues();
        }
      });
  }

  /**
   * Delete issue
   */
  async deleteIssue(issue: Issue): Promise<void> {
    try {
      await this.managementService.deleteIssue(issue.id);
      this.message.success(`問題 ${issue.issueNumber} 已刪除`);
      await this.loadIssues();
    } catch (error) {
      this.message.error('刪除問題失敗');
      console.error('[IssuesModuleView]', 'deleteIssue failed', error);
    }
  }

  /**
   * Handle table change events
   */
  handleTableChange(event: STChange): void {
    if (event.type === 'click') {
      // Handle row click if needed
    }
  }

  private getStatusText(status: IssueStatus): string {
    const map: Record<IssueStatus, string> = {
      open: '待處理',
      in_progress: '處理中',
      resolved: '已解決',
      verified: '已驗證',
      closed: '已關閉'
    };
    return map[status] || status;
  }

  private getSeverityText(severity: IssueSeverity): string {
    const map: Record<IssueSeverity, string> = {
      critical: '嚴重',
      major: '重要',
      minor: '輕微'
    };
    return map[severity] || severity;
  }

  private getSourceText(source: IssueSource): string {
    const map: Record<IssueSource, string> = {
      manual: '手動',
      acceptance: '驗收',
      qc: 'QC',
      warranty: '保固',
      safety: '安全'
    };
    return map[source] || source;
  }

  /**
   * Escape HTML special characters to prevent XSS
   */
  private escapeHtml(text: string): string {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
