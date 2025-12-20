# Agreement Parsing Issue - Quick Reference

**Status**: Analysis Complete - Awaiting User Diagnostics  
**Date**: 2025-12-20  
**Issue**: 解析按鈕變成灰色，沒有錯誤也沒有反應

---

## Problem Summary

When clicking the "解析" (Parse) button to process uploaded PDF documents with Google Document AI:
- Button becomes disabled (grayed out)
- No processing occurs
- No error messages shown
- No response from backend
- Button remains disabled

**Goal**: Parse PDF contracts using Custom Extractor processor and return JSON data.

---

## Most Likely Root Cause

### 🔴 Missing Environment Variables (95% Confidence)

The Cloud Function requires these environment variables:
```bash
DOCUMENTAI_LOCATION=us
DOCUMENTAI_PROCESSOR_ID=d8cd080814899dc4
```

**Evidence**: Code will throw `failed-precondition` error immediately if missing.

**Location**: `functions-ai-document/.env`

---

## Quick Diagnostic Commands

### 1. Check Function Logs (Most Important)
```bash
firebase functions:log --only processDocumentFromStorage --project elite-chiller-455712-c4 --limit 20
```

**Look for**:
- `"Missing DOCUMENTAI_PROCESSOR_ID environment variable"`
- `"Missing DOCUMENTAI_LOCATION environment variable"`
- `"Invalid GCS URI"`
- `"Permission denied"`

### 2. Verify Function Deployment
```bash
firebase functions:list --project elite-chiller-455712-c4 | grep processDocumentFromStorage
```

**Expected**: Should show `ACTIVE` status in `asia-east1` region

### 3. Check Environment Variables
```bash
cat functions-ai-document/.env
```

**Expected content**:
```
DOCUMENTAI_LOCATION=us
DOCUMENTAI_PROCESSOR_ID=d8cd080814899dc4
```

---

## Quick Fix (If Env Vars Missing)

```bash
# Navigate to functions directory
cd /home/runner/work/ng-gighub/ng-gighub/functions-ai-document

# Create .env file
cat > .env << 'EOF'
DOCUMENTAI_LOCATION=us
DOCUMENTAI_PROCESSOR_ID=d8cd080814899dc4
EOF

# Build and deploy
npm run build
firebase deploy --only functions:processDocumentFromStorage --project elite-chiller-455712-c4

# Wait 30 seconds and test
```

---

## Secondary Issues to Check

### Issue #2: GCS URI Construction (70% Confidence)

**Problem**: May return `null` due to fragile bucket extraction

**Check**: Add this in browser console after clicking "解析":
```javascript
// Should see logged GCS URI
// Look for: "無法取得檔案路徑" error
```

**Fix**: Hardcode bucket name instead of extracting:
```typescript
const STORAGE_BUCKET = 'elite-chiller-455712-c4.firebasestorage.app';
const gcsUri = `gs://${STORAGE_BUCKET}/${agreement.attachmentPath}`;
```

### Issue #3: IAM Permissions (30% Confidence)

**Check**: Verify service account has required roles:
```bash
gcloud projects get-iam-policy elite-chiller-455712-c4 \
  --flatten="bindings[].members" \
  --filter="bindings.members:elite-chiller-455712-c4@appspot.gserviceaccount.com"
```

**Required roles**:
- `roles/documentai.apiUser`
- `roles/storage.objectViewer`

**Fix** (if missing):
```bash
PROJECT_ID="elite-chiller-455712-c4"
SA_EMAIL="${PROJECT_ID}@appspot.gserviceaccount.com"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/documentai.apiUser"
```

---

## Browser Diagnostics

### 1. Check Console (F12)
Look for errors when clicking "解析" button

### 2. Check Network Tab
- Filter: XHR/Fetch
- Look for: Request to `processDocumentFromStorage`
- Check: Status code (should be 200, not 404/500)
- Review: Response body for error details

---

## Expected vs Actual Flow

### Expected Flow ✅
```
1. Click "解析" → Button disabled
2. Call Cloud Function → Processing starts
3. Document AI processes PDF → Returns JSON
4. Save JSON to Storage → Update Firestore
5. Show success message → Button re-enabled
```

### Actual Flow (Current) ❌
```
1. Click "解析" → Button disabled
2. Call Cloud Function → ???
3. No response → No error shown
4. Button stays disabled → User confused
```

---

## Complete Documentation

### 📄 Detailed Analysis
**File**: `docs/analysis/agreement-parsing-issue-analysis.md`
- 32,000+ characters
- Complete architecture overview
- All 5 potential root causes with evidence
- Technical specifications
- Solution proposals

### ✅ Diagnostic Checklist
**File**: `docs/analysis/agreement-parsing-diagnostic-checklist.md`
- Step-by-step diagnostic procedures
- Quick fix commands
- IAM permissions verification
- Network diagnostics
- Complete report template

### 🎯 Root Cause Summary
**File**: `docs/analysis/agreement-parsing-root-cause-summary.md`
- Ranked root causes by probability
- Evidence from codebase
- Decision tree
- Investigation order
- Most likely scenario walkthrough

---

## System Information

### Processor Details
- **Name**: blueprint-agreement
- **ID**: d8cd080814899dc4
- **Type**: Custom Extractor
- **Region**: us (United States)
- **Status**: Enabled
- **Training**: 1 document
- **Endpoint**: `https://us-documentai.googleapis.com/v1/projects/7807661688/locations/us/processors/d8cd080814899dc4:process`

### Firebase Configuration
- **Project**: elite-chiller-455712-c4
- **Functions Region**: asia-east1
- **Storage Bucket**: elite-chiller-455712-c4.firebasestorage.app
- **Angular/Fire Version**: 20.0.1
- **Document AI SDK**: @google-cloud/documentai@9.5.0

---

## What to Share for Support

If diagnostics don't resolve the issue, provide:

1. **Function Logs Output**
   ```bash
   firebase functions:log --only processDocumentFromStorage --limit 50
   ```

2. **Browser Console Screenshot**
   - Open DevTools (F12)
   - Click "解析" button
   - Screenshot all errors/warnings

3. **Network Tab Screenshot**
   - Filter to XHR/Fetch
   - Show request/response for `processDocumentFromStorage`

4. **Environment Variables**
   ```bash
   cat functions-ai-document/.env
   # (Redact sensitive values if needed)
   ```

---

## Decision Tree

```
Start Here: Button becomes disabled with no error
    |
    ├─ Check browser console
    |   ├─ Shows "Missing DOCUMENTAI..." → Fix: Set env vars
    |   ├─ Shows "無法取得檔案路徑" → Fix: Hardcode bucket
    |   └─ No errors → Check Network tab
    |
    ├─ Check Network tab
    |   ├─ No request → Error before function call
    |   ├─ 404 error → Function not deployed
    |   ├─ 403 error → Auth or permissions issue
    |   └─ 500 error → Check function logs
    |
    └─ Check function logs
        ├─ "Missing DOCUMENTAI..." → Set env vars
        ├─ "Permission denied" → Fix IAM roles
        └─ No logs → Function not being called
```

---

## Success Criteria

After fixing, should see:
- ✅ Button disabled temporarily while processing
- ✅ Processing completes within 9 minutes
- ✅ Success message: "解析完成"
- ✅ Button re-enabled after completion
- ✅ `parsedJsonUrl` saved to Firestore
- ✅ Can view parsed JSON data

---

## Action Required from User

**Please run these 3 commands and share results:**

```bash
# 1. Check function logs
firebase functions:log --only processDocumentFromStorage --project elite-chiller-455712-c4 --limit 20

# 2. Check deployment status
firebase functions:list --project elite-chiller-455712-c4

# 3. Check environment variables
cat functions-ai-document/.env
```

**And provide:**
- Browser console screenshot (when clicking "解析")
- Network tab screenshot (showing the request)

This will confirm the root cause and we can proceed with the fix.

---

## Next Steps

### If Env Vars Missing
1. Create `.env` file with correct values
2. Redeploy function
3. Test immediately

### If Env Vars Present
1. Check GCS URI construction
2. Verify IAM permissions
3. Review function logs for specific error

### If All Checks Pass
1. Enable detailed logging
2. Test with simple PDF
3. Monitor Cloud Functions console

---

**End of Quick Reference**

For detailed analysis, see:
- `docs/analysis/agreement-parsing-issue-analysis.md` (complete)
- `docs/analysis/agreement-parsing-diagnostic-checklist.md` (procedures)
- `docs/analysis/agreement-parsing-root-cause-summary.md` (ranked causes)
