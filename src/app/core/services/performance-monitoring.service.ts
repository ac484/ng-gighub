import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PerformanceMonitoringService {
  private readonly monitoring = signal(false);

  isMonitoring(): boolean {
    return this.monitoring();
  }

  startMonitoring(): void {
    this.monitoring.set(true);
  }
}
