# Agreement Parsing Diagnostic Checklist

**Issue**: 解析按鈕變成灰色，沒有錯誤也沒有反應  
**Date**: 2025-12-20  
**Status**: Investigation Phase - No Code Changes

---

## Quick Diagnostic Steps

### 🔴 Step 1: Check Browser Console (2 minutes)

Open browser DevTools (F12) and:

```javascript
// 1. Check for console errors
// Look for any red errors when clicking "解析" button

// 2. Check Network tab
// Filter by: XHR/Fetch
// Look for: processDocumentFromStorage
// Status should be: 200 OK

// 3. Run this in console after clicking "解析":
console.table(performance.getEntriesByType("resource").filter(r => r.name.includes("processDocument")));
```

**Expected Result**: Should see HTTP request to Cloud Functions endpoint

**If fails**: Note the error message and status code

---

### 🔴 Step 2: Check Function Deployment (3 minutes)

```bash
# Navigate to project root
cd /home/runner/work/ng-gighub/ng-gighub

# Check if function is deployed
firebase functions:list --project elite-chiller-455712-c4

# Expected output:
# processDocumentFromStorage(asia-east1): [STATUS: ACTIVE]
```

**If not deployed**:
```bash
cd functions-ai-document
npm run build
firebase deploy --only functions:processDocumentFromStorage
```

---

### 🔴 Step 3: Check Function Logs (5 minutes)

```bash
# View recent logs
firebase functions:log --only processDocumentFromStorage --project elite-chiller-455712-c4 --limit 50

# Look for these specific errors:
# - "Missing DOCUMENTAI_PROCESSOR_ID environment variable"
# - "Missing DOCUMENTAI_LOCATION environment variable"
# - "Invalid GCS URI"
# - "Permission denied"
# - "Document validation failed"
```

**Common Error Patterns**:

| Error Message | Root Cause | Fix |
|--------------|------------|-----|
| `Missing DOCUMENTAI_PROCESSOR_ID` | Environment variable not set | Set in `.env` file |
| `Invalid GCS URI` | Bucket name extraction failed | Hardcode bucket name |
| `Permission denied` | IAM role missing | Grant documentai.apiUser |
| `File not found` | Wrong storage path | Check attachment path |

---

### 🟡 Step 4: Verify Environment Variables (5 minutes)

```bash
# Check current config
firebase functions:config:get --project elite-chiller-455712-c4

# Check .env file
cat functions-ai-document/.env

# Should contain:
# DOCUMENTAI_LOCATION=us
# DOCUMENTAI_PROCESSOR_ID=d8cd080814899dc4
```

**If missing, create .env file**:
```bash
cd functions-ai-document
cat > .env << EOF
DOCUMENTAI_LOCATION=us
DOCUMENTAI_PROCESSOR_ID=d8cd080814899dc4
EOF

# Redeploy
npm run build
firebase deploy --only functions:processDocumentFromStorage
```

---

### 🟡 Step 5: Test GCS URI Construction (3 minutes)

Add temporary logging to test URI construction:

```typescript
// In agreement.service.ts, parseAttachment method
// Add before function call:

console.log('[DEBUG] Parse attempt:', {
  agreementId: agreement.id,
  attachmentPath: agreement.attachmentPath,
  attachmentUrl: agreement.attachmentUrl,
  constructedUri: gcsUri
});
```

**Expected GCS URI format**:
```
gs://elite-chiller-455712-c4.firebasestorage.app/agreements/{agreementId}/filename.pdf
```

**If URI is null or invalid**: Hardcode bucket name

---

### 🟡 Step 6: Test Function Call Directly (5 minutes)

In browser console, test the function call directly:

```javascript
// Get Firebase Functions instance
const { getFunctions, httpsCallable } = await import('https://www.gstatic.com/firebasejs/10.0.0/firebase-functions.js');
const { getApp } = await import('https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js');

const functions = getFunctions(getApp(), 'asia-east1');
const processDoc = httpsCallable(functions, 'processDocumentFromStorage');

// Test call with sample data
try {
  const result = await processDoc({
    gcsUri: 'gs://elite-chiller-455712-c4.firebasestorage.app/agreements/test-id/test.pdf',
    mimeType: 'application/pdf'
  });
  console.log('Success:', result.data);
} catch (error) {
  console.error('Error:', error.code, error.message, error.details);
}
```

**Interpret Results**:
- `unauthenticated`: User not logged in
- `failed-precondition`: Environment variables missing
- `invalid-argument`: Invalid GCS URI or file
- `permission-denied`: IAM permissions issue
- `not-found`: File doesn't exist

---

## Issue Identification Matrix

| Symptom | Likely Cause | Priority | Fix Reference |
|---------|-------------|----------|---------------|
| Button grays out, no console error | Silent exception in service | 🔴 Critical | Check Step 5 |
| Button grays out, "解析失敗" message | Function call failed | 🔴 Critical | Check Steps 2-3 |
| Console: "Missing DOCUMENTAI_PROCESSOR_ID" | Env vars not set | 🔴 Critical | See Step 4 |
| Console: 404 error | Function not deployed | 🔴 Critical | See Step 2 |
| Console: "Invalid GCS URI" | URI construction failed | 🟡 High | See Step 5 |
| Console: "Permission denied" | IAM roles missing | 🟡 High | See IAM section below |
| Timeout after 9 minutes | Document too large/complex | 🟢 Medium | Use async processing |
| Random failures | Network issues | 🟢 Low | Add retry logic |

---

## IAM Permissions Check

### Required Service Account Permissions

```bash
# Get service account email
PROJECT_ID="elite-chiller-455712-c4"
SA_EMAIL="${PROJECT_ID}@appspot.gserviceaccount.com"

# Check current roles
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --format="table(bindings.role)" \
  --filter="bindings.members:${SA_EMAIL}"

# Required roles:
# - roles/documentai.apiUser
# - roles/storage.objectViewer
# - roles/cloudfunctions.invoker
```

### Grant Missing Permissions

```bash
# Grant Document AI API User role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/documentai.apiUser"

# Grant Storage Object Viewer role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/storage.objectViewer"
```

---

## API Status Check

### Verify Document AI API is Enabled

```bash
# Check if API is enabled
gcloud services list --enabled --project elite-chiller-455712-c4 | grep documentai

# Expected output:
# documentai.googleapis.com

# If not enabled:
gcloud services enable documentai.googleapis.com --project elite-chiller-455712-c4
```

### Test Processor Accessibility

```bash
# Test processor access
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  "https://us-documentai.googleapis.com/v1/projects/7807661688/locations/us/processors/d8cd080814899dc4" | jq .

# Should return processor details, not error
```

---

## Storage Access Verification

### Check Storage Rules

```bash
# View storage rules
cat storage.rules

# Should allow authenticated read/write to agreements path
```

### Test File Access

```bash
# List files in agreements directory (requires Firebase Admin SDK)
gsutil ls gs://elite-chiller-455712-c4.firebasestorage.app/agreements/

# Test file download
gsutil cat gs://elite-chiller-455712-c4.firebasestorage.app/agreements/{agreementId}/file.pdf > /dev/null
```

---

## Network Diagnostics

### Check Function Endpoint

```bash
# Get function URL
firebase functions:list --project elite-chiller-455712-c4 | grep processDocumentFromStorage

# Expected:
# https://asia-east1-elite-chiller-455712-c4.cloudfunctions.net/processDocumentFromStorage
```

### Test Endpoint Accessibility

```bash
# Test with curl (should return 401 or 403 without auth, not 404)
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{}' \
  https://asia-east1-elite-chiller-455712-c4.cloudfunctions.net/processDocumentFromStorage

# Expected: {"error": {"status": "UNAUTHENTICATED", ...}}
# Not expected: 404 Not Found
```

---

## Complete Diagnostic Report Template

```markdown
## Agreement Parsing Diagnostic Report

**Date**: [YYYY-MM-DD]
**Tested By**: [Name]

### Environment
- Firebase Project: elite-chiller-455712-c4
- Function Region: asia-east1
- Processor Region: us
- Processor ID: d8cd080814899dc4

### Test Results

#### 1. Browser Console
- [ ] No errors on page load
- [ ] Error appears when clicking "解析":
  ```
  [Paste error message here]
  ```

#### 2. Network Tab
- [ ] Request to processDocumentFromStorage found
- [ ] Status code: [200/400/401/403/404/500]
- [ ] Response body:
  ```json
  [Paste response here]
  ```

#### 3. Function Deployment
- [ ] Function listed in `firebase functions:list`
- [ ] Status: [ACTIVE/INACTIVE/ERROR]
- [ ] Region: [asia-east1/other]

#### 4. Function Logs
- [ ] Recent logs found
- [ ] Error messages:
  ```
  [Paste relevant log lines here]
  ```

#### 5. Environment Variables
- [ ] DOCUMENTAI_LOCATION set to: [us/other/missing]
- [ ] DOCUMENTAI_PROCESSOR_ID set to: [d8cd080814899dc4/other/missing]

#### 6. GCS URI
- [ ] Constructed URI: [gs://bucket/path]
- [ ] Format valid: [YES/NO]

#### 7. IAM Permissions
- [ ] documentai.apiUser granted: [YES/NO]
- [ ] storage.objectViewer granted: [YES/NO]

#### 8. API Status
- [ ] Document AI API enabled: [YES/NO]
- [ ] Processor accessible: [YES/NO]

### Root Cause Identified
[Describe the identified root cause here]

### Recommended Fix
[Describe the recommended solution here]

### Additional Notes
[Any other observations]
```

---

## Quick Fix Commands

### Fix 1: Set Environment Variables and Redeploy

```bash
cd /home/runner/work/ng-gighub/ng-gighub/functions-ai-document

# Create .env file
cat > .env << 'EOF'
DOCUMENTAI_LOCATION=us
DOCUMENTAI_PROCESSOR_ID=d8cd080814899dc4
EOF

# Build and deploy
npm run build
firebase deploy --only functions:processDocumentFromStorage --project elite-chiller-455712-c4

# Wait for deployment
echo "Waiting for deployment to complete..."
sleep 30

# Check logs
firebase functions:log --only processDocumentFromStorage --project elite-chiller-455712-c4 --limit 10
```

### Fix 2: Hardcode Bucket Name

```typescript
// In agreement.service.ts
async parseAttachment(agreement: Agreement): Promise<void> {
  // ... validation ...

  // ✅ Hardcode bucket name instead of extracting
  const STORAGE_BUCKET = 'elite-chiller-455712-c4.firebasestorage.app';
  const gcsUri = `gs://${STORAGE_BUCKET}/${agreement.attachmentPath}`;

  console.log('[AgreementService] GCS URI:', gcsUri);

  // ... rest of function ...
}
```

### Fix 3: Add Comprehensive Error Handling

```typescript
// In agreement.service.ts
async parseAttachment(agreement: Agreement): Promise<void> {
  try {
    // ... existing code ...

    const result = await this.processDocumentFromStorage({
      gcsUri,
      mimeType: 'application/pdf'
    });

    console.log('[AgreementService] Parse result:', result);

    // ... rest of processing ...
  } catch (error) {
    console.error('[AgreementService] Parse error:', error);

    // Log detailed error information
    if (error && typeof error === 'object') {
      console.error('[AgreementService] Error details:', {
        code: (error as any).code,
        message: (error as any).message,
        details: (error as any).details
      });
    }

    throw error;
  }
}
```

---

## Success Criteria

### Function Call Should:
- ✅ Return status 200
- ✅ Complete within 540 seconds
- ✅ Return `{ success: true, result: {...} }`
- ✅ Log to Cloud Functions logs
- ✅ Create parsed JSON in Storage
- ✅ Update Firestore with parsedJsonUrl

### User Experience Should:
- ✅ Show "解析" button as enabled initially
- ✅ Disable button while processing (grayed out)
- ✅ Show success message on completion
- ✅ Re-enable button after completion
- ✅ Show specific error message on failure
- ✅ Update agreement list with parsed data

---

## Contact Information

**If issues persist after following this checklist:**

1. Share the diagnostic report (template above)
2. Include browser console screenshot
3. Include function logs output
4. Provide network tab screenshot

**Additional Support:**
- Firebase Console: https://console.firebase.google.com/project/elite-chiller-455712-c4
- Document AI Console: https://console.cloud.google.com/ai/document-ai
- Functions Logs: https://console.cloud.google.com/functions/list

---

**End of Diagnostic Checklist**
