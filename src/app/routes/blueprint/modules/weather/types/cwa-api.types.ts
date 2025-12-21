/**
 * CWA API Response Models
 * 中央氣象署 API 回應模型
 *
 * Based on CWA OpenData API specification
 * https://opendata.cwa.gov.tw/dist/opendata-swagger.html
 */

/**
 * Standard CWA API response wrapper
 */
export interface CwaApiResponse<T> {
  success: string;
  result: T;
  records: T;
}

/**
 * Weather element time data
 */
export interface WeatherElementTime {
  startTime: string;
  endTime: string;
  parameter: {
    parameterName: string;
    parameterValue?: string;
    parameterUnit?: string;
  };
  elementValue?: string | number;
}

/**
 * Weather element
 */
export interface WeatherElement {
  elementName: string;
  time?: WeatherElementTime[];
  elementValue?: string | number;
}

/**
 * Location data in CWA response
 */
export interface CwaLocation {
  locationName: string;
  stationId?: string;
  geocode?: string;
  lat?: string | number;
  lon?: string | number;
  weatherElement: WeatherElement[];
}

/**
 * CWA forecast response structure
 */
export interface CwaForecastResponse {
  datasetDescription: string;
  location: CwaLocation[];
}

/**
 * CWA observation response structure
 */
export interface CwaObservationResponse {
  obsTime: string;
  location: CwaLocation[];
}

/**
 * Forecast request parameters
 */
export interface ForecastParams {
  locationName?: string;
  elementName?: string;
  sort?: string;
}

/**
 * Observation request parameters
 */
export interface ObservationParams {
  stationId?: string;
  stationName?: string;
  elementName?: string;
}

/**
 * CWA API endpoints
 */
export const CWA_API_ENDPOINTS = {
  // Forecast endpoints
  FORECAST_36H: 'F-C0032-001', // 36-hour county forecast
  FORECAST_7D: 'F-C0032-005', // 7-day county forecast
  FORECAST_TOWNSHIP: 'F-D0047', // Township forecast (requires county code)

  // Observation endpoints
  OBS_METEOROLOGICAL: 'O-A0001-001', // Meteorological station observation
  OBS_AUTO_10MIN: 'O-A0003-001', // 10-minute automatic observation
  OBS_RAINFALL: 'O-A0002-001', // Rainfall observation
  OBS_UV_INDEX: 'O-A0005-001', // UV index

  // Alert endpoints
  ALERT_GENERAL: 'W-C0033-001', // General weather warnings
  ALERT_TYPHOON: 'W-C0034-001', // Typhoon warnings

  // Earthquake
  EARTHQUAKE: 'E-A0015-001' // Earthquake report
} as const;

/**
 * Weather element codes
 */
export const WEATHER_ELEMENTS = {
  // Forecast elements
  Wx: 'Wx', // Weather phenomenon
  T: 'T', // Temperature
  MinT: 'MinT', // Minimum temperature
  MaxT: 'MaxT', // Maximum temperature
  RH: 'RH', // Relative humidity
  PoP: 'PoP', // Probability of precipitation
  PoP6h: 'PoP6h', // 6-hour probability of precipitation
  PoP12h: 'PoP12h', // 12-hour probability of precipitation
  WS: 'WS', // Wind speed
  WD: 'WD', // Wind direction

  // Observation elements
  TEMP: 'TEMP', // Temperature
  HUMD: 'HUMD', // Humidity
  PRES: 'PRES', // Pressure
  WDSD: 'WDSD', // Wind speed
  WDIR: 'WDIR', // Wind direction
  H_24R: 'H_24R', // 24-hour rainfall
  Weather: 'Weather' // Weather description
} as const;

/**
 * Taiwan county codes for township forecast
 */
export const COUNTY_CODES = {
  臺北市: '63',
  新北市: '65',
  桃園市: '68',
  臺中市: '66',
  臺南市: '67',
  高雄市: '64',
  基隆市: '10017',
  新竹市: '10018',
  嘉義市: '10020',
  宜蘭縣: '10002',
  新竹縣: '10004',
  苗栗縣: '10005',
  彰化縣: '10007',
  南投縣: '10008',
  雲林縣: '10009',
  嘉義縣: '10010',
  屏東縣: '10013',
  臺東縣: '10014',
  花蓮縣: '10015',
  澎湖縣: '10016',
  金門縣: '09020',
  連江縣: '09007'
} as const;
