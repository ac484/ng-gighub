/**
 * Central Weather Administration (CWA) Open Data Platform API Types
 *
 * Complete type definitions for CWA Weather API integration.
 * API Documentation: https://opendata.cwa.gov.tw/dist/opendata-swagger.html
 *
 * @author GigHub Development Team
 * @date 2025-12-20
 */

import { Timestamp } from 'firebase-admin/firestore';

// ===== Common Types =====

/**
 * API response wrapper
 */
export interface CwaApiResponse<T> {
  success: boolean;
  result?: T;
  records?: T;
  error?: CwaApiError;
}

/**
 * API error response
 */
export interface CwaApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Location identifier
 */
export interface LocationIdentifier {
  locationCode: string; // 縣市或鄉鎮代碼
  locationName: string; // 縣市或鄉鎮名稱
}

/**
 * Time range
 */
export interface TimeRange {
  startTime: string; // ISO 8601 format
  endTime: string; // ISO 8601 format
}

/**
 * Data quality indicator
 */
export type DataQuality = 'good' | 'fair' | 'poor' | 'unavailable';

// ===== Weather Forecast Types =====

/**
 * Weather forecast data (36-hour forecast)
 * API: F-C0032-001
 */
export interface WeatherForecast36Hour {
  datasetDescription: string;
  locationsName: string;
  dataid: string;
  location: LocationForecast[];
}

/**
 * Location forecast data
 */
export interface LocationForecast {
  locationName: string;
  geocode: string;
  lat: string;
  lon: string;
  weatherElement: WeatherElement[];
}

/**
 * Weather element (temperature, weather description, etc.)
 */
export interface WeatherElement {
  elementName: string;
  description?: string;
  time: ForecastTime[];
}

/**
 * Forecast time period
 */
export interface ForecastTime {
  startTime: string;
  endTime: string;
  elementValue?: ForecastValue[];
  parameter?: ForecastParameter;
}

/**
 * Forecast value
 */
export interface ForecastValue {
  value: string;
  measures: string;
}

/**
 * Forecast parameter
 */
export interface ForecastParameter {
  parameterName: string;
  parameterValue?: string;
  parameterUnit?: string;
}

/**
 * 7-day weather forecast
 */
export interface WeatherForecast7Day extends WeatherForecast36Hour {
  // Extends 36-hour forecast with additional days
}

/**
 * Township-level weather forecast
 */
export interface TownshipWeatherForecast {
  datasetDescription: string;
  locationName: string; // 縣市名稱
  location: TownshipLocation[];
}

/**
 * Township location data
 */
export interface TownshipLocation {
  locationName: string; // 鄉鎮市區名稱
  geocode: string;
  lat: string;
  lon: string;
  weatherElement: WeatherElement[];
}

/**
 * Comfort index forecast
 */
export interface ComfortIndexForecast {
  locationName: string;
  geocode: string;
  time: Array<{
    startTime: string;
    endTime: string;
    weatherElement: Array<{
      elementName: 'CI'; // Comfort Index
      value: string;
      description: string;
    }>;
  }>;
}

// ===== Weather Observation Types =====

/**
 * Meteorological station observation data
 * API: O-A0001-001
 */
export interface MeteorologicalObservation {
  obsTime: string; // 觀測時間
  locationName: string; // 測站名稱
  stationId: string; // 測站ID
  lat: number;
  lon: number;
  weatherElement: ObservationElement[];
}

/**
 * Observation element
 */
export interface ObservationElement {
  elementName: string;
  elementValue: string | number;
  elementUnit?: string;
}

/**
 * 10-minute observation data
 * API: O-A0003-001
 */
export interface Observation10Minute {
  obsTime: string;
  stationId: string;
  stationName: string;
  lat: number;
  lon: number;
  temperature?: number; // 溫度 (°C)
  humidity?: number; // 相對濕度 (%)
  pressure?: number; // 氣壓 (hPa)
  windSpeed?: number; // 風速 (m/s)
  windDirection?: number; // 風向 (度)
  precipitation?: number; // 降水量 (mm)
  visibility?: number; // 能見度 (m)
}

/**
 * Rainfall observation data
 * API: O-A0002-001
 */
export interface RainfallObservation {
  obsTime: string;
  stationId: string;
  stationName: string;
  lat: number;
  lon: number;
  rainfall: {
    now?: number; // 即時雨量 (mm)
    hour1?: number; // 1小時累積雨量 (mm)
    hour3?: number; // 3小時累積雨量 (mm)
    hour6?: number; // 6小時累積雨量 (mm)
    hour12?: number; // 12小時累積雨量 (mm)
    hour24?: number; // 24小時累積雨量 (mm)
    day?: number; // 本日累積雨量 (mm)
  };
}

/**
 * UV index observation
 * API: O-A0005-001
 */
export interface UvIndexObservation {
  obsTime: string;
  county: string; // 縣市
  uvIndex: number; // 紫外線指數
  uvLevel: 'low' | 'moderate' | 'high' | 'very_high' | 'extreme'; // 紫外線等級
  description: string;
}

// ===== Weather Alert Types =====

/**
 * Weather warning/alert
 */
export interface WeatherAlert {
  alertId: string;
  alertType: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  affectedAreas: string[];
  startTime: string;
  endTime?: string;
  issueTime: string;
  updateTime?: string;
  status: 'active' | 'expired' | 'cancelled';
}

/**
 * Alert type
 */
export type AlertType =
  | 'typhoon' // 颱風警報
  | 'heavy_rain' // 豪雨特報
  | 'thunderstorm' // 雷雨特報
  | 'strong_wind' // 強風特報
  | 'cold_surge' // 低溫特報
  | 'high_temperature' // 高溫資訊
  | 'fog' // 濃霧特報
  | 'air_quality'; // 空氣品質警報

/**
 * Alert severity
 */
export type AlertSeverity = 'advisory' | 'watch' | 'warning' | 'extreme';

// ===== Radar & Satellite Types =====

/**
 * Radar image data
 */
export interface RadarImage {
  imageUrl: string;
  imageType: 'radar_echo' | 'radar_rain' | 'satellite_visible' | 'satellite_infrared';
  timestamp: string;
  coverage: string; // 涵蓋範圍
  resolution: string; // 解析度
}

// ===== Marine & Tide Types =====

/**
 * Marine forecast
 */
export interface MarineForecast {
  areaName: string; // 海域名稱
  forecastTime: TimeRange;
  waveHeight: {
    min: number;
    max: number;
    unit: 'meter';
  };
  windSpeed: {
    min: number;
    max: number;
    unit: 'm/s';
  };
  windDirection: string;
  weatherDescription: string;
}

/**
 * Tide information
 */
export interface TideInfo {
  location: string; // 潮汐站名稱
  date: string;
  tides: Array<{
    type: 'high' | 'low'; // 高潮或低潮
    time: string;
    height: number; // 潮高 (cm)
  }>;
}

// ===== Earthquake & Tsunami Types =====

/**
 * Earthquake information
 */
export interface EarthquakeInfo {
  earthquakeNo: string; // 地震編號
  reportType: string; // 報告類型
  reportColor: string; // 報告顏色
  reportContent: string; // 報告內容
  reportImageURI: string; // 報告圖片
  webURI: string; // 網頁連結
  earthquakeInfo: {
    originTime: string; // 發生時間
    depth: {
      value: number;
      unit: 'km';
    };
    magnitude: {
      magnitudeType: string; // 規模類型
      magnitudeValue: number; // 規模大小
    };
    epicenter: {
      location: string; // 震央位置
      lat: number;
      lon: number;
    };
  };
  intensity: {
    shakingLevel: number; // 最大震度
    stationName: string; // 測站名稱
  };
}

/**
 * Tsunami warning
 */
export interface TsunamiWarning {
  warningId: string;
  issueTime: string;
  status: 'watch' | 'warning' | 'advisory' | 'cancelled';
  affectedCoasts: string[];
  estimatedArrival: string;
  waveHeight: {
    min: number;
    max: number;
    unit: 'meter';
  };
  description: string;
}

// ===== Climate Data Types =====

/**
 * Climate statistics
 */
export interface ClimateStatistics {
  location: string;
  period: {
    startYear: number;
    endYear: number;
  };
  monthly: Array<{
    month: number;
    temperature: {
      avg: number;
      max: number;
      min: number;
    };
    rainfall: {
      avg: number;
      totalDays: number;
    };
    humidity: {
      avg: number;
    };
  }>;
}

// ===== Request/Response Types for Cloud Functions =====

/**
 * Base weather request
 */
export interface WeatherRequest {
  locationCode?: string;
  locationName?: string;
  dataType?: string;
  timeRange?: TimeRange;
}

/**
 * Get 36-hour forecast request
 */
export interface Get36HourForecastRequest extends WeatherRequest {
  countyName: string; // 縣市名稱
  elementName?: string; // 特定氣象要素
}

/**
 * Get observation data request
 */
export interface GetObservationRequest extends WeatherRequest {
  stationId?: string;
  elementName?: string;
}

/**
 * Get weather alert request
 */
export interface GetWeatherAlertRequest {
  alertType?: AlertType;
  county?: string;
  activeOnly?: boolean; // 只取得有效警報
}

/**
 * Weather API response
 */
export interface WeatherApiResponse<T> {
  success: boolean;
  data?: T;
  cached?: boolean;
  cacheTime?: Timestamp;
  error?: {
    code: string;
    message: string;
  };
}

// ===== Cache Types =====

/**
 * Cached weather data
 */
export interface CachedWeatherData<T> {
  data: T;
  cachedAt: Timestamp;
  expiresAt: Timestamp;
  source: 'cwa_api' | 'cache';
}

// ===== Configuration Types =====

/**
 * CWA API configuration
 */
export interface CwaApiConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  cacheEnabled: boolean;
  cacheTTL: {
    forecast: number; // 預報資料快取時間 (秒)
    observation: number; // 觀測資料快取時間 (秒)
    alert: number; // 警報資料快取時間 (秒)
  };
}

/**
 * API endpoint definition
 */
export interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST';
  description: string;
  datasetCode?: string;
  cacheTTL?: number;
}
