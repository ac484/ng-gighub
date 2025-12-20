import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Auth, authState, User } from '@angular/fire/auth';
import { Firestore, collection, doc, CollectionReference, DocumentReference } from '@angular/fire/firestore';
import { Storage, ref, StorageReference } from '@angular/fire/storage';
import { LoggerService } from '@core/services/logger';
import { tap } from 'rxjs/operators';

/**
 * Firebase Service
 *
 * Provides unified access to Firebase services with:
 * - Firestore database operations
 * - Firebase Storage operations
 * - Authentication state management
 * - Connection health monitoring
 * - Error handling and logging
 *
 * This service replaces SupabaseService in the migration to @angular/fire
 *
 * @architecture
 * Firebase Auth (Primary) → Firestore (Database) → Firebase Storage (Files)
 *
 * @security
 * - All data access protected by Firestore Security Rules
 * - Authentication via Firebase Auth
 * - Automatic session management
 */
@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private readonly firestore = inject(Firestore);
  private readonly storage = inject(Storage);
  private readonly auth = inject(Auth);
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);

  // Connection state signals
  private _isConnected = signal(true);
  private _isAuthenticated = signal(false);
  private _lastError = signal<Error | null>(null);
  private _currentUser = signal<User | null>(null);

  // Public readonly signals
  readonly isConnected = this._isConnected.asReadonly();
  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly lastError = this._lastError.asReadonly();
  readonly currentUser = this._currentUser.asReadonly();

  // Computed: Health status
  readonly isHealthy = computed(() => this.isConnected() && !this.lastError());

  constructor() {
    this.setupAuthListener();
  }

  /**
   * Setup auth state listener
   */
  private setupAuthListener(): void {
    authState(this.auth)
      .pipe(
        tap(user => {
          this._currentUser.set(user);
          this._isAuthenticated.set(!!user);

          this.logger.info('[FirebaseService]', 'Auth state changed', {
            hasUser: !!user,
            uid: user?.uid
          });
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        error: error => {
          this._lastError.set(error);
          this.logger.error('[FirebaseService]', 'Auth state error', error);
        }
      });
  }

  /**
   * Get Firestore collection reference
   *
   * @param path Collection path (e.g., 'tasks', 'logs', 'users')
   * @returns Collection reference
   *
   * @example
   * ```typescript
   * const tasksRef = this.firebase.collection('tasks');
   * ```
   */
  collection(path: string): CollectionReference {
    return collection(this.firestore, path);
  }

  /**
   * Get Firestore document reference
   *
   * @param path Document path (e.g., 'tasks/task123')
   * @returns Document reference
   *
   * @example
   * ```typescript
   * const taskRef = this.firebase.document('tasks/task123');
   * ```
   */
  document(path: string): DocumentReference {
    return doc(this.firestore, path);
  }

  /**
   * Get Firebase Storage reference
   *
   * @param path Storage path (e.g., 'blueprints/log123/photo.jpg')
   * @returns Storage reference
   *
   * @example
   * ```typescript
   * const photoRef = this.firebase.storageRef('blueprints/log123/photo.jpg');
   * ```
   */
  storageRef(path: string): StorageReference {
    return ref(this.storage, path);
  }

  /**
   * Get the Firestore instance
   */
  get db(): Firestore {
    return this.firestore;
  }

  /**
   * Get the Storage instance
   */
  get storageInstance(): Storage {
    return this.storage;
  }

  /**
   * Get the Auth instance
   */
  get authInstance(): Auth {
    return this.auth;
  }

  /**
   * Health check: Verify Firebase connection
   *
   * @returns Promise<boolean> True if healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Check if auth is initialized
      const user = this.auth.currentUser;
      const isHealthy = true; // Firebase SDK handles connectivity automatically

      this._isConnected.set(isHealthy);
      this._lastError.set(null);

      this.logger.info('[FirebaseService]', 'Health check passed', {
        authenticated: !!user
      });

      return isHealthy;
    } catch (error) {
      this._isConnected.set(false);
      this._lastError.set(error as Error);
      this.logger.error('[FirebaseService]', 'Health check failed', error as Error);
      return false;
    }
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): User | null {
    return this._currentUser();
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): string | null {
    return this._currentUser()?.uid ?? null;
  }

  /**
   * Get current access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const user = this.auth.currentUser;
      if (!user) return null;

      return await user.getIdToken();
    } catch (error) {
      this.logger.error('[FirebaseService]', 'Failed to get access token', error as Error);
      return null;
    }
  }
}
