/**
 * Weather Module View Component
 * 氣象模組視圖元件
 *
 * Purpose: Main weather module container
 * Usage: Can be used standalone or embedded in other modules
 *
 * ✅ High Cohesion: Weather data display only
 * ✅ Low Coupling: Communicates via service layer
 * ✅ Extensible: Easy to add new weather data types
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { WeatherCardComponent } from './components/weather-card.component';
import type { WeatherDisplayMode } from './types/weather.types';

@Component({
  selector: 'app-weather-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, WeatherCardComponent],
  template: `
    <div class="weather-module">
      <!-- Full view mode -->
      @if (displayMode() === 'full') {
        <nz-row [nzGutter]="16">
          <nz-col [nzSpan]="12">
            <app-weather-card mode="forecast" [countyName]="countyName()" [autoRefresh]="autoRefresh()" />
          </nz-col>
          <nz-col [nzSpan]="12">
            <app-weather-card mode="observation" [stationId]="stationId()" [autoRefresh]="autoRefresh()" />
          </nz-col>
        </nz-row>
        <nz-row [nzGutter]="16" class="mt-md">
          <nz-col [nzSpan]="24">
            <app-weather-card mode="alert" [autoRefresh]="autoRefresh()" />
          </nz-col>
        </nz-row>
      }

      <!-- Compact view mode -->
      @else if (displayMode() === 'compact') {
        <app-weather-card mode="compact" [countyName]="countyName()" [stationId]="stationId()" [autoRefresh]="autoRefresh()" />
      }

      <!-- Single card mode -->
      @else {
        <app-weather-card [mode]="displayMode()" [countyName]="countyName()" [stationId]="stationId()" [autoRefresh]="autoRefresh()" />
      }
    </div>
  `,
  styles: [
    `
      .weather-module {
        display: block;
      }
    `
  ]
})
export class WeatherModuleViewComponent {
  // Input signals
  displayMode = input<WeatherDisplayMode>('compact');
  countyName = input<string>('臺北市');
  stationId = input<string | undefined>(undefined);
  autoRefresh = input<boolean>(false);
}
