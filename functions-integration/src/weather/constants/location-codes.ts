/**
 * Location Codes for Central Weather Administration (CWA) API
 *
 * Complete list of county and township codes used in CWA weather API.
 * Source: https://opendata.cwa.gov.tw/opendatadoc/Observation/O-A0001-001.pdf
 *
 * @author GigHub Development Team
 * @date 2025-12-20
 */

// ===== County Codes =====

/**
 * County code mapping
 * Format: { code: 'county name' }
 */
export const COUNTY_CODES: Record<string, string> = {
  '63': '臺北市',
  '64': '高雄市',
  '65': '新北市',
  '66': '臺中市',
  '67': '臺南市',
  '68': '桃園市',
  '10002': '宜蘭縣',
  '10004': '新竹縣',
  '10005': '苗栗縣',
  '10007': '彰化縣',
  '10008': '南投縣',
  '10009': '雲林縣',
  '10010': '嘉義縣',
  '10013': '屏東縣',
  '10014': '臺東縣',
  '10015': '花蓮縣',
  '10016': '澎湖縣',
  '10017': '基隆市',
  '10018': '新竹市',
  '10020': '嘉義市',
  '09007': '連江縣',
  '09020': '金門縣'
};

/**
 * Reverse county code mapping
 * Format: { 'county name': code }
 */
export const COUNTY_NAME_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTY_CODES).map(([code, name]) => [name, code])
);

// ===== Township Codes by County =====

/**
 * Taipei City (臺北市) townships
 */
export const TAIPEI_CITY_TOWNSHIPS: Record<string, string> = {
  '6300100': '松山區',
  '6300200': '信義區',
  '6300300': '大安區',
  '6300400': '中山區',
  '6300500': '中正區',
  '6300600': '大同區',
  '6300700': '萬華區',
  '6300800': '文山區',
  '6300900': '南港區',
  '6301000': '內湖區',
  '6301100': '士林區',
  '6301200': '北投區'
};

/**
 * New Taipei City (新北市) townships
 */
export const NEW_TAIPEI_CITY_TOWNSHIPS: Record<string, string> = {
  '6500100': '板橋區',
  '6500200': '三重區',
  '6500300': '中和區',
  '6500400': '永和區',
  '6500500': '新莊區',
  '6500600': '新店區',
  '6500700': '樹林區',
  '6500800': '鶯歌區',
  '6500900': '三峽區',
  '6501000': '淡水區',
  '6501100': '汐止區',
  '6501200': '瑞芳區',
  '6501300': '土城區',
  '6501400': '蘆洲區',
  '6501500': '五股區',
  '6501600': '泰山區',
  '6501700': '林口區',
  '6501800': '深坑區',
  '6501900': '石碇區',
  '6502000': '坪林區',
  '6502100': '三芝區',
  '6502200': '石門區',
  '6502300': '八里區',
  '6502400': '平溪區',
  '6502500': '雙溪區',
  '6502600': '貢寮區',
  '6502700': '金山區',
  '6502800': '萬里區',
  '6502900': '烏來區'
};

/**
 * Taoyuan City (桃園市) townships
 */
export const TAOYUAN_CITY_TOWNSHIPS: Record<string, string> = {
  '6800100': '桃園區',
  '6800200': '中壢區',
  '6800300': '平鎮區',
  '6800400': '八德區',
  '6800500': '楊梅區',
  '6800600': '蘆竹區',
  '6800700': '大溪區',
  '6800800': '龍潭區',
  '6800900': '龜山區',
  '6801000': '大園區',
  '6801100': '觀音區',
  '6801200': '新屋區',
  '6801300': '復興區'
};

/**
 * Taichung City (臺中市) townships
 */
export const TAICHUNG_CITY_TOWNSHIPS: Record<string, string> = {
  '6600100': '中區',
  '6600200': '東區',
  '6600300': '南區',
  '6600400': '西區',
  '6600500': '北區',
  '6600600': '西屯區',
  '6600700': '南屯區',
  '6600800': '北屯區',
  '6600900': '豐原區',
  '6601000': '東勢區',
  '6601100': '大甲區',
  '6601200': '清水區',
  '6601300': '沙鹿區',
  '6601400': '梧棲區',
  '6601500': '后里區',
  '6601600': '神岡區',
  '6601700': '潭子區',
  '6601800': '大雅區',
  '6601900': '新社區',
  '6602000': '石岡區',
  '6602100': '外埔區',
  '6602200': '大安區',
  '6602300': '烏日區',
  '6602400': '大肚區',
  '6602500': '龍井區',
  '6602600': '霧峰區',
  '6602700': '太平區',
  '6602800': '大里區',
  '6602900': '和平區'
};

/**
 * Tainan City (臺南市) townships
 */
export const TAINAN_CITY_TOWNSHIPS: Record<string, string> = {
  '6700100': '中西區',
  '6700200': '東區',
  '6700300': '南區',
  '6700400': '北區',
  '6700500': '安平區',
  '6700600': '安南區',
  '6700700': '永康區',
  '6700800': '歸仁區',
  '6700900': '新化區',
  '6701000': '左鎮區',
  '6701100': '玉井區',
  '6701200': '楠西區',
  '6701300': '南化區',
  '6701400': '仁德區',
  '6701500': '關廟區',
  '6701600': '龍崎區',
  '6701700': '官田區',
  '6701800': '麻豆區',
  '6701900': '佳里區',
  '6702000': '西港區',
  '6702100': '七股區',
  '6702200': '將軍區',
  '6702300': '學甲區',
  '6702400': '北門區',
  '6702500': '新營區',
  '6702600': '後壁區',
  '6702700': '白河區',
  '6702800': '東山區',
  '6702900': '六甲區',
  '6703000': '下營區',
  '6703100': '柳營區',
  '6703200': '鹽水區',
  '6703300': '善化區',
  '6703400': '大內區',
  '6703500': '山上區',
  '6703600': '新市區',
  '6703700': '安定區'
};

/**
 * Kaohsiung City (高雄市) townships
 */
export const KAOHSIUNG_CITY_TOWNSHIPS: Record<string, string> = {
  '6400100': '楠梓區',
  '6400200': '左營區',
  '6400300': '鼓山區',
  '6400400': '三民區',
  '6400500': '鹽埕區',
  '6400600': '前金區',
  '6400700': '新興區',
  '6400800': '苓雅區',
  '6400900': '前鎮區',
  '6401000': '旗津區',
  '6401100': '小港區',
  '6401200': '鳳山區',
  '6401300': '大寮區',
  '6401400': '鳥松區',
  '6401500': '林園區',
  '6401600': '仁武區',
  '6401700': '大樹區',
  '6401800': '大社區',
  '6401900': '岡山區',
  '6402000': '路竹區',
  '6402100': '橋頭區',
  '6402200': '梓官區',
  '6402300': '彌陀區',
  '6402400': '永安區',
  '6402500': '燕巢區',
  '6402600': '田寮區',
  '6402700': '阿蓮區',
  '6402800': '茄萣區',
  '6402900': '湖內區',
  '6403000': '旗山區',
  '6403100': '美濃區',
  '6403200': '內門區',
  '6403300': '杉林區',
  '6403400': '甲仙區',
  '6403500': '六龜區',
  '6403600': '茂林區',
  '6403700': '桃源區',
  '6403800': '那瑪夏區'
};

/**
 * Complete township code mapping
 */
export const TOWNSHIP_CODES: Record<string, Record<string, string>> = {
  '63': TAIPEI_CITY_TOWNSHIPS,
  '65': NEW_TAIPEI_CITY_TOWNSHIPS,
  '68': TAOYUAN_CITY_TOWNSHIPS,
  '66': TAICHUNG_CITY_TOWNSHIPS,
  '67': TAINAN_CITY_TOWNSHIPS,
  '64': KAOHSIUNG_CITY_TOWNSHIPS
};

// ===== Weather Station Codes =====

/**
 * Major weather station codes
 */
export const WEATHER_STATIONS: Record<string, { name: string; lat: number; lon: number }> = {
  '466920': { name: '臺北', lat: 25.0408, lon: 121.5135 },
  '467410': { name: '板橋', lat: 24.9976, lon: 121.4405 },
  '467440': { name: '淡水', lat: 25.165, lon: 121.4492 },
  '466880': { name: '基隆', lat: 25.1338, lon: 121.7403 },
  '466900': { name: '鞍部', lat: 25.1826, lon: 121.5297 },
  '467060': { name: '彭佳嶼', lat: 25.6281, lon: 122.0792 },
  '466910': { name: '竹子湖', lat: 25.1622, lon: 121.5444 },
  '467490': { name: '新竹', lat: 24.8277, lon: 120.9391 },
  '467540': { name: '苗栗', lat: 24.5665, lon: 120.8214 },
  '467571': { name: '苗栗(國一)', lat: 24.5033, lon: 120.7747 },
  '466990': { name: '宜蘭', lat: 24.7644, lon: 121.7498 },
  '467080': { name: '蘇澳', lat: 24.5966, lon: 121.845 },
  '467050': { name: '花蓮', lat: 23.9753, lon: 121.6061 },
  '467530': { name: '臺中', lat: 24.1469, lon: 120.6839 },
  '467572': { name: '梧棲', lat: 24.2564, lon: 120.5258 },
  '467580': { name: '日月潭', lat: 23.8808, lon: 120.9114 },
  '467650': { name: '阿里山', lat: 23.5081, lon: 120.8133 },
  '467610': { name: '嘉義', lat: 23.4969, lon: 120.4297 },
  '467660': { name: '玉山', lat: 23.4878, lon: 120.9597 },
  '467550': { name: '臺南', lat: 22.9936, lon: 120.2025 },
  '467450': { name: '高雄', lat: 22.5661, lon: 120.3133 },
  '467590': { name: '恆春', lat: 22.0022, lon: 120.7467 },
  '467620': { name: '大武', lat: 22.3581, lon: 120.9022 },
  '467680': { name: '臺東', lat: 22.7539, lon: 121.1508 },
  '467770': { name: '成功', lat: 23.0978, lon: 121.3736 },
  '466940': { name: '蘭嶼', lat: 22.0372, lon: 121.5564 },
  '467990': { name: '澎湖', lat: 23.5681, lon: 119.5628 },
  '467110': { name: '金門', lat: 24.4325, lon: 118.3128 },
  '467150': { name: '馬祖', lat: 26.1603, lon: 119.9517 }
};

// ===== Utility Functions =====

/**
 * Get county name by code
 */
export function getCountyName(code: string): string | undefined {
  return COUNTY_CODES[code];
}

/**
 * Get county code by name
 */
export function getCountyCode(name: string): string | undefined {
  return COUNTY_NAME_TO_CODE[name];
}

/**
 * Get township name by county code and township code
 */
export function getTownshipName(countyCode: string, townshipCode: string): string | undefined {
  return TOWNSHIP_CODES[countyCode]?.[townshipCode];
}

/**
 * Get all townships for a county
 */
export function getTownshipsByCounty(countyCode: string): Record<string, string> | undefined {
  return TOWNSHIP_CODES[countyCode];
}

/**
 * Get weather station info by code
 */
export function getWeatherStation(code: string): { name: string; lat: number; lon: number } | undefined {
  return WEATHER_STATIONS[code];
}

/**
 * Validate location code
 */
export function isValidCountyCode(code: string): boolean {
  return code in COUNTY_CODES;
}

/**
 * Validate township code
 */
export function isValidTownshipCode(countyCode: string, townshipCode: string): boolean {
  return getTownshipName(countyCode, townshipCode) !== undefined;
}

/**
 * Get all county codes
 */
export function getAllCountyCodes(): string[] {
  return Object.keys(COUNTY_CODES);
}

/**
 * Get all county names
 */
export function getAllCountyNames(): string[] {
  return Object.values(COUNTY_CODES);
}

/**
 * Search location by partial name
 */
export function searchLocationByName(query: string): Array<{ code: string; name: string; type: 'county' | 'township' }> {
  const results: Array<{ code: string; name: string; type: 'county' | 'township' }> = [];

  // Search counties
  for (const [code, name] of Object.entries(COUNTY_CODES)) {
    if (name.includes(query)) {
      results.push({ code, name, type: 'county' });
    }
  }

  // Search townships
  for (const [_countyCode, townships] of Object.entries(TOWNSHIP_CODES)) {
    for (const [townshipCode, townshipName] of Object.entries(townships)) {
      if (townshipName.includes(query)) {
        results.push({ code: townshipCode, name: townshipName, type: 'township' });
      }
    }
  }

  return results;
}
