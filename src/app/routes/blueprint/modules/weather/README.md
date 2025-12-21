# Weather Module (氣象模組)

## Overview

A minimal, highly cohesive weather module for displaying Taiwan CWA weather data. Designed for embedding in dashboards, overviews, and other modules.

**✨ Architecture**: Firebase Cloud Functions integration with client-side caching

## Architecture Principles

✅ **High Cohesion**: Single responsibility - weather data display  
✅ **Low Coupling**: Uses Firebase Cloud Functions (no direct API dependency)  
✅ **Extensible**: Easy to add new weather data types  
✅ **Secure**: API keys managed via Firebase Secrets  
✅ **CORS-Free**: Cloud Functions act as proxy to CWA API  
✅ **Cached**: Multi-layer caching (client + Firebase Functions)

## Module Structure

```
weather/
├── types/
│   ├── weather.types.ts           # Public type definitions
│   └── cwa-api.types.ts           # CWA API models and constants
├── services/
│   ├── weather.service.ts         # Main business logic service
│   └── weather-cache.service.ts   # Local cache management
├── components/
│   └── weather-card.component.ts  # Reusable card component
├── weather-module-view.component.ts  # Main module view
├── index.ts                       # Public API
└── README.md                      # This file
```

## Architecture Flow

```
┌─────────────┐
│  Component  │
└──────┬──────┘
       │
       ↓
┌──────────────────┐
│ WeatherService   │ ← Client-side cache
└──────┬───────────┘
       │
       ↓ httpsCallable()
┌──────────────────────────────┐
│ Firebase Cloud Functions     │
│ (functions-integration)      │
│  - getForecast36Hour         │
│  - getObservation            │
│  - getWeatherWarnings        │
└──────┬───────────────────────┘
       │
       ↓ fetch() + API Key
┌──────────────────────────────┐
│ CWA OpenData API             │
│ opendata.cwa.gov.tw          │
└──────────────────────────────┘
```

## Architecture Layers

### 1. Presentation Layer
- **WeatherModuleViewComponent**: Full weather display
- **WeatherCardComponent**: Reusable compact widget

### 2. Business Logic Layer
- **WeatherService**: 
  - Calls Firebase Cloud Functions via `httpsCallable()`
  - Manages client-side cache with TTL
  - Transforms responses to simplified domain models

### 3. Infrastructure Layer (Backend)
- **Firebase Cloud Functions** (in `functions-integration/src/weather/`)
  - Handles CWA API authentication (API key in Firebase Secrets)
  - Implements retry logic and error handling
  - Provides CORS-free proxy to CWA API

## Prerequisites

### 1. Firebase Cloud Functions Deployment

The weather module requires Firebase Cloud Functions to be deployed:

```bash
# Navigate to functions-integration
cd functions-integration

# Install dependencies
yarn install

# Set CWA API key as Firebase secret
firebase functions:secrets:set CWA_API_KEY

# Deploy weather functions
firebase deploy --only functions:getForecast36Hour,functions:getObservation,functions:getWeatherWarnings
```

### 2. Get CWA API Key

Register at https://opendata.cwa.gov.tw/ to obtain your API key.

## Configuration

No frontend configuration needed! API key is securely stored in Firebase Secrets.

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

## API Integration

### Firebase Cloud Functions

This module uses **Firebase Cloud Functions** as a proxy to CWA OpenData API:

```typescript
export class WeatherService {
  private readonly functions = inject(Functions);
  private readonly cache = inject(WeatherCacheService);
  
  async getForecast(countyName: string): Promise<WeatherForecast | null> {
    // Check cache first
    const cached = this.cache.get<WeatherForecast>(`forecast_${countyName}`);
    if (cached) return cached;
    
    // Call Cloud Function
    const getForecast36Hour = httpsCallable<ForecastRequest, CloudFunctionResponse<any>>(
      this.functions,
      'getForecast36Hour'
    );
    
    const result = await getForecast36Hour({ countyName });
    
    // Transform and cache
    const forecast = this.transformForecast(result.data.data.records.location[0]);
    this.cache.set(`forecast_${countyName}`, forecast, 3600); // 1 hour TTL
    
    return forecast;
  }
}
```

### Available Cloud Functions

| Function | Purpose | Parameters |
|----------|---------|------------|
| `getForecast36Hour` | 36-hour forecast | `{ countyName: string }` |
| `getForecast7Day` | 7-day forecast | `{ countyName: string }` |
| `getTownshipForecast` | Township forecast | `{ countyCode: string, townshipName?: string }` |
| `getObservation` | Current weather | `{ stationId?: string }` |
| `get10MinObservation` | 10-min observation | `{ stationId?: string }` |
| `getRainfallObservation` | Rainfall data | `{ stationId?: string }` |
| `getUvIndexObservation` | UV index | `{}` |
| `getWeatherWarnings` | Weather alerts | `{ alertType?: string }` |

### Cache Management

```typescript
// Clear all cache
weatherService.clearCache();

// Clear expired entries only
weatherService.clearExpiredCache();

// Access cache service directly
const cacheService = inject(WeatherCacheService);
const stats = cacheService.getStats(); // { total: number, size: number }
```

### Cache TTL (Time-to-Live)

| Data Type | TTL | Reason |
|-----------|-----|--------|
| Forecast | 1 hour (3600s) | CWA updates every 6 hours |
| Observation | 10 minutes (600s) | Real-time data updates |
| Alerts | 5 minutes (300s) | Urgent information |

## Public Interface

```typescript
// Main component
export { WeatherModuleViewComponent } from './weather-module-view.component';

// Reusable card
export { WeatherCardComponent } from './components/weather-card.component';

// Services
export { WeatherService } from './services/weather.service';
export { WeatherCacheService } from './services/weather-cache.service';

// Types
export type {
  WeatherForecast,
  WeatherObservation,
  WeatherAlert,
  WeatherDisplayMode,
  WeatherResult
} from './types/weather.types';

// CWA API types (advanced usage)
export type {
  CwaApiResponse,
  CwaForecastResponse,
  CwaObservationResponse
} from './types/cwa-api.types';

export { CWA_API_ENDPOINTS, WEATHER_ELEMENTS, COUNTY_CODES } from './types/cwa-api.types';
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
- Automatic retry logic handled by Cloud Functions (exponential backoff)
- Timeout protection (30 seconds per function call)

## Performance

- **Lazy loading**: Module loads only when needed
- **Signal-based reactivity**: Minimal re-renders
- **OnPush change detection**: Maximum efficiency
- **Multi-layer caching**: 
  - Client-side: LocalStorage with TTL
  - Backend: Firebase Functions cache (optional)
- **Cache-first strategy**: Instant data display for repeat visits
- **Optional auto-refresh**: Configurable interval

## Testing

```typescript
// Example usage in tests
const fixture = TestBed.createComponent(WeatherModuleViewComponent);
fixture.componentRef.setInput('countyName', '高雄市');
fixture.componentRef.setInput('displayMode', 'compact');
fixture.detectChanges();
```

## Security Considerations

✅ **API Key Security**: The CWA API key is stored securely in Firebase Secrets, not in frontend code or version control.

✅ **CORS Protection**: Firebase Cloud Functions act as a proxy, eliminating browser CORS restrictions.

✅ **Rate Limiting**: Backend Cloud Functions can implement rate limiting to protect against abuse.

⚠️ **Authentication**: Cloud Functions require Firebase Authentication. Unauthenticated users cannot access weather data.

## Dependencies

- `@angular/fire/functions` - Firebase Cloud Functions integration
- `@angular/common/http` - HttpClient (not used directly for CWA API)
- `ng-zorro-antd` - UI components
- `@core/services/logger` - Logging service
- `@shared` - Shared utilities

## Troubleshooting

### ❌ "CORS policy" error

**Cause**: Frontend trying to call CWA API directly (old architecture)

**Solution**: 
1. Verify `weather.service.ts` is using `httpsCallable()` from `@angular/fire/functions`
2. Check that `cwa-api.client.ts` has been removed from the frontend
3. Ensure Firebase Cloud Functions are deployed

### ❌ "unauthenticated" error

**Cause**: User is not logged in to Firebase

**Solution**: Weather module requires Firebase Authentication. Ensure user is signed in.

### ❌ "CWA_API_KEY not configured" error

**Cause**: API key secret not set in Firebase

**Solution**:
```bash
firebase functions:secrets:set CWA_API_KEY
# Enter your CWA API key when prompted
```

### ❌ "Failed to fetch forecast" error

**Cause**: Multiple possible causes

**Debug Steps**:
1. Check Firebase Functions logs: `firebase functions:log`
2. Verify CWA API is accessible: https://opendata.cwa.gov.tw/
3. Check API key validity at CWA website
4. Ensure Functions are deployed and running

### ⚠️ Slow performance

**Possible Causes**:
- Cold start (first Cloud Function invocation)
- No client-side cache hit
- CWA API slow response

**Optimization**:
- Enable client-side caching (default)
- Consider pre-warming Functions for frequently accessed data
- Increase cache TTL if acceptable

## Architecture Comparison

**Before** (Direct CWA API):
```
Frontend → CWA API → ❌ CORS Error
```

**After** (Firebase Cloud Functions):
```
Frontend → Firebase Functions → CWA API → ✅ Success
```

**Benefits**:
- ✅ No CORS issues
- ✅ Secure API key management
- ✅ Backend caching and retry logic
- ✅ Centralized error handling
- ✅ Rate limiting control

**Trade-offs**:
- Additional latency (Functions cold start: ~1-2s first time)
- Firebase Functions cost (but within free tier for typical usage)

## Future Enhancements

- [ ] 7-day forecast display
- [ ] Township-level forecasts
- [ ] Interactive weather maps
- [ ] Historical weather data
- [ ] Weather trend charts
- [ ] Customizable themes
- [ ] Mobile-optimized views
- [ ] Service Worker offline caching

## Notes

- Module is **read-only** - no weather data modification
- Authentication required via Firebase Auth
- API key managed securely in Firebase Secrets
- Data cached locally in browser LocalStorage
- Refresh intervals should be ≥ 5 minutes to respect API rate limits
- Firebase Functions provide automatic scaling and availability
