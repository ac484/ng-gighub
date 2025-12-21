/**
 * Weather Provider Interface
 * 
 * 業務邏輯劃分：天氣資料提供者抽象介面
 * 
 * Design Principles:
 * - High Cohesion: 專注於天氣資料獲取的業務邏輯
 * - Low Coupling: 透過介面與實作解耦
 * - Extensibility: 可輕易切換不同的天氣資料來源
 * 
 * @packageDocumentation
 */

/**
 * 天氣預報資料
 */
export interface WeatherForecast {
  locationName: string;
  temperature: string;
  weather: string;
  rainProbability: string;
  updateTime: Date;
}

/**
 * 天氣觀測資料
 */
export interface WeatherObservation {
  stationName: string;
  temperature: number;
  humidity: number;
  weather: string;
  observationTime: Date;
}

/**
 * 天氣警報資料
 */
export interface WeatherAlert {
  type: string;
  title: string;
  description: string;
  effectiveTime: Date;
  severity: 'high' | 'medium' | 'low';
}

/**
 * 天氣資料提供者介面
 * 
 * 模組間溝通介面：定義所有天氣資料提供者必須實作的方法
 * 內部自由：實作者可自由選擇資料來源（CWA API、OpenWeatherMap、Mock等）
 * 外部介面固定：所有實作必須遵守此介面規範
 */
export interface IWeatherProvider {
  /**
   * 獲取天氣預報
   * @param location 地點名稱
   * @returns Promise<WeatherForecast | null>
   */
  getForecast(location: string): Promise<WeatherForecast | null>;

  /**
   * 獲取天氣觀測資料
   * @param stationId 測站ID（選填）
   * @returns Promise<WeatherObservation | null>
   */
  getObservation(stationId?: string): Promise<WeatherObservation | null>;

  /**
   * 獲取天氣警報
   * @param alertType 警報類型（選填）
   * @returns Promise<WeatherAlert[]>
   */
  getAlerts(alertType?: string): Promise<WeatherAlert[]>;
}
