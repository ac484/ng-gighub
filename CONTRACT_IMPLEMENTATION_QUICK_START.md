# Contract Module Implementation - Quick Start Guide

> 快速上手指南：合約模組檔案上傳與 AI 解析實作

## 🚀 5 分鐘快速理解

### 問題
- ❌ 合約無法載入 (Facade 初始化錯誤)
- ❌ 上傳功能不完整 (無 Cloud Function 整合)
- ❌ 預覽按鈕無作用
- ❌ AI 解析按鈕無作用

### 解決方案
1. **Phase 1** (3h): 修復 Facade → 合約可載入 ✅
2. **Phase 2** (14h): 完成上傳 + 預覽 ✅
3. **Phase 3** (15h): 實作 AI 解析 ✅
4. **Phase 4** (5h): 架構優化 ✅

**總時程: 1 週 (37 小時)**

---

## 📋 快速檢查清單

### 開始前確認
- [ ] 閱讀 `TECHNICAL_DEBT_REMEDIATION_PLAN.md`
- [ ] 確認 functions-storage 已部署
- [ ] 確認 functions-ai-document 已部署
- [ ] 確認有 Firebase 專案存取權限
- [ ] 本地環境可執行 `yarn start`

### Phase 1: 緊急修復 (3h)
- [ ] 修改 `contract-module-view-refactored.component.ts`
  - 在 `ngOnInit()` 先呼叫 `facade.initialize(blueprintId())`
- [ ] 修改 `contract.facade.ts`
  - 添加 `ensureInitialized()` guard
  - 添加 `_initialized` signal
- [ ] 測試合約列表可載入

### Phase 2a: 上傳整合 (8h)
- [ ] 修改 `contract-upload.service.ts`
  - 更新路徑: `contracts/{blueprintId}/{contractId}/originals/`
  - 添加 metadata tagging
- [ ] 建立 `contract-file-processor.service.ts`
  - Firestore listener for processing results
- [ ] 更新 `contract-upload-step.component.ts`
  - 顯示上傳 → 處理 → 完成狀態
- [ ] 測試上傳觸發 Cloud Function

### Phase 2b: 預覽功能 (6h)
- [ ] 建立 `features/preview/contract-preview-modal.component.ts`
  - Google Docs Viewer iframe
  - 支援 PDF 和圖片
- [ ] 修改 `contract-module-view-refactored.component.ts`
  - 添加 `handlePreviewContract()` method
- [ ] 測試點擊預覽顯示 modal

### Phase 3: AI 解析 (15h)
- [ ] 更新 `models/parsed-contract-data.model.ts`
  - 完整的 ParsedContractData interface
- [ ] 實作 `services/contract-ai-parser.service.ts`
  - 呼叫 functions-ai-document
  - 轉換 Document AI 輸出
- [ ] 建立 `features/parsing/contract-parsing-result-modal.component.ts`
  - 顯示可編輯表單
  - 信心分數進度條
- [ ] 修改 `contract-module-view-refactored.component.ts`
  - 添加 `handleParseContract()` method
- [ ] 測試 AI 解析流程

### Phase 4: 架構優化 (5h)
- [ ] 建立 `repositories/contract.repository.ts`
  - Firestore CRUD operations
- [ ] 重構 `services/contract.service.ts`
  - 使用 Repository
- [ ] 清理冗餘程式碼
- [ ] 更新文檔

---

## 💻 關鍵程式碼範例

### 1. Facade 初始化修復
```typescript
// contract-module-view-refactored.component.ts
ngOnInit(): void {
  // ✅ MUST call initialize first
  this.facade.initialize(this.blueprintId());
  this.loadContracts();
}
```

### 2. 上傳 Metadata Tagging
```typescript
// contract-upload.service.ts
const metadata = {
  customMetadata: {
    blueprintId: blueprintId,
    contractId: contractId,
    fileCategory: 'contract-original',
    requiresProcessing: 'true'
  }
};
await uploadBytesResumable(storageRef, file, { customMetadata: metadata });
```

### 3. 預覽 Modal
```typescript
// contract-preview-modal.component.ts
viewerUrl = computed(() => {
  const url = this.fileUrl();
  if (!url) return null;
  return this.sanitizer.bypassSecurityTrustResourceUrl(
    `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
  );
});
```

### 4. AI 解析呼叫
```typescript
// contract-ai-parser.service.ts
const parseFunction = httpsCallable(this.functions, 'processDocumentFromStorage');
const result = await parseFunction({
  gcsUri: this.convertToGcsUri(fileUrl),
  mimeType: 'application/pdf'
});
```

---

## 🧪 測試腳本

### Phase 1 測試
```bash
# 啟動開發伺服器
yarn start

# 開啟瀏覽器
# 1. 登入系統
# 2. 進入任一 Blueprint
# 3. 切換到「合約域」Tab
# 4. 確認合約列表正常載入
# 5. 檢查控制台無錯誤
```

### Phase 2 測試
```bash
# 測試上傳
# 1. 點擊「新增合約」
# 2. 上傳 PDF 檔案
# 3. 確認 Cloud Function 被觸發 (檢查 Firebase Console)
# 4. 確認 Firestore 有檔案 metadata

# 測試預覽
# 1. 在合約列表找到有檔案的合約
# 2. 點擊「預覽」圖示
# 3. 確認 modal 開啟
# 4. 確認 Google Docs Viewer 載入 PDF
```

### Phase 3 測試
```bash
# 測試 AI 解析
# 1. 找到有檔案但未解析的合約
# 2. 點擊「解析」圖示
# 3. 等待處理 (約 5-10 秒)
# 4. 確認解析結果 modal 顯示
# 5. 檢查提取的資料是否正確
# 6. 編輯資料並接受
# 7. 確認合約資料已更新
```

---

## ⚠️ 常見問題

### Q1: Cloud Function 沒有被觸發？
**A:** 檢查檔案路徑是否正確
- ✅ 正確: `contracts/{blueprintId}/{contractId}/originals/filename.pdf`
- ❌ 錯誤: `contracts/{blueprintId}/{contractId}/filename.pdf`

### Q2: 預覽 modal 顯示空白？
**A:** 檢查以下項目:
1. File URL 是否有效
2. Firebase Storage CORS 設定
3. 瀏覽器控制台錯誤訊息
4. 檔案類型是否支援

### Q3: AI 解析失敗？
**A:** 可能原因:
1. functions-ai-document 未部署
2. Document AI processor 未設定
3. GCS URI 轉換錯誤
4. 檔案格式不支援

### Q4: Firestore 權限錯誤？
**A:** 確認 Security Rules:
```javascript
match /blueprints/{blueprintId}/contracts/{contractId} {
  allow read, write: if request.auth != null 
                     && isBlueprintMember(blueprintId);
}
```

---

## 📚 參考文件

| 文件 | 用途 |
|------|------|
| `TECHNICAL_DEBT_REMEDIATION_PLAN.md` | 完整技術細節 |
| `CONTRACT_MODULE_IMPLEMENTATION_SUMMARY.md` | 中文摘要 (給利害關係人) |
| `functions-storage/README.md` | Cloud Function 說明 |
| `functions-ai-document/README.md` | AI 解析說明 |
| `src/app/routes/blueprint/modules/contract/README.md` | 合約模組架構 |

---

## 🆘 需要協助？

1. **技術問題**: 查看 `TECHNICAL_DEBT_REMEDIATION_PLAN.md` 詳細說明
2. **架構問題**: 參考 `.github/instructions/ng-gighub-architecture.instructions.md`
3. **API 問題**: 使用 Context7 查詢官方文檔
4. **部署問題**: 檢查 Firebase Console 的 Functions 和 Storage 設定

---

**文檔版本**: 1.0  
**最後更新**: 2025-12-19  
**預計完成**: 1 週 (37 工時)
