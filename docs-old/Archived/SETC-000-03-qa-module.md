# SETC-000-03: QA Module (品質控管模組)

> **模組 ID**: `qa`  
> **版本**: 1.0.0  
> **狀態**: ✅ 已實作 (基礎架構)  
> **優先級**: P2 (必要)  
> **架構**: Blueprint Container Module  
> **歸檔日期**: 2025-12-16

---

## 📋 模組概述

品質控管域負責施工品質管理與檢查，提供檢查表管理、缺失紀錄、現場巡檢及品質報告等功能。本模組遵循 Blueprint Container 架構設計，實現零耦合、可擴展的模組化設計。

### 業務範圍

施工品質管理與檢查，包括：
- 例行檢查表管理與執行
- 缺失紀錄與修復流程
- 現場巡檢排程與記錄
- 品質報告生成與匯出

### 核心特性

- ✅ **可組態檢查表**: 自定義檢查項目與標準
- ✅ **缺失管理**: 完整的缺失追蹤與修復流程
- ✅ **行動巡檢**: 支援行動裝置現場巡檢
- ✅ **照片標註**: 缺失照片拍攝與標註功能
- ✅ **品質報告**: 自動生成品質報告與統計
- ✅ **零耦合設計**: 透過 Event Bus 與其他模組通訊
- ✅ **完整生命週期管理**: 實作 IBlueprintModule 介面

### 設計原則

1. **標準化檢查**: 提供標準化的檢查流程與記錄
2. **缺失閉環**: 從發現、記錄、修復到驗證的完整閉環
3. **可追溯性**: 所有檢查與缺失都可追溯
4. **移動優先**: 優化行動裝置使用體驗

---

## 🏗️ 架構設計

### 目錄結構

```
qa/
├── qa.module.ts                  # Domain 主模塊 (實作 IBlueprintModule)
├── module.metadata.ts            # Domain 元資料
├── qa.repository.ts              # 共用資料存取層
├── qa.routes.ts                  # Domain 路由配置
├── services/                     # Sub-Module Services
│   ├── checklist.service.ts      # Sub-Module: Checklist
│   ├── defect.service.ts         # Sub-Module: Defect Management
│   ├── inspection.service.ts     # Sub-Module: Inspection
│   └── report.service.ts         # Sub-Module: QA Report
├── models/                       # Domain 模型
│   ├── checklist.model.ts
│   ├── defect.model.ts
│   ├── inspection.model.ts
│   └── qa-report.model.ts
├── components/                   # Domain UI 元件
│   ├── checklist/
│   ├── defect/
│   ├── inspection/
│   └── report/
├── config/
│   └── qa.config.ts              # 模組配置
├── exports/
│   └── qa-api.exports.ts         # 公開 API
├── index.ts                      # 統一匯出
└── README.md                     # 模組文檔
```

---

## 📦 子模組 (Sub-Modules)

### 1️⃣ Checklist Sub-Module (檢查表)

**職責**: 例行檢查表管理與檢查項目定義

**核心功能**:
- 檢查表範本建立與管理
- 檢查項目定義與分類
- 檢查標準與評分規則
- 檢查表執行與填寫
- 檢查結果統計

**資料模型**:
```typescript
interface ChecklistTemplate {
  id: string;
  blueprintId: string;
  name: string;
  description?: string;
  category: ChecklistCategory; // 'safety' | 'quality' | 'progress' | 'material'
  sections: ChecklistSection[];
  frequency?: CheckFrequency;  // 'daily' | 'weekly' | 'monthly' | 'milestone'
  applicableTo?: string[];     // 適用的工程類型
  version: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ChecklistExecution {
  id: string;
  blueprintId: string;
  templateId: string;
  templateName: string;
  taskId?: string;
  locationId?: string;
  inspector: string;
  inspectorName: string;
  startedAt: Date;
  completedAt?: Date;
  status: ExecutionStatus;
  results: ChecklistResult[];
  overallScore?: number;
  passRate?: number;
  notes?: string;
  attachments?: string[];
}
```

### 2️⃣ Defect Management Sub-Module (缺失管理)

**職責**: 缺失紀錄、追蹤與修復流程管理

**核心功能**:
- 缺失建立與分類
- 缺失照片與標註
- 缺失指派與責任人
- 修復進度追蹤
- 缺失驗證與結案

**資料模型**:
```typescript
interface Defect {
  id: string;
  blueprintId: string;
  defectNumber: string;
  title: string;
  description: string;
  severity: DefectSeverity;    // 'critical' | 'major' | 'minor'
  category: string;
  locationId?: string;
  taskId?: string;
  discoveredBy: string;
  discoveredAt: Date;
  assignedTo?: string;
  status: DefectStatus;        // 'open' | 'in_progress' | 'resolved' | 'verified' | 'closed'
  photos: DefectPhoto[];
  repairLog?: RepairLog[];
  resolvedAt?: Date;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface DefectPhoto {
  id: string;
  url: string;
  annotations?: Annotation[];
  timestamp: Date;
}
```

### 3️⃣ Inspection Sub-Module (巡檢)

**職責**: 現場巡檢排程與記錄

**核心功能**:
- 巡檢排程與計畫
- 巡檢執行與記錄
- 巡檢路線規劃
- 巡檢報告生成

**資料模型**:
```typescript
interface Inspection {
  id: string;
  blueprintId: string;
  inspectionNumber: string;
  type: InspectionType;        // 'routine' | 'special' | 'random'
  scheduledDate: Date;
  actualDate?: Date;
  inspector: string;
  inspectorName: string;
  locations: string[];
  checklistIds: string[];
  findings: InspectionFinding[];
  status: InspectionStatus;
  notes?: string;
  createdAt: Date;
  completedAt?: Date;
}

interface InspectionFinding {
  id: string;
  type: FindingType;           // 'defect' | 'observation' | 'recommendation'
  description: string;
  severity?: DefectSeverity;
  location?: string;
  photos?: string[];
  requiresAction: boolean;
  actionTaken?: string;
}
```

### 4️⃣ QA Report Sub-Module (品質報告)

**職責**: 品質報告生成與統計分析

**核心功能**:
- 品質統計報告
- 缺失趨勢分析
- 檢查合格率統計
- 報告匯出功能

**資料模型**:
```typescript
interface QAReport {
  id: string;
  blueprintId: string;
  reportType: ReportType;      // 'daily' | 'weekly' | 'monthly' | 'project'
  period: DateRange;
  statistics: QAStatistics;
  defects: DefectSummary[];
  inspections: InspectionSummary[];
  trends: QATrend[];
  recommendations?: string[];
  generatedBy: string;
  generatedAt: Date;
}

interface QAStatistics {
  totalInspections: number;
  completedInspections: number;
  totalDefects: number;
  openDefects: number;
  closedDefects: number;
  averageResolutionTime: number;
  passRate: number;
}
```

---

## 🔌 公開 API

### IQAModuleApi

```typescript
interface IQAModuleApi {
  checklist: IChecklistApi;
  defect: IDefectApi;
  inspection: IInspectionApi;
  report: IQAReportApi;
}
```

### IDefectApi

```typescript
interface IDefectApi {
  create(defect: CreateDefectDto): Promise<Defect>;
  update(id: string, defect: UpdateDefectDto): Promise<Defect>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Defect | undefined>;
  findAll(blueprintId: string, filter?: DefectFilter): Promise<Defect[]>;
  assign(defectId: string, userId: string): Promise<void>;
  resolve(defectId: string, resolution: DefectResolution): Promise<void>;
  verify(defectId: string, verified: boolean): Promise<void>;
}
```

---

## 📡 事件整合

### 發送事件

```typescript
// 缺失建立事件
this.eventBus.emit({
  type: 'qa.defect.created',
  blueprintId: defect.blueprintId,
  timestamp: new Date(),
  actor: userId,
  data: { defectId: defect.id, severity: defect.severity }
});

// 缺失解決事件
this.eventBus.emit({
  type: 'qa.defect.resolved',
  blueprintId: defect.blueprintId,
  timestamp: new Date(),
  actor: userId,
  data: { defectId: defect.id }
});
```

### 訂閱事件

```typescript
// 訂閱任務完成事件，自動觸發檢查
this.eventBus.on('task.completed')
  .pipe(takeUntilDestroyed(this.destroyRef))
  .subscribe(event => {
    this.scheduleInspection(event.data.taskId);
  });
```

---

## 🚀 使用範例

### 1. 建立檢查表範本

```typescript
const template = await this.checklistService.createTemplate({
  blueprintId: 'bp-123',
  name: '混凝土澆置檢查表',
  category: 'quality',
  sections: [
    {
      name: '澆置前檢查',
      items: [
        {
          name: '模板支撐是否穩固',
          checkType: 'boolean',
          isRequired: true,
          isCritical: true
        }
      ]
    }
  ]
});
```

### 2. 記錄缺失

```typescript
const defect = await this.defectService.create({
  blueprintId: 'bp-123',
  title: '牆面裂縫',
  description: '北側牆面發現長度約 20cm 的裂縫',
  severity: 'major',
  category: '結構',
  locationId: 'loc-456',
  photos: [
    { url: 'https://...', annotations: [...] }
  ]
});
```

### 3. 執行巡檢

```typescript
const inspection = await this.inspectionService.create({
  blueprintId: 'bp-123',
  type: 'routine',
  scheduledDate: new Date(),
  inspector: userId,
  inspectorName: userName,
  checklistIds: ['checklist-1', 'checklist-2']
});

// 記錄發現
await this.inspectionService.addFinding(inspection.id, {
  type: 'defect',
  description: '發現地面不平整',
  severity: 'minor',
  requiresAction: true
});
```

---

## 🧪 測試

### 單元測試

```bash
# 執行 QA 模組單元測試
yarn test --include="**/qa/**/*.spec.ts"
```

### 整合測試

```bash
# 執行 QA 模組整合測試
yarn test --include="**/defect.integration.spec.ts"
```

---

## 📝 待實作功能

1. ⏳ **智能巡檢路線**: AI 優化巡檢路線
2. ⏳ **語音記錄**: 支援語音轉文字記錄缺失
3. ⏳ **AR 標註**: 使用 AR 技術標註缺失位置
4. ⏳ **預測分析**: 基於歷史資料預測可能的缺失
5. ⏳ **第三方整合**: 整合第三方檢測設備
6. ⏳ **離線模式**: 支援離線巡檢與同步

---

## 🔗 相關模組

- **Task Module**: 任務與品質檢查關聯
- **Issue Module**: 品質缺失轉換為問題追蹤
- **Acceptance Module**: 驗收前品質檢查
- **Log Module**: 記錄品質檢查活動
- **Warranty Module**: 保固期缺失追蹤

---

## 📚 參考資源

- [QA 模組 README](../../src/app/core/blueprint/modules/implementations/qa/README.md)
- [Blueprint Container 架構](../ARCHITECTURE.md)
- [核心開發規範](../discussions/⭐.md)
- [SETC 任務規劃](../discussions/SETC-040-defect-service-expansion.md)

---

**文檔維護**: 2025-12-16  
**維護者**: Architecture Team  
**歸檔原因**: 備查使用，記錄模組功能與架構設計
