# CWA Weather API Integration

> Complete integration with Central Weather Administration (中央氣象署) Open Data Platform API

## 📋 Overview

This module provides comprehensive integration with the Central Weather Administration (CWA) Open Data Platform, offering access to weather forecasts, real-time observations, weather alerts, radar imagery, earthquake information, and more for Taiwan.

**API Documentation**: https://opendata.cwa.gov.tw/dist/opendata-swagger.html

## 🎯 Features

### Weather Forecasts (天氣預報)
- ✨ **36-hour forecast** - Today and tomorrow's weather by county
- ☀️ **7-day forecast** - Weekly weather trends
- 🏙️ **Township forecast** - Weather by administrative district (鄉鎮市區)
- 🌈 **Comfort index** - Human comfort level predictions
- ☀️ **UV index forecast** - UV radiation predictions

### Weather Observations (氣象觀測)
- 🌤️ **Station observations** - Hourly data from meteorological stations
- ⛅ **10-minute data** - Real-time automatic station updates
- ☔ **Rainfall monitoring** - Cumulative and real-time rainfall data
- ☀️ **UV index** - Current UV radiation levels
- 🌡️ **Temperature distribution** - Temperature maps and gridded data

### Weather Alerts (警報特報)
- 🚨 **General warnings** - Various weather warnings
- 🌀 **Typhoon warnings** - Typhoon alerts and forecasts
- ☔ **Heavy rain warnings** - Torrential rain alerts
- 💨 **Strong wind warnings** - High wind alerts
- ❄️ **Cold surge warnings** - Low temperature alerts

### Additional Services
- 🛰️ **Radar & Satellite** - Radar echo and satellite imagery
- 🌊 **Marine & Tide** - Ocean forecasts and tide predictions
- 🌍 **Earthquake** - Real-time earthquake reports
- 📊 **Climate Data** - Historical climate statistics

## 📂 Module Structure

```
functions-integration/src/weather/
├── types/
│   └── index.ts                    # Complete TypeScript type definitions
├── constants/
│   ├── location-codes.ts           # County and township codes
│   ├── api-endpoints.ts            # API endpoint definitions
│   └── index.ts                    # Constants exports
├── services/
│   ├── http-client.ts              # HTTP client with retry logic
│   ├── cwa-weather.service.ts      # Main weather service
│   └── index.ts                    # Services exports
├── functions/
│   └── index.ts                    # Firebase Cloud Functions
└── index.ts                        # Module exports
```

### Design Principles

#### ✅ High Cohesion (高內聚性)
- Organized by business domains (forecast, observation, alert)
- Each module has a clear, single responsibility
- Internal implementation can be freely modified

#### ✅ Low Coupling (低耦合性)
- Modules communicate through well-defined interfaces
- Services are independent and reusable
- No direct dependencies between business modules

#### ✅ Extensibility (可擴展性)
- Easy to add new weather data types
- New endpoints can be added without modifying existing code
- Cache strategy is configurable per data type

## 🚀 Setup & Configuration

### 1. Install Dependencies

The module uses native `fetch` API and requires no additional dependencies beyond Firebase:

```bash
cd functions-integration
yarn install
```

### 2. Configure API Key

Set your CWA API key as a Firebase secret:

```bash
# Set the secret
firebase functions:secrets:set CWA_API_KEY

# Verify the secret
firebase functions:secrets:access CWA_API_KEY
```

**Get API Key**: Register at https://opendata.cwa.gov.tw/ to obtain your API key.

### 3. Build the Module

```bash
npm run build
```

### 4. Deploy Functions

```bash
# Deploy all weather functions
firebase deploy --only functions:weather

# Or deploy specific functions
firebase deploy --only functions:getForecast36Hour,functions:getObservation
```

## 📖 API Usage

### Client-Side Usage (Angular/TypeScript)

```typescript
import { getFunctions, httpsCallable } from '@angular/fire/functions';

export class WeatherService {
  private functions = inject(Functions);

  // Get 36-hour forecast
  async get36HourForecast(countyName: string) {
    const callable = httpsCallable(this.functions, 'getForecast36Hour');
    const result = await callable({ countyName });
    return result.data;
  }

  // Get real-time observation
  async getCurrentWeather(stationId: string) {
    const callable = httpsCallable(this.functions, 'getObservation');
    const result = await callable({ stationId });
    return result.data;
  }

  // Get weather warnings
  async getActiveWarnings() {
    const callable = httpsCallable(this.functions, 'getWeatherWarnings');
    const result = await callable({ activeOnly: true });
    return result.data;
  }
}
```

### Server-Side Usage (Node.js)

```typescript
import { createCwaWeatherService } from './weather/services';

// Create service instance
const weatherService = createCwaWeatherService({
  apiKey: process.env.CWA_API_KEY!,
  cacheEnabled: true,
  cacheTTL: {
    forecast: 3600,    // 1 hour
    observation: 600,  // 10 minutes
    alert: 300         // 5 minutes
  }
});

// Fetch 36-hour forecast
const forecast = await weatherService.get36HourForecast('臺北市');

// Fetch real-time observations
const observations = await weatherService.getMeteorologicalObservation('466920');

// Fetch rainfall data
const rainfall = await weatherService.getRainfallObservation();
```

## 🌍 Location Codes Reference

### Counties (縣市)

| Code | Name | Code | Name |
|------|------|------|------|
| 63 | 臺北市 | 64 | 高雄市 |
| 65 | 新北市 | 66 | 臺中市 |
| 67 | 臺南市 | 68 | 桃園市 |
| 10002 | 宜蘭縣 | 10004 | 新竹縣 |
| 10005 | 苗栗縣 | 10007 | 彰化縣 |
| 10008 | 南投縣 | 10009 | 雲林縣 |
| 10010 | 嘉義縣 | 10013 | 屏東縣 |
| 10014 | 臺東縣 | 10015 | 花蓮縣 |
| 10016 | 澎湖縣 | 10017 | 基隆市 |
| 10018 | 新竹市 | 10020 | 嘉義市 |
| 09007 | 連江縣 | 09020 | 金門縣 |

### Townships (鄉鎮市區)

See `constants/location-codes.ts` for complete township code mappings for each county.

**Utility Functions**:

```typescript
import {
  getCountyName,
  getCountyCode,
  getTownshipName,
  searchLocationByName
} from './weather/constants';

// Get county name by code
const countyName = getCountyName('63'); // "臺北市"

// Get county code by name
const countyCode = getCountyCode('臺北市'); // "63"

// Search locations
const results = searchLocationByName('松山');
// [{ code: '6300100', name: '松山區', type: 'township' }]
```

### Weather Stations (氣象站)

| Station ID | Name | Location |
|------------|------|----------|
| 466920 | 臺北 | 25.0408°N, 121.5135°E |
| 467410 | 板橋 | 24.9976°N, 121.4405°E |
| 467440 | 淡水 | 25.1650°N, 121.4492°E |
| 466880 | 基隆 | 25.1338°N, 121.7403°E |
| 467490 | 新竹 | 24.8277°N, 120.9391°E |
| 466990 | 宜蘭 | 24.7644°N, 121.7498°E |
| 467050 | 花蓮 | 23.9753°N, 121.6061°E |

See `constants/location-codes.ts` for complete station list.

## 📊 API Endpoints Reference

### Forecast Endpoints

| Dataset Code | Description | Cache TTL |
|--------------|-------------|-----------|
| F-C0032-001 | 36小時天氣預報(縣市) | 1 hour |
| F-D0047-089 | 未來一週天氣預報 | 1 hour |
| F-D0047-061 ~ 085 | 鄉鎮天氣預報(依縣市) | 1 hour |
| F-A0010-001 | 舒適度預報 | 1 hour |
| F-A0012-001 | 紫外線指數預報 | 1 hour |

### Observation Endpoints

| Dataset Code | Description | Cache TTL |
|--------------|-------------|-----------|
| O-A0001-001 | 局屬氣象站觀測資料 | 10 minutes |
| O-A0003-001 | 自動氣象站10分鐘觀測資料 | 10 minutes |
| O-A0002-001 | 雨量觀測資料 | 10 minutes |
| O-A0005-001 | 紫外線指數觀測資料 | 10 minutes |
| O-A0038-001 | 溫度分布圖 | 10 minutes |

### Alert Endpoints

| Dataset Code | Description | Cache TTL |
|--------------|-------------|-----------|
| W-C0033-001 | 一般天氣特報 | 5 minutes |
| W-C0034-001 | 豪雨特報 | 5 minutes |
| W-C0035-001 | 颱風警報 | 5 minutes |
| W-C0038-001 | 強風特報 | 5 minutes |
| W-C0039-001 | 低溫特報 | 5 minutes |

### Other Endpoints

| Dataset Code | Description | Cache TTL |
|--------------|-------------|-----------|
| O-A0058-001 | 雷達回波圖 | 10 minutes |
| O-B0075-001 | 衛星雲圖(可見光) | 10 minutes |
| O-B0076-001 | 衛星雲圖(紅外線) | 10 minutes |
| E-A0015-001 | 顯著有感地震報告 | 5 minutes |
| E-A0016-001 | 小區域有感地震報告 | 5 minutes |

## 🔧 Advanced Configuration

### Custom Cache Strategy

```typescript
const weatherService = createCwaWeatherService({
  apiKey: process.env.CWA_API_KEY!,
  cacheEnabled: true,
  cacheTTL: {
    forecast: 1800,    // 30 minutes
    observation: 300,  // 5 minutes
    alert: 180         // 3 minutes
  }
});
```

### Disable Caching

```typescript
const weatherService = createCwaWeatherService({
  apiKey: process.env.CWA_API_KEY!,
  cacheEnabled: false
});
```

### Custom HTTP Client Configuration

Modify `services/http-client.ts` to customize:
- Timeout duration
- Retry attempts and delay
- Request/response interceptors
- Error handling logic

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### Integration Tests with Emulator

```bash
# Start Firebase emulators
firebase emulators:start

# Run integration tests
npm run test:integration
```

### Manual Testing

```bash
# Test a specific function locally
firebase functions:shell

# In the shell
getForecast36Hour({ countyName: '臺北市' })
```

## 📈 Monitoring & Logging

All weather API calls are logged with structured data:

```typescript
logger.info('[CwaHttpClient] GET https://opendata.cwa.gov.tw/api/...', {
  params: { locationName: '臺北市' },
  duration: 234,
  statusCode: 200
});
```

### View Logs

```bash
# View function logs
firebase functions:log

# Filter by function
firebase functions:log --only getForecast36Hour

# Tail logs in real-time
firebase functions:log --tail
```

### Performance Metrics

Monitor in Firebase Console:
- Function invocation count
- Execution time
- Error rate
- Cache hit/miss ratio (via custom logging)

## 🔐 Security Best Practices

1. **API Key Protection**
   - Always use Firebase secrets for API keys
   - Never commit API keys to version control
   - Rotate keys regularly

2. **Authentication**
   - All functions require authentication
   - Admin-only functions check custom claims
   - Rate limiting should be implemented at application level

3. **Data Validation**
   - All inputs are validated before processing
   - Invalid requests return appropriate error codes
   - Error messages don't expose sensitive information

4. **Firestore Security Rules**
   ```javascript
   match /weather_cache/{document} {
     // Only Cloud Functions can write
     allow write: if false;
     
     // Authenticated users can read
     allow read: if request.auth != null;
   }
   ```

## 🐛 Troubleshooting

### Common Issues

**1. API Key Not Found**
```
Error: CWA_API_KEY not configured
```
**Solution**: Set the secret using `firebase functions:secrets:set CWA_API_KEY`

**2. Request Timeout**
```
Error: Request timeout after 30000ms
```
**Solution**: Check network connectivity or increase timeout in HTTP client

**3. Invalid County Code**
```
Error: Invalid county code: XX
```
**Solution**: Use valid county codes from `COUNTY_CODES` constant

**4. Rate Limit Exceeded**
```
Error: HTTP 429: Too Many Requests
```
**Solution**: Implement client-side rate limiting or upgrade API plan

### Debug Mode

Enable debug logging:

```typescript
// Set environment variable (recommended for Functions v2)
process.env.DEBUG = 'weather:*';

// Or set via Firebase runtime config to populate process.env.DEBUG
firebase functions:config:set DEBUG="weather:*"
```

## 📚 References

### Official Documentation
- [CWA Open Data Platform](https://opendata.cwa.gov.tw/)
- [API Documentation (Swagger)](https://opendata.cwa.gov.tw/dist/opendata-swagger.html)
- [Dataset Descriptions](https://opendata.cwa.gov.tw/opendatadoc/)

### Related Technologies
- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-20 | Initial release with complete CWA API integration |

## 👥 Maintainers

GigHub Development Team

## 📄 License

MIT License

---

**Need Help?** Check the [troubleshooting section](#-troubleshooting) or contact the development team.
