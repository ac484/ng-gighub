import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ErrorTrackingService {
  private readonly tracking = signal(false);

  isTracking(): boolean {
    return this.tracking();
  }

  startTracking(): void {
    this.tracking.set(true);
  }
}
