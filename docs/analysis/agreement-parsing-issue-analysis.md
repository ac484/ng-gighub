# Agreement Document Parsing Issue - Detailed Analysis

**Date**: 2025-12-20  
**Analyst**: GitHub Copilot  
**Issue**: 解析按鈕變成灰色，沒有錯誤也沒有反應 (Parse button becomes disabled without errors or response)

---

## Executive Summary

### Problem Statement
When users click the "解析" (Parse) button in the Agreement module to process uploaded PDF documents using Google Document AI, the button becomes disabled (grayed out) but:
- No processing occurs
- No error messages appear
- No response is received from the backend
- The button remains disabled until page refresh

### Goal
Parse uploaded PDF documents using Google Cloud Document AI Custom Extractor processor and return structured JSON data to be stored alongside the agreement record.

### Processor Information
- **Name**: blueprint-agreement
- **ID**: d8cd080814899dc4
- **Type**: Custom Extractor
- **Status**: Enabled
- **Region**: us (United States)
- **Endpoint**: `https://us-documentai.googleapis.com/v1/projects/7807661688/locations/us/processors/d8cd080814899dc4:process`
- **Created**: 2025-12-20 23:20:06
- **Documents**: 1 document trained

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│ Frontend (Angular 20 + @angular/fire 20.0.1)                    │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ agreement-module-view.component.ts                        │   │
│ │ - User clicks "解析" button                               │   │
│ │ - Calls: agreementService.parseAttachment(agreement)      │   │
│ │ - Sets parsingId signal to disable button                │   │
│ └───────────────────────┬──────────────────────────────────┘   │
│                         │                                        │
│ ┌───────────────────────▼──────────────────────────────────┐   │
│ │ agreement.service.ts                                      │   │
│ │ - Constructs GCS URI from attachmentPath                  │   │
│ │ - Calls: processDocumentFromStorage({ gcsUri, mimeType }) │   │
│ │ - Saves parsed JSON to Storage                           │   │
│ │ - Updates Firestore with parsedJsonUrl                   │   │
│ └───────────────────────┬──────────────────────────────────┘   │
│                         │                                        │
│                         │ Firebase Functions HTTPS Callable     │
└─────────────────────────┼────────────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────────────┐
│ Backend (Firebase Cloud Functions v2)                            │
│ Region: asia-east1 (⚠️ ISSUE)                                    │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ functions-ai-document/src/handlers/                       │   │
│ │   process-document-handler.ts                            │   │
│ │                                                          │   │
│ │ export const processDocumentFromStorage = onCall({      │   │
│ │   region: 'asia-east1', // ⚠️ Function deployed here    │   │
│ │   memory: '2GiB',                                        │   │
│ │   timeoutSeconds: 540                                    │   │
│ │ }, async (request) => {                                  │   │
│ │   // 1. Get processor config from environment           │   │
│ │   // 2. Validate GCS URI                                │   │
│ │   // 3. Call Document AI API                            │   │
│ │   // 4. Convert and return results                      │   │
│ │ })                                                       │   │
│ └───────────────────────┬──────────────────────────────────┘   │
│                         │                                        │
└─────────────────────────┼────────────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────────────┐
│ Google Cloud Document AI                                         │
│ Region: us (United States) (⚠️ MISMATCH)                         │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Custom Extractor Processor                               │   │
│ │ - Processor ID: d8cd080814899dc4                         │   │
│ │ - Location: us                                           │   │
│ │ - Endpoint: us-documentai.googleapis.com                 │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Configuration Overview

| Component | Region | Configuration File |
|-----------|--------|-------------------|
| Angular App | N/A (Client-side) | `src/app/app.config.ts` |
| Firebase Functions | `asia-east1` | `app.config.ts` line 198 |
| `processDocumentFromStorage` | `asia-east1` | `process-document-handler.ts` line 61 |
| Document AI Processor | `us` | Environment variable |
| Firebase Storage | Default (us-central) | `app.config.ts` |

---

## Current Implementation Analysis

### 1. Frontend Flow (Agreement Service)

**File**: `src/app/routes/blueprint/modules/agreement/agreement.service.ts`

```typescript
async parseAttachment(agreement: Agreement): Promise<void> {
  if (!agreement.attachmentUrl || !agreement.attachmentPath) {
    throw new Error('缺少附件，無法解析');
  }

  // Extract GCS URI from Firebase Storage reference
  const storageRef = this.firebase.storageRef(agreement.attachmentPath);
  const bucket: string | undefined = (storageRef as any).bucket;
  const gcsUri = bucket ? `gs://${bucket}/${agreement.attachmentPath}` : null;

  if (!gcsUri) {
    throw new Error('無法取得檔案路徑');
  }

  // ⚠️ Call Firebase Functions (region: asia-east1)
  const result = await this.processDocumentFromStorage({ 
    gcsUri, 
    mimeType: 'application/pdf' 
  });
  
  // Save parsed JSON to Storage
  const jsonString = JSON.stringify(result.data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const parsedPath = `agreements/${agreement.id}/parsed.json`;
  const parsedRef = this.firebase.storageRef(parsedPath);
  await uploadBytes(parsedRef, blob);
  const parsedUrl = await getDownloadURL(parsedRef);
  await this.repository.saveParsedJsonUrl(agreement.id, parsedUrl);

  // Update local state
  this._agreements.update(items =>
    items.map(item => (item.id === agreement.id ? { ...item, parsedJsonUrl: parsedUrl } : item))
  );
}
```

**Key Points**:
1. ✅ Correctly constructs GCS URI from storage path
2. ✅ Uses pre-created `httpsCallable` (injection context issue avoided)
3. ⚠️ Assumes function is deployed to default or `asia-east1` region
4. ❌ No error handling for function call failures
5. ❌ No timeout handling (function has 540s timeout)

### 2. Backend Flow (Cloud Functions)

**File**: `functions-ai-document/src/handlers/process-document-handler.ts`

```typescript
export const processDocumentFromStorage = onCall<ProcessDocumentFromStorageRequest>(
  {
    region: 'asia-east1', // ⚠️ Function region
    memory: '2GiB',
    timeoutSeconds: 540, // 9 minutes
    maxInstances: 10
  },
  async request => {
    const startTime = Date.now();
    const { gcsUri, mimeType, skipHumanReview = true, fieldMask } = request.data;
    const userId = request.auth?.uid;

    // 1. Get processor config from environment variables
    let processorConfig;
    try {
      processorConfig = getProcessorConfigFromEnv();
    } catch (error) {
      throw new HttpsError('failed-precondition', error.message);
    }

    // 2. Validate GCS URI and document
    const uriValidation = validateGcsUri(gcsUri);
    if (!uriValidation.valid) {
      throw new HttpsError('invalid-argument', uriValidation.reason);
    }

    // 3. Get file metadata to validate size
    const bucketRef = admin.storage().bucket(bucket);
    const file = bucketRef.file(filePath);
    const [metadata] = await file.getMetadata();
    const fileSize = parseInt(metadata.size, 10);

    // 4. Validate document size and mime type
    const validation = validateDocument(mimeType, fileSize);
    if (!validation.valid) {
      throw new HttpsError('invalid-argument', validation.reason);
    }

    // 5. Initialize Document AI client
    const client = new DocumentProcessorServiceClient({
      apiEndpoint: processorConfig.apiEndpoint || 
                   `${processorConfig.location}-documentai.googleapis.com`
    });

    // 6. Process document
    const [result] = await client.processDocument({
      name: getProcessorName(processorConfig),
      gcsDocument: { gcsUri, mimeType },
      skipHumanReview,
      fieldMask: fieldMask ? { paths: [fieldMask] } : undefined
    });

    // 7. Convert and return results
    const processingResult = convertToProcessingResult(result.document, duration, mimeType);
    return { success: true, result: processingResult };
  }
);
```

**Key Points**:
1. ⚠️ Function deployed to `asia-east1` region
2. ⚠️ Processor located in `us` region (cross-region call)
3. ✅ Comprehensive validation and error handling
4. ✅ Proper logging to Firestore audit trail
5. ⚠️ Depends on environment variables (`DOCUMENTAI_LOCATION`, `DOCUMENTAI_PROCESSOR_ID`)

### 3. Environment Configuration

**File**: `functions-ai-document/.env.example`

```bash
# Document AI Processor Configuration
DOCUMENTAI_LOCATION=us
DOCUMENTAI_PROCESSOR_ID=your-processor-id-here
# DOCUMENTAI_API_ENDPOINT=us-documentai.googleapis.com (optional)
```

**Required Environment Variables**:
- `GCLOUD_PROJECT`: Auto-set by Firebase (project: elite-chiller-455712-c4)
- `DOCUMENTAI_LOCATION`: Must be set to `us` (processor region)
- `DOCUMENTAI_PROCESSOR_ID`: Must be set to `d8cd080814899dc4`

### 4. Frontend Firebase Configuration

**File**: `src/app/app.config.ts`

```typescript
// Line 198: Functions region configuration
provideFunctions(() => getFunctions(getApp(), 'asia-east1'))
```

**Key Points**:
1. ✅ Firebase Functions SDK configured to call `asia-east1` region
2. ✅ Matches the function deployment region
3. ⚠️ Creates cross-region calls to Document AI in `us`

---

## Root Cause Analysis

### Potential Issues Identified

#### 🔴 **CRITICAL ISSUE #1: Missing Environment Variables**

**Evidence**:
- The processor requires `DOCUMENTAI_LOCATION=us` and `DOCUMENTAI_PROCESSOR_ID=d8cd080814899dc4`
- Function code throws `failed-precondition` error if these are missing
- No environment configuration found in deployed function

**Impact**:
```typescript
// This will throw and return HttpsError immediately
processorConfig = getProcessorConfigFromEnv();
// Throws: 'Missing DOCUMENTAI_PROCESSOR_ID environment variable'
```

**Verification Needed**:
```bash
# Check deployed function environment
firebase functions:config:get --project elite-chiller-455712-c4
```

#### 🟡 **HIGH PRIORITY #2: Region Mismatch**

**Evidence**:
- Function deployed to `asia-east1`
- Processor located in `us` region
- Creates cross-region API calls with potential latency

**Impact**:
- Increased latency (200-500ms additional)
- Potential network issues between regions
- Not following Google Cloud best practices

**Recommendation**:
- Deploy function to `us-central1` (closer to `us` Document AI region)
- OR migrate processor to `asia-east1` region

#### 🟡 **HIGH PRIORITY #3: CORS and Region Configuration**

**Evidence**:
```typescript
// app.config.ts line 198
provideFunctions(() => getFunctions(getApp(), 'asia-east1'))
```

**Impact**:
- If function is not properly deployed or CORS is misconfigured, calls will fail silently
- No error propagation to frontend in some scenarios

#### 🟡 **MEDIUM PRIORITY #4: Error Handling Gaps**

**Frontend Issues**:
```typescript
// agreement.service.ts line 78-79
const result = await this.processDocumentFromStorage({ gcsUri, mimeType: 'application/pdf' });
// ❌ No try-catch around this call
```

**Component Issues**:
```typescript
// agreement-module-view.component.ts line 167
await this.agreementService.parseAttachment(agreement);
// ✅ Has try-catch, but only shows generic error
```

**Impact**:
- Errors may be swallowed or not properly reported
- Users only see "解析失敗" without details
- No console logging of actual error

#### 🟡 **MEDIUM PRIORITY #5: Storage Bucket Access**

**Evidence**:
```typescript
// Line 70-71 in agreement.service.ts
const bucket: string | undefined = (storageRef as any).bucket;
const gcsUri = bucket ? `gs://${bucket}/${agreement.attachmentPath}` : null;
```

**Impact**:
- Using `(storageRef as any).bucket` is fragile
- May return undefined if storage reference structure changes
- Should use Firebase Admin SDK or known bucket name

**Expected GCS URI**:
```
gs://elite-chiller-455712-c4.firebasestorage.app/agreements/{agreementId}/{filename}.pdf
```

#### 🟢 **LOW PRIORITY #6: Long Timeout**

**Evidence**:
```typescript
timeoutSeconds: 540, // 9 minutes
```

**Impact**:
- Very long timeout may cause frontend to wait indefinitely
- Should implement progress polling or websocket updates
- Consider async processing with status updates

---

## Detailed Investigation Steps

### Step 1: Check Function Deployment Status

```bash
# List all deployed functions
firebase functions:list --project elite-chiller-455712-c4

# Expected output:
# ✓ processDocumentFromStorage (asia-east1)
#   - Status: ACTIVE
#   - Runtime: nodejs22
#   - Memory: 2GiB
#   - Timeout: 540s
```

### Step 2: Verify Environment Variables

```bash
# Check environment configuration
firebase functions:config:get --project elite-chiller-455712-c4

# Expected output:
# {
#   "documentai": {
#     "location": "us",
#     "processor_id": "d8cd080814899dc4"
#   }
# }

# If missing, set them:
firebase functions:config:set \
  documentai.location="us" \
  documentai.processor_id="d8cd080814899dc4" \
  --project elite-chiller-455712-c4

# Note: Firebase Functions v7+ uses process.env directly
# Need to check if .env is properly configured
```

### Step 3: Check Function Logs

```bash
# View recent logs for the function
firebase functions:log --only processDocumentFromStorage --project elite-chiller-455712-c4

# Look for:
# - "Missing DOCUMENTAI_PROCESSOR_ID environment variable"
# - "Invalid GCS URI"
# - "Document validation failed"
# - API errors from Document AI
```

### Step 4: Test GCS URI Construction

```typescript
// Add logging in agreement.service.ts
async parseAttachment(agreement: Agreement): Promise<void> {
  const storageRef = this.firebase.storageRef(agreement.attachmentPath);
  const bucket: string | undefined = (storageRef as any).bucket;
  const gcsUri = bucket ? `gs://${bucket}/${agreement.attachmentPath}` : null;
  
  console.log('[AgreementService] Parsing details:', {
    attachmentPath: agreement.attachmentPath,
    bucket,
    gcsUri,
    mimeType: 'application/pdf'
  });
  
  // Continue with function call...
}
```

### Step 5: Test Function Call Directly

```typescript
// In browser console after upload
const functions = getFunctions(getApp(), 'asia-east1');
const testCall = httpsCallable(functions, 'processDocumentFromStorage');

const result = await testCall({
  gcsUri: 'gs://elite-chiller-455712-c4.firebasestorage.app/agreements/{agreementId}/test.pdf',
  mimeType: 'application/pdf'
});

console.log('Direct call result:', result);
```

### Step 6: Verify Storage Access Permissions

```bash
# Check Firestore Security Rules for storage
cat storage.rules

# Verify service account has access to Document AI
gcloud projects get-iam-policy elite-chiller-455712-c4 \
  --flatten="bindings[].members" \
  --format="table(bindings.role)" \
  --filter="bindings.members:serviceAccount"
```

---

## Diagnostic Checklist

### Configuration Verification

- [ ] **Environment Variables Set**
  - [ ] `DOCUMENTAI_LOCATION=us` configured
  - [ ] `DOCUMENTAI_PROCESSOR_ID=d8cd080814899dc4` configured
  - [ ] Variables deployed to Cloud Functions

- [ ] **Function Deployment**
  - [ ] Function `processDocumentFromStorage` deployed
  - [ ] Deployed to `asia-east1` region
  - [ ] Status: ACTIVE
  - [ ] No deployment errors

- [ ] **Processor Configuration**
  - [ ] Processor ID: `d8cd080814899dc4` exists
  - [ ] Processor Status: Enabled
  - [ ] Processor Type: Custom Extractor
  - [ ] Training data: 1+ documents

- [ ] **IAM Permissions**
  - [ ] Service account has `roles/documentai.apiUser`
  - [ ] Service account has `roles/storage.objectViewer`
  - [ ] Service account can access source bucket

- [ ] **Network Configuration**
  - [ ] CORS configured for Functions
  - [ ] No VPC restrictions blocking calls
  - [ ] No firewall rules blocking Document AI API

### Runtime Verification

- [ ] **Frontend Logs**
  - [ ] Check browser console for errors
  - [ ] Check Network tab for failed requests
  - [ ] Verify function call URL is correct
  - [ ] Check request/response payloads

- [ ] **Backend Logs**
  - [ ] Check Cloud Functions logs
  - [ ] Look for environment variable errors
  - [ ] Look for GCS access errors
  - [ ] Look for Document AI API errors

- [ ] **Storage Access**
  - [ ] Uploaded PDF exists at path
  - [ ] PDF is accessible via GCS URI
  - [ ] File size < 32MB (Document AI limit)
  - [ ] MIME type is `application/pdf`

### User Experience

- [ ] **Button State**
  - [ ] Button shows "解析" initially
  - [ ] Button becomes disabled on click
  - [ ] `parsingId()` signal is set correctly
  - [ ] Button re-enables after completion/error

- [ ] **Error Messages**
  - [ ] Error messages appear on failures
  - [ ] Error messages are descriptive
  - [ ] Console logs show full error details

- [ ] **Success Flow**
  - [ ] Parsed JSON saved to Storage
  - [ ] `parsedJsonUrl` updated in Firestore
  - [ ] UI updates with success message
  - [ ] Agreement list refreshes

---

## Technical Specifications

### Document AI API Requirements

**Supported Input**:
- Max file size: 32 MB
- Supported formats: PDF, TIFF, GIF, JPEG, PNG, BMP, WEBP
- Max pages: 15 pages for synchronous, 500 for asynchronous

**API Endpoint**:
```
POST https://us-documentai.googleapis.com/v1/projects/7807661688/locations/us/processors/d8cd080814899dc4:process
```

**Request Format**:
```json
{
  "name": "projects/7807661688/locations/us/processors/d8cd080814899dc4",
  "gcsDocument": {
    "gcsUri": "gs://elite-chiller-455712-c4.firebasestorage.app/agreements/xxx/file.pdf",
    "mimeType": "application/pdf"
  },
  "skipHumanReview": true
}
```

**Response Format**:
```json
{
  "document": {
    "text": "...",
    "pages": [...],
    "entities": [...],
    "formFields": [...]
  }
}
```

### Current Dependencies

**Frontend**:
- `@angular/fire`: 20.0.1
- `@google-cloud/documentai`: Not used (server-side only)

**Backend**:
- `@google-cloud/documentai`: 9.5.0
- `firebase-admin`: 13.6.0
- `firebase-functions`: 7.0.0

### Known Limitations

1. **Synchronous Processing Limit**: 15 pages per document
2. **File Size Limit**: 32 MB per document
3. **Timeout**: 540 seconds (9 minutes)
4. **Region Latency**: Cross-region calls add 200-500ms
5. **Rate Limits**: Google Cloud Document AI quotas apply

---

## Recommended Investigation Priority

### 🔴 **IMMEDIATE (Must Check First)**

1. **Check Function Logs**
   ```bash
   firebase functions:log --only processDocumentFromStorage
   ```
   - Look for environment variable errors
   - Check if function is being called at all
   - Identify any error messages

2. **Verify Environment Variables**
   ```bash
   firebase functions:config:get
   ```
   - Confirm `DOCUMENTAI_LOCATION` is set
   - Confirm `DOCUMENTAI_PROCESSOR_ID` is set

3. **Test Function Deployment**
   ```bash
   firebase functions:list
   ```
   - Verify function exists and is ACTIVE
   - Check deployment region matches config

### 🟡 **HIGH PRIORITY (Check if Above Pass)**

4. **Check Browser Console**
   - Open DevTools Network tab
   - Click "解析" button
   - Look for failed HTTP requests
   - Check request payload and response

5. **Verify GCS URI Construction**
   - Add console.log in parseAttachment method
   - Verify bucket name is extracted correctly
   - Confirm GCS URI format is valid

6. **Test IAM Permissions**
   - Verify service account permissions
   - Check storage bucket access
   - Confirm Document AI API is enabled

### 🟢 **LOWER PRIORITY (Optimization)**

7. **Region Optimization**
   - Consider moving function to us-central1
   - OR migrate processor to asia-east1

8. **Error Handling Enhancement**
   - Add detailed logging throughout
   - Improve error messages to users
   - Add retry logic for transient failures

---

## Expected Issues and Solutions

### Issue 1: Environment Variables Not Set

**Symptoms**:
- Button becomes disabled immediately
- Function logs show "Missing DOCUMENTAI_PROCESSOR_ID"
- No Document AI API call is made

**Solution**:
```bash
# Firebase Functions v7+ uses .env file
cd functions-ai-document
echo "DOCUMENTAI_LOCATION=us" >> .env
echo "DOCUMENTAI_PROCESSOR_ID=d8cd080814899dc4" >> .env

# Redeploy function
firebase deploy --only functions:processDocumentFromStorage
```

### Issue 2: Function Not Deployed

**Symptoms**:
- Browser console shows 404 error
- Function call never reaches backend

**Solution**:
```bash
cd functions-ai-document
npm run build
firebase deploy --only functions:processDocumentFromStorage
```

### Issue 3: CORS Error

**Symptoms**:
- Browser shows CORS policy error
- Request is blocked before reaching function

**Solution**:
```typescript
// Already handled by Firebase Functions v2
// onCall automatically sets CORS headers
```

### Issue 4: GCS URI Invalid

**Symptoms**:
- Function logs show "Invalid GCS URI"
- Validation fails immediately

**Solution**:
```typescript
// Fix bucket extraction
const STORAGE_BUCKET = 'elite-chiller-455712-c4.firebasestorage.app';
const gcsUri = `gs://${STORAGE_BUCKET}/${agreement.attachmentPath}`;
```

### Issue 5: IAM Permissions Missing

**Symptoms**:
- Function reaches Document AI but gets permission denied
- Error: "Permission 'documentai.processors.processDocument' denied"

**Solution**:
```bash
# Grant Document AI API User role to service account
gcloud projects add-iam-policy-binding elite-chiller-455712-c4 \
  --member="serviceAccount:elite-chiller-455712-c4@appspot.gserviceaccount.com" \
  --role="roles/documentai.apiUser"
```

---

## Data Flow Verification

### Step-by-Step Expected Flow

1. **User Action**
   - User clicks "解析" button
   - Component calls `agreementService.parseAttachment(agreement)`
   - `parsingId` signal set to `agreement.id` (disables button)

2. **Service Layer**
   - Validates `attachmentUrl` and `attachmentPath` exist
   - Constructs GCS URI: `gs://{bucket}/{path}`
   - Calls `processDocumentFromStorage()` function

3. **Network Request**
   - HTTPS request to: `https://asia-east1-elite-chiller-455712-c4.cloudfunctions.net/processDocumentFromStorage`
   - Headers include Firebase Auth token
   - Body: `{ gcsUri, mimeType: "application/pdf" }`

4. **Cloud Function Processing**
   - Validates request authentication
   - Loads environment variables
   - Validates GCS URI format
   - Fetches file metadata from Storage
   - Validates file size and MIME type
   - Initializes Document AI client
   - Calls Document AI API

5. **Document AI Processing**
   - Fetches document from GCS
   - Processes with Custom Extractor
   - Extracts entities and structured data
   - Returns processed document

6. **Response Processing**
   - Cloud Function converts result format
   - Returns JSON response to frontend
   - Frontend saves JSON to Storage
   - Frontend updates Firestore
   - Frontend updates UI state

7. **UI Update**
   - Success message appears
   - `parsingId` signal reset to null
   - Button re-enabled
   - Agreement list updates with `parsedJsonUrl`

### Critical Failure Points

Each step above can fail. Here are the most likely failure points:

| Step | Failure Point | Symptom | Debug Method |
|------|--------------|---------|--------------|
| 1 | Button click handler error | Console error | Check browser console |
| 2 | Missing attachment data | Error thrown | Check agreement object |
| 2 | Invalid GCS URI construction | Error thrown | Log constructed URI |
| 3 | Network request fails | 404/500 error | Check Network tab |
| 3 | CORS blocked | CORS error | Check Network tab |
| 4 | Auth token missing/invalid | 401 error | Check auth state |
| 4 | Environment vars missing | 500 error | Check function logs |
| 4 | File not accessible | GCS error | Check storage rules |
| 5 | API quota exceeded | 429 error | Check Cloud Console |
| 5 | IAM permissions missing | 403 error | Check IAM roles |
| 6 | Response timeout | No response | Check function timeout |
| 6 | Parse error | Exception | Check function logs |
| 7 | Storage write fails | Error thrown | Check storage rules |
| 7 | Firestore update fails | Error thrown | Check firestore rules |

---

## Next Steps (No Code Changes)

### Investigation Phase

1. **Immediate Actions** (5 minutes)
   - [ ] Check browser console for errors
   - [ ] Check Network tab for failed requests
   - [ ] Verify function is being called

2. **Backend Verification** (10 minutes)
   - [ ] Run `firebase functions:log --only processDocumentFromStorage`
   - [ ] Run `firebase functions:list`
   - [ ] Run `firebase functions:config:get`

3. **Configuration Check** (10 minutes)
   - [ ] Verify `.env` file in `functions-ai-document/`
   - [ ] Check if environment variables are deployed
   - [ ] Verify processor ID matches

4. **Permissions Audit** (15 minutes)
   - [ ] Check service account IAM roles
   - [ ] Verify Document AI API is enabled
   - [ ] Test storage access directly

### Documentation Phase

5. **Update Analysis** (After investigation)
   - [ ] Document actual errors found
   - [ ] Update root cause analysis
   - [ ] Confirm proposed solutions

### Solution Phase (After Analysis Complete)

6. **Fix Implementation** (TBD)
   - [ ] Set environment variables if missing
   - [ ] Fix GCS URI construction if needed
   - [ ] Add comprehensive error handling
   - [ ] Improve logging and user feedback
   - [ ] Add retry logic for transient failures

---

## Questions for User

To complete this analysis and identify the exact root cause, please provide:

1. **Function Logs**: Run `firebase functions:log --only processDocumentFromStorage` and share output
2. **Browser Console**: Open DevTools, click "解析", and share any errors
3. **Network Tab**: Share the failed request details (URL, status, response)
4. **Environment Config**: Run `firebase functions:config:get` and share (redact sensitive data)
5. **Function Deployment**: Run `firebase functions:list` and confirm status

---

## Conclusion

This analysis has identified **5 potential root causes** for the agreement parsing issue:

1. 🔴 **CRITICAL**: Missing environment variables (`DOCUMENTAI_LOCATION`, `DOCUMENTAI_PROCESSOR_ID`)
2. 🟡 **HIGH**: Cross-region latency and potential network issues
3. 🟡 **HIGH**: CORS or region configuration mismatch
4. 🟡 **MEDIUM**: Insufficient error handling and logging
5. 🟡 **MEDIUM**: Fragile GCS URI construction

**Most Likely Root Cause**: Missing environment variables in the deployed Cloud Function, causing immediate failure with `failed-precondition` error that is not properly propagated to the frontend.

**Recommended First Action**: Check function logs and verify environment variables are set correctly.

**No code changes will be made** until the investigation phase completes and the actual root cause is confirmed through logs and testing.

---

## Appendix A: Function Region Configuration

### Current Configuration
```typescript
// app.config.ts line 198
provideFunctions(() => getFunctions(getApp(), 'asia-east1'))
```

### Alternative Configurations

**Option 1: Move function to us-central1 (Recommended)**
```typescript
// Update app.config.ts
provideFunctions(() => getFunctions(getApp(), 'us-central1'))

// Update process-document-handler.ts
export const processDocumentFromStorage = onCall({
  region: 'us-central1', // Closer to Document AI 'us' region
  // ...rest of config
});
```

**Option 2: Keep current but optimize**
```typescript
// Keep asia-east1 but add connection pooling and retry logic
```

**Option 3: Multi-region deployment**
```typescript
// Deploy to multiple regions for redundancy
export const processDocumentFromStorage_us = onCall({ region: 'us-central1' });
export const processDocumentFromStorage_asia = onCall({ region: 'asia-east1' });
```

---

## Appendix B: Environment Variable Configuration

### Firebase Functions v7+ Environment Variables

**Method 1: .env file (Recommended)**
```bash
# functions-ai-document/.env
DOCUMENTAI_LOCATION=us
DOCUMENTAI_PROCESSOR_ID=d8cd080814899dc4
```

**Method 2: Firebase CLI (Legacy)**
```bash
firebase functions:config:set \
  documentai.location="us" \
  documentai.processor_id="d8cd080814899dc4"
```

**Method 3: Google Cloud Console**
- Go to Cloud Functions console
- Select function
- Edit → Environment variables
- Add variables manually

---

## Appendix C: Complete Error Handling Pattern

### Recommended Service Implementation

```typescript
async parseAttachment(agreement: Agreement): Promise<void> {
  // Validation
  if (!agreement.attachmentUrl || !agreement.attachmentPath) {
    const error = new Error('缺少附件，無法解析');
    this.logger.error('[AgreementService]', 'Missing attachment', error, { agreementId: agreement.id });
    throw error;
  }

  // GCS URI construction with fallback
  const STORAGE_BUCKET = 'elite-chiller-455712-c4.firebasestorage.app';
  const gcsUri = `gs://${STORAGE_BUCKET}/${agreement.attachmentPath}`;

  this.logger.info('[AgreementService]', 'Starting parse', {
    agreementId: agreement.id,
    gcsUri,
    mimeType: 'application/pdf'
  });

  try {
    // Call function with timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('解析超時 (9 分鐘)')), 540000)
    );

    const callPromise = this.processDocumentFromStorage({
      gcsUri,
      mimeType: 'application/pdf'
    });

    const result = await Promise.race([callPromise, timeoutPromise]);

    // Validate response
    if (!result?.data?.success || !result?.data?.result) {
      throw new Error('解析失敗: 無效的回應格式');
    }

    // Save parsed JSON
    const jsonString = JSON.stringify(result.data.result, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const parsedPath = `agreements/${agreement.id}/parsed.json`;
    const parsedRef = this.firebase.storageRef(parsedPath);

    await uploadBytes(parsedRef, blob);
    const parsedUrl = await getDownloadURL(parsedRef);

    // Update Firestore
    await this.repository.saveParsedJsonUrl(agreement.id, parsedUrl);

    // Update local state
    this._agreements.update(items =>
      items.map(item =>
        item.id === agreement.id ? { ...item, parsedJsonUrl: parsedUrl } : item
      )
    );

    this.logger.info('[AgreementService]', 'Parse completed', {
      agreementId: agreement.id,
      parsedUrl
    });
  } catch (error) {
    this.logger.error('[AgreementService]', 'Parse failed', error as Error, {
      agreementId: agreement.id,
      gcsUri
    });

    // Determine specific error message
    let userMessage = '解析失敗';
    if (error instanceof Error) {
      if (error.message.includes('Missing DOCUMENTAI')) {
        userMessage = '系統配置錯誤，請聯繫管理員';
      } else if (error.message.includes('Permission denied')) {
        userMessage = '權限不足，無法存取文件';
      } else if (error.message.includes('not found')) {
        userMessage = '找不到文件';
      } else if (error.message.includes('timeout')) {
        userMessage = '解析超時，請稍後再試';
      } else {
        userMessage = `解析失敗: ${error.message}`;
      }
    }

    throw new Error(userMessage);
  }
}
```

---

**End of Analysis Document**
