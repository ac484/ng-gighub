/**
 * Weather Service (Simplified)
 * 氣象服務
 *
 * Architecture: Following agreement module pattern
 * - Service directly calls Firebase Cloud Functions
 * - Simple, focused, easy to maintain
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
  private readonly _forecast = signal<WeatherForecast | null>(null);
  private readonly _observation = signal<WeatherObservation | null>(null);
  private readonly _alerts = signal<WeatherAlert[]>([]);

  // Public readonly signals
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly forecast = this._forecast.asReadonly();
  readonly observation = this._observation.asReadonly();
  readonly alerts = this._alerts.asReadonly();

  // Create callable functions
  private readonly getForecastCallable = httpsCallable<{ countyName: string }, any>(
    this.functions,
    'getForecast36Hour'
  );
  private readonly getObservationCallable = httpsCallable<{ stationId?: string }, any>(
    this.functions,
    'getObservation'
  );
  private readonly getAlertsCallable = httpsCallable<{ alertType?: string }, any>(
    this.functions,
    'getWeatherWarnings'
  );

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
      const weather =
        location.weatherElement?.find((e: any) => e.elementName === 'Wx')?.time?.[0]?.parameter?.parameterName ||
        'N/A';
      const temp =
        location.weatherElement?.find((e: any) => e.elementName === 'T')?.time?.[0]?.parameter?.parameterName || 'N/A';
      const rain =
        location.weatherElement?.find((e: any) => e.elementName === 'PoP')?.time?.[0]?.parameter?.parameterName ||
        'N/A';

      const forecast: WeatherForecast = {
        locationName: location.locationName,
        temperature: temp,
        weather,
        rainProbability: rain,
        updateTime: new Date()
      };

      this._forecast.set(forecast);
      return forecast;
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

      const observation: WeatherObservation = {
        stationName: location.locationName,
        temperature: parseFloat(temp) || 0,
        humidity: parseFloat(humidity) || 0,
        weather,
        observationTime: new Date()
      };

      this._observation.set(observation);
      return observation;
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

      const records = Array.isArray(result.data.records.record)
        ? result.data.records.record
        : [result.data.records.record];

      const alerts: WeatherAlert[] = records.map((record: any) => ({
        type: record.datasetInfo?.datasetName || 'N/A',
        title: record.hazardConditions?.hazards?.info?.phenomena || 'Weather Alert',
        description: record.hazardConditions?.hazards?.info?.headline || 'N/A',
        effectiveTime: new Date(record.hazardConditions?.hazards?.info?.effective || Date.now()),
        severity: this.mapSeverity(record.hazardConditions?.hazards?.info?.severity)
      }));

      this._alerts.set(alerts);
      return alerts;
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
   * Clear error message
   */
  clearError(): void {
    this._error.set(null);
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
