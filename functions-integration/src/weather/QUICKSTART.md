# CWA Weather API - Quick Setup Guide

> 5-minute guide to get CWA Weather API integration running

## 📋 Prerequisites

- Firebase project with Blaze plan (required for outbound API calls)
- Node.js 22.x
- Firebase CLI installed (`npm install -g firebase-tools`)

## 🚀 Quick Start

### Step 1: Verify API Key (Testing Phase)

**Current Status**: API key is hardcoded in the source code for testing purposes.

Hardcoded key: `CWA-8055E55C-EBCB-40A2-92F4-8A84399F3A45`

**For production**: You'll need to obtain your own API key from https://opendata.cwa.gov.tw/ and configure it as a Firebase secret.

### Step 2: Build Functions

```bash
cd functions-integration
npm install
npm run build
```

### Step 3: Deploy

```bash
# Deploy all weather functions
firebase deploy --only functions:weather

# Or deploy specific functions
firebase deploy --only functions:getForecast36Hour
```

### Step 4: Test

```bash
# View logs
firebase functions:log --only getForecast36Hour

# Or use Firebase Console
# https://console.firebase.google.com/project/YOUR_PROJECT/functions
```

## 🧪 Test from Client

### Angular Example

```typescript
import { getFunctions, httpsCallable } from '@angular/fire/functions';
import { inject } from '@angular/core';

export class WeatherTestComponent {
  private functions = inject(Functions);

  async testForecast() {
    const getForecast = httpsCallable(this.functions, 'getForecast36Hour');
    
    try {
      const result = await getForecast({ countyName: '臺北市' });
      console.log('Weather data:', result.data);
    } catch (error) {
      console.error('Error:', error);
    }
  }
}
```

### JavaScript Example

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const getForecast = httpsCallable(functions, 'getForecast36Hour');

// Get 36-hour forecast
const result = await getForecast({ countyName: '臺北市' });
console.log(result.data);

// Get observation data
const getObservation = httpsCallable(functions, 'getObservation');
const obs = await getObservation({ stationId: '466920' });
console.log(obs.data);
```

## 📝 Available Functions

### Forecast
- `getForecast36Hour({ countyName: string })`
- `getForecast7Day({ countyName: string })`
- `getTownshipForecast({ countyCode: string, townshipName?: string })`

### Observation
- `getObservation({ stationId?: string })`
- `get10MinObservation({ stationId?: string })`
- `getRainfallObservation({ stationId?: string })`
- `getUvIndexObservation({})`

### Alerts
- `getWeatherWarnings({ alertType?: string })`

### Utility
- `clearWeatherCache({})` - Admin only

## 🔧 Configuration

### Adjust Cache TTL

Edit `src/weather/services/cwa-weather.service.ts`:

```typescript
const weatherService = createCwaWeatherService({
  apiKey: cwaApiKey.value(),
  cacheEnabled: true,
  cacheTTL: {
    forecast: 1800,    // 30 minutes (default: 3600)
    observation: 300,  // 5 minutes (default: 600)
    alert: 180         // 3 minutes (default: 300)
  }
});
```

### Adjust Retry Settings

Edit `src/weather/services/http-client.ts`:

```typescript
this.httpClient = createCwaHttpClient({
  baseUrl: 'https://opendata.cwa.gov.tw/api',
  apiKey: this.config.apiKey,
  timeout: 30000,        // 30 seconds
  retryAttempts: 3,      // Max 3 retries
  retryDelay: 1000,      // Initial delay 1s
  maxRetryDelay: 10000   // Max delay 10s
});
```

## 🔐 Security Rules

Add to `firestore.rules`:

```javascript
match /weather_cache/{document} {
  // Only Cloud Functions can write
  allow write: if false;
  
  // Authenticated users can read
  allow read: if request.auth != null;
}
```

## 📊 Monitor Usage

### View Logs

```bash
# All weather functions
firebase functions:log --only weather

# Specific function
firebase functions:log --only getForecast36Hour

# Tail logs in real-time
firebase functions:log --tail
```

### Check in Console

1. Go to Firebase Console
2. Navigate to Functions section
3. Click on function name
4. View metrics: Invocations, Execution time, Errors

## 🐛 Troubleshooting

### Error: CWA_API_KEY not configured

**Testing Phase**: Check that the hardcoded API key in `functions/index.ts` is correct: `CWA-8055E55C-EBCB-40A2-92F4-8A84399F3A45`

**Production**: Set the secret:
```bash
firebase functions:secrets:set CWA_API_KEY
```

### Error: Authentication required

Make sure user is authenticated before calling functions:

```typescript
import { getAuth } from '@angular/fire/auth';

const auth = inject(Auth);
await auth.currentUser; // Check if signed in
```

### Error: Request timeout

Increase timeout in `http-client.ts` or check network connectivity.

### Error: Rate limit exceeded

Upgrade CWA API plan or implement client-side rate limiting.

## 📚 Next Steps

- [ ] Read complete documentation: `README.md`
- [ ] Review architecture: `ARCHITECTURE.md`
- [ ] Implement error handling in client
- [ ] Add loading states for API calls
- [ ] Monitor function performance
- [ ] Set up alerting for errors

## 🎯 Common Use Cases

### Display Current Weather

```typescript
async getCurrentWeather(city: string) {
  const forecast = await this.getForecast36Hour({ countyName: city });
  const current = forecast.data.location[0];
  
  return {
    temperature: current.weatherElement.find(e => e.elementName === 'T').time[0].elementValue[0].value,
    weather: current.weatherElement.find(e => e.elementName === 'Wx').time[0].elementValue[0].value
  };
}
```

### Show Weather Alerts

```typescript
async getActiveAlerts() {
  const warnings = await this.getWeatherWarnings({ activeOnly: true });
  return warnings.data.filter(alert => alert.status === 'active');
}
```

### Rainfall Monitoring

```typescript
async getRainfallStatus() {
  const rainfall = await this.getRainfallObservation({});
  
  return rainfall.data.map(station => ({
    name: station.stationName,
    hourly: station.rainfall.hour1,
    daily: station.rainfall.day,
    warning: station.rainfall.hour1 > 50 // Heavy rain threshold
  }));
}
```

## ✅ Checklist

- [x] CWA API key (hardcoded for testing)
- [ ] Functions built successfully
- [ ] Functions deployed
- [ ] Tested from client
- [ ] Error handling implemented
- [ ] Monitoring set up
- [ ] Documentation reviewed
- [ ] TODO: Move API key to environment variables for production

---

**Need help?** Check `README.md` for detailed documentation or contact the development team.
