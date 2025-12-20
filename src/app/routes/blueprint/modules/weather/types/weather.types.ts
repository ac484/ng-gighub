/**
 * Weather Module Types
 * 氣象模組類型定義
 *
 * Minimal type definitions for weather data display
 */

/**
 * Weather forecast data (36-hour)
 */
export interface WeatherForecast {
  locationName: string;
  temperature: string;
  weather: string;
  rainProbability: string;
  updateTime: Date;
}

/**
 * Weather observation data
 */
export interface WeatherObservation {
  stationName: string;
  temperature: number;
  humidity: number;
  weather: string;
  observationTime: Date;
}

/**
 * Weather alert data
 */
export interface WeatherAlert {
  type: string;
  title: string;
  description: string;
  effectiveTime: Date;
  severity: 'high' | 'medium' | 'low';
}

/**
 * Weather display mode
 */
export type WeatherDisplayMode = 'full' | 'compact' | 'forecast' | 'observation' | 'alert';

/**
 * Weather service result
 */
export interface WeatherResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}
