/**
 * Climate Module Public API
 * 氣候模組公開 API 匯出
 *
 * @packageDocumentation
 * @module Climate
 */

// Module
export { ClimateModule } from './climate.module';

// Services
export { CwbWeatherService } from './services/cwb-weather.service';
export { ClimateCacheService, type CacheStats } from './services/climate-cache.service';

// Repositories
export { ClimateRepository, type ClimateDataRecord, type ProjectClimateData } from './repositories/climate.repository';

// Models
export {
  type WeatherForecast,
  type WeatherObservation,
  type EarthquakeInfo,
  type ConstructionSuitability,
  type WeatherAlert
} from './models/weather-forecast.model';

export {
  type CwbApiResponse,
  type CwbLocation,
  type CwbWeatherElement,
  type CwbTimeData,
  type CwbParameter,
  type CwbStationObservation,
  type CwbEarthquakeReport,
  type CwbErrorResponse,
  WeatherElementCode,
  COUNTY_CODES,
  DatasetId
} from './models/cwb-api-response.model';

// Configuration
export { type IClimateConfig, DEFAULT_CLIMATE_CONFIG, CLIMATE_CONSTANTS, CONSTRUCTION_SUITABILITY_WEIGHTS } from './config/climate.config';

export {
  CWB_API_ENDPOINTS,
  TOWNSHIPS,
  WEATHER_CODES,
  DEFAULT_QUERY_PARAMS,
  HTTP_HEADERS,
  ERROR_MESSAGES,
  getCountyCode,
  getTownshipForecastDatasetId,
  getWeatherDescription,
  getErrorMessage,
  ALL_COUNTIES
} from './config/cwb-api.constants';

// Exports API
export { type IClimateModuleApi, createClimateModuleApi } from './exports/climate-api.exports';
