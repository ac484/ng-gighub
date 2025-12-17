# Phase 4.3: Error Handling Improvements

**Date**: 2025-12-17  
**Status**: Analysis Complete  
**Phase**: 4.3 - Error Recovery

---

## 📋 Current Error Handling Analysis

### ✅ Already Implemented

1. **File Upload Validation** (Lines 369-377)
   - File type validation via `uploadService.validateFile()`
   - Clear error messages via `this.message.error()`
   - Prevents invalid files from being added

2. **Upload Error Handling** (Lines 484-502)
   - Individual file upload wrapped in try-catch
   - Failed uploads tracked in `failedUploads` array
   - Partial success handling (some files succeed, some fail)
   - User feedback via warning messages

3. **Parsing Error Handling** (Lines 545-555)
   - Parsing status tracked in `parsingProgress` signal
   - 'failed' status set on error
   - Error logged to console

4. **General Error Handling** (Lines 512-518)
   - Try-catch wrapper around upload logic
   - Error message extraction (Error objects vs unknown)
   - Console logging for debugging
   - Loading state properly cleared in finally block

---

## ⚠️ Identified Gaps

### 1. No User Recovery Path from Parsing Failure

**Current Behavior**:
```typescript
// Line 546-555
this.parsingProgress.set({
  requestId: '',
  status: 'failed',
  progress: 0,
  error: errorMessage
});
this.message.error('文件解析失敗');
```

**Issue**: User stuck on parsing step with error message, no clear way to recover

**Proposed Fix**:
```typescript
private handleParsingError(error: Error): void {
  const errorMessage = error.message || '解析失敗';
  
  this.parsingProgress.set({
    requestId: '',
    status: 'failed',
    progress: 0,
    error: errorMessage
  });
  
  this.message.error({
    nzContent: `文件解析失敗: ${errorMessage}`,
    nzDuration: 5000
  });
  
  // Auto-return to upload step after 3 seconds
  setTimeout(() => {
    this.currentStep.set(STEP_UPLOAD);
    this.uploadedFiles.set([]);
    this.fileAttachments.set([]);
    this.message.info('已返回上傳步驟，請重新選擇檔案');
  }, 3000);
}
```

---

### 2. Missing Network Error Handling

**Current State**: No specific handling for network failures (timeout, connection loss, CORS)

**Proposed Addition**:
```typescript
private async uploadWithRetry(file: File, maxRetries = 3): Promise<FileAttachment> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await this.uploadService.uploadContractFile(
        this.blueprintId(),
        'temp',
        file
      );
    } catch (err) {
      lastError = err as Error;
      
      // Check if it's a network error
      if (this.isNetworkError(err)) {
        if (attempt < maxRetries) {
          this.message.info(`網路錯誤，正在重試 (${attempt}/${maxRetries})...`);
          await this.delay(1000 * attempt); // Exponential backoff
          continue;
        }
      }
      // Non-network error, don't retry
      throw err;
    }
  }
  
  throw lastError || new Error('Upload failed after retries');
}

private isNetworkError(err: unknown): boolean {
  if (err instanceof Error) {
    return err.message.includes('network') || 
           err.message.includes('timeout') ||
           err.message.includes('CORS');
  }
  return false;
}

private delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

### 3. Missing Contract Creation Error Recovery

**Current State**: If contract creation fails at STEP_CREATE, user can click "retry" but no state cleanup happens

**Issue**: Retry without cleanup may cause duplicate contract attempts

**Proposed Fix**:
```typescript
// Add retry counter to prevent infinite retries
private contractCreationAttempts = signal(0);

async retryContractCreation(): Promise<void> {
  const attempts = this.contractCreationAttempts();
  
  if (attempts >= 3) {
    this.message.error({
      nzContent: '建立失敗次數過多，請返回編輯步驟檢查資料',
      nzDuration: 5000
    });
    return;
  }
  
  this.contractCreationAttempts.update(n => n + 1);
  
  // Clear previous error state
  this.createdContract.set(null);
  
  // Retry creation
  await this.createContractFromEditedData();
}

// Reset attempt counter when returning to edit
onParsedDataRejected(): void {
  this.currentStep.set(STEP_UPLOAD);
  this.parsedData.set(null);
  this.uploadedFiles.set([]);
  this.contractCreationAttempts.set(0); // Reset
  this.message.info('已返回上傳步驟，請重新上傳文件');
}
```

---

### 4. Missing File Size/Type Visual Feedback

**Current State**: File validation errors shown as toast messages, but no inline feedback

**Proposed Enhancement**:
```typescript
// Add validation state signal
fileValidationErrors = signal<Map<string, string>>(new Map());

beforeUpload = (file: NzUploadFile): boolean => {
  const validation = this.uploadService.validateFile(file as unknown as File);
  
  if (!validation.isValid) {
    // Store error for this file
    this.fileValidationErrors.update(errors => {
      const newErrors = new Map(errors);
      newErrors.set(file.uid, validation.errors.join(', '));
      return newErrors;
    });
    
    this.message.error(validation.errors.join(', '));
    return false;
  }
  
  // Clear any previous errors for this file
  this.fileValidationErrors.update(errors => {
    const newErrors = new Map(errors);
    newErrors.delete(file.uid);
    return newErrors;
  });
  
  this.uploadedFiles.update(files => [...files, file]);
  return false;
};
```

**Template Enhancement**:
```html
<nz-upload
  nzType="drag"
  [nzMultiple]="true"
  [nzAccept]="acceptedFileTypes"
  [nzBeforeUpload]="beforeUpload"
  [nzFileList]="uploadedFiles()"
  (nzChange)="handleUploadChange($event)"
>
  <!-- ... existing content ... -->
</nz-upload>

<!-- Show validation errors -->
@if (fileValidationErrors().size > 0) {
  <nz-alert 
    nzType="error" 
    nzShowIcon 
    class="mt-md"
    [nzMessage]="'檔案驗證失敗 (' + fileValidationErrors().size + ' 個檔案)'"
    [nzDescription]="getValidationErrorsList()"
  />
}
```

---

### 5. Missing Cleanup on Navigation Away

**Current State**: No cleanup when user navigates away mid-workflow

**Proposed Fix**:
```typescript
import { DestroyRef, inject } from '@angular/core';

export class ContractCreationWizardComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  
  ngOnInit(): void {
    this.initForm();
    
    // Register cleanup on component destroy
    this.destroyRef.onDestroy(() => {
      this.cleanupWorkflow();
    });
  }
  
  private cleanupWorkflow(): void {
    // Cancel any pending uploads
    if (this.uploading()) {
      // uploadService should provide cancellation method
      this.uploadService.cancelPendingUploads();
    }
    
    // Clear temporary files if any
    const tempFiles = this.fileAttachments();
    if (tempFiles.length > 0 && this.createdContract() === null) {
      // These are temporary files that were uploaded but no contract created
      this.cleanupTemporaryFiles(tempFiles);
    }
  }
  
  private async cleanupTemporaryFiles(files: FileAttachment[]): Promise<void> {
    for (const file of files) {
      try {
        await this.uploadService.deleteFile(file.id);
      } catch (err) {
        console.warn('[Cleanup]', 'Failed to delete temp file', file.id, err);
      }
    }
  }
}
```

---

## 🎯 Priority Improvements

### High Priority (Immediate)
1. ✅ **Parsing Error Recovery** - Add auto-return to upload step on parsing failure
2. ✅ **Contract Creation Retry Limit** - Prevent infinite retry loops

### Medium Priority (Phase 4.3)
3. ⏳ **Network Error Retry** - Auto-retry network failures with exponential backoff
4. ⏳ **Inline File Validation** - Show validation errors near upload component

### Low Priority (Future Enhancement)
5. 📋 **Cleanup on Destroy** - Clean temporary files when navigating away

---

## 🧪 Test Scenarios

### Scenario 1: File Upload Failure
**Steps**:
1. Upload 10MB file (valid size)
2. Simulate network disconnection mid-upload
3. Verify error message displayed
4. Verify user can retry upload
5. Verify no duplicate uploads

**Expected**:
- Clear error: "網路錯誤，請檢查連線"
- Files list cleared for retry
- Auto-retry attempt (up to 3 times)

---

### Scenario 2: Parsing Timeout
**Steps**:
1. Upload file successfully
2. Cloud Function times out (> 60s)
3. Verify error message displayed
4. Verify auto-return to upload step

**Expected**:
- Error: "解析逾時，請重試或使用更清晰的文件"
- Auto-return after 3 seconds
- Clear all uploaded files

---

### Scenario 3: Contract Creation Failure
**Steps**:
1. Complete upload and parsing
2. Edit parsed data
3. Simulate Firestore permission error
4. Click "重試" button
5. Retry fails again (3 times total)

**Expected**:
- Error on first attempt: "建立合約失敗: permission-denied"
- Retry button works (2nd attempt)
- After 3rd failure: "建立失敗次數過多，請返回編輯..."
- Retry button disabled after 3 attempts

---

### Scenario 4: Invalid File Type
**Steps**:
1. Try to upload .docx file
2. Verify rejection
3. Upload valid .pdf file
4. Verify success

**Expected**:
- Toast error: "不支援的檔案格式 (.docx)"
- File not added to list
- Inline error below upload component
- Valid file accepted after error

---

### Scenario 5: Partial Upload Success
**Steps**:
1. Upload 3 files: file1.pdf, file2.jpg (too large), file3.pdf
2. Verify file2 fails but others succeed

**Expected**:
- Warning: "部分檔案上傳失敗: file2.jpg"
- Success: "成功上傳 2 個檔案"
- Workflow continues with 2 files
- Parsing uses only successful files

---

## 📝 Implementation Plan

### Step 1: Add Error Recovery Methods
- `handleParsingError(error)` - Auto-return to upload
- `handleNetworkError(error)` - Retry logic
- `resetWorkflowState()` - Clean state helper

### Step 2: Add Retry Limits
- `contractCreationAttempts` signal
- `MAX_RETRY_ATTEMPTS` constant (3)
- Disable retry button after limit

### Step 3: Add Inline Validation
- `fileValidationErrors` signal
- Update template with nz-alert
- `getValidationErrorsList()` method

### Step 4: Add Cleanup
- `cleanupWorkflow()` method
- `DestroyRef.onDestroy()` registration
- `cleanupTemporaryFiles()` helper

### Step 5: Test All Scenarios
- Manual testing with network simulation
- Error injection in services
- User feedback validation

---

## ✅ Success Criteria

- [ ] All error scenarios handled gracefully
- [ ] User never stuck without recovery path
- [ ] Clear error messages for all failures
- [ ] Auto-recovery where possible (network errors)
- [ ] Manual recovery always available (retry, back navigation)
- [ ] No memory/resource leaks on errors
- [ ] Comprehensive error logging for debugging

---

## 📚 Related Documentation

- #file:contract-creation-wizard.component.ts - Current implementation
- #file:contract-upload.service.ts - Upload error handling
- #file:contract-parsing.service.ts - Parsing error handling
- #file:../../.github/instructions/angular-modern-features.instructions.md - Error handling patterns
