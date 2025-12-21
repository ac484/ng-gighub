/**
 * Weather Service
 * 氣象服務
 *
 * Purpose: Provide weather data with caching and transformation
 * Architecture: Business logic service for weather data
 *
 * ✅ High Cohesion: Single responsibility - weather data management
 * ✅ Low Coupling: Uses injected dependencies (API client, cache)
 * ✅ Extensible: Easy to add new weather data types
 */

import { Injectable, inject, signal } from '@angular/core';
import { LoggerService } from '@core/services/logger';

import { CwaApiClient } from './cwa-api.client';
import { WeatherCacheService } from './weather-cache.service';
import { WEATHER_ELEMENTS } from '../types/cwa-api.types';
import type { CwaLocation, WeatherElement } from '../types/cwa-api.types';
import type { WeatherForecast, WeatherObservation, WeatherAlert } from '../types/weather.types';

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private readonly apiClient = inject(CwaApiClient);
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

      // Fetch from API
      this.logger.debug('[WeatherService]', `Fetching forecast for ${countyName}`);
      const response = await this.apiClient.getForecast36Hour({
        locationName: countyName
      });

      if (!response.records?.location?.[0]) {
        throw new Error('No forecast data available');
      }

      // Transform to our format
      const forecast = this.transformForecast(response.records.location[0]);

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

      // Fetch from API
      this.logger.debug('[WeatherService]', `Fetching observation${stationId ? ` for ${stationId}` : ''}`);
      const response = await this.apiClient.getMeteorologicalObservation({
        stationId
      });

      if (!response.records?.location?.[0]) {
        throw new Error('No observation data available');
      }

      // Transform to our format
      const observation = this.transformObservation(response.records.location[0]);

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

      // Fetch from API
      this.logger.debug('[WeatherService]', 'Fetching weather alerts');
      const response = await this.apiClient.getWeatherWarnings(alertType ? { alertType } : {});

      if (!response.records?.record) {
        return [];
      }

      // Transform to our format
      const records: unknown[] = Array.isArray(response.records.record) 
        ? response.records.record 
        : [response.records.record];

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

  /**
   * Transform CWA forecast location to our format
   */
  private transformForecast(location: CwaLocation): WeatherForecast {
    const wxElement = this.findElement(location.weatherElement, WEATHER_ELEMENTS.Wx);
    const tempElement = this.findElement(location.weatherElement, WEATHER_ELEMENTS.T);
    const popElement = this.findElement(location.weatherElement, WEATHER_ELEMENTS.PoP);

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
  private transformObservation(location: CwaLocation): WeatherObservation {
    const tempElement = this.findElement(location.weatherElement, WEATHER_ELEMENTS.TEMP);
    const humdElement = this.findElement(location.weatherElement, WEATHER_ELEMENTS.HUMD);
    const weatherElement = this.findElement(location.weatherElement, WEATHER_ELEMENTS.Weather);

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
  private findElement(elements: WeatherElement[], name: string): WeatherElement | undefined {
    return elements.find(el => el.elementName === name);
  }

  /**
   * Get element value (from time array or direct elementValue)
   */
  private getElementValue(element: WeatherElement | undefined, defaultValue: string): string {
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
