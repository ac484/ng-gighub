import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User, authState } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { AccountRepository } from '@core/repositories';
import { DA_SERVICE_TOKEN, ITokenService } from '@delon/auth';
import { SettingsService } from '@delon/theme';
import { Observable, map } from 'rxjs';

/**
 * Firebase Authentication Service
 *
 * This service bridges Firebase Auth with @delon/auth's token service (DA_SERVICE_TOKEN)
 * and @delon/theme's SettingsService for user information.
 * It provides methods for email/password authentication and syncs the Firebase user
 * state with both services.
 */
@Injectable({
  providedIn: 'root'
})
export class FirebaseAuthService {
  private readonly auth = inject(Auth);
  private readonly tokenService = inject(DA_SERVICE_TOKEN);
  private readonly settingsService = inject(SettingsService);
  private readonly router = inject(Router);
  private readonly accountRepository = inject(AccountRepository);
  private readonly injector = inject(Injector);

  /**
   * Get the current Firebase user as an Observable
   */
  get user$(): Observable<User | null> {
    return authState(this.auth);
  }

  /**
   * Get the current Firebase user
   */
  get currentUser(): User | null {
    return this.auth.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  get isAuthenticated$(): Observable<boolean> {
    return this.user$.pipe(map(user => !!user));
  }

  constructor() {
    // Sync Firebase auth state with Delon services
    this.user$.subscribe(user => {
      if (user) {
        // User is signed in, update token service and settings
        this.syncUserToServices(user);
      } else {
        // User is signed out, clear token and user info
        this.tokenService.clear();
        this.settingsService.setUser({});
      }
    });
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmailAndPassword(email: string, password: string): Promise<User> {
    try {
      const credential = await runInInjectionContext(this.injector, () => signInWithEmailAndPassword(this.auth, email, password));
      await this.syncUserToServices(credential.user);
      return credential.user;
    } catch (error: any) {
      console.error('Firebase sign in error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Sign up with email and password
   */
  async signUpWithEmailAndPassword(email: string, password: string): Promise<User> {
    try {
      const credential = await runInInjectionContext(this.injector, () => createUserWithEmailAndPassword(this.auth, email, password));

      // Create account document in Firestore
      await this.accountRepository.create({
        uid: credential.user.uid,
        name: credential.user.displayName || email.split('@')[0],
        email: credential.user.email || email,
        avatar_url: credential.user.photoURL || null
      });

      await this.syncUserToServices(credential.user);
      return credential.user;
    } catch (error: any) {
      console.error('Firebase sign up error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
      this.tokenService.clear();
      this.router.navigateByUrl('/passport/login');
    } catch (error: any) {
      console.error('Firebase sign out error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Sync Firebase user to Delon services (token service and settings service)
   */
  private async syncUserToServices(user: User): Promise<void> {
    try {
      // Get the ID token from Firebase
      const idToken = await user.getIdToken();

      // Extract user name with improved fallback logic
      const displayName = this.getDisplayName(user);

      // Set the token in Delon's token service
      // The token format follows @delon/auth's ITokenModel
      this.tokenService.set({
        token: idToken,
        email: user.email || '',
        uid: user.uid,
        name: displayName,
        // Set expiration to 1 hour from now (Firebase tokens typically expire after 1 hour)
        expired: Date.now() + 3600000
      });

      // Set user info in SettingsService for UI display
      // Use Firebase user properties or generate placeholder avatar
      this.settingsService.setUser({
        name: displayName,
        email: user.email || '',
        avatar: user.photoURL || this.generateAvatarUrl(user.email || '')
      });
    } catch (error) {
      console.error('Error syncing user to services:', error);
    }
  }

  /**
   * Get display name for user with improved fallback logic
   *
   * Priority: displayName (if not 'user') > email prefix (if not 'user') > full email > UID prefix
   * This prevents "USER" from appearing in the UI
   */
  private getDisplayName(user: User): string {
    // Check displayName first (but avoid generic 'user')
    if (user.displayName && user.displayName.toLowerCase() !== 'user') {
      return user.displayName;
    }

    // Use email if available
    if (user.email) {
      const emailPrefix = user.email.split('@')[0];
      // Avoid generic 'user' prefix, prefer full email
      if (emailPrefix && emailPrefix.toLowerCase() !== 'user') {
        return emailPrefix;
      }
      // Return full email as fallback
      return user.email;
    }

    // Last resort: use UID prefix (better than generic '使用者')
    return `用戶-${user.uid.substring(0, 8)}`;
  }

  /**
   * Generate a placeholder avatar URL using a service like ui-avatars.com
   * This provides a default avatar for users without a photoURL
   */
  private generateAvatarUrl(email: string): string {
    const name = email.split('@')[0];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`;
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: any): string {
    const errorCode = error.code || '';

    switch (errorCode) {
      case 'auth/invalid-email':
        return 'validation.email.wrong-format';
      case 'auth/user-disabled':
        return 'auth.user-disabled';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'auth.invalid-credentials';
      case 'auth/email-already-in-use':
        return 'auth.email-already-exists';
      case 'auth/weak-password':
        return 'validation.password.strength.short';
      case 'auth/operation-not-allowed':
        return 'auth.operation-not-allowed';
      case 'auth/too-many-requests':
        return 'auth.too-many-requests';
      default:
        return error.message || 'auth.unknown-error';
    }
  }
}
