import { Injectable, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, NavigationEnd, NavigationStart, NavigationError } from '@angular/router';
import { filter } from 'rxjs/operators';

import { LoggerService } from './logger/logger.service';

/**
 * Performance Monitoring Service
 * 效能監控服務
 *
 * Features:
 * - Track route navigation performance
 * - Monitor component render times
 * - Collect performance metrics
 * - Integration with Firebase Analytics
 *
 * @version 1.0.0
 * @since Angular 20.3.0
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface NavigationMetric {
  from: string;
  to: string;
  duration: number;
  timestamp: number;
  success: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceMonitoringService {
  private readonly router = inject(Router);
  private readonly logger = inject(LoggerService);

  // ✅ Signal-based state
  private readonly _metrics = signal<PerformanceMetric[]>([]);
  private readonly _navigationMetrics = signal<NavigationMetric[]>([]);
  private readonly _isMonitoring = signal(true);

  // Public readonly signals
  readonly metrics = this._metrics.asReadonly();
  readonly navigationMetrics = this._navigationMetrics.asReadonly();
  readonly isMonitoring = this._isMonitoring.asReadonly();

  // ✅ Computed metrics
  readonly averageNavigationTime = computed(() => {
    const navMetrics = this._navigationMetrics();
    if (navMetrics.length === 0) return 0;

    const sum = navMetrics.reduce((acc, m) => acc + m.duration, 0);
    return Math.round(sum / navMetrics.length);
  });

  readonly totalMetricsCount = computed(() => this._metrics().length);
  readonly totalNavigations = computed(() => this._navigationMetrics().length);
  readonly failedNavigations = computed(() => this._navigationMetrics().filter(m => !m.success).length);

  private navigationStartTime = 0;
  private currentRoute = '';
  private isInitialized = false;

  constructor() {
    // Initialization moved to explicit init() method.
    // Call init() from app.config.ts or APP_INITIALIZER for clarity.
  }

  /**
   * Explicitly initialize performance monitoring.
   * Must be called during application startup (e.g., from app.config.ts or APP_INITIALIZER).
   *
   * 明確初始化效能監控
   * 必須在應用程式啟動時呼叫（例如從 app.config.ts 或 APP_INITIALIZER）
   */
  public init(): void {
    if (this.isInitialized) {
      return;
    }
    this.isInitialized = true;
    this.initializeRouteTracking();
    this.initializePerformanceObserver();
  }

  /**
   * Initialize route navigation tracking
   * 初始化路由導航追蹤
   */
  private initializeRouteTracking(): void {
    // Track navigation start
    this.router.events
      .pipe(
        filter((event): event is NavigationStart => event instanceof NavigationStart),
        takeUntilDestroyed()
      )
      .subscribe(event => {
        this.navigationStartTime = performance.now();
        this.currentRoute = event.url;
      });

    // Track navigation end
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(event => {
        const duration = performance.now() - this.navigationStartTime;

        this.addNavigationMetric({
          from: this.currentRoute,
          to: event.urlAfterRedirects,
          duration,
          timestamp: Date.now(),
          success: true
        });

        this.logger.info('[PerformanceMonitoring]', `Navigation to ${event.url} took ${duration.toFixed(2)}ms`);
      });

    // Track navigation errors
    this.router.events
      .pipe(
        filter((event): event is NavigationError => event instanceof NavigationError),
        takeUntilDestroyed()
      )
      .subscribe(event => {
        const duration = performance.now() - this.navigationStartTime;

        this.addNavigationMetric({
          from: this.currentRoute,
          to: event.url,
          duration,
          timestamp: Date.now(),
          success: false
        });

        this.logger.error(
          '[PerformanceMonitoring]',
          `Navigation to ${event.url} failed after ${duration.toFixed(2)}ms`,
          event.error as Error
        );
      });
  }

  /**
   * Initialize Performance Observer for Web Vitals
   * 初始化效能觀察器（Web Vitals）
   */
  private initializePerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      try {
        // Observe First Contentful Paint (FCP)
        const fcpObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            this.addMetric({
              name: 'FCP',
              value: entry.startTime,
              timestamp: Date.now(),
              metadata: { entryType: entry.entryType }
            });
          }
        });
        fcpObserver.observe({ entryTypes: ['paint'] });

        // Observe Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.addMetric({
            name: 'LCP',
            value: lastEntry.startTime,
            timestamp: Date.now(),
            metadata: { entryType: lastEntry.entryType }
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Observe First Input Delay (FID)
        const fidObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            const fidEntry = entry as PerformanceEventTiming;
            const fid = fidEntry.processingStart - fidEntry.startTime;
            this.addMetric({
              name: 'FID',
              value: fid,
              timestamp: Date.now(),
              metadata: { entryType: entry.entryType }
            });
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        this.logger.info('[PerformanceMonitoring]', 'Performance observers initialized');
      } catch (error) {
        this.logger.error('[PerformanceMonitoring]', 'Failed to initialize performance observers', error as Error);
      }
    }
  }

  /**
   * Add a performance metric
   * 新增效能指標
   */
  addMetric(metric: PerformanceMetric): void {
    if (!this._isMonitoring()) return;

    this._metrics.update(metrics => {
      const updated = [...metrics, metric];
      // Keep only last 100 metrics
      return updated.slice(-100);
    });

    this.logger.debug('[PerformanceMonitoring]', `Metric recorded: ${metric.name} = ${metric.value.toFixed(2)}ms`);
  }

  /**
   * Add a navigation metric
   * 新增導航指標
   */
  private addNavigationMetric(metric: NavigationMetric): void {
    if (!this._isMonitoring()) return;

    this._navigationMetrics.update(metrics => {
      const updated = [...metrics, metric];
      // Keep only last 50 navigation metrics
      return updated.slice(-50);
    });
  }

  /**
   * Mark a custom performance point
   * 標記自訂效能點
   */
  mark(name: string): void {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(name);
      this.logger.debug('[PerformanceMonitoring]', `Performance mark: ${name}`);
    }
  }

  /**
   * Measure time between two marks
   * 測量兩個標記之間的時間
   */
  measure(name: string, startMark: string, endMark: string): void {
    if ('performance' in window && 'measure' in performance) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0];

        this.addMetric({
          name,
          value: measure.duration,
          timestamp: Date.now(),
          metadata: { startMark, endMark }
        });

        this.logger.debug('[PerformanceMonitoring]', `Measure: ${name} = ${measure.duration.toFixed(2)}ms`);
      } catch (error) {
        this.logger.error('[PerformanceMonitoring]', `Failed to measure ${name}`, error as Error);
      }
    }
  }

  /**
   * Start monitoring
   * 開始監控
   */
  startMonitoring(): void {
    this._isMonitoring.set(true);
    this.logger.info('[PerformanceMonitoring]', 'Monitoring started');
  }

  /**
   * Stop monitoring
   * 停止監控
   */
  stopMonitoring(): void {
    this._isMonitoring.set(false);
    this.logger.info('[PerformanceMonitoring]', 'Monitoring stopped');
  }

  /**
   * Clear all metrics
   * 清除所有指標
   */
  clearMetrics(): void {
    this._metrics.set([]);
    this._navigationMetrics.set([]);
    this.logger.info('[PerformanceMonitoring]', 'All metrics cleared');
  }

  /**
   * Get metrics summary
   * 取得指標摘要
   */
  getSummary(): {
    totalMetrics: number;
    totalNavigations: number;
    averageNavigationTime: number;
    failedNavigations: number;
  } {
    return {
      totalMetrics: this.totalMetricsCount(),
      totalNavigations: this.totalNavigations(),
      averageNavigationTime: this.averageNavigationTime(),
      failedNavigations: this.failedNavigations()
    };
  }
}

// Type declaration for PerformanceEventTiming
interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
}
