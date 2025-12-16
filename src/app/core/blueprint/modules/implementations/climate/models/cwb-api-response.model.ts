/**
 * CWB API Response Models
 * 中央氣象署開放資料平台 API 回應模型
 *
 * @packageDocumentation
 * @module ClimateModels
 */

/**
 * CWB API 標準回應結構
 */
export interface CwbApiResponse<T = CwbRecords> {
  success: string;
  result: {
    resource_id: string;
    fields: Array<{ id: string; type: string }>;
  };
  records: T;
}

/**
 * CWB 記錄結構
 */
export interface CwbRecords {
  datasetDescription: string;
  location: CwbLocation[];
}

/**
 * CWB 地點資料
 */
export interface CwbLocation {
  locationName: string;
  geocode?: string;
  lat?: string;
  lon?: string;
  weatherElement: CwbWeatherElement[];
}

/**
 * CWB 氣象要素
 */
export interface CwbWeatherElement {
  elementName: string;
  description?: string;
  time: CwbTimeData[];
}

/**
 * CWB 時間資料
 */
export interface CwbTimeData {
  startTime: string;
  endTime: string;
  parameter: CwbParameter;
  elementValue?: CwbElementValue[];
}

/**
 * CWB 參數
 */
export interface CwbParameter {
  parameterName: string;
  parameterValue?: string;
  parameterUnit?: string;
}

/**
 * CWB 元素值（用於觀測資料）
 */
export interface CwbElementValue {
  value: string;
  measures: string;
}

/**
 * CWB 氣象站觀測資料
 */
export interface CwbStationObservation {
  stationId: string;
  stationName: string;
  stationNameEn?: string;
  stationAltitude?: string;
  county?: string;
  city?: string;
  lat?: string;
  lon?: string;
  obsTime: {
    DateTime: string;
  };
  weatherElement: Array<{
    elementName: string;
    elementValue: string | number;
    elementUnit?: string;
  }>;
}

/**
 * CWB 地震報告
 */
export interface CwbEarthquakeReport {
  earthquakeNo: string;
  reportType: string;
  reportColor: string;
  reportContent: string;
  reportImageURI: string;
  reportRemark: string;
  web: string;
  originTime: string;
  earthquakeInfo: {
    epiCenter: {
      location: string;
      lat: number;
      lon: number;
    };
    magnitude: {
      magnitudeValue: number;
      magnitudeType: string;
    };
    depth: {
      value: number;
      unit: string;
    };
  };
}

/**
 * CWB 錯誤回應
 */
export interface CwbErrorResponse {
  success: string;
  error: {
    code: string;
    message: string;
  };
}

/**
 * 氣象要素代碼列舉
 */
export enum WeatherElementCode {
  // 天氣現象
  Wx = 'Wx',
  WeatherDescription = 'WeatherDescription',

  // 降雨
  PoP = 'PoP',
  PoP6h = 'PoP6h',
  PoP12h = 'PoP12h',
  Rain = 'Rain',

  // 溫度
  T = 'T',
  MinT = 'MinT',
  MaxT = 'MaxT',
  MinAT = 'MinAT',
  MaxAT = 'MaxAT',
  Td = 'Td',

  // 濕度與氣壓
  RH = 'RH',
  MinRH = 'MinRH',
  MaxRH = 'MaxRH',
  PRES = 'PRES',

  // 風力
  WD = 'WD',
  WS = 'WS',
  WSGust = 'WSGust',

  // 其他
  CI = 'CI',
  UVI = 'UVI',
  Visb = 'Visb'
}

/**
 * 縣市代碼對照
 */
export const COUNTY_CODES = {
  臺北市: '063',
  新北市: '071',
  桃園市: '007',
  臺中市: '075',
  臺南市: '079',
  高雄市: '067',
  基隆市: '011',
  新竹市: '019',
  新竹縣: '015',
  苗栗縣: '023',
  彰化縣: '027',
  南投縣: '031',
  雲林縣: '035',
  嘉義市: '043',
  嘉義縣: '039',
  屏東縣: '047',
  宜蘭縣: '003',
  花蓮縣: '051',
  臺東縣: '055',
  澎湖縣: '059',
  金門縣: '083',
  連江縣: '087'
} as const;

/**
 * 資料集 ID 列舉
 */
export enum DatasetId {
  // 天氣預報
  CITY_FORECAST = 'F-C0032-001',
  TOWNSHIP_FORECAST_PREFIX = 'F-D0047-',

  // 觀測資料
  AUTO_STATION = 'O-A0003-001',
  BUREAU_STATION = 'O-A0001-001',

  // 特殊天氣
  EARTHQUAKE = 'E-A0016-001',
  TYPHOON_WARNING = 'W-C0033-001',
  HEAVY_RAIN = 'W-C0033-002',

  // 生活氣象
  UV_INDEX = 'O-A0005-001'
}
