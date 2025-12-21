# SETC-000-04: Contract Module (合約管理模組)

> **模組 ID**: `contract`  
> **版本**: 1.0.0  
> **狀態**: ✅ 已實作 (基礎架構)  
> **優先級**: P0 (核心)  
> **架構**: Blueprint Container Module  
> **歸檔日期**: 2025-12-16

---

## 📋 模組概述

Contract Module 是 GigHub SETC 工作流程的起點（階段零），負責合約的建立、管理與工項追蹤。

### 業務範圍

- ✅ 合約建立與編輯
- ✅ 合約狀態管理（草稿 → 待生效 → 已生效 → 已完成/已終止）
- ✅ 合約工項管理
- ✅ 合約檔案上傳
- 📋 OCR/AI 解析（預留介面，未來實作）

### SETC 工作流程中的角色

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

### 核心特性

- ✅ **合約生命週期**: 完整的合約狀態管理
- ✅ **工項管理**: 合約工項與任務關聯
- ✅ **檔案管理**: 合約文件上傳與版本控制
- ✅ **業主承商管理**: 合約參與方資訊管理
- ✅ **金額追蹤**: 合約總額與工項金額追蹤
- ✅ **零耦合設計**: 透過 Event Bus 與其他模組通訊
- ✅ **完整生命週期管理**: 實作 IBlueprintModule 介面

---

## 🏗️ 架構設計

### 目錄結構

```
contract/
├── models/                           # 領域模型
│   ├── contract.model.ts             # Contract, WorkItem, Party 等介面
│   ├── dtos.ts                       # DTOs (Create, Update)
│   └── index.ts                      # 匯出
├── repositories/                     # 資料存取層
│   ├── contract.repository.ts
│   └── index.ts
├── services/                         # 業務邏輯層
│   ├── contract-management.service.ts
│   ├── contract-upload.service.ts
│   ├── contract-parsing.service.ts
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

### ContractParty (合約參與方)

```typescript
interface ContractParty {
  id: string;
  name: string;
  type: PartyType;           // 'owner' | 'contractor' | 'subcontractor'
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  taxId?: string;
}
```

---

## 📦 子模組 (Sub-Modules)

### 1️⃣ Contract Management Sub-Module (合約管理)

**職責**: 合約 CRUD 操作與狀態管理

**核心功能**:
- 建立合約
- 編輯合約資訊
- 查詢合約列表
- 合約狀態流轉
- 合約結案

### 2️⃣ Contract Upload & Parsing Sub-Module (上傳與解析)

**職責**: 合約檔案上傳與智能解析

**核心功能**:
- 檔案上傳與儲存
- OCR 文字辨識 (預留)
- AI 條款解析 (預留)
- 工項自動提取 (預留)
- 解析結果確認

### 3️⃣ Work Item Management Sub-Module (工項管理)

**職責**: 合約工項管理與任務關聯

**核心功能**:
- 工項建立與編輯
- 工項與任務關聯
- 工項進度追蹤
- 工項完成統計

---

## 🔌 公開 API

### IContractModuleApi

```typescript
interface IContractModuleApi {
  management: IContractManagementApi;  // CRUD 操作
  upload: IContractUploadApi;          // 上傳與解析
  workItems: IWorkItemApi;             // 工項管理
}
```

### IContractManagementApi

```typescript
interface IContractManagementApi {
  create(contract: CreateContractDto): Promise<Contract>;
  update(id: string, contract: UpdateContractDto): Promise<Contract>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Contract | undefined>;
  findAll(blueprintId: string): Promise<Contract[]>;
  activate(id: string): Promise<void>;
  complete(id: string): Promise<void>;
  terminate(id: string, reason: string): Promise<void>;
}
```

---

## 📡 事件整合

### 發送事件

```typescript
// 合約建立事件
this.eventBus.emit({
  type: 'contract.created',
  blueprintId: contract.blueprintId,
  timestamp: new Date(),
  actor: userId,
  data: { contractId: contract.id }
});

// 合約生效事件
this.eventBus.emit({
  type: 'contract.activated',
  blueprintId: contract.blueprintId,
  timestamp: new Date(),
  actor: userId,
  data: { contractId: contract.id, totalAmount: contract.totalAmount }
});

// 合約完成事件
this.eventBus.emit({
  type: 'contract.completed',
  blueprintId: contract.blueprintId,
  timestamp: new Date(),
  actor: userId,
  data: { contractId: contract.id }
});
```

---

## 🚀 使用範例

### 1. 建立合約

```typescript
const contract = await this.contractService.create({
  blueprintId: 'bp-123',
  contractNumber: 'C-2025-001',
  title: '辦公大樓新建工程合約',
  owner: {
    name: 'ABC 建設公司',
    type: 'owner',
    contactPerson: '王經理',
    contactPhone: '02-1234-5678'
  },
  contractor: {
    name: 'XYZ 營造',
    type: 'contractor',
    contactPerson: '李經理',
    contactPhone: '02-8765-4321'
  },
  totalAmount: 50000000,
  currency: 'TWD',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2026-12-31'),
  workItems: [
    {
      code: 'W001',
      name: '基礎工程',
      unit: '式',
      quantity: 1,
      unitPrice: 5000000,
      totalPrice: 5000000
    }
  ]
});
```

### 2. 上傳合約文件

```typescript
const file: File = /* ... */;
const uploadResult = await this.contractUploadService.uploadFile({
  contractId: contract.id,
  file: file,
  fileType: 'contract_original'
});
```

### 3. 生效合約

```typescript
await this.contractService.activate(contract.id);
console.log('合約已生效，現在可以建立任務');
```

---

## 🧪 測試

### 單元測試

```bash
# 執行合約模組單元測試
yarn test --include="**/contract/**/*.spec.ts"
```

---

## 📝 待實作功能

1. ⏳ **OCR 解析**: 自動辨識合約文件內容
2. ⏳ **AI 條款解析**: 智能解析合約條款與工項
3. ⏳ **合約範本**: 可重複使用的合約範本
4. ⏳ **合約變更管理**: 追蹤合約變更與版本
5. ⏳ **合約報表**: 合約執行統計報表
6. ⏳ **合約提醒**: 合約到期與里程碑提醒

---

## 🔗 相關模組

- **Task Module**: 任務與工項關聯
- **Finance Module**: 合約金額與付款追蹤
- **Acceptance Module**: 驗收與合約關聯
- **Log Module**: 記錄合約操作

---

## 📚 參考資源

- [合約模組 README](../../src/app/core/blueprint/modules/implementations/contract/README.md)
- [Blueprint Container 架構](../ARCHITECTURE.md)
- [核心開發規範](../discussions/⭐.md)
- [SETC 任務規劃](../discussions/SETC-009-contract-module-foundation.md)

---

**文檔維護**: 2025-12-16  
**維護者**: Architecture Team  
**歸檔原因**: 備查使用，記錄模組功能與架構設計
