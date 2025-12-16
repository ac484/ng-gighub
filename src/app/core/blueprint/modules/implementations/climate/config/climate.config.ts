/**
 * Climate Module Configuration
 * 氣候模組配置
 *
 * @packageDocumentation
 * @module ClimateConfig
 */

/**
 * 氣候模組配置介面
 */
export interface IClimateConfig {
  /** CWB API Base URL */
  apiBaseUrl: string;

  /** API 授權碼 */
  apiKey: string;

  /** 快取配置 */
  cache: {
    /** 預報資料快取時間 (毫秒) */
    forecastTTL: number;

    /** 觀測資料快取時間 (毫秒) */
    observationTTL: number;

    /** 地震資料快取時間 (毫秒) */
    earthquakeTTL: number;

    /** 最大快取項目數 */
    maxItems: number;
  };

  /** 重試配置 */
  retry: {
    /** 最大重試次數 */
    maxAttempts: number;

    /** 初始延遲時間 (毫秒) */
    initialDelay: number;

    /** 最大延遲時間 (毫秒) */
    maxDelay: number;

    /** 退避係數 */
    backoffMultiplier: number;
  };

  /** HTTP 請求配置 */
  http: {
    /** 請求逾時時間 (毫秒) */
    timeout: number;

    /** 是否使用 HTTPS */
    useHttps: boolean;
  };

  /** 預設查詢參數 */
  defaults: {
    /** 預設資料格式 */
    format: 'JSON' | 'XML';

    /** 預設縣市 */
    defaultCounty?: string;

    /** 預設鄉鎮 */
    defaultTownship?: string;
  };
}

/**
 * 預設氣候模組配置
 */
export const DEFAULT_CLIMATE_CONFIG: IClimateConfig = {
  apiBaseUrl: 'https://opendata.cwa.gov.tw/api/v1/rest/datastore',
  apiKey: '', // 必須從環境變數載入

  cache: {
    forecastTTL: 3 * 60 * 60 * 1000, // 3 小時
    observationTTL: 10 * 60 * 1000, // 10 分鐘
    earthquakeTTL: 5 * 60 * 1000, // 5 分鐘
    maxItems: 100
  },

  retry: {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  },

  http: {
    timeout: 30000, // 30 秒
    useHttps: true
  },

  defaults: {
    format: 'JSON',
    defaultCounty: undefined,
    defaultTownship: undefined
  }
};

/**
 * 氣候模組常數
 */
export const CLIMATE_CONSTANTS = {
  /** 模組 ID */
  MODULE_ID: 'climate',

  /** 模組名稱 */
  MODULE_NAME: '氣候模組',

  /** 模組版本 */
  MODULE_VERSION: '1.0.0',

  /** 模組描述 */
  MODULE_DESCRIPTION: '整合中央氣象署開放資料平台，提供天氣預報、觀測資料及地震資訊',

  /** 模組依賴 */
  MODULE_DEPENDENCIES: ['logger', 'context'] as const,

  /** Event Bus 事件類型 */
  EVENTS: {
    WEATHER_FETCHED: 'CLIMATE_WEATHER_FETCHED',
    WEATHER_ERROR: 'CLIMATE_WEATHER_ERROR',
    CACHE_HIT: 'CLIMATE_CACHE_HIT',
    CACHE_MISS: 'CLIMATE_CACHE_MISS',
    CACHE_CLEARED: 'CLIMATE_CACHE_CLEARED',
    EARTHQUAKE_ALERT: 'CLIMATE_EARTHQUAKE_ALERT',
    HEAVY_RAIN_ALERT: 'CLIMATE_HEAVY_RAIN_ALERT'
  } as const,

  /** 速率限制 */
  RATE_LIMITS: {
    requestsPerMinute: 300,
    requestsPerDay: 20000,
    concurrentRequests: 10
  } as const,

  /** HTTP 狀態碼對應 */
  ERROR_CODES: {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
  } as const
} as const;

/**
 * 施工適宜度評估權重
 */
export const CONSTRUCTION_SUITABILITY_WEIGHTS = {
  /** 降雨機率權重 */
  rainfall: {
    high: { threshold: 70, score: -40 },
    medium: { threshold: 50, score: -25 },
    low: { threshold: 30, score: -10 }
  },

  /** 溫度權重 */
  temperature: {
    veryHot: { threshold: 35, score: -20 },
    hot: { threshold: 32, score: -10 },
    cold: { threshold: 10, score: -15 }
  },

  /** 風速權重 */
  windSpeed: {
    strong: { threshold: 10, score: -30 },
    moderate: { threshold: 5, score: -15 }
  }
} as const;
