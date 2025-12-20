import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { LoggerService } from '@core';
import { SHARED_IMPORTS } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';

/**
 * Container Dashboard Component
 *
 * Firebase 適用的容器監控儀表板
 *
 * Features:
 * - Firebase 連線狀態監控
 * - Firestore 資料同步狀態
 * - Authentication 狀態
 * - Storage 使用量
 * - 模組載入狀態
 * - 事件日誌
 *
 * @version 2.0.0
 * @since Angular 20.3.0
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-container-dashboard',
  standalone: true,
  imports: [
    SHARED_IMPORTS,
    NzStatisticModule,
    NzCardModule,
    NzGridModule,
    NzBadgeModule,
    NzButtonModule,
    NzIconModule,
    NzAlertModule,
    NzProgressModule,
    NzTimelineModule
  ],
  template: `
    <!-- Firebase 連線狀態 -->
    <nz-card nzTitle="Firebase 服務狀態" [nzExtra]="statusExtra" class="mb-md">
      <ng-template #statusExtra>
        <button nz-button nzType="primary" (click)="refreshStatus()">
          <span nz-icon nzType="reload"></span>
          重新整理
        </button>
      </ng-template>

      @if (loading()) {
        <div style="text-align: center; padding: 24px;">
          <nz-spin nzSimple></nz-spin>
        </div>
      } @else {
        <nz-row [nzGutter]="[16, 16]">
          <!-- Firestore 狀態 -->
          <nz-col [nzXs]="12" [nzSm]="6">
            <nz-card nzSize="small" [nzHoverable]="true">
              <div style="display: flex; align-items: center; gap: 12px;">
                <nz-badge [nzStatus]="firebaseStatus().firestore ? 'success' : 'error'"></nz-badge>
                <div>
                  <div style="font-weight: 500;">Firestore</div>
                  <div style="color: #666; font-size: 12px;">
                    {{ firebaseStatus().firestore ? '已連線' : '未連線' }}
                  </div>
                </div>
              </div>
            </nz-card>
          </nz-col>

          <!-- Authentication 狀態 -->
          <nz-col [nzXs]="12" [nzSm]="6">
            <nz-card nzSize="small" [nzHoverable]="true">
              <div style="display: flex; align-items: center; gap: 12px;">
                <nz-badge [nzStatus]="firebaseStatus().auth ? 'success' : 'warning'"></nz-badge>
                <div>
                  <div style="font-weight: 500;">Authentication</div>
                  <div style="color: #666; font-size: 12px;">
                    {{ firebaseStatus().auth ? '已登入' : '未登入' }}
                  </div>
                </div>
              </div>
            </nz-card>
          </nz-col>

          <!-- Storage 狀態 -->
          <nz-col [nzXs]="12" [nzSm]="6">
            <nz-card nzSize="small" [nzHoverable]="true">
              <div style="display: flex; align-items: center; gap: 12px;">
                <nz-badge [nzStatus]="firebaseStatus().storage ? 'success' : 'error'"></nz-badge>
                <div>
                  <div style="font-weight: 500;">Storage</div>
                  <div style="color: #666; font-size: 12px;">
                    {{ firebaseStatus().storage ? '可用' : '不可用' }}
                  </div>
                </div>
              </div>
            </nz-card>
          </nz-col>

          <!-- Realtime 狀態 -->
          <nz-col [nzXs]="12" [nzSm]="6">
            <nz-card nzSize="small" [nzHoverable]="true">
              <div style="display: flex; align-items: center; gap: 12px;">
                <nz-badge [nzStatus]="firebaseStatus().realtime ? 'success' : 'default'"></nz-badge>
                <div>
                  <div style="font-weight: 500;">Realtime</div>
                  <div style="color: #666; font-size: 12px;">
                    {{ firebaseStatus().realtime ? '同步中' : '離線' }}
                  </div>
                </div>
              </div>
            </nz-card>
          </nz-col>
        </nz-row>
      }
    </nz-card>

    <!-- 資源使用情況 -->
    <nz-row [nzGutter]="[16, 16]" class="mb-md">
      <nz-col [nzXs]="24" [nzSm]="12">
        <nz-card nzTitle="Firestore 使用量" nzSize="small">
          <nz-statistic [nzValue]="resourceStats().firestoreReads" nzTitle="今日讀取次數"></nz-statistic>
          <nz-progress [nzPercent]="resourceStats().firestoreUsagePercent" nzSize="small" style="margin-top: 12px;"></nz-progress>
          <div style="color: #666; font-size: 12px; margin-top: 8px;"> 配額使用：{{ resourceStats().firestoreUsagePercent }}% </div>
        </nz-card>
      </nz-col>
      <nz-col [nzXs]="24" [nzSm]="12">
        <nz-card nzTitle="Storage 使用量" nzSize="small">
          <nz-statistic [nzValue]="resourceStats().storageUsedMB" nzTitle="已用空間" nzSuffix="MB"></nz-statistic>
          <nz-progress [nzPercent]="resourceStats().storageUsagePercent" nzSize="small" style="margin-top: 12px;"></nz-progress>
          <div style="color: #666; font-size: 12px; margin-top: 8px;"> 總容量：{{ resourceStats().storageTotalMB }} MB </div>
        </nz-card>
      </nz-col>
    </nz-row>

    <!-- 模組與事件 -->
    <nz-row [nzGutter]="[16, 16]">
      <!-- 模組載入狀態 -->
      <nz-col [nzXs]="24" [nzSm]="12">
        <nz-card nzTitle="模組載入狀態" nzSize="small">
          <nz-row [nzGutter]="[8, 8]">
            @for (module of moduleStatus(); track module.name) {
              <nz-col [nzSpan]="12">
                <div
                  style="display: flex; align-items: center; justify-content: space-between; padding: 8px; background: #fafafa; border-radius: 4px;"
                >
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span nz-icon [nzType]="module.icon" style="font-size: 16px;"></span>
                    <span>{{ module.name }}</span>
                  </div>
                  <nz-badge [nzStatus]="module.loaded ? 'success' : 'default'" [nzText]="module.loaded ? '已載入' : '未載入'"></nz-badge>
                </div>
              </nz-col>
            }
          </nz-row>
        </nz-card>
      </nz-col>

      <!-- 最近事件 -->
      <nz-col [nzXs]="24" [nzSm]="12">
        <nz-card nzTitle="最近事件" nzSize="small">
          @if (recentEvents().length === 0) {
            <div style="text-align: center; padding: 24px; color: #999;"> 暫無事件記錄 </div>
          } @else {
            <nz-timeline>
              @for (event of recentEvents(); track event.id) {
                <nz-timeline-item [nzColor]="getEventColor(event.type)">
                  <div style="display: flex; justify-content: space-between;">
                    <span>{{ event.message }}</span>
                    <span style="color: #999; font-size: 12px;">{{ event.timestamp | date: 'HH:mm:ss' }}</span>
                  </div>
                </nz-timeline-item>
              }
            </nz-timeline>
          }
        </nz-card>
      </nz-col>
    </nz-row>
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
export class ContainerDashboardComponent implements OnInit {
  private readonly logger = inject(LoggerService);

  // 狀態
  loading = signal(false);

  // Firebase 連線狀態
  firebaseStatus = signal({
    firestore: true,
    auth: true,
    storage: true,
    realtime: true
  });

  // 資源使用統計
  resourceStats = signal({
    firestoreReads: 0,
    firestoreUsagePercent: 0,
    storageUsedMB: 0,
    storageTotalMB: 1024,
    storageUsagePercent: 0
  });

  // 模組狀態
  moduleStatus = signal<Array<{ name: string; icon: string; loaded: boolean }>>([]);

  // 最近事件
  recentEvents = signal<Array<{ id: string; type: string; message: string; timestamp: Date }>>([]);

  ngOnInit(): void {
    this.loadStatus();
  }

  /**
   * 載入狀態資料
   */
  private async loadStatus(): Promise<void> {
    this.loading.set(true);

    try {
      await this.simulateDataLoad();
      this.logger.info('[ContainerDashboard]', 'Status loaded successfully');
    } catch (error) {
      this.logger.error('[ContainerDashboard]', 'Failed to load status', error as Error);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * 模擬資料載入
   */
  private async simulateDataLoad(): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        // Firebase 狀態
        this.firebaseStatus.set({
          firestore: true,
          auth: true,
          storage: true,
          realtime: true
        });

        // 資源統計
        this.resourceStats.set({
          firestoreReads: 1234,
          firestoreUsagePercent: 12,
          storageUsedMB: 256,
          storageTotalMB: 1024,
          storageUsagePercent: 25
        });

        // 模組狀態
        this.moduleStatus.set([
          { name: '任務', icon: 'check-square', loaded: true },
          { name: '日誌', icon: 'file-text', loaded: true },
          { name: '財務', icon: 'dollar', loaded: true },
          { name: '品質', icon: 'safety-certificate', loaded: true },
          { name: '安全', icon: 'safety', loaded: true },
          { name: '材料', icon: 'inbox', loaded: true },
          { name: '驗收', icon: 'check-circle', loaded: true },
          { name: '雲端', icon: 'cloud', loaded: true }
        ]);

        // 最近事件
        this.recentEvents.set([
          { id: '1', type: 'info', message: '模組載入完成', timestamp: new Date() },
          { id: '2', type: 'success', message: 'Firestore 同步成功', timestamp: new Date(Date.now() - 60000) },
          { id: '3', type: 'info', message: '使用者登入', timestamp: new Date(Date.now() - 120000) }
        ]);

        resolve();
      }, 500);
    });
  }

  /**
   * 重新整理狀態
   */
  refreshStatus(): void {
    this.loadStatus();
  }

  /**
   * 取得事件顏色
   */
  getEventColor(type: string): string {
    const colorMap: Record<string, string> = {
      info: 'blue',
      success: 'green',
      warning: 'orange',
      error: 'red'
    };
    return colorMap[type] || 'blue';
  }
}
