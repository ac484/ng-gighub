---
applyTo: ".copilot-tracking/changes/20251217-contract-ocr-workflow-changes.md"
---

<!-- markdownlint-disable-file -->

# Task Checklist: Contract OCR Workflow Implementation

## Overview

Implement complete OCR workflow for contract module: Upload → AI Parse (Gemini) → Preview/Verify → Create Contract

## Objectives

- Create verification/preview component to display AI-parsed contract data
- Implement workflow orchestration service for upload-parse-preview-create flow
- Integrate verification step into existing contract creation wizard
- Enable manual corrections before contract creation
- Provide confidence scores and error handling throughout workflow

## Research Summary

### Project Files

- `src/app/core/blueprint/modules/implementations/contract/services/contract-upload.service.ts` - Existing file upload service
- `src/app/core/blueprint/modules/implementations/contract/services/contract-parsing.service.ts` - Existing AI parsing service
- `src/app/routes/blueprint/modules/contract-creation-wizard.component.ts` - Existing wizard to be enhanced
- `functions-ai/src/contract/parseContract.ts` - Cloud Function with Gemini integration (already working)

### External References

- #file:../research/20251217-contract-ai-integration-research.md - Complete workflow architecture and implementation patterns
- #githubRepo:"angular/angular" Signals patterns - Reactive state management
- #fetch:https://ai.google.dev/gemini-api/docs/vision - Gemini API JSON response format

### Standards References

- #file:../../.github/instructions/angular-modern-features.instructions.md - Angular 20+ Signals, Standalone Components
- #file:../../.github/instructions/typescript-5-es2022.instructions.md - TypeScript best practices
- #file:../../.github/instructions/ng-alain-delon.instructions.md - ng-alain framework patterns
- #file:../../.github/instructions/ng-zorro-antd.instructions.md - Ant Design components

## Implementation Checklist

### [ ] Phase 1: Verification Component Creation

- [ ] Task 1.1: Create ContractVerificationComponent with preview form UI
  - Details: .copilot-tracking/details/20251217-contract-ocr-workflow-details.md (Lines 15-45)

- [ ] Task 1.2: Implement verification form builder utility
  - Details: .copilot-tracking/details/20251217-contract-ocr-workflow-details.md (Lines 47-75)

- [ ] Task 1.3: Add confidence score display and field validation
  - Details: .copilot-tracking/details/20251217-contract-ocr-workflow-details.md (Lines 77-95)

### [ ] Phase 2: Workflow Orchestration Service

- [ ] Task 2.1: Create ContractOcrWorkflowService with Signal-based state management
  - Details: .copilot-tracking/details/20251217-contract-ocr-workflow-details.md (Lines 99-135)

- [ ] Task 2.2: Implement uploadAndParse method with progress tracking
  - Details: .copilot-tracking/details/20251217-contract-ocr-workflow-details.md (Lines 137-165)

- [ ] Task 2.3: Implement confirmAndCreate method with error handling
  - Details: .copilot-tracking/details/20251217-contract-ocr-workflow-details.md (Lines 167-185)

### [ ] Phase 3: Wizard Integration

- [ ] Task 3.1: Update contract-creation-wizard to add verification step
  - Details: .copilot-tracking/details/20251217-contract-ocr-workflow-details.md (Lines 189-220)

- [ ] Task 3.2: Implement loading states and error feedback
  - Details: .copilot-tracking/details/20251217-contract-ocr-workflow-details.md (Lines 222-245)

- [ ] Task 3.3: Add reject/retry functionality
  - Details: .copilot-tracking/details/20251217-contract-ocr-workflow-details.md (Lines 247-265)

### [ ] Phase 4: Testing & Validation

- [ ] Task 4.1: Create unit tests for workflow service
  - Details: .copilot-tracking/details/20251217-contract-ocr-workflow-details.md (Lines 269-290)

- [ ] Task 4.2: Add E2E test for complete workflow
  - Details: .copilot-tracking/details/20251217-contract-ocr-workflow-details.md (Lines 292-315)

- [ ] Task 4.3: Manual testing with real contract documents
  - Details: .copilot-tracking/details/20251217-contract-ocr-workflow-details.md (Lines 317-335)

## Dependencies

- Angular 20.3.x with Signals support
- ng-alain framework and ng-zorro-antd components
- Firebase SDK (Storage, Firestore, Functions)
- Existing contract services (upload, parsing, repository)
- functions-ai/parseContract Cloud Function (already deployed)
- @google/generative-ai SDK (already configured)

## Success Criteria

- User can upload contract file and see AI-parsed data in preview form within 30 seconds
- Verification form displays all parsed fields with confidence scores
- User can manually edit any field before confirming
- "Confirm" button creates contract with verified data in Firestore
- "Reject" button allows file re-upload
- Error handling covers parsing failures, network errors, validation failures
- Complete workflow execution time < 45 seconds
- Unit tests achieve >80% coverage for new services
- E2E test passes for happy path (upload → parse → verify → create)
