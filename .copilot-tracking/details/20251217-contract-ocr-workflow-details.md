<!-- markdownlint-disable-file -->

# Task Details: Contract OCR Workflow Implementation

## Research Reference

**Source Research**: #file:../research/20251217-contract-ai-integration-research.md

## Phase 1: Verification Component Creation

### Task 1.1: Create ContractVerificationComponent with preview form UI

Create a standalone Angular component that displays AI-parsed contract data in an editable form, allowing users to review and modify extracted information before creating the contract.

- **Files**:
  - `src/app/core/blueprint/modules/implementations/contract/components/contract-verification.component.ts` - New verification component
  - `src/app/core/blueprint/modules/implementations/contract/components/contract-verification.component.html` - Template file
  - `src/app/core/blueprint/modules/implementations/contract/components/contract-verification.component.scss` - Styles
- **Success**:
  - Component renders with all parsed fields (contractNumber, title, owner, contractor, dates, amounts, workItems)
  - Form is pre-filled with AI-parsed data
  - Component accepts parsedData as input signal
  - Component emits confirm and reject output events
  - Uses ng-zorro-antd form components (nz-form, nz-input, nz-select, nz-date-picker)
  - Implements OnPush change detection strategy
- **Research References**:
  - #file:../research/20251217-contract-ai-integration-research.md (Lines 140-180) - Component pattern and template structure
  - #file:../../.github/instructions/angular-modern-features.instructions.md - Signals, input(), output()
  - #file:../../.github/instructions/ng-zorro-antd.instructions.md - Form components usage
- **Dependencies**:
  - Angular 20+ with Signals
  - ng-zorro-antd form components
  - Contract models (EnhancedContractParsingOutput)

### Task 1.2: Implement verification form builder utility

Create a utility service that generates reactive forms from AI-parsed data, handling different field types and validation rules.

- **Files**:
  - `src/app/core/blueprint/modules/implementations/contract/utils/contract-verification-form.builder.ts` - Form builder utility
  - `src/app/core/blueprint/modules/implementations/contract/utils/contract-verification-form.builder.spec.ts` - Unit tests
- **Success**:
  - Utility creates FormGroup from EnhancedContractParsingOutput
  - All fields have appropriate validators (required, min/max, pattern)
  - Supports nested forms for owner/contractor details
  - Supports FormArray for workItems
  - Provides method to extract verified data back to CreateContractDto
  - Unit tests cover all field types and edge cases
- **Research References**:
  - #file:../research/20251217-contract-ai-integration-research.md (Lines 90-110) - Form structure and data models
  - #file:../../.github/instructions/angular-modern-features.instructions.md - Reactive forms patterns
- **Dependencies**:
  - Task 1.1 completion
  - Angular ReactiveFormsModule

### Task 1.3: Add confidence score display and field validation

Enhance the verification form to display AI confidence scores for each field and provide visual feedback for low-confidence extractions.

- **Files**:
  - `src/app/core/blueprint/modules/implementations/contract/components/contract-verification.component.ts` - Update component
  - `src/app/core/blueprint/modules/implementations/contract/components/contract-verification.component.html` - Update template
  - `src/app/core/blueprint/modules/implementations/contract/components/contract-verification.component.scss` - Update styles
- **Success**:
  - Each form field displays confidence score percentage
  - Fields with confidence < 70% highlighted with warning color
  - Overall extraction confidence displayed at top of form
  - Tooltips explain what confidence scores mean
  - Visual indicators for required vs optional fields
- **Research References**:
  - #file:../research/20251217-contract-ai-integration-research.md (Lines 90-95) - Confidence score in parsedData
  - #file:../../.github/instructions/ng-zorro-antd.instructions.md - Alert, Badge, Tooltip components
- **Dependencies**:
  - Task 1.1 and 1.2 completion

## Phase 2: Workflow Orchestration Service

### Task 2.1: Create ContractOcrWorkflowService with Signal-based state management

Create a service that orchestrates the complete workflow (upload → parse → preview → create) with reactive state management using Angular Signals.

- **Files**:
  - `src/app/core/blueprint/modules/implementations/contract/services/contract-ocr-workflow.service.ts` - New workflow service
  - `src/app/core/blueprint/modules/implementations/contract/services/contract-ocr-workflow.service.spec.ts` - Unit tests
  - `src/app/core/blueprint/modules/implementations/contract/services/index.ts` - Update exports
- **Success**:
  - Service provides readonly signals for currentStep, parsedData, error
  - Service injects existing upload, parsing, and repository services
  - Service implements workflow state machine (upload → parsing → preview → creating)
  - Service provides methods: uploadAndParse(), confirmAndCreate(), reset()
  - Proper error handling with user-friendly messages
  - Unit tests cover all state transitions and error scenarios
- **Research References**:
  - #file:../research/20251217-contract-ai-integration-research.md (Lines 185-230) - Complete workflow service pattern
  - #file:../../.github/instructions/angular-modern-features.instructions.md - Signals patterns
- **Dependencies**:
  - Existing ContractUploadService
  - Existing ContractParsingService
  - Existing ContractRepository
  - @angular/fire/functions

### Task 2.2: Implement uploadAndParse method with progress tracking

Implement the core method that handles file upload and triggers AI parsing, with progress updates throughout.

- **Files**:
  - `src/app/core/blueprint/modules/implementations/contract/services/contract-ocr-workflow.service.ts` - Update service
  - `src/app/core/blueprint/modules/implementations/contract/services/contract-ocr-workflow.service.spec.ts` - Update tests
- **Success**:
  - Method accepts blueprintId and File parameters
  - Calls uploadService.uploadContractFile() with progress tracking
  - Generates temporary contractId for initial upload
  - Calls parsingService.requestParsing() with uploaded file ID
  - Waits for parsing completion via Firestore subscription
  - Returns EnhancedContractParsingOutput on success
  - Updates currentStep signal at each stage
  - Handles errors at each step with rollback if needed
  - Unit tests mock all service dependencies
- **Research References**:
  - #file:../research/20251217-contract-ai-integration-research.md (Lines 185-220) - uploadAndParse implementation
  - #file:../../.github/instructions/angular-modern-features.instructions.md - Async patterns with Signals
- **Dependencies**:
  - Task 2.1 completion
  - Existing upload and parsing services

### Task 2.3: Implement confirmAndCreate method with error handling

Implement the method that takes verified data and creates the final contract in Firestore.

- **Files**:
  - `src/app/core/blueprint/modules/implementations/contract/services/contract-ocr-workflow.service.ts` - Update service
  - `src/app/core/blueprint/modules/implementations/contract/services/contract-ocr-workflow.service.spec.ts` - Update tests
- **Success**:
  - Method accepts blueprintId and CreateContractDto parameters
  - Validates all required fields before creation
  - Calls contractRepository.create() with verified data
  - Updates currentStep signal to 'creating'
  - Returns created contractId on success
  - Proper error handling with meaningful messages
  - Emits event via ContractEventService on success
  - Unit tests cover validation failures and repository errors
- **Research References**:
  - #file:../research/20251217-contract-ai-integration-research.md (Lines 222-235) - confirmAndCreate method
  - #file:../../.github/instructions/typescript-5-es2022.instructions.md - Error handling patterns
- **Dependencies**:
  - Task 2.1 and 2.2 completion
  - Existing ContractRepository

## Phase 3: Wizard Integration

### Task 3.1: Update contract-creation-wizard to add verification step

Integrate the verification component into the existing contract creation wizard, adding it as a new step in the multi-step process.

- **Files**:
  - `src/app/routes/blueprint/modules/contract-creation-wizard.component.ts` - Update wizard component
  - `src/app/routes/blueprint/modules/contract-creation-wizard.component.html` - Update template
- **Success**:
  - Wizard adds "verification" step between upload and final creation
  - Step navigation properly disabled until previous steps complete
  - Wizard uses ContractOcrWorkflowService instead of direct service calls
  - Parseddata passed to ContractVerificationComponent as input
  - Verification component's confirm event triggers contract creation
  - Verification component's reject event returns to upload step
  - Wizard state properly resets on rejection
  - All existing wizard functionality remains working
- **Research References**:
  - #file:../research/20251217-contract-ai-integration-research.md (Lines 250-280) - Wizard integration pattern
  - #file:../../.github/instructions/ng-alain-delon.instructions.md - Step components
  - Existing contract-creation-wizard.component.ts - Current implementation
- **Dependencies**:
  - Phase 1 completion (ContractVerificationComponent)
  - Phase 2 completion (ContractOcrWorkflowService)

### Task 3.2: Implement loading states and error feedback

Add comprehensive loading indicators and error messages throughout the workflow to provide clear feedback to users.

- **Files**:
  - `src/app/routes/blueprint/modules/contract-creation-wizard.component.ts` - Update wizard
  - `src/app/routes/blueprint/modules/contract-creation-wizard.component.html` - Update template
  - `src/app/core/blueprint/modules/implementations/contract/components/contract-verification.component.ts` - Update component
- **Success**:
  - Upload step shows progress bar during file upload
  - Parsing step shows spinner with "AI analyzing document..." message
  - Estimated time displayed during parsing (typically 15-30 seconds)
  - Error alerts display clear messages for upload/parsing failures
  - Success notification when contract created successfully
  - All loading states use ng-zorro-antd components (nz-spin, nz-progress, nz-alert)
  - Loading states properly cleared on completion or error
- **Research References**:
  - #file:../research/20251217-contract-ai-integration-research.md (Lines 290-310) - Loading states pattern
  - #file:../../.github/instructions/ng-zorro-antd.instructions.md - Progress, Spin, Alert components
- **Dependencies**:
  - Task 3.1 completion

### Task 3.3: Add reject/retry functionality

Implement the ability for users to reject AI-parsed data and retry with a different file or manual entry.

- **Files**:
  - `src/app/routes/blueprint/modules/contract-creation-wizard.component.ts` - Update wizard
  - `src/app/core/blueprint/modules/implementations/contract/services/contract-ocr-workflow.service.ts` - Add reset method
- **Success**:
  - "Reject & Re-upload" button available in verification component
  - Clicking reject returns wizard to upload step
  - Previously uploaded file can be replaced
  - Workflow service resets all state on rejection
  - Option to skip AI parsing and enter data manually
  - Confirmation dialog before rejecting parsed data
  - All temporary data cleaned up on rejection
- **Research References**:
  - #file:../research/20251217-contract-ai-integration-research.md (Lines 312-325) - Reject workflow
  - #file:../../.github/instructions/ng-zorro-antd.instructions.md - Modal confirmation
- **Dependencies**:
  - Task 3.1 and 3.2 completion

## Phase 4: Testing & Validation

### Task 4.1: Create unit tests for workflow service

Write comprehensive unit tests for ContractOcrWorkflowService covering all methods and state transitions.

- **Files**:
  - `src/app/core/blueprint/modules/implementations/contract/services/contract-ocr-workflow.service.spec.ts` - Complete unit tests
- **Success**:
  - All methods tested with mocked dependencies
  - State transitions validated (upload → parsing → preview → creating)
  - Error handling tested for each step
  - Signal updates verified at each stage
  - Edge cases covered (empty files, parsing failures, validation errors)
  - Test coverage >80% for workflow service
  - Tests use Jasmine/Karma framework
- **Research References**:
  - #file:../../.github/instructions/angular-modern-features.instructions.md - Testing Signals
  - Existing *.spec.ts files in contract services directory
- **Dependencies**:
  - Phase 2 completion

### Task 4.2: Add E2E test for complete workflow

Create end-to-end test that validates the entire workflow from file upload to contract creation.

- **Files**:
  - `e2e/src/contract-ocr-workflow.e2e-spec.ts` - New E2E test
  - `e2e/src/contract-ocr-workflow.po.ts` - Page object for test
- **Success**:
  - Test uploads a sample contract PDF file
  - Test waits for AI parsing to complete (with timeout)
  - Test verifies parsed data appears in verification form
  - Test modifies at least one field manually
  - Test clicks confirm and verifies contract created
  - Test validates contract appears in contract list
  - Test covers happy path without mocking
  - Uses real parseContract Cloud Function (requires API key)
- **Research References**:
  - #file:../research/20251217-contract-ai-integration-research.md (Lines 328-340) - E2E test requirements
  - Existing e2e tests in e2e/ directory
- **Dependencies**:
  - Phase 3 completion
  - functions-ai deployed with parseContract function
  - Gemini API key configured

### Task 4.3: Manual testing with real contract documents

Perform manual testing with actual Taiwanese construction contract documents to validate parsing accuracy and workflow usability.

- **Files**:
  - `docs/testing/contract-ocr-manual-test-results.md` - Test results documentation
- **Success**:
  - Test with at least 5 different contract document formats
  - Document parsing accuracy for each field type
  - Measure average parsing time (target <30 seconds)
  - Test error scenarios (corrupt files, unsupported formats, network failures)
  - Document user experience issues and edge cases found
  - Create bug tickets for any issues found
  - Verify confidence scores align with actual accuracy
  - Test on different file sizes (1MB to 10MB)
- **Research References**:
  - #file:../research/20251217-contract-ai-integration-research.md (Lines 342-355) - Manual testing checklist
  - Contract-AI-Integration_Architecture.md - Success metrics and targets
- **Dependencies**:
  - Phase 3 completion
  - Sample contract documents (PDF, JPG formats)

## Dependencies

- Angular 20.3.x with Signals support
- ng-alain framework
- ng-zorro-antd UI components
- Firebase SDK (@angular/fire)
- Existing contract services and models
- functions-ai/parseContract Cloud Function
- Gemini API access

## Success Criteria

- All 12 tasks completed and verified
- User can complete full workflow: upload file → see parsed data → edit if needed → confirm → contract created
- Workflow completes in <45 seconds for typical documents
- Confidence scores displayed accurately reflect parsing quality
- Error handling prevents data loss and provides clear user feedback
- Unit tests pass with >80% coverage
- E2E test validates complete workflow
- Manual testing confirms ≥60% field extraction accuracy
- No regression in existing contract functionality
