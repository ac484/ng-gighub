import { Injectable, inject } from '@angular/core';
import { query, where, orderBy, limit as firestoreLimit, Timestamp, DocumentData, updateDoc, doc, getDoc } from '@angular/fire/firestore';
import { FirebaseStorageRepository } from '@core/infrastructure/storage';
import { Log, LogPhoto, CreateLogRequest, UpdateLogRequest, LogQueryOptions } from '@core/types/log/log.types';

import { FirestoreBaseRepository } from './base/firestore-base.repository';

type LogPhotoDocumentInput = LogPhoto & {
  public_url?: string;
  file_name?: string;
  uploaded_at?: Date | Timestamp | string | number | null;
};

/**
 * Log Firestore Repository
 * 日誌 Firestore Repository
 *
 * Implements Log CRUD operations using Firestore with:
 * - Firestore Security Rules enforcement
 * - Automatic retry on failures
 * - Organization-based isolation
 * - Photo/document management via Firebase Storage
 * - Soft delete support
 *
 * Replaces LogSupabaseRepository in migration to @angular/fire
 *
 * @extends FirestoreBaseRepository<Log>
 */
@Injectable({
  providedIn: 'root'
})
export class LogFirestoreRepository extends FirestoreBaseRepository<Log> {
  protected collectionName = 'logs';
  private readonly photosBucket = 'log-photos';
  private readonly storageRepo = inject(FirebaseStorageRepository);

  /**
   * Convert Firestore document to Log entity
   */
  protected toEntity(data: DocumentData, id: string): Log {
    return {
      id,
      blueprintId: data['blueprint_id'] || data['blueprintId'],
      date: this.toDate(data['date']),
      title: data['title'],
      description: data['description'],
      workHours: data['work_hours'] || data['workHours'],
      workers: data['workers'],
      equipment: data['equipment'],
      weather: data['weather'],
      temperature: data['temperature'],
      photos: this.parsePhotos(data['photos']),
      creatorId: data['creator_id'] || data['creatorId'],
      createdAt: this.toDate(data['created_at']),
      updatedAt: this.toDate(data['updated_at']),
      deletedAt: data['deleted_at'] ? this.toDate(data['deleted_at']) : null
    };
  }

  /**
   * Parse photos from Firestore data
   */
  private parsePhotos(photos: any): LogPhoto[] {
    if (!photos || !Array.isArray(photos)) {
      return [];
    }

    return photos.map((photo: any) => ({
      id: photo.id,
      url: photo.url,
      publicUrl: photo.publicUrl || photo.public_url,
      caption: photo.caption,
      uploadedAt: this.toDate(photo.uploadedAt || photo.uploaded_at),
      size: photo.size,
      fileName: photo.fileName || photo.file_name
    }));
  }

  /**
   * Convert Log entity to Firestore document
   */
  protected override toDocument(log: Partial<Log>): DocumentData {
    const doc: DocumentData = {};

    type LogDocumentInput = Partial<Log> & {
      blueprint_id?: string;
      creator_id?: string;
      work_hours?: number;
      deleted_at?: Date | Timestamp | null;
      photos?: LogPhotoDocumentInput[];
    };

    const input = log as LogDocumentInput;

    const blueprintId = input.blueprint_id ?? input.blueprintId;
    if (blueprintId) doc['blueprint_id'] = blueprintId;
    if (log.date) {
      // Validate and normalize date (non-throwing for update operations)
      const dateValue = this.validateAndNormalizeDate(log.date, false);
      doc['date'] = Timestamp.fromDate(dateValue);
    }
    if (log.title) doc['title'] = log.title;
    if (log.description !== undefined) doc['description'] = log.description;
    const workHours = input.work_hours ?? input.workHours;
    if (workHours !== undefined) doc['work_hours'] = workHours;
    if (log.workers !== undefined) doc['workers'] = log.workers;
    if (log.equipment !== undefined) doc['equipment'] = log.equipment;
    if (log.weather !== undefined) doc['weather'] = log.weather;
    if (log.temperature !== undefined) doc['temperature'] = log.temperature;
    const creatorId = input.creator_id ?? input.creatorId;
    if (creatorId) doc['creator_id'] = creatorId;

    if (input.photos !== undefined) {
      doc['photos'] = input.photos.map((photo: LogPhotoDocumentInput) => {
        const uploadedAt = photo.uploaded_at ?? photo.uploadedAt;
        return {
          id: photo.id,
          url: photo.url,
          public_url: photo.public_url ?? photo.publicUrl,
          caption: photo.caption,
          uploaded_at: uploadedAt ? Timestamp.fromDate(this.toDate(uploadedAt)) : null,
          size: photo.size,
          file_name: photo.file_name ?? photo.fileName
        };
      });
    }

    if (input.deleted_at !== undefined || log.deletedAt !== undefined) {
      const deletedAtValue = input.deleted_at ?? log.deletedAt;
      doc['deleted_at'] = deletedAtValue ? Timestamp.fromDate(this.toDate(deletedAtValue)) : null;
    }

    return doc;
  }

  /**
   * Convert Firestore Timestamp to Date
   * Handles multiple formats for robustness
   */
  private toDate(timestamp: any): Date {
    // If already a valid Date
    if (timestamp instanceof Date && !isNaN(timestamp.getTime())) {
      return timestamp;
    }

    // If Firestore Timestamp
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }

    // If has toDate method (Firestore Timestamp-like)
    if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
      try {
        return timestamp.toDate();
      } catch (error) {
        console.warn('[LogFirestoreRepository] Failed to convert timestamp:', error);
      }
    }

    // If string (ISO format)
    if (typeof timestamp === 'string') {
      const parsed = new Date(timestamp);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    // If number (milliseconds since epoch)
    if (typeof timestamp === 'number') {
      const parsed = new Date(timestamp);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    // Fallback to current date
    console.warn('[LogFirestoreRepository] Invalid timestamp, using current date:', timestamp);
    return new Date();
  }

  /**
   * Validate and normalize date for storage
   * Throws error if date is invalid for create/update operations
   */
  private validateAndNormalizeDate(dateValue: any, throwOnError = true): Date {
    if (!dateValue) {
      if (throwOnError) {
        throw new Error('日期欄位為必填');
      }
      return new Date();
    }

    // Convert to Date object
    const date = this.toDate(dateValue);

    // Validate the Date object
    if (isNaN(date.getTime())) {
      if (throwOnError) {
        this.logger.error('[LogFirestoreRepository]', 'Invalid date value', new Error('Invalid date'), {
          dateValue
        });
        throw new Error('日期無效，請重新選擇日期');
      }
      return new Date();
    }

    // Normalize to date-only (no time) to prevent timezone issues
    date.setHours(0, 0, 0, 0);

    return date;
  }

  /**
   * Find log by ID
   * 根據 ID 查找日誌
   */
  async findById(id: string): Promise<Log | null> {
    return this.executeWithRetry(async () => {
      return this.getDocument(id);
    });
  }

  /**
   * Find logs by blueprint
   * 根據藍圖查找日誌
   */
  async findByBlueprint(blueprintId: string, options?: LogQueryOptions): Promise<Log[]> {
    return this.executeWithRetry(async () => {
      this.logger.info('[LogFirestoreRepository]', `Finding logs for blueprint: ${blueprintId}`, { options });

      const constraints: any[] = [where('blueprint_id', '==', blueprintId)];

      // Apply date range filter
      if (options?.startDate) {
        const startDateTimestamp = Timestamp.fromDate(options.startDate);
        constraints.push(where('date', '>=', startDateTimestamp));
      }

      if (options?.endDate) {
        const endDateTimestamp = Timestamp.fromDate(options.endDate);
        constraints.push(where('date', '<=', endDateTimestamp));
      }

      if (options?.creatorId) {
        constraints.push(where('creator_id', '==', options.creatorId));
      }

      // Handle deleted filter
      if (!options?.includeDeleted) {
        constraints.push(where('deleted_at', '==', null));
      }

      // Sort by date descending
      constraints.push(orderBy('date', 'desc'));

      // Apply limit
      if (options?.limit) {
        constraints.push(firestoreLimit(options.limit));
      }

      const q = query(this.collectionRef, ...constraints);
      const logs = await this.queryDocuments(q);

      this.logger.info('[LogFirestoreRepository]', `Found ${logs.length} logs for blueprint: ${blueprintId}`);
      console.log('[LogFirestoreRepository] Query result:', logs);

      return logs;
    });
  }

  /**
   * Find logs with options
   * 使用選項查找日誌
   */
  async findWithOptions(options: LogQueryOptions): Promise<Log[]> {
    return this.executeWithRetry(async () => {
      const constraints: any[] = [];

      // Apply filters
      if (options.blueprintId) {
        constraints.push(where('blueprint_id', '==', options.blueprintId));
      }

      if (options.startDate) {
        const startDateTimestamp = Timestamp.fromDate(options.startDate);
        constraints.push(where('date', '>=', startDateTimestamp));
      }

      if (options.endDate) {
        const endDateTimestamp = Timestamp.fromDate(options.endDate);
        constraints.push(where('date', '<=', endDateTimestamp));
      }

      if (options.creatorId) {
        constraints.push(where('creator_id', '==', options.creatorId));
      }

      // Handle deleted filter
      if (!options.includeDeleted) {
        constraints.push(where('deleted_at', '==', null));
      }

      // Sort by date descending
      constraints.push(orderBy('date', 'desc'));

      // Apply limit
      if (options.limit) {
        constraints.push(firestoreLimit(options.limit));
      }

      const q = query(this.collectionRef, ...constraints);
      return this.queryDocuments(q);
    });
  }

  /**
   * Create a new log
   * 創建新日誌
   */
  async create(payload: CreateLogRequest): Promise<Log> {
    return this.executeWithRetry(async () => {
      // Validate and normalize date using helper method
      const dateToStore = this.validateAndNormalizeDate(payload.date, true);

      const log = await this.createDocument({
        blueprintId: payload.blueprintId,
        date: dateToStore,
        title: payload.title,
        description: payload.description ?? '',
        workHours: payload.workHours ?? 0,
        workers: payload.workers ?? 0,
        equipment: payload.equipment ?? '',
        weather: payload.weather ?? '',
        temperature: payload.temperature ?? null,
        creatorId: payload.creatorId,
        photos: [],
        deletedAt: null // Required for query filter: where('deleted_at', '==', null)
      });

      this.logger.info('[LogFirestoreRepository]', `Log created with ID: ${log.id}`);

      return log;
    });
  }

  /**
   * Update log
   * 更新日誌
   */
  async update(id: string, payload: UpdateLogRequest): Promise<void> {
    return this.executeWithRetry(async () => {
      const doc = this.toDocument(payload);

      await this.updateDocument(id, doc as Partial<Log>);

      this.logger.info('[LogFirestoreRepository]', `Log updated: ${id}`);
    });
  }

  /**
   * Upload photo to log
   * 上傳照片至日誌
   *
   * @param logId Log ID
   * @param file Photo file
   * @param caption Optional caption
   * @returns LogPhoto with URL
   */
  async uploadPhoto(logId: string, file: File, caption?: string): Promise<LogPhoto> {
    return this.executeWithRetry(async () => {
      // Generate unique filename
      const timestamp = Date.now();
      const path = `${logId}/${timestamp}_${file.name}`;

      // Upload file to Firebase Storage
      const uploadResult = await this.storageRepo.uploadFile(this.photosBucket, path, file, {
        contentType: file.type,
        cacheControl: 'public, max-age=3600'
      });

      const photo: LogPhoto = {
        id: `${timestamp}`,
        url: path,
        publicUrl: uploadResult.publicUrl,
        caption,
        uploadedAt: new Date(),
        size: file.size,
        fileName: file.name
      };

      // Update log photos array
      const logRef = doc(this.firebaseService.db, this.collectionName, logId);
      const logSnap = await getDoc(logRef);

      if (!logSnap.exists()) {
        throw new Error(`Log not found: ${logId}`);
      }

      const currentData = logSnap.data();
      const photos = this.parsePhotos(currentData['photos']);
      photos.push(photo);

      await updateDoc(logRef, { photos });

      this.logger.info('[LogFirestoreRepository]', `Photo uploaded to log: ${logId}`);

      return photo;
    });
  }

  /**
   * Delete photo from log
   * 從日誌刪除照片
   *
   * @param logId Log ID
   * @param photoId Photo ID
   */
  async deletePhoto(logId: string, photoId: string): Promise<void> {
    return this.executeWithRetry(async () => {
      // Get current photos
      const logRef = doc(this.firebaseService.db, this.collectionName, logId);
      const logSnap = await getDoc(logRef);

      if (!logSnap.exists()) {
        throw new Error(`Log not found: ${logId}`);
      }

      const currentData = logSnap.data();
      const photos = this.parsePhotos(currentData['photos']);
      const photoToDelete = photos.find(p => p.id === photoId);

      if (!photoToDelete) {
        throw new Error(`Photo not found: ${photoId}`);
      }

      // Remove from Firebase Storage
      try {
        await this.storageRepo.deleteFile(this.photosBucket, photoToDelete.url);
      } catch (error) {
        this.logger.warn('[LogFirestoreRepository]', 'Failed to delete photo from storage', {
          message: (error as Error).message
        });
      }

      // Update log photos array
      const updatedPhotos = photos.filter(p => p.id !== photoId);

      await updateDoc(logRef, { photos: updatedPhotos });

      this.logger.info('[LogFirestoreRepository]', `Photo deleted from log: ${logId}`);
    });
  }

  /**
   * Soft delete log
   * 軟刪除日誌
   */
  async delete(id: string): Promise<void> {
    return this.executeWithRetry(async () => {
      await this.deleteDocument(id, false);

      this.logger.info('[LogFirestoreRepository]', `Log soft deleted: ${id}`);
    });
  }

  /**
   * Hard delete log (permanent)
   * 永久刪除日誌
   */
  async hardDelete(id: string): Promise<void> {
    return this.executeWithRetry(async () => {
      // First, delete all photos from storage
      const log = await this.getDocument(id);

      if (log && log.photos && log.photos.length > 0) {
        for (const photo of log.photos) {
          try {
            await this.storageRepo.deleteFile(this.photosBucket, photo.url);
          } catch (error) {
            this.logger.warn('[LogFirestoreRepository]', `Failed to delete photo: ${photo.url}`, {
              message: (error as Error).message
            });
          }
        }
      }

      // Then delete the log document
      await this.deleteDocument(id, true);

      this.logger.info('[LogFirestoreRepository]', `Log hard deleted: ${id}`);
    });
  }

  /**
   * Restore soft-deleted log
   * 恢復軟刪除的日誌
   */
  async restore(id: string): Promise<void> {
    return this.executeWithRetry(async () => {
      await this.updateDocument(id, {
        deleted_at: null
      } as any);

      this.logger.info('[LogFirestoreRepository]', `Log restored: ${id}`);
    });
  }

  /**
   * Get logs statistics
   * 取得日誌統計
   */
  async getStatistics(
    blueprintId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalLogs: number;
    totalWorkHours: number;
    totalPhotos: number;
    averageWorkers: number;
  }> {
    return this.executeWithRetry(async () => {
      const constraints: any[] = [where('blueprint_id', '==', blueprintId), where('deleted_at', '==', null)];

      if (startDate) {
        constraints.push(where('date', '>=', Timestamp.fromDate(startDate)));
      }

      if (endDate) {
        constraints.push(where('date', '<=', Timestamp.fromDate(endDate)));
      }

      const q = query(this.collectionRef, ...constraints);
      const logs = await this.queryDocuments(q);

      const totalLogs = logs.length;
      const totalWorkHours = logs.reduce((sum, log) => sum + (log.workHours || 0), 0);
      const totalPhotos = logs.reduce((sum, log) => sum + (log.photos?.length || 0), 0);
      const averageWorkers = totalLogs > 0 ? logs.reduce((sum, log) => sum + (log.workers || 0), 0) / totalLogs : 0;

      return {
        totalLogs,
        totalWorkHours,
        totalPhotos,
        averageWorkers: Math.round(averageWorkers * 10) / 10 // Round to 1 decimal
      };
    });
  }
}
