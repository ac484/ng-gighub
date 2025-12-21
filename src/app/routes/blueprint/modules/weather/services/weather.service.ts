/**
 * Weather Service (Refactored)
 * 氣象服務
 *
 * 業務邏輯劃分：模組內部的天氣資料存取適配器
 * 
 * Design Principles Applied:
 * ✅ High Cohesion: 專注於為此模組提供天氣資料存取
 * ✅ Low Coupling: 透過 WeatherFacade 與底層實作解耦
 * ✅ Extensibility: 可透過 Facade 切換不同的資料來源
 * 
 * Architecture:
 * WeatherService (this) → WeatherFacade → IWeatherProvider → CwaWeatherProvider
 * 
 * 內部自由：可自由調整與 Facade 的互動方式
 * 外部介面固定：對外暴露的方法與 Signals 保持穩定
 */

import { Injectable, inject } from '@angular/core';
import { WeatherFacade } from '@core/weather';
import type { WeatherForecast, WeatherObservation, WeatherAlert } from '../types/weather.types';

/**
 * Weather Service - 模組級別的適配器
 * 
 * 職責：
 * 1. 適配 WeatherFacade 介面給此模組使用
 * 2. 提供模組特定的資料轉換或額外邏輯
 * 3. 維護向後相容的 API（如果需要）
 */
@Injectable({ providedIn: 'root' })
export class WeatherService {
  // 低耦合：依賴抽象的 Facade 而非具體實作
  private readonly weatherFacade = inject(WeatherFacade);

  // 暴露 Facade 的狀態 Signals（外部介面固定）
  readonly loading = this.weatherFacade.loading;
  readonly error = this.weatherFacade.error;
  readonly forecast = this.weatherFacade.forecast;
  readonly observation = this.weatherFacade.observation;
  readonly alerts = this.weatherFacade.alerts;


  /**
   * Get 36-hour weather forecast by county
   * 
   * 內部實作：委派給 WeatherFacade
   */
  async getForecast(countyName: string): Promise<WeatherForecast | null> {
    await this.weatherFacade.refreshForecast(countyName);
    return this.weatherFacade.forecast();
  }

  /**
   * Get current weather observation
   * 
   * 內部實作：委派給 WeatherFacade
   */
  async getObservation(stationId?: string): Promise<WeatherObservation | null> {
    await this.weatherFacade.refreshObservation(stationId);
    return this.weatherFacade.observation();
  }

  /**
   * Get active weather warnings
   * 
   * 內部實作：委派給 WeatherFacade
   */
  async getAlerts(alertType?: string): Promise<WeatherAlert[]> {
    await this.weatherFacade.refreshAlerts(alertType);
    return this.weatherFacade.alerts();
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.weatherFacade.clearError();
  }
}
