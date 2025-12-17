# Contract Module (合約管理)

> **模組版本**: 1.1.0  
> **建立日期**: 2025-12-15  
> **最後更新**: 2025-12-16  
> **狀態**: 功能開發中  
> **SETC 任務**: SETC-009

---

## 📋 模組概述

Contract Module 是 GigHub SETC 工作流程的起點（階段零），負責合約的建立、管理與工項追蹤。

### 功能範圍

- ✅ 合約建立與編輯
- ✅ 合約狀態管理（草稿 → 待生效 → 已生效 → 已完成/已終止）
- ✅ 合約工項管理
- ✅ 合約檔案上傳
- ✅ OCR/AI 解析功能（透過 Firebase Cloud Functions）
- ✅ 解析結果確認與修正
- ✅ 事件驅動架構整合

### 與 SETC 工作流程的關係

```
1. 合約上傳（PDF / 圖檔）【手動】
   ↓
2. 合約建檔（基本資料、業主、承商）【手動】
   ↓
3. 合約解析（OCR / AI 解析條款、金額、工項）【自動】← 已實作
   ↓
4. 合約確認(確認解析結果或人工補齊)【手動】← 已實作
   ↓
5. 合約狀態：待生效
   ↓
6. 合約生效（⚠️ 僅「已生效合約」可建立任務）【手動】
   ↓
[進入任務與施工階段...]
```

---

## 🏗️ 目錄結構

```
contract/
├── models/                           # 領域模型
│   ├── contract.model.ts             # Contract, WorkItem, Party, ParsedData 等介面
│   ├── dtos.ts                       # DTOs (Create, Update, Parsing)
│   └── index.ts                      # 匯出
├── repositories/                     # 資料存取層（SETC-010）
│   ├── contract.repository.ts
│   ├── work-item.repository.ts
│   └── index.ts
├── services/                         # 業務邏輯層（SETC-011+）
│   ├── contract-management.service.ts    # CRUD 管理
│   ├── contract-creation.service.ts      # 合約建立
│   ├── contract-status.service.ts        # 狀態管理
│   ├── contract-lifecycle.service.ts     # 生命週期管理
│   ├── contract-work-items.service.ts    # 工項管理
│   ├── contract-upload.service.ts        # 檔案上傳
│   ├── contract-parsing.service.ts       # OCR/AI 解析 ← 新增
│   ├── contract-event.service.ts         # 事件服務
│   └── index.ts
├── config/                           # 模組配置
│   ├── contract.config.ts
│   └── index.ts
├── exports/                          # 公開 API
│   ├── contract-api.interface.ts
│   └── index.ts
├── contract.module.ts                # Angular 模組
├── module.metadata.ts                # 模組元資料
├── index.ts                          # 主匯出
└── README.md                         # 本文檔
```

---

## 📊 資料模型

### Contract (合約)

```typescript
interface Contract {
  id: string;
  blueprintId: string;
  contractNumber: string;
  title: string;
  description?: string;
  
  owner: ContractParty;       // 業主
  contractor: ContractParty;  // 承商
  
  totalAmount: number;
  currency: string;
  
  workItems: ContractWorkItem[];
  terms?: ContractTerm[];
  
  status: ContractStatus;
  
  signedDate?: Date;
  startDate: Date;
  endDate: Date;
  
  originalFiles: FileAttachment[];
  parsedData?: ContractParsedData;  // 解析資料
  
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt: Date;
}
```

### ContractParsedData (解析資料)

```typescript
interface ContractParsedData {
  parsingEngine: 'ocr' | 'ai' | 'manual';
  parsedAt: Date;
  confidence: number;  // 0-1
  extractedData: {
    contractNumber?: string;
    contractTitle?: string;
    totalAmount?: number;
    currency?: string;
    parties?: Array<Partial<ContractParty>>;
    workItems?: Array<Partial<ContractWorkItem>>;
    terms?: Array<Partial<ContractTerm>>;
    startDate?: string;
    endDate?: string;
  };
  needsVerification: boolean;
  verificationStatus?: 'pending' | 'confirmed' | 'modified';
  verifiedBy?: string;
  verifiedAt?: Date;
}
```

### ContractParsingStatus (解析狀態)

| 狀態 | 中文 | 說明 |
|------|------|------|
| `pending` | 等待解析 | 解析請求已建立 |
| `processing` | 解析中 | 正在處理 |
| `completed` | 解析完成 | 成功完成 |
| `failed` | 解析失敗 | 處理失敗 |
| `skipped` | 跳過解析 | 手動建檔 |

### ContractStatus (合約狀態)

| 狀態 | 中文 | 說明 |
|------|------|------|
| `draft` | 草稿 | 建立中，可編輯 |
| `pending_activation` | 待生效 | 等待確認 |
| `active` | 已生效 | 可建立任務 |
| `completed` | 已完成 | 所有工項完成 |
| `terminated` | 已終止 | 提前終止 |

---

## 🔌 公開 API

### IContractModuleApi

```typescript
interface IContractModuleApi {
  management: IContractManagementApi;  // CRUD 操作
  upload: IContractUploadApi;          // 檔案上傳
  parsing: IContractParsingApi;        // OCR/AI 解析 ← 新增
  status: IContractStatusApi;          // 狀態管理
  workItems: IContractWorkItemsApi;    // 工項管理
  events: IContractEventApi;           // 事件訂閱
}
```

### 解析服務使用範例

```typescript
import { inject } from '@angular/core';
import { ContractParsingService } from '@core/blueprint/modules/implementations/contract';

export class ContractUploadComponent {
  private parsingService = inject(ContractParsingService);
  
  // 請求解析
  async requestParsing(
    blueprintId: string, 
    contractId: string, 
    fileIds: string[]
  ): Promise<void> {
    const requestId = await this.parsingService.requestParsing({
      blueprintId,
      contractId,
      fileIds,
      requestedBy: this.currentUserId
    });
    
    console.log('Parsing request created:', requestId);
  }
  
  // 確認解析結果
  async confirmParsedData(
    blueprintId: string, 
    contractId: string
  ): Promise<void> {
    await this.parsingService.confirmParsedData({
      blueprintId,
      contractId,
      confirmationType: 'confirmed',
      confirmedBy: this.currentUserId
    });
  }
}
```

---

## 📡 事件類型

所有事件以 `contract.` 為前綴:

| 事件 | 說明 |
|------|------|
| `contract.created` | 合約已建立 |
| `contract.updated` | 合約已更新 |
| `contract.deleted` | 合約已刪除 |
| `contract.activated` | 合約已生效 |
| `contract.completed` | 合約已完成 |
| `contract.terminated` | 合約已終止 |
| `contract.status_changed` | 合約狀態變更 |
| `contract.file_uploaded` | 合約檔案已上傳 |
| `contract.file_removed` | 合約檔案已移除 |
| `contract.parsing.requested` | 解析已請求 ← 新增 |
| `contract.parsing.started` | 解析已開始 ← 新增 |
| `contract.parsing.completed` | 解析已完成 ← 新增 |
| `contract.parsing.failed` | 解析失敗 ← 新增 |
| `contract.parsing.confirmed` | 解析資料已確認 ← 新增 |
| `contract.work_item_added` | 工項已新增 |
| `contract.work_item_updated` | 工項已更新 |
| `contract.work_item_deleted` | 工項已刪除 |
| `contract.work_item_progress_updated` | 工項進度已更新 |
| `contract.work_item_task_linked` | 工項已連結任務 |
| `contract.work_item_task_unlinked` | 工項已解除連結任務 |

---

## 🔄 狀態轉換規則

```
draft → pending_activation → active → completed
  ↓           ↓               ↓
  └──────────────────────────→ terminated
```

**有效轉換**:
- `draft` → `pending_activation`, `terminated`
- `pending_activation` → `active`, `draft`, `terminated`
- `active` → `completed`, `terminated`
- `completed` → (終態)
- `terminated` → (終態)

---

## 🤖 OCR/AI 解析功能

### 架構

```
前端 (Angular)                     後端 (Firebase)
───────────────                    ─────────────────
ContractUploadService              Cloud Storage
        ↓                                ↓
ContractParsingService  ──────→  parseContractDocument
        ↓                          (Cloud Function)
ContractEventService                     ↓
        ↓                          Vision AI / Gemini
BlueprintEventBus                        ↓
                                   Firestore Update
```

### Cloud Function: parseContractDocument

位於 `functions-ai/src/contract-parsing.ts`

- 觸發方式: `httpsCallable`
- 區域: `asia-east1`
- 記憶體: `512MiB`
- 超時: `300` 秒

### 解析流程

1. 前端上傳檔案至 Firebase Storage
2. 呼叫 `ContractParsingService.requestParsing()`
3. 建立解析請求記錄
4. 呼叫 Cloud Function 進行解析
5. 更新合約的 `parsedData` 欄位
6. 發送解析完成事件
7. 使用者確認或修改解析結果

---

## 🔧 配置選項

```typescript
interface ContractModuleConfig {
  enableManualCreation: boolean;        // 啟用手動建立
  enableFileUpload: boolean;            // 啟用檔案上傳
  enableWorkItems: boolean;             // 啟用工項管理
  enableOcrParsing: boolean;            // 啟用 OCR 解析
  enableAiParsing: boolean;             // 啟用 AI 解析
  
  contractNumberPrefix: string;         // 合約編號前綴
  contractNumberLength: number;         // 合約編號長度
  
  defaultCurrency: string;              // 預設幣別
  
  requireSignedDateBeforeActivation: boolean;
  requireWorkItemsBeforeActivation: boolean;
  
  notifyOnContractCreated: boolean;
  notifyOnContractActivated: boolean;
  notifyOnContractCompleted: boolean;
  notifyOnContractTerminated: boolean;
}
```

---

## 📋 SETC 任務追蹤

| 任務 | 描述 | 狀態 |
|------|------|------|
| SETC-009 | 模組基礎設定 | ✅ 完成 |
| SETC-010 | Repository 層 | ✅ 完成 |
| SETC-011 | Contract Management Service | ✅ 完成 |
| SETC-012 | Contract Upload & Parsing Service | ✅ 完成 |
| SETC-013 | Contract Status & Lifecycle Service | ✅ 完成 |
| SETC-014 | Contract Work Items Management | ✅ 完成 |
| SETC-015 | Contract Event Integration | ✅ 完成 |
| SETC-016 | Contract UI Components | 📋 待開始 |
| SETC-017 | Contract Testing & Integration | 📋 待開始 |

---

## 📚 相關文檔

- [SETC.md](../../../../../../../docs/discussions/SETC.md) - SETC 工作流程定義
- [SETC-009](../../../../../../../docs/discussions/SETC-009-contract-module-foundation.md) - 詳細任務文檔
- [Issue Module](../issue/README.md) - 參考實作

---

## 🔒 安全性考量

### Firestore Security Rules

合約資料需要實作適當的安全規則（SETC-010）：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /blueprints/{blueprintId}/contracts/{contractId} {
      // Only authenticated users with blueprint access can read
      allow read: if request.auth != null 
        && canReadBlueprint(blueprintId);
      
      // Only authorized users can write
      allow write: if request.auth != null 
        && canEditBlueprint(blueprintId);
        
      // Parsing requests subcollection
      match /parsingRequests/{requestId} {
        allow read, write: if request.auth != null
          && canEditBlueprint(blueprintId);
      }
    }
    
    // Work items as subcollection
    match /blueprints/{blueprintId}/contracts/{contractId}/workItems/{workItemId} {
      allow read, write: if request.auth != null
        && canEditBlueprint(blueprintId);
    }
  }
}
```

---

**文件維護**: GigHub Development Team  
**最後更新**: 2025-12-16
