import { inject, Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private readonly auth = inject(Auth);

  getCurrentUserId(): string | null {
    return this.auth.currentUser?.uid ?? null;
  }

  getCurrentUser(): import('@angular/fire/auth').User | null {
    return this.auth.currentUser;
  }

  currentUser(): import('@angular/fire/auth').User | null {
    return this.getCurrentUser();
  }
}
