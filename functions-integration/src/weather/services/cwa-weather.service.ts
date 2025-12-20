/**
 * CWA Weather Service
 *
 * Main service for interacting with Central Weather Administration Open Data Platform API.
 * Provides high-level methods for fetching weather data with built-in caching and error handling.
 *
 * @author GigHub Development Team
 * @date 2025-12-20
 */

import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { CwaHttpClient, createCwaHttpClient } from './http-client';
import {
  WeatherForecast36Hour,
  WeatherForecast7Day,
  TownshipWeatherForecast,
  MeteorologicalObservation,
  Observation10Minute,
  RainfallObservation,
  UvIndexObservation,
  WeatherAlert,
  RadarImage,
  EarthquakeInfo,
  CachedWeatherData,
  CwaApiConfig,
  CwaApiResponse
} from '../types';
import {
  API_ENDPOINTS,
  buildApiUrl,
  getTownshipForecastEndpoint,
  DEFAULT_CACHE_TTL
} from '../constants';

/**
 * CWA Weather Service configuration
 */
export interface CwaWeatherServiceConfig {
  apiKey: string;
  cacheEnabled?: boolean;
  cacheTTL?: {
    forecast?: number;
    observation?: number;
    alert?: number;
  };
}

/**
 * CWA Weather Service
 */
export class CwaWeatherService {
  private readonly httpClient: CwaHttpClient;
  private readonly firestore: FirebaseFirestore.Firestore;
  private readonly config: Required<CwaWeatherServiceConfig>;
  private readonly cacheCollection = 'weather_cache';

  constructor(config: CwaWeatherServiceConfig) {
    this.config = {
      apiKey: config.apiKey,
      cacheEnabled: config.cacheEnabled ?? true,
      cacheTTL: {
        forecast: config.cacheTTL?.forecast ?? DEFAULT_CACHE_TTL.FORECAST,
        observation: config.cacheTTL?.observation ?? DEFAULT_CACHE_TTL.OBSERVATION,
        alert: config.cacheTTL?.alert ?? DEFAULT_CACHE_TTL.ALERT
      }
    };

    this.httpClient = createCwaHttpClient({
      baseUrl: 'https://opendata.cwa.gov.tw/api',
      apiKey: this.config.apiKey,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      maxRetryDelay: 10000
    });

    this.firestore = admin.firestore();
  }

  // ===== Weather Forecast Methods =====

  /**
   * Get 36-hour weather forecast by county
   * @param countyName 縣市名稱 (e.g., "臺北市", "新北市")
   * @param locationName 地區名稱 (optional, for filtering)
   */
  async get36HourForecast(countyName: string, locationName?: string): Promise<CwaApiResponse<WeatherForecast36Hour>> {
    const cacheKey = `forecast_36h_${countyName}_${locationName ?? 'all'}`;

    // Check cache first
    if (this.config.cacheEnabled) {
      const cached = await this.getFromCache<WeatherForecast36Hour>(cacheKey);
      if (cached) {
        logger.info(`[CwaWeatherService] Cache hit for ${cacheKey}`);
        return {
          success: true,
          result: cached.data
        };
      }
    }

    // Fetch from API
    const url = buildApiUrl(API_ENDPOINTS.forecast.hour36, this.config.apiKey, {
      locationName: countyName
    });

    const response = await this.httpClient.get<WeatherForecast36Hour>(url);

    // Cache successful response
    if (response.success && response.result) {
      await this.saveToCache(cacheKey, response.result, this.config.cacheTTL.forecast!);
    }

    return response;
  }

  /**
   * Get 7-day weather forecast
   * @param countyName 縣市名稱
   */
  async get7DayForecast(countyName: string): Promise<CwaApiResponse<WeatherForecast7Day>> {
    const cacheKey = `forecast_7d_${countyName}`;

    if (this.config.cacheEnabled) {
      const cached = await this.getFromCache<WeatherForecast7Day>(cacheKey);
      if (cached) {
        return {
          success: true,
          result: cached.data
        };
      }
    }

    const url = buildApiUrl(API_ENDPOINTS.forecast.day7, this.config.apiKey, {
      locationName: countyName
    });

    const response = await this.httpClient.get<WeatherForecast7Day>(url);

    if (response.success && response.result) {
      await this.saveToCache(cacheKey, response.result, this.config.cacheTTL.forecast!);
    }

    return response;
  }

  /**
   * Get township-level weather forecast
   * @param countyCode 縣市代碼 (e.g., "63" for 臺北市)
   * @param townshipName 鄉鎮市區名稱 (optional, for filtering)
   */
  async getTownshipForecast(countyCode: string, townshipName?: string): Promise<CwaApiResponse<TownshipWeatherForecast>> {
    const endpoint = getTownshipForecastEndpoint(countyCode);

    if (!endpoint) {
      return {
        success: false,
        error: {
          code: 'INVALID_COUNTY_CODE',
          message: `Invalid county code: ${countyCode}`
        }
      };
    }

    const cacheKey = `forecast_township_${countyCode}_${townshipName ?? 'all'}`;

    if (this.config.cacheEnabled) {
      const cached = await this.getFromCache<TownshipWeatherForecast>(cacheKey);
      if (cached) {
        return {
          success: true,
          result: cached.data
        };
      }
    }

    const url = buildApiUrl(endpoint, this.config.apiKey, {
      ...(townshipName && { locationName: townshipName })
    });

    const response = await this.httpClient.get<TownshipWeatherForecast>(url);

    if (response.success && response.result) {
      await this.saveToCache(cacheKey, response.result, this.config.cacheTTL.forecast!);
    }

    return response;
  }

  // ===== Weather Observation Methods =====

  /**
   * Get meteorological station observation data
   * @param stationId 測站ID (optional, returns all stations if not specified)
   */
  async getMeteorologicalObservation(stationId?: string): Promise<CwaApiResponse<MeteorologicalObservation[]>> {
    const cacheKey = `obs_meteorological_${stationId ?? 'all'}`;

    if (this.config.cacheEnabled) {
      const cached = await this.getFromCache<MeteorologicalObservation[]>(cacheKey);
      if (cached) {
        return {
          success: true,
          result: cached.data
        };
      }
    }

    const url = buildApiUrl(API_ENDPOINTS.observation.meteorological, this.config.apiKey, {
      ...(stationId && { stationId })
    });

    const response = await this.httpClient.get<any>(url);

    if (response.success && response.result) {
      // Transform API response to typed format
      const observations: MeteorologicalObservation[] = response.result.location?.map((loc: any) => ({
        obsTime: response.result.obsTime || new Date().toISOString(),
        locationName: loc.locationName,
        stationId: loc.stationId,
        lat: parseFloat(loc.lat),
        lon: parseFloat(loc.lon),
        weatherElement: loc.weatherElement || []
      })) || [];

      await this.saveToCache(cacheKey, observations, this.config.cacheTTL.observation!);

      return {
        success: true,
        result: observations
      };
    }

    return response;
  }

  /**
   * Get 10-minute automatic weather station observation
   * @param stationId 測站ID (optional)
   */
  async get10MinuteObservation(stationId?: string): Promise<CwaApiResponse<Observation10Minute[]>> {
    const cacheKey = `obs_10min_${stationId ?? 'all'}`;

    if (this.config.cacheEnabled) {
      const cached = await this.getFromCache<Observation10Minute[]>(cacheKey);
      if (cached) {
        return {
          success: true,
          result: cached.data
        };
      }
    }

    const url = buildApiUrl(API_ENDPOINTS.observation.auto10min, this.config.apiKey, {
      ...(stationId && { stationId })
    });

    const response = await this.httpClient.get<any>(url);

    if (response.success && response.result) {
      const observations: Observation10Minute[] = response.result.location?.map((loc: any) => {
        const weatherElements: Record<string, any> = {};
        loc.weatherElement?.forEach((elem: any) => {
          weatherElements[elem.elementName] = elem.elementValue;
        });

        return {
          obsTime: response.result.obsTime || new Date().toISOString(),
          stationId: loc.stationId,
          stationName: loc.locationName,
          lat: parseFloat(loc.lat),
          lon: parseFloat(loc.lon),
          temperature: parseFloat(weatherElements.TEMP) || undefined,
          humidity: parseFloat(weatherElements.HUMD) || undefined,
          pressure: parseFloat(weatherElements.PRES) || undefined,
          windSpeed: parseFloat(weatherElements.WDSD) || undefined,
          windDirection: parseFloat(weatherElements.WDIR) || undefined,
          precipitation: parseFloat(weatherElements.H_24R) || undefined
        };
      }) || [];

      await this.saveToCache(cacheKey, observations, this.config.cacheTTL.observation!);

      return {
        success: true,
        result: observations
      };
    }

    return response;
  }

  /**
   * Get rainfall observation data
   * @param stationId 測站ID (optional)
   */
  async getRainfallObservation(stationId?: string): Promise<CwaApiResponse<RainfallObservation[]>> {
    const cacheKey = `obs_rainfall_${stationId ?? 'all'}`;

    if (this.config.cacheEnabled) {
      const cached = await this.getFromCache<RainfallObservation[]>(cacheKey);
      if (cached) {
        return {
          success: true,
          result: cached.data
        };
      }
    }

    const url = buildApiUrl(API_ENDPOINTS.observation.rainfall, this.config.apiKey, {
      ...(stationId && { stationId })
    });

    const response = await this.httpClient.get<any>(url);

    if (response.success && response.result) {
      const observations: RainfallObservation[] = response.result.location?.map((loc: any) => {
        const weatherElements: Record<string, any> = {};
        loc.weatherElement?.forEach((elem: any) => {
          weatherElements[elem.elementName] = elem.elementValue;
        });

        return {
          obsTime: response.result.obsTime || new Date().toISOString(),
          stationId: loc.stationId,
          stationName: loc.locationName,
          lat: parseFloat(loc.lat),
          lon: parseFloat(loc.lon),
          rainfall: {
            now: parseFloat(weatherElements.NOW) || undefined,
            hour1: parseFloat(weatherElements.H_1R) || undefined,
            hour3: parseFloat(weatherElements.H_3R) || undefined,
            hour6: parseFloat(weatherElements.H_6R) || undefined,
            hour12: parseFloat(weatherElements.H_12R) || undefined,
            hour24: parseFloat(weatherElements.H_24R) || undefined,
            day: parseFloat(weatherElements.D_TX) || undefined
          }
        };
      }) || [];

      await this.saveToCache(cacheKey, observations, this.config.cacheTTL.observation!);

      return {
        success: true,
        result: observations
      };
    }

    return response;
  }

  /**
   * Get UV index observation
   */
  async getUvIndexObservation(): Promise<CwaApiResponse<UvIndexObservation[]>> {
    const cacheKey = 'obs_uv_index';

    if (this.config.cacheEnabled) {
      const cached = await this.getFromCache<UvIndexObservation[]>(cacheKey);
      if (cached) {
        return {
          success: true,
          result: cached.data
        };
      }
    }

    const url = buildApiUrl(API_ENDPOINTS.observation.uvIndex, this.config.apiKey);

    const response = await this.httpClient.get<any>(url);

    if (response.success && response.result) {
      const observations: UvIndexObservation[] = response.result.location?.map((loc: any) => ({
        obsTime: response.result.obsTime || new Date().toISOString(),
        county: loc.County,
        uvIndex: parseFloat(loc.UVI),
        uvLevel: this.getUvLevel(parseFloat(loc.UVI)),
        description: loc.Description || ''
      })) || [];

      await this.saveToCache(cacheKey, observations, this.config.cacheTTL.observation!);

      return {
        success: true,
        result: observations
      };
    }

    return response;
  }

  // ===== Weather Alert Methods =====

  /**
   * Get active weather warnings
   * @param alertType 警報類型 (optional)
   */
  async getWeatherWarnings(alertType?: string): Promise<CwaApiResponse<WeatherAlert[]>> {
    const cacheKey = `alert_warnings_${alertType ?? 'all'}`;

    if (this.config.cacheEnabled) {
      const cached = await this.getFromCache<WeatherAlert[]>(cacheKey);
      if (cached) {
        return {
          success: true,
          result: cached.data
        };
      }
    }

    const url = buildApiUrl(API_ENDPOINTS.alert.general, this.config.apiKey);

    const response = await this.httpClient.get<any>(url);

    if (response.success && response.result) {
      // Transform to WeatherAlert format
      const alerts: WeatherAlert[] = []; // Transform logic here

      await this.saveToCache(cacheKey, alerts, this.config.cacheTTL.alert!);

      return {
        success: true,
        result: alerts
      };
    }

    return response;
  }

  // ===== Cache Management =====

  /**
   * Get data from cache
   */
  private async getFromCache<T>(key: string): Promise<CachedWeatherData<T> | null> {
    try {
      const doc = await this.firestore.collection(this.cacheCollection).doc(key).get();

      if (!doc.exists) {
        return null;
      }

      const cached = doc.data() as CachedWeatherData<T>;

      // Check if cache is expired
      const now = Timestamp.now();
      if (cached.expiresAt.seconds < now.seconds) {
        // Cache expired, delete it
        await doc.ref.delete();
        return null;
      }

      return cached;
    } catch (error) {
      logger.error(`[CwaWeatherService] Failed to get from cache: ${key}`, error);
      return null;
    }
  }

  /**
   * Save data to cache
   */
  private async saveToCache<T>(key: string, data: T, ttl: number): Promise<void> {
    try {
      const now = Timestamp.now();
      const expiresAt = Timestamp.fromMillis(now.toMillis() + ttl * 1000);

      const cached: CachedWeatherData<T> = {
        data,
        cachedAt: now,
        expiresAt,
        source: 'cwa_api'
      };

      await this.firestore.collection(this.cacheCollection).doc(key).set(cached);
    } catch (error) {
      logger.error(`[CwaWeatherService] Failed to save to cache: ${key}`, error);
    }
  }

  /**
   * Clear all cache
   */
  async clearCache(): Promise<void> {
    try {
      const snapshot = await this.firestore.collection(this.cacheCollection).get();
      const batch = this.firestore.batch();

      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      logger.info(`[CwaWeatherService] Cleared ${snapshot.size} cached items`);
    } catch (error) {
      logger.error('[CwaWeatherService] Failed to clear cache', error);
    }
  }

  // ===== Utility Methods =====

  /**
   * Get UV level from UV index
   */
  private getUvLevel(uvIndex: number): 'low' | 'moderate' | 'high' | 'very_high' | 'extreme' {
    if (uvIndex < 3) return 'low';
    if (uvIndex < 6) return 'moderate';
    if (uvIndex < 8) return 'high';
    if (uvIndex < 11) return 'very_high';
    return 'extreme';
  }
}

/**
 * Create CWA Weather Service instance
 */
export function createCwaWeatherService(config: CwaWeatherServiceConfig): CwaWeatherService {
  return new CwaWeatherService(config);
}
