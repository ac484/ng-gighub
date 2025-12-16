# Warranty Domain (保固域)

> **Domain ID**: `warranty`  
> **Version**: 2.0.0  
> **Status**: ✅ All Components Complete (8/8) 🎉  
> **Architecture**: Blueprint Container Module  
> **Priority**: P2 (必要)

## 📋 Overview

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

## 🏗️ Architecture

### Domain 結構

```
warranty/
├── models/
│   ├── warranty.model.ts           # 保固記錄模型
│   ├── warranty-defect.model.ts    # 缺失模型
│   ├── warranty-repair.model.ts    # 維修模型
│   ├── warranty-status-machine.ts  # 狀態機
│   └── index.ts
├── repositories/
│   └── (SETC-033)                  # Repository 實作
├── services/
│   └── (SETC-034~036)              # Service 實作
├── config/
│   └── warranty.config.ts          # 模組配置
├── exports/
│   └── warranty.api.ts             # 公開 API
├── warranty.module.ts              # Domain 主模塊
├── module.metadata.ts              # Domain 元資料
├── index.ts                        # 統一匯出
└── README.md                       # 本文件
```

## 📦 Data Models

### Warranty (保固記錄)

| 欄位 | 類型 | 說明 |
|-----|------|------|
| id | string | 保固 ID |
| blueprintId | string | 藍圖 ID |
| acceptanceId | string | 驗收 ID |
| contractId | string | 合約 ID |
| warrantyNumber | string | 保固編號 |
| warrantyType | WarrantyType | 類型 (standard/extended/special) |
| startDate | Date | 開始日期 |
| endDate | Date | 結束日期 |
| periodInMonths | number | 保固期限 (月) |
| warrantor | WarrantorInfo | 保固責任方 |
| status | WarrantyStatus | 狀態 |
| defectCount | number | 缺失數量 |
| repairCount | number | 維修數量 |

### WarrantyDefect (保固缺失)

| 欄位 | 類型 | 說明 |
|-----|------|------|
| id | string | 缺失 ID |
| warrantyId | string | 保固 ID |
| defectNumber | string | 缺失編號 |
| description | string | 缺失說明 |
| location | string | 發生位置 |
| category | DefectCategory | 類別 |
| severity | DefectSeverity | 嚴重程度 |
| status | WarrantyDefectStatus | 狀態 |
| repairId | string? | 關聯維修 |
| issueId | string? | 關聯問題單 |

### WarrantyRepair (保固維修)

| 欄位 | 類型 | 說明 |
|-----|------|------|
| id | string | 維修 ID |
| warrantyId | string | 保固 ID |
| defectId | string | 缺失 ID |
| repairNumber | string | 維修編號 |
| description | string | 維修說明 |
| repairMethod | string | 維修方法 |
| contractor | WarrantorInfo | 承攬廠商 |
| scheduledDate | Date? | 排定日期 |
| status | RepairStatus | 狀態 |
| cost | number? | 維修成本 |
| costResponsibility | CostResponsibility | 費用責任方 |

## 🔄 Status Machines

### Warranty Status Flow

```
pending → active → expiring → expired → completed
     ↓                  ↓              ↓
  voided           completed       completed
```

### Defect Status Flow

```
reported → confirmed → under_repair → repaired → verified → closed
     ↓
 rejected
```

### Repair Status Flow

```
pending → scheduled → in_progress → completed → verified
    ↓          ↓            ↓             ↓
cancelled  cancelled    cancelled      failed → in_progress
```

## 📦 Repositories

### WarrantyRepository

提供保固記錄的 CRUD 操作和查詢功能。

```typescript
import { WarrantyRepository } from './repositories';

// 建立保固記錄
const warranty = await repository.create(blueprintId, {
  acceptanceId: 'acc-001',
  contractId: 'contract-001',
  taskIds: ['task-001'],
  warrantor: { id: 'v-001', name: '承商名稱', ... },
  createdBy: 'user-001'
});

// 查詢即將到期的保固
const expiring = await repository.getExpiringWarranties(blueprintId, 30);
```

### WarrantyDefectRepository

提供保固缺失的 CRUD 操作和查詢功能。

```typescript
import { WarrantyDefectRepository } from './repositories';

// 報告缺失
const defect = await repository.create(blueprintId, warrantyId, {
  description: '牆面裂縫',
  location: '1F 大廳',
  category: 'structural',
  severity: 'major',
  createdBy: 'user-001'
});

// 取得未結案缺失
const openDefects = await repository.getOpenDefects(blueprintId, warrantyId);
```

### WarrantyRepairRepository

提供保固維修的 CRUD 操作和查詢功能。

```typescript
import { WarrantyRepairRepository } from './repositories';

// 建立維修記錄
const repair = await repository.create(blueprintId, warrantyId, {
  defectId: 'def-001',
  description: '修補裂縫',
  contractor: { id: 'v-001', name: '承商名稱', ... },
  createdBy: 'user-001'
});

// 完成維修
await repository.complete(blueprintId, warrantyId, repairId, {
  completionNotes: '已完成修補',
  updatedBy: 'user-001'
});
```

## 🔧 Services

### WarrantyPeriodService

提供保固期追蹤、狀態自動更新、到期提醒功能。

```typescript
import { WarrantyPeriodService } from './services';

// 從驗收自動建立保固
const warranty = await service.autoCreateFromAcceptance(
  blueprintId,
  acceptanceId,
  contractId,
  taskIds,
  warrantor,
  { periodMonths: 12, actorId: 'user-001' }
);

// 檢查並更新狀態
const result = await service.checkAndUpdateStatus(blueprintId);
console.log(`更新 ${result.updatedWarrantyIds.length} 個保固狀態`);

// 生成保固證明
const certificate = await service.generateWarrantyCertificate(blueprintId, warrantyId);
console.log(`保固證明: ${certificate.certificateNumber}`);

// 取得保固統計
const stats = await service.getWarrantyStats(blueprintId);
console.log(`活動中: ${stats.active}, 即將到期: ${stats.expiring}`);
```

## 📚 Implementation Progress

| 任務 | 狀態 | 說明 |
|------|------|------|
| SETC-032 | ✅ 完成 | Foundation Setup |
| SETC-033 | ✅ 完成 | Repository Implementation |
| SETC-034 | ✅ 完成 | Warranty Period Service |
| SETC-035 | ✅ 完成 | Defect Management Service |
| SETC-036 | ✅ 完成 | Repair Tracking Service |
| SETC-037 | ✅ 完成 | Warranty Event Automation |
| SETC-038 | ✅ 完成 | Warranty UI Components |
| SETC-039 | ✅ 完成 | Warranty Integration Testing |

## 📚 References

- [Blueprint Container 架構](../../README.md)
- [Event Bus 整合指南](../../../../../docs/blueprint-event-bus-integration.md)
- [SETC-032 ~ SETC-039](../../../../../../docs/discussions/SETC.md) - Warranty Module

## 📄 License

MIT License - 請參考專案根目錄的 LICENSE 檔案

---

**Maintained by**: GigHub Development Team  
**Last Updated**: 2025-12-16  
**Domain Priority**: P2 (必要)  
**Contact**: 請透過專案 GitHub Issues 回報問題
