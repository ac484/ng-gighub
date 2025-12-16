/**
 * CWB API Constants
 * 中央氣象署 API 常數定義
 *
 * @packageDocumentation
 * @module ClimateConfig
 */

import { COUNTY_CODES, DatasetId } from '../models/cwb-api-response.model';

/**
 * API 端點配置
 */
export const CWB_API_ENDPOINTS = {
  baseUrl: 'https://opendata.cwa.gov.tw/api',
  version: 'v1',
  datastore: 'rest/datastore',

  /**
   * 取得完整的資料集 URL
   *
   * @param datasetId - 資料集 ID
   * @returns 完整的資料集 URL
   */
  getDatasetUrl(datasetId: string): string {
    return `${this.baseUrl}/${this.version}/${this.datastore}/${datasetId}`;
  }
} as const;

/**
 * 縣市代碼對照表
 */
export { COUNTY_CODES };

/**
 * 取得縣市代碼
 *
 * @param countyName - 縣市名稱
 * @returns 縣市代碼
 */
export function getCountyCode(countyName: string): string | undefined {
  return COUNTY_CODES[countyName as keyof typeof COUNTY_CODES];
}

/**
 * 取得鄉鎮天氣預報資料集 ID
 *
 * @param countyName - 縣市名稱
 * @returns 資料集 ID
 */
export function getTownshipForecastDatasetId(countyName: string): string | undefined {
  const code = getCountyCode(countyName);
  return code ? `${DatasetId.TOWNSHIP_FORECAST_PREFIX}${code}` : undefined;
}

/**
 * 所有台灣縣市名稱列表
 */
export const ALL_COUNTIES = Object.keys(COUNTY_CODES) as Array<keyof typeof COUNTY_CODES>;

/**
 * 鄉鎮市區名稱對照表（按縣市分類）
 */
export const TOWNSHIPS: Record<string, readonly string[]> = {
  臺北市: ['中正區', '大同區', '中山區', '松山區', '大安區', '萬華區', '信義區', '士林區', '北投區', '內湖區', '南港區', '文山區'],
  新北市: [
    '板橋區',
    '三重區',
    '中和區',
    '永和區',
    '新莊區',
    '新店區',
    '樹林區',
    '鶯歌區',
    '三峽區',
    '淡水區',
    '汐止區',
    '瑞芳區',
    '土城區',
    '蘆洲區',
    '五股區',
    '泰山區',
    '林口區',
    '深坑區',
    '石碇區',
    '坪林區',
    '三芝區',
    '石門區',
    '八里區',
    '平溪區',
    '雙溪區',
    '貢寮區',
    '金山區',
    '萬里區',
    '烏來區'
  ],
  桃園市: [
    '桃園區',
    '中壢區',
    '平鎮區',
    '八德區',
    '楊梅區',
    '蘆竹區',
    '大溪區',
    '龍潭區',
    '龜山區',
    '大園區',
    '觀音區',
    '新屋區',
    '復興區'
  ],
  臺中市: [
    '中區',
    '東區',
    '南區',
    '西區',
    '北區',
    '北屯區',
    '西屯區',
    '南屯區',
    '太平區',
    '大里區',
    '霧峰區',
    '烏日區',
    '豐原區',
    '后里區',
    '石岡區',
    '東勢區',
    '和平區',
    '新社區',
    '潭子區',
    '大雅區',
    '神岡區',
    '大肚區',
    '沙鹿區',
    '龍井區',
    '梧棲區',
    '清水區',
    '大甲區',
    '外埔區',
    '大安區'
  ],
  臺南市: [
    '中西區',
    '東區',
    '南區',
    '北區',
    '安平區',
    '安南區',
    '永康區',
    '歸仁區',
    '新化區',
    '左鎮區',
    '玉井區',
    '楠西區',
    '南化區',
    '仁德區',
    '關廟區',
    '龍崎區',
    '官田區',
    '麻豆區',
    '佳里區',
    '西港區',
    '七股區',
    '將軍區',
    '學甲區',
    '北門區',
    '新營區',
    '後壁區',
    '白河區',
    '東山區',
    '六甲區',
    '下營區',
    '柳營區',
    '鹽水區',
    '善化區',
    '大內區',
    '山上區',
    '新市區',
    '安定區'
  ],
  高雄市: [
    '楠梓區',
    '左營區',
    '鼓山區',
    '三民區',
    '鹽埕區',
    '前金區',
    '新興區',
    '苓雅區',
    '前鎮區',
    '旗津區',
    '小港區',
    '鳳山區',
    '大寮區',
    '鳥松區',
    '林園區',
    '仁武區',
    '大樹區',
    '大社區',
    '岡山區',
    '路竹區',
    '橋頭區',
    '梓官區',
    '彌陀區',
    '永安區',
    '燕巢區',
    '田寮區',
    '阿蓮區',
    '茄萣區',
    '湖內區',
    '旗山區',
    '美濃區',
    '內門區',
    '杉林區',
    '甲仙區',
    '六龜區',
    '茂林區',
    '桃源區',
    '那瑪夏區'
  ]
  // ... 其他縣市可依需求擴充
} as const;

/**
 * 天氣現象代碼對照表
 */
export const WEATHER_CODES: Record<string, string> = {
  '1': '晴',
  '2': '多雲',
  '3': '陰',
  '4': '多雲時晴',
  '5': '多雲時陰',
  '6': '陰時多雲',
  '7': '晴時多雲',
  '8': '陰短暫雨',
  '9': '陰時多雲短暫雨',
  '10': '多雲短暫雨',
  '11': '多雲時晴短暫雨',
  '12': '多雲時陰短暫雨',
  '13': '晴時多雲短暫雨',
  '14': '陰短暫陣雨',
  '15': '陰時多雲短暫陣雨',
  '16': '多雲短暫陣雨',
  '17': '多雲時晴短暫陣雨',
  '18': '多雲時陰短暫陣雨',
  '19': '晴時多雲短暫陣雨',
  '20': '陰陣雨或雷雨',
  '21': '陰時多雲陣雨或雷雨',
  '22': '多雲陣雨或雷雨',
  '23': '多雲時晴陣雨或雷雨',
  '24': '晴時多雲陣雨或雷雨',
  '25': '陰短暫雨或雪',
  '26': '陰時多雲短暫雨或雪',
  '27': '多雲短暫雨或雪',
  '28': '多雲時陰短暫雨或雪',
  '29': '陰有雨',
  '30': '陰時多雲有雨',
  '31': '多雲有雨',
  '32': '多雲時陰有雨',
  '33': '陰有雷陣雨',
  '34': '陰時多雲有雷陣雨',
  '35': '多雲有雷陣雨',
  '36': '多雲時陰有雷陣雨',
  '37': '晴有雷陣雨',
  '38': '陰有大雨',
  '39': '陰有豪雨',
  '41': '陰有大雷雨',
  '42': '晴'
};

/**
 * 取得天氣現象描述
 *
 * @param code - 天氣現象代碼
 * @returns 天氣現象描述
 */
export function getWeatherDescription(code: string): string {
  return WEATHER_CODES[code] || '未知';
}

/**
 * 常用查詢參數預設值
 */
export const DEFAULT_QUERY_PARAMS = {
  format: 'JSON',
  locationName: undefined,
  elementName: undefined,
  timeFrom: undefined,
  timeTo: undefined
} as const;

/**
 * HTTP Headers 配置
 */
export const HTTP_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json'
} as const;

/**
 * 錯誤訊息對照表
 */
export const ERROR_MESSAGES: Record<number, string> = {
  400: '請求參數錯誤，請檢查輸入資料',
  401: 'API 授權失敗，請檢查 API 金鑰',
  403: '無權限存取此資料集',
  404: '找不到指定的資料集',
  429: '請求過於頻繁，請稍後再試',
  500: '氣象署服務暫時無法使用，請稍後再試',
  503: '氣象署服務暫時無法使用，請稍後再試'
};

/**
 * 取得錯誤訊息
 *
 * @param statusCode - HTTP 狀態碼
 * @returns 錯誤訊息
 */
export function getErrorMessage(statusCode: number): string {
  return ERROR_MESSAGES[statusCode] || `發生未知錯誤 (HTTP ${statusCode})`;
}
