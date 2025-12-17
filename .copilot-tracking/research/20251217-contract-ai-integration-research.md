<!-- markdownlint-disable-file -->

# Task Research Notes: Contract AI Integration - Complete OCR Workflow Implementation

## Research Executed

### File Analysis

- `/home/runner/work/ng-gighub/ng-gighub/Contract-AI-Integration_Architecture.md`
  - Comprehensive architecture document defining AI-powered contract parsing workflow
  - Complete workflow: Upload → AI Parsing (OCR) → JSON Response → Preview → Write Contract
  - Target: Gemini 2.5 Flash for contract parsing with 60% field extraction rate
  
- `/home/runner/work/ng-gighub/ng-gighub/functions-ai/src/contract/parseContract.ts`
  - **Status**: ✅ Fully implemented with enhanced parsing mode
  - **Features**: Gemini 2.5 Flash Vision, JSON response format, dual-mode support
  - **Output**: EnhancedContractParsingOutput with comprehensive field extraction
  
- `/home/runner/work/ng-gighub/ng-gighub/src/app/core/blueprint/modules/implementations/contract/services/`
  - **contract-upload.service.ts**: ✅ File upload with validation
  - **contract-parsing.service.ts**: ✅ Parsing orchestration with Cloud Function calls
  - **contract-management.service.ts**: ✅ Contract CRUD operations
  
- `/home/runner/work/ng-gighub/ng-gighub/src/app/routes/blueprint/modules/contract-creation-wizard.component.ts`
  - **Status**: ⚠️ Existing wizard component, needs integration with preview workflow
  - **Current Flow**: Upload → Parse → Direct creation (no preview step)

### Code Search Results

- Contract UI Components:
  - `contract-creation-wizard.component.ts` - Multi-step wizard for contract creation
  - `contract-detail-drawer.component.ts` - Contract details view
  - `contract-modal.component.ts` - Contract modal dialog
  - Need: New verification/preview component for AI-parsed data

- Existing Services (27 TypeScript files):
  - Upload, parsing, management services ✅ Complete
  - Missing: Verification flow service for preview step

### External Research

- #fetch:https://ai.google.dev/gemini-api/docs/vision
  - Gemini Vision API returns structured JSON with document analysis
  - Best practice: responseMimeType: 'application/json' for structured extraction
  - Supports PDF and image formats (JPEG, PNG)

- #githubRepo:"angular/angular" Signals patterns
  - Use computed() for derived preview state
  - Use effect() for side effects (auto-save, validation)
  - Signal-based form state for reactive preview updates

### Project Conventions

- **Standards**: Angular 20+ with Signals, Standalone Components, OnPush detection
- **Architecture**: Three-layer (UI → Service → Repository → Firestore)
- **Patterns**: Repository pattern, Event-driven communication, Signal-based state

## Key Discoveries

### Current Implementation Status

**✅ Already Working**:
1. File Upload: Client can upload PDF/images to Firebase Storage
2. AI Parsing: parseContract function extracts data via Gemini API
3. JSON Response: Enhanced mode returns structured ContractParsingOutput
4. Data Storage: Contract repository handles Firestore operations

**❌ Missing Components**:
1. **Preview/Verification UI**: No component to display AI-parsed data for review
2. **Verification Service**: No service to manage preview state and user corrections
3. **Workflow Integration**: Current wizard directly creates contract without preview step

### Complete Workflow Architecture

```
User Action → Upload File → AI Parse → Preview & Verify → Write Contract
    ↓              ↓            ↓              ↓                ↓
  [UI]      [Upload Svc]  [Parse Svc]    [Verify UI]      [Repository]
                               ↓                              
                        [functions-ai]
                        parseContract()
                               ↓
                        [Gemini API]
                        Returns JSON
```

### Implementation Patterns

**Parsing Service Call** (Already Implemented):
```typescript
// Angular Service → Cloud Function → Gemini → JSON
const result = await this.parsingService.requestParsing({
  blueprintId,
  contractId,
  fileIds: [attachment.id]
});

// Returns: { success: true, requestId, parsedData: EnhancedContractParsingOutput }
```

**Enhanced Parsing Output Schema**:
```typescript
interface EnhancedContractParsingOutput {
  contractNumber: string;
  title: string;
  owner: { name, contactPerson, contactPhone, contactEmail, address, taxId };
  contractor: { name, contactPerson, contactPhone, contactEmail, address, taxId };
  startDate: string;        // YYYY-MM-DD
  endDate: string;
  currency: string;
  totalAmount: number;
  tax: number;
  totalAmountWithTax: number;
  workItems: Array<{
    code: string;
    title: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
    discount?: number;
  }>;
  additionalTerms: string[];
  extractionConfidence: number;  // 0-1 score
}
```

**Required Preview Component Pattern**:
```typescript
@Component({
  selector: 'app-contract-verification',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="verification-container">
      @if (loading()) {
        <nz-spin nzSimple />
      } @else if (parsedData()) {
        <!-- Display AI-parsed data with edit capabilities -->
        <form [formGroup]="verificationForm">
          <nz-form-item>
            <nz-form-label>Contract Number</nz-form-label>
            <nz-form-control>
              <input nz-input formControlName="contractNumber" />
              <small>AI Confidence: {{ parsedData().extractionConfidence }}%</small>
            </nz-form-control>
          </nz-form-item>
          <!-- More fields... -->
        </form>
        
        <div class="actions">
          <button nz-button (click)="reject()">Reject & Re-upload</button>
          <button nz-button nzType="primary" (click)="confirm()">Confirm & Create</button>
        </div>
      }
    </div>
  `
})
export class ContractVerificationComponent {
  parsedData = input.required<EnhancedContractParsingOutput>();
  loading = signal(false);
  verificationForm: FormGroup;
  
  confirm = output<CreateContractDto>();
  reject = output<void>();
}
```

### Complete Examples

**End-to-End Workflow Service**:
```typescript
@Injectable({ providedIn: 'root' })
export class ContractOcrWorkflowService {
  private uploadService = inject(ContractUploadService);
  private parsingService = inject(ContractParsingService);
  private contractRepository = inject(ContractRepository);
  
  // Workflow state
  private _currentStep = signal<'upload' | 'parsing' | 'preview' | 'creating'>('upload');
  private _parsedData = signal<EnhancedContractParsingOutput | null>(null);
  private _error = signal<string | null>(null);
  
  readonly currentStep = this._currentStep.asReadonly();
  readonly parsedData = this._parsedData.asReadonly();
  readonly error = this._error.asReadonly();
  
  /**
   * Complete workflow: Upload → Parse → Return preview data
   */
  async uploadAndParse(blueprintId: string, file: File): Promise<EnhancedContractParsingOutput> {
    try {
      // Step 1: Upload file
      this._currentStep.set('upload');
      const tempContractId = `temp-${Date.now()}`;
      const attachment = await this.uploadService.uploadContractFile(blueprintId, tempContractId, file);
      
      // Step 2: Request AI parsing
      this._currentStep.set('parsing');
      const requestId = await this.parsingService.requestParsing({
        blueprintId,
        contractId: tempContractId,
        fileIds: [attachment.id],
        enginePreference: 'ai'
      });
      
      // Step 3: Wait for parsing completion (subscribe to Firestore updates)
      const parsedData = await this.waitForParsingComplete(requestId);
      
      // Step 4: Store parsed data for preview
      this._currentStep.set('preview');
      this._parsedData.set(parsedData);
      
      return parsedData;
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Workflow failed');
      throw error;
    }
  }
  
  /**
   * Confirm and create contract from verified data
   */
  async confirmAndCreate(blueprintId: string, verifiedData: CreateContractDto): Promise<string> {
    this._currentStep.set('creating');
    const contractId = await this.contractRepository.create(blueprintId, verifiedData);
    return contractId;
  }
}
```

### API and Schema Documentation

**parseContract Cloud Function**:
- **Input**: `{ blueprintId, contractId, requestId, files: [{ id, name, mimeType, dataUri }] }`
- **Output**: `{ success: boolean, requestId, parsedData: EnhancedContractParsingOutput }`
- **Processing Time**: < 30 seconds for typical documents
- **Confidence Score**: 0-1 (extractionConfidence field)

**Firestore Collections**:
```
/blueprints/{blueprintId}/
  /contracts/{contractId}           → Contract document
  /parsingRequests/{requestId}      → Parsing status tracking
  /files/{fileId}                   → File metadata
```

### Configuration Examples

**Gemini Parsing Configuration** (Already Set):
```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.0-flash-exp',
  contents: [{ role: 'user', parts: [systemPrompt, userPrompt, imageData] }],
  config: {
    maxOutputTokens: 8192,
    temperature: 0.1,
    responseMimeType: 'application/json'  // ← Ensures structured JSON output
  }
});
```

### Technical Requirements

**Complete Feature Requirements**:
1. ✅ File upload to Firebase Storage
2. ✅ AI parsing via functions-ai (Gemini OCR)
3. ✅ JSON response with structured data
4. ❌ **Preview/Verification UI** - NEEDS IMPLEMENTATION
5. ❌ **Workflow orchestration** - NEEDS IMPLEMENTATION
6. ✅ Write to Firestore contract collection

**UI/UX Requirements**:
- Display AI-parsed data in editable form
- Show confidence scores for each field
- Allow manual corrections before confirmation
- Provide "Reject & Re-upload" option
- Show loading states during parsing (can take 10-30 seconds)

**Performance Targets**:
- Upload: Progress tracking with signals ✅
- Parsing: < 30 seconds ✅ (300s timeout configured)
- Preview: Instant display after parsing completes
- Creation: < 2 seconds for Firestore write

## Recommended Approach

**Complete OCR Workflow Implementation**

### Implementation Strategy

**Phase 1: Verification Component** (1-2 days)
1. Create ContractVerificationComponent for preview UI
2. Implement editable form with AI-parsed data pre-filled
3. Show confidence scores and field-level validation
4. Add confirm/reject actions

**Phase 2: Workflow Service** (1 day)
1. Create ContractOcrWorkflowService to orchestrate steps
2. Implement state management with Signals
3. Add error handling and retry logic
4. Integrate with existing upload/parsing services

**Phase 3: Wizard Integration** (1 day)
1. Update contract-creation-wizard to use new workflow
2. Add verification step between upload and creation
3. Implement proper loading states
4. Add E2E testing for complete flow

**Phase 4: Polish & Testing** (1 day)
1. Add comprehensive error messages
2. Implement retry mechanisms
3. Add monitoring and logging
4. Write E2E tests

### Implementation Details

**Key Components to Create**:
1. `contract-verification.component.ts` - Preview and edit UI
2. `contract-ocr-workflow.service.ts` - Orchestration service
3. `contract-verification-form.builder.ts` - Form generation utility
4. Update `contract-creation-wizard.component.ts` - Add verification step

**Key Integrations**:
- Use existing `contract-upload.service.ts` ✅
- Use existing `contract-parsing.service.ts` ✅
- Use existing `contract-repository.ts` ✅
- Use existing `parseContract` Cloud Function ✅

**Success Criteria**:
- User uploads contract file → sees AI-parsed data in preview form
- User can edit any field before confirming
- Confidence scores displayed for transparency
- "Confirm" button creates contract with verified data
- "Reject" button allows re-upload
- Complete workflow < 45 seconds total
- Error handling for all failure scenarios

## Implementation Guidance

### Objectives

Implement complete OCR workflow: **Upload → Parse → Preview → Confirm → Create**

### Key Tasks

1. **Create Verification UI Component**
   - Display AI-parsed data in editable form
   - Show confidence scores per field
   - Enable manual corrections
   - Implement confirm/reject actions

2. **Create Workflow Orchestration Service**
   - Manage workflow state (upload/parsing/preview/creating)
   - Coordinate between upload, parsing, and repository services
   - Handle errors and retries
   - Provide reactive state updates via Signals

3. **Integrate with Wizard**
   - Add verification step to creation wizard
   - Update wizard navigation
   - Implement proper loading states
   - Add success/error feedback

4. **Testing & Validation**
   - Unit tests for workflow service
   - E2E tests for complete flow
   - Manual testing with real contracts
   - Performance validation

### Dependencies

- ✅ Angular 20.3.x with Signals
- ✅ ng-alain framework
- ✅ Firebase Functions (functions-ai)
- ✅ Gemini API integration
- ✅ Existing contract services

### Success Criteria

- ✅ User can upload contract and see parsed data
- ✅ AI parsing returns JSON with ≥60% field accuracy
- ✅ Preview form allows manual corrections
- ✅ Confirmed data creates contract in Firestore
- ✅ Complete workflow < 45 seconds
- ✅ Error handling for all scenarios
- ✅ E2E tests pass

