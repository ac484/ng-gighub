/**
 * Climate Module
 * 氣候模組
 *
 * 整合中央氣象署開放資料平台，提供天氣預報、觀測資料及地震資訊。
 * 此模組遵循 Blueprint Container 架構，實作 IBlueprintModule 介面。
 *
 * @packageDocumentation
 * @module Climate
 */

import { Injectable, inject, signal } from '@angular/core';

import { IClimateConfig, DEFAULT_CLIMATE_CONFIG, CLIMATE_CONSTANTS } from './config/climate.config';
import { createClimateModuleApi, IClimateModuleApi } from './exports/climate-api.exports';
import { ClimateRepository } from './repositories/climate.repository';
import { ClimateCacheService } from './services/climate-cache.service';
import { CwbWeatherService } from './services/cwb-weather.service';
import type { IExecutionContext } from '../../../context/execution-context.interface';
import { ModuleStatus } from '../../module-status.enum';
import { IBlueprintModule } from '../../module.interface';

/**
 * 氣候模組
 *
 * 提供完整的氣候資料存取功能，包含：
 * - 天氣預報查詢（縣市/鄉鎮）
 * - 氣象站觀測資料
 * - 地震報告
 * - 施工適宜度評估
 * - Firestore 整合（供其他模組使用）
 *
 * @example
 * ```typescript
 * // 在 Blueprint Container 中載入氣候模組
 * const climateModule = new ClimateModule();
 * await container.loadModule(climateModule);
 *
 * // 其他模組使用氣候模組 API
 * const climateApi = climateModule.exports as IClimateModuleApi;
 * climateApi.weather.getCityForecast('臺北市').subscribe(forecasts => {
 *   console.log('Weather forecast:', forecasts);
 * });
 * ```
 */
@Injectable()
export class ClimateModule implements IBlueprintModule {
  // 模組識別資訊
  readonly id = CLIMATE_CONSTANTS.MODULE_ID;
  readonly name = CLIMATE_CONSTANTS.MODULE_NAME;
  readonly version = CLIMATE_CONSTANTS.MODULE_VERSION;
  readonly description = CLIMATE_CONSTANTS.MODULE_DESCRIPTION;
  readonly dependencies: string[] = [...CLIMATE_CONSTANTS.MODULE_DEPENDENCIES];

  // 模組狀態（使用 Signal）
  readonly status = signal<ModuleStatus>(ModuleStatus.UNINITIALIZED);

  // 服務注入
  private weatherService = inject(CwbWeatherService);
  private cacheService = inject(ClimateCacheService);
  private repository = inject(ClimateRepository);

  // 執行上下文
  private context?: IExecutionContext;

  // 模組配置
  private config: IClimateConfig = DEFAULT_CLIMATE_CONFIG;

  // 公開 API
  exports?: IClimateModuleApi;

  /**
   * 初始化模組
   *
   * 此方法在模組被容器載入時呼叫，負責：
   * - 接收執行上下文
   * - 初始化服務
   * - 訂閱事件
   * - 建立公開 API
   *
   * @param context - 執行上下文
   */
  async init(context: IExecutionContext): Promise<void> {
    try {
      this.status.set(ModuleStatus.INITIALIZING);
      this.context = context;

      console.log('[ClimateModule] Initializing...');

      // 從環境變數或配置服務載入 API 金鑰
      await this.loadConfiguration();

      // 初始化天氣服務
      this.weatherService.initialize(this.config);

      // 建立公開 API
      this.exports = createClimateModuleApi(this.weatherService, this.repository);

      // 訂閱事件總線（如果需要）
      this.setupEventListeners();

      console.log('[ClimateModule] Initialized successfully');
      this.status.set(ModuleStatus.READY);
    } catch (error) {
      console.error('[ClimateModule] Initialization failed:', error);
      this.status.set(ModuleStatus.ERROR);
      throw error;
    }
  }

  /**
   * 啟動模組
   *
   * 此方法在容器啟動時呼叫，模組開始提供服務。
   */
  async start(): Promise<void> {
    if (this.status() !== ModuleStatus.READY) {
      throw new Error(`[ClimateModule] Cannot start - current status: ${this.status()}`);
    }

    console.log('[ClimateModule] Starting...');
    this.status.set(ModuleStatus.RUNNING);

    // 發送模組啟動事件
    this.context?.eventBus.emit(
      CLIMATE_CONSTANTS.EVENTS.WEATHER_FETCHED,
      {
        moduleId: this.id,
        status: 'started',
        timestamp: new Date().toISOString()
      },
      this.id
    );

    console.log('[ClimateModule] Started successfully');
  }

  /**
   * 模組就緒
   *
   * 此方法在模組完全啟動後呼叫。
   */
  async ready(): Promise<void> {
    console.log('[ClimateModule] Ready to serve');

    // 可選：預熱快取或執行初始化任務
    // await this.warmupCache();
  }

  /**
   * 停止模組
   *
   * 此方法在容器停止時呼叫，模組應停止所有活動。
   */
  async stop(): Promise<void> {
    if (this.status() !== ModuleStatus.RUNNING) {
      console.warn(`[ClimateModule] Already stopped - current status: ${this.status()}`);
      return;
    }

    console.log('[ClimateModule] Stopping...');
    this.status.set(ModuleStatus.STOPPING);

    // 清理定時任務或訂閱
    this.cleanupEventListeners();

    // 清除過期快取
    const cleared = this.cacheService.clearExpired();
    console.log(`[ClimateModule] Cleared ${cleared} expired cache entries`);

    this.status.set(ModuleStatus.STOPPED);
    console.log('[ClimateModule] Stopped successfully');
  }

  /**
   * 銷毀模組
   *
   * 此方法在模組被卸載時呼叫，應釋放所有資源。
   */
  async dispose(): Promise<void> {
    console.log('[ClimateModule] Disposing...');

    // 停止模組（如果還在運行）
    if (this.status() === ModuleStatus.RUNNING) {
      await this.stop();
    }

    // 清除所有快取
    this.cacheService.clear();

    // 取消事件訂閱
    this.cleanupEventListeners();

    // 清空公開 API
    this.exports = undefined;
    this.context = undefined;

    this.status.set(ModuleStatus.UNINITIALIZED);
    console.log('[ClimateModule] Disposed successfully');
  }

  /**
   * 載入模組配置
   *
   * 從環境變數或配置服務載入 API 金鑰和其他設定
   */
  private async loadConfiguration(): Promise<void> {
    // 從環境變數載入 API 金鑰
    // 注意：在實際應用中，應該從安全的配置服務或環境變數載入
    const apiKey = this.getEnvironmentVariable('CWB_API_KEY');

    if (!apiKey) {
      console.warn('[ClimateModule] CWB API key not configured. Module will not function properly.');
      console.warn('[ClimateModule] Please set CWB_API_KEY environment variable.');
    }

    this.config = {
      ...DEFAULT_CLIMATE_CONFIG,
      apiKey: apiKey || ''
    };

    // 從共享上下文載入其他配置（如果有）
    if (this.context?.sharedContext) {
      const customConfig = this.context.sharedContext.getState<Partial<IClimateConfig>>('climate.config');
      if (customConfig) {
        this.config = { ...this.config, ...customConfig };
      }
    }
  }

  /**
   * 取得環境變數
   *
   * @param key - 環境變數鍵
   * @returns 環境變數值或 undefined
   */
  private getEnvironmentVariable(key: string): string | undefined {
    // 在瀏覽器環境中，可以從 window 或其他來源取得
    // 在伺服器端渲染（SSR）時，可以從 process.env 取得
    if (typeof window !== 'undefined' && (window as any)[key]) {
      return (window as any)[key];
    }
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
    return undefined;
  }

  /**
   * 設定事件監聽器
   *
   * 訂閱相關事件以回應其他模組的需求
   */
  private setupEventListeners(): void {
    if (!this.context?.eventBus) return;

    // 範例：監聽快取清除請求
    this.context.eventBus.on(CLIMATE_CONSTANTS.EVENTS.CACHE_CLEARED, () => {
      console.log('[ClimateModule] Received cache clear request');
      this.cacheService.clear();
    });

    // 範例：監聽地震警報請求
    this.context.eventBus.on(CLIMATE_CONSTANTS.EVENTS.EARTHQUAKE_ALERT, (data: any) => {
      console.log('[ClimateModule] Earthquake alert:', data);
      // 可以觸發通知或其他處理
    });
  }

  /**
   * 清理事件監聽器
   */
  private cleanupEventListeners(): void {
    if (!this.context?.eventBus) return;

    // 取消所有事件訂閱
    // 注意：EventBus 應該提供取消訂閱的方法
    console.log('[ClimateModule] Cleaning up event listeners');
  }

  /**
   * 預熱快取（可選）
   *
   * 在模組啟動時預先載入常用資料
   */
  private async warmupCache(): Promise<void> {
    console.log('[ClimateModule] Warming up cache...');

    try {
      // 預載入台北市天氣預報
      await new Promise<void>((resolve, reject) => {
        this.weatherService.getCityWeatherForecast('臺北市').subscribe({
          next: () => resolve(),
          error: err => reject(err)
        });
      });
      console.log('[ClimateModule] Cache warmed up successfully');
    } catch (error) {
      console.warn('[ClimateModule] Cache warmup failed:', error);
      // 預熱失敗不應影響模組啟動
    }
  }

  /**
   * 取得模組統計資訊
   *
   * @returns 模組統計資訊
   */
  getStats(): any {
    return {
      moduleId: this.id,
      status: this.status(),
      cache: this.cacheService.stats(),
      weatherService: {
        isInitialized: this.weatherService.isInitialized(),
        loading: this.weatherService.loading(),
        error: this.weatherService.error()
      }
    };
  }
}
