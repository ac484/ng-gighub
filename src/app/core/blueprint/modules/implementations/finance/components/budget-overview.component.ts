/**
 * Budget Overview Component
 *
 * SETC-069: Finance UI Components
 *
 * 預算概覽元件，提供：
 * - 預算摘要統計
 * - 預算進度視覺化
 * - 預算預警顯示
 * - 類別統計
 *
 * @module BudgetOverviewComponent
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import { Component, inject, signal, input, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

import type { BudgetSummary } from '../models/budget.model';
import { BudgetService } from '../services/budget.service';

@Component({
  selector: 'app-budget-overview',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-card nzTitle="預算概覽" [nzLoading]="loading()">
      @if (!loading()) {
        <!-- 摘要卡片 -->
        <nz-row [nzGutter]="16" class="mb-md">
          <nz-col [nzSpan]="6">
            <nz-statistic nzTitle="總預算" [nzValue]="summary()?.totalBudget || 0" nzPrefix="$" />
          </nz-col>
          <nz-col [nzSpan]="6">
            <nz-statistic nzTitle="已支出" [nzValue]="summary()?.totalSpent || 0" nzPrefix="$" [nzValueStyle]="{ color: '#cf1322' }" />
          </nz-col>
          <nz-col [nzSpan]="6">
            <nz-statistic
              nzTitle="剩餘預算"
              [nzValue]="summary()?.totalRemaining || 0"
              nzPrefix="$"
              [nzValueStyle]="{ color: '#3f8600' }"
            />
          </nz-col>
          <nz-col [nzSpan]="6">
            <nz-statistic nzTitle="執行率" [nzValue]="summary()?.overallUtilization || 0" nzSuffix="%" />
          </nz-col>
        </nz-row>

        <!-- 進度條 -->
        <div class="mb-md">
          <div class="progress-label">整體預算執行率</div>
          <nz-progress
            [nzPercent]="summary()?.overallUtilization || 0"
            [nzStatus]="getProgressStatus(summary()?.overallUtilization || 0)"
            nzStrokeWidth="20"
            [nzShowInfo]="true"
          />
        </div>

        <!-- 預警列表 -->
        @if (hasAlerts()) {
          <nz-alert nzType="warning" nzMessage="預算預警" [nzDescription]="alertsTpl" nzShowIcon class="mb-md" />
          <ng-template #alertsTpl>
            <ul class="alert-list">
              @for (alert of summary()!.alerts; track alert.budgetId) {
                <li>
                  <nz-tag [nzColor]="getAlertColor(alert.alertType)">
                    {{ getAlertLabel(alert.alertType) }}
                  </nz-tag>
                  {{ alert.message }}
                </li>
              }
            </ul>
          </ng-template>
        }

        <!-- 分類統計 -->
        @if (categoryData().length > 0) {
          <nz-table [nzData]="categoryData()" nzSize="small" [nzShowPagination]="false" [nzBordered]="true">
            <thead>
              <tr>
                <th>分類</th>
                <th nzAlign="right">預算</th>
                <th nzAlign="right">已支出</th>
                <th nzAlign="right">剩餘</th>
                <th nzWidth="200px">執行率</th>
              </tr>
            </thead>
            <tbody>
              @for (item of categoryData(); track item.category) {
                <tr>
                  <td>{{ getCategoryLabel(item.category) }}</td>
                  <td nzAlign="right">{{ item.totalBudget | currency: 'TWD' : 'symbol' : '1.0-0' }}</td>
                  <td nzAlign="right">{{ item.totalSpent | currency: 'TWD' : 'symbol' : '1.0-0' }}</td>
                  <td nzAlign="right">{{ item.totalRemaining | currency: 'TWD' : 'symbol' : '1.0-0' }}</td>
                  <td>
                    <nz-progress [nzPercent]="getUtilization(item)" [nzStatus]="getProgressStatus(getUtilization(item))" nzSize="small" />
                  </td>
                </tr>
              }
            </tbody>
          </nz-table>
        }
      }
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
      .progress-label {
        margin-bottom: 8px;
        color: rgba(0, 0, 0, 0.45);
      }
      .alert-list {
        margin: 0;
        padding-left: 20px;
      }
      .alert-list li {
        margin: 4px 0;
      }
    `
  ]
})
export class BudgetOverviewComponent implements OnInit {
  /** 藍圖 ID */
  blueprintId = input.required<string>();

  private budgetService = inject(BudgetService);

  loading = signal(false);
  summary = signal<BudgetSummary | null>(null);

  /**
   * 分類資料
   */
  categoryData = computed(() => {
    const s = this.summary();
    if (!s?.byCategory) return [];

    return Object.entries(s.byCategory).map(([category, data]) => ({
      category,
      ...data
    }));
  });

  /**
   * 是否有預警
   */
  hasAlerts = computed(() => {
    const s = this.summary();
    return s?.alerts && s.alerts.length > 0;
  });

  ngOnInit(): void {
    this.loadSummary();
  }

  async loadSummary(): Promise<void> {
    this.loading.set(true);
    try {
      const summary = await this.budgetService.getBudgetSummary(this.blueprintId());
      this.summary.set(summary);
    } catch (error) {
      console.error('[BudgetOverview] Failed to load summary:', error);
    } finally {
      this.loading.set(false);
    }
  }

  getProgressStatus(percent: number): 'success' | 'normal' | 'exception' | 'active' {
    if (percent >= 100) return 'exception';
    if (percent >= 80) return 'active';
    return 'normal';
  }

  getAlertColor(type: string): string {
    const colors: Record<string, string> = {
      warning: 'orange',
      critical: 'red',
      exceeded: 'magenta'
    };
    return colors[type] || 'default';
  }

  getAlertLabel(type: string): string {
    const labels: Record<string, string> = {
      warning: '預警',
      critical: '警示',
      exceeded: '超支'
    };
    return labels[type] || type;
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      labor: '人工',
      material: '材料',
      equipment: '設備',
      subcontract: '分包',
      overhead: '管理費',
      contingency: '預備金',
      other: '其他'
    };
    return labels[category] || category;
  }

  getUtilization(item: { totalBudget: number; totalSpent: number }): number {
    return item.totalBudget > 0 ? Math.round((item.totalSpent / item.totalBudget) * 100) : 0;
  }
}
