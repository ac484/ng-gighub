/**
 * Climate Module API Exports
 * 氣候模組公開 API
 *
 * 此檔案定義氣候模組匯出給其他模組使用的公開 API
 *
 * @packageDocumentation
 * @module ClimateExports
 */

import { Observable } from 'rxjs';

import { CwbApiResponse } from '../models/cwb-api-response.model';
import { WeatherForecast, WeatherObservation, EarthquakeInfo, ConstructionSuitability } from '../models/weather-forecast.model';
import { ClimateRepository } from '../repositories/climate.repository';
import { CwbWeatherService } from '../services/cwb-weather.service';

/**
 * 氣候模組公開 API 介面
 *
 * 定義其他模組可以使用的所有氣候相關功能
 */
export interface IClimateModuleApi {
  /**
   * 天氣服務 API
   */
  weather: {
    /**
     * 取得縣市天氣預報
     *
     * @param locationName - 縣市名稱
     * @param useCache - 是否使用快取
     */
    getCityForecast(locationName?: string, useCache?: boolean): Observable<WeatherForecast[]>;

    /**
     * 取得鄉鎮天氣預報
     *
     * @param countyCode - 縣市代碼
     * @param townshipName - 鄉鎮名稱
     * @param useCache - 是否使用快取
     */
    getTownshipForecast(countyCode: string, townshipName?: string, useCache?: boolean): Observable<CwbApiResponse>;

    /**
     * 取得氣象站觀測資料
     *
     * @param stationName - 測站名稱
     * @param useCache - 是否使用快取
     */
    getStationData(stationName?: string, useCache?: boolean): Observable<CwbApiResponse>;

    /**
     * 取得地震報告
     *
     * @param limit - 筆數限制
     * @param useCache - 是否使用快取
     */
    getEarthquakeReport(limit?: number, useCache?: boolean): Observable<CwbApiResponse>;

    /**
     * 計算施工適宜度
     *
     * @param forecast - 天氣預報資料
     */
    calculateConstructionSuitability(forecast: WeatherForecast): ConstructionSuitability;

    /**
     * 清除快取
     */
    clearCache(): void;

    /**
     * 取得快取統計
     */
    getCacheStats(): any;
  };

  /**
   * 儲存服務 API（供其他模組使用）
   */
  storage: {
    /**
     * 儲存天氣預報
     *
     * @param forecast - 預報資料
     * @param sourceModule - 來源模組 ID
     * @param metadata - 元資料
     */
    saveForecast(forecast: WeatherForecast, sourceModule: string, metadata?: Record<string, any>): Promise<string>;

    /**
     * 儲存觀測資料
     *
     * @param observation - 觀測資料
     * @param sourceModule - 來源模組 ID
     * @param metadata - 元資料
     */
    saveObservation(observation: WeatherObservation, sourceModule: string, metadata?: Record<string, any>): Promise<string>;

    /**
     * 儲存地震資訊
     *
     * @param earthquake - 地震資訊
     * @param sourceModule - 來源模組 ID
     * @param metadata - 元資料
     */
    saveEarthquake(earthquake: EarthquakeInfo, sourceModule: string, metadata?: Record<string, any>): Promise<string>;

    /**
     * 關聯專案與氣候資料
     *
     * @param projectId - 專案 ID
     * @param locationName - 地點名稱
     * @param forecasts - 預報陣列
     * @param observations - 觀測陣列
     * @param metadata - 元資料
     */
    linkToProject(
      projectId: string,
      locationName: string,
      forecasts: WeatherForecast[],
      observations: WeatherObservation[],
      metadata?: any
    ): Promise<void>;

    /**
     * 取得專案氣候資料
     *
     * @param projectId - 專案 ID
     */
    getProjectClimate(projectId: string): Observable<any>;

    /**
     * 批次儲存預報
     *
     * @param forecasts - 預報陣列
     * @param sourceModule - 來源模組 ID
     * @param metadata - 元資料
     */
    batchSaveForecasts(forecasts: WeatherForecast[], sourceModule: string, metadata?: Record<string, any>): Promise<string[]>;
  };
}

/**
 * 建立氣候模組 API 實例
 *
 * @param weatherService - CWB 天氣服務
 * @param repository - 氣候資料儲存庫
 * @returns 氣候模組公開 API
 *
 * @example
 * ```typescript
 * // 在氣候模組中建立 exports
 * const api = createClimateModuleApi(this.weatherService, this.repository);
 * this.exports = api;
 * ```
 */
export function createClimateModuleApi(weatherService: CwbWeatherService, repository: ClimateRepository): IClimateModuleApi {
  return {
    weather: {
      getCityForecast: (locationName?: string, useCache = true) => weatherService.getCityWeatherForecast(locationName, useCache),

      getTownshipForecast: (countyCode: string, townshipName?: string, useCache = true) =>
        weatherService.getTownshipWeatherForecast(countyCode, townshipName, useCache),

      getStationData: (stationName?: string, useCache = true) => weatherService.getWeatherStationData(stationName, useCache),

      getEarthquakeReport: (limit = 10, useCache = true) => weatherService.getEarthquakeReport(limit, useCache),

      calculateConstructionSuitability: (forecast: WeatherForecast) => weatherService.calculateConstructionSuitability(forecast),

      clearCache: () => weatherService.clearCache(),

      getCacheStats: () => weatherService.getCacheStats()
    },

    storage: {
      saveForecast: (forecast: WeatherForecast, sourceModule: string, metadata?: Record<string, any>) =>
        repository.saveWeatherForecast(forecast, sourceModule, metadata),

      saveObservation: (observation: WeatherObservation, sourceModule: string, metadata?: Record<string, any>) =>
        repository.saveWeatherObservation(observation, sourceModule, metadata),

      saveEarthquake: (earthquake: EarthquakeInfo, sourceModule: string, metadata?: Record<string, any>) =>
        repository.saveEarthquakeInfo(earthquake, sourceModule, metadata),

      linkToProject: (
        projectId: string,
        locationName: string,
        forecasts: WeatherForecast[],
        observations: WeatherObservation[],
        metadata?: any
      ) => repository.linkProjectClimate(projectId, locationName, forecasts, observations, metadata),

      getProjectClimate: (projectId: string) => repository.getProjectClimate(projectId),

      batchSaveForecasts: (forecasts: WeatherForecast[], sourceModule: string, metadata?: Record<string, any>) =>
        repository.batchSaveForecasts(forecasts, sourceModule, metadata)
    }
  };
}

/**
 * 使用範例（供其他模組參考）
 *
 * @example
 * ```typescript
 * // 在任務模組中使用氣候模組 API
 * import { inject } from '@angular/core';
 * import { IExecutionContext } from '@core/blueprint/context/execution-context.interface';
 * import { IClimateModuleApi } from '@core/blueprint/modules/implementations/climate/exports/climate-api.exports';
 *
 * export class TasksModule implements IBlueprintModule {
 *   private context?: IExecutionContext;
 *   private climateApi?: IClimateModuleApi;
 *
 *   async init(context: IExecutionContext): Promise<void> {
 *     this.context = context;
 *
 *     // 取得氣候模組 API
 *     const climateModule = context.resources.getModule('climate');
 *     this.climateApi = climateModule?.exports as IClimateModuleApi;
 *   }
 *
 *   async fetchWeatherForTask(taskId: string, location: string): Promise<void> {
 *     if (!this.climateApi) return;
 *
 *     // 取得天氣預報
 *     this.climateApi.weather.getCityForecast(location).subscribe(forecasts => {
 *       if (forecasts.length > 0) {
 *         const forecast = forecasts[0];
 *
 *         // 計算施工適宜度
 *         const suitability = this.climateApi!.weather.calculateConstructionSuitability(forecast);
 *
 *         // 儲存到 Firestore（由任務模組負責）
 *         this.climateApi!.storage.saveForecast(
 *           forecast,
 *           'tasks-module',
 *           { taskId, suitability: suitability.score }
 *         );
 *       }
 *     });
 *   }
 * }
 * ```
 */
