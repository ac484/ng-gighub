/**
 * Weather Forecast Models
 * 天氣預報模型
 *
 * @packageDocumentation
 * @module ClimateModels
 */

/**
 * 簡化的天氣預報資料
 */
export interface WeatherForecast {
  /** 地點名稱 */
  locationName: string;

  /** 開始時間 (ISO 8601) */
  startTime: string;

  /** 結束時間 (ISO 8601) */
  endTime: string;

  /** 天氣描述 */
  weatherDescription: string;

  /** 天氣現象代碼 */
  weatherCode?: string;

  /** 溫度資訊 */
  temperature: {
    min: number;
    max: number;
    unit: string;
  };

  /** 體感溫度 (可選) */
  apparentTemperature?: {
    min: number;
    max: number;
    unit: string;
  };

  /** 降雨機率 (%) */
  rainProbability: number;

  /** 相對濕度 (%) */
  humidity?: number;

  /** 風向 */
  windDirection?: string;

  /** 風速 (m/s) */
  windSpeed?: number;

  /** 舒適度指數 */
  comfortIndex?: string;
}

/**
 * 氣象站觀測資料
 */
export interface WeatherObservation {
  /** 測站 ID */
  stationId: string;

  /** 測站名稱 */
  stationName: string;

  /** 觀測時間 (ISO 8601) */
  observationTime: string;

  /** 當前溫度 (°C) */
  temperature?: number;

  /** 相對濕度 (%) */
  humidity?: number;

  /** 氣壓 (hPa) */
  pressure?: number;

  /** 風向 */
  windDirection?: string;

  /** 風速 (m/s) */
  windSpeed?: number;

  /** 最大陣風風速 (m/s) */
  gustSpeed?: number;

  /** 降雨量 (mm) */
  rainfall?: number;

  /** 日照時數 (hr) */
  sunshine?: number;

  /** 能見度 (km) */
  visibility?: number;
}

/**
 * 地震資訊
 */
export interface EarthquakeInfo {
  /** 地震編號 */
  earthquakeNo: string;

  /** 發震時間 (ISO 8601) */
  originTime: string;

  /** 震央位置描述 */
  epicenterLocation: string;

  /** 震央經度 */
  epicenterLon: number;

  /** 震央緯度 */
  epicenterLat: number;

  /** 芮氏規模 */
  magnitude: number;

  /** 地震深度 (km) */
  depth: number;

  /** 報告類型 */
  reportType: string;

  /** 報告內容 */
  reportContent: string;

  /** 報告圖片 URI */
  reportImageUri?: string;
}

/**
 * 施工適宜度評估
 */
export interface ConstructionSuitability {
  /** 評估分數 (0-100) */
  score: number;

  /** 適宜度等級 */
  level: 'excellent' | 'good' | 'fair' | 'poor' | 'dangerous';

  /** 評估因素 */
  factors: {
    rainfall: {
      value: number;
      impact: number;
      description: string;
    };
    temperature: {
      value: number;
      impact: number;
      description: string;
    };
    wind: {
      value: number;
      impact: number;
      description: string;
    };
    weather: {
      value: string;
      impact: number;
      description: string;
    };
  };

  /** 建議 */
  recommendations: string[];

  /** 警告 */
  warnings: string[];
}

/**
 * 天氣警報
 */
export interface WeatherAlert {
  /** 警報 ID */
  alertId: string;

  /** 警報類型 */
  type: 'typhoon' | 'heavy_rain' | 'earthquake' | 'other';

  /** 警報等級 */
  severity: 'advisory' | 'watch' | 'warning' | 'emergency';

  /** 標題 */
  title: string;

  /** 內容 */
  content: string;

  /** 發布時間 */
  issuedTime: string;

  /** 生效時間 */
  effectiveTime: string;

  /** 結束時間 */
  expiresTime: string;

  /** 影響區域 */
  affectedAreas: string[];
}
