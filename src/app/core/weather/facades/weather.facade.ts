/**
 * Weather Facade
 * 
 * 業務邏輯劃分：天氣資料存取的協調層
 * 
 * Design Principles:
 * - High Cohesion: 專注於天氣資料的狀態管理與業務流程協調
 * - Low Coupling: 依賴 IWeatherProvider 介面而非具體實作
 * - Extensibility: 可透過 useProvider() 方法切換不同的資料來源
 * 
 * Responsibilities:
 * - 管理天氣資料的載入狀態
 * - 處理錯誤與重試邏輯
 * - 提供統一的資料存取介面給 UI 層
 * 
 * @packageDocumentation
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import {
  IWeatherProvider,
  WeatherForecast,
  WeatherObservation,
  WeatherAlert
} from '../providers/weather-provider.interface';
import { CwaWeatherProvider } from '../providers/cwa-weather.provider';

/**
 * Weather Facade Service
 * 
 * 模組間溝通：UI 元件透過此 Facade 存取天氣資料
 * 內部自由：可切換不同的 Provider 實作
 * 外部介面固定：提供穩定的 Signals 與方法給 UI 層
 */
@Injectable({ providedIn: 'root' })
export class WeatherFacade {
  // 預設使用 CWA Provider，但可透過 useProvider() 切換
  private provider: IWeatherProvider = inject(CwaWeatherProvider);

  // 私有可寫 Signals
  private readonly _forecast = signal<WeatherForecast | null>(null);
  private readonly _observation = signal<WeatherObservation | null>(null);
  private readonly _alerts = signal<WeatherAlert[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // 公開唯讀 Signals（外部介面固定）
  readonly forecast = this._forecast.asReadonly();
  readonly observation = this._observation.asReadonly();
  readonly alerts = this._alerts.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // 衍生狀態（計算屬性）
  readonly hasData = computed(() => this._forecast() !== null);
  readonly hasError = computed(() => this._error() !== null);
  readonly alertCount = computed(() => this._alerts().length);
  readonly highSeverityAlerts = computed(() =>
    this._alerts().filter(alert => alert.severity === 'high')
  );

  /**
   * 切換天氣資料提供者
   * 
   * Extensibility: 允許在執行時期切換不同的資料來源
   * 例如：測試環境使用 Mock Provider，正式環境使用 CWA Provider
   * 
   * @param provider 實作 IWeatherProvider 介面的提供者
   */
  useProvider(provider: IWeatherProvider): void {
    this.provider = provider;
    this.clearData();
  }

  /**
   * 重新整理天氣預報
   * 
   * @param location 地點名稱
   */
  async refreshForecast(location: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const forecast = await this.provider.getForecast(location);
      this._forecast.set(forecast);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '獲取天氣預報失敗';
      this._error.set(errorMessage);
      this._forecast.set(null);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 重新整理天氣觀測資料
   * 
   * @param stationId 測站ID（選填）
   */
  async refreshObservation(stationId?: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const observation = await this.provider.getObservation(stationId);
      this._observation.set(observation);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '獲取觀測資料失敗';
      this._error.set(errorMessage);
      this._observation.set(null);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 重新整理天氣警報
   * 
   * @param alertType 警報類型（選填）
   */
  async refreshAlerts(alertType?: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const alerts = await this.provider.getAlerts(alertType);
      this._alerts.set(alerts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '獲取天氣警報失敗';
      this._error.set(errorMessage);
      this._alerts.set([]);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 載入所有天氣資料
   * 
   * @param location 地點名稱
   * @param stationId 測站ID（選填）
   */
  async loadAllData(location: string, stationId?: string): Promise<void> {
    await Promise.all([
      this.refreshForecast(location),
      this.refreshObservation(stationId),
      this.refreshAlerts()
    ]);
  }

  /**
   * 清除所有資料
   */
  clearData(): void {
    this._forecast.set(null);
    this._observation.set(null);
    this._alerts.set([]);
    this._error.set(null);
    this._loading.set(false);
  }

  /**
   * 清除錯誤訊息
   */
  clearError(): void {
    this._error.set(null);
  }
}
