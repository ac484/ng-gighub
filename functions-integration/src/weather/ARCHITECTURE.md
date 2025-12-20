# CWA Weather API Integration - Architecture Design

> Design Document for Central Weather Administration API Integration

## 📐 Architecture Overview

### Design Principles

1. **High Cohesion (高內聚性)**
   - Each module has a single, well-defined responsibility
   - Related functionalities are grouped together
   - Internal changes don't affect external interfaces

2. **Low Coupling (低耦合性)**
   - Modules communicate through well-defined interfaces
   - Dependencies are minimized and explicit
   - Easy to test and maintain independently

3. **Extensibility (可擴展性)**
   - New weather data types can be added without modifying existing code
   - Cache strategies are configurable
   - Easy to add new API endpoints

## 🏗️ Module Structure

```
weather/
├── types/              # Type Definitions Layer
│   └── index.ts       # All TypeScript interfaces and types
│
├── constants/          # Configuration Layer
│   ├── location-codes.ts    # Location code mappings
│   ├── api-endpoints.ts     # API endpoint definitions
│   └── index.ts            # Constants exports
│
├── services/           # Business Logic Layer
│   ├── http-client.ts           # HTTP client with retry logic
│   ├── cwa-weather.service.ts   # Main weather service
│   └── index.ts                # Services exports
│
├── functions/          # Presentation Layer (Cloud Functions)
│   └── index.ts       # Firebase callable functions
│
├── index.ts           # Module main export
└── README.md          # Documentation
```

## 📊 Layered Architecture

### Layer 1: Type Definitions
**Purpose**: Provide type safety across the entire module

**Components**:
- API request/response types
- Weather data models
- Configuration interfaces
- Error types

**Dependencies**: None (standalone)

**Example**:
```typescript
export interface WeatherForecast36Hour {
  datasetDescription: string;
  locationsName: string;
  location: LocationForecast[];
}
```

### Layer 2: Constants & Configuration
**Purpose**: Centralize all configuration data

**Components**:
- Location codes (counties, townships, stations)
- API endpoint definitions
- Cache TTL configurations
- Default settings

**Dependencies**: Types layer

**Example**:
```typescript
export const COUNTY_CODES: Record<string, string> = {
  '63': '臺北市',
  '65': '新北市',
  // ...
};

export const API_ENDPOINTS = {
  forecast: {
    hour36: { path: '/rest/datastore/F-C0032-001', ... }
  }
};
```

### Layer 3: Services (Business Logic)
**Purpose**: Implement core business logic and data access

**Components**:

#### 3.1 HTTP Client (`http-client.ts`)
**Responsibilities**:
- Make HTTP requests to CWA API
- Implement retry logic with exponential backoff
- Handle network errors and timeouts
- Log request/response details

**Key Features**:
- ✅ Automatic retry on transient failures
- ✅ Configurable timeout and retry attempts
- ✅ Request/response logging
- ✅ Error classification (retryable vs non-retryable)

**Example**:
```typescript
export class CwaHttpClient {
  async get<T>(path: string): Promise<CwaApiResponse<T>> {
    // Retry logic with exponential backoff
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        return await this.executeRequest(path);
      } catch (error) {
        if (shouldRetry(error)) {
          await sleep(calculateDelay(attempt));
          continue;
        }
        throw error;
      }
    }
  }
}
```

#### 3.2 Weather Service (`cwa-weather.service.ts`)
**Responsibilities**:
- Provide high-level APIs for weather data
- Manage caching strategy
- Transform API responses to typed models
- Handle business logic

**Key Features**:
- ✅ Firestore-based caching
- ✅ Configurable cache TTL per data type
- ✅ Data transformation and validation
- ✅ Error handling and logging

**Example**:
```typescript
export class CwaWeatherService {
  async get36HourForecast(countyName: string): Promise<CwaApiResponse<WeatherForecast36Hour>> {
    // Check cache
    const cached = await this.getFromCache(cacheKey);
    if (cached) return cached;
    
    // Fetch from API
    const response = await this.httpClient.get(url);
    
    // Save to cache
    await this.saveToCache(cacheKey, response, ttl);
    
    return response;
  }
}
```

**Dependencies**: HTTP Client, Types, Constants

### Layer 4: Cloud Functions (Presentation)
**Purpose**: Expose weather services as Firebase callable functions

**Components**:
- Authentication validation
- Request parameter validation
- Error handling and HTTP error mapping
- Response formatting

**Key Features**:
- ✅ Requires authentication
- ✅ Admin-only functions (e.g., cache clearing)
- ✅ Structured error responses
- ✅ Request logging

**Example**:
```typescript
export const getForecast36Hour = onCall({
  region: 'asia-east1',
  secrets: [cwaApiKey]
}, async (request) => {
  validateAuth(request);
  validateParams(request.data);
  
  const service = getWeatherService();
  const response = await service.get36HourForecast(countyName);
  
  return formatResponse(response);
});
```

**Dependencies**: Weather Service, Types

## 🔄 Data Flow

### Forecast Request Flow

```
Client (Angular App)
    ↓
[Authentication Check]
    ↓
Cloud Function (getForecast36Hour)
    ↓
[Validate Request Parameters]
    ↓
CwaWeatherService
    ↓
[Check Firestore Cache]
    ├─ Cache Hit → Return Cached Data
    └─ Cache Miss ↓
        CwaHttpClient
            ↓
        [HTTP GET with Retry Logic]
            ↓
        CWA API (opendata.cwa.gov.tw)
            ↓
        [Response Transformation]
            ↓
        [Save to Firestore Cache]
            ↓
        Return Fresh Data
```

### Error Handling Flow

```
Error Occurs
    ↓
[Classify Error Type]
    ├─ Network Error (timeout, ECONNRESET)
    │   └─ Retryable → Retry with backoff
    │
    ├─ HTTP 5xx (Server Error)
    │   └─ Retryable → Retry with backoff
    │
    ├─ HTTP 429 (Rate Limit)
    │   └─ Retryable → Retry with longer delay
    │
    ├─ HTTP 4xx (Client Error)
    │   └─ Non-retryable → Return error immediately
    │
    └─ Other Errors
        └─ Non-retryable → Return error immediately
```

## 💾 Caching Strategy

### Cache Design

**Storage**: Firestore collection `weather_cache`

**Cache Key Format**: `{data_type}_{location}_{params}`

**Example Keys**:
- `forecast_36h_臺北市_all`
- `obs_meteorological_466920`
- `alert_warnings_typhoon`

### Cache Document Structure

```typescript
{
  data: T,                        // Actual weather data
  cachedAt: Timestamp,            // When cached
  expiresAt: Timestamp,           // When expires
  source: 'cwa_api' | 'cache'    // Data source
}
```

### Cache TTL Configuration

| Data Type | Default TTL | Reason |
|-----------|-------------|---------|
| Forecast | 1 hour (3600s) | Updates hourly |
| Observation | 10 minutes (600s) | Real-time data |
| Alert | 5 minutes (300s) | Time-sensitive |
| Climate | 24 hours (86400s) | Static historical data |

### Cache Invalidation

**Strategies**:
1. **TTL-based**: Automatic expiration based on timestamp
2. **Manual**: Admin can clear cache via `clearCache` function
3. **Conditional**: Update on CWA API changes (webhook in future)

## 🔌 External Integration

### CWA API Integration

**Base URL**: `https://opendata.cwa.gov.tw/api`

**Authentication**: Query parameter `Authorization={API_KEY}`

**Response Format**: JSON

**Rate Limits**: Varies by API plan (typically 1000 requests/hour)

### Request Format

```
GET https://opendata.cwa.gov.tw/api/rest/datastore/F-C0032-001
?Authorization={API_KEY}
&locationName=臺北市
```

### Response Format

```json
{
  "success": "true",
  "result": {
    "resource_id": "F-C0032-001",
    "fields": [...],
    "records": {
      "datasetDescription": "...",
      "location": [...]
    }
  }
}
```

## 🔐 Security Considerations

### API Key Management
- Stored as Firebase Secret (`CWA_API_KEY`)
- Never exposed to client
- Accessed only in Cloud Functions
- Rotated periodically

### Authentication & Authorization
- All functions require Firebase Authentication
- Admin functions check custom claims
- Rate limiting at application level (future)

### Data Privacy
- No personal data stored in cache
- Cache documents auto-expire
- Logs don't contain sensitive information

### Firestore Security Rules

```javascript
match /weather_cache/{document} {
  // Only Cloud Functions can write
  allow write: if false;
  
  // Authenticated users can read
  allow read: if request.auth != null;
}
```

## 📈 Scalability Considerations

### Horizontal Scaling
- Cloud Functions auto-scale based on load
- Max instances set to 10 (configurable)
- Stateless design allows unlimited scaling

### Cache Optimization
- Firestore indexes for fast queries
- TTL-based expiration reduces storage
- Batch operations for cache management

### Performance Targets
- API response time: < 500ms (cached)
- API response time: < 3s (uncached)
- Cache hit rate: > 80%
- Function cold start: < 2s

## 🧪 Testing Strategy

### Unit Tests
- Test each service method independently
- Mock HTTP client and Firestore
- Test error handling and edge cases

### Integration Tests
- Test end-to-end flow with Firebase emulator
- Test with real CWA API (limited)
- Verify caching behavior

### Load Tests
- Simulate high request volume
- Test retry logic under failure
- Verify rate limiting behavior

## 🔄 Future Enhancements

### Phase 2 Features
1. **Webhook Support**: Real-time updates from CWA
2. **GraphQL API**: More flexible querying
3. **Advanced Caching**: Redis for faster access
4. **Rate Limiting**: Protect against abuse
5. **Analytics**: Track usage patterns

### Phase 3 Features
1. **Weather Alerts Push**: Real-time notifications
2. **Historical Data**: Time-series analysis
3. **ML Integration**: Weather prediction models
4. **Multi-region Support**: Deploy to multiple regions

## 📊 Monitoring & Observability

### Metrics to Track
- Function invocation count
- Average execution time
- Error rate by function
- Cache hit/miss ratio
- API call success rate

### Logging Strategy
- Structured JSON logging
- Log levels: INFO, WARN, ERROR
- Include request context (user, params)
- Don't log sensitive data

### Alerting Rules
- Error rate > 5% → Send alert
- Average response time > 5s → Investigate
- Cache hit rate < 50% → Optimize TTL

## 📚 Development Guidelines

### Code Style
- Use TypeScript strict mode
- Follow Google TypeScript Style Guide
- Use ESLint and Prettier
- Document public APIs with JSDoc

### Git Workflow
- Feature branches for new features
- Pull requests require review
- Squash merge to main branch
- Semantic versioning for releases

### Dependency Management
- Minimize external dependencies
- Use native APIs when possible
- Keep dependencies up to date
- Audit for security vulnerabilities

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-20  
**Maintainers**: GigHub Development Team
