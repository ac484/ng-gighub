/**
 * CWB Weather Service
 * 中央氣象署天氣服務
 *
 * @packageDocumentation
 * @module ClimateServices
 */

import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, retry, timeout, tap } from 'rxjs/operators';

import { ClimateCacheService } from './climate-cache.service';
import { IClimateConfig } from '../config/climate.config';
import { getErrorMessage } from '../config/cwb-api.constants';
import { CwbApiResponse, DatasetId, WeatherElementCode } from '../models/cwb-api-response.model';
import { WeatherForecast, ConstructionSuitability } from '../models/weather-forecast.model';

/**
 * 中央氣象署天氣服務
 *
 * 提供 CWB API 的完整封裝，包含快取、重試和錯誤處理
 */
@Injectable({
  providedIn: 'root'
})
export class CwbWeatherService {
  private readonly http = inject(HttpClient);
  private readonly cache = inject(ClimateCacheService);
  private readonly destroyRef = inject(DestroyRef);

  // 狀態管理
  private _isInitialized = signal(false);
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  readonly isInitialized = this._isInitialized.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  private config?: IClimateConfig;

  /**
   * 初始化服務
   *
   * @param config - 氣候模組配置
   */
  initialize(config: IClimateConfig): void {
    if (this._isInitialized()) {
      console.warn('[CwbWeatherService] Already initialized');
      return;
    }

    this.config = config;
    this.cache.initialize(config);
    this._isInitialized.set(true);

    console.log('[CwbWeatherService] Initialized with config:', {
      baseUrl: config.apiBaseUrl,
      cacheEnabled: true,
      timeout: config.http.timeout
    });
  }

  /**
   * 取得縣市天氣預報（36小時）
   *
   * @param locationName - 縣市名稱（可選）
   * @param useCache - 是否使用快取（預設 true）
   * @returns Observable<WeatherForecast[]>
   */
  getCityWeatherForecast(locationName?: string, useCache = true): Observable<WeatherForecast[]> {
    this.ensureInitialized();

    const cacheKey = `forecast_city_${locationName || 'all'}`;

    // 檢查快取
    if (useCache) {
      const cached = this.cache.get<WeatherForecast[]>(cacheKey);
      if (cached) {
        console.log('[CwbWeatherService] Cache hit:', cacheKey);
        return of(cached);
      }
    }

    const datasetId = DatasetId.CITY_FORECAST;
    let params = new HttpParams().set('Authorization', this.config!.apiKey);

    if (locationName) {
      params = params.set('locationName', locationName);
    }

    this._loading.set(true);
    this._error.set(null);

    return this.http.get<CwbApiResponse>(`${this.config!.apiBaseUrl}/${datasetId}`, { params }).pipe(
      timeout(this.config!.http.timeout),
      retry({
        count: this.config!.retry.maxAttempts,
        delay: this.config!.retry.initialDelay
      }),
      map(response => this.transformWeatherData(response)),
      tap(data => {
        if (useCache) {
          this.cache.set(cacheKey, data);
        }
        this._loading.set(false);
      }),
      catchError(error => this.handleError(error)),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  /**
   * 取得鄉鎮天氣預報
   *
   * @param countyCode - 縣市代碼（例如：'063' 為台北市）
   * @param townshipName - 鄉鎮市區名稱（可選）
   * @param useCache - 是否使用快取（預設 true）
   * @returns Observable<CwbApiResponse>
   */
  getTownshipWeatherForecast(countyCode: string, townshipName?: string, useCache = true): Observable<CwbApiResponse> {
    this.ensureInitialized();

    const cacheKey = `forecast_township_${countyCode}_${townshipName || 'all'}`;

    // 檢查快取
    if (useCache) {
      const cached = this.cache.get<CwbApiResponse>(cacheKey);
      if (cached) {
        return of(cached);
      }
    }

    const datasetId = `${DatasetId.TOWNSHIP_FORECAST_PREFIX}${countyCode}`;
    let params = new HttpParams().set('Authorization', this.config!.apiKey);

    if (townshipName) {
      params = params.set('locationName', townshipName);
    }

    this._loading.set(true);

    return this.http.get<CwbApiResponse>(`${this.config!.apiBaseUrl}/${datasetId}`, { params }).pipe(
      timeout(this.config!.http.timeout),
      retry({
        count: this.config!.retry.maxAttempts,
        delay: this.config!.retry.initialDelay
      }),
      tap(data => {
        if (useCache) {
          this.cache.set(cacheKey, data);
        }
        this._loading.set(false);
      }),
      catchError(error => this.handleError(error)),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  /**
   * 取得自動氣象站觀測資料
   *
   * @param stationName - 測站名稱（可選）
   * @param useCache - 是否使用快取（預設 true）
   * @returns Observable<CwbApiResponse>
   */
  getWeatherStationData(stationName?: string, useCache = true): Observable<CwbApiResponse> {
    this.ensureInitialized();

    const cacheKey = `observation_station_${stationName || 'all'}`;

    if (useCache) {
      const cached = this.cache.get<CwbApiResponse>(cacheKey);
      if (cached) {
        return of(cached);
      }
    }

    const datasetId = DatasetId.AUTO_STATION;
    let params = new HttpParams().set('Authorization', this.config!.apiKey);

    if (stationName) {
      params = params.set('StationName', stationName);
    }

    this._loading.set(true);

    return this.http.get<CwbApiResponse>(`${this.config!.apiBaseUrl}/${datasetId}`, { params }).pipe(
      timeout(this.config!.http.timeout),
      retry({
        count: this.config!.retry.maxAttempts,
        delay: this.config!.retry.initialDelay
      }),
      tap(data => {
        if (useCache) {
          this.cache.set(cacheKey, data);
        }
        this._loading.set(false);
      }),
      catchError(error => this.handleError(error)),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  /**
   * 取得地震報告
   *
   * @param limit - 回傳筆數限制（預設 10）
   * @param useCache - 是否使用快取（預設 true）
   * @returns Observable<CwbApiResponse>
   */
  getEarthquakeReport(limit = 10, useCache = true): Observable<CwbApiResponse> {
    this.ensureInitialized();

    const cacheKey = `earthquake_report_${limit}`;

    if (useCache) {
      const cached = this.cache.get<CwbApiResponse>(cacheKey);
      if (cached) {
        return of(cached);
      }
    }

    const datasetId = DatasetId.EARTHQUAKE;
    const params = new HttpParams().set('Authorization', this.config!.apiKey).set('limit', limit.toString());

    this._loading.set(true);

    return this.http.get<CwbApiResponse>(`${this.config!.apiBaseUrl}/${datasetId}`, { params }).pipe(
      timeout(this.config!.http.timeout),
      retry({
        count: this.config!.retry.maxAttempts,
        delay: this.config!.retry.initialDelay
      }),
      tap(data => {
        if (useCache) {
          this.cache.set(cacheKey, data);
        }
        this._loading.set(false);
      }),
      catchError(error => this.handleError(error)),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  /**
   * 計算施工適宜度評估
   *
   * @param forecast - 天氣預報資料
   * @returns 施工適宜度評估
   */
  calculateConstructionSuitability(forecast: WeatherForecast): ConstructionSuitability {
    let score = 100;
    const factors = {
      rainfall: { value: 0, impact: 0, description: '' },
      temperature: { value: 0, impact: 0, description: '' },
      wind: { value: 0, impact: 0, description: '' },
      weather: { value: '', impact: 0, description: '' }
    };
    const recommendations: string[] = [];
    const warnings: string[] = [];

    // 降雨機率影響
    const rainProb = forecast.rainProbability;
    factors.rainfall.value = rainProb;
    if (rainProb > 70) {
      factors.rainfall.impact = -40;
      factors.rainfall.description = '降雨機率極高';
      score -= 40;
      warnings.push('降雨機率超過 70%，建議延期施工');
    } else if (rainProb > 50) {
      factors.rainfall.impact = -25;
      factors.rainfall.description = '降雨機率高';
      score -= 25;
      warnings.push('降雨機率較高，請做好防雨準備');
    } else if (rainProb > 30) {
      factors.rainfall.impact = -10;
      factors.rainfall.description = '降雨機率中等';
      score -= 10;
      recommendations.push('建議備妥防雨設施');
    }

    // 溫度影響
    const maxTemp = forecast.temperature.max;
    const minTemp = forecast.temperature.min;
    factors.temperature.value = maxTemp;

    if (maxTemp > 35) {
      factors.temperature.impact = -20;
      factors.temperature.description = '高溫酷熱';
      score -= 20;
      warnings.push('高溫天氣，注意工人中暑風險');
      recommendations.push('增加休息時間，提供充足飲水');
    } else if (maxTemp > 32) {
      factors.temperature.impact = -10;
      factors.temperature.description = '天氣炎熱';
      score -= 10;
      recommendations.push('注意防曬與補充水分');
    }

    if (minTemp < 10) {
      factors.temperature.impact -= 15;
      factors.temperature.description = '低溫寒冷';
      score -= 15;
      warnings.push('低溫天氣，注意保暖措施');
    }

    // 風速影響（如果有資料）
    if (forecast.windSpeed) {
      factors.wind.value = forecast.windSpeed;
      if (forecast.windSpeed > 10) {
        factors.wind.impact = -30;
        factors.wind.description = '強風';
        score -= 30;
        warnings.push('強風天氣，高處作業風險高');
      } else if (forecast.windSpeed > 5) {
        factors.wind.impact = -15;
        factors.wind.description = '風力較大';
        score -= 15;
        recommendations.push('注意高處作業安全');
      }
    }

    // 天氣現象影響
    factors.weather.value = forecast.weatherDescription;
    if (forecast.weatherDescription.includes('雨') || forecast.weatherDescription.includes('雷')) {
      factors.weather.impact = -20;
      factors.weather.description = '不穩定天氣';
      score -= 20;
    }

    // 確保分數在 0-100 範圍內
    score = Math.max(0, Math.min(100, score));

    // 判定等級
    let level: ConstructionSuitability['level'];
    if (score >= 90) {
      level = 'excellent';
      recommendations.push('天氣條件極佳，適合施工');
    } else if (score >= 70) {
      level = 'good';
      recommendations.push('天氣條件良好，可正常施工');
    } else if (score >= 50) {
      level = 'fair';
      recommendations.push('天氣條件尚可，建議做好準備');
    } else if (score >= 30) {
      level = 'poor';
      warnings.push('天氣條件不佳，建議評估是否延期');
    } else {
      level = 'dangerous';
      warnings.push('天氣條件危險，強烈建議停工');
    }

    return {
      score,
      level,
      factors,
      recommendations,
      warnings
    };
  }

  /**
   * 清除所有快取
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 清除過期快取
   *
   * @returns 清除的項目數量
   */
  clearExpiredCache(): number {
    return this.cache.clearExpired();
  }

  /**
   * 取得快取統計資訊
   *
   * @returns 快取統計
   */
  getCacheStats() {
    return this.cache.stats();
  }

  /**
   * 確保服務已初始化
   */
  private ensureInitialized(): void {
    if (!this._isInitialized()) {
      throw new Error('[CwbWeatherService] Service not initialized. Call initialize() first.');
    }
    if (!this.config?.apiKey) {
      throw new Error('[CwbWeatherService] API key not configured.');
    }
  }

  /**
   * 轉換 API 回應為簡化的天氣預報格式
   */
  private transformWeatherData(response: CwbApiResponse): WeatherForecast[] {
    const forecasts: WeatherForecast[] = [];

    response.records.location.forEach(location => {
      const wxElement = location.weatherElement.find(el => el.elementName === WeatherElementCode.Wx);
      const minTElement = location.weatherElement.find(el => el.elementName === WeatherElementCode.MinT);
      const maxTElement = location.weatherElement.find(el => el.elementName === WeatherElementCode.MaxT);
      const popElement = location.weatherElement.find(
        el => el.elementName === WeatherElementCode.PoP || el.elementName === WeatherElementCode.PoP12h
      );

      if (wxElement && wxElement.time.length > 0) {
        wxElement.time.forEach((timeData, index) => {
          const minT = minTElement?.time[index];
          const maxT = maxTElement?.time[index];
          const pop = popElement?.time[index];

          forecasts.push({
            locationName: location.locationName,
            startTime: timeData.startTime,
            endTime: timeData.endTime,
            weatherDescription: timeData.parameter.parameterName,
            weatherCode: timeData.parameter.parameterValue,
            temperature: {
              min: minT ? parseInt(minT.parameter.parameterName, 10) : 0,
              max: maxT ? parseInt(maxT.parameter.parameterName, 10) : 0,
              unit: minT?.parameter.parameterUnit || 'C'
            },
            rainProbability: pop ? parseInt(pop.parameter.parameterName, 10) : 0
          });
        });
      }
    });

    return forecasts;
  }

  /**
   * 錯誤處理
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = '發生未知錯誤';

    if (error.error instanceof ErrorEvent) {
      // 客戶端或網路錯誤
      errorMessage = `網路錯誤: ${error.error.message}`;
    } else {
      // 後端回傳錯誤
      errorMessage = getErrorMessage(error.status);
    }

    console.error('[CwbWeatherService] Error:', errorMessage, error);
    this._error.set(errorMessage);
    this._loading.set(false);

    return throwError(() => new Error(errorMessage));
  }
}
