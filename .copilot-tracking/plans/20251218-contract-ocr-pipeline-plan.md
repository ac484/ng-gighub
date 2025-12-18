# Contract OCR Pipeline Implementation Plan

## Overview

Complete implementation of the 10-step contract processing pipeline:
- Upload → AI Parse → Draft → Preview → Confirm → Archive

## Status: IN PROGRESS (Steps 1, 2, 4, 8, 10 COMPLETED)

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
- Call functions-ai for OCR (placeholder, needs Step 3 integration) ⚠️
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

### [ ] Step 3: functions-ai - OCR Parsing ⚠️ NEEDS INTEGRATION

**Goal:** Perform OCR, produce structured JSON, don't store directly

**Current Status:**
- File exists: `functions-ai/src/contract/parseContract.ts`
- Needs to be called from `processContractUpload.ts`
- Currently using placeholder OCR result

**TODO:**
- [ ] Review existing `parseContract.ts` implementation
- [ ] Integrate actual call from `processContractUpload.ts`
- [ ] Remove placeholder data

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

### [ ] Step 6: Frontend Preview Page 📋 PLANNED

**Goal:** Display OCR + normalized result, let user select/modify fields

**Implementation:**
- Component: `src/app/routes/blueprint/modules/contract/contract-ocr-preview.component.ts`
- Display all parsed fields with confidence scores
- Allow checkbox selection for each field
- Allow value editing
- Store selections in component state

**Component Features:**
- Field selection checkboxes
- Value edit inputs
- Confidence score display
- Preview/Original toggle
- Save as draft / Confirm buttons

### [ ] Step 7: User Confirmation Submission 📋 PLANNED

**Goal:** Submit user-selected fields to create official contract

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

### [ ] Step 9: History/Tracking (Optional) 📋 PARTIAL

**Goal:** Support re-run OCR, track modifications, AI training data

**Implementation:**
- History collection integrated in Step 8: `blueprints/{blueprintId}/contractDrafts/{draftId}/history` ✅
- Track: who modified, when, what changed ✅
- Support OCR re-run with version tracking (TODO)

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
├── processContractUpload.ts    # Step 2 ✅
├── createParseDraft.ts         # Step 4 ✅
├── confirmContract.ts          # Step 8 ✅
├── types.ts                    # Type definitions ✅
├── index.ts                    # Export all functions ✅

functions-ai/src/contract/
├── parseContract.ts            # Step 3 (existing, needs integration)
├── normalizeContract.ts        # Step 5 (planned)

src/app/routes/blueprint/modules/contract/
├── contract-ocr-preview.component.ts    # Step 6 (planned)
├── contract-ocr-preview.component.html
├── contract-ocr-preview.component.scss

src/app/core/blueprint/modules/implementations/contract/
├── services/
│   ├── contract-ocr-workflow.service.ts  # Orchestration (planned)
│   ├── contract-draft.service.ts         # Draft management (planned)
├── models/
│   ├── contract-draft.model.ts           # Draft interfaces (planned)
```

---

## Implementation Summary

| Step | Description | Status | Files |
|------|-------------|--------|-------|
| 1 | Storage Rules Fix | ✅ COMPLETED | `storage.rules` |
| 2 | Process Upload | ✅ COMPLETED | `processContractUpload.ts`, `types.ts` |
| 3 | OCR Parsing | ⚠️ NEEDS INTEGRATION | `parseContract.ts` |
| 4 | Create Parse Draft | ✅ COMPLETED | `createParseDraft.ts` |
| 5 | Normalization | 📋 PLANNED | - |
| 6 | Preview Page | 📋 PLANNED | - |
| 7 | Confirmation UI | 📋 PLANNED | - |
| 8 | Confirm Contract | ✅ COMPLETED | `confirmContract.ts` |
| 9 | History Tracking | 📋 PARTIAL | Integrated in Step 8 |
| 10 | State Machine | ✅ COMPLETED | `types.ts` |

---

## Next Steps

1. **Priority 1:** Integrate actual OCR call from `processContractUpload.ts` to `functions-ai`
2. **Priority 2:** Create frontend preview component (Step 6)
3. **Priority 3:** Create confirmation submission flow (Step 7)
4. **Optional:** Add normalization AI (Step 5)
5. **Optional:** Expand history tracking (Step 9)

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
