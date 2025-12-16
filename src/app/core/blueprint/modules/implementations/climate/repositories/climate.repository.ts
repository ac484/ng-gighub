/**
 * Climate Repository
 * 氣候資料儲存庫
 *
 * 此儲存庫提供介面讓其他模組可以將氣候資料寫入 Firestore。
 * 氣候模組本身不儲存資料，只提供 API 調用功能。
 *
 * @packageDocumentation
 * @module ClimateRepositories
 */

import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, setDoc, getDoc, getDocs, query, where, Timestamp } from '@angular/fire/firestore';
import { Observable, from, map, catchError, of } from 'rxjs';

import { WeatherForecast, WeatherObservation, EarthquakeInfo } from '../models/weather-forecast.model';

/**
 * 氣候資料儲存記錄
 */
export interface ClimateDataRecord {
  id: string;
  type: 'forecast' | 'observation' | 'earthquake';
  data: WeatherForecast | WeatherObservation | EarthquakeInfo;
  sourceModule: string;
  createdAt: Timestamp;
  metadata?: Record<string, any>;
}

/**
 * 專案氣候資料關聯
 */
export interface ProjectClimateData {
  projectId: string;
  locationName: string;
  forecasts: WeatherForecast[];
  observations: WeatherObservation[];
  lastUpdated: Timestamp;
  metadata?: {
    autoUpdate?: boolean;
    updateInterval?: number;
    alertsEnabled?: boolean;
  };
}

/**
 * 氣候資料儲存庫
 *
 * 提供 Firestore 整合介面，讓其他模組可以儲存和查詢氣候資料。
 * 氣候模組本身不直接使用此儲存庫，而是提供給其他模組使用。
 *
 * @example
 * ```typescript
 * // 在任務模組中儲存天氣預報
 * const climateRepo = inject(ClimateRepository);
 * const forecast = await cwbService.getCityWeatherForecast('臺北市');
 *
 * await climateRepo.saveWeatherForecast(
 *   forecast[0],
 *   'tasks-module',
 *   { taskId: 'task-123', projectId: 'project-456' }
 * );
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ClimateRepository {
  private readonly firestore = inject(Firestore);

  // Firestore collection names
  private readonly COLLECTIONS = {
    CLIMATE_DATA: 'climate_data',
    PROJECT_CLIMATE: 'project_climate',
    WEATHER_ALERTS: 'weather_alerts'
  } as const;

  /**
   * 儲存天氣預報資料
   *
   * @param forecast - 天氣預報資料
   * @param sourceModule - 來源模組 ID
   * @param metadata - 額外的元資料
   * @returns Promise<string> - 文件 ID
   *
   * @example
   * ```typescript
   * const docId = await repository.saveWeatherForecast(
   *   forecast,
   *   'tasks-module',
   *   { taskId: 'task-123', projectId: 'project-456' }
   * );
   * ```
   */
  async saveWeatherForecast(forecast: WeatherForecast, sourceModule: string, metadata?: Record<string, any>): Promise<string> {
    const colRef = collection(this.firestore, this.COLLECTIONS.CLIMATE_DATA);
    const docRef = doc(colRef);

    const record: ClimateDataRecord = {
      id: docRef.id,
      type: 'forecast',
      data: forecast,
      sourceModule,
      createdAt: Timestamp.now(),
      metadata
    };

    await setDoc(docRef, record);
    return docRef.id;
  }

  /**
   * 儲存觀測資料
   *
   * @param observation - 觀測資料
   * @param sourceModule - 來源模組 ID
   * @param metadata - 額外的元資料
   * @returns Promise<string> - 文件 ID
   */
  async saveWeatherObservation(observation: WeatherObservation, sourceModule: string, metadata?: Record<string, any>): Promise<string> {
    const colRef = collection(this.firestore, this.COLLECTIONS.CLIMATE_DATA);
    const docRef = doc(colRef);

    const record: ClimateDataRecord = {
      id: docRef.id,
      type: 'observation',
      data: observation,
      sourceModule,
      createdAt: Timestamp.now(),
      metadata
    };

    await setDoc(docRef, record);
    return docRef.id;
  }

  /**
   * 儲存地震資訊
   *
   * @param earthquake - 地震資訊
   * @param sourceModule - 來源模組 ID
   * @param metadata - 額外的元資料
   * @returns Promise<string> - 文件 ID
   */
  async saveEarthquakeInfo(earthquake: EarthquakeInfo, sourceModule: string, metadata?: Record<string, any>): Promise<string> {
    const colRef = collection(this.firestore, this.COLLECTIONS.CLIMATE_DATA);
    const docRef = doc(colRef);

    const record: ClimateDataRecord = {
      id: docRef.id,
      type: 'earthquake',
      data: earthquake,
      sourceModule,
      createdAt: Timestamp.now(),
      metadata
    };

    await setDoc(docRef, record);
    return docRef.id;
  }

  /**
   * 關聯專案與氣候資料
   *
   * @param projectId - 專案 ID
   * @param locationName - 地點名稱
   * @param forecasts - 天氣預報陣列
   * @param observations - 觀測資料陣列
   * @param metadata - 額外的元資料
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await repository.linkProjectClimate(
   *   'project-123',
   *   '臺北市',
   *   forecasts,
   *   observations,
   *   { autoUpdate: true, updateInterval: 3600000 }
   * );
   * ```
   */
  async linkProjectClimate(
    projectId: string,
    locationName: string,
    forecasts: WeatherForecast[],
    observations: WeatherObservation[],
    metadata?: ProjectClimateData['metadata']
  ): Promise<void> {
    const colRef = collection(this.firestore, this.COLLECTIONS.PROJECT_CLIMATE);
    const docRef = doc(colRef, projectId);

    const projectClimate: ProjectClimateData = {
      projectId,
      locationName,
      forecasts,
      observations,
      lastUpdated: Timestamp.now(),
      metadata
    };

    await setDoc(docRef, projectClimate);
  }

  /**
   * 取得專案的氣候資料
   *
   * @param projectId - 專案 ID
   * @returns Observable<ProjectClimateData | null>
   *
   * @example
   * ```typescript
   * repository.getProjectClimate('project-123').subscribe(data => {
   *   if (data) {
   *     console.log('Latest forecast:', data.forecasts[0]);
   *   }
   * });
   * ```
   */
  getProjectClimate(projectId: string): Observable<ProjectClimateData | null> {
    const docRef = doc(this.firestore, this.COLLECTIONS.PROJECT_CLIMATE, projectId);

    return from(getDoc(docRef)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          return docSnap.data() as ProjectClimateData;
        }
        return null;
      }),
      catchError(error => {
        console.error('[ClimateRepository] Error getting project climate:', error);
        return of(null);
      })
    );
  }

  /**
   * 查詢特定模組儲存的氣候資料
   *
   * @param sourceModule - 來源模組 ID
   * @param type - 資料類型（可選）
   * @returns Observable<ClimateDataRecord[]>
   *
   * @example
   * ```typescript
   * repository.getDataByModule('tasks-module', 'forecast').subscribe(records => {
   *   console.log('Found records:', records.length);
   * });
   * ```
   */
  getDataByModule(sourceModule: string, type?: ClimateDataRecord['type']): Observable<ClimateDataRecord[]> {
    const colRef = collection(this.firestore, this.COLLECTIONS.CLIMATE_DATA);
    let q = query(colRef, where('sourceModule', '==', sourceModule));

    if (type) {
      q = query(q, where('type', '==', type));
    }

    return from(getDocs(q)).pipe(
      map(querySnapshot => {
        const records: ClimateDataRecord[] = [];
        querySnapshot.forEach(doc => {
          records.push(doc.data() as ClimateDataRecord);
        });
        return records;
      }),
      catchError(error => {
        console.error('[ClimateRepository] Error querying data:', error);
        return of([]);
      })
    );
  }

  /**
   * 更新專案氣候資料
   *
   * @param projectId - 專案 ID
   * @param updates - 要更新的欄位
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await repository.updateProjectClimate('project-123', {
   *   forecasts: newForecasts,
   *   lastUpdated: Timestamp.now()
   * });
   * ```
   */
  async updateProjectClimate(projectId: string, updates: Partial<ProjectClimateData>): Promise<void> {
    const docRef = doc(this.firestore, this.COLLECTIONS.PROJECT_CLIMATE, projectId);
    await setDoc(docRef, updates, { merge: true });
  }

  /**
   * 刪除專案氣候資料關聯
   *
   * @param projectId - 專案 ID
   * @returns Promise<void>
   */
  async unlinkProjectClimate(projectId: string): Promise<void> {
    const docRef = doc(this.firestore, this.COLLECTIONS.PROJECT_CLIMATE, projectId);
    // Note: Using deleteDoc from @angular/fire/firestore
    // await deleteDoc(docRef);
    // For now, we'll set a deletion flag
    await setDoc(docRef, { deleted: true, deletedAt: Timestamp.now() }, { merge: true });
  }

  /**
   * 批次儲存多筆預報資料
   *
   * @param forecasts - 預報資料陣列
   * @param sourceModule - 來源模組 ID
   * @param metadata - 共用元資料
   * @returns Promise<string[]> - 文件 ID 陣列
   */
  async batchSaveForecasts(forecasts: WeatherForecast[], sourceModule: string, metadata?: Record<string, any>): Promise<string[]> {
    const ids: string[] = [];

    for (const forecast of forecasts) {
      const id = await this.saveWeatherForecast(forecast, sourceModule, metadata);
      ids.push(id);
    }

    return ids;
  }
}
