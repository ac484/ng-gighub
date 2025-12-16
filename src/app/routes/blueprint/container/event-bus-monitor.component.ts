import { DatePipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LoggerService } from '@core';
import { STColumn, STData } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';

/**
 * Event Bus Monitor Component
 *
 * Real-time monitoring of the Blueprint Container Event Bus.
 * Displays event stream, filtering, and statistics.
 *
 * Features:
 * - Live event stream display
 * - Event filtering by type
 * - Event search functionality
 * - Event history with pagination
 * - Event details modal
 * - Performance metrics
 *
 * @version 1.0.0
 * @since Angular 20.3.0
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-event-bus-monitor',
  standalone: true,
  imports: [SHARED_IMPORTS, DatePipe, FormsModule, NzStatisticModule, NzDescriptionsModule, NzDividerModule],
  template: `
    <page-header [title]="'事件總線監控'" [breadcrumb]="breadcrumb" [action]="action">
      <ng-template #breadcrumb>
        <nz-breadcrumb>
          <nz-breadcrumb-item>
            <a [routerLink]="['../../../']">藍圖管理</a>
          </nz-breadcrumb-item>
          <nz-breadcrumb-item>
            <a [routerLink]="['../../']">藍圖詳情</a>
          </nz-breadcrumb-item>
          <nz-breadcrumb-item>
            <a [routerLink]="['../']">容器儀表板</a>
          </nz-breadcrumb-item>
          <nz-breadcrumb-item>事件總線監控</nz-breadcrumb-item>
        </nz-breadcrumb>
      </ng-template>

      <ng-template #action>
        <button nz-button nzType="primary" (click)="refreshEvents()">
          <span nz-icon nzType="reload"></span>
          重新整理
        </button>
        <button nz-button (click)="clearEvents()">
          <span nz-icon nzType="delete"></span>
          清除歷史
        </button>
      </ng-template>
    </page-header>

    <div class="event-monitor-container">
      <!-- Statistics Cards -->
      <div nz-row [nzGutter]="16" class="mb-md">
        <div nz-col [nzSpan]="6">
          <nz-card>
            <nz-statistic [nzValue]="stats().totalEvents" nzTitle="總事件數" [nzValueStyle]="{ color: '#1890ff' }">
              <ng-template #nzPrefix>
                <span nz-icon nzType="thunderbolt"></span>
              </ng-template>
            </nz-statistic>
          </nz-card>
        </div>
        <div nz-col [nzSpan]="6">
          <nz-card>
            <nz-statistic [nzValue]="formattedEventsPerSecond()" nzTitle="每秒事件數" [nzValueStyle]="{ color: '#52c41a' }">
              <ng-template #nzPrefix>
                <span nz-icon nzType="line-chart"></span>
              </ng-template>
            </nz-statistic>
          </nz-card>
        </div>
        <div nz-col [nzSpan]="6">
          <nz-card>
            <nz-statistic [nzValue]="stats().subscriberCount" nzTitle="訂閱者數量" [nzValueStyle]="{ color: '#722ed1' }">
              <ng-template #nzPrefix>
                <span nz-icon nzType="team"></span>
              </ng-template>
            </nz-statistic>
          </nz-card>
        </div>
        <div nz-col [nzSpan]="6">
          <nz-card>
            <nz-statistic
              [nzValue]="formattedAvgProcessingTime()"
              nzTitle="平均處理時間"
              nzSuffix="ms"
              [nzValueStyle]="{ color: '#fa8c16' }"
            >
              <ng-template #nzPrefix>
                <span nz-icon nzType="clock-circle"></span>
              </ng-template>
            </nz-statistic>
          </nz-card>
        </div>
      </div>

      <!-- Filter Section -->
      <nz-card nzTitle="篩選條件" class="mb-md">
        <div nz-row [nzGutter]="16">
          <div nz-col [nzSpan]="8">
            <nz-input-group nzSearch [nzAddOnAfter]="suffixButton">
              <input nz-input placeholder="搜尋事件" [(ngModel)]="searchText" (ngModelChange)="onSearchChange()" />
            </nz-input-group>
            <ng-template #suffixButton>
              <button nz-button nzType="primary" nzSearch (click)="onSearchChange()">
                <span nz-icon nzType="search"></span>
              </button>
            </ng-template>
          </div>
          <div nz-col [nzSpan]="8">
            <nz-select
              nzPlaceHolder="選擇事件類型"
              [(ngModel)]="selectedEventType"
              (ngModelChange)="onFilterChange()"
              nzAllowClear
              style="width: 100%"
            >
              @for (type of eventTypes(); track type) {
                <nz-option [nzLabel]="type" [nzValue]="type"></nz-option>
              }
            </nz-select>
          </div>
          <div nz-col [nzSpan]="8">
            <nz-select nzPlaceHolder="選擇時間範圍" [(ngModel)]="selectedTimeRange" (ngModelChange)="onFilterChange()" style="width: 100%">
              <nz-option nzLabel="最近1分鐘" nzValue="1m"></nz-option>
              <nz-option nzLabel="最近5分鐘" nzValue="5m"></nz-option>
              <nz-option nzLabel="最近15分鐘" nzValue="15m"></nz-option>
              <nz-option nzLabel="最近1小時" nzValue="1h"></nz-option>
              <nz-option nzLabel="全部" nzValue="all"></nz-option>
            </nz-select>
          </div>
        </div>
      </nz-card>

      <!-- Event Stream Table -->
      <nz-card nzTitle="事件流">
        @if (loading()) {
          <nz-alert nzType="info" nzMessage="正在載入事件..." nzShowIcon class="mb-md" />
        } @else if (error()) {
          <nz-alert nzType="error" [nzMessage]="'載入失敗'" [nzDescription]="error()" nzShowIcon class="mb-md" />
        } @else {
          <st
            #st
            [data]="filteredEvents()"
            [columns]="columns"
            [page]="{ show: true, showSize: true, showQuickJumper: true }"
            [scroll]="{ x: '1200px' }"
          ></st>
        }
      </nz-card>
    </div>

    <!-- Event Detail Modal -->
    <nz-modal [(nzVisible)]="showDetailModal" nzTitle="事件詳情" [nzFooter]="null" nzWidth="700px" (nzOnCancel)="closeDetailModal()">
      @if (selectedEvent()) {
        <div class="event-detail">
          <nz-descriptions nzBordered [nzColumn]="1">
            <nz-descriptions-item nzTitle="事件ID">
              {{ selectedEvent()!.id }}
            </nz-descriptions-item>
            <nz-descriptions-item nzTitle="事件類型">
              <nz-tag [nzColor]="getEventTypeColor(selectedEvent()!.type)">
                {{ selectedEvent()!.type }}
              </nz-tag>
            </nz-descriptions-item>
            <nz-descriptions-item nzTitle="發送者">
              {{ selectedEvent()!.source }}
            </nz-descriptions-item>
            <nz-descriptions-item nzTitle="時間戳記">
              {{ selectedEvent()!.timestamp | date: 'yyyy-MM-dd HH:mm:ss.SSS' }}
            </nz-descriptions-item>
            <nz-descriptions-item nzTitle="處理時間"> {{ selectedEvent()!.processingTime }} ms </nz-descriptions-item>
            <nz-descriptions-item nzTitle="訂閱者數量">
              {{ selectedEvent()!.subscriberCount }}
            </nz-descriptions-item>
          </nz-descriptions>

          <nz-divider></nz-divider>

          <h4>事件數據 (Payload)</h4>
          <pre class="event-payload">{{ selectedEvent()!.payload | json }}</pre>
        </div>
      }
    </nz-modal>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .event-monitor-container {
        padding: 0;
      }

      .mb-md {
        margin-bottom: 16px;
      }

      .event-detail {
        padding: 16px 0;
      }

      .event-payload {
        background: #f5f5f5;
        padding: 12px;
        border-radius: 4px;
        max-height: 300px;
        overflow: auto;
      }
    `
  ]
})
export class EventBusMonitorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggerService);

  // Loading and error states
  loading = signal(false);
  error = signal<string | null>(null);

  // Events data
  events = signal<EventData[]>([]);
  selectedEvent = signal<EventData | null>(null);
  showDetailModal = false;

  // Filter states
  searchText = '';
  selectedEventType: string | null = null;
  selectedTimeRange = 'all';

  // Statistics
  stats = signal({
    totalEvents: 0,
    eventsPerSecond: 0,
    subscriberCount: 0,
    avgProcessingTime: 0
  });

  // Formatted statistics with precision
  formattedEventsPerSecond = computed(() => this.stats().eventsPerSecond.toFixed(2));
  formattedAvgProcessingTime = computed(() => this.stats().avgProcessingTime.toFixed(2));

  // Event types for filter
  eventTypes = signal<string[]>([
    'MODULE_LOADED',
    'MODULE_STARTED',
    'MODULE_STOPPED',
    'STATE_CHANGED',
    'RESOURCE_ALLOCATED',
    'RESOURCE_RELEASED',
    'ERROR_OCCURRED',
    'TASK_COMPLETED'
  ]);

  // Filtered events computed signal
  filteredEvents = computed(() => {
    let filtered = this.events();

    // Search filter
    if (this.searchText) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter(
        event =>
          event.type.toLowerCase().includes(search) ||
          event.source.toLowerCase().includes(search) ||
          JSON.stringify(event.payload).toLowerCase().includes(search)
      );
    }

    // Event type filter
    if (this.selectedEventType) {
      filtered = filtered.filter(event => event.type === this.selectedEventType);
    }

    // Time range filter
    if (this.selectedTimeRange !== 'all') {
      const now = Date.now();
      const ranges: Record<string, number> = {
        '1m': 60 * 1000,
        '5m': 5 * 60 * 1000,
        '15m': 15 * 60 * 1000,
        '1h': 60 * 60 * 1000
      };
      const rangeMs = ranges[this.selectedTimeRange];
      filtered = filtered.filter(event => event.timestamp >= now - rangeMs);
    }

    return filtered;
  });

  // Table columns
  columns: STColumn[] = [
    {
      title: 'ID',
      index: 'id',
      width: '100px',
      fixed: 'left'
    },
    {
      title: '事件類型',
      index: 'type',
      width: '180px',
      render: 'eventType'
    },
    {
      title: '發送者',
      index: 'source',
      width: '150px'
    },
    {
      title: '時間戳記',
      index: 'timestamp',
      type: 'date',
      dateFormat: 'yyyy-MM-dd HH:mm:ss',
      width: '180px'
    },
    {
      title: '處理時間',
      index: 'processingTime',
      width: '120px',
      render: 'processingTime'
    },
    {
      title: '訂閱者',
      index: 'subscriberCount',
      width: '100px',
      type: 'number'
    },
    {
      title: '操作',
      width: '100px',
      fixed: 'right',
      buttons: [
        {
          text: '詳情',
          type: 'link',
          click: (record: STData) => this.viewDetail(record as unknown as EventData)
        }
      ]
    }
  ];

  ngOnInit(): void {
    this.loadEvents();
  }

  /**
   * Load event stream
   */
  private async loadEvents(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      // TODO: Replace with actual event bus service
      await this.simulateEventLoad();
      this.logger.info('[EventBusMonitor]', 'Events loaded successfully');
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Unknown error');
      this.logger.error('[EventBusMonitor]', 'Failed to load events', err as Error);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Simulate event loading (to be replaced)
   */
  private async simulateEventLoad(): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        const mockEvents: EventData[] = [];
        const types = this.eventTypes();
        const sources = ['ModuleA', 'ModuleB', 'ModuleC', 'Container'];

        for (let i = 1; i <= 50; i++) {
          mockEvents.push({
            id: `EVT-${String(i).padStart(5, '0')}`,
            type: types[Math.floor(Math.random() * types.length)],
            source: sources[Math.floor(Math.random() * sources.length)],
            timestamp: Date.now() - Math.floor(Math.random() * 3600000),
            processingTime: Number((Math.random() * 10).toFixed(2)),
            subscriberCount: Math.floor(Math.random() * 10) + 1,
            payload: {
              moduleId: `mod-${Math.floor(Math.random() * 5)}`,
              status: ['success', 'pending', 'error'][Math.floor(Math.random() * 3)],
              data: { key: 'value' }
            }
          });
        }

        this.events.set(mockEvents.sort((a, b) => b.timestamp - a.timestamp));

        this.stats.set({
          totalEvents: mockEvents.length,
          eventsPerSecond: 2.5,
          subscriberCount: 42,
          avgProcessingTime: 0.85
        });

        resolve();
      }, 500);
    });
  }

  /**
   * Refresh events
   */
  refreshEvents(): void {
    this.loadEvents();
  }

  /**
   * Clear event history
   */
  clearEvents(): void {
    this.events.set([]);
    this.logger.info('[EventBusMonitor]', 'Event history cleared');
  }

  /**
   * Handle search change
   */
  onSearchChange(): void {
    // filteredEvents computed signal will automatically update
  }

  /**
   * Handle filter change
   */
  onFilterChange(): void {
    // filteredEvents computed signal will automatically update
  }

  /**
   * View event details
   */
  viewDetail(event: EventData): void {
    this.selectedEvent.set(event);
    this.showDetailModal = true;
  }

  /**
   * Close detail modal
   */
  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedEvent.set(null);
  }

  /**
   * Get event type color
   */
  getEventTypeColor(type: string): string {
    const colorMap: Record<string, string> = {
      MODULE_LOADED: 'blue',
      MODULE_STARTED: 'green',
      MODULE_STOPPED: 'orange',
      STATE_CHANGED: 'purple',
      RESOURCE_ALLOCATED: 'cyan',
      RESOURCE_RELEASED: 'geekblue',
      ERROR_OCCURRED: 'red',
      TASK_COMPLETED: 'lime'
    };
    return colorMap[type] || 'default';
  }
}

/**
 * Event Data Interface
 */
interface EventData {
  id: string;
  type: string;
  source: string;
  timestamp: number;
  processingTime: number;
  subscriberCount: number;
  payload: Record<string, unknown>;
}
