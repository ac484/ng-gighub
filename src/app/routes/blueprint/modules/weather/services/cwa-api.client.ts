/**
 * CWA API HTTP Client
 * 中央氣象署 API HTTP 客戶端
 *
 * Purpose: Direct HTTP communication with CWA OpenData API
 * Architecture: Infrastructure service for HTTP operations
 *
 * ✅ High Cohesion: Single responsibility - HTTP communication with CWA API
 * ✅ Low Coupling: Does not depend on weather domain logic
 * ✅ Extensible: Easy to add new API endpoints
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, throwError } from 'rxjs';
import { timeout, retry, catchError } from 'rxjs/operators';
import { LoggerService } from '@core/services/logger';
import { environment } from '@env/environment';
import type {
  CwaApiResponse,
  CwaForecastResponse,
  CwaObservationResponse,
  ForecastParams,
  ObservationParams
} from '../types/cwa-api.types';

/**
 * HTTP client configuration
 */
const HTTP_CONFIG = {
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000 // 1 second
} as const;

@Injectable({ providedIn: 'root' })
export class CwaApiClient {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly config = environment.cwa;
  
  /**
   * Get 36-hour forecast by county
   */
  async getForecast36Hour(params: ForecastParams): Promise<CwaApiResponse<CwaForecastResponse>> {
    return this.get<CwaForecastResponse>('F-C0032-001', params);
  }
  
  /**
   * Get 7-day forecast by county
   */
  async getForecast7Day(params: ForecastParams): Promise<CwaApiResponse<CwaForecastResponse>> {
    return this.get<CwaForecastResponse>('F-C0032-005', params);
  }
  
  /**
   * Get township forecast
   */
  async getTownshipForecast(countyCode: string, params: ForecastParams): Promise<CwaApiResponse<CwaForecastResponse>> {
    const datasetId = `F-D0047-${countyCode}`;
    return this.get<CwaForecastResponse>(datasetId, params);
  }
  
  /**
   * Get meteorological station observation
   */
  async getMeteorologicalObservation(params: ObservationParams): Promise<CwaApiResponse<CwaObservationResponse>> {
    return this.get<CwaObservationResponse>('O-A0001-001', params);
  }
  
  /**
   * Get 10-minute automatic observation
   */
  async get10MinuteObservation(params: ObservationParams): Promise<CwaApiResponse<CwaObservationResponse>> {
    return this.get<CwaObservationResponse>('O-A0003-001', params);
  }
  
  /**
   * Get rainfall observation
   */
  async getRainfallObservation(params: ObservationParams): Promise<CwaApiResponse<CwaObservationResponse>> {
    return this.get<CwaObservationResponse>('O-A0002-001', params);
  }
  
  /**
   * Get UV index observation
   */
  async getUvIndexObservation(): Promise<CwaApiResponse<CwaObservationResponse>> {
    return this.get<CwaObservationResponse>('O-A0005-001', {});
  }
  
  /**
   * Get general weather warnings
   */
  async getWeatherWarnings(params: Record<string, string> = {}): Promise<CwaApiResponse<any>> {
    return this.get<any>('W-C0033-001', params);
  }
  
  /**
   * Generic GET request to CWA API
   */
  private async get<T>(datasetId: string, params: Record<string, string | undefined>): Promise<CwaApiResponse<T>> {
    try {
      // Build HTTP params
      let httpParams = new HttpParams().set('Authorization', this.config.apiKey);
      
      // Add additional params
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          httpParams = httpParams.set(key, value);
        }
      });
      
      const url = `${this.config.baseUrl}/${datasetId}`;
      
      this.logger.debug('[CwaApiClient]', `GET ${url}`, params);
      
      // Make HTTP request with retry and timeout
      const response = await firstValueFrom(
        this.http.get<CwaApiResponse<T>>(url, { params: httpParams }).pipe(
          timeout(HTTP_CONFIG.timeout),
          retry({
            count: HTTP_CONFIG.retryAttempts,
            delay: HTTP_CONFIG.retryDelay
          }),
          catchError(this.handleError.bind(this))
        )
      );
      
      this.logger.debug('[CwaApiClient]', `Response received for ${datasetId}`);
      return response;
    } catch (error) {
      this.logger.error('[CwaApiClient]', `Failed to fetch ${datasetId}`, error as Error);
      throw error;
    }
  }
  
  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = '發生未知錯誤';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `網路錯誤: ${error.error.message}`;
    } else {
      // Backend error
      switch (error.status) {
        case 401:
          errorMessage = 'API Key 無效或已過期';
          break;
        case 403:
          errorMessage = 'API Key 無存取權限';
          break;
        case 429:
          errorMessage = 'API 請求次數超過限制（每日額度已用完）';
          break;
        case 500:
        case 502:
        case 503:
          errorMessage = 'CWA API 伺服器暫時無法服務';
          break;
        case 504:
          errorMessage = 'CWA API 請求逾時';
          break;
        default:
          errorMessage = `HTTP ${error.status}: ${error.message}`;
      }
    }
    
    this.logger.error('[CwaApiClient]', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
