# Weather Module (氣象模組)

## Overview

A minimal, highly cohesive weather module for displaying Taiwan CWA weather data. Designed for embedding in dashboards, overviews, and other modules.

## Architecture Principles

✅ **High Cohesion**: Single responsibility - weather data display  
✅ **Low Coupling**: Communicates via Firebase callable functions  
✅ **Extensible**: Easy to add new weather data types  
✅ **Minimal Code**: Achieves functionality with minimal implementation

## Module Structure

```
weather/
├── types/
│   └── weather.types.ts           # Type definitions
├── services/
│   └── weather.service.ts         # Firebase function calls
├── components/
│   └── weather-card.component.ts  # Reusable card component
├── weather-module-view.component.ts  # Main module view
├── index.ts                       # Public API
└── README.md                      # This file
```

## Usage

### Standalone Module (Full View)

```typescript
// In blueprint dashboard or overview
<app-weather-module-view
  displayMode="full"
  countyName="臺北市"
  [autoRefresh]="true"
/>
```

### Embedded Compact View

```typescript
// In any other module
<app-weather-module-view
  displayMode="compact"
  countyName="新北市"
/>
```

### Individual Card Component

```typescript
// Forecast only
<app-weather-card
  mode="forecast"
  countyName="高雄市"
/>

// Observation only
<app-weather-card
  mode="observation"
  stationId="466920"
/>

// Alerts only
<app-weather-card
  mode="alert"
/>
```

## Display Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `full` | All weather data (forecast, observation, alerts) | Dedicated weather page |
| `compact` | Forecast + observation in one card | Dashboard widget |
| `forecast` | 36-hour forecast only | Forecast-specific view |
| `observation` | Real-time observation only | Current conditions |
| `alert` | Weather warnings only | Alert monitoring |

## Configuration

### Input Signals

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `displayMode` | `WeatherDisplayMode \| 'full'` | `'compact'` | Display mode |
| `countyName` | `string` | `'臺北市'` | County for forecast |
| `stationId` | `string \| undefined` | `undefined` | Station for observation |
| `autoRefresh` | `boolean` | `false` | Auto-refresh enabled |
| `refreshInterval` | `number` | `600000` | Refresh interval (ms) |

### County Names (支援的縣市)

- 臺北市, 新北市, 桃園市, 臺中市, 臺南市, 高雄市
- 基隆市, 新竹市, 新竹縣, 苗栗縣, 彰化縣, 南投縣
- 雲林縣, 嘉義市, 嘉義縣, 屏東縣, 宜蘭縣, 花蓮縣
- 臺東縣, 澎湖縣, 金門縣, 連江縣

## API Functions Used

| Function | Purpose | Cloud Function Name |
|----------|---------|---------------------|
| Forecast | 36-hour weather forecast | `getForecast36Hour` |
| Observation | Current weather observation | `getObservation` |
| Alerts | Weather warnings | `getWeatherWarnings` |

## Public Interface

```typescript
// Main component
export { WeatherModuleViewComponent } from './weather-module-view.component';

// Reusable card
export { WeatherCardComponent } from './components/weather-card.component';

// Service (for direct calls if needed)
export { WeatherService } from './services/weather.service';

// Types
export type {
  WeatherForecast,
  WeatherObservation,
  WeatherAlert,
  WeatherDisplayMode,
  WeatherResult
} from './types/weather.types';
```

## Examples

### Dashboard Widget

```typescript
@Component({
  template: `
    <nz-row [nzGutter]="16">
      <nz-col [nzSpan]="16">
        <!-- Main dashboard content -->
      </nz-col>
      <nz-col [nzSpan]="8">
        <!-- Weather widget -->
        <app-weather-card mode="compact" [autoRefresh]="true" />
      </nz-col>
    </nz-row>
  `
})
export class DashboardComponent {}
```

### Overview Page

```typescript
@Component({
  template: `
    <!-- Overview sections -->
    <app-statistics />
    <app-recent-activities />

    <!-- Weather section -->
    <app-weather-module-view
      displayMode="full"
      [countyName]="projectLocation()"
    />
  `
})
export class OverviewComponent {
  projectLocation = signal('臺中市');
}
```

### Direct Service Usage

```typescript
export class CustomWeatherComponent {
  private weatherService = inject(WeatherService);

  async loadCustomWeather(): Promise<void> {
    const forecast = await this.weatherService.getForecast('臺北市');
    const observation = await this.weatherService.getObservation('466920');
    const alerts = await this.weatherService.getAlerts();

    // Process data...
  }
}
```

## Error Handling

- All errors are caught and displayed in the UI
- Loading states are managed with signals
- Error messages are user-friendly
- Automatic retry on transient failures (handled by functions-integration)

## Performance

- Lazy loading: Module loads only when needed
- Signal-based reactivity: Minimal re-renders
- OnPush change detection: Maximum efficiency
- Optional auto-refresh: Configurable interval

## Testing

```typescript
// Example usage in tests
const fixture = TestBed.createComponent(WeatherModuleViewComponent);
fixture.componentRef.setInput('countyName', '高雄市');
fixture.componentRef.setInput('displayMode', 'compact');
fixture.detectChanges();
```

## Future Enhancements

- [ ] 7-day forecast display
- [ ] Township-level forecasts
- [ ] Interactive weather maps
- [ ] Historical weather data
- [ ] Weather trend charts
- [ ] Customizable themes
- [ ] Mobile-optimized views

## Dependencies

- `@angular/fire/functions` - Firebase callable functions
- `ng-zorro-antd` - UI components
- `@core/services/logger` - Logging service
- `@shared` - Shared utilities

## Notes

- Module is **read-only** - no weather data modification
- All API calls require Firebase authentication
- API key is configured in functions-integration
- Data is cached in Firestore by functions-integration
- Refresh intervals should be ≥ 5 minutes to respect API rate limits
