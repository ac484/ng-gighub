/**
 * Climate Cache Service
 * 氣候資料快取服務
 *
 * @packageDocumentation
 * @module ClimateServices
 */

import { Injectable, signal } from '@angular/core';

import { IClimateConfig } from '../config/climate.config';

/**
 * 快取項目介面
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  key: string;
}

/**
 * 快取統計資訊
 */
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
  hitRate: number;
}

/**
 * 氣候資料快取服務
 *
 * 提供記憶體內快取機制，支援 TTL 和最大項目數限制
 */
@Injectable({
  providedIn: 'root'
})
export class ClimateCacheService {
  private cache = new Map<string, CacheEntry<any>>();

  // 快取統計（使用 Signal）
  private _stats = signal<CacheStats>({
    hits: 0,
    misses: 0,
    size: 0,
    maxSize: 100,
    hitRate: 0
  });

  readonly stats = this._stats.asReadonly();

  private config?: IClimateConfig;

  /**
   * 初始化快取服務
   *
   * @param config - 氣候模組配置
   */
  initialize(config: IClimateConfig): void {
    this.config = config;
    this._stats.update(s => ({
      ...s,
      maxSize: config.cache.maxItems
    }));
  }

  /**
   * 從快取取得資料
   *
   * @param key - 快取鍵
   * @param ttl - 存活時間（毫秒），若未提供則使用預設值
   * @returns 快取資料或 null
   */
  get<T>(key: string, ttl?: number): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.recordMiss();
      return null;
    }

    const age = Date.now() - entry.timestamp;
    const maxAge = ttl || this.getDefaultTTL(key);

    if (age > maxAge) {
      this.cache.delete(key);
      this.recordMiss();
      this.updateSize();
      return null;
    }

    this.recordHit();
    return entry.data as T;
  }

  /**
   * 將資料存入快取
   *
   * @param key - 快取鍵
   * @param data - 要快取的資料
   */
  set<T>(key: string, data: T): void {
    // 檢查快取大小限制
    if (this.cache.size >= this._stats().maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      key
    });

    this.updateSize();
  }

  /**
   * 檢查快取中是否存在指定鍵
   *
   * @param key - 快取鍵
   * @param ttl - 存活時間（毫秒）
   * @returns true 如果快取有效
   */
  has(key: string, ttl?: number): boolean {
    return this.get(key, ttl) !== null;
  }

  /**
   * 刪除指定快取項目
   *
   * @param key - 快取鍵
   * @returns true 如果刪除成功
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.updateSize();
    }
    return deleted;
  }

  /**
   * 清除所有快取
   */
  clear(): void {
    this.cache.clear();
    this._stats.update(s => ({
      ...s,
      size: 0
    }));
  }

  /**
   * 清除過期的快取項目
   *
   * @returns 清除的項目數量
   */
  clearExpired(): number {
    let cleared = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      const ttl = this.getDefaultTTL(key);
      const age = now - entry.timestamp;

      if (age > ttl) {
        this.cache.delete(key);
        cleared++;
      }
    }

    if (cleared > 0) {
      this.updateSize();
    }

    return cleared;
  }

  /**
   * 取得所有快取鍵
   *
   * @returns 快取鍵陣列
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * 取得快取項目數量
   *
   * @returns 快取項目數量
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 重置快取統計
   */
  resetStats(): void {
    this._stats.update(s => ({
      ...s,
      hits: 0,
      misses: 0,
      hitRate: 0
    }));
  }

  /**
   * 驅逐最舊的快取項目
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * 取得預設 TTL
   *
   * @param key - 快取鍵
   * @returns TTL（毫秒）
   */
  private getDefaultTTL(key: string): number {
    if (!this.config) {
      return 5 * 60 * 1000; // 預設 5 分鐘
    }

    if (key.startsWith('forecast_')) {
      return this.config.cache.forecastTTL;
    } else if (key.startsWith('observation_')) {
      return this.config.cache.observationTTL;
    } else if (key.startsWith('earthquake_')) {
      return this.config.cache.earthquakeTTL;
    }

    return 5 * 60 * 1000; // 預設 5 分鐘
  }

  /**
   * 記錄快取命中
   */
  private recordHit(): void {
    this._stats.update(s => {
      const hits = s.hits + 1;
      const total = hits + s.misses;
      return {
        ...s,
        hits,
        hitRate: total > 0 ? (hits / total) * 100 : 0
      };
    });
  }

  /**
   * 記錄快取未命中
   */
  private recordMiss(): void {
    this._stats.update(s => {
      const misses = s.misses + 1;
      const total = s.hits + misses;
      return {
        ...s,
        misses,
        hitRate: total > 0 ? (s.hits / total) * 100 : 0
      };
    });
  }

  /**
   * 更新快取大小
   */
  private updateSize(): void {
    this._stats.update(s => ({
      ...s,
      size: this.cache.size
    }));
  }
}
