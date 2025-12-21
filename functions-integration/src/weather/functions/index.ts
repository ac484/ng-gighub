/**
 * CWA Weather API - Firebase Cloud Functions
 *
 * Cloud Functions for fetching weather data from Central Weather Administration API.
 * All functions are callable from client applications with authentication.
 *
 * @author GigHub Development Team
 * @date 2025-12-20
 */

import * as logger from 'firebase-functions/logger';
import { defineSecret } from 'firebase-functions/params';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

import { createCwaWeatherService } from '../services';
import { Get36HourForecastRequest, GetObservationRequest, GetWeatherAlertRequest, WeatherApiResponse } from '../types';

// Define secret for CWA API key
const cwaApiKey = defineSecret('CWA_API_KEY');

/**
 * Get CWA Weather Service instance
 */
function getWeatherService(): any {
  const apiKey = cwaApiKey.value();

  if (!apiKey) {
    throw new HttpsError('failed-precondition', 'CWA_API_KEY not configured');
  }

  return createCwaWeatherService({
    apiKey,
    cacheEnabled: true,
    cacheTTL: {
      forecast: 3600, // 1 hour
      observation: 600, // 10 minutes
      alert: 300 // 5 minutes
    }
  });
}

/**
 * Validate authentication
 */
function validateAuth(context: any): void {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }
}

// ===== Weather Forecast Functions =====

/**
 * Get 36-hour weather forecast
 *
 * @example
 * ```typescript
 * const getForecast36Hour = httpsCallable(functions, 'weather-getForecast36Hour');
 * const result = await getForecast36Hour({ countyName: '臺北市' });
 * ```
 */
export const getForecast36Hour = onCall<Get36HourForecastRequest>(
  {
    region: 'asia-east1',
    secrets: [cwaApiKey],
    memory: '256MiB',
    timeoutSeconds: 60
  },
  async request => {
    validateAuth(request);

    const { countyName, locationName } = request.data;

    if (!countyName) {
      throw new HttpsError('invalid-argument', 'countyName is required');
    }

    logger.info('[weather-getForecast36Hour]', {
      countyName,
      locationName,
      userId: request.auth?.uid
    });

    try {
      const weatherService = getWeatherService();
      const response = await weatherService.get36HourForecast(countyName, locationName);

      if (!response.success) {
        throw new HttpsError('internal', response.error?.message ?? 'Failed to fetch forecast');
      }

      const result: WeatherApiResponse<any> = {
        success: true,
        data: response.result,
        cached: false
      };

      return result;
    } catch (error) {
      logger.error('[weather-getForecast36Hour] Error', error);
      throw new HttpsError('internal', 'Failed to fetch 36-hour forecast');
    }
  }
);

/**
 * Get 7-day weather forecast
 *
 * @example
 * ```typescript
 * const getForecast7Day = httpsCallable(functions, 'weather-getForecast7Day');
 * const result = await getForecast7Day({ countyName: '新北市' });
 * ```
 */
export const getForecast7Day = onCall<{ countyName: string }>(
  {
    region: 'asia-east1',
    secrets: [cwaApiKey],
    memory: '256MiB',
    timeoutSeconds: 60
  },
  async request => {
    validateAuth(request);

    const { countyName } = request.data;

    if (!countyName) {
      throw new HttpsError('invalid-argument', 'countyName is required');
    }

    logger.info('[weather-getForecast7Day]', {
      countyName,
      userId: request.auth?.uid
    });

    try {
      const weatherService = getWeatherService();
      const response = await weatherService.get7DayForecast(countyName);

      if (!response.success) {
        throw new HttpsError('internal', response.error?.message ?? 'Failed to fetch forecast');
      }

      const result: WeatherApiResponse<any> = {
        success: true,
        data: response.result,
        cached: false
      };

      return result;
    } catch (error) {
      logger.error('[weather-getForecast7Day] Error', error);
      throw new HttpsError('internal', 'Failed to fetch 7-day forecast');
    }
  }
);

/**
 * Get township-level weather forecast
 *
 * @example
 * ```typescript
 * const getTownshipForecast = httpsCallable(functions, 'weather-getTownshipForecast');
 * const result = await getTownshipForecast({ countyCode: '63', townshipName: '松山區' });
 * ```
 */
export const getTownshipForecast = onCall<{ countyCode: string; townshipName?: string }>(
  {
    region: 'asia-east1',
    secrets: [cwaApiKey],
    memory: '256MiB',
    timeoutSeconds: 60
  },
  async request => {
    validateAuth(request);

    const { countyCode, townshipName } = request.data;

    if (!countyCode) {
      throw new HttpsError('invalid-argument', 'countyCode is required');
    }

    logger.info('[weather-getTownshipForecast]', {
      countyCode,
      townshipName,
      userId: request.auth?.uid
    });

    try {
      const weatherService = getWeatherService();
      const response = await weatherService.getTownshipForecast(countyCode, townshipName);

      if (!response.success) {
        throw new HttpsError('internal', response.error?.message ?? 'Failed to fetch forecast');
      }

      const result: WeatherApiResponse<any> = {
        success: true,
        data: response.result,
        cached: false
      };

      return result;
    } catch (error) {
      logger.error('[weather-getTownshipForecast] Error', error);
      throw new HttpsError('internal', 'Failed to fetch township forecast');
    }
  }
);

// ===== Weather Observation Functions =====

/**
 * Get meteorological station observation data
 *
 * @example
 * ```typescript
 * const getObservation = httpsCallable(functions, 'weather-getObservation');
 * const result = await getObservation({ stationId: '466920' });
 * ```
 */
export const getObservation = onCall<GetObservationRequest>(
  {
    region: 'asia-east1',
    secrets: [cwaApiKey],
    memory: '256MiB',
    timeoutSeconds: 60
  },
  async request => {
    validateAuth(request);

    const { stationId } = request.data;

    logger.info('[weather-getObservation]', {
      stationId,
      userId: request.auth?.uid
    });

    try {
      const weatherService = getWeatherService();
      const response = await weatherService.getMeteorologicalObservation(stationId);

      if (!response.success) {
        throw new HttpsError('internal', response.error?.message ?? 'Failed to fetch observation');
      }

      const result: WeatherApiResponse<any> = {
        success: true,
        data: response.result,
        cached: false
      };

      return result;
    } catch (error) {
      logger.error('[weather-getObservation] Error', error);
      throw new HttpsError('internal', 'Failed to fetch observation data');
    }
  }
);

/**
 * Get 10-minute observation data
 *
 * @example
 * ```typescript
 * const get10MinObservation = httpsCallable(functions, 'weather-get10MinObservation');
 * const result = await get10MinObservation({ stationId: '466920' });
 * ```
 */
export const get10MinObservation = onCall<{ stationId?: string }>(
  {
    region: 'asia-east1',
    secrets: [cwaApiKey],
    memory: '256MiB',
    timeoutSeconds: 60
  },
  async request => {
    validateAuth(request);

    const { stationId } = request.data;

    logger.info('[weather-get10MinObservation]', {
      stationId,
      userId: request.auth?.uid
    });

    try {
      const weatherService = getWeatherService();
      const response = await weatherService.get10MinuteObservation(stationId);

      if (!response.success) {
        throw new HttpsError('internal', response.error?.message ?? 'Failed to fetch observation');
      }

      const result: WeatherApiResponse<any> = {
        success: true,
        data: response.result,
        cached: false
      };

      return result;
    } catch (error) {
      logger.error('[weather-get10MinObservation] Error', error);
      throw new HttpsError('internal', 'Failed to fetch 10-minute observation data');
    }
  }
);

/**
 * Get rainfall observation data
 *
 * @example
 * ```typescript
 * const getRainfallObservation = httpsCallable(functions, 'weather-getRainfallObservation');
 * const result = await getRainfallObservation({ stationId: '466920' });
 * ```
 */
export const getRainfallObservation = onCall<{ stationId?: string }>(
  {
    region: 'asia-east1',
    secrets: [cwaApiKey],
    memory: '256MiB',
    timeoutSeconds: 60
  },
  async request => {
    validateAuth(request);

    const { stationId } = request.data;

    logger.info('[weather-getRainfallObservation]', {
      stationId,
      userId: request.auth?.uid
    });

    try {
      const weatherService = getWeatherService();
      const response = await weatherService.getRainfallObservation(stationId);

      if (!response.success) {
        throw new HttpsError('internal', response.error?.message ?? 'Failed to fetch rainfall data');
      }

      const result: WeatherApiResponse<any> = {
        success: true,
        data: response.result,
        cached: false
      };

      return result;
    } catch (error) {
      logger.error('[weather-getRainfallObservation] Error', error);
      throw new HttpsError('internal', 'Failed to fetch rainfall observation data');
    }
  }
);

/**
 * Get UV index observation
 *
 * @example
 * ```typescript
 * const getUvIndexObservation = httpsCallable(functions, 'weather-getUvIndexObservation');
 * const result = await getUvIndexObservation({});
 * ```
 */
export const getUvIndexObservation = onCall(
  {
    region: 'asia-east1',
    secrets: [cwaApiKey],
    memory: '256MiB',
    timeoutSeconds: 60
  },
  async request => {
    validateAuth(request);

    logger.info('[weather-getUvIndexObservation]', {
      userId: request.auth?.uid
    });

    try {
      const weatherService = getWeatherService();
      const response = await weatherService.getUvIndexObservation();

      if (!response.success) {
        throw new HttpsError('internal', response.error?.message ?? 'Failed to fetch UV index');
      }

      const result: WeatherApiResponse<any> = {
        success: true,
        data: response.result,
        cached: false
      };

      return result;
    } catch (error) {
      logger.error('[weather-getUvIndexObservation] Error', error);
      throw new HttpsError('internal', 'Failed to fetch UV index observation');
    }
  }
);

// ===== Weather Alert Functions =====

/**
 * Get weather warnings and alerts
 *
 * @example
 * ```typescript
 * const getWeatherWarnings = httpsCallable(functions, 'weather-getWeatherWarnings');
 * const result = await getWeatherWarnings({ alertType: 'typhoon' });
 * ```
 */
export const getWeatherWarnings = onCall<GetWeatherAlertRequest>(
  {
    region: 'asia-east1',
    secrets: [cwaApiKey],
    memory: '256MiB',
    timeoutSeconds: 60
  },
  async request => {
    validateAuth(request);

    const { alertType } = request.data;

    logger.info('[weather-getWeatherWarnings]', {
      alertType,
      userId: request.auth?.uid
    });

    try {
      const weatherService = getWeatherService();
      const response = await weatherService.getWeatherWarnings(alertType);

      if (!response.success) {
        throw new HttpsError('internal', response.error?.message ?? 'Failed to fetch warnings');
      }

      const result: WeatherApiResponse<any> = {
        success: true,
        data: response.result,
        cached: false
      };

      return result;
    } catch (error) {
      logger.error('[weather-getWeatherWarnings] Error', error);
      throw new HttpsError('internal', 'Failed to fetch weather warnings');
    }
  }
);

// ===== Utility Functions =====

/**
 * Clear weather data cache
 *
 * @example
 * ```typescript
 * const clearWeatherCache = httpsCallable(functions, 'weather-clearCache');
 * const result = await clearWeatherCache({});
 * ```
 */
export const clearCache = onCall(
  {
    region: 'asia-east1',
    secrets: [cwaApiKey],
    memory: '256MiB',
    timeoutSeconds: 60
  },
  async request => {
    validateAuth(request);

    // Check if user has admin privileges
    const token = request.auth?.token;
    if (!token?.admin) {
      throw new HttpsError('permission-denied', 'Only admins can clear cache');
    }

    logger.info('[weather-clearCache]', {
      userId: request.auth?.uid
    });

    try {
      const weatherService = getWeatherService();
      await weatherService.clearCache();

      return {
        success: true,
        message: 'Cache cleared successfully'
      };
    } catch (error) {
      logger.error('[weather-clearCache] Error', error);
      throw new HttpsError('internal', 'Failed to clear cache');
    }
  }
);
