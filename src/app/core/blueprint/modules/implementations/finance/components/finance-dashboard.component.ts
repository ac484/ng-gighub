/**
 * Finance Dashboard Component
 *
 * SETC-069: Finance UI Components
 *
 * 財務儀表板元件，提供：
 * - 付款摘要
 * - 預算概覽
 * - 財務統計視覺化
 *
 * @module FinanceDashboardComponent
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import { Component, inject, signal, input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

import { BudgetOverviewComponent } from './budget-overview.component';
import type { FinancialSummary } from '../models/financial-summary.model';
import { PaymentStatusTrackingService } from '../services/payment-status-tracking.service';

@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  imports: [SHARED_IMPORTS, BudgetOverviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="finance-dashboard">
      <!-- 財務摘要卡片 -->
      <nz-row [nzGutter]="[16, 16]" class="mb-lg">
        <nz-col [nzXs]="24" [nzSm]="12" [nzMd]="6">
          <nz-card class="summary-card">
            <nz-statistic
              nzTitle="已請款總額"
              [nzValue]="financialSummary()?.totalBilled || 0"
              nzPrefix="$"
              [nzValueStyle]="{ color: '#1890ff' }"
            />
            <div class="summary-footer">
              <span class="label">請款單數</span>
              <span class="value">{{ financialSummary()?.receivableInvoiceCount || 0 }}</span>
            </div>
          </nz-card>
        </nz-col>

        <nz-col [nzXs]="24" [nzSm]="12" [nzMd]="6">
          <nz-card class="summary-card">
            <nz-statistic
              nzTitle="已收款金額"
              [nzValue]="financialSummary()?.totalReceived || 0"
              nzPrefix="$"
              [nzValueStyle]="{ color: '#52c41a' }"
            />
            <div class="summary-footer">
              <span class="label">收款率</span>
              <nz-progress [nzPercent]="getReceivableRate()" nzSize="small" [nzShowInfo]="true" />
            </div>
          </nz-card>
        </nz-col>

        <nz-col [nzXs]="24" [nzSm]="12" [nzMd]="6">
          <nz-card class="summary-card">
            <nz-statistic
              nzTitle="待收款金額"
              [nzValue]="financialSummary()?.pendingReceivable || 0"
              nzPrefix="$"
              [nzValueStyle]="{ color: '#faad14' }"
            />
            <div class="summary-footer">
              <span class="label">待收款單數</span>
              <span class="value">{{ getPendingReceivableCount() }}</span>
            </div>
          </nz-card>
        </nz-col>

        <nz-col [nzXs]="24" [nzSm]="12" [nzMd]="6">
          <nz-card class="summary-card">
            <nz-statistic
              nzTitle="逾期未收"
              [nzValue]="financialSummary()?.overdueReceivable || 0"
              nzPrefix="$"
              [nzValueStyle]="{ color: '#cf1322' }"
            />
            <div class="summary-footer">
              <span class="label">逾期單數</span>
              <span class="value danger">{{ financialSummary()?.overdueInvoiceCount || 0 }}</span>
            </div>
          </nz-card>
        </nz-col>
      </nz-row>

      <!-- 主要內容區 -->
      <nz-row [nzGutter]="16">
        <!-- 付款進度 -->
        <nz-col [nzXs]="24" [nzLg]="12">
          <nz-card nzTitle="付款進度" [nzLoading]="loading()">
            @if (!loading()) {
              <div class="progress-section">
                <div class="progress-item">
                  <div class="progress-label">
                    <span>應收款進度</span>
                    <span class="progress-value">{{ getReceivableRate() }}%</span>
                  </div>
                  <nz-progress [nzPercent]="getReceivableRate()" [nzStatus]="getPaymentStatus(getReceivableRate())" nzStrokeWidth="16" />
                  <div class="progress-detail">
                    已收 {{ financialSummary()?.totalReceived | currency: 'TWD' : 'symbol' : '1.0-0' }} / 總額
                    {{ financialSummary()?.totalBilled | currency: 'TWD' : 'symbol' : '1.0-0' }}
                  </div>
                </div>

                <nz-divider />

                <div class="progress-item">
                  <div class="progress-label">
                    <span>應付款進度</span>
                    <span class="progress-value">{{ getPayableRate() }}%</span>
                  </div>
                  <nz-progress [nzPercent]="getPayableRate()" [nzStatus]="getPaymentStatus(getPayableRate())" nzStrokeWidth="16" />
                  <div class="progress-detail">
                    已付 {{ financialSummary()?.totalPaid | currency: 'TWD' : 'symbol' : '1.0-0' }} / 總額
                    {{ financialSummary()?.totalPayable | currency: 'TWD' : 'symbol' : '1.0-0' }}
                  </div>
                </div>
              </div>

              <!-- 統計摘要 -->
              <nz-divider />
              <nz-row [nzGutter]="[16, 8]">
                <nz-col [nzSpan]="12">
                  <div class="stat-item">
                    <span class="stat-label">應收帳款餘額</span>
                    <span class="stat-value">{{
                      financialSummary()?.accountsReceivableBalance | currency: 'TWD' : 'symbol' : '1.0-0'
                    }}</span>
                  </div>
                </nz-col>
                <nz-col [nzSpan]="12">
                  <div class="stat-item">
                    <span class="stat-label">應付帳款餘額</span>
                    <span class="stat-value">{{ financialSummary()?.accountsPayableBalance | currency: 'TWD' : 'symbol' : '1.0-0' }}</span>
                  </div>
                </nz-col>
                <nz-col [nzSpan]="12">
                  <div class="stat-item">
                    <span class="stat-label">本月請款</span>
                    <span class="stat-value">{{ financialSummary()?.monthlyBilled | currency: 'TWD' : 'symbol' : '1.0-0' }}</span>
                  </div>
                </nz-col>
                <nz-col [nzSpan]="12">
                  <div class="stat-item">
                    <span class="stat-label">本月收款</span>
                    <span class="stat-value">{{ financialSummary()?.monthlyReceived | currency: 'TWD' : 'symbol' : '1.0-0' }}</span>
                  </div>
                </nz-col>
              </nz-row>
            }
          </nz-card>
        </nz-col>

        <!-- 預算概覽 -->
        <nz-col [nzXs]="24" [nzLg]="12">
          <app-budget-overview [blueprintId]="blueprintId()" />
        </nz-col>
      </nz-row>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .finance-dashboard {
        padding: 0;
      }
      .mb-lg {
        margin-bottom: 24px;
      }
      .summary-card {
        height: 100%;
      }
      .summary-card ::ng-deep .ant-card-body {
        padding: 20px;
      }
      .summary-footer {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #f0f0f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .summary-footer .label {
        color: rgba(0, 0, 0, 0.45);
        font-size: 12px;
      }
      .summary-footer .value {
        font-weight: 500;
      }
      .summary-footer .value.danger {
        color: #cf1322;
      }
      .progress-section {
        padding: 8px 0;
      }
      .progress-item {
        margin-bottom: 16px;
      }
      .progress-label {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-weight: 500;
      }
      .progress-value {
        color: #1890ff;
      }
      .progress-detail {
        margin-top: 8px;
        font-size: 12px;
        color: rgba(0, 0, 0, 0.45);
      }
      .stat-item {
        display: flex;
        justify-content: space-between;
        padding: 8px;
        background: #fafafa;
        border-radius: 4px;
      }
      .stat-label {
        color: rgba(0, 0, 0, 0.45);
        font-size: 12px;
      }
      .stat-value {
        font-weight: 500;
        color: rgba(0, 0, 0, 0.85);
      }
    `
  ]
})
export class FinanceDashboardComponent implements OnInit {
  /** 藍圖 ID */
  blueprintId = input.required<string>();

  private paymentService = inject(PaymentStatusTrackingService);

  loading = signal(false);
  financialSummary = signal<FinancialSummary | null>(null);

  ngOnInit(): void {
    this.loadFinancialSummary();
  }

  async loadFinancialSummary(): Promise<void> {
    this.loading.set(true);
    try {
      // 目前使用空陣列，實際應從 Invoice Repository 載入
      // TODO: 整合 Invoice Repository 載入真實資料
      const summary = this.paymentService.calculateFinancialSummary([], this.blueprintId());
      this.financialSummary.set(summary);
    } catch (error) {
      console.error('[FinanceDashboard] Failed to load summary:', error);
    } finally {
      this.loading.set(false);
    }
  }

  getReceivableRate(): number {
    const summary = this.financialSummary();
    if (!summary || !summary.totalBilled) return 0;
    return Math.round((summary.totalReceived / summary.totalBilled) * 100);
  }

  getPayableRate(): number {
    const summary = this.financialSummary();
    if (!summary || !summary.totalPayable) return 0;
    return Math.round((summary.totalPaid / summary.totalPayable) * 100);
  }

  getPendingReceivableCount(): number {
    const summary = this.financialSummary();
    if (!summary) return 0;
    return (summary.receivableInvoiceCount || 0) - (summary.paidReceivableCount || 0);
  }

  getPaymentStatus(rate: number): 'success' | 'normal' | 'exception' | 'active' {
    if (rate >= 90) return 'success';
    if (rate >= 50) return 'active';
    if (rate >= 20) return 'normal';
    return 'exception';
  }
}
