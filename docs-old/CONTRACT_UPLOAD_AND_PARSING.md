# Contract Upload & AI Parsing Implementation Guide

> **Version**: 1.0  
> **Date**: 2025-12-19  
> **Status**: Completed ✅

## Overview

This document describes the implementation of contract file upload, preview, and AI-powered document parsing features in the GigHub Contract Management module.

## Architecture Decision

### Selected Approach: Direct Firebase Storage

**Decision**: Use **Direct Angular Fire Storage** instead of Cloud Functions (functions-storage)

**Rationale**:
1. **Lower Latency**: Direct upload bypasses Cloud Function overhead (~200-500ms saved)
2. **Real-time Progress**: Built-in `uploadBytesResumable` provides granular progress tracking
3. **Better UX**: Immediate visual feedback during large file uploads
4. **Cost Efficient**: No Cloud Function invocation costs ($0.40 per million invocations)
5. **Simpler Architecture**: Fewer moving parts, easier to debug and maintain
6. **Existing Pattern**: Contract module already uses direct Firebase Storage

### When to Use functions-storage

The `functions-storage` Cloud Function is still valuable for:
- **Post-upload validation**: Virus scanning, file format validation
- **Automatic processing**: Thumbnail generation, metadata extraction
- **Audit trails**: Centralized logging of all storage events
- **Security validation**: Advanced file content scanning

These features run asynchronously after upload, not blocking the user experience.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     UI Layer (Angular)                       │
├─────────────────────────────────────────────────────────────┤
│  ContractTableComponent                                      │
│    ├─ Preview Icon (file-pdf) → Preview Modal               │
│    └─ Parse Icon (robot) → Parsing Modal                    │
├─────────────────────────────────────────────────────────────┤
│  ContractPreviewModalComponent                               │
│    └─ Google Docs Viewer (for PDF/Images)                   │
├─────────────────────────────────────────────────────────────┤
│  ContractParsingModalComponent                               │
│    └─ Progress + Parsed Data Preview                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Business Layer (Services)                  │
├─────────────────────────────────────────────────────────────┤
│  ContractUploadService                                       │
│    └─ uploadBytesResumable (Firebase Storage SDK)          │
├─────────────────────────────────────────────────────────────┤
│  ContractAIParserService                                     │
│    └─ parseContractFromStorage()                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                Infrastructure (Firebase/GCP)                 │
├─────────────────────────────────────────────────────────────┤
│  Firebase Storage                                            │
│    └─ contracts/{blueprintId}/{contractId}/{fileId}-{name}  │
├─────────────────────────────────────────────────────────────┤
│  Cloud Functions (functions-ai-document)                     │
│    └─ processDocumentFromStorage (Document AI)              │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### 1. ContractTableComponent
**Responsibility**: Display contracts with action buttons

**Interface**:
```typescript
@Input() contracts: Contract[]
@Input() loading: boolean
@Output() previewContract: EventEmitter<Contract>
@Output() parseContract: EventEmitter<Contract>
@Output() viewContract: EventEmitter<Contract>
@Output() editContract: EventEmitter<Contract>
@Output() deleteContract: EventEmitter<Contract>
```

**Actions**:
- **Preview Icon** (file-pdf): Shows when `contract.originalFiles.length > 0`
- **Parse Icon** (robot): Shows when file exists AND no parsed data (`!contract.parsedData`)

### 2. ContractPreviewModalComponent
**Responsibility**: Display contract files using Google Docs Viewer

**Interface**:
```typescript
export interface ContractPreviewModalData {
  file: FileAttachment;
  contractNumber?: string;
}
```

**Features**:
- Google Docs Viewer integration for PDF files
- Direct image display for image files
- File metadata display (name, size, type, upload date)
- Download file functionality
- Fullscreen mode support

**Google Docs Viewer URL**:
```typescript
const googleDocsViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
```

### 3. ContractParsingModalComponent
**Responsibility**: Show AI parsing progress and results

**Interface**:
```typescript
export interface ContractParsingModalData {
  contractId: string;
  fileName: string;
}
```

**Features**:
- Multi-step progress indicator (4 steps)
- Real-time status updates (pending → processing → completed/failed)
- Comprehensive parsed data preview
- Confidence score display with color coding
- Warnings for low confidence results
- User confirmation before applying data

**Progress Steps**:
1. 文件上傳 (File Upload)
2. AI 分析 (AI Analysis)
3. 資料提取 (Data Extraction)
4. 完成 (Complete)

### 4. ContractModuleViewComponent
**Responsibility**: Orchestrate all contract features

**Key Methods**:
```typescript
previewContract(contract: Contract): void
parseContract(contract: Contract): Promise<void>
performParsing(contract: Contract): Promise<void>
```

**Flow**:
1. User clicks preview icon → opens `ContractPreviewModalComponent`
2. User clicks parse icon → checks for existing parsed data
3. If exists → confirm re-parsing → opens `ContractParsingModalComponent`
4. Call `aiParserService.parseContractFromStorage()`
5. Show progress in modal
6. Display parsed data preview
7. User confirms → update contract with parsed data
8. Reload contracts list

## Data Flow

### Preview Flow
```
User clicks preview icon
  → ContractTableComponent emits previewContract event
    → ContractModuleViewComponent.previewContract()
      → Opens ContractPreviewModalComponent with file data
        → Displays file using Google Docs Viewer
          → User can download or close
```

### AI Parsing Flow
```
User clicks parse icon
  → ContractTableComponent emits parseContract event
    → ContractModuleViewComponent.parseContract()
      → Check for existing parsedData
        → If exists: Confirm re-parsing
      → ContractModuleViewComponent.performParsing()
        → Opens ContractParsingModalComponent
          → Call aiParserService.parseContractFromStorage()
            → Cloud Function processes document with Document AI
              → Returns structured data
            → Modal displays parsed data preview
              → User confirms or cancels
                → If confirmed: Update contract via facade
                  → Reload contracts list
```

## File Upload Process (Existing)

The file upload process is already implemented in `ContractUploadService`:

```typescript
async uploadContractFile(
  blueprintId: string, 
  contractId: string, 
  file: File, 
  uploadedBy: string
): Promise<FileAttachment>
```

**Storage Path Format**:
```
contracts/{blueprintId}/{contractId}/{timestamp}-{randomId}-{sanitizedFileName}
```

**Process**:
1. Validate file (type: PDF/JPG/PNG, size: < 10MB)
2. Generate unique file ID
3. Create storage path
4. Upload using `uploadBytesResumable()`
5. Get download URL
6. Return `FileAttachment` object

## AI Document Parsing

### ContractAIParserService

**Method**: `parseContractFromStorage(request: ParseContractRequest)`

**Input**:
```typescript
interface ParseContractRequest {
  fileId: string;
  storagePath: string;
  fileName: string;
  documentType: 'construction_contract';
  languageHint: 'zh-TW' | 'en';
}
```

**Output**:
```typescript
interface ParseContractResult {
  parseId: string;
  data: ParsedContractData;
  success: boolean;
  error?: string;
}

interface ParsedContractData {
  id: string;
  sourceFileId: string;
  parsedAt: Date;
  status: 'completed' | 'failed';
  confidenceScore: number;
  contractNumber?: string;
  title?: string;
  owner?: ExtractedPartyInfo;
  contractor?: ExtractedPartyInfo;
  financial?: ExtractedFinancialInfo;
  dates?: ExtractedDateInfo;
  lineItems?: ExtractedLineItem[];
  textSections?: ExtractedTextSection[];
  fullText?: string;
  pageCount?: number;
  processingTime?: number;
  isReviewed: boolean;
  warnings?: string[];
  errorMessage?: string;
}
```

### Document AI Integration

The service integrates with `functions-ai-document` Cloud Function which uses Google Cloud Document AI:

**Features**:
- OCR text extraction
- Entity recognition (names, dates, amounts)
- Form field extraction
- Table extraction
- Confidence scoring

**Processing Time**: Typically 2-5 seconds for standard contracts

**Confidence Levels**:
- **High (>80%)**: Green, high accuracy
- **Medium (60-80%)**: Yellow, review recommended
- **Low (<60%)**: Red, manual verification required

## High Cohesion & Low Coupling

### Cohesion ✅
Each component has a single, well-defined responsibility:

| Component | Responsibility |
|-----------|----------------|
| ContractTableComponent | Display data + action buttons |
| ContractPreviewModalComponent | File preview only |
| ContractParsingModalComponent | Parsing UI + progress only |
| ContractUploadService | File upload only |
| ContractAIParserService | AI parsing only |
| ContractModuleViewComponent | Orchestration only |

### Coupling ✅
Components are loosely coupled through clear interfaces:

- **No direct dependencies** between feature components
- **Event-driven communication** via inputs/outputs
- **Modal data injection** via `NZ_MODAL_DATA`
- **Service injection** for cross-cutting concerns
- **Facade pattern** for state management

## Extensibility

### Easy to Add New Features

**Example: Add Email Preview Attachment**
```typescript
// 1. Add output to ContractTableComponent
@Output() emailPreview = output<Contract>();

// 2. Add button to table
{
  icon: 'mail',
  tooltip: 'Email Preview',
  click: record => this.emailPreview.emit(record)
}

// 3. Handle in ContractModuleViewComponent
emailPreview(contract: Contract): void {
  // Open email modal
}
```

No need to modify existing preview or parsing logic!

## Testing Strategy

### Unit Tests
```typescript
// ContractPreviewModalComponent
- Should display file info correctly
- Should generate correct Google Docs Viewer URL
- Should handle download click
- Should handle modal close

// ContractParsingModalComponent
- Should display progress steps
- Should update status correctly
- Should show parsed data preview
- Should emit confirmed data on confirm
- Should handle errors

// ContractTableComponent
- Should show preview icon when file exists
- Should show parse icon when file exists and no parsed data
- Should emit correct events
```

### Integration Tests
```typescript
// Contract Preview Flow
- Upload contract → Open preview → Verify display

// AI Parsing Flow
- Upload contract → Parse → Verify parsed data → Confirm → Verify stored
```

### E2E Tests
```typescript
// Full Contract Creation Workflow
- Create contract → Upload file → Preview → Parse → Confirm → View details
```

## Performance Considerations

### Upload Performance
- **Direct Firebase Storage**: ~100-200ms overhead
- **Large files (5-10MB)**: 2-10 seconds depending on connection
- **Progress tracking**: Real-time updates every 100ms

### Parsing Performance
- **Document AI processing**: 2-5 seconds for standard contracts
- **Network latency**: ~100-300ms
- **Total time**: ~3-8 seconds

### Optimization Opportunities
1. **Lazy load preview modal** - Load Google Docs Viewer iframe only when opened
2. **Cache parsed data** - Store in IndexedDB for offline access
3. **Parallel processing** - Parse multiple files concurrently
4. **WebWorker for data transformation** - Offload JSON parsing to worker thread

## Security Considerations

### Firebase Storage Security Rules
```javascript
match /contracts/{blueprintId}/{contractId}/{fileId} {
  // Only authenticated users who are blueprint members can read
  allow read: if request.auth != null && 
                 isBlueprintMember(blueprintId);
  
  // Only authenticated users who are blueprint members can write
  allow write: if request.auth != null && 
                  isBlueprintMember(blueprintId) &&
                  hasPermission(blueprintId, 'contract:upload');
}
```

### File Upload Security
- **Type validation**: Only PDF, JPG, PNG allowed
- **Size validation**: Maximum 10MB
- **Name sanitization**: Remove special characters
- **Virus scanning**: Handled by functions-storage (post-upload)

### Google Docs Viewer Security
- **URL encoding**: Prevent XSS attacks
- **Domain sanitization**: Ensure URLs are from Firebase Storage
- **No sensitive data in URL**: File ID and contract ID are obfuscated

### AI Parsing Security
- **Storage path validation**: Ensure file exists in user's scope
- **Authentication**: Cloud Function requires authenticated user
- **Data sanitization**: Remove sensitive info from logs
- **Audit trail**: Log all parsing requests

## Error Handling

### Upload Errors
```typescript
try {
  await uploadService.uploadContractFile(...)
} catch (error) {
  if (error.code === 'storage/unauthorized') {
    message.error('您沒有上傳權限');
  } else if (error.code === 'storage/quota-exceeded') {
    message.error('儲存空間已滿');
  } else {
    message.error('上傳失敗，請稍後再試');
  }
}
```

### Parsing Errors
```typescript
try {
  const result = await aiParserService.parseContractFromStorage(...)
  if (!result.success) {
    component.setError(result.error);
  }
} catch (error) {
  component.setError('AI 解析過程發生錯誤');
  console.error('[ContractModuleView]', error);
}
```

### Preview Errors
```typescript
@if (error()) {
  <nz-result
    nzStatus="error"
    nzTitle="預覽失敗"
    [nzSubTitle]="error()"
  >
    <button nz-button (click)="retryPreview()">重試</button>
  </nz-result>
}
```

## Usage Examples

### Preview Contract File
```typescript
// In Contract List
<app-contract-table
  [contracts]="contracts()"
  (previewContract)="previewContract($event)"
/>

// In Module View
previewContract(contract: Contract): void {
  this.modalService.create({
    nzContent: ContractPreviewModalComponent,
    nzData: {
      file: contract.originalFiles[0],
      contractNumber: contract.contractNumber
    },
    nzWidth: 1000
  });
}
```

### Parse Contract with AI
```typescript
// In Contract List
<app-contract-table
  [contracts]="contracts()"
  (parseContract)="parseContract($event)"
/>

// In Module View
async parseContract(contract: Contract): Promise<void> {
  const modalRef = this.modalService.create({
    nzContent: ContractParsingModalComponent,
    nzData: {
      contractId: contract.id,
      fileName: contract.originalFiles[0].fileName
    },
    nzWidth: 800
  });

  const component = modalRef.getContentComponent();
  const result = await this.aiParserService.parseContractFromStorage({...});
  
  if (result.success) {
    component.startParsing(result.data);
  } else {
    component.setError(result.error);
  }
}
```

## Troubleshooting

### Google Docs Viewer Not Loading
**Issue**: iframe shows blank page  
**Solution**: 
1. Check file URL is publicly accessible
2. Verify URL encoding is correct
3. Try direct Firebase Storage URL first
4. Check browser console for CORS errors

### AI Parsing Takes Too Long
**Issue**: Parsing timeout after 30 seconds  
**Solution**:
1. Check file size (Document AI has 20MB limit)
2. Verify Document AI processor is configured
3. Check Cloud Function timeout settings
4. Review Document AI quotas

### Parsed Data Low Confidence
**Issue**: Confidence score < 60%  
**Solution**:
1. Use higher resolution scans (>300 DPI)
2. Ensure text is clear and legible
3. Use native PDF instead of scanned images
4. Consider manual data entry for critical fields

## Future Enhancements

### Near-term (Next Sprint)
- [ ] Batch file upload support
- [ ] File version history
- [ ] Download multiple files as ZIP
- [ ] Print preview

### Mid-term (Next Quarter)
- [ ] OCR for handwritten text
- [ ] Automatic clause extraction
- [ ] Contract comparison (diff view)
- [ ] Template-based parsing

### Long-term (Next Year)
- [ ] Real-time collaborative editing
- [ ] AI-powered contract generation
- [ ] Blockchain verification
- [ ] Integration with DocuSign

## References

- Firebase Storage SDK: https://firebase.google.com/docs/storage/web/upload-files
- Google Docs Viewer: https://docs.google.com/viewer
- Document AI: https://cloud.google.com/document-ai/docs
- ng-zorro-antd Upload: https://ng.ant.design/components/upload
- Angular Fire: https://github.com/angular/angularfire

---

**Maintainer**: GigHub Development Team  
**Last Updated**: 2025-12-19  
**Next Review**: 2026-01-19
