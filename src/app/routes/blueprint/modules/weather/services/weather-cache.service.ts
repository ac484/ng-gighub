/**
 * Weather Cache Service
 * 氣象資料快取服務
 *
 * Purpose: Provide local caching for weather data
 * Architecture: Infrastructure service for cache management
 *
 * ✅ High Cohesion: Single responsibility - cache management
 * ✅ Low Coupling: Generic cache service, not weather-specific
 * ✅ Extensible: Can cache any serializable data
 */

import { Injectable, inject } from '@angular/core';
import { LoggerService } from '@core/services/logger';

/**
 * Cache entry structure
 */
interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  expiresAt: number;
}

/**
 * Cache configuration
 */
interface CacheConfig {
  ttl: number; // Time-to-live in seconds
  maxSize?: number; // Maximum cache size (optional)
}

/**
 * Default cache TTL values
 */
const DEFAULT_TTL = {
  FORECAST: 3600, // 1 hour
  OBSERVATION: 600, // 10 minutes
  ALERT: 300 // 5 minutes
} as const;

@Injectable({ providedIn: 'root' })
export class WeatherCacheService {
  private readonly logger = inject(LoggerService);
  private readonly CACHE_PREFIX = 'cwa_weather_';

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    try {
      const cacheKey = this.getCacheKey(key);
      const item = localStorage.getItem(cacheKey);

      if (!item) {
        return null;
      }

      const entry = JSON.parse(item) as CacheEntry<T>;

      // Check if expired
      if (Date.now() > entry.expiresAt) {
        this.remove(key);
        return null;
      }

      this.logger.debug('[WeatherCacheService]', `Cache hit: ${key}`);
      return entry.data;
    } catch (error) {
      this.logger.error('[WeatherCacheService]', `Failed to get cache: ${key}`, error as Error);
      return null;
    }
  }

  /**
   * Set data to cache
   */
  set<T>(key: string, data: T, ttl: number = DEFAULT_TTL.FORECAST): void {
    try {
      const cacheKey = this.getCacheKey(key);
      const entry: CacheEntry<T> = {
        data,
        cachedAt: Date.now(),
        expiresAt: Date.now() + ttl * 1000
      };

      localStorage.setItem(cacheKey, JSON.stringify(entry));
      this.logger.debug('[WeatherCacheService]', `Cache set: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      this.logger.error('[WeatherCacheService]', `Failed to set cache: ${key}`, error as Error);
    }
  }

  /**
   * Remove data from cache
   */
  remove(key: string): void {
    try {
      const cacheKey = this.getCacheKey(key);
      localStorage.removeItem(cacheKey);
      this.logger.debug('[WeatherCacheService]', `Cache removed: ${key}`);
    } catch (error) {
      this.logger.error('[WeatherCacheService]', `Failed to remove cache: ${key}`, error as Error);
    }
  }

  /**
   * Clear all weather cache
   */
  clearAll(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(this.CACHE_PREFIX));

      keys.forEach(key => localStorage.removeItem(key));
      this.logger.info('[WeatherCacheService]', `Cleared ${keys.length} cache entries`);
    } catch (error) {
      this.logger.error('[WeatherCacheService]', 'Failed to clear all cache', error as Error);
    }
  }

  /**
   * Clear expired cache entries
   */
  clearExpired(): number {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(this.CACHE_PREFIX));

      let clearedCount = 0;
      const now = Date.now();

      keys.forEach(key => {
        try {
          const item = localStorage.getItem(key);
          if (!item) return;

          const entry = JSON.parse(item) as CacheEntry<unknown>;
          if (now > entry.expiresAt) {
            localStorage.removeItem(key);
            clearedCount++;
          }
        } catch {
          // Remove corrupted cache entries
          localStorage.removeItem(key);
          clearedCount++;
        }
      });

      if (clearedCount > 0) {
        this.logger.info('[WeatherCacheService]', `Cleared ${clearedCount} expired cache entries`);
      }

      return clearedCount;
    } catch (error) {
      this.logger.error('[WeatherCacheService]', 'Failed to clear expired cache', error as Error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { total: number; size: number } {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(this.CACHE_PREFIX));

      let totalSize = 0;
      keys.forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          totalSize += item.length;
        }
      });

      return {
        total: keys.length,
        size: totalSize
      };
    } catch (error) {
      this.logger.error('[WeatherCacheService]', 'Failed to get cache stats', error as Error);
      return { total: 0, size: 0 };
    }
  }

  /**
   * Get default TTL values
   */
  get defaultTTL() {
    return DEFAULT_TTL;
  }

  /**
   * Generate cache key with prefix
   */
  private getCacheKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`;
  }
}
