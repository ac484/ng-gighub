/**
 * CWA API Endpoint Definitions
 *
 * Complete list of API endpoints for Central Weather Administration Open Data Platform.
 * API Documentation: https://opendata.cwa.gov.tw/dist/opendata-swagger.html
 *
 * @author GigHub Development Team
 * @date 2025-12-20
 */

import { ApiEndpoint } from '../types';

/**
 * CWA API base URL
 */
export const CWA_API_BASE_URL = 'https://opendata.cwa.gov.tw/api';

/**
 * API version
 */
export const API_VERSION = 'v1';

/**
 * Default cache TTL (in seconds)
 */
export const DEFAULT_CACHE_TTL = {
  FORECAST: 3600, // 1 hour for forecast data
  OBSERVATION: 600, // 10 minutes for observation data
  ALERT: 300, // 5 minutes for alert data
  CLIMATE: 86400, // 24 hours for climate data
  IMAGE: 600 // 10 minutes for radar/satellite images
};

// ===== Weather Forecast Endpoints =====

/**
 * 36-hour weather forecast by county
 * 一般天氣預報-今明36小時天氣預報
 */
export const FORECAST_36_HOUR: ApiEndpoint = {
  path: '/rest/datastore/F-C0032-001',
  method: 'GET',
  description: '36小時天氣預報(縣市)',
  datasetCode: 'F-C0032-001',
  cacheTTL: DEFAULT_CACHE_TTL.FORECAST
};

/**
 * 7-day weather forecast
 * 一般天氣預報-未來一週天氣預報
 */
export const FORECAST_7_DAY: ApiEndpoint = {
  path: '/rest/datastore/F-D0047-089',
  method: 'GET',
  description: '未來一週天氣預報',
  datasetCode: 'F-D0047-089',
  cacheTTL: DEFAULT_CACHE_TTL.FORECAST
};

/**
 * Township weather forecast (multiple dataset codes for different counties)
 * 鄉鎮天氣預報
 */
export const TOWNSHIP_FORECAST_CODES: Record<string, string> = {
  '63': 'F-D0047-061', // 臺北市
  '65': 'F-D0047-069', // 新北市
  '68': 'F-D0047-005', // 桃園市
  '66': 'F-D0047-073', // 臺中市
  '67': 'F-D0047-077', // 臺南市
  '64': 'F-D0047-065', // 高雄市
  '10002': 'F-D0047-001', // 宜蘭縣
  '10004': 'F-D0047-009', // 新竹縣
  '10005': 'F-D0047-013', // 苗栗縣
  '10007': 'F-D0047-017', // 彰化縣
  '10008': 'F-D0047-021', // 南投縣
  '10009': 'F-D0047-025', // 雲林縣
  '10010': 'F-D0047-029', // 嘉義縣
  '10013': 'F-D0047-033', // 屏東縣
  '10014': 'F-D0047-037', // 臺東縣
  '10015': 'F-D0047-041', // 花蓮縣
  '10016': 'F-D0047-045', // 澎湖縣
  '10017': 'F-D0047-049', // 基隆市
  '10018': 'F-D0047-053', // 新竹市
  '10020': 'F-D0047-057', // 嘉義市
  '09007': 'F-D0047-081', // 連江縣
  '09020': 'F-D0047-085' // 金門縣
};

/**
 * Get township forecast endpoint for specific county
 */
export function getTownshipForecastEndpoint(countyCode: string): ApiEndpoint | null {
  const datasetCode = TOWNSHIP_FORECAST_CODES[countyCode];
  if (!datasetCode) return null;
  
  return {
    path: `/rest/datastore/${datasetCode}`,
    method: 'GET',
    description: `鄉鎮天氣預報(${countyCode})`,
    datasetCode,
    cacheTTL: DEFAULT_CACHE_TTL.FORECAST
  };
}

/**
 * Comfort index forecast
 * 舒適度預報
 */
export const COMFORT_INDEX_FORECAST: ApiEndpoint = {
  path: '/rest/datastore/F-A0010-001',
  method: 'GET',
  description: '舒適度預報',
  datasetCode: 'F-A0010-001',
  cacheTTL: DEFAULT_CACHE_TTL.FORECAST
};

/**
 * UV index forecast
 * 紫外線指數預報
 */
export const UV_INDEX_FORECAST: ApiEndpoint = {
  path: '/rest/datastore/F-A0012-001',
  method: 'GET',
  description: '紫外線指數預報',
  datasetCode: 'F-A0012-001',
  cacheTTL: DEFAULT_CACHE_TTL.FORECAST
};

// ===== Weather Observation Endpoints =====

/**
 * Meteorological station observation (hourly)
 * 局屬氣象站-現在天氣觀測報告
 */
export const METEOROLOGICAL_OBSERVATION: ApiEndpoint = {
  path: '/rest/datastore/O-A0001-001',
  method: 'GET',
  description: '局屬氣象站氣象觀測資料',
  datasetCode: 'O-A0001-001',
  cacheTTL: DEFAULT_CACHE_TTL.OBSERVATION
};

/**
 * Automatic weather station observation (10-minute)
 * 自動氣象站-現在天氣觀測報告
 */
export const AUTO_WEATHER_OBSERVATION_10MIN: ApiEndpoint = {
  path: '/rest/datastore/O-A0003-001',
  method: 'GET',
  description: '自動氣象站氣象觀測資料(10分鐘)',
  datasetCode: 'O-A0003-001',
  cacheTTL: DEFAULT_CACHE_TTL.OBSERVATION
};

/**
 * Rainfall observation
 * 局屬氣象站-雨量觀測資料
 */
export const RAINFALL_OBSERVATION: ApiEndpoint = {
  path: '/rest/datastore/O-A0002-001',
  method: 'GET',
  description: '雨量觀測資料',
  datasetCode: 'O-A0002-001',
  cacheTTL: DEFAULT_CACHE_TTL.OBSERVATION
};

/**
 * UV index observation
 * 紫外線指數觀測資料
 */
export const UV_INDEX_OBSERVATION: ApiEndpoint = {
  path: '/rest/datastore/O-A0005-001',
  method: 'GET',
  description: '紫外線指數觀測資料',
  datasetCode: 'O-A0005-001',
  cacheTTL: DEFAULT_CACHE_TTL.OBSERVATION
};

/**
 * Temperature distribution observation
 * 溫度分布圖
 */
export const TEMPERATURE_DISTRIBUTION: ApiEndpoint = {
  path: '/rest/datastore/O-A0038-001',
  method: 'GET',
  description: '溫度分布圖',
  datasetCode: 'O-A0038-001',
  cacheTTL: DEFAULT_CACHE_TTL.IMAGE
};

// ===== Weather Alert Endpoints =====

/**
 * General weather warnings
 * 一般天氣特報
 */
export const WEATHER_WARNINGS: ApiEndpoint = {
  path: '/rest/datastore/W-C0033-001',
  method: 'GET',
  description: '一般天氣特報',
  datasetCode: 'W-C0033-001',
  cacheTTL: DEFAULT_CACHE_TTL.ALERT
};

/**
 * Heavy rain warnings
 * 豪雨特報
 */
export const HEAVY_RAIN_WARNINGS: ApiEndpoint = {
  path: '/rest/datastore/W-C0034-001',
  method: 'GET',
  description: '豪雨特報',
  datasetCode: 'W-C0034-001',
  cacheTTL: DEFAULT_CACHE_TTL.ALERT
};

/**
 * Typhoon warnings
 * 颱風警報
 */
export const TYPHOON_WARNINGS: ApiEndpoint = {
  path: '/rest/datastore/W-C0035-001',
  method: 'GET',
  description: '颱風警報',
  datasetCode: 'W-C0035-001',
  cacheTTL: DEFAULT_CACHE_TTL.ALERT
};

/**
 * Strong wind warnings
 * 強風特報
 */
export const STRONG_WIND_WARNINGS: ApiEndpoint = {
  path: '/rest/datastore/W-C0038-001',
  method: 'GET',
  description: '強風特報',
  datasetCode: 'W-C0038-001',
  cacheTTL: DEFAULT_CACHE_TTL.ALERT
};

/**
 * Cold surge warnings
 * 低溫特報
 */
export const COLD_SURGE_WARNINGS: ApiEndpoint = {
  path: '/rest/datastore/W-C0039-001',
  method: 'GET',
  description: '低溫特報',
  datasetCode: 'W-C0039-001',
  cacheTTL: DEFAULT_CACHE_TTL.ALERT
};

// ===== Radar & Satellite Image Endpoints =====

/**
 * Radar echo image
 * 雷達回波圖
 */
export const RADAR_ECHO: ApiEndpoint = {
  path: '/rest/datastore/O-A0058-001',
  method: 'GET',
  description: '雷達回波圖',
  datasetCode: 'O-A0058-001',
  cacheTTL: DEFAULT_CACHE_TTL.IMAGE
};

/**
 * Satellite visible image
 * 衛星雲圖(可見光)
 */
export const SATELLITE_VISIBLE: ApiEndpoint = {
  path: '/rest/datastore/O-B0075-001',
  method: 'GET',
  description: '衛星雲圖(可見光)',
  datasetCode: 'O-B0075-001',
  cacheTTL: DEFAULT_CACHE_TTL.IMAGE
};

/**
 * Satellite infrared image
 * 衛星雲圖(紅外線)
 */
export const SATELLITE_INFRARED: ApiEndpoint = {
  path: '/rest/datastore/O-B0076-001',
  method: 'GET',
  description: '衛星雲圖(紅外線)',
  datasetCode: 'O-B0076-001',
  cacheTTL: DEFAULT_CACHE_TTL.IMAGE
};

// ===== Marine & Tide Endpoints =====

/**
 * Marine forecast
 * 海象預報
 */
export const MARINE_FORECAST: ApiEndpoint = {
  path: '/rest/datastore/F-A0012-001',
  method: 'GET',
  description: '海象預報',
  datasetCode: 'F-A0012-001',
  cacheTTL: DEFAULT_CACHE_TTL.FORECAST
};

/**
 * Tide information
 * 潮汐預報
 */
export const TIDE_FORECAST: ApiEndpoint = {
  path: '/rest/datastore/F-A0021-001',
  method: 'GET',
  description: '潮汐預報',
  datasetCode: 'F-A0021-001',
  cacheTTL: DEFAULT_CACHE_TTL.FORECAST
};

// ===== Earthquake & Tsunami Endpoints =====

/**
 * Earthquake report (significant)
 * 顯著有感地震報告
 */
export const EARTHQUAKE_SIGNIFICANT: ApiEndpoint = {
  path: '/rest/datastore/E-A0015-001',
  method: 'GET',
  description: '顯著有感地震報告',
  datasetCode: 'E-A0015-001',
  cacheTTL: DEFAULT_CACHE_TTL.ALERT
};

/**
 * Earthquake report (small)
 * 小區域有感地震報告
 */
export const EARTHQUAKE_SMALL: ApiEndpoint = {
  path: '/rest/datastore/E-A0016-001',
  method: 'GET',
  description: '小區域有感地震報告',
  datasetCode: 'E-A0016-001',
  cacheTTL: DEFAULT_CACHE_TTL.ALERT
};

/**
 * Tsunami warning
 * 海嘯警報
 */
export const TSUNAMI_WARNING: ApiEndpoint = {
  path: '/rest/datastore/W-C0040-001',
  method: 'GET',
  description: '海嘯警報',
  datasetCode: 'W-C0040-001',
  cacheTTL: DEFAULT_CACHE_TTL.ALERT
};

// ===== Climate Data Endpoints =====

/**
 * Monthly climate statistics
 * 月氣候資料
 */
export const CLIMATE_MONTHLY: ApiEndpoint = {
  path: '/rest/datastore/C-B0027-001',
  method: 'GET',
  description: '月氣候資料',
  datasetCode: 'C-B0027-001',
  cacheTTL: DEFAULT_CACHE_TTL.CLIMATE
};

/**
 * Climate normals (30-year average)
 * 氣候平均值
 */
export const CLIMATE_NORMALS: ApiEndpoint = {
  path: '/rest/datastore/C-B0028-001',
  method: 'GET',
  description: '氣候平均值',
  datasetCode: 'C-B0028-001',
  cacheTTL: DEFAULT_CACHE_TTL.CLIMATE
};

// ===== Endpoint Registry =====

/**
 * All available endpoints organized by category
 */
export const API_ENDPOINTS = {
  forecast: {
    hour36: FORECAST_36_HOUR,
    day7: FORECAST_7_DAY,
    township: TOWNSHIP_FORECAST_CODES,
    comfortIndex: COMFORT_INDEX_FORECAST,
    uvIndex: UV_INDEX_FORECAST
  },
  observation: {
    meteorological: METEOROLOGICAL_OBSERVATION,
    auto10min: AUTO_WEATHER_OBSERVATION_10MIN,
    rainfall: RAINFALL_OBSERVATION,
    uvIndex: UV_INDEX_OBSERVATION,
    temperature: TEMPERATURE_DISTRIBUTION
  },
  alert: {
    general: WEATHER_WARNINGS,
    heavyRain: HEAVY_RAIN_WARNINGS,
    typhoon: TYPHOON_WARNINGS,
    strongWind: STRONG_WIND_WARNINGS,
    coldSurge: COLD_SURGE_WARNINGS
  },
  radar: {
    echo: RADAR_ECHO,
    satelliteVisible: SATELLITE_VISIBLE,
    satelliteInfrared: SATELLITE_INFRARED
  },
  marine: {
    forecast: MARINE_FORECAST,
    tide: TIDE_FORECAST
  },
  earthquake: {
    significant: EARTHQUAKE_SIGNIFICANT,
    small: EARTHQUAKE_SMALL,
    tsunami: TSUNAMI_WARNING
  },
  climate: {
    monthly: CLIMATE_MONTHLY,
    normals: CLIMATE_NORMALS
  }
};

/**
 * Build full API URL
 */
export function buildApiUrl(endpoint: ApiEndpoint, apiKey: string, params?: Record<string, string>): string {
  const url = new URL(`${CWA_API_BASE_URL}${endpoint.path}`);
  
  // Add authorization
  url.searchParams.set('Authorization', apiKey);
  
  // Add additional parameters
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  
  return url.toString();
}

/**
 * Get endpoint by dataset code
 */
export function getEndpointByCode(datasetCode: string): ApiEndpoint | null {
  // Search in all categories
  for (const category of Object.values(API_ENDPOINTS)) {
    for (const endpoint of Object.values(category)) {
      if (typeof endpoint === 'object' && 'datasetCode' in endpoint && endpoint.datasetCode === datasetCode) {
        return endpoint as ApiEndpoint;
      }
    }
  }
  
  // Check township forecasts
  for (const [countyCode, code] of Object.entries(TOWNSHIP_FORECAST_CODES)) {
    if (code === datasetCode) {
      return getTownshipForecastEndpoint(countyCode);
    }
  }
  
  return null;
}
