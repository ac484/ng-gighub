# SETC-012: Contract Upload & Parsing Service

> **任務 ID**: SETC-012  
> **任務名稱**: Contract Upload & Parsing Service  
> **優先級**: P0 (Critical)  
> **預估工時**: 3 天  
> **依賴**: SETC-011  
> **狀態**: ✅ 已完成 (OCR/AI 介面預留)

---

## 📋 任務定義

### 名稱
Contract Upload & Parsing Service - 檔案上傳與解析服務

### 背景 / 目的
實作合約檔案上傳功能，支援 PDF 與圖檔格式。OCR/AI 解析功能介面預留，第一版不實作（YAGNI 原則）。

### 需求說明
1. 實作 ContractUploadService 類別
2. 整合 Firebase Storage 檔案上傳
3. 實作檔案驗證（類型、大小）
4. 實作檔案預覽功能
5. 預留 OCR/AI 解析介面（不實作）

### In Scope / Out of Scope

#### ✅ In Scope
- 檔案上傳功能
- Firebase Storage 整合
- 檔案類型驗證
- 檔案大小限制
- 檔案預覽 URL 生成
- 上傳進度追蹤

#### ❌ Out of Scope
- OCR 解析（介面預留，實作延後）
- AI 智能解析（介面預留，實作延後）
- 檔案批次上傳
- 檔案編輯功能

### 功能行為
用戶可上傳合約 PDF 或圖檔，系統驗證檔案並上傳至 Firebase Storage，生成可存取的檔案 URL。

### 資料 / API

#### Service 介面
```typescript
@Injectable({ providedIn: 'root' })
export class ContractUploadService {
  // File Upload
  uploadContractFile(contractId: string, file: File): Promise<FileAttachment>;
  uploadMultipleFiles(contractId: string, files: File[]): Promise<FileAttachment[]>;
  
  // File Validation
  validateFile(file: File): ValidationResult;
  getAcceptedFileTypes(): string[];
  getMaxFileSize(): number;
  
  // File Management
  deleteFile(contractId: string, fileId: string): Promise<void>;
  getFileUrl(fileId: string): Promise<string>;
  
  // Upload Progress
  uploadWithProgress(file: File): Observable<UploadProgress>;
  
  // Parsing (Interface only - not implemented in v1)
  triggerParsing(contractId: string, fileId: string): Promise<void>;
  confirmParsedData(contractId: string, data: ContractParsedData): Promise<void>;
}
```

#### Firebase Storage 結構
```
/contracts/
  /{blueprintId}/
    /{contractId}/
      /original/
        /{fileId}.pdf
        /{fileId}.jpg
      /thumbnails/  # Future
        /{fileId}_thumb.jpg
```

#### 檔案驗證規則
- 允許格式: PDF, JPG, JPEG, PNG
- 最大檔案大小: 10MB
- 檔案名稱規範: 只允許英數字與 `-_`

### 影響範圍
- **新增 Service**: ContractUploadService
- **Firebase Storage**: 設定 Storage Rules
- **Storage Rules**: 檔案存取權限控制

### 驗收條件
- [ ] 檔案上傳功能完成
- [ ] Firebase Storage 整合完成
- [ ] 檔案驗證完整
- [ ] 上傳進度追蹤實作
- [ ] Storage Rules 部署完成
- [ ] 單元測試覆蓋率 > 80%

---

## 🔍 分析階段

### 步驟 1: 查詢官方文件 (Context7)

#### Firebase Storage
**查詢庫**: `/websites/firebase_google`  
**主題**: storage, security-rules, file-upload

**關鍵發現**:
- ✅ 使用 Firebase Storage SDK
- ✅ 使用 `uploadBytesResumable()` 追蹤進度
- ✅ 實作 Storage Security Rules
- ✅ 生成 Download URLs

#### Angular File Upload
**查詢庫**: `/websites/angular_dev_v20`  
**主題**: file-upload, reactive-forms

**關鍵發現**:
- ✅ 使用 `<input type="file">` 與 FormData
- ✅ 使用 Observable 處理上傳進度
- ✅ 使用 Signals 管理上傳狀態

### 步驟 2: 循序思考分析 (Sequential Thinking)

#### 架構決策

**問題 1**: 檔案應該存儲在哪裡？
- **決策**: Firebase Storage
- **理由**: 
  - 原生支援 Angular Fire
  - 內建 Security Rules
  - CDN 加速存取
  - 自動生成 Download URLs

**問題 2**: 如何處理大檔案上傳？
- **決策**: 使用 `uploadBytesResumable()` 並追蹤進度
- **理由**:
  - 提供上傳進度回饋
  - 支援暫停/恢復
  - 錯誤處理更好

**問題 3**: OCR/AI 解析功能如何處理？
- **決策**: 第一版不實作，保留介面
- **理由**:
  - 符合 YAGNI 原則
  - 避免過度設計
  - 專注核心功能
  - 未來可擴展

### 步驟 3: 制定開發計畫 (Software Planning Tool)

#### 實施計畫

**Phase 1: Firebase Storage 整合** (4 小時)
- 設定 Firebase Storage
- 實作基礎上傳方法
- 實作檔案驗證

**Phase 2: 進度追蹤** (3 小時)
- 實作上傳進度 Observable
- 實作取消上傳功能

**Phase 3: Storage Rules** (2 小時)
- 撰寫 Storage Security Rules
- 測試規則
- 部署規則

**Phase 4: 測試** (5 小時)
- 單元測試
- 整合測試
- 錯誤處理測試

---

## 📐 規劃階段

### 實施步驟

#### Phase 1: Firebase Storage 整合 (4 小時)
- [ ] 設定 Firebase Storage 連接
- [ ] 實作 uploadContractFile()
- [ ] 實作 uploadMultipleFiles()
- [ ] 實作檔案驗證邏輯
- [ ] 實作 deleteFile()

#### Phase 2: 進度追蹤 (3 小時)
- [ ] 實作 uploadWithProgress()
- [ ] 實作上傳取消功能
- [ ] 實作錯誤處理

#### Phase 3: Storage Rules (2 小時)
- [ ] 撰寫 Storage Security Rules
- [ ] 測試檔案上傳權限
- [ ] 測試檔案讀取權限
- [ ] 部署 Rules

#### Phase 4: 介面預留 (1 小時)
- [ ] 定義 triggerParsing() 介面
- [ ] 定義 confirmParsedData() 介面
- [ ] 新增 "Not Implemented" 提示

#### Phase 5: 測試 (5 小時)
- [ ] 測試檔案上傳
- [ ] 測試檔案驗證
- [ ] 測試進度追蹤
- [ ] 測試錯誤處理
- [ ] 整合測試

### 檔案清單

#### 新增檔案
```
src/app/core/blueprint/modules/implementations/contract/
├── services/
│   ├── contract-upload.service.ts
│   ├── contract-upload.service.spec.ts
│   ├── file-validator.ts
│   └── file-validator.spec.ts
storage.rules (更新)
```

---

## 📜 開發規範

### 規範檢查清單

#### ⭐ 必須使用工具
- [x] Context7 - 已查詢 Firebase Storage 文檔
- [x] Sequential Thinking - 已完成架構決策分析
- [x] Software Planning Tool - 已制定實施計畫

#### 奧卡姆剃刀原則
- [x] YAGNI - OCR/AI 解析第一版不實作
- [x] MVP - 專注檔案上傳核心功能
- [x] KISS - 保持上傳邏輯簡單

---

## ✅ 檢查清單

### 📋 程式碼審查檢查點
- [ ] 檔案上傳功能完整
- [ ] 檔案驗證完整
- [ ] 進度追蹤實作
- [ ] Storage Rules 正確
- [ ] 測試覆蓋率 > 80%

---

**文件版本**: 1.0.0  
**最後更新**: 2025-12-15  
**下一步**: SETC-013 Contract Status & Lifecycle Service
