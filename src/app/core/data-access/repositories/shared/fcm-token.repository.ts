/**
 * FCM Token Repository
 *
 * Manages Firebase Cloud Messaging tokens in Firestore.
 * Follows Repository pattern for data access abstraction.
 *
 * @architecture
 * - Repository Layer: Data access abstraction
 * - Uses Firestore for persistence
 * - Handles token lifecycle (create, update, delete)
 *
 * @security
 * - Protected by Firestore Security Rules
 * - Users can only access their own tokens
 */
import { Injectable, inject } from '@angular/core';
import { Firestore, doc, setDoc, getDoc, deleteDoc, Timestamp, DocumentReference } from '@angular/fire/firestore';
import { LoggerService } from '@core/services/logger/logger.service';

/**
 * FCM Token Document
 */
export interface FcmToken {
  /** User ID (document ID) */
  readonly userId: string;

  /** FCM registration token */
  token: string;

  /** Device/browser identifier (optional) */
  deviceId?: string;

  /** Device type (web/mobile) */
  deviceType: 'web' | 'mobile';

  /** Browser/Platform info */
  platform?: string;

  /** Token creation timestamp */
  createdAt: Date;

  /** Last updated timestamp */
  updatedAt: Date;

  /** Last time token was verified as valid */
  lastVerifiedAt?: Date;

  /** Whether token is currently active */
  active: boolean;
}

/**
 * Create FCM Token Data
 */
export interface CreateFcmTokenData {
  userId: string;
  token: string;
  deviceId?: string;
  deviceType?: 'web' | 'mobile';
  platform?: string;
}

/**
 * Update FCM Token Data
 */
export interface UpdateFcmTokenData {
  token?: string;
  deviceId?: string;
  platform?: string;
  lastVerifiedAt?: Date;
  active?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FcmTokenRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly collectionName = 'fcm_tokens';

  private getDocRef(userId: string): DocumentReference {
    return doc(this.firestore, this.collectionName, userId);
  }

  private toFcmToken(data: Record<string, unknown>, userId: string): FcmToken {
    return {
      userId,
      token: data['token'] as string,
      deviceId: data['deviceId'] as string | undefined,
      deviceType: (data['deviceType'] as 'web' | 'mobile' | undefined) ?? 'web',
      platform: data['platform'] as string | undefined,
      createdAt: data['createdAt'] instanceof Timestamp ? data['createdAt'].toDate() : new Date(data['createdAt'] as string),
      updatedAt: data['updatedAt'] instanceof Timestamp ? data['updatedAt'].toDate() : new Date(data['updatedAt'] as string),
      lastVerifiedAt: data['lastVerifiedAt'] instanceof Timestamp ? data['lastVerifiedAt'].toDate() : undefined,
      active: (data['active'] as boolean | undefined) ?? true
    };
  }

  /**
   * Find FCM token by user ID
   *
   * @param userId User ID
   * @returns FCM token or null if not found
   */
  async findByUserId(userId: string): Promise<FcmToken | null> {
    try {
      const docRef = this.getDocRef(userId);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        return null;
      }

      return this.toFcmToken(snapshot.data(), userId);
    } catch (error) {
      this.logger.error('[FcmTokenRepository]', 'findByUserId failed', error as Error);
      return null;
    }
  }

  /**
   * Save or update FCM token
   *
   * @param data Token data
   * @returns Saved FCM token
   */
  async save(data: CreateFcmTokenData): Promise<FcmToken> {
    const now = Timestamp.now();
    const userId = data.userId;

    try {
      // Check if token already exists
      const existing = await this.findByUserId(userId);

      const payload = {
        token: data.token,
        deviceId: data.deviceId ?? this.generateDeviceId(),
        deviceType: data.deviceType ?? 'web',
        platform: data.platform ?? this.detectPlatform(),
        active: true,
        updatedAt: now,
        ...(existing ? {} : { createdAt: now })
      };

      const docRef = this.getDocRef(userId);
      await setDoc(docRef, payload, { merge: true });

      this.logger.info('[FcmTokenRepository]', `FCM token saved for user ${userId}`);

      return this.toFcmToken({ ...payload, createdAt: existing?.createdAt ?? now }, userId);
    } catch (error) {
      this.logger.error('[FcmTokenRepository]', 'save failed', error as Error);
      throw error;
    }
  }

  /**
   * Update FCM token
   *
   * @param userId User ID
   * @param data Update data
   */
  async update(userId: string, data: UpdateFcmTokenData): Promise<void> {
    try {
      const docRef = this.getDocRef(userId);
      const payload: Record<string, unknown> = {
        ...data,
        updatedAt: Timestamp.now()
      };

      // Convert Date to Timestamp
      if (data.lastVerifiedAt) {
        payload['lastVerifiedAt'] = Timestamp.fromDate(data.lastVerifiedAt);
      }

      await setDoc(docRef, payload, { merge: true });

      this.logger.info('[FcmTokenRepository]', `FCM token updated for user ${userId}`);
    } catch (error) {
      this.logger.error('[FcmTokenRepository]', 'update failed', error as Error);
      throw error;
    }
  }

  /**
   * Delete FCM token
   *
   * @param userId User ID
   */
  async delete(userId: string): Promise<void> {
    try {
      const docRef = this.getDocRef(userId);
      await deleteDoc(docRef);

      this.logger.info('[FcmTokenRepository]', `FCM token deleted for user ${userId}`);
    } catch (error) {
      this.logger.error('[FcmTokenRepository]', 'delete failed', error as Error);
      throw error;
    }
  }

  /**
   * Mark token as inactive (soft delete)
   *
   * @param userId User ID
   */
  async deactivate(userId: string): Promise<void> {
    await this.update(userId, { active: false });
  }

  /**
   * Verify token is still valid
   *
   * @param userId User ID
   */
  async markAsVerified(userId: string): Promise<void> {
    await this.update(userId, { lastVerifiedAt: new Date(), active: true });
  }

  /**
   * Generate a device ID based on browser fingerprint
   */
  private generateDeviceId(): string {
    // Simple device ID generation based on user agent and screen
    if (typeof navigator === 'undefined' || typeof screen === 'undefined') {
      return 'ssr-device';
    }

    const ua = navigator.userAgent;
    const screenResolution = `${screen.width}x${screen.height}`;
    // Use userAgentData.platform when available, fallback to deprecated navigator.platform
    const navAny = navigator as { userAgentData?: { platform?: string } };
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const platform = navAny.userAgentData?.platform ?? navigator.platform;

    // Create a simple hash
    const str = `${ua}-${screenResolution}-${platform}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return `web-${Math.abs(hash).toString(36)}`;
  }

  /**
   * Detect current platform
   */
  private detectPlatform(): string {
    if (typeof navigator === 'undefined') {
      return 'unknown';
    }

    const ua = navigator.userAgent.toLowerCase();

    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('safari')) return 'Safari';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('edge')) return 'Edge';
    if (ua.includes('opera')) return 'Opera';

    return 'Unknown';
  }
}
