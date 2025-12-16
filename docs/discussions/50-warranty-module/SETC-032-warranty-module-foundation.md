# SETC-032: Warranty Module Foundation Setup

> **任務 ID**: SETC-032  
> **任務名稱**: Warranty Module Foundation Setup  
> **優先級**: P1 (Important)  
> **預估工時**: 2 天  
> **依賴**: SETC-023 (Acceptance → Invoice/Warranty Automation)  
> **狀態**: ✅ 已完成
> **完成日期**: 2025-12-16

---

## 📋 任務定義

### 名稱
保固模組基礎架構設定

### 背景 / 目的
建立 Warranty Module 的基礎架構，包括目錄結構、TypeScript 介面定義、模組配置與公開 API 契約。根據 SETC.md 定義：驗收通過 → 進入保固期 → 保固期管理。

### 需求說明
1. 建立模組目錄結構
2. 定義 Warranty 資料模型
3. 定義 WarrantyDefect 資料模型
4. 定義 WarrantyRepair 資料模型
5. 建立模組配置
6. 定義公開 API 契約

### In Scope / Out of Scope

#### ✅ In Scope
- 目錄結構建立
- 資料模型定義
- 模組配置
- API 契約定義
- README 文檔

#### ❌ Out of Scope
- Repository 實作（SETC-033）
- 服務實作（SETC-034~036）
- UI 元件（SETC-038）

### 功能行為
提供保固管理的基礎架構，作為後續開發的基礎。

### 資料 / API

#### Warranty 資料模型

```typescript
/**
 * 保固記錄
 */
export interface Warranty {
  id: string;
  blueprintId: string;
  
  // 關聯
  acceptanceId: string;
  contractId: string;
  taskIds: string[];
  
  // 編號
  warrantyNumber: string;
  
  // 類型
  warrantyType: WarrantyType;
  
  // 保固項目
  items: WarrantyItem[];
  
  // 保固期限
  startDate: Date;
  endDate: Date;
  periodInMonths: number;
  
  // 保固責任方
  warrantor: WarrantorInfo;
  
  // 狀態
  status: WarrantyStatus;
  
  // 保固缺失與維修
  defectCount: number;
  repairCount: number;
  
  // 通知設定
  notificationSettings: NotificationSettings;
  
  // 審計欄位
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt: Date;
}

export type WarrantyType = 'standard' | 'extended' | 'special';

export type WarrantyStatus = 
  | 'pending'      // 待生效
  | 'active'       // 進行中
  | 'expiring'     // 即將到期（30天內）
  | 'expired'      // 已到期
  | 'completed'    // 已結案
  | 'voided';      // 已作廢

export interface WarrantyItem {
  id: string;
  contractWorkItemId: string;
  description: string;
  warrantyPeriodMonths: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired';
}

export interface WarrantorInfo {
  id: string;
  name: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
}

export interface NotificationSettings {
  enabled: boolean;
  notifyDaysBefore: number[];  // [30, 14, 7, 1]
  notifyEmails: string[];
}
```

#### WarrantyDefect 資料模型

```typescript
/**
 * 保固缺失
 */
export interface WarrantyDefect {
  id: string;
  warrantyId: string;
  blueprintId: string;
  
  // 編號
  defectNumber: string;
  
  // 缺失資訊
  description: string;
  location: string;
  category: DefectCategory;
  severity: DefectSeverity;
  
  // 發現資訊
  discoveredDate: Date;
  reportedBy: string;
  reporterContact: string;
  
  // 證據
  photos: FileAttachment[];
  documents: FileAttachment[];
  
  // 狀態
  status: WarrantyDefectStatus;
  
  // 關聯維修
  repairId?: string;
  
  // 關聯問題單（嚴重缺失）
  issueId?: string;
  
  // 審計欄位
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt: Date;
}

export type DefectCategory = 
  | 'structural'    // 結構
  | 'waterproofing' // 防水
  | 'electrical'    // 電氣
  | 'plumbing'      // 管線
  | 'finishing'     // 裝修
  | 'mechanical'    // 機械
  | 'other';        // 其他

export type DefectSeverity = 'critical' | 'major' | 'minor';

export type WarrantyDefectStatus = 
  | 'reported'        // 已通報
  | 'confirmed'       // 已確認
  | 'under_repair'    // 維修中
  | 'repaired'        // 維修完成
  | 'verified'        // 已驗證
  | 'closed'          // 已結案
  | 'rejected';       // 不受理（非保固範圍）
```

#### WarrantyRepair 資料模型

```typescript
/**
 * 保固維修
 */
export interface WarrantyRepair {
  id: string;
  warrantyId: string;
  defectId: string;
  blueprintId: string;
  
  // 編號
  repairNumber: string;
  
  // 維修資訊
  description: string;
  repairMethod: string;
  
  // 維修單位
  contractor: WarrantorInfo;
  assignedWorkers: string[];
  
  // 時程
  scheduledDate?: Date;
  startedDate?: Date;
  completedDate?: Date;
  verifiedDate?: Date;
  
  // 狀態
  status: RepairStatus;
  
  // 成本（如果由業主負擔）
  cost?: number;
  costResponsibility: 'warrantor' | 'owner';
  
  // 完工記錄
  completionPhotos: FileAttachment[];
  completionNotes?: string;
  
  // 審計欄位
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt: Date;
}

export type RepairStatus = 
  | 'pending'       // 待派工
  | 'scheduled'     // 已排程
  | 'in_progress'   // 進行中
  | 'completed'     // 已完成
  | 'verified'      // 已驗收
  | 'failed'        // 驗收失敗
  | 'cancelled';    // 已取消
```

#### 模組目錄結構

```
src/app/core/blueprint/modules/implementations/warranty/
├── models/
│   ├── warranty.model.ts
│   ├── warranty-defect.model.ts
│   ├── warranty-repair.model.ts
│   └── index.ts
├── repositories/
│   └── (SETC-033)
├── services/
│   └── (SETC-034~036)
├── config/
│   └── warranty.config.ts
├── exports/
│   └── warranty.api.ts
├── warranty.module.ts
├── module.metadata.ts
└── README.md
```

### 影響範圍
- `src/app/core/blueprint/modules/implementations/warranty/` - 新模組

### 驗收條件
1. ✅ 目錄結構建立完成
2. ✅ 資料模型定義完整
3. ✅ 類型安全（TypeScript 嚴格模式）
4. ✅ API 契約明確
5. ✅ README 文檔完成

---

## 🔍 分析階段

### 步驟 1: Context7 查詢
**目的**: 查詢 Angular 模組結構最佳實踐

**查詢重點**:
- Standalone Components 模組結構
- 模組 API 設計
- 類型定義模式

### 步驟 2: Sequential Thinking 分析

**思考流程**:
1. **保固流程分析**
   - 驗收通過 → 建立保固
   - 保固期追蹤
   - 缺失與維修管理

2. **資料模型設計**
   - Warranty 主文件
   - Defect 子文件
   - Repair 子文件

3. **狀態機設計**
   - 保固狀態
   - 缺失狀態
   - 維修狀態

### 步驟 3: Software Planning Tool

**開發計畫**:
```
Day 1 (8 hours):
├── 目錄結構建立
├── Warranty 模型定義
├── WarrantyDefect 模型定義
└── WarrantyRepair 模型定義

Day 2 (8 hours):
├── 模組配置
├── API 契約定義
├── README 文檔
└── 模組匯出
```

---

## 📐 規劃階段

### 實施步驟

#### Phase 1: 模型定義 (Day 1)

**檔案**: `models/warranty.model.ts`
```typescript
// 完整模型定義如上述
```

#### Phase 2: 配置與 API (Day 2)

**檔案**: `config/warranty.config.ts`
```typescript
export const WarrantyConfig = {
  defaultPeriodMonths: 12,
  defaultNotifyDaysBefore: [30, 14, 7, 1],
  maxDefectPhotos: 10,
  maxRepairPhotos: 10,
  
  statusTransitions: {
    warranty: {
      pending: ['active', 'voided'],
      active: ['expiring', 'completed', 'voided'],
      expiring: ['active', 'expired', 'completed'],
      expired: ['completed'],
      completed: [],
      voided: []
    },
    defect: {
      reported: ['confirmed', 'rejected'],
      confirmed: ['under_repair'],
      under_repair: ['repaired'],
      repaired: ['verified', 'under_repair'],
      verified: ['closed'],
      closed: [],
      rejected: []
    },
    repair: {
      pending: ['scheduled', 'cancelled'],
      scheduled: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: ['verified', 'failed'],
      verified: [],
      failed: ['in_progress'],
      cancelled: []
    }
  }
};
```

### 檔案清單

**新增檔案**:
- `src/app/core/blueprint/modules/implementations/warranty/models/warranty.model.ts`
- `src/app/core/blueprint/modules/implementations/warranty/models/warranty-defect.model.ts`
- `src/app/core/blueprint/modules/implementations/warranty/models/warranty-repair.model.ts`
- `src/app/core/blueprint/modules/implementations/warranty/models/index.ts`
- `src/app/core/blueprint/modules/implementations/warranty/config/warranty.config.ts`
- `src/app/core/blueprint/modules/implementations/warranty/exports/warranty.api.ts`
- `src/app/core/blueprint/modules/implementations/warranty/module.metadata.ts`
- `src/app/core/blueprint/modules/implementations/warranty/README.md`

---

## 📜 開發規範

### ⭐ 必須遵循
- ✅ TypeScript 嚴格模式
- ✅ 明確的類型定義
- ✅ 清晰的狀態機
- ✅ 完整的文檔

### Angular 20 規範
- ✅ Standalone Components 結構
- ✅ 模組化設計

---

## ✅ 檢查清單

### 架構檢查
- [x] 目錄結構符合規範
- [x] 模型定義完整
- [x] 類型安全

### 文檔檢查
- [x] README 完整
- [x] API 文檔清晰
- [x] 狀態機說明

---

## 📁 實作檔案

### 新增檔案
- `src/app/core/blueprint/modules/implementations/warranty/models/warranty.model.ts` - 保固記錄模型
- `src/app/core/blueprint/modules/implementations/warranty/models/warranty-defect.model.ts` - 缺失模型
- `src/app/core/blueprint/modules/implementations/warranty/models/warranty-repair.model.ts` - 維修模型
- `src/app/core/blueprint/modules/implementations/warranty/models/warranty-status-machine.ts` - 狀態機
- `src/app/core/blueprint/modules/implementations/warranty/models/index.ts` - 模型匯出
- `src/app/core/blueprint/modules/implementations/warranty/config/warranty.config.ts` - 模組配置
- `src/app/core/blueprint/modules/implementations/warranty/exports/warranty.api.ts` - API 契約
- `src/app/core/blueprint/modules/implementations/warranty/module.metadata.ts` - 模組元資料
- `src/app/core/blueprint/modules/implementations/warranty/warranty.module.ts` - 模組實作
- `src/app/core/blueprint/modules/implementations/warranty/index.ts` - 公開匯出
- `src/app/core/blueprint/modules/implementations/warranty/README.md` - 文檔
