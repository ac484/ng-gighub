/**
 * CWA Weather Provider Implementation
 * 
 * 業務邏輯劃分：中央氣象署（CWA）天氣資料提供者實作
 * 
 * Design Principles:
 * - High Cohesion: 專注於透過 Firebase Cloud Functions 獲取 CWA 天氣資料
 * - Low Coupling: 實作 IWeatherProvider 介面，與使用者解耦
 * - Extensibility: 可透過依賴注入替換為其他實作
 * 
 * @packageDocumentation
 */

import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable, HttpsCallableResult } from '@angular/fire/functions';
import { LoggerService } from '@core/services/logger';
import {
  IWeatherProvider,
  WeatherForecast,
  WeatherObservation,
  WeatherAlert
} from './weather-provider.interface';

/**
 * CWA Weather Provider
 * 
 * 透過 Firebase Cloud Functions 呼叫中央氣象署 API
 * 內部實作細節：使用 httpsCallable 呼叫特定 Cloud Function
 * 外部介面：遵守 IWeatherProvider 規範
 */
@Injectable({ providedIn: 'root' })
export class CwaWeatherProvider implements IWeatherProvider {
  private readonly functions = inject(Functions);
  private readonly logger = inject(LoggerService);

  /**
   * 獲取天氣預報
   * 
   * 內部實作：呼叫 getForecast36Hour Cloud Function
   * 可自由修改：切換到不同的 Cloud Function 或 API 端點
   */
  async getForecast(location: string): Promise<WeatherForecast | null> {
    try {
      const getForecastCallable = httpsCallable<{ countyName: string }, any>(
        this.functions,
        'getForecast36Hour'
      );

      const result: HttpsCallableResult<any> = await getForecastCallable({ countyName: location });

      if (!result.data?.location?.[0]) {
        this.logger.warn('[CwaWeatherProvider]', 'No forecast data available', { location });
        return null;
      }

      return this.transformForecastResponse(result.data);
    } catch (error) {
      this.logger.error('[CwaWeatherProvider]', 'getForecast failed', error as Error, { location });
      return null;
    }
  }

  /**
   * 獲取天氣觀測資料
   * 
   * 內部實作：呼叫 getObservation Cloud Function
   */
  async getObservation(stationId?: string): Promise<WeatherObservation | null> {
    try {
      const getObservationCallable = httpsCallable<{ stationId?: string }, any>(
        this.functions,
        'getObservation'
      );

      const result: HttpsCallableResult<any> = await getObservationCallable({ stationId });

      if (!result.data?.location?.[0]) {
        this.logger.warn('[CwaWeatherProvider]', 'No observation data available', { stationId });
        return null;
      }

      return this.transformObservationResponse(result.data);
    } catch (error) {
      this.logger.error('[CwaWeatherProvider]', 'getObservation failed', error as Error, { stationId });
      return null;
    }
  }

  /**
   * 獲取天氣警報
   * 
   * 內部實作：呼叫 getWeatherWarnings Cloud Function
   */
  async getAlerts(alertType?: string): Promise<WeatherAlert[]> {
    try {
      const getAlertsCallable = httpsCallable<{ alertType?: string }, any>(
        this.functions,
        'getWeatherWarnings'
      );

      const result: HttpsCallableResult<any> = await getAlertsCallable({ alertType });

      if (!result.data?.records?.record) {
        return [];
      }

      return this.transformAlertsResponse(result.data);
    } catch (error) {
      this.logger.error('[CwaWeatherProvider]', 'getAlerts failed', error as Error, { alertType });
      return [];
    }
  }

  /**
   * 內部方法：轉換 CWA API 回應為標準格式
   * 可自由修改：適應不同的 API 回應格式
   */
  private transformForecastResponse(data: any): WeatherForecast | null {
    const location = data.location[0];
    const weather = location.weatherElement?.find((e: any) => e.elementName === 'Wx')?.time?.[0]?.parameter?.parameterName || 'N/A';
    const temp = location.weatherElement?.find((e: any) => e.elementName === 'T')?.time?.[0]?.parameter?.parameterName || 'N/A';
    const rain = location.weatherElement?.find((e: any) => e.elementName === 'PoP')?.time?.[0]?.parameter?.parameterName || 'N/A';

    return {
      locationName: location.locationName,
      temperature: temp,
      weather,
      rainProbability: rain,
      updateTime: new Date()
    };
  }

  private transformObservationResponse(data: any): WeatherObservation | null {
    const location = data.location[0];
    const temp = location.weatherElement?.find((e: any) => e.elementName === 'TEMP')?.elementValue || 0;
    const humidity = location.weatherElement?.find((e: any) => e.elementName === 'HUMD')?.elementValue || 0;
    const weather = location.weatherElement?.find((e: any) => e.elementName === 'Weather')?.elementValue || 'N/A';

    return {
      stationName: location.locationName,
      temperature: parseFloat(temp) || 0,
      humidity: parseFloat(humidity) || 0,
      weather,
      observationTime: new Date()
    };
  }

  private transformAlertsResponse(data: any): WeatherAlert[] {
    const records = Array.isArray(data.records.record) ? data.records.record : [data.records.record];

    return records.map((record: any) => ({
      type: record.datasetInfo?.datasetName || 'N/A',
      title: record.hazardConditions?.hazards?.info?.phenomena || 'Weather Alert',
      description: record.hazardConditions?.hazards?.info?.headline || 'N/A',
      effectiveTime: new Date(record.hazardConditions?.hazards?.info?.effective || Date.now()),
      severity: this.mapSeverity(record.hazardConditions?.hazards?.info?.severity)
    }));
  }

  private mapSeverity(severity: string | undefined): 'high' | 'medium' | 'low' {
    if (!severity) return 'low';
    const normalized = severity.toLowerCase();
    if (normalized.includes('extreme') || normalized.includes('severe')) return 'high';
    if (normalized.includes('moderate')) return 'medium';
    return 'low';
  }
}
