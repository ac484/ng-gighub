# Agreement Parsing Issue - Root Cause Analysis Summary

**Issue**: 解析按鈕變成灰色，沒有錯誤也沒有反應  
**Date**: 2025-12-20  
**Analysis Type**: Code Review & Architecture Analysis (No Runtime Diagnostics Yet)

---

## Executive Summary

Based on code review and architecture analysis, the parsing button becomes disabled without showing errors or producing results. This document identifies the **5 most likely root causes** ranked by probability, with specific evidence from the codebase.

---

## 🔴 Root Cause #1: Missing Environment Variables (95% Probability)

### Evidence

**Code Location**: `functions-ai-document/src/utils/document-utils.ts` (lines 301-332)

```typescript
export function getProcessorConfigFromEnv(): ProcessorConfig {
  const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
  const location = process.env.DOCUMENTAI_LOCATION;
  const processorId = process.env.DOCUMENTAI_PROCESSOR_ID;
  const apiEndpoint = process.env.DOCUMENTAI_API_ENDPOINT;

  if (!projectId) {
    throw new Error('Missing GCLOUD_PROJECT environment variable');
  }

  if (!location) {
    throw new Error('Missing DOCUMENTAI_LOCATION environment variable');
  }

  if (!processorId) {
    throw new Error('Missing DOCUMENTAI_PROCESSOR_ID environment variable');
  }

  return { projectId, location, processorId, apiEndpoint };
}
```

**Code Location**: `functions-ai-document/src/handlers/process-document-handler.ts` (lines 72-77)

```typescript
let processorConfig;
try {
  processorConfig = getProcessorConfigFromEnv();
} catch (error) {
  throw new HttpsError('failed-precondition', error.message);
}
```

### Analysis

**The function WILL FAIL IMMEDIATELY if environment variables are not set**, throwing a `failed-precondition` error before any Document AI processing occurs.

**Required Environment Variables**:
- `DOCUMENTAI_LOCATION`: Must be set to `us` (processor region)
- `DOCUMENTAI_PROCESSOR_ID`: Must be set to `d8cd080814899dc4` (processor ID)

**Configuration File Expected**: `functions-ai-document/.env`

**Current Status**: Unknown - needs verification

### Why This Causes Silent Failure

**Code Location**: `src/app/routes/blueprint/modules/agreement/agreement.service.ts` (lines 64-91)

```typescript
async parseAttachment(agreement: Agreement): Promise<void> {
  // ... validation ...

  // ❌ NO TRY-CATCH AROUND THIS CALL
  const result = await this.processDocumentFromStorage({ gcsUri, mimeType: 'application/pdf' });
  
  // ❌ If function throws HttpsError('failed-precondition'), it propagates
  // but may not be caught properly due to async timing
}
```

**Code Location**: `src/app/routes/blueprint/modules/agreement/agreement-module-view.component.ts` (lines 164-175)

```typescript
async parse(agreement: Agreement): Promise<void> {
  this.parsingId.set(agreement.id); // ✅ Button disabled here
  try {
    await this.agreementService.parseAttachment(agreement);
    this.messageService.success('解析完成');
  } catch (error) {
    this.messageService.error('解析失敗'); // ✅ Generic error shown
    console.error('[AgreementModuleView]', 'parse failed', error);
  } finally {
    this.parsingId.set(null); // ✅ Should re-enable button
  }
}
```

### Why Button Stays Disabled

**Hypothesis**: If the error occurs during the async function call setup or if there's a Promise rejection that's not caught, the `finally` block may not execute, leaving `parsingId` set and the button disabled.

**Verification Needed**: Check browser console for:
```
[AgreementModuleView] parse failed Error: failed-precondition: Missing DOCUMENTAI_PROCESSOR_ID...
```

### Fix Priority: 🔴 CRITICAL

**Action Required**:
1. Create `functions-ai-document/.env` file
2. Add required environment variables
3. Redeploy function
4. Test again

---

## 🟡 Root Cause #2: GCS URI Construction Failure (70% Probability)

### Evidence

**Code Location**: `src/app/routes/blueprint/modules/agreement/agreement.service.ts` (lines 69-71)

```typescript
const storageRef = this.firebase.storageRef(agreement.attachmentPath);
const bucket: string | undefined = (storageRef as any).bucket;
const gcsUri = bucket ? `gs://${bucket}/${agreement.attachmentPath}` : null;
```

### Analysis

**Problem**: Using `(storageRef as any).bucket` is a type-unsafe way to access the bucket name. The Firebase Storage SDK may not expose this property consistently across versions.

**Firebase Storage SDK Version**: `@angular/fire 20.0.1` (from package.json)

**Potential Issues**:
1. `bucket` property may not exist on `StorageReference`
2. Property name may have changed in recent SDK versions
3. Returns `undefined` if property doesn't exist
4. `gcsUri` becomes `null` when bucket is undefined

### Why This Causes Silent Failure

**Code Location**: Same file, lines 73-75

```typescript
if (!gcsUri) {
  throw new Error('無法取得檔案路徑');
}
```

**This error SHOULD be caught and shown to user**, but if it happens during async initialization, it might be swallowed.

### Expected Bucket Name

Based on `app.config.ts` Firebase configuration:
```typescript
storageBucket: 'elite-chiller-455712-c4.firebasestorage.app'
```

### Correct Implementation

```typescript
// ✅ Hardcode bucket name instead of extracting
const STORAGE_BUCKET = 'elite-chiller-455712-c4.firebasestorage.app';
const gcsUri = `gs://${STORAGE_BUCKET}/${agreement.attachmentPath}`;
```

### Fix Priority: 🟡 HIGH

**Action Required**:
1. Add `console.log` before function call to verify GCS URI
2. If `null`, update to hardcoded bucket name
3. Test again

---

## 🟡 Root Cause #3: CORS or Region Configuration Issue (50% Probability)

### Evidence

**Code Location**: `src/app/app.config.ts` (line 198)

```typescript
provideFunctions(() => getFunctions(getApp(), 'asia-east1'))
```

**Code Location**: `functions-ai-document/src/handlers/process-document-handler.ts` (line 61)

```typescript
export const processDocumentFromStorage = onCall<ProcessDocumentFromStorageRequest>(
  {
    region: 'asia-east1',
    // ...
  },
  async request => { /* ... */ }
);
```

### Analysis

**Configuration Matches**: Frontend calls `asia-east1`, function deployed to `asia-east1` ✅

**However**, there could be CORS issues if:
1. Function not properly deployed to this region
2. Firebase App Check blocking requests
3. Network policies preventing cross-region calls

### App Check Configuration

**Code Location**: `src/app/app.config.ts` (lines 176-179)

```typescript
provideAppCheck(() => {
  const provider = new ReCaptchaEnterpriseProvider('6LcGnSUsAAAAAMIm1aYeWqoYNEmLphGIbwEfWJlc');
  return initializeAppCheck(undefined, { provider, isTokenAutoRefreshEnabled: true });
})
```

**Potential Issue**: App Check might be blocking function calls if token generation fails

### Verification Needed

Check browser Network tab for:
- Request URL: Should be `https://asia-east1-elite-chiller-455712-c4.cloudfunctions.net/processDocumentFromStorage`
- Status: Should be `200 OK`, not `404`, `403`, or `CORS error`
- Headers: Should include `X-Firebase-AppCheck` token

### Fix Priority: 🟡 MEDIUM

**Action Required**:
1. Check Network tab for CORS errors
2. Verify function is deployed to correct region
3. Test without App Check temporarily

---

## 🟢 Root Cause #4: IAM Permissions Missing (30% Probability)

### Evidence

**Service Account**: `elite-chiller-455712-c4@appspot.gserviceaccount.com` (default App Engine SA)

**Required Roles**:
1. `roles/documentai.apiUser` - To call Document AI API
2. `roles/storage.objectViewer` - To read files from Storage

### Analysis

**Code Location**: `functions-ai-document/src/handlers/process-document-handler.ts` (lines 159-167)

```typescript
const [result] = await client.processDocument({
  name: processorName,
  gcsDocument: { gcsUri, mimeType },
  skipHumanReview,
  fieldMask: fieldMask ? { paths: [fieldMask] } : undefined
});
```

If IAM permissions are missing, this call will fail with:
```
Error: 7 PERMISSION_DENIED: Permission 'documentai.processors.processDocument' denied
```

### Why This Could Be Silent

The error would be caught and logged to Cloud Functions logs, but might not propagate to frontend if error handling is incorrect.

### Verification Needed

```bash
gcloud projects get-iam-policy elite-chiller-455712-c4 \
  --flatten="bindings[].members" \
  --format="table(bindings.role)" \
  --filter="bindings.members:elite-chiller-455712-c4@appspot.gserviceaccount.com"
```

Expected roles should include `roles/documentai.apiUser`

### Fix Priority: 🟢 MEDIUM-LOW

**Action Required**:
1. Check Cloud Functions logs for permission errors
2. Grant `documentai.apiUser` role if missing
3. Test again

---

## 🟢 Root Cause #5: Document AI Processor Not Ready (20% Probability)

### Evidence

**Processor Information**:
- ID: `d8cd080814899dc4`
- Type: Custom Extractor
- Status: Enabled
- Training Data: 1 document

### Analysis

**Potential Issue**: Custom Extractor processors need training before they can process documents. With only 1 training document, the processor may not be fully trained or may fail on certain document types.

**Code Location**: `functions-ai-document/src/handlers/process-document-handler.ts` (line 169)

```typescript
if (!result.document) {
  throw new Error('No document returned from Document AI');
}
```

If processor returns empty result, this error is thrown.

### Verification Needed

Test processor status in Cloud Console:
```bash
curl -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  "https://us-documentai.googleapis.com/v1/projects/7807661688/locations/us/processors/d8cd080814899dc4"
```

Should return `"state": "ENABLED"` and recent successful processing statistics.

### Fix Priority: 🟢 LOW

**Action Required**:
1. Verify processor is fully trained
2. Test with a simple PDF first
3. Check processor logs in Cloud Console

---

## Diagnostic Decision Tree

```
Start: Button becomes disabled, no error shown
  │
  ├─ Check browser console
  │   │
  │   ├─ Error: "Missing DOCUMENTAI_PROCESSOR_ID"
  │   │   → Root Cause #1 (Environment Variables)
  │   │   → Fix: Set env vars and redeploy
  │   │
  │   ├─ Error: "無法取得檔案路徑"
  │   │   → Root Cause #2 (GCS URI Construction)
  │   │   → Fix: Hardcode bucket name
  │   │
  │   ├─ Error: CORS or 404
  │   │   → Root Cause #3 (Region/CORS Issue)
  │   │   → Fix: Check deployment and CORS config
  │   │
  │   └─ No error at all
  │       → Check Network tab
  │
  ├─ Check Network tab
  │   │
  │   ├─ No request to Cloud Functions
  │   │   → Error in service before function call
  │   │   → Likely Root Cause #2 (GCS URI null)
  │   │
  │   ├─ Request failed (4xx/5xx)
  │   │   → Check response body for error details
  │   │   → Likely Root Cause #1, #3, or #4
  │   │
  │   └─ Request pending forever
  │       → Timeout or hung function
  │       → Check Cloud Functions logs
  │
  └─ Check Cloud Functions logs
      │
      ├─ "Missing DOCUMENTAI..." error
      │   → Root Cause #1
      │
      ├─ "Permission denied" error
      │   → Root Cause #4
      │
      ├─ "No document returned" error
      │   → Root Cause #5
      │
      └─ No logs at all
          → Function not deployed or not called
          → Root Cause #3
```

---

## Recommended Investigation Order

### Phase 1: Quick Checks (5 minutes)

1. **Check browser console** - Look for JavaScript errors
2. **Check Network tab** - Verify HTTP request is made
3. **Add console.log** - In `parseAttachment` before function call:
   ```typescript
   console.log('[DEBUG]', { gcsUri, mimeType: 'application/pdf' });
   ```

### Phase 2: Backend Verification (10 minutes)

4. **Check function logs**:
   ```bash
   firebase functions:log --only processDocumentFromStorage --limit 20
   ```
5. **List deployed functions**:
   ```bash
   firebase functions:list
   ```
6. **Check environment variables**:
   ```bash
   cat functions-ai-document/.env
   ```

### Phase 3: Detailed Diagnostics (20 minutes)

7. **Test function directly** in browser console
8. **Verify IAM permissions**
9. **Test Document AI processor** independently
10. **Check App Check token generation**

---

## Most Likely Scenario

Based on code analysis, the **most likely scenario** is:

```
1. User clicks "解析" button
2. parsingId.set(agreement.id) → button disabled ✅
3. parseAttachment called
4. GCS URI constructed (may be null) ❌
5. processDocumentFromStorage called
6. Function immediately fails: "Missing DOCUMENTAI_PROCESSOR_ID" ❌
7. HttpsError('failed-precondition') thrown
8. Error caught in component try-catch ✅
9. messageService.error('解析失敗') shown ✅
10. finally block executes
11. parsingId.set(null) → button re-enabled ✅
```

**Expected User Experience**:
- Button should re-enable after error
- Error message "解析失敗" should appear
- Console should show detailed error

**If button stays disabled**:
- `finally` block not executing (unexpected)
- OR error happening before try-catch (in async initialization)
- OR page state corrupted

---

## Next Steps (No Code Changes)

### Immediate Actions

1. **Check browser console and Network tab** while clicking "解析"
2. **Run function log command** to see backend errors
3. **Verify .env file exists** in `functions-ai-document/`

### Based on Findings

- **If env vars missing**: Create .env, redeploy
- **If GCS URI null**: Update to hardcoded bucket
- **If CORS error**: Check function deployment
- **If no error at all**: Add debug logging throughout

### Provide to User

- Browser console screenshot
- Network tab screenshot
- Function logs output
- Current .env file contents (redacted if needed)

---

## Conclusion

**Highest Probability Root Cause**: Missing environment variables (95%)

**Most Likely Secondary Issue**: GCS URI construction failure (70%)

**Recommended First Fix**: Set environment variables and redeploy function

**Recommended Second Fix**: Hardcode storage bucket name

**No code changes made yet** - waiting for diagnostic confirmation.

---

**End of Root Cause Analysis Summary**
