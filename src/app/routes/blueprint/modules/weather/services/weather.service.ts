/**
 * Weather Service
 * 氣象服務
 *
 * Purpose: Provide weather data with caching and transformation
 * Architecture: Business logic service calling Firebase Cloud Functions
 *
 * ✅ High Cohesion: Single responsibility - weather data management
 * ✅ Low Coupling: Uses Firebase Functions (no direct API dependency)
 * ✅ Extensible: Easy to add new weather data types
 */

import { Injectable, inject, signal } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { LoggerService } from '@core/services/logger';

import { WeatherCacheService } from './weather-cache.service';
import type { WeatherForecast, WeatherObservation, WeatherAlert } from '../types/weather.types';

/**
 * Cloud Function Request Types
 */
interface ForecastRequest {
  countyName: string;
  locationName?: string;
}

interface ObservationRequest {
  stationId?: string;
}

interface AlertRequest {
  alertType?: string;
  activeOnly?: boolean;
}

/**
 * Cloud Function Response Type
 */
interface CloudFunctionResponse<T> {
  success: boolean;
  data: T;
  cached?: boolean;
  error?: {
    code: string;
    message: string;
  };
}

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private readonly functions = inject(Functions);
  private readonly cache = inject(WeatherCacheService);
  private readonly logger = inject(LoggerService);

  // State signals
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Public readonly signals
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /**
   * Get 36-hour weather forecast by county
   */
  async getForecast(countyName: string, useCache = true): Promise<WeatherForecast | null> {
    this._loading.set(true);
    this._error.set(null);

    const cacheKey = `forecast_36h_${countyName}`;

    try {
      // Check cache first
      if (useCache) {
        const cached = this.cache.get<WeatherForecast>(cacheKey);
        if (cached) {
          this.logger.debug('[WeatherService]', `Using cached forecast for ${countyName}`);
          this._loading.set(false);
          return cached;
        }
      }

      // Call Cloud Function
      this.logger.debug('[WeatherService]', `Fetching forecast for ${countyName}`);
      
      const getForecast36Hour = httpsCallable<ForecastRequest, CloudFunctionResponse<any>>(
        this.functions,
        'getForecast36Hour'
      );
      
      const result = await getForecast36Hour({ countyName });

      if (!result.data.success || !result.data.data?.records?.location?.[0]) {
        throw new Error('No forecast data available');
      }

      // Transform to our format
      const forecast = this.transformForecast(result.data.data.records.location[0]);

      // Cache the result
      if (useCache && forecast) {
        this.cache.set(cacheKey, forecast, this.cache.defaultTTL.FORECAST);
      }

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
  async getObservation(stationId?: string, useCache = true): Promise<WeatherObservation | null> {
    this._loading.set(true);
    this._error.set(null);

    const cacheKey = `observation_${stationId || 'all'}`;

    try {
      // Check cache first
      if (useCache) {
        const cached = this.cache.get<WeatherObservation>(cacheKey);
        if (cached) {
          this.logger.debug('[WeatherService]', `Using cached observation`);
          this._loading.set(false);
          return cached;
        }
      }

      // Call Cloud Function
      this.logger.debug('[WeatherService]', `Fetching observation${stationId ? ` for ${stationId}` : ''}`);
      
      const getObservation = httpsCallable<ObservationRequest, CloudFunctionResponse<any>>(
        this.functions,
        'getObservation'
      );
      
      const result = await getObservation({ stationId });

      if (!result.data.success || !result.data.data?.records?.location?.[0]) {
        throw new Error('No observation data available');
      }

      // Transform to our format
      const observation = this.transformObservation(result.data.data.records.location[0]);

      // Cache the result
      if (useCache && observation) {
        this.cache.set(cacheKey, observation, this.cache.defaultTTL.OBSERVATION);
      }

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
  async getAlerts(alertType?: string, useCache = true): Promise<WeatherAlert[]> {
    this._loading.set(true);
    this._error.set(null);

    const cacheKey = `alerts_${alertType || 'all'}`;

    try {
      // Check cache first
      if (useCache) {
        const cached = this.cache.get<WeatherAlert[]>(cacheKey);
        if (cached) {
          this.logger.debug('[WeatherService]', `Using cached alerts`);
          this._loading.set(false);
          return cached;
        }
      }

      // Call Cloud Function
      this.logger.debug('[WeatherService]', 'Fetching weather alerts');
      
      const getWeatherWarnings = httpsCallable<AlertRequest, CloudFunctionResponse<any>>(
        this.functions,
        'getWeatherWarnings'
      );
      
      const result = await getWeatherWarnings({ alertType, activeOnly: true });

      if (!result.data.success || !result.data.data?.records?.record) {
        return [];
      }

      // Transform to our format
      const records: unknown[] = Array.isArray(result.data.data.records.record) 
        ? result.data.data.records.record 
        : [result.data.data.records.record];

      const alerts = records.map((record: unknown) => this.transformAlert(record));

      // Cache the result
      if (useCache && alerts.length > 0) {
        this.cache.set(cacheKey, alerts, this.cache.defaultTTL.ALERT);
      }

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
   * Clear all cached weather data
   */
  clearCache(): void {
    this.cache.clearAll();
    this.logger.info('[WeatherService]', 'Cache cleared');
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): number {
    return this.cache.clearExpired();
  }

  // ===== Private Helper Constants =====

  /**
   * Weather element codes
   */
  private readonly WEATHER_ELEMENTS = {
    Wx: 'Wx',
    T: 'T',
    PoP: 'PoP',
    TEMP: 'TEMP',
    HUMD: 'HUMD',
    Weather: 'Weather'
  } as const;

  // ===== Private Helper Methods =====

  /**
   * Transform CWA forecast location to our format
   */
  private transformForecast(location: any): WeatherForecast {
    const wxElement = this.findElement(location.weatherElement, this.WEATHER_ELEMENTS.Wx);
    const tempElement = this.findElement(location.weatherElement, this.WEATHER_ELEMENTS.T);
    const popElement = this.findElement(location.weatherElement, this.WEATHER_ELEMENTS.PoP);

    return {
      locationName: location.locationName,
      temperature: this.getElementValue(tempElement, '0'),
      weather: this.getElementValue(wxElement, 'N/A'),
      rainProbability: this.getElementValue(popElement, '0'),
      updateTime: new Date()
    };
  }

  /**
   * Transform CWA observation location to our format
   */
  private transformObservation(location: any): WeatherObservation {
    const tempElement = this.findElement(location.weatherElement, this.WEATHER_ELEMENTS.TEMP);
    const humdElement = this.findElement(location.weatherElement, this.WEATHER_ELEMENTS.HUMD);
    const weatherElement = this.findElement(location.weatherElement, this.WEATHER_ELEMENTS.Weather);

    return {
      stationName: location.locationName,
      temperature: this.parseFloat(this.getElementValue(tempElement, '0')),
      humidity: this.parseFloat(this.getElementValue(humdElement, '0')),
      weather: this.getElementValue(weatherElement, 'N/A'),
      observationTime: new Date()
    };
  }

  /**
   * Transform CWA alert record to our format
   */
  private transformAlert(record: unknown): WeatherAlert {
    const r = record as Record<string, any>;
    return {
      type: r['datasetInfo']?.['datasetName'] || 'N/A',
      title: r['hazardConditions']?.['hazards']?.['info']?.['phenomena'] || 'Weather Alert',
      description: r['hazardConditions']?.['hazards']?.['info']?.['headline'] || 'N/A',
      effectiveTime: new Date(r['hazardConditions']?.['hazards']?.['info']?.['effective'] || Date.now()),
      severity: this.mapSeverity(r['hazardConditions']?.['hazards']?.['info']?.['severity'])
    };
  }

  /**
   * Find weather element by name
   */
  private findElement(elements: any[], name: string): any {
    return elements.find((el: any) => el.elementName === name);
  }

  /**
   * Get element value (from time array or direct elementValue)
   */
  private getElementValue(element: any, defaultValue: string): string {
    if (!element) return defaultValue;

    // Try to get from time array first
    if (element.time && element.time.length > 0) {
      return element.time[0].parameter.parameterName || defaultValue;
    }

    // Try direct elementValue
    if (element.elementValue !== undefined) {
      return String(element.elementValue);
    }

    return defaultValue;
  }

  /**
   * Parse float safely
   */
  private parseFloat(value: string): number {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
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
