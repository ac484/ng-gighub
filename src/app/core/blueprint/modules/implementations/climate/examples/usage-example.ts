/**
 * Climate Module Usage Examples
 * 氣候模組使用範例
 *
 * 此檔案展示如何在其他模組中使用氣候模組的 API
 *
 * @packageDocumentation
 * @module ClimateExamples
 */

import { Injectable, signal } from '@angular/core';

import type { IExecutionContext } from '../../../../context/execution-context.interface';
import { ModuleStatus } from '../../../module-status.enum';
import { IBlueprintModule } from '../../../module.interface';
import type { IClimateModuleApi } from '../exports/climate-api.exports';

/**
 * 範例 1: 任務模組使用氣候模組
 *
 * 展示如何在任務模組中查詢天氣並儲存資料
 */
@Injectable()
export class TasksModuleExample implements IBlueprintModule {
  readonly id = 'tasks-example';
  readonly name = '任務模組範例';
  readonly version = '1.0.0';
  readonly dependencies: string[] = ['climate', 'logger'];
  readonly status = signal<ModuleStatus>(ModuleStatus.UNINITIALIZED);

  private context?: IExecutionContext;
  private climateApi?: IClimateModuleApi;

  async init(context: IExecutionContext): Promise<void> {
    this.status.set(ModuleStatus.INITIALIZING);
    this.context = context;

    // 取得氣候模組 API
    const climateModule = await this.getClimateModule();
    if (climateModule) {
      this.climateApi = climateModule.exports as IClimateModuleApi;
      console.log('[TasksModuleExample] Climate API obtained');
    }

    this.status.set(ModuleStatus.READY);
  }

  async start(): Promise<void> {
    this.status.set(ModuleStatus.RUNNING);
    console.log('[TasksModuleExample] Started');
  }

  async ready(): Promise<void> {
    console.log('[TasksModuleExample] Ready');
  }

  async stop(): Promise<void> {
    this.status.set(ModuleStatus.STOPPED);
  }

  async dispose(): Promise<void> {
    this.climateApi = undefined;
    this.context = undefined;
    this.status.set(ModuleStatus.UNINITIALIZED);
  }

  /**
   * 範例: 為任務取得天氣預報
   */
  async fetchWeatherForTask(taskId: string, location: string): Promise<void> {
    if (!this.climateApi) {
      console.error('[TasksModuleExample] Climate API not available');
      return;
    }

    console.log(`[TasksModuleExample] Fetching weather for task ${taskId} at ${location}`);

    // 1. 取得天氣預報
    this.climateApi.weather.getCityForecast(location).subscribe({
      next: forecasts => {
        if (forecasts.length > 0) {
          const forecast = forecasts[0];
          console.log('[TasksModuleExample] Weather forecast:', {
            location: forecast.locationName,
            weather: forecast.weatherDescription,
            temperature: `${forecast.temperature.min}°C ~ ${forecast.temperature.max}°C`,
            rain: `${forecast.rainProbability}%`
          });

          // 2. 計算施工適宜度
          const suitability = this.climateApi!.weather.calculateConstructionSuitability(forecast);
          console.log('[TasksModuleExample] Construction suitability:', {
            score: suitability.score,
            level: suitability.level,
            warnings: suitability.warnings,
            recommendations: suitability.recommendations
          });

          // 3. 儲存到 Firestore（由任務模組負責）
          this.climateApi!.storage.saveForecast(forecast, 'tasks-example', {
            taskId,
            suitabilityScore: suitability.score,
            suitabilityLevel: suitability.level,
            timestamp: new Date().toISOString()
          })
            .then(docId => {
              console.log('[TasksModuleExample] Weather forecast saved:', docId);
            })
            .catch(err => {
              console.error('[TasksModuleExample] Failed to save forecast:', err);
            });

          // 4. 如果天氣不適合，發送警告事件
          if (suitability.level === 'dangerous' || suitability.level === 'poor') {
            this.context?.eventBus.emit(
              'TASK_WEATHER_WARNING',
              {
                taskId,
                location,
                suitability,
                warnings: suitability.warnings
              },
              this.id
            );
          }
        }
      },
      error: err => {
        console.error('[TasksModuleExample] Failed to fetch weather:', err);
      }
    });
  }

  /**
   * 輔助方法: 取得氣候模組
   */
  private async getClimateModule(): Promise<IBlueprintModule | undefined> {
    // 注意：這裡需要透過 ResourceProvider 取得模組
    // 實際實作需要根據專案的 ResourceProvider 介面調整
    if (!this.context) return undefined;

    // 假設 ResourceProvider 有 getModule 方法
    // return this.context.resources.getModule('climate');

    // 暫時返回 undefined，實際使用時需要實作
    return undefined;
  }
}

/**
 * 範例 2: 儀表板模組使用氣候模組
 *
 * 展示如何在儀表板中顯示天氣資訊
 */
export class DashboardWeatherWidget {
  constructor(private climateApi: IClimateModuleApi) {}

  /**
   * 取得多個城市的天氣預報
   */
  async getMultiCityForecast(cities: string[]): Promise<any[]> {
    const forecasts = await Promise.all(
      cities.map(
        city =>
          new Promise((resolve, reject) => {
            this.climateApi.weather.getCityForecast(city).subscribe({
              next: data => resolve({ city, forecasts: data }),
              error: err => reject(err)
            });
          })
      )
    );

    return forecasts;
  }

  /**
   * 取得施工建議
   */
  getConstructionAdvice(location: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.climateApi.weather.getCityForecast(location).subscribe({
        next: forecasts => {
          if (forecasts.length > 0) {
            const suitability = this.climateApi.weather.calculateConstructionSuitability(forecasts[0]);
            resolve({
              location,
              forecast: forecasts[0],
              suitability
            });
          } else {
            reject(new Error('No forecast data available'));
          }
        },
        error: err => reject(err)
      });
    });
  }
}
