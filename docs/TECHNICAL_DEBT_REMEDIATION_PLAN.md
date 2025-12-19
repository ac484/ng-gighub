# Technical Debt Remediation Plan: Contract Module File Upload & AI Processing

## Executive Summary

This plan addresses incomplete implementation of contract file upload, preview, and AI parsing functionality in the GigHub construction management system. The contract module requires integration with Firebase Cloud Functions for automated file processing and AI-powered document analysis.

**Key Requirements from Problem Statement:**
1. Implement contract upload using functions-storage (compare with cloud module)
2. Add preview modal with Google Docs Viewer
3. Integrate AI document parsing with functions-ai-document  
4. Display two icons in contract list: Preview & Parse
5. Maintain high cohesion, low coupling, and extensibility
6. Complete removal of redundant code after implementation
7. Use Context7 for any unclear requirements

---

## 📊 Technical Debt Inventory

| ID | Overview | Ease | Impact | Risk | Explanation |
|----|----------|------|--------|------|-------------|
| TD-1 | Incomplete contract upload integration | 3/5 | 🔴 Critical | 🔴 High Risk | Upload exists but lacks Cloud Functions integration |
| TD-2 | Missing preview functionality | 2/5 | 🟡 Medium | 🟡 Medium Risk | Preview icon shows but no handler implemented |
| TD-3 | Missing AI parsing integration | 4/5 | 🔴 Critical | 🔴 High Risk | No functions-ai-document integration |
| TD-4 | Inconsistent architecture | 3/5 | 🟡 Medium | 🟡 Medium Risk | Different patterns vs cloud module |
| TD-5 | Facade initialization errors | 2/5 | 🔴 Critical | 🔴 High Risk | Blueprint ID not set prevents loading |

---

## Implementation Priority & Timeline

| Phase | Tasks | Est. Time | Priority |
|-------|-------|-----------|----------|
| **Phase 1** | TD-5 (Fix facade) | 3 hours | 🔴 Critical |
| **Phase 2** | TD-1, TD-2 (Upload, Preview) | 12 hours | 🔴 Critical |
| **Phase 3** | TD-3 (AI Parsing) | 15 hours | 🟡 High |
| **Phase 4** | TD-4 (Architecture cleanup) | 5 hours | 🟡 Medium |

**Total: 35 hours (1 week)**

---

## TD-1: Incomplete Contract Upload Integration

### Overview
Contract upload exists but lacks `functions-storage` integration for automated processing, validation, and audit trails.

### Current State
- Basic Firebase Storage upload implemented
- No Cloud Function triggers
- Missing metadata tagging
- No automated validation

### Impact
- 🔴 **Critical**: Files uploaded without proper security validation
- Missing audit trail for compliance
- Inconsistent with cloud module architecture

### Resolution Steps

**1. Update Storage Path (1 hour)**
```typescript
// Change from: contracts/{blueprintId}/{contractId}/filename.pdf  
// To: contracts/{blueprintId}/{contractId}/originals/filename.pdf
// This enables functions-storage to identify contract files

const storagePath = `contracts/${blueprintId}/${contractId}/originals/${fileId}-${filename}`;
```

**Files to modify:**
- `src/app/core/blueprint/modules/implementations/contract/services/contract-upload.service.ts`

**2. Add Metadata Tagging (2 hours)**
```typescript
const metadata = {
  customMetadata: {
    blueprintId,
    contractId,
    uploadedBy,
    fileCategory: 'contract-original',
    requiresProcessing: 'true',
    aiParsingEnabled: 'false'
  }
};

await uploadBytesResumable(storageRef, file, { customMetadata: metadata });
```

**3. Listen for Processing Results (3 hours)**
```typescript
// Create service to listen for functions-storage completion
const docRef = doc(firestore, `blueprints/${blueprintId}/files/${fileId}`);
onSnapshot(docRef, (snapshot) => {
  const result = snapshot.data();
  if (result.processed) {
    this.handleProcessingComplete(result);
  }
});
```

**Files to create:**
- `src/app/core/blueprint/modules/implementations/contract/services/contract-file-processor.service.ts`

**4. Update UI (2 hours)**
- Show upload → processing → complete status
- Display error messages if validation fails

**Testing:**
- Upload PDF contract
- Verify Cloud Function processes file
- Check Firestore metadata created
- Confirm UI updates

---

## TD-2: Missing Preview Functionality

### Overview
Contract table shows preview icon but clicking does nothing. Need modal with Google Docs Viewer.

### Current State
- Preview button exists in table
- No modal component
- No preview service

### Impact
- 🟡 **Medium**: Poor UX, users must download to view
- Incomplete feature implementation

### Resolution Steps

**1. Create Preview Modal (3 hours)**
```typescript
@Component({
  selector: 'app-contract-preview-modal',
  template: `
    <nz-modal
      [(nzVisible)]="visible"
      nzTitle="合約預覽"
      [nzWidth]="'90%'"
      [nzFooter]="null"
    >
      <iframe
        [src]="viewerUrl()"
        width="100%"
        height="800px"
      ></iframe>
    </nz-modal>
  `
})
export class ContractPreviewModalComponent {
  visible = signal(false);
  fileUrl = signal<string | null>(null);
  
  viewerUrl = computed(() => {
    const url = this.fileUrl();
    if (!url) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
    );
  });
  
  open(fileUrl: string): void {
    this.fileUrl.set(fileUrl);
    this.visible.set(true);
  }
}
```

**Files to create:**
- `src/app/routes/blueprint/modules/contract/features/preview/contract-preview-modal.component.ts`
- `src/app/routes/blueprint/modules/contract/features/preview/index.ts`

**2. Connect Button (1 hour)**
```typescript
// In contract-module-view-refactored.component.ts
handlePreviewContract(contract: Contract): void {
  const firstFile = contract.originalFiles[0];
  this.previewModal.open(firstFile.fileUrl);
}
```

**3. Support File Types (2 hours)**
- PDF: Google Docs Viewer
- Images: Direct display

**Testing:**
- Click preview icon
- Verify modal opens
- Test PDF and image files
- Check mobile responsive

---

## TD-3: Missing AI Parsing Integration

### Overview
No integration with `functions-ai-document`. Must implement contract AI parsing with editable results.

### Current State
- functions-ai-document deployed
- Parse button shows but no handler
- Contract model has parsedData field (unused)

### Impact
- 🔴 **Critical**: Users must manually enter all data
- Missing key product differentiator
- 80% time savings potential unused

### Resolution Steps

**1. Update Data Model (1 hour)**
```typescript
export interface ParsedContractData {
  contractNumber?: string;
  contractTitle?: string;
  totalAmount?: number;
  owner?: { name: string; contact?: string };
  contractor?: { name: string; contact?: string };
  confidence?: number;
  extractedText?: string;
  processingTime?: number;
}
```

**Files to modify:**
- `src/app/core/blueprint/modules/implementations/contract/models/parsed-contract-data.model.ts`

**2. Create AI Parser Service (4 hours)**
```typescript
@Injectable({ providedIn: 'root' })
export class ContractAIParserService {
  async parseContract(
    blueprintId: string,
    contractId: string,
    fileUrl: string
  ): Promise<ParsedContractData> {
    // Call functions-ai-document
    const parseFunction = httpsCallable(
      this.functions,
      'processDocumentFromStorage'
    );
    
    const result = await parseFunction({
      gcsUri: this.convertToGcsUri(fileUrl),
      mimeType: 'application/pdf'
    });
    
    // Transform Document AI output
    return this.transformToContractData(result.data.result);
  }
  
  private transformToContractData(docAI: any): ParsedContractData {
    // Extract entities and structure data
    return {
      contractTitle: this.extractTitle(docAI),
      contractNumber: this.extractNumber(docAI),
      totalAmount: this.extractAmount(docAI),
      // ... other fields
    };
  }
}
```

**Files to create:**
- `src/app/core/blueprint/modules/implementations/contract/services/contract-ai-parser.service.ts`

**3. Create Result Review Modal (4 hours)**
```typescript
@Component({
  selector: 'app-contract-parsing-result-modal',
  template: `
    <nz-modal nzTitle="AI 解析結果" [nzWidth]="'800px'">
      <nz-progress [nzPercent]="confidence * 100" />
      
      <form nz-form [formGroup]="form">
        <nz-form-item>
          <nz-form-label>合約編號</nz-form-label>
          <input nz-input formControlName="contractNumber" />
        </nz-form-item>
        <!-- More fields -->
      </form>
    </nz-modal>
  `
})
export class ContractParsingResultModalComponent {
  form: FormGroup;
  dataAccepted = output<Partial<Contract>>();
  
  open(parsedData: ParsedContractData): void {
    this.populateForm(parsedData);
    this.visible.set(true);
  }
}
```

**Files to create:**
- `src/app/routes/blueprint/modules/contract/features/parsing/contract-parsing-result-modal.component.ts`

**4. Connect Parse Button (2 hours)**
```typescript
async handleParseContract(contract: Contract): Promise<void> {
  this.message.loading('AI 正在解析合約...');
  
  const parsedData = await this.parserService.parseContract(
    this.blueprintId(),
    contract.id,
    contract.originalFiles[0].fileUrl
  );
  
  this.parsingModal.open(parsedData);
}
```

**Testing:**
- Upload contract PDF
- Click parse button
- Verify AI extracts data
- Edit and accept results
- Confirm contract updated

---

## TD-4: Inconsistent Architecture

### Overview
Contract module uses different patterns than cloud module, reducing maintainability.

### Resolution Steps

**1. Create Repository Layer (3 hours)**
```typescript
@Injectable({ providedIn: 'root' })
export class ContractRepository {
  private readonly firestore = inject(Firestore);
  
  async listContracts(blueprintId: string): Promise<Contract[]> {
    // Firestore operations
  }
  
  async createContract(blueprintId: string, contract: Omit<Contract, 'id'>): Promise<Contract> {
    // Implementation
  }
}
```

**2. Refactor Service (2 hours)**
```typescript
@Injectable({ providedIn: 'root' })
export class ContractService {
  private readonly repository = inject(ContractRepository);
  
  async loadContracts(blueprintId: string): Promise<void> {
    await this.repository.listContracts(blueprintId);
    this.eventBus.publish({ type: 'contract.list.loaded' });
  }
}
```

**Files to create:**
- `src/app/core/blueprint/modules/implementations/contract/repositories/contract.repository.ts`

---

## TD-5: Facade Initialization Errors

### Overview
Error: `[ContractFacade] Blueprint ID not set. Call initialize() first.`

### Resolution Steps

**1. Fix Initialization Order (1 hour)**
```typescript
ngOnInit(): void {
  // MUST call initialize first
  this.facade.initialize(this.blueprintId());
  this.loadContracts();
}
```

**2. Add Guards (1 hour)**
```typescript
private ensureInitialized(): void {
  if (!this._blueprintId()) {
    throw new Error('Blueprint ID not set');
  }
}
```

**3. Add Status Signal (1 hour)**
```typescript
private _initialized = signal(false);
readonly initialized = this._initialized.asReadonly();
```

**Files to modify:**
- `src/app/routes/blueprint/modules/contract/contract-module-view-refactored.component.ts`
- `src/app/core/blueprint/modules/implementations/contract/facades/contract.facade.ts`

---

## Architecture Decision: functions-storage vs Direct Upload

### Recommendation: Use functions-storage ✅

**Why:**
1. **Consistent**: Same pattern as cloud module
2. **Secure**: Server-side validation
3. **Auditable**: Complete operation logs
4. **Scalable**: Auto-scales with load
5. **Maintainable**: Centralized processing

**Flow:**
```
Upload → Firebase Storage → Cloud Function Trigger →
Validation → Metadata → Firestore → Client Notification
```

---

## Security Considerations

### Firebase Storage Rules
```javascript
match /contracts/{blueprintId}/{contractId}/{allPaths=**} {
  allow read: if request.auth != null;
  allow write: if request.auth != null 
               && isBlueprintMember(blueprintId)
               && request.resource.size < 10 * 1024 * 1024;
}
```

### File Validation
- ✅ Server-side type validation
- ✅ Size limits (10MB)
- ✅ Malware scanning
- ✅ Content-type verification

---

## Implementation Checklist

### Phase 1: Critical Fixes ☑️
- [ ] Fix facade initialization
- [ ] Add initialization guards
- [ ] Test contract loading

### Phase 2: Core Features ☑️
- [ ] Update storage paths
- [ ] Add metadata tagging
- [ ] Create preview modal
- [ ] Connect preview button
- [ ] Test upload and preview

### Phase 3: AI Features ☑️
- [ ] Update data model
- [ ] Create AI parser service
- [ ] Create result modal
- [ ] Connect parse button
- [ ] Test AI parsing flow

### Phase 4: Architecture ☑️
- [ ] Create repository layer
- [ ] Refactor services
- [ ] Remove redundant code
- [ ] Update documentation

### Post-Implementation ☑️
- [ ] Full test suite
- [ ] Manual testing
- [ ] Security review
- [ ] Deploy to staging
- [ ] User acceptance testing

---

## Success Metrics

### Technical
- Upload success rate: >99%
- Preview load time: <3s
- AI parsing accuracy: >70%
- AI parsing time: <10s

### Business
- Time to create contract: -80%
- Data entry errors: -90%
- User satisfaction: >4.5/5

---

## References

- functions-storage: `/functions-storage/README.md`
- functions-ai-document: `/functions-ai-document/README.md`
- Contract README: `/src/app/routes/blueprint/modules/contract/README.md`
- Cloud module: `/src/app/routes/blueprint/modules/cloud/`

---

**Plan Version**: 1.0  
**Created**: 2025-12-19  
**Status**: Ready for Implementation
