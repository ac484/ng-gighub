# Quick Fix Guide: Weather Module 500 Error

> Immediate steps to resolve `getForecast36Hour` 500 Internal Server Error

**Status**: Action Required  
**Priority**: Critical  
**Est. Time**: 30 minutes

## 🔴 Problem

```
POST https://asia-east1-.../getForecast36Hour 500 (Internal Server Error)
```

Frontend weather card fails to load data due to Cloud Function returning 500 error.

## 🔧 Solution Steps

### Step 1: Verify CWA_API_KEY Secret

The most likely cause is missing or misconfigured `CWA_API_KEY` secret.

```bash
# Check if secret exists
firebase functions:secrets:access CWA_API_KEY

# If not found, set it (get API key from CWA website)
firebase functions:secrets:set CWA_API_KEY
# Enter the API key when prompted

# Verify it's set
firebase functions:secrets:list
```

**Get CWA API Key**:
1. Go to: https://opendata.cwa.gov.tw/userLogin
2. Register/Login
3. Navigate to: My Profile → API Keys
4. Copy the API Key

### Step 2: Check Cloud Function Logs

```bash
# View recent logs for getForecast36Hour
firebase functions:log --only getForecast36Hour

# Or view all functions-integration logs
firebase functions:log --project elite-chiller-455712-c4
```

**Look for**:
- `CWA_API_KEY not configured` errors
- CWA API HTTP error responses (401, 403, 429, 500)
- Firestore permission denied errors
- Network timeout errors

### Step 3: Test Locally with Emulator

```bash
# Start Firebase Emulator
cd /path/to/ng-gighub
firebase emulators:start --only functions,firestore

# In another terminal, test the function
curl -X POST http://localhost:5001/elite-chiller-455712-c4/asia-east1/getForecast36Hour \
  -H "Content-Type: application/json" \
  -d '{"data":{"countyName":"臺北市"}}'
```

**Expected Response**:
```json
{
  "result": {
    "success": true,
    "data": {
      "location": [...]
    }
  }
}
```

### Step 4: Deploy and Test

```bash
# Deploy only functions-integration
firebase deploy --only functions:getForecast36Hour

# Monitor logs in real-time
firebase functions:log --only getForecast36Hour --follow

# Test from frontend
# Open http://localhost:4200 and click the weather refresh button
```

## 🔍 Troubleshooting

### Error: "CWA_API_KEY not configured"

**Solution**:
```bash
firebase functions:secrets:set CWA_API_KEY
# Enter the API key from CWA website
firebase deploy --only functions
```

### Error: "401 Unauthorized" from CWA API

**Causes**:
- API key is invalid or expired
- API key doesn't have proper permissions

**Solution**:
1. Verify API key on CWA website
2. Generate new API key if needed
3. Update secret: `firebase functions:secrets:set CWA_API_KEY`

### Error: "429 Too Many Requests" from CWA API

**Causes**:
- Rate limit exceeded (usually 1000 requests/hour)

**Solution**:
- Wait for rate limit to reset
- Implement request throttling
- Use caching more aggressively

## ✅ Verification

After deploying fixes, verify:

1. **Cloud Function Executes Successfully**
   ```bash
   firebase functions:log --only getForecast36Hour
   # Should see SUCCESS logs
   ```

2. **Frontend Receives Data**
   - Open browser DevTools → Network tab
   - Click weather refresh button
   - Should see 200 OK response with weather data

3. **No Errors in Console**
   - Check browser console
   - Should not see 500 errors or exceptions

## 📊 Expected Results

**Before Fix**:
```
❌ POST getForecast36Hour → 500 Internal Server Error
❌ Weather card shows error
❌ Console logs show exception
```

**After Fix**:
```
✅ POST getForecast36Hour → 200 OK
✅ Weather card displays forecast data
✅ No errors in console
```

## 🚀 Next Steps

After resolving the immediate 500 error:

1. Review `../architecture/WEATHER_MODULE_ANALYSIS.md` for architectural improvements
2. Implement proper error handling and monitoring
3. Plan architectural refactoring (Phase 2+)

## 📚 References

- CWA API Documentation: https://opendata.cwa.gov.tw/dist/opendata-swagger.html
- Firebase Secrets: https://firebase.google.com/docs/functions/config-env#secret-manager
- Firebase Functions Logs: https://firebase.google.com/docs/functions/writing-and-viewing-logs

---

**Author**: GigHub Development Team  
**Last Updated**: 2025-12-21
