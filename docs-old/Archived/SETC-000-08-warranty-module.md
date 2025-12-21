# SETC-000-08: Warranty Module (保固管理模組)

> **模組 ID**: `warranty`  
> **版本**: 2.0.0  
> **狀態**: ✅ 已實作完成 (All Components Complete 8/8)  
> **優先級**: P2 (必要)  
> **架構**: Blueprint Container Module  
> **歸檔日期**: 2025-12-16

---

## 📋 模組概述

保固域負責所有保固管理相關功能，提供保固期追蹤、缺失回報、維修管理等功能。本模組遵循 Blueprint Container 架構設計，實現零耦合、可擴展的模組化設計。

### 業務範圍

所有保固管理相關功能，包括：
- 保固期自動建立（從驗收連動）
- 保固期限追蹤與到期通知
- 保固缺失回報與確認
- 維修排程與執行追蹤
- 維修驗收管理
- 嚴重缺失問題單整合

### 核心特性

- ✅ **自動保固建立**: 驗收通過自動進入保固期
- ✅ **到期追蹤**: 自動追蹤保固到期狀態
- ✅ **缺失管理**: 完整的缺失回報與處理流程
- ✅ **維修追蹤**: 維修排程、執行、驗收追蹤
- ✅ **零耦合設計**: 透過 Event Bus 與其他模組通訊
- ✅ **完整生命週期管理**: 實作 IBlueprintModule 介面

### 設計原則

1. **流程規範性**: 標準化的缺失處理流程
2. **時效追蹤**: 保固期限的即時監控
3. **責任追溯**: 明確的保固責任方管理
4. **整合性**: 與問題單、驗收模組整合

---

## 🏗️ 架構設計

### 目錄結構

```
warranty/
├── models/
│   ├── warranty.model.ts           # 保固記錄模型
│   ├── warranty-defect.model.ts    # 缺失模型
│   ├── warranty-repair.model.ts    # 維修模型
│   ├── warranty-status-machine.ts  # 狀態機
│   └── index.ts
├── repositories/
│   ├── warranty.repository.ts      # Repository 實作
│   ├── warranty-defect.repository.ts
│   ├── warranty-repair.repository.ts
│   └── index.ts
├── services/
│   ├── warranty-period.service.ts  # 保固期管理
│   ├── warranty-defect.service.ts  # 缺失管理
│   ├── warranty-repair.service.ts  # 維修管理
│   └── index.ts
├── config/
│   └── warranty.config.ts          # 模組配置
├── exports/
│   └── warranty.api.ts             # 公開 API
├── warranty.module.ts              # Domain 主模塊
├── module.metadata.ts              # Domain 元資料
├── warranty.integration.spec.ts    # 整合測試
├── index.ts                        # 統一匯出
└── README.md                       # 模組文檔
```

---

## 📦 資料模型

### Warranty (保固記錄)

```typescript
interface Warranty {
  id: string;
  blueprintId: string;
  acceptanceId: string;
  contractId: string;
  warrantyNumber: string;
  warrantyType: WarrantyType;    // 'standard' | 'extended' | 'special'
  
  // 保固期間
  startDate: Date;
  endDate: Date;
  periodInMonths: number;
  
  // 責任方
  warrantor: WarrantorInfo;      // 保固責任方
  
  // 狀態
  status: WarrantyStatus;        // 'active' | 'expired' | 'terminated'
  
  // 統計
  defectCount: number;
  repairCount: number;
  
  createdAt: Date;
  updatedAt: Date;
}
```

### WarrantyStatus (保固狀態)

| 狀態 | 中文 | 說明 |
|------|------|------|
| `active` | 生效中 | 保固期內 |
| `expiring_soon` | 即將到期 | 30 天內到期 |
| `expired` | 已到期 | 超過保固期限 |
| `terminated` | 已終止 | 提前終止保固 |

### WarrantyDefect (保固缺失)

```typescript
interface WarrantyDefect {
  id: string;
  warrantyId: string;
  defectNumber: string;
  description: string;
  location: string;
  category: DefectCategory;      // 'structural' | 'waterproof' | 'equipment' | 'other'
  severity: DefectSeverity;      // 'critical' | 'major' | 'minor'
  
  // 狀態
  status: WarrantyDefectStatus;  // 'reported' | 'confirmed' | 'repairing' | 'repaired' | 'closed'
  
  // 回報資訊
  reportedBy: string;
  reportedAt: Date;
  photos?: string[];
  
  // 關聯
  repairId?: string;
  issueId?: string;              // 嚴重缺失會建立問題單
  
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}
```

### WarrantyRepair (保固維修)

```typescript
interface WarrantyRepair {
  id: string;
  warrantyId: string;
  defectId: string;
  repairNumber: string;
  description: string;
  repairMethod: string;
  
  // 承攬廠商
  contractor: WarrantorInfo;
  
  // 排程
  scheduledDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  
  // 狀態
  status: RepairStatus;          // 'scheduled' | 'in_progress' | 'completed' | 'verified' | 'failed'
  
  // 成本
  cost?: number;
  costResponsibility: CostResponsibility;  // 'warrantor' | 'owner' | 'shared'
  
  // 驗收
  verifiedBy?: string;
  verifiedAt?: Date;
  verificationResult?: VerificationResult;
  
  createdAt: Date;
  completedAt?: Date;
}
```

---

## 🔄 狀態機

### Warranty Status Flow

```
[驗收通過] → active → expiring_soon → expired
               ↓
          terminated
```

### Warranty Defect Status Flow

```
reported → confirmed → repairing → repaired → closed
             ↓                        ↓
        rejected                   failed
```

### Warranty Repair Status Flow

```
scheduled → in_progress → completed → verified
               ↓              ↓          ↓
          cancelled       failed    rejected
```

---

## 📦 子模組 (Sub-Modules)

### 1️⃣ Warranty Period Management Sub-Module (保固期管理)

**職責**: 保固期建立、追蹤與到期管理

**核心功能**:
- 從驗收自動建立保固記錄
- 保固到期追蹤與通知
- 保固期延長
- 保固終止

### 2️⃣ Warranty Defect Management Sub-Module (保固缺失管理)

**職責**: 缺失回報、確認與追蹤

**核心功能**:
- 缺失回報
- 缺失確認
- 缺失分類與評級
- 嚴重缺失自動建立問題單

### 3️⃣ Warranty Repair Management Sub-Module (保固維修管理)

**職責**: 維修排程、執行與驗收

**核心功能**:
- 維修排程
- 維修執行追蹤
- 維修驗收
- 維修成本記錄

---

## 🔌 公開 API

### IWarrantyModuleApi

```typescript
interface IWarrantyModuleApi {
  period: IWarrantyPeriodApi;
  defect: IWarrantyDefectApi;
  repair: IWarrantyRepairApi;
}
```

### IWarrantyPeriodApi

```typescript
interface IWarrantyPeriodApi {
  createFromAcceptance(acceptanceId: string, config: WarrantyConfig): Promise<Warranty>;
  extend(warrantyId: string, additionalMonths: number): Promise<Warranty>;
  terminate(warrantyId: string, reason: string): Promise<void>;
  findExpiringSoon(blueprintId: string, days: number): Promise<Warranty[]>;
  findById(id: string): Promise<Warranty | undefined>;
}
```

### IWarrantyDefectApi

```typescript
interface IWarrantyDefectApi {
  report(defect: ReportDefectDto): Promise<WarrantyDefect>;
  confirm(defectId: string, confirmedBy: string): Promise<void>;
  reject(defectId: string, reason: string): Promise<void>;
  close(defectId: string): Promise<void>;
  findByWarranty(warrantyId: string): Promise<WarrantyDefect[]>;
}
```

---

## 📡 事件整合

### 訂閱驗收事件自動建立保固

```typescript
// 驗收通過後自動建立保固記錄
this.eventBus.on('acceptance.passed')
  .pipe(takeUntilDestroyed(this.destroyRef))
  .subscribe(async event => {
    const warranty = await this.warrantyPeriodService.createFromAcceptance(
      event.data.acceptanceId,
      {
        warrantyType: 'standard',
        periodInMonths: 12,
        warrantor: event.data.contractor
      }
    );
    console.log('Auto-created warranty:', warranty);
  });
```

### 發送保固事件

```typescript
// 保固建立事件
this.eventBus.emit({
  type: 'warranty.created',
  blueprintId: warranty.blueprintId,
  timestamp: new Date(),
  actor: userId,
  data: { 
    warrantyId: warranty.id,
    acceptanceId: warranty.acceptanceId,
    periodInMonths: warranty.periodInMonths
  }
});

// 保固缺失回報事件 (嚴重時建立問題單)
this.eventBus.emit({
  type: 'warranty.defect.created',
  blueprintId: defect.blueprintId,
  timestamp: new Date(),
  actor: userId,
  data: { 
    defectId: defect.id,
    warrantyId: defect.warrantyId,
    severity: defect.severity
  }
});
```

---

## 🚀 使用範例

### 1. 從驗收自動建立保固

```typescript
// 驗收通過後自動觸發
const warranty = await this.warrantyPeriodService.createFromAcceptance(
  'acceptance-123',
  {
    warrantyType: 'standard',
    periodInMonths: 12,
    warrantor: {
      id: 'contractor-1',
      name: 'XYZ 營造',
      contactPerson: '李經理',
      contactPhone: '02-1234-5678'
    }
  }
);
```

### 2. 回報保固缺失

```typescript
const defect = await this.warrantyDefectService.report({
  warrantyId: warranty.id,
  description: '客廳天花板漏水',
  location: '客廳天花板',
  category: 'waterproof',
  severity: 'major',
  reportedBy: 'user-001',
  photos: ['photo-url-1', 'photo-url-2']
});
```

### 3. 安排維修

```typescript
const repair = await this.warrantyRepairService.schedule({
  warrantyId: warranty.id,
  defectId: defect.id,
  description: '重新防水施作',
  repairMethod: '移除舊防水層，重新施作防水',
  contractor: {
    id: 'contractor-2',
    name: '防水專業工程',
    contactPerson: '張師傅'
  },
  scheduledDate: new Date('2025-02-15'),
  costResponsibility: 'warrantor'
});

// 開始維修
await this.warrantyRepairService.start(repair.id);

// 完成維修
await this.warrantyRepairService.complete(repair.id, {
  actualEndDate: new Date(),
  cost: 15000,
  photos: ['repair-photo-1.jpg']
});

// 驗收維修
await this.warrantyRepairService.verify(repair.id, {
  verifiedBy: 'user-001',
  verificationResult: 'pass',
  notes: '已確認漏水問題解決'
});
```

---

## 🧪 測試

### 單元測試

```bash
# 執行保固模組單元測試
yarn test --include="**/warranty/**/*.spec.ts"
```

### 整合測試

```bash
# 執行保固模組整合測試
yarn test --include="**/warranty.integration.spec.ts"
```

---

## 📝 待實作功能

1. ⏳ **保固範本**: 可重複使用的保固條款範本
2. ⏳ **保固報表**: 保固執行統計報表
3. ⏳ **保固提醒**: 到期前自動提醒
4. ⏳ **保固評級**: 保固執行品質評級
5. ⏳ **多層保固**: 支援分層保固管理

---

## 🔗 相關模組

- **Acceptance Module**: 驗收通過啟動保固
- **Issue Module**: 嚴重缺失建立問題單
- **Finance Module**: 維修成本追蹤
- **Contract Module**: 合約保固條款
- **Log Module**: 記錄保固操作

---

## 📚 參考資源

- [保固模組 README](../../src/app/core/blueprint/modules/implementations/warranty/README.md)
- [Blueprint Container 架構](../ARCHITECTURE.md)
- [核心開發規範](../discussions/⭐.md)
- [SETC 任務規劃](../discussions/SETC-032-warranty-module-foundation.md)

---

**文檔維護**: 2025-12-16  
**維護者**: Architecture Team  
**歸檔原因**: 備查使用，記錄模組功能與架構設計
