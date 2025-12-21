/**
 * Weather Card Component
 * 氣象卡片元件
 *
 * Purpose: Display weather data in compact card format
 * Usage: Can be embedded in any page (dashboard, overview, etc.)
 *
 * ✅ Angular 20 Patterns: Signals, Standalone, input(), inject()
 * ✅ Minimal & Reusable: Single responsibility component
 */

import { DatePipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, input, signal, computed, effect, inject } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { WeatherService } from '../services/weather.service';
import type { WeatherDisplayMode, WeatherForecast, WeatherObservation, WeatherAlert } from '../types/weather.types';

@Component({
  selector: 'app-weather-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzCardModule, NzStatisticModule, NzAlertModule, NzDescriptionsModule, NzTagModule, DatePipe],
  template: `
    <nz-card [nzTitle]="title()" [nzExtra]="extraTpl" [nzLoading]="loading()">
      @if (error()) {
        <nz-alert nzType="error" [nzMessage]="error()!" nzShowIcon />
      } @else {
        @switch (mode()) {
          @case ('forecast') {
            @if (forecast(); as data) {
              <nz-descriptions [nzColumn]="2">
                <nz-descriptions-item nzTitle="縣市">{{ data.locationName }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="溫度">{{ data.temperature }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="天氣">{{ data.weather }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="降雨機率">{{ data.rainProbability }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="更新時間" [nzSpan]="2">{{
                  data.updateTime | date: 'yyyy-MM-dd HH:mm'
                }}</nz-descriptions-item>
              </nz-descriptions>
            }
          }
          @case ('observation') {
            @if (observation(); as data) {
              <nz-descriptions [nzColumn]="2">
                <nz-descriptions-item nzTitle="測站">{{ data.stationName }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="溫度">{{ data.temperature }}°C</nz-descriptions-item>
                <nz-descriptions-item nzTitle="濕度">{{ data.humidity }}%</nz-descriptions-item>
                <nz-descriptions-item nzTitle="天氣">{{ data.weather }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="觀測時間" [nzSpan]="2">{{
                  data.observationTime | date: 'yyyy-MM-dd HH:mm'
                }}</nz-descriptions-item>
              </nz-descriptions>
            }
          }
          @case ('alert') {
            @if (alerts().length > 0) {
              @for (alert of alerts(); track alert.title) {
                <nz-alert
                  [nzType]="alert.severity === 'high' ? 'error' : alert.severity === 'medium' ? 'warning' : 'info'"
                  [nzMessage]="alert.title"
                  [nzDescription]="alert.description"
                  nzShowIcon
                  class="mb-sm"
                />
              }
            } @else {
              <nz-alert nzType="success" nzMessage="目前無天氣警報" nzShowIcon />
            }
          }
          @case ('compact') {
            <div nz-row [nzGutter]="16">
              <div nz-col [nzSpan]="12">
                <h4>天氣預報</h4>
                @if (forecast(); as data) {
                  <p
                    ><strong>{{ data.locationName }}</strong></p
                  >
                  <p>溫度: {{ data.temperature }}</p>
                  <p>天氣: {{ data.weather }}</p>
                  <p>降雨: {{ data.rainProbability }}</p>
                } @else {
                  <p class="text-grey">載入中...</p>
                }
              </div>
              <div nz-col [nzSpan]="12">
                <h4>即時觀測</h4>
                @if (observation(); as data) {
                  <p
                    ><strong>{{ data.stationName }}</strong></p
                  >
                  <p>溫度: {{ data.temperature }}°C</p>
                  <p>濕度: {{ data.humidity }}%</p>
                  <p>天氣: {{ data.weather }}</p>
                } @else {
                  <p class="text-grey">載入中...</p>
                }
              </div>
            </div>
          }
        }
      }

      <ng-template #extraTpl>
        <button nz-button nzType="link" nzSize="small" (click)="refresh()">
          <span nz-icon nzType="reload"></span>
          重新載入
        </button>
      </ng-template>
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
export class WeatherCardComponent {
  private readonly weatherService = inject(WeatherService);

  // Input signals
  mode = input<WeatherDisplayMode>('compact');
  countyName = input<string>('臺北市');
  stationId = input<string | undefined>(undefined);
  autoRefresh = input<boolean>(false);
  refreshInterval = input<number>(600000); // 10 minutes default

  // State signals
  forecast = signal<WeatherForecast | null>(null);
  observation = signal<WeatherObservation | null>(null);
  alerts = signal<WeatherAlert[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Computed
  title = computed(() => {
    switch (this.mode()) {
      case 'forecast':
        return '天氣預報';
      case 'observation':
        return '即時觀測';
      case 'alert':
        return '天氣警報';
      default:
        return '天氣資訊';
    }
  });

  constructor() {
    // Auto-load on init
    effect(
      () => {
        const county = this.countyName();
        const station = this.stationId();
        if (county || station) {
          this.loadWeatherData();
        }
      },
      { allowSignalWrites: true }
    );

    // Auto-refresh effect
    effect(() => {
      if (this.autoRefresh()) {
        const interval = setInterval(() => this.loadWeatherData(), this.refreshInterval());
        return () => clearInterval(interval);
      }
      return undefined;
    });
  }

  /**
   * Load weather data based on mode
   */
  async loadWeatherData(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const mode = this.mode();

      if (mode === 'forecast' || mode === 'compact') {
        const forecastData = await this.weatherService.getForecast(this.countyName());
        this.forecast.set(forecastData);
      }

      if (mode === 'observation' || mode === 'compact') {
        const observationData = await this.weatherService.getObservation(this.stationId());
        this.observation.set(observationData);
      }

      if (mode === 'alert') {
        const alertsData = await this.weatherService.getAlerts();
        this.alerts.set(alertsData);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '載入天氣資料失敗';
      this.error.set(errorMsg);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Manual refresh
   */
  refresh(): void {
    this.loadWeatherData();
  }
}

/**
 * Forecast View Component
 */
@Component({
  selector: 'app-weather-forecast-view',
  standalone: true,
  imports: [SHARED_IMPORTS, NzStatisticModule],
  template: `
    @if (data()) {
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="12">
          <nz-statistic nzTitle="溫度" [nzValue]="data()!.temperature" nzSuffix="°C" />
        </nz-col>
        <nz-col [nzSpan]="12">
          <nz-statistic nzTitle="降雨機率" [nzValue]="data()!.rainProbability" nzSuffix="%" />
        </nz-col>
      </nz-row>
      <p class="mt-md"><strong>天氣狀況:</strong> {{ data()!.weather }}</p>
      <p class="text-grey"
        ><small>更新時間: {{ data()!.updateTime | date: 'short' }}</small></p
      >
    } @else {
      <nz-empty nzNotFoundContent="無預報資料" />
    }
  `
})
export class WeatherForecastViewComponent {
  data = input<WeatherForecast | null>(null);
}

/**
 * Observation View Component
 */
@Component({
  selector: 'app-weather-observation-view',
  standalone: true,
  imports: [SHARED_IMPORTS, NzStatisticModule],
  template: `
    @if (data()) {
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="8">
          <nz-statistic nzTitle="溫度" [nzValue]="data()!.temperature" nzSuffix="°C" />
        </nz-col>
        <nz-col [nzSpan]="8">
          <nz-statistic nzTitle="濕度" [nzValue]="data()!.humidity" nzSuffix="%" />
        </nz-col>
        <nz-col [nzSpan]="8">
          <p><strong>天氣:</strong><br />{{ data()!.weather }}</p>
        </nz-col>
      </nz-row>
      <p class="text-grey mt-md"
        ><small>觀測時間: {{ data()!.observationTime | date: 'short' }}</small></p
      >
    } @else {
      <nz-empty nzNotFoundContent="無觀測資料" />
    }
  `
})
export class WeatherObservationViewComponent {
  data = input<WeatherObservation | null>(null);
}

/**
 * Alert View Component
 */
@Component({
  selector: 'app-weather-alert-view',
  standalone: true,
  imports: [SHARED_IMPORTS, NzAlertModule],
  template: `
    @if (alerts().length > 0) {
      @for (alert of alerts(); track alert.title) {
        <nz-alert
          [nzType]="getAlertType(alert.severity)"
          [nzMessage]="alert.title"
          [nzDescription]="alert.description"
          nzShowIcon
          class="mb-sm"
        />
      }
    } @else {
      <nz-alert nzType="success" nzMessage="目前無天氣警報" nzShowIcon />
    }
  `
})
export class WeatherAlertViewComponent {
  alerts = input<WeatherAlert[]>([]);

  getAlertType(severity: string): 'error' | 'warning' | 'info' {
    switch (severity) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      default:
        return 'info';
    }
  }
}

/**
 * Compact View Component
 */
@Component({
  selector: 'app-weather-compact-view',
  standalone: true,
  imports: [SHARED_IMPORTS, NzStatisticModule],
  template: `
    <nz-row [nzGutter]="16">
      @if (forecast()) {
        <nz-col [nzSpan]="12">
          <nz-statistic nzTitle="預報溫度" [nzValue]="forecast()!.temperature" nzSuffix="°C" />
          <p class="text-grey"
            ><small>{{ forecast()!.weather }}</small></p
          >
        </nz-col>
      }
      @if (observation()) {
        <nz-col [nzSpan]="12">
          <nz-statistic nzTitle="即時溫度" [nzValue]="observation()!.temperature" nzSuffix="°C" />
          <p class="text-grey"
            ><small>濕度: {{ observation()!.humidity }}%</small></p
          >
        </nz-col>
      }
    </nz-row>
  `
})
export class WeatherCompactViewComponent {
  forecast = input<WeatherForecast | null>(null);
  observation = input<WeatherObservation | null>(null);
}
