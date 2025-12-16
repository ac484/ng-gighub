# Contract Module (合約管理)

> **模組版本**: 1.0.0  
> **建立日期**: 2025-12-15  
> **狀態**: 基礎架構完成  
> **SETC 任務**: SETC-009

---

## 📋 模組概述

Contract Module 是 GigHub SETC 工作流程的起點（階段零），負責合約的建立、管理與工項追蹤。

### 功能範圍

- ✅ 合約建立與編輯
- ✅ 合約狀態管理（草稿 → 待生效 → 已生效 → 已完成/已終止）
- ✅ 合約工項管理
- ✅ 合約檔案上傳
- 📋 OCR/AI 解析（預留介面，未來實作）

### 與 SETC 工作流程的關係

```
合約上傳（PDF / 圖檔）【手動】
↓
合約建檔（基本資料、業主、承商）【手動】
↓
合約解析（OCR / AI 解析條款、金額、工項）【自動】← 預留
↓
合約確認(確認解析結果或人工補齊)【手動】
↓
合約狀態：待生效
↓
合約生效（⚠️ 僅「已生效合約」可建立任務）【手動】
↓
[進入任務與施工階段...]
```

---

## 🏗️ 目錄結構

```
contract/
├── models/                           # 領域模型
│   ├── contract.model.ts             # Contract, WorkItem, Party 等介面
│   ├── dtos.ts                       # DTOs (Create, Update)
│   └── index.ts                      # 匯出
├── repositories/                     # 資料存取層（SETC-010）
│   └── index.ts
├── services/                         # 業務邏輯層（SETC-011+）
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
  parsedData?: ContractParsedData;
  
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt: Date;
}
```

### ContractStatus (合約狀態)

| 狀態 | 中文 | 說明 |
|------|------|------|
| `draft` | 草稿 | 建立中，可編輯 |
| `pending_activation` | 待生效 | 等待確認 |
| `active` | 已生效 | 可建立任務 |
| `completed` | 已完成 | 所有工項完成 |
| `terminated` | 已終止 | 提前終止 |

### ContractWorkItem (合約工項)

```typescript
interface ContractWorkItem {
  id: string;
  contractId: string;
  code: string;
  name: string;
  description: string;
  category?: string;
  
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  
  linkedTaskIds?: string[];
  
  completedQuantity: number;
  completedAmount: number;
  completionPercentage: number;
  
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🔌 公開 API

### IContractModuleApi

```typescript
interface IContractModuleApi {
  management: IContractManagementApi;  // CRUD 操作
  upload: IContractUploadApi;          // 檔案上傳
  status: IContractStatusApi;          // 狀態管理
  workItems: IContractWorkItemsApi;    // 工項管理
  events: IContractEventApi;           // 事件訂閱
}
```

### 使用範例

```typescript
import { inject } from '@angular/core';
import { ContractModuleApi } from '@core/blueprint/modules/implementations/contract';

export class TaskCreationComponent {
  private contractApi = inject(ContractModuleApi);
  
  async createTaskFromContract(contractId: string): Promise<void> {
    // 驗證合約是否可用於建立任務
    const validation = await this.contractApi.management.validateForTaskCreation(contractId);
    
    if (!validation.valid) {
      console.error('Contract not valid for task creation:', validation.errors);
      return;
    }
    
    // 取得合約工項
    const workItems = await this.contractApi.workItems.list(contractId);
    
    // 建立任務...
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

## 🔧 配置選項

```typescript
interface ContractModuleConfig {
  enableManualCreation: boolean;        // 啟用手動建立
  enableFileUpload: boolean;            // 啟用檔案上傳
  enableWorkItems: boolean;             // 啟用工項管理
  enableOcrParsing: boolean;            // 啟用 OCR 解析（預留）
  enableAiParsing: boolean;             // 啟用 AI 解析（預留）
  
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
| SETC-010 | Repository 層 | 📋 待開始 |
| SETC-011 | Contract Management Service | 📋 待開始 |
| SETC-012 | Contract Upload & Parsing Service | 📋 待開始 |
| SETC-013 | Contract Status & Lifecycle Service | 📋 待開始 |
| SETC-014 | Contract Work Items Management | 📋 待開始 |
| SETC-015 | Contract Event Integration | 📋 待開始 |
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
    match /contracts/{contractId} {
      // Only authenticated users can read
      allow read: if request.auth != null;
      
      // Only authorized users can write
      allow write: if request.auth != null 
        && hasPermission('contract.write');
    }
    
    // Work items as subcollection
    match /contracts/{contractId}/workItems/{workItemId} {
      allow read, write: if request.auth != null
        && hasPermission('workitem.write');
    }
  }
}
```

---

**文件維護**: GigHub Development Team  
**最後更新**: 2025-12-15
