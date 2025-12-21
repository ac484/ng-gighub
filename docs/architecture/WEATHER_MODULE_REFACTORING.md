# Weather Module Architecture Refactoring

> Design document for refactoring weather module to achieve high cohesion, low coupling, and extensibility

## 📋 Problem Statement

### Current Issues

1. **Low Cohesion**: `functions-integration` mixes two responsibilities
   - External API integration (CWA API HTTP client)
   - Firebase Cloud Functions (callable functions)

2. **High Coupling**: Frontend tightly coupled to backend
   - Frontend knows specific Cloud Function names
   - No abstraction layer between UI and backend

3. **Poor Extensibility**: Adding new weather providers is difficult
   - Would require modifying existing functions
   - No clear interface for weather providers

### Log Error Analysis

```
POST https://asia-east1-.../getForecast36Hour 500 (Internal Server Error)
```

The 500 error indicates the Cloud Function is deployed but failing internally, likely due to:
- Missing `CWA_API_KEY` secret configuration
- CWA API rate limiting or errors
- Improper error handling in the function

## 🎯 Design Principles

### 1. High Cohesion (高內聚性)

**Definition**: Each module has a single, well-defined responsibility.

**Application**:
- `functions-integration`: ONLY external API integration
- `functions-orchestration`: ONLY business logic orchestration
- Frontend services: ONLY UI state management

### 2. Low Coupling (低耦合性)

**Definition**: Modules communicate through well-defined interfaces.

**Application**:
- Use interface-based contracts (TypeScript interfaces)
- Event-based communication where appropriate
- No direct imports of implementation details across layers

### 3. Extensibility (可擴展性)

**Definition**: Easy to add new features without modifying existing code.

**Application**:
- Strategy pattern for weather providers
- Factory pattern for service creation
- Dependency injection for loose coupling

## 🏗️ New Architecture

### Module Structure

```
src/
├── app/
│   └── core/
│       └── weather/
│           ├── providers/
│           │   ├── weather-provider.interface.ts  # ← Interface
│           │   ├── cwa-weather-provider.ts        # ← CWA implementation
│           │   └── index.ts
│           ├── facades/
│           │   └── weather.facade.ts              # ← Orchestration
│           └── services/
│               └── weather.service.ts             # ← UI state management
│
functions-integration/
└── src/
    └── weather/
        ├── services/
        │   ├── cwa-http-client.ts                 # ← Pure HTTP client
        │   └── cwa-weather-integration.service.ts # ← CWA API integration
        ├── types/
        │   └── index.ts                           # ← Shared types
        └── index.ts                               # ← Export services only

functions-orchestration/
└── src/
    └── weather/
        ├── functions/
        │   └── index.ts                           # ← Cloud Functions
        └── services/
            └── weather-orchestration.service.ts   # ← Business logic
```

### Layer Responsibilities

#### Layer 1: Integration Layer (`functions-integration`)

**Purpose**: Pure external API integration

**Responsibilities**:
- HTTP client with retry logic
- Request/response transformation
- Error classification (retryable vs non-retryable)

**Exports**:
```typescript
// Only export service classes, NO Cloud Functions
export { CwaWeatherIntegrationService } from './weather/services/cwa-weather-integration.service';
export { CwaHttpClient } from './weather/services/cwa-http-client';
export * from './weather/types';
```

**Key Point**: ✅ Can be imported and used by ANY other service

#### Layer 2: Orchestration Layer (`functions-orchestration`)

**Purpose**: Business logic and Firebase Cloud Functions

**Responsibilities**:
- Firebase callable functions
- Authentication & authorization
- Caching strategy
- Business logic orchestration
- Error handling and logging

**Imports**:
```typescript
// Import integration services
import { CwaWeatherIntegrationService } from 'functions-integration';
```

**Exports**:
```typescript
// Export Cloud Functions
export const weatherGetForecast = onCall(...);
export const weatherGetObservation = onCall(...);
```

**Key Point**: ✅ Uses integration layer as a dependency

#### Layer 3: Frontend Layer (Angular)

**Purpose**: UI state management and presentation

**Responsibilities**:
- Call Cloud Functions
- Manage UI state with Signals
- Handle loading/error states
- Transform data for UI

**Interface-based Design**:
```typescript
// weather-provider.interface.ts
export interface IWeatherProvider {
  getForecast(location: string): Promise<WeatherForecast>;
  getObservation(stationId?: string): Promise<WeatherObservation>;
  getAlerts(type?: string): Promise<WeatherAlert[]>;
}

// cwa-weather-provider.ts
export class CwaWeatherProvider implements IWeatherProvider {
  private readonly functions = inject(Functions);
  
  async getForecast(location: string): Promise<WeatherForecast> {
    const callable = httpsCallable(this.functions, 'weatherGetForecast');
    const result = await callable({ location });
    return this.transformResponse(result.data);
  }
}

// weather.facade.ts
export class WeatherFacade {
  private provider: IWeatherProvider = inject(CwaWeatherProvider);
  
  // Can easily swap providers without changing consumers
  useProvider(provider: IWeatherProvider): void {
    this.provider = provider;
  }
}
```

## 🔄 Data Flow

### Request Flow

```
User Action (Click "Refresh Weather")
    ↓
WeatherComponent.refresh()
    ↓
WeatherFacade.refreshForecast()
    ↓
IWeatherProvider.getForecast()
    ↓
CwaWeatherProvider (calls Cloud Function)
    ↓
Firebase Cloud Function: weatherGetForecast
    ↓
WeatherOrchestrationService
    ├─ Check cache
    ├─ Validate permissions
    └─ Call CwaWeatherIntegrationService
        ↓
        CwaHttpClient.get()
            ↓
            CWA API (external)
```

### Error Flow

```
Error Occurs
    ↓
Integration Layer: Classify error
    ├─ Retryable? → Retry with backoff
    └─ Non-retryable? → Return error
        ↓
Orchestration Layer: Handle business logic
    ├─ Log error
    ├─ Update cache (if applicable)
    └─ Return structured error
        ↓
Frontend Provider: Transform to domain error
    ↓
Frontend Facade: Update UI state
    ↓
Component: Display error message
```

## 📝 Implementation Steps

### Phase 1: Refactor functions-integration

**Goal**: Make it a pure integration layer

**Tasks**:
1. Remove Cloud Functions from `functions-integration/src/index.ts`
2. Rename `CwaWeatherService` to `CwaWeatherIntegrationService`
3. Remove Firebase Admin SDK dependencies from services
4. Export only service classes and types
5. Update package.json to reflect new role

**Before**:
```typescript
// functions-integration/src/index.ts
export const getForecast36Hour = onCall(...);  // ❌ Cloud Function
```

**After**:
```typescript
// functions-integration/src/index.ts
export { CwaWeatherIntegrationService };  // ✅ Service class only
export * from './weather/types';
```

### Phase 2: Create functions-orchestration

**Goal**: Create business logic layer

**Tasks**:
1. Create new `functions-orchestration` directory
2. Copy Cloud Function definitions from `functions-integration`
3. Import and use `CwaWeatherIntegrationService`
4. Implement caching strategy
5. Add authentication and authorization
6. Configure firebase.json

**Structure**:
```typescript
// functions-orchestration/src/weather/functions/index.ts
import { onCall } from 'firebase-functions/v2/https';
import { WeatherOrchestrationService } from '../services/weather-orchestration.service';

export const weatherGetForecast = onCall({
  region: 'asia-east1',
  secrets: ['CWA_API_KEY']
}, async (request) => {
  const service = new WeatherOrchestrationService();
  return service.getForecast(request.data.location);
});
```

### Phase 3: Refactor Frontend

**Goal**: Decouple from backend implementation

**Tasks**:
1. Create `IWeatherProvider` interface
2. Implement `CwaWeatherProvider`
3. Create `WeatherFacade` for orchestration
4. Update `WeatherService` to use facade
5. Update components to use new service

**Frontend Architecture**:
```typescript
// Core abstraction
export interface IWeatherProvider {
  getForecast(location: string): Promise<WeatherForecast>;
}

// CWA implementation
export class CwaWeatherProvider implements IWeatherProvider {
  async getForecast(location: string): Promise<WeatherForecast> {
    const callable = httpsCallable(this.functions, 'weatherGetForecast');
    // ... implementation
  }
}

// Orchestration facade
export class WeatherFacade {
  private provider = inject(CwaWeatherProvider);
  
  forecast = signal<WeatherForecast | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  
  async refreshForecast(location: string): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.provider.getForecast(location);
      this.forecast.set(result);
    } catch (err) {
      this.error.set(err.message);
    } finally {
      this.loading.set(false);
    }
  }
}
```

### Phase 4: Testing & Validation

**Goal**: Ensure refactoring works correctly

**Tasks**:
1. Deploy functions-orchestration
2. Test Cloud Functions with emulator
3. Test frontend integration
4. Verify error handling
5. Performance testing

## ✅ Benefits

### High Cohesion
- ✅ `functions-integration`: Only does API integration
- ✅ `functions-orchestration`: Only does business logic
- ✅ Frontend: Only does UI state management

### Low Coupling
- ✅ Frontend uses interface, not implementation
- ✅ Orchestration imports integration as dependency
- ✅ Easy to mock for testing

### Extensibility
- ✅ Add new weather provider: Implement `IWeatherProvider`
- ✅ Swap providers: `facade.useProvider(new CustomProvider())`
- ✅ Add new endpoints: Add to orchestration layer only

## 🚀 Migration Strategy

### Step 1: Parallel Deployment
- Deploy new `functions-orchestration` alongside existing functions
- Frontend can call either old or new functions
- Gradual migration of features

### Step 2: Feature Flag
- Use feature flag to toggle between old and new architecture
- Test in production with small percentage of users
- Monitor errors and performance

### Step 3: Full Migration
- Switch all traffic to new functions
- Deprecate old functions after 30 days
- Remove old code

## 📊 Success Criteria

- [ ] All modules have single responsibility
- [ ] Frontend doesn't import backend implementation
- [ ] Can add new weather provider in < 1 hour
- [ ] Unit test coverage > 80%
- [ ] No increase in API latency
- [ ] Error rate < 1%

---

**Document Version**: 1.0  
**Date**: 2025-12-21  
**Author**: GigHub Architecture Team
