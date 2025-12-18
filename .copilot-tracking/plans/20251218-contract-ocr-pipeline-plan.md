# Contract OCR Pipeline Implementation Plan

## Overview

Complete implementation of the 10-step contract processing pipeline:
- Upload → AI Parse → Draft → Preview → Confirm → Archive

## Status: IN PROGRESS

### Step 1: Frontend Upload to Firebase Storage ✅ FIXED

**Problem:** Path mismatch between `contract-upload.service.ts` and `storage.rules`
- Service uses: `contracts/{blueprintId}/{contractId}/original/{fileId}-{filename}`
- Rules only allowed: `blueprint-{blueprintId}/**`

**Solution:** Updated `storage.rules` to add `contracts/{blueprintId}/**` path pattern

**Files Modified:**
- `storage.rules` - Added contract path rules

---

## Implementation Checklist

### [ ] Step 1: Frontend Upload to Firebase Storage ✅

- [x] Fix storage.rules path mismatch
- [x] Contract upload service path: `contracts/{blueprintId}/{contractId}/original/{fileId}-{filename}`
- [x] Storage rules now allow `contracts/{blueprintId}/**`

### [ ] Step 2: functions-integration - Receive fileUrl/filePath

**Goal:** Create processing task/draft, set status: uploaded → parsed, call functions-ai

**Implementation:**
- File: `functions-integration/src/contract/processContractUpload.ts`
- Create Firestore draft document with status `uploaded`
- Call functions-ai for OCR
- Update status to `parsed` on success

**API:**
```typescript
interface ProcessContractUploadRequest {
  blueprintId: string;
  contractId: string;
  fileUrl: string;
  filePath: string;
  requestedBy: string;
}

interface ProcessContractUploadResponse {
  success: boolean;
  draftId: string;
  status: 'uploaded' | 'parsed' | 'error';
  error?: string;
}
```

### [ ] Step 3: functions-ai - OCR Parsing

**Goal:** Perform OCR, produce structured JSON, don't store directly

**Implementation:**
- File: `functions-ai/src/contract/parseContract.ts` (existing, needs review)
- Use Google Cloud Vision API or Gemini for OCR
- Return structured JSON with confidence scores
- Don't write to Firestore directly

**API:**
```typescript
interface OcrParseResponse {
  success: boolean;
  parsedData: {
    contractNo?: string;
    partyA?: string;
    partyB?: string;
    totalAmount?: number;
    startDate?: string;
    endDate?: string;
    workItems?: WorkItemDraft[];
    // ... other fields
  };
  confidence: {
    overall: number;
    fields: Record<string, number>;
  };
  rawText?: string;
}
```

### [ ] Step 4: functions-integration - Create Parse Draft

**Goal:** Create parse draft, store OCR result, set status: draft, return draftId

**Implementation:**
- File: `functions-integration/src/contract/createParseDraft.ts`
- Store in Firestore: `blueprints/{blueprintId}/contractDrafts/{draftId}`
- Include original OCR result
- Set status to `draft`

**Draft Schema:**
```typescript
interface ContractDraft {
  id: string;
  blueprintId: string;
  contractId: string;
  status: 'uploaded' | 'parsed' | 'draft' | 'user_reviewed' | 'confirmed' | 'archived';
  originalFile: {
    url: string;
    path: string;
    uploadedAt: Timestamp;
    uploadedBy: string;
  };
  ocrResult: OcrParseResponse;
  normalizedData?: NormalizedContractData;
  userSelections?: UserSelections;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### [ ] Step 5: functions-ai - Normalization (Optional)

**Goal:** Second-pass AI for field normalization, generate candidate values

**Implementation:**
- File: `functions-ai/src/contract/normalizeContract.ts`
- Generate candidate field values
- Don't modify original text
- Return suitable structure for frontend selection

### [ ] Step 6: Frontend Preview Page

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

### [ ] Step 7: User Confirmation Submission

**Goal:** Submit user-selected fields to create official contract

**Payload:**
```typescript
interface ConfirmContractPayload {
  draftId: string;
  selectedFields: {
    contractNo?: string;
    partyA?: string;
    partyB?: string;
    totalAmount?: number;
    // ... only selected fields
  };
  confirmedBy: string;
}
```

### [ ] Step 8: Create Official Contract

**Goal:** Validate draft status, create official contract, update draft status

**Implementation:**
- File: `functions-integration/src/contract/confirmContract.ts`
- Validate draft status is `draft` or `user_reviewed`
- Create official contract in `blueprints/{blueprintId}/contracts/{contractId}`
- Update draft status to `confirmed`
- Preserve: original OCR, draft, user selections

### [ ] Step 9: History/Tracking (Optional)

**Goal:** Support re-run OCR, track modifications, AI training data

**Implementation:**
- Add history collection: `blueprints/{blueprintId}/contractDrafts/{draftId}/history`
- Track: who modified, when, what changed
- Support OCR re-run with version tracking

### [ ] Step 10: State Machine

**Goal:** Implement complete status transitions

**States:**
```
uploaded → parsed → draft → user_reviewed → confirmed → archived
                       ↓
                    rejected → uploaded (re-upload)
```

**Implementation:**
- Add status validation in all functions
- Add status transition logging
- Implement archived status for completed contracts

---

## File Structure

```
functions-integration/src/contract/
├── processContractUpload.ts    # Step 2
├── createParseDraft.ts         # Step 4
├── confirmContract.ts          # Step 8
├── index.ts                    # Export all functions

functions-ai/src/contract/
├── parseContract.ts            # Step 3 (existing)
├── normalizeContract.ts        # Step 5

src/app/routes/blueprint/modules/contract/
├── contract-ocr-preview.component.ts    # Step 6
├── contract-ocr-preview.component.html
├── contract-ocr-preview.component.scss

src/app/core/blueprint/modules/implementations/contract/
├── services/
│   ├── contract-ocr-workflow.service.ts  # Orchestration
│   ├── contract-draft.service.ts         # Draft management
├── models/
│   ├── contract-draft.model.ts           # Draft interfaces
```

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
