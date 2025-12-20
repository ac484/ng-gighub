import { inject } from '@angular/core';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  DocumentData,
  FirestoreError,
  Timestamp
} from '@angular/fire/firestore';
import { ErrorTrackingService } from '@core/services/error-tracking.service';
import { FirebaseService } from '@core/services/firebase.service';
import { LoggerService } from '@core/services/logger';

/**
 * Firestore Base Repository
 *
 * 提供所有 Firestore Repository 的基礎功能：
 * - 統一的錯誤處理
 * - 自動重試機制 (Exponential Backoff)
 * - 日誌記錄
 * - 效能追蹤
 * - 型別安全的 CRUD 操作
 *
 * @abstract
 * 所有 Firestore Repository 都應繼承此類
 *
 * @example
 * ```typescript
 * export class TaskFirestoreRepository extends FirestoreBaseRepository<Task> {
 *   protected collectionName = 'tasks';
 *
 *   async findByBlueprint(blueprintId: string): Promise<Task[]> {
 *     return this.executeWithRetry(async () => {
 *       const q = query(
 *         this.collectionRef,
 *         where('blueprint_id', '==', blueprintId),
 *         where('deleted_at', '==', null)
 *       );
 *       return this.queryDocuments(q);
 *     });
 *   }
 * }
 * ```
 */
export abstract class FirestoreBaseRepository<T> {
  protected readonly firebaseService = inject(FirebaseService);
  protected readonly logger = inject(LoggerService);
  protected readonly errorTracking = inject(ErrorTrackingService);

  /**
   * Collection 名稱（子類必須實作）
   */
  protected abstract collectionName: string;

  /**
   * Get Firestore collection reference
   */
  protected get collectionRef() {
    return collection(this.firebaseService.db, this.collectionName);
  }

  /**
   * 將 Firestore 文檔轉換為領域實體
   * 子類必須實作此方法
   */
  protected abstract toEntity(data: DocumentData, id: string): T;

  /**
   * 將領域實體轉換為 Firestore 文檔
   * 子類可選實作（若需要）
   */
  protected toDocument(entity: Partial<T>): DocumentData {
    // Default: spread entity as document
    // Remove undefined values and convert dates
    const doc: DocumentData = {};

    for (const [key, value] of Object.entries(entity)) {
      if (value !== undefined) {
        // Convert Date to Firestore Timestamp
        if (value instanceof Date) {
          doc[key] = Timestamp.fromDate(value);
        } else {
          doc[key] = value;
        }
      }
    }

    return doc;
  }

  /**
   * 執行操作並自動重試（Exponential Backoff）
   *
   * @param operation 要執行的操作
   * @param maxRetries 最大重試次數（預設 3 次）
   * @param baseDelay 基礎延遲時間（預設 1000ms）
   * @returns 操作結果
   * @throws 最後一次錯誤（如果所有重試都失敗）
   */
  protected async executeWithRetry<R>(operation: () => Promise<R>, maxRetries = 3, baseDelay = 1000): Promise<R> {
    let lastError: any;
    const operationName = this.getOperationName();

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const startTime = performance.now();
        const result = await operation();
        const duration = performance.now() - startTime;

        // 記錄成功的操作
        this.logger.debug(`[${this.constructor.name}]`, `${operationName} succeeded (${duration.toFixed(2)}ms)`);

        return result;
      } catch (error: any) {
        lastError = error;

        // 檢查是否為不可重試的錯誤
        if (this.isNonRetryableError(error)) {
          this.logger.error(`[${this.constructor.name}]`, `${operationName} failed with non-retryable error`, error);
          this.errorTracking.trackFirestoreError(this.collectionName, error, {
            operation: operationName,
            retryable: false
          });
          throw error;
        }

        // 計算延遲時間 (exponential backoff with jitter)
        const delay = this.calculateBackoffDelay(attempt, baseDelay);

        this.logger.warn(
          `[${this.constructor.name}]`,
          `${operationName} failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms`,
          {
            error: error.message,
            code: error.code
          }
        );

        // 等待後重試
        await this.sleep(delay);
      }
    }

    // 所有重試都失敗，記錄錯誤並拋出
    this.logger.error(`[${this.constructor.name}]`, `${operationName} failed after ${maxRetries} retries`, lastError);

    this.errorTracking.trackFirestoreError(this.collectionName, lastError, {
      operation: operationName,
      retries: maxRetries,
      finalFailure: true
    });

    throw lastError;
  }

  /**
   * 檢查是否為不可重試的錯誤
   *
   * 不可重試的錯誤類型：
   * - PERMISSION_DENIED: Security rules violation
   * - INVALID_ARGUMENT: Invalid data format
   * - NOT_FOUND: Document not found (for updates)
   * - ALREADY_EXISTS: Document already exists
   * - FAILED_PRECONDITION: Operation precondition failed
   */
  protected isNonRetryableError(error: any): boolean {
    const nonRetryableCodes = [
      'permission-denied',
      'invalid-argument',
      'not-found',
      'already-exists',
      'failed-precondition',
      'out-of-range',
      'unauthenticated'
    ];

    const errorCode = (error as FirestoreError)?.code || '';
    return nonRetryableCodes.includes(errorCode);
  }

  /**
   * 計算 Exponential Backoff 延遲時間（含 Jitter）
   *
   * Formula: delay = baseDelay * (2 ^ attempt) + random(0, 1000)
   * Jitter 避免多個請求同時重試（雷鳴效應）
   */
  protected calculateBackoffDelay(attempt: number, baseDelay: number): number {
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 1000;
    const maxDelay = 30000; // 最大延遲 30 秒

    return Math.min(exponentialDelay + jitter, maxDelay);
  }

  /**
   * 休眠指定毫秒
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 取得目前操作名稱（用於日誌）
   */
  protected getOperationName(): string {
    try {
      const stack = new Error().stack || '';
      const stackLines = stack.split('\n');
      const callerLine = stackLines[3] || '';
      const match = callerLine.match(/at (\w+)/);
      return match ? match[1] : 'unknown operation';
    } catch {
      return 'unknown operation';
    }
  }

  /**
   * Query documents from collection
   *
   * @param q Query with constraints
   * @returns Array of entities
   */
  protected async queryDocuments(q: any): Promise<T[]> {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.toEntity(doc.data() as DocumentData, doc.id));
  }

  /**
   * Get single document by ID
   *
   * @param id Document ID
   * @returns Entity or null
   */
  protected async getDocument(id: string): Promise<T | null> {
    const docRef = doc(this.firebaseService.db, this.collectionName, id);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    return this.toEntity(snapshot.data(), snapshot.id);
  }

  /**
   * Create new document
   *
   * @param entity Entity data
   * @returns Created entity with ID
   */
  protected async createDocument(entity: Partial<T>): Promise<T> {
    const docData = this.toDocument(entity);
    const docRef = await addDoc(this.collectionRef, {
      ...docData,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    });

    const snapshot = await getDoc(docRef);
    return this.toEntity(snapshot.data()!, snapshot.id);
  }

  /**
   * Update existing document
   *
   * @param id Document ID
   * @param entity Partial entity data
   * @returns Updated entity
   */
  protected async updateDocument(id: string, entity: Partial<T>): Promise<T> {
    const docRef = doc(this.firebaseService.db, this.collectionName, id);
    const docData = this.toDocument(entity);

    const updateData = {
      ...docData,
      updated_at: Timestamp.now()
    } as Record<string, any>;

    await updateDoc(docRef, updateData);

    const snapshot = await getDoc(docRef);
    return this.toEntity(snapshot.data()!, snapshot.id);
  }

  /**
   * Delete document (soft delete by default)
   *
   * @param id Document ID
   * @param hard True for hard delete, false for soft delete
   */
  protected async deleteDocument(id: string, hard = false): Promise<void> {
    const docRef = doc(this.firebaseService.db, this.collectionName, id);

    if (hard) {
      await deleteDoc(docRef);
    } else {
      // Soft delete: set deleted_at timestamp
      const updateData = {
        deleted_at: Timestamp.now(),
        updated_at: Timestamp.now()
      } as Record<string, any>;

      await updateDoc(docRef, updateData);
    }
  }

  /**
   * 處理 Firestore 錯誤並轉換為使用者友好的訊息
   */
  protected handleError(error: FirestoreError | any, context: string): never {
    const errorMessage = this.getErrorMessage(error);

    const errorContext: Record<string, unknown> = {
      message: errorMessage,
      code: error.code
    };

    const errorObj = new Error(errorMessage);
    this.logger.error(`[${this.constructor.name}]`, `${context} failed`, errorObj, errorContext);
    this.errorTracking.trackFirestoreError(this.collectionName, error, { context });

    throw new Error(errorMessage);
  }

  /**
   * 取得使用者友好的錯誤訊息
   */
  protected getErrorMessage(error: any): string {
    const errorCode = error?.code || '';

    const errorMessages: Record<string, string> = {
      'permission-denied': 'error.permission-denied',
      'invalid-argument': 'error.invalid-argument',
      'not-found': 'error.not-found',
      'already-exists': 'error.already-exists',
      'failed-precondition': 'error.failed-precondition',
      unauthenticated: 'error.unauthenticated',
      'resource-exhausted': 'error.resource-exhausted',
      unavailable: 'error.service-unavailable'
    };

    return errorMessages[errorCode] || error.message || 'error.unknown-database-error';
  }

  /**
   * 批次執行操作（減少 API 呼叫次數）
   *
   * @param operations 操作陣列
   * @param batchSize 批次大小（預設 100）
   */
  protected async executeBatch<R>(operations: Array<() => Promise<R>>, batchSize = 100): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(op => op()));
      results.push(...batchResults);

      this.logger.debug(`[${this.constructor.name}]`, `Batch ${Math.floor(i / batchSize) + 1} completed`, {
        processed: results.length,
        total: operations.length
      });
    }

    return results;
  }

  /**
   * 取得 collection 名稱（供子類使用）
   */
  protected getCollectionName(): string {
    return this.collectionName;
  }
}
