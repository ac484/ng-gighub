# Contract OCR Pipeline Implementation Plan

## Overview

Complete implementation of the 10-step contract processing pipeline:
- Upload → AI Parse → Draft → Preview → Confirm → Archive

## Status: COMPLETED (Steps 1, 2, 3, 4, 6, 7, 8, 9, 10 COMPLETED)

**Last Updated:** 2025-12-18

### Step 1: Frontend Upload to Firebase Storage ✅ COMPLETED

**Problem:** Path mismatch between `contract-upload.service.ts` and `storage.rules`
- Service uses: `contracts/{blueprintId}/{contractId}/original/{fileId}-{filename}`
- Rules only allowed: `blueprint-{blueprintId}/**`

**Solution:** Updated `storage.rules` to add `contracts/{blueprintId}/**` path pattern

**Files Modified:**
- `storage.rules` - Added contract path rules

---

## Implementation Checklist

### [x] Step 1: Frontend Upload to Firebase Storage ✅ COMPLETED

- [x] Fix storage.rules path mismatch
- [x] Contract upload service path: `contracts/{blueprintId}/{contractId}/original/{fileId}-{filename}`
- [x] Storage rules now allow `contracts/{blueprintId}/**`

### [x] Step 2: functions-integration - Receive fileUrl/filePath ✅ COMPLETED

**Goal:** Create processing task/draft, set status: uploaded → parsed, call functions-ai

**Implementation:**
- File: `functions-integration/src/contract/processContractUpload.ts` ✅
- Create Firestore draft document with status `uploaded` ✅
- Call functions-ai for OCR (integrated) ✅
- Update status to `parsed` on success ✅

**Files Created:**
- `functions-integration/src/contract/processContractUpload.ts`
- `functions-integration/src/contract/types.ts`
- `functions-integration/src/contract/index.ts`
- `functions-integration/src/index.ts`

**API:**
```typescript
interface ProcessContractUploadRequest {
  blueprintId: string;
  contractId: string;
  fileUrl: string;
  filePath: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  requestedBy: string;
}

interface ProcessContractUploadResponse {
  success: boolean;
  draftId: string;
  status: ContractDraftStatus;
  error?: string;
}
```

### [x] Step 3: functions-ai - OCR Parsing ✅ INTEGRATED

**Goal:** Perform OCR, produce structured JSON, don't store directly

**Implementation:**
- OCR processing integrated directly into `processContractUpload.ts` ✅
- Fetch file and convert to base64 data URI ✅
- Call `callParseContractFunction()` for structured OCR result ✅
- Return `ParsedContractData` with confidence scores ✅

**Functions:**
- `fetchFileAsDataUri()` - Fetch file and convert to base64
- `callParseContractFunction()` - Process OCR and return structured data
- `triggerOcrParsing()` - Orchestrate OCR workflow

**API:**
```typescript
interface OcrParseResult {
  success: boolean;
  parsedAt: Timestamp;
  engine: 'gemini' | 'vision' | 'manual';
  parsedData: ParsedContractData;
  confidence: ConfidenceScores;
  rawText?: string;
  processingTimeMs?: number;
}
```

### [x] Step 4: functions-integration - Create Parse Draft ✅ COMPLETED

**Goal:** Create parse draft, store OCR result, set status: draft, return draftId

**Implementation:**
- File: `functions-integration/src/contract/createParseDraft.ts` ✅
- Store in Firestore: `blueprints/{blueprintId}/contractDrafts/{draftId}` ✅
- Normalize OCR data with helper functions ✅
- Set status to `draft` ✅

**Files Created:**
- `functions-integration/src/contract/createParseDraft.ts`

**Draft Schema:** (implemented in `types.ts`)
```typescript
interface ContractDraft {
  id: string;
  blueprintId: string;
  contractId?: string;
  status: ContractDraftStatus;
  originalFile: {
    url: string;
    path: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    uploadedAt: Timestamp;
    uploadedBy: string;
  };
  ocrResult?: OcrParseResult;
  normalizedData?: NormalizedContractData;
  userSelections?: UserSelections;
  confirmedContractId?: string;
  errorMessage?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}
```

### [ ] Step 5: functions-ai - Normalization (Optional) 📋 PLANNED

**Goal:** Second-pass AI for field normalization, generate candidate values

**Implementation:**
- File: `functions-ai/src/contract/normalizeContract.ts`
- Generate candidate field values
- Don't modify original text
- Return suitable structure for frontend selection

**Status:** Optional enhancement for later implementation

### [x] Step 6: Frontend Draft Service ✅ COMPLETED

**Goal:** Manage draft workflow from frontend, real-time updates

**Implementation:**
- Service: `src/app/core/blueprint/modules/implementations/contract/services/contract-draft.service.ts` ✅
- Real-time draft subscription via Firestore `onSnapshot` ✅
- Draft loading, confirmation, rejection ✅
- User modification saving ✅

**Features:**
- `loadDraft()` - Load specific draft by ID
- `subscribeToDraft()` - Real-time draft updates
- `loadDrafts()` - Load all drafts for a blueprint
- `confirmDraft()` - Confirm and create official contract
- `rejectDraft()` - Reject a draft
- `retryParsing()` - Retry OCR parsing
- `updateDraftData()` - Save user modifications

**Signal States:**
- `currentDraft` - Current draft being viewed
- `loading` - Loading state
- `error` - Error message
- `drafts` - All drafts list
- `isParsing` - Computed: is currently parsing
- `isParsed` - Computed: parsing complete
- `hasError` - Computed: has error
- `parsedData` - Computed: extracted parsed data
- `confidence` - Computed: overall confidence score

### [x] Step 7: User Confirmation Submission ✅ COMPLETED (Component)

**Goal:** Submit user-selected fields to create official contract

**Implementation:**
- File: `src/app/routes/blueprint/modules/contract-ocr-preview.component.ts` ✅
- Real-time draft subscription via ContractDraftService ✅
- OCR parsing status with loading indicators ✅
- Parsed data preview with confidence scores ✅
- Work items table display ✅
- Confirm/reject draft actions ✅
- Retry OCR parsing on failure ✅

**Features:**
- Real-time status updates (uploaded → parsing → parsed → confirmed)
- Step progress indicator
- Confidence score display with progress bar
- Basic info, party A/B, work items, terms display
- File info display
- Action buttons: retry, reject, confirm

**Payload:**
```typescript
interface ConfirmContractRequest {
  blueprintId: string;
  draftId: string;
  selectedFields: Partial<NormalizedContractData>;
  confirmedBy: string;
}
```

### [x] Step 8: Create Official Contract ✅ COMPLETED

**Goal:** Validate draft status, create official contract, update draft status

**Implementation:**
- File: `functions-integration/src/contract/confirmContract.ts` ✅
- Validate draft status is `draft`, `user_reviewed`, or `parsed` ✅
- Create official contract in `blueprints/{blueprintId}/contracts/{contractId}` ✅
- Update draft status to `confirmed` ✅
- Preserve: original OCR, draft, user selections ✅
- Add history tracking ✅

**Files Created:**
- `functions-integration/src/contract/confirmContract.ts`

**Features Implemented:**
- Status validation with `isValidStatusTransition()`
- Transaction-based contract creation
- History tracking in sub-collection
- User selections preservation
- Audit trail for confirmation

### [x] Step 9: History/Tracking ✅ COMPLETED

**Goal:** Support re-run OCR, track modifications, AI training data

**Implementation:**
- History collection integrated in Step 8: `blueprints/{blueprintId}/contractDrafts/{draftId}/history` ✅
- Track: who modified, when, what changed ✅
- History tracking added to all operations:
  - `processContractUpload.ts`: upload, parsing_started, parsing_completed, parsing_error ✅
  - `createParseDraft.ts`: normalized ✅
  - `confirmContract.ts`: confirmed ✅
  - `ContractDraftService`: rejected, user_reviewed, retry_requested ✅

### [x] Step 10: State Machine ✅ COMPLETED

**Goal:** Implement complete status transitions

**States Implemented:** (in `types.ts`)
```
uploaded → parsing → parsed → draft → user_reviewed → confirmed → archived
                                 ↓
                              rejected → uploaded (re-upload)
                                 ↓
                              error → uploaded | archived
```

**Implementation:**
- Status types defined in `types.ts` ✅
- `VALID_STATUS_TRANSITIONS` constant ✅
- `isValidStatusTransition()` helper function ✅
- Status validation in all functions ✅

**Files Modified:**
- `functions-integration/src/contract/types.ts`

---

## File Structure

```
functions-integration/src/contract/
├── processContractUpload.ts    # Step 2, 3 ✅
├── createParseDraft.ts         # Step 4 ✅
├── confirmContract.ts          # Step 8 ✅
├── types.ts                    # Type definitions ✅
├── index.ts                    # Export all functions ✅

functions-ai/src/contract/
├── parseContract.ts            # Step 3 (existing, can be called separately)
├── normalizeContract.ts        # Step 5 (planned)

src/app/core/blueprint/modules/implementations/contract/
├── services/
│   ├── contract-draft.service.ts   # Step 6 ✅
│   ├── contract-upload.service.ts  # Existing
│   ├── contract-parsing.service.ts # Existing
│   └── index.ts                    # Updated ✅

src/app/routes/blueprint/modules/
├── contract-ocr-preview.component.ts    # Step 7 UI ✅
```

---

## Implementation Summary

| Step | Description | Status | Files |
|------|-------------|--------|-------|
| 1 | Storage Rules Fix | ✅ COMPLETED | `storage.rules` |
| 2 | Process Upload | ✅ COMPLETED | `processContractUpload.ts`, `types.ts` |
| 3 | OCR Parsing | ✅ INTEGRATED | `processContractUpload.ts` (inline) |
| 4 | Create Parse Draft | ✅ COMPLETED | `createParseDraft.ts` |
| 5 | Normalization | 📋 PLANNED | - |
| 6 | Draft Service | ✅ COMPLETED | `contract-draft.service.ts` |
| 7 | Confirmation UI | ✅ COMPLETED | `contract-ocr-preview.component.ts` |
| 8 | Confirm Contract | ✅ COMPLETED | `confirmContract.ts` |
| 9 | History Tracking | 📋 PARTIAL | Integrated in Step 8 |
| 9 | History/Tracking | ✅ COMPLETED | Integrated across all functions |
| 10 | State Machine | ✅ COMPLETED | `types.ts` |

**Progress: 9/10 steps completed (Step 5 is optional)**

---

## Next Steps

1. **Optional:** Add normalization AI (Step 5)

**Routes Configured:**
- `/blueprints/user/:blueprintId/contract/draft/:draftId` - OCR Preview

---

## Dependencies

- Firebase Storage (configured)
- Firebase Functions (functions-integration, functions-ai)
- Google Cloud Vision API / Gemini (for OCR)
- Angular 20.3.x with Signals
- ng-alain / ng-zorro-antd for UI components

---

## Testing Strategy

### Unit Tests
- Each function should have unit tests
- Mock Firebase/Firestore calls
- Test status transitions

### Integration Tests
- Test complete pipeline: upload → parse → draft → confirm
- Use Firebase emulators

### E2E Tests
- Playwright tests for frontend workflow
- Test file upload, preview, confirmation

---

## References

- Context7 documentation for:
  - Firebase Storage Rules
  - Firebase Functions
  - @angular/fire
  - Google Cloud Vision API
- Existing task plans in `.copilot-tracking/plans/`
