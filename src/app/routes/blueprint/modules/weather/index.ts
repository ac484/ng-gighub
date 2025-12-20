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

// Service for direct API calls (if needed)
export { WeatherService } from './services/weather.service';

// Types for consumers
export type {
  WeatherForecast,
  WeatherObservation,
  WeatherAlert,
  WeatherDisplayMode,
  WeatherResult
} from './types/weather.types';
