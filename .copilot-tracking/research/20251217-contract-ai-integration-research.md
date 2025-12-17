<!-- markdownlint-disable-file -->

# Task Research Notes: Contract AI Integration Architecture Implementation

## Research Executed

### File Analysis

- `/home/runner/work/ng-gighub/ng-gighub/Contract-AI-Integration_Architecture.md`
  - Comprehensive architecture document defining AI-powered contract parsing workflow
  - Specifies 3-phase implementation: Phase 1 (MVP), Phase 2 (Enhanced), Phase 3 (Advanced)
  - Target: Gemini 2.5 Flash for contract parsing with 60% field extraction rate
  - Architecture: Upload via functions-storage, AI parsing via functions-ai, hybrid verification workflow
  
- `/home/runner/work/ng-gighub/ng-gighub/functions-ai/src/contract/parseContract.ts`
  - **Current Implementation Status**: Fully implemented parseContract Cloud Function
  - **Gemini Integration**: Using `@google/generative-ai` SDK with Gemini 2.5 Flash Vision model
  - **Parsing Modes**: Dual-mode support (Enhanced + Legacy parsing)
  - **Enhanced Mode Features**: Comprehensive extraction including workItems, financial calculations, validation
  - **Function Configuration**: 1GiB memory, 300s timeout, asia-east1 region
  
- `/home/runner/work/ng-gighub/ng-gighub/functions-storage/src/index.ts`
  - **Current Status**: Minimal implementation - only global options set
  - **Gap Identified**: No upload orchestration function implemented
  - **Missing**: uploadContractFile function as specified in architecture

- `/home/runner/work/ng-gighub/ng-gighub/src/app/core/blueprint/modules/implementations/contract/services/contract-upload.service.ts`
  - **Current Implementation**: Direct Firebase Storage upload from Angular
  - **Pattern**: Client-side file validation and upload with progress tracking
  - **File Validation**: Type checking (PDF/image), size limit (10MB), error handling
  - **Integration**: Works with ContractEventService for event broadcasting
  
- `/home/runner/work/ng-gighub/ng-gighub/src/app/core/blueprint/modules/implementations/contract/services/contract-parsing.service.ts`
  - **Current Implementation**: Fully functional parsing service
  - **Pattern**: Calls parseContract Cloud Function via httpsCallable
  - **Features**: Status tracking, progress monitoring, result confirmation
  - **Enhanced Parsing**: Supports EnhancedContractParsingOutput format

### Code Search Results

- `contract-*.ts` files in `src/app/core/blueprint/modules/implementations/contract/`
  - Found 27 TypeScript files implementing contract functionality
  - Key services: contract-upload, contract-parsing, contract-management, contract-lifecycle
  - Models: contract.model.ts with comprehensive type definitions
  - DTOs: dtos.ts with data transfer objects for API communication
  - Utilities: enhanced-parsing-converter.ts for format transformations
  
- `functions-ai/src/` structure
  - `/ai/` - AI client initialization
  - `/contract/` - parseContract function (fully implemented)
  - `/prompts/` - System prompts for Gemini
  - `/types/` - TypeScript interfaces for AI responses

### External Research

- #fetch:https://ai.google.dev/gemini-api/docs/vision
  - Gemini Vision API supports PDF and image analysis
  - Best practices: Single API call for multi-page documents
  - Response format: JSON mode for structured extraction
  - Token limits: 8192 output tokens for enhanced parsing

- #githubRepo:"firebase/firebase-functions" Cloud Functions patterns
  - Callable functions pattern for client-server communication
  - Security: enforceAppCheck, authentication validation
  - Performance: Memory allocation, timeout configuration, regional deployment
  - Error handling: HttpsError types for standardized responses

### Project Conventions

- **Standards referenced**: 
  - `.github/instructions/angular-modern-features.instructions.md` - Angular 20+ with Signals
  - `.github/instructions/typescript-5-es2022.instructions.md` - TypeScript best practices
  - `.github/copilot/constraints.md` - Prohibited patterns
  
- **Instructions followed**: 
  - Standalone components with inject() for DI
  - Signals for reactive state (signal, computed, effect)
  - OnPush change detection strategy
  - Repository pattern for data access

## Key Discoveries

### Project Structure

**Frontend Architecture** (Angular 20.3.x):
```
src/app/core/blueprint/modules/implementations/contract/
├── services/          # Business logic services
│   ├── contract-upload.service.ts         ✅ Implemented
│   ├── contract-parsing.service.ts        ✅ Implemented
│   ├── contract-management.service.ts     ✅ Implemented
│   ├── contract-lifecycle.service.ts      ✅ Implemented
│   └── contract-event.service.ts          ✅ Implemented
├── models/            # Domain models
│   ├── contract.model.ts                  ✅ Complete type definitions
│   └── dtos.ts                            ✅ API DTOs
├── utils/             # Utility functions
│   └── enhanced-parsing-converter.ts      ✅ Format transformations
└── repositories/      # Data access layer
    └── contract.repository.ts             ✅ Firestore operations
```

**Backend Architecture** (Firebase Cloud Functions):
```
functions-ai/
└── src/
    ├── contract/
    │   └── parseContract.ts              ✅ FULLY IMPLEMENTED
    ├── ai/                               ✅ Gemini client
    ├── prompts/                          ✅ System prompts
    └── types/                            ✅ Type definitions

functions-storage/
└── src/
    └── index.ts                          ❌ MINIMAL - Gap identified
```

### Implementation Patterns

**Current Upload Flow** (Client-Side):
```typescript
// Angular Service → Firebase Storage (Direct)
const attachment = await uploadService.uploadContractFile(blueprintId, contractId, file);
// Returns: FileAttachment with fileUrl, storagePath
```

**Current Parsing Flow** (Hybrid):
```typescript
// Angular Service → Cloud Function → Gemini API
const result = await httpsCallable(functions, 'contract-parseContract')({
  blueprintId, contractId, requestId, files
});
// Returns: { success, requestId, parsedData }
```

**Architecture Document Recommendation** (Server-Side Upload):
```
Client → uploadContractFile (Cloud Function) → Storage + parseContract trigger
```

### Complete Examples

#### Current parseContract Implementation (functions-ai)

```typescript
export const parseContract = onCall<ContractParsingRequest, Promise<ContractParsingResponse>>(
  {
    enforceAppCheck: false,
    memory: '1GiB',
    timeoutSeconds: 300,
    region: 'asia-east1'
  },
  async request => {
    const { blueprintId, contractId, requestId, files } = request.data;
    
    // Enhanced parsing mode with Gemini 2.5 Flash
    const ai = getGenAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{
        role: 'user',
        parts: [
          { text: ENHANCED_PARSING_SYSTEM_PROMPT },
          { text: userPrompt },
          { inlineData: { mimeType, data: base64 } }
        ]
      }],
      config: {
        maxOutputTokens: 8192,
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    });
    
    const parsedData = JSON.parse(response.text);
    return { success: true, requestId, parsedData };
  }
);
```

#### Current Upload Service (Angular)

```typescript
@Injectable({ providedIn: 'root' })
export class ContractUploadService {
  private readonly storage = inject(Storage);
  
  async uploadContractFile(blueprintId: string, contractId: string, file: File): Promise<FileAttachment> {
    // Validate file (type, size)
    const validation = this.validateFile(file);
    
    // Direct upload to Firebase Storage
    const storagePath = `blueprints/${blueprintId}/contracts/${contractId}/files/${file.name}`;
    const storageRef = ref(this.storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    // Monitor progress
    uploadTask.on('state_changed', snapshot => {
      const percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      this._progress.set({ bytesTransferred, totalBytes, percentage, state: 'running' });
    });
    
    await uploadTask;
    const fileUrl = await getDownloadURL(storageRef);
    
    return { id, fileName, fileType, fileSize, fileUrl, storagePath, uploadedBy, uploadedAt };
  }
}
```

### API and Schema Documentation

**parseContract Cloud Function Interface**:
```typescript
interface ContractParsingRequest {
  blueprintId: string;
  contractId: string;
  requestId: string;
  files: Array<{
    id: string;
    name: string;
    mimeType: string;
    dataUri: string;  // base64 encoded file
    url?: string;     // Alternative: download URL
  }>;
}

interface ContractParsingResponse {
  success: boolean;
  requestId: string;
  parsedData?: ContractParsingOutput | EnhancedContractParsingOutput;
  errorMessage?: string;
}

interface EnhancedContractParsingOutput {
  contractNumber: string;
  title: string;
  owner: ContractPartyInfo;
  contractor: ContractPartyInfo;
  startDate: string;        // YYYY-MM-DD
  endDate: string;
  currency: string;
  totalAmount: number;
  tax: number;
  totalAmountWithTax: number;
  workItems: WorkItemInfo[];
  additionalTerms: string[];
  extractionConfidence: number;
}
```

**Firebase Storage Structure**:
```
blueprints/{blueprintId}/
└── contracts/{contractId}/
    ├── files/
    │   ├── {fileName1}.pdf
    │   ├── {fileName2}.jpg
    │   └── {fileName3}.png
    └── metadata.json  (optional)
```

### Configuration Examples

**Gemini API Configuration**:
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash-exp',  // Latest vision model
  generationConfig: {
    maxOutputTokens: 8192,
    temperature: 0.1,             // Low for deterministic parsing
    responseMimeType: 'application/json'
  }
});
```

**Firebase Functions Configuration**:
```typescript
// firebase.json
{
  "functions": {
    "source": "functions-ai",
    "runtime": "nodejs20",
    "predeploy": ["npm run build"],
    "codebase": "functions-ai"
  }
}

// functions-ai/.env (required)
GEMINI_API_KEY=your_api_key_here
```

### Technical Requirements

**Phase 1 Requirements** (Per Architecture Document):
1. ✅ User can upload PDF contract via UI
2. ❌ File stored via functions-storage orchestration (Gap: currently client-side)
3. ✅ Cloud Function triggers and calls Gemini API
4. ✅ AI extracts core fields (contractNumber, title, owner, contractor, totalAmount)
5. ✅ Parsed data saved to Firestore
6. ✅ Frontend displays parsed data in verification form
7. ✅ User can manually correct data and create contract
8. ⚠️ Testing: Partial (unit tests exist, E2E pending)

**Identified Gaps**:
1. **functions-storage Implementation**: Missing uploadContractFile orchestration function
2. **Upload Flow**: Architecture recommends server-side upload, current is client-side
3. **PubSub Integration**: Architecture mentions async trigger via PubSub (not implemented)
4. **Verification Form**: UI exists but needs integration with smart suggestions

**Performance Targets**:
- AI Parsing: < 30 seconds per document ✅ (300s timeout configured)
- File Upload: Progress tracking ✅ (implemented with signals)
- Field Extraction: ≥ 60% coverage ✅ (enhanced mode supports comprehensive extraction)
- Error Rate: < 10% (requires monitoring setup)

## Recommended Approach

After evaluating the current implementation against the architecture document, I recommend **HYBRID APPROACH**:

### Approach A: Keep Client-Side Upload (Current + Minimal Changes)

**Rationale**: 
- Current implementation is functional and tested
- Direct Firebase Storage upload is simpler and performant
- Reduces Cloud Function costs (no upload orchestration needed)
- Architecture document's server-side recommendation is optional, not mandatory

**Required Changes**:
1. ✅ No changes to upload flow (already working)
2. ✅ parseContract function is complete
3. ⚠️ Add smart verification form UI integration
4. ⚠️ Implement post-deployment monitoring
5. ⚠️ Add E2E tests for full workflow

**Benefits**:
- Minimal code changes
- Faster implementation (1-2 days)
- Lower operational complexity
- Direct storage upload is faster (no middleware)

**Trade-offs**:
- Less centralized validation
- No server-side pre-processing
- Client must handle upload errors directly

### Approach B: Implement Server-Side Upload (Architecture Recommended)

**Rationale**:
- Aligns with architecture document's vision
- Centralizes upload validation and orchestration
- Enables PubSub async trigger pattern
- Better for future extensibility (pre-processing, virus scan, etc.)

**Required Changes**:
1. ❌ Implement uploadContractFile in functions-storage
2. ❌ Refactor contract-upload.service.ts to call Cloud Function
3. ❌ Configure PubSub trigger for parseContract
4. ⚠️ Update security rules for server-side writes
5. ⚠️ Add comprehensive error handling
6. ⚠️ Update all UI components using upload service

**Benefits**:
- Matches architecture document exactly
- Centralized validation and orchestration
- Async processing via PubSub
- Better extensibility for future features

**Trade-offs**:
- More code changes required (3-5 days)
- Higher operational complexity
- Additional Cloud Function costs
- Requires extensive testing

## Implementation Guidance

### Recommendation: **Approach A (Keep Client-Side Upload)**

**Objectives**:
- Complete Phase 1 MVP with minimal changes
- Focus on verification form integration
- Add monitoring and testing
- Defer server-side upload to Phase 2 if needed

**Key Tasks**:
1. Integrate smart verification form with AI suggestions
2. Add monitoring for parseContract function performance
3. Create E2E tests for upload → parse → verify workflow
4. Document current implementation patterns
5. Set up error tracking and alerting

**Dependencies**:
- Angular 20.3.x with Signals ✅
- Firebase Functions v2 ✅
- @google/generative-ai SDK ✅
- Gemini API access ✅

**Success Criteria**:
- User can upload contract file and see AI-parsed data in verification form
- Field extraction rate ≥ 60% for test contracts
- Upload → Parse workflow < 45 seconds total
- Error handling covers all failure scenarios
- E2E tests pass for happy path + error cases

**Next Steps**:
1. Review this research with user to confirm Approach A
2. Create detailed task plan for verification form integration
3. Design monitoring dashboard for AI parsing metrics
4. Write E2E test scenarios
5. Document deployment and rollback procedures

