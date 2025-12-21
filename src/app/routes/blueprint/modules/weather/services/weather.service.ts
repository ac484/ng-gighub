/**
 * Weather Service
 * 氣象服務
 *
 * Purpose: Call functions-integration weather APIs
 * Architecture: Service layer for weather data
 *
 * ✅ High Cohesion: Single responsibility - weather data fetching
 * ✅ Low Coupling: Communicates via Firebase callable functions
 */

import { Injectable, inject, signal } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { LoggerService } from '@core/services/logger';

import type { WeatherForecast, WeatherObservation, WeatherAlert } from '../types/weather.types';

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private readonly functions = inject(Functions);
  private readonly logger = inject(LoggerService);

  // State signals
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Public readonly signals
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Create callable functions during initialization
  private readonly getForecastCallable = httpsCallable<{ countyName: string }, any>(this.functions, 'getForecast36Hour');
  private readonly getObservationCallable = httpsCallable<{ stationId?: string }, any>(this.functions, 'getObservation');
  private readonly getAlertsCallable = httpsCallable<{ alertType?: string }, any>(this.functions, 'getWeatherWarnings');

  /**
   * Get 36-hour weather forecast by county
   */
  async getForecast(countyName: string): Promise<WeatherForecast | null> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const result = await this.getForecastCallable({ countyName });

      if (!result.data?.location?.[0]) {
        throw new Error('No forecast data available');
      }

      const location = result.data.location[0];
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
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch forecast';
      this._error.set(errorMsg);
      this.logger.error('[WeatherService]', 'getForecast failed', error as Error);
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Get current weather observation
   */
  async getObservation(stationId?: string): Promise<WeatherObservation | null> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const result = await this.getObservationCallable({ stationId });

      if (!result.data?.location?.[0]) {
        throw new Error('No observation data available');
      }

      const location = result.data.location[0];
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
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch observation';
      this._error.set(errorMsg);
      this.logger.error('[WeatherService]', 'getObservation failed', error as Error);
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Get active weather warnings
   */
  async getAlerts(alertType?: string): Promise<WeatherAlert[]> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const result = await this.getAlertsCallable({ alertType });

      if (!result.data?.records?.record) {
        return [];
      }

      const records = Array.isArray(result.data.records.record) ? result.data.records.record : [result.data.records.record];

      return records.map((record: any) => ({
        type: record.datasetInfo?.datasetName || 'N/A',
        title: record.hazardConditions?.hazards?.info?.phenomena || 'Weather Alert',
        description: record.hazardConditions?.hazards?.info?.headline || 'N/A',
        effectiveTime: new Date(record.hazardConditions?.hazards?.info?.effective || Date.now()),
        severity: this.mapSeverity(record.hazardConditions?.hazards?.info?.severity)
      }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch alerts';
      this._error.set(errorMsg);
      this.logger.error('[WeatherService]', 'getAlerts failed', error as Error);
      return [];
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Map CWA severity to internal severity
   */
  private mapSeverity(severity: string | undefined): 'high' | 'medium' | 'low' {
    if (!severity) return 'low';
    const normalized = severity.toLowerCase();
    if (normalized.includes('extreme') || normalized.includes('severe')) return 'high';
    if (normalized.includes('moderate')) return 'medium';
    return 'low';
  }
}
