import { inject, Injectable, computed, signal } from '@angular/core';
import {
  Auth,
  User,
  authState,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut
} from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirebaseAuthService {
  private readonly auth = inject(Auth);
  readonly user$: Observable<User | null> = authState(this.auth);
  private readonly _loading = signal(false);
  readonly loading = this._loading.asReadonly();

  get currentUser(): User | null {
    return this.auth.currentUser;
  }

  async signIn(email: string, password: string): Promise<User> {
    this._loading.set(true);
    try {
      const credential = await signInWithEmailAndPassword(this.auth, email, password);
      return credential.user;
    } finally {
      this._loading.set(false);
    }
  }

  async signUp(email: string, password: string): Promise<User> {
    this._loading.set(true);
    try {
      const credential = await createUserWithEmailAndPassword(this.auth, email, password);
      return credential.user;
    } finally {
      this._loading.set(false);
    }
  }

  async signOut(): Promise<void> {
    return firebaseSignOut(this.auth);
  }

  // Backward-compatible aliases
  async signInWithEmailAndPassword(email: string, password: string): Promise<User> {
    return this.signIn(email, password);
  }

  async signUpWithEmailAndPassword(email: string, password: string): Promise<User> {
    return this.signUp(email, password);
  }

  async sendPasswordReset(email: string): Promise<void> {
    return sendPasswordResetEmail(this.auth, email);
  }

  /**
   * Synchronous accessor for template bindings
   */
  readonly isAuthenticated = computed(() => !!this.currentUser);
}
