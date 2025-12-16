import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoggerService } from '@core';
import { SHARED_IMPORTS } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';

/**
 * Container Dashboard Component
 *
 * Provides a comprehensive overview of the Blueprint Container Layer status,
 * including modules, events, resources, and lifecycle information.
 *
 * Features:
 * - Real-time container status monitoring
 * - Module registry overview
 * - Event bus statistics
 * - Resource provider status
 * - Lifecycle manager state
 * - Quick navigation to detailed views
 *
 * @version 1.0.0
 * @since Angular 20.3.0
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-container-dashboard',
  standalone: true,
  imports: [SHARED_IMPORTS, NzStatisticModule, NzCardModule, NzGridModule, NzBadgeModule, NzButtonModule, NzIconModule, NzAlertModule],
  template: `
    <page-header [title]="'容器儀表板'" [breadcrumb]="breadcrumb">
      <ng-template #breadcrumb>
        <nz-breadcrumb>
          <nz-breadcrumb-item>
            <a [routerLink]="['../../']">藍圖管理</a>
          </nz-breadcrumb-item>
          <nz-breadcrumb-item>
            <a [routerLink]="['../']">藍圖詳情</a>
          </nz-breadcrumb-item>
          <nz-breadcrumb-item>容器儀表板</nz-breadcrumb-item>
        </nz-breadcrumb>
      </ng-template>
    </page-header>

    <div class="container-dashboard">
      <!-- Container Status Card -->
      <nz-card nzTitle="容器狀態" [nzExtra]="statusExtra" class="mb-md">
        <ng-template #statusExtra>
          <button nz-button nzType="primary" (click)="refreshStatus()">
            <span nz-icon nzType="reload"></span>
            重新整理
          </button>
        </ng-template>

        @if (containerLoading()) {
          <nz-alert nzType="info" nzMessage="正在載入容器狀態..." nzShowIcon class="mb-md" />
        } @else if (containerError()) {
          <nz-alert nzType="error" [nzMessage]="'載入失敗'" [nzDescription]="containerError()" nzShowIcon class="mb-md" />
        } @else {
          <div nz-row [nzGutter]="16">
            <div nz-col [nzSpan]="6">
              <nz-statistic [nzValue]="containerStatus().status" nzTitle="運行狀態" [nzValueStyle]="getStatusStyle()">
                <ng-template #nzPrefix>
                  <span nz-icon [nzType]="getStatusIcon()"></span>
                </ng-template>
              </nz-statistic>
            </div>
            <div nz-col [nzSpan]="6">
              <nz-statistic [nzValue]="containerStatus().uptime" nzTitle="運行時間" nzSuffix="秒">
                <ng-template #nzPrefix>
                  <span nz-icon nzType="clock-circle"></span>
                </ng-template>
              </nz-statistic>
            </div>
            <div nz-col [nzSpan]="6">
              <nz-statistic [nzValue]="containerStatus().moduleCount" nzTitle="已載入模組">
                <ng-template #nzPrefix>
                  <span nz-icon nzType="appstore"></span>
                </ng-template>
              </nz-statistic>
            </div>
            <div nz-col [nzSpan]="6">
              <nz-statistic [nzValue]="containerStatus().eventCount" nzTitle="事件處理數">
                <ng-template #nzPrefix>
                  <span nz-icon nzType="thunderbolt"></span>
                </ng-template>
              </nz-statistic>
            </div>
          </div>
        }
      </nz-card>

      <!-- Quick Navigation Cards -->
      <div nz-row [nzGutter]="[16, 16]">
        <!-- Event Bus Monitor Card -->
        <div nz-col [nzSpan]="12">
          <nz-card nzTitle="事件總線監控" [nzHoverable]="true" class="dashboard-card" (click)="navigateToEventBus()">
            <div class="card-content">
              <div class="card-icon">
                <span nz-icon nzType="radar-chart" nzTheme="outline"></span>
              </div>
              <div class="card-stats">
                <nz-statistic [nzValue]="eventBusStats().totalEvents" nzTitle="總事件數" />
                <nz-statistic [nzValue]="eventBusStats().subscriberCount" nzTitle="訂閱者數量" />
              </div>
            </div>
            <div class="card-footer">
              <a>查看詳細監控 <span nz-icon nzType="arrow-right"></span></a>
            </div>
          </nz-card>
        </div>

        <!-- Module Registry Card -->
        <div nz-col [nzSpan]="12">
          <nz-card nzTitle="模組註冊表" [nzHoverable]="true" class="dashboard-card" (click)="navigateToModuleRegistry()">
            <div class="card-content">
              <div class="card-icon">
                <span nz-icon nzType="appstore" nzTheme="outline"></span>
              </div>
              <div class="card-stats">
                <nz-statistic [nzValue]="moduleStats().totalModules" nzTitle="註冊模組" />
                <nz-statistic [nzValue]="moduleStats().activeModules" nzTitle="運行中" />
              </div>
            </div>
            <div class="card-footer">
              <a>管理模組 <span nz-icon nzType="arrow-right"></span></a>
            </div>
          </nz-card>
        </div>

        <!-- Lifecycle Manager Card -->
        <div nz-col [nzSpan]="12">
          <nz-card nzTitle="生命週期管理器" [nzHoverable]="true" class="dashboard-card" (click)="navigateToLifecycle()">
            <div class="card-content">
              <div class="card-icon">
                <span nz-icon nzType="deployment-unit" nzTheme="outline"></span>
              </div>
              <div class="card-stats">
                <nz-statistic [nzValue]="lifecycleStats().currentPhase" nzTitle="當前階段" />
                <nz-statistic [nzValue]="lifecycleStats().transitionCount" nzTitle="狀態轉換" />
              </div>
            </div>
            <div class="card-footer">
              <a>查看狀態機 <span nz-icon nzType="arrow-right"></span></a>
            </div>
          </nz-card>
        </div>

        <!-- Resource Provider Card -->
        <div nz-col [nzSpan]="12">
          <nz-card nzTitle="資源提供者" [nzHoverable]="true" class="dashboard-card" (click)="navigateToResources()">
            <div class="card-content">
              <div class="card-icon">
                <span nz-icon nzType="database" nzTheme="outline"></span>
              </div>
              <div class="card-stats">
                <nz-statistic [nzValue]="resourceStats().totalResources" nzTitle="總資源數" />
                <nz-statistic [nzValue]="resourceStats().healthyResources" nzTitle="健康資源" />
              </div>
            </div>
            <div class="card-footer">
              <a>資源監控 <span nz-icon nzType="arrow-right"></span></a>
            </div>
          </nz-card>
        </div>

        <!-- Shared Context Card -->
        <div nz-col [nzSpan]="12">
          <nz-card nzTitle="共享上下文" [nzHoverable]="true" class="dashboard-card" (click)="navigateToContext()">
            <div class="card-content">
              <div class="card-icon">
                <span nz-icon nzType="cluster" nzTheme="outline"></span>
              </div>
              <div class="card-stats">
                <nz-statistic [nzValue]="contextStats().dataSize" nzTitle="資料大小" nzSuffix="KB" />
                <nz-statistic [nzValue]="contextStats().serviceCount" nzTitle="服務數量" />
              </div>
            </div>
            <div class="card-footer">
              <a>檢查上下文 <span nz-icon nzType="arrow-right"></span></a>
            </div>
          </nz-card>
        </div>

        <!-- Performance Metrics Card -->
        <div nz-col [nzSpan]="12">
          <nz-card nzTitle="效能指標" [nzHoverable]="true" class="dashboard-card">
            <div class="card-content">
              <div class="card-icon">
                <span nz-icon nzType="dashboard" nzTheme="outline"></span>
              </div>
              <div class="card-stats">
                <nz-statistic [nzValue]="performanceStats().avgEventTime" nzTitle="平均事件處理" nzSuffix="ms" />
                <nz-statistic [nzValue]="performanceStats().memoryUsage" nzTitle="記憶體使用" nzSuffix="MB" />
              </div>
            </div>
            <div class="card-footer">
              <span>即時效能監控</span>
            </div>
          </nz-card>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .container-dashboard {
        padding: 0;
      }

      .dashboard-card {
        cursor: pointer;
        transition: all 0.3s ease;
        height: 100%;
      }

      .dashboard-card:hover {
        transform: translateY(-2px);
      }

      .card-content {
        display: flex;
        align-items: center;
        gap: 24px;
        margin-bottom: 16px;
      }

      .card-icon {
        font-size: 48px;
        line-height: 1;
      }

      .card-stats {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .card-footer {
        padding-top: 12px;
        border-top: 1px solid;
        text-align: right;
      }

      .card-footer a {
        transition: color 0.3s ease;
      }

      .card-footer a:hover {
      }

      .mb-md {
        margin-bottom: 16px;
      }
    `
  ]
})
export class ContainerDashboardComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggerService);

  // Loading and error states
  containerLoading = signal(false);
  containerError = signal<string | null>(null);

  // Container status
  containerStatus = signal({
    status: 'RUNNING',
    uptime: 0,
    moduleCount: 0,
    eventCount: 0
  });

  // Component stats
  eventBusStats = signal({
    totalEvents: 0,
    subscriberCount: 0
  });

  moduleStats = signal({
    totalModules: 0,
    activeModules: 0
  });

  lifecycleStats = signal({
    currentPhase: 'READY',
    transitionCount: 0
  });

  resourceStats = signal({
    totalResources: 0,
    healthyResources: 0
  });

  contextStats = signal({
    dataSize: 0,
    serviceCount: 0
  });

  performanceStats = signal({
    avgEventTime: 0,
    memoryUsage: 0
  });

  ngOnInit(): void {
    this.loadContainerStatus();
  }

  /**
   * Load container status and statistics
   */
  private async loadContainerStatus(): Promise<void> {
    this.containerLoading.set(true);
    this.containerError.set(null);

    try {
      // TODO: Replace with actual container service calls
      // Simulated data for now
      await this.simulateDataLoad();

      this.logger.info('[ContainerDashboard]', 'Container status loaded successfully');
    } catch (error) {
      this.containerError.set(error instanceof Error ? error.message : 'Unknown error');
      this.logger.error('[ContainerDashboard]', 'Failed to load container status', error as Error);
    } finally {
      this.containerLoading.set(false);
    }
  }

  /**
   * Simulate data loading (to be replaced with real service calls)
   */
  private async simulateDataLoad(): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        this.containerStatus.set({
          status: 'RUNNING',
          uptime: 3600,
          moduleCount: 8,
          eventCount: 1234
        });

        this.eventBusStats.set({
          totalEvents: 1234,
          subscriberCount: 42
        });

        this.moduleStats.set({
          totalModules: 8,
          activeModules: 8
        });

        this.lifecycleStats.set({
          currentPhase: 'READY',
          transitionCount: 16
        });

        this.resourceStats.set({
          totalResources: 5,
          healthyResources: 5
        });

        this.contextStats.set({
          dataSize: 128,
          serviceCount: 12
        });

        this.performanceStats.set({
          avgEventTime: 0.15,
          memoryUsage: 45.6
        });

        resolve();
      }, 500);
    });
  }

  /**
   * Refresh container status
   */
  refreshStatus(): void {
    this.loadContainerStatus();
  }

  /**
   * Get status icon based on container status
   */
  getStatusIcon(): string {
    const status = this.containerStatus().status;
    switch (status) {
      case 'RUNNING':
        return 'check-circle';
      case 'STOPPED':
        return 'pause-circle';
      case 'ERROR':
        return 'close-circle';
      default:
        return 'question-circle';
    }
  }

  /**
   * Get status style based on container status
   */
  getStatusStyle(): Record<string, string> {
    return {};
  }

  /**
   * Navigate to Event Bus monitor
   */
  navigateToEventBus(): void {
    this.router.navigate(['event-bus'], { relativeTo: this.route });
  }

  /**
   * Navigate to Module Registry
   */
  navigateToModuleRegistry(): void {
    this.router.navigate(['modules'], { relativeTo: this.route });
  }

  /**
   * Navigate to Lifecycle Manager
   */
  navigateToLifecycle(): void {
    this.router.navigate(['lifecycle'], { relativeTo: this.route });
  }

  /**
   * Navigate to Resource Provider
   */
  navigateToResources(): void {
    this.router.navigate(['resources'], { relativeTo: this.route });
  }

  /**
   * Navigate to Shared Context
   */
  navigateToContext(): void {
    this.router.navigate(['context'], { relativeTo: this.route });
  }
}
