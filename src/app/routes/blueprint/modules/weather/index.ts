/**
 * Weather Module Public API
 * 氣象模組公開介面
 *
 * Export only what other modules need to consume
 * Internal implementation can change freely
 */

// Main component
export { WeatherModuleViewComponent } from './weather-module-view.component';

// Reusable card component for embedding
export { WeatherCardComponent } from './components/weather-card.component';

// Main service for weather data
export { WeatherService } from './services/weather.service';

// Cache service (exposed for manual cache control)
export { WeatherCacheService } from './services/weather-cache.service';

// Types for consumers
export type { WeatherForecast, WeatherObservation, WeatherAlert, WeatherDisplayMode, WeatherResult } from './types/weather.types';

// CWA API types (for advanced usage)
export type { CwaApiResponse, CwaForecastResponse, CwaObservationResponse, ForecastParams, ObservationParams } from './types/cwa-api.types';

export { CWA_API_ENDPOINTS, WEATHER_ELEMENTS, COUNTY_CODES } from './types/cwa-api.types';
