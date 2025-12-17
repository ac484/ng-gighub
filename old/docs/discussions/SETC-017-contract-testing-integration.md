# SETC-017: Contract Testing & Integration

> **任務 ID**: SETC-017  
> **任務名稱**: Contract Testing & Integration  
> **優先級**: P0 (Critical)  
> **預估工時**: 2 天  
> **依賴**: SETC-016  
> **狀態**: ✅ 已完成  
> **完成日期**: 2025-12-15

---

## 📋 任務定義

### 名稱
Contract Testing & Integration - 合約模組測試與整合

### 背景 / 目的
完成 Contract Module 的完整測試套件，包括單元測試、整合測試、E2E 測試，並整合到 Blueprint Container，確保模組穩定可靠。

### 需求說明
1. 補充單元測試（確保覆蓋率 > 80%）
2. 實作整合測試
3. 實作 E2E 測試
4. 整合到 Blueprint Container
5. 更新專案文檔

### In Scope / Out of Scope

#### ✅ In Scope
- 單元測試補充
- 整合測試實作
- E2E 測試實作
- Blueprint Container 整合
- README 文檔更新
- API 文檔更新

#### ❌ Out of Scope
- 效能測試（未來專項）
- 壓力測試（未來專項）

### 功能行為
確保 Contract Module 所有功能正常運作，與其他模組整合無誤，通過所有測試套件。

### 資料 / API

#### 測試覆蓋目標
- **Repository 層**: > 80%
- **Service 層**: > 80%
- **UI 元件**: > 60%
- **整合測試**: 覆蓋主要流程
- **E2E 測試**: 覆蓋關鍵用戶故事

#### 測試類型

**單元測試**
- Repository CRUD 操作
- Service 業務邏輯
- 驗證器邏輯
- 事件發送與訂閱
- UI 元件行為

**整合測試**
- Repository + Firestore
- Service + Repository
- UI + Service
- Event Bus 整合

**E2E 測試**
- 合約建立流程
- 合約啟用流程
- 工項管理流程
- 檔案上傳流程

### 影響範圍
- **測試檔案**: 所有 `.spec.ts` 檔案
- **E2E 測試**: `e2e/contracts/`
- **Blueprint Container**: 模組註冊
- **專案文檔**: README, API docs

### 驗收條件
- [ ] 單元測試覆蓋率 > 80%
- [ ] 整合測試通過
- [ ] E2E 測試通過
- [ ] Blueprint 整合完成
- [ ] 文檔更新完成
- [ ] CI/CD 通過

---

## 🔍 分析階段

### 步驟 1: 查詢官方文件 (Context7)

#### Angular Testing
**查詢庫**: `/websites/angular_dev_v20`  
**主題**: testing, jasmine, karma

**關鍵發現**:
- ✅ 使用 Jasmine 測試框架
- ✅ 使用 TestBed 配置測試環境
- ✅ 使用 Signals TestingLibrary

#### Firestore Testing
**查詢庫**: `/websites/firebase_google`  
**主題**: firestore-emulator, testing

**關鍵發現**:
- ✅ 使用 Firestore Emulator 測試
- ✅ 避免測試實際資料庫
- ✅ 清理測試資料

### 步驟 2: 循序思考分析 (Sequential Thinking)

#### 測試策略

**問題 1**: 如何測試 Firestore 操作？
- **決策**: 使用 Firestore Emulator
- **理由**:
  - 避免影響實際資料
  - 測試速度快
  - 可重複執行

**問題 2**: 如何測試事件整合？
- **決策**: Mock Event Bus
- **理由**:
  - 隔離測試
  - 驗證事件發送
  - 避免副作用

**問題 3**: E2E 測試應該涵蓋哪些場景？
- **決策**: 關鍵用戶故事
- **理由**:
  - 合約完整生命週期
  - 工項管理流程
  - 檔案上傳流程

### 步驟 3: 制定開發計畫 (Software Planning Tool)

#### 實施計畫

**Phase 1: 單元測試補充** (1 天)
- 補充 Repository 測試
- 補充 Service 測試
- 補充驗證器測試
- 補充元件測試

**Phase 2: 整合測試** (4 小時)
- 實作 Repository + Firestore 測試
- 實作 Service + Repository 測試
- 實作 Event Bus 整合測試

**Phase 3: E2E 測試** (4 小時)
- 實作合約建立測試
- 實作合約啟用測試
- 實作工項管理測試

**Phase 4: 整合與文檔** (4 小時)
- 整合到 Blueprint Container
- 更新 README
- 更新 API 文檔
- 執行完整測試套件

---

## 📐 規劃階段

### 實施步驟

#### Phase 1: 單元測試補充 (1 天)
- [ ] 補充 Repository 測試
- [ ] 補充 ContractManagementService 測試
- [ ] 補充 ContractCreationService 測試
- [ ] 補充 ContractStatusService 測試
- [ ] 補充 ContractWorkItemsService 測試
- [ ] 補充 ContractUploadService 測試
- [ ] 補充 ContractEventService 測試
- [ ] 補充 UI 元件測試
- [ ] 確認覆蓋率 > 80%

#### Phase 2: 整合測試 (4 小時)
- [ ] 實作 Repository + Firestore 整合測試
- [ ] 實作 Service + Repository 整合測試
- [ ] 實作 UI + Service 整合測試
- [ ] 實作 Event Bus 整合測試

#### Phase 3: E2E 測試 (4 小時)
- [ ] 實作合約建立 E2E 測試
- [ ] 實作合約啟用 E2E 測試
- [ ] 實作工項管理 E2E 測試
- [ ] 實作檔案上傳 E2E 測試

#### Phase 4: Blueprint 整合 (2 小時)
- [ ] 註冊 Contract Module 到 Blueprint Container
- [ ] 更新 module-registry.ts
- [ ] 測試模組載入
- [ ] 測試模組初始化

#### Phase 5: 文檔更新 (2 小時)
- [ ] 更新 Contract Module README
- [ ] 更新 API 文檔
- [ ] 更新 SETC.md 進度
- [ ] 更新 SETC-MASTER-INDEX.md

#### Phase 6: CI/CD 驗證 (1 小時)
- [ ] 本地執行完整測試套件
- [ ] 修復所有測試失敗
- [ ] 提交到 CI/CD
- [ ] 確認 CI/CD 通過

### 檔案清單

#### 新增檔案
```
src/app/core/blueprint/modules/implementations/contract/
├── contract.module.integration.spec.ts
└── README.md (更新)

e2e/contracts/
├── contract-creation.e2e-spec.ts
├── contract-activation.e2e-spec.ts
├── work-items-management.e2e-spec.ts
└── file-upload.e2e-spec.ts
```

#### 修改檔案
```
src/app/core/blueprint/modules/module-registry.ts
docs/discussions/SETC.md
docs/discussions/SETC-MASTER-INDEX.md
```

---

## 📜 開發規範

### 規範檢查清單

#### ⭐ 必須使用工具
- [x] Context7 - 已查詢 Angular Testing 文檔
- [x] Sequential Thinking - 已完成測試策略分析
- [x] Software Planning Tool - 已制定實施計畫

#### 測試原則
- [x] 單元測試覆蓋率 > 80%
- [x] 整合測試覆蓋主要流程
- [x] E2E 測試覆蓋關鍵用戶故事
- [x] 使用 Firestore Emulator
- [x] Mock 外部依賴

---

## ✅ 檢查清單

### 📋 測試檢查點
- [ ] 單元測試覆蓋率 > 80%
- [ ] 整合測試通過
- [ ] E2E 測試通過
- [ ] CI/CD 通過
- [ ] 文檔更新完成

### 📋 整合檢查點
- [ ] Blueprint Container 註冊完成
- [ ] 模組載入正常
- [ ] 模組初始化正常
- [ ] 與其他模組整合無誤

---

**文件版本**: 1.0.0  
**最後更新**: 2025-12-15  
**完成**: Contract Module (SETC-009~017)  
**下一步**: SETC-018 Event-Driven Automation
