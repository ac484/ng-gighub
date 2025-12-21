/**
 * Weather API Service
 * 中央氣象署 API 服務
 * 
 * 透過 Firebase Cloud Functions 呼叫 CWA API，避免 CORS 問題
 */

import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Observable, of, throwError, from } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { CacheService } from './cache.service';
import { CACHE_TTL } from '../config';
import type { WeatherForecast, EarthquakeInfo } from '../models';

/** Cloud Function 回應格式 */
interface WeatherApiResponse<T> {
  success: boolean;
  data: T;
  cached: boolean;
}

/** 36小時預報請求參數 */
interface Get36HourForecastRequest {
  countyName: string;
  locationName?: string;
}

@Injectable({ providedIn: 'root' })
export class WeatherApiService {
  private readonly functions = inject(Functions);
  private readonly cache = inject(CacheService);

  /** Cloud Function: 取得 36 小時預報 */
  private readonly getForecast36Hour = httpsCallable<
    Get36HourForecastRequest,
    WeatherApiResponse<any>
  >(this.functions, 'getForecast36Hour', { timeout: 60000 });

  /**
   * 取得縣市天氣預報
   * 透過 Cloud Function 呼叫，避免 CORS 問題
   */
  getCityForecast(locationName: string): Observable<WeatherForecast[]> {
    const cacheKey = `forecast_${locationName}`;

    // 檢查快取
    const cached = this.cache.get<WeatherForecast[]>(cacheKey);
    if (cached) {
      console.log('[WeatherApi] Cache hit:', cacheKey);
      return of(cached);
    }

    console.log('[WeatherApi] Calling Cloud Function for:', locationName);

    // 呼叫 Cloud Function
    return from(
      this.getForecast36Hour({
        countyName: locationName
      })
    ).pipe(
      map(result => {
        if (!result.data.success) {
          throw new Error('取得天氣預報失敗');
        }
        return this.transformToWeatherForecast(result.data.data);
      }),
      tap(data => {
        this.cache.set(cacheKey, data, CACHE_TTL.forecast);
        console.log('[WeatherApi] Data cached:', cacheKey);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * 取得地震報告
   * 暫時返回空陣列，未來可實作
   */
  getEarthquakeReport(limit = 10): Observable<EarthquakeInfo[]> {
    const cacheKey = `earthquake_${limit}`;

    // 檢查快取
    const cached = this.cache.get<EarthquakeInfo[]>(cacheKey);
    if (cached) {
      console.log('[WeatherApi] Cache hit:', cacheKey);
      return of(cached);
    }

    console.log('[WeatherApi] Earthquake report not yet implemented');
    
    // 暫時返回空陣列
    return of([]);
  }

  /**
   * 轉換 API 回應為天氣預報模型
   */
  private transformToWeatherForecast(response: any): WeatherForecast[] {
    const forecasts: WeatherForecast[] = [];

    if (!response?.records?.location) {
      return forecasts;
    }

    response.records.location.forEach((location: any) => {
      const wxElement = location.weatherElement?.find((el: any) => el.elementName === 'Wx');
      const minTElement = location.weatherElement?.find((el: any) => el.elementName === 'MinT');
      const maxTElement = location.weatherElement?.find((el: any) => el.elementName === 'MaxT');
      const popElement = location.weatherElement?.find((el: any) => el.elementName === 'PoP' || el.elementName === 'PoP12h');

      if (wxElement && wxElement.time?.length > 0) {
        wxElement.time.forEach((timeData: any, index: number) => {
          const minT = minTElement?.time[index];
          const maxT = maxTElement?.time[index];
          const pop = popElement?.time[index];

          forecasts.push({
            locationName: location.locationName,
            startTime: timeData.startTime,
            endTime: timeData.endTime,
            weatherDescription: timeData.parameter?.parameterName || '',
            weatherCode: timeData.parameter?.parameterValue || '',
            temperature: {
              min: minT ? parseInt(minT.parameter?.parameterName, 10) : 0,
              max: maxT ? parseInt(maxT.parameter?.parameterName, 10) : 0,
              unit: minT?.parameter?.parameterUnit || 'C'
            },
            rainProbability: pop ? parseInt(pop.parameter?.parameterName, 10) : 0
          });
        });
      }
    });

    return forecasts;
  }

  /**
   * 錯誤處理
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = '發生未知錯誤';

    if (error?.code) {
      // Firebase Functions 錯誤
      switch (error.code) {
        case 'unauthenticated':
          errorMessage = '需要登入才能查看天氣資料';
          break;
        case 'permission-denied':
          errorMessage = '無權限存取天氣資料';
          break;
        case 'unavailable':
          errorMessage = '氣象服務暫時無法使用，請稍後再試';
          break;
        case 'deadline-exceeded':
          errorMessage = '請求逾時，請稍後再試';
          break;
        default:
          errorMessage = error.message || '取得天氣資料失敗';
      }
    } else if (error?.message) {
      errorMessage = error.message;
    }

    console.error('[WeatherApi] Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
