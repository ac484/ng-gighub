# QA Domain (品質控管域)

> **Domain ID**: `qa`  
> **Version**: 1.0.0  
> **Status**: ✅ Structured (2025-12-19)  
> **Architecture**: Blueprint Container Module (Feature-based)  
> **Priority**: P2 (必要)  
> **Pattern**: Following Issue Module (SETC-001 ~ SETC-008)

## 📋 Overview

品質控管域負責施工品質管理與檢查，提供檢查表管理、缺失紀錄、現場巡檢及品質報告等功能。本模組遵循 Blueprint Container 架構設計，實現零耦合、可擴展的模組化設計。

**🎯 2025-12-19 更新**: 模組已重構為功能導向架構（Feature-based Architecture），遵循 Issue Module 的模式，提供清晰的 API 介面和子模組分離。

### 業務範圍

施工品質管理與檢查，包括：
- 例行檢查表管理與執行
- 缺失紀錄與修復流程（SETC-041 ~ SETC-044）
- 現場巡檢排程與記錄
- 品質報告生成與匯出

### 核心特性

- ✅ **可組態檢查表**: 自定義檢查項目與標準
- ✅ **缺失管理**: 完整的缺失追蹤與修復流程
- ✅ **缺失生命週期**: 狀態機管理 (SETC-041)
- ✅ **整改流程**: 修復進度追蹤 (SETC-042)
- ✅ **複驗管理**: 驗證工作流 (SETC-043)
- ✅ **Issue 整合**: 嚴重缺失自動升級為 Issue (SETC-044)
- ✅ **行動巡檢**: 支援行動裝置現場巡檢
- ✅ **照片標註**: 缺失照片拍攝與標註功能
- ✅ **品質報告**: 自動生成品質報告與統計
- ✅ **零耦合設計**: 透過 Event Bus 與其他模組通訊
- ✅ **完整生命週期管理**: 實作 IBlueprintModule 介面
- ✅ **清晰 API 介面**: 提供統一的 IQAModuleApi 存取

### 設計原則

1. **標準化檢查**: 提供標準化的檢查流程與記錄
2. **缺失閉環**: 從發現、記錄、修復到驗證的完整閉環
3. **可追溯性**: 所有檢查與缺失都可追溯
4. **移動優先**: 優化行動裝置使用體驗
5. **高內聚低耦合**: 子模組獨立但協作良好
6. **明確介面**: 透過 exports/API 與外部通訊

## 🏗️ Architecture

### New Structure (2025-12-19)

```
qa/
├── qa.module.ts                  # 主模組 (實作 IBlueprintModule)
├── module.metadata.ts            # 模組元資料與事件定義
├── index.ts                      # 統一匯出
├── README.md                     # 本文件
│
├── models/                       # 資料模型
│   ├── qa.model.ts               # 缺失模型與類型
│   └── index.ts
│
├── repositories/                 # 資料存取層
│   └── qa.repository.ts          # QA Repository
│
├── services/                     # 業務邏輯層（按功能分離）
│   ├── checklist.service.ts      # 檢查表管理
│   ├── defect.service.ts         # 基礎缺失 CRUD
│   ├── defect-lifecycle.service.ts        # 缺失生命週期 (SETC-041)
│   ├── defect-resolution.service.ts       # 缺失整改 (SETC-042)
│   ├── defect-reinspection.service.ts     # 缺失複驗 (SETC-043)
│   ├── defect-issue-integration.service.ts # 缺失-Issue 整合 (SETC-044)
│   ├── inspection.service.ts     # 現場巡檢
│   ├── report.service.ts         # 品質報告
│   └── index.ts
│
├── exports/                      # 公開 API 介面 (NEW)
│   ├── qa-api.exports.ts         # IQAModuleApi 定義
│   └── index.ts
│
└── config/                       # 模組配置 (NEW)
    ├── qa.config.ts              # IQAConfig & DEFAULT_QA_CONFIG
    └── index.ts
```

### Module Architecture Pattern

遵循 Issue Module 的三層架構模式：

```
External Modules
      ↓ (Event Bus)
QA Module API (IQAModuleApi)
      ↓
Services Layer (8 sub-modules)
  ├── ChecklistService
  ├── DefectService
  ├── DefectLifecycleService      (SETC-041)
  ├── DefectResolutionService     (SETC-042)
  ├── DefectReinspectionService   (SETC-043)
  ├── DefectIssueIntegrationService (SETC-044)
  ├── InspectionService
  └── ReportService
      ↓
Repository Layer
  └── QaRepository
      ↓
Firestore
```

## 📦 Sub-Modules (子模塊)

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

interface ChecklistSection {
  id: string;
  name: string;
  order: number;
  items: ChecklistItem[];
}

interface ChecklistItem {
  id: string;
  name: string;
  description?: string;
  checkType: CheckType;        // 'boolean' | 'numeric' | 'text' | 'photo'
  standard?: string;            // 檢查標準
  acceptanceCriteria?: string;  // 合格標準
  isRequired: boolean;
  isCritical: boolean;          // 是否為關鍵項目
  weight?: number;              // 權重
  order: number;
}

interface ChecklistExecution {
  id: string;
  blueprintId: string;
  templateId: string;
  templateName: string;
  taskId?: string;              // 關聯的任務
  locationId?: string;          // 檢查地點
  inspector: string;
  inspectorName: string;
  startedAt: Date;
  completedAt?: Date;
  status: ExecutionStatus;      // 'in_progress' | 'completed' | 'failed'
  results: ChecklistResult[];
  overallScore?: number;
  passRate?: number;
  notes?: string;
  attachments?: string[];
}

interface ChecklistResult {
  itemId: string;
  itemName: string;
  result: CheckResult;          // 'pass' | 'fail' | 'na' | 'pending'
  value?: any;
  notes?: string;
  photos?: string[];
  timestamp: Date;
}
```

### 2️⃣ Defect Management Sub-Module (缺失管理)

**職責**: 缺失紀錄、修復流程與狀態追蹤

**核心功能**:
- 缺失記錄與分類
- 缺失嚴重性評估
- 缺失指派與責任追蹤
- 修復進度追蹤
- 缺失復查與驗證
- 缺失統計分析

**資料模型**:
```typescript
interface Defect {
  id: string;
  blueprintId: string;
  defectNumber: string;         // 缺失編號 (自動生成)
  title: string;
  description: string;
  category: DefectCategory;     // 'structural' | 'material' | 'workmanship' | 'safety'
  severity: DefectSeverity;     // 'critical' | 'major' | 'minor'
  location: DefectLocation;
  discoveredBy: string;
  discoveredAt: Date;
  discoveredIn?: string;        // 檢查表/巡檢 ID
  
  // 責任與處理
  responsibleContractor?: string;
  assignedTo?: string;
  dueDate?: Date;
  estimatedCost?: number;
  
  // 狀態追蹤
  status: DefectStatus;         // 'open' | 'assigned' | 'fixing' | 'fixed' | 'verified' | 'closed'
  priority: DefectPriority;     // 'urgent' | 'high' | 'medium' | 'low'
  
  // 修復記錄
  fixedBy?: string;
  fixedAt?: Date;
  fixDescription?: string;
  fixCost?: number;
  
  // 驗證
  verifiedBy?: string;
  verifiedAt?: Date;
  verificationResult?: 'passed' | 'failed';
  verificationNotes?: string;
  
  // 附件
  photos: DefectPhoto[];
  documents?: string[];
  
  // 追蹤
  statusHistory: DefectStatusChange[];
  comments: DefectComment[];
  
  createdAt: Date;
  updatedAt: Date;
}

interface DefectLocation {
  buildingId?: string;
  floor?: string;
  zone?: string;
  room?: string;
  coordinates?: { x: number; y: number };
  description?: string;
}

interface DefectPhoto {
  id: string;
  url: string;
  thumbnail?: string;
  caption?: string;
  takenAt: Date;
  takenBy: string;
  annotations?: PhotoAnnotation[];
}

interface PhotoAnnotation {
  id: string;
  type: 'arrow' | 'circle' | 'rectangle' | 'text';
  coordinates: any;
  color: string;
  text?: string;
}

interface DefectStatusChange {
  from: DefectStatus;
  to: DefectStatus;
  changedBy: string;
  changedAt: Date;
  reason?: string;
}
```

### 3️⃣ Inspection Sub-Module (現場巡檢)

**職責**: 巡檢記錄與巡檢排程

**核心功能**:
- 巡檢計畫與排程
- 巡檢路線規劃
- 現場巡檢記錄
- 巡檢照片與語音記錄
- 巡檢報告生成
- 巡檢統計分析

**資料模型**:
```typescript
interface InspectionPlan {
  id: string;
  blueprintId: string;
  name: string;
  description?: string;
  inspectionType: InspectionType; // 'routine' | 'special' | 'final'
  frequency?: InspectionFrequency;
  schedule?: InspectionSchedule;
  checkpoints: InspectionCheckpoint[];
  assignedInspectors: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface InspectionCheckpoint {
  id: string;
  name: string;
  location: string;
  locationId?: string;
  checkItems: string[];          // 檢查項目
  estimatedDuration: number;     // 預估時間（分鐘）
  order: number;
  photos?: string[];
}

interface InspectionRecord {
  id: string;
  blueprintId: string;
  planId?: string;
  inspectionNumber: string;      // 巡檢編號
  inspectionType: InspectionType;
  inspector: string;
  inspectorName: string;
  
  // 執行資訊
  scheduledAt?: Date;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;             // 實際花費時間（分鐘）
  
  // 巡檢結果
  checkpoints: CheckpointResult[];
  overallStatus: 'pass' | 'fail' | 'conditional';
  defectsFound: number;
  defectIds: string[];           // 發現的缺失 ID
  
  // 備註與附件
  summary?: string;
  notes?: string;
  photos: InspectionPhoto[];
  voiceRecordings?: VoiceRecording[];
  
  // 天氣條件
  weather?: WeatherCondition;
  
  createdAt: Date;
  updatedAt: Date;
}

interface CheckpointResult {
  checkpointId: string;
  checkpointName: string;
  visitedAt: Date;
  status: 'pass' | 'fail' | 'skipped';
  findings: string[];
  photos: string[];
  gpsLocation?: { lat: number; lng: number };
}

interface VoiceRecording {
  id: string;
  url: string;
  duration: number;
  transcription?: string;
  recordedAt: Date;
}

interface WeatherCondition {
  temperature: number;
  humidity: number;
  condition: string;
  recordedAt: Date;
}
```

### 4️⃣ QA Report Sub-Module (品質報告)

**職責**: 品質報告生成與匯出

**核心功能**:
- 品質報告範本管理
- 報告資料彙整
- 報告生成與預覽
- 報告匯出 (PDF, Excel)
- 報告發送與分享
- 報告歷史記錄

**資料模型**:
```typescript
interface QAReport {
  id: string;
  blueprintId: string;
  reportType: ReportType;        // 'daily' | 'weekly' | 'monthly' | 'milestone' | 'custom'
  reportNumber: string;
  title: string;
  period: ReportPeriod;
  
  // 報告內容
  summary: ReportSummary;
  sections: ReportSection[];
  
  // 生成資訊
  generatedBy: string;
  generatedAt: Date;
  status: ReportStatus;          // 'draft' | 'finalized' | 'approved' | 'distributed'
  
  // 審核與核准
  reviewedBy?: string;
  reviewedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  
  // 分發
  distributedTo?: string[];
  distributedAt?: Date;
  
  // 附件
  attachments: string[];
  exportedFiles?: ExportedFile[];
  
  createdAt: Date;
  updatedAt: Date;
}

interface ReportPeriod {
  startDate: Date;
  endDate: Date;
  description?: string;
}

interface ReportSummary {
  totalInspections: number;
  totalChecklists: number;
  totalDefects: number;
  openDefects: number;
  closedDefects: number;
  criticalDefects: number;
  overallQualityScore?: number;
  complianceRate?: number;
  highlights?: string[];
  concerns?: string[];
}

interface ReportSection {
  id: string;
  title: string;
  order: number;
  content: SectionContent;
  charts?: ChartData[];
}

interface SectionContent {
  type: 'text' | 'table' | 'list' | 'checklist_summary' | 'defect_summary' | 'inspection_summary';
  data: any;
}

interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'radar';
  title: string;
  data: any;
}

interface ExportedFile {
  id: string;
  format: 'pdf' | 'excel' | 'word';
  url: string;
  fileName: string;
  fileSize: number;
  exportedAt: Date;
}
```

## 🚀 Quick Start

### 1. 載入模組到 Blueprint Container

```typescript
import { BlueprintContainer } from '@core/blueprint/container/blueprint-container';
import { QAModule } from '@core/blueprint/modules/implementations/qa';

// 初始化容器
const container = new BlueprintContainer(config);
await container.initialize();

// 載入 QA 模組
const qaModule = new QAModule();
await container.loadModule(qaModule);

// 啟動容器
await container.start();
```

### 2. 建立檢查表範本

```typescript
import { IQAModuleApi } from '@core/blueprint/modules/implementations/qa';

// 取得 QA 模組 API
const qaApi = context.resources.getModule('qa')?.exports as IQAModuleApi;

// 建立檢查表範本
const template = await qaApi.checklist.createTemplate({
  blueprintId: 'blueprint-123',
  name: '鋼筋工程檢查表',
  category: 'quality',
  sections: [
    {
      id: 's1',
      name: '材料檢查',
      order: 1,
      items: [
        {
          id: 'i1',
          name: '鋼筋規格是否符合設計',
          checkType: 'boolean',
          standard: '依據施工圖說',
          isRequired: true,
          isCritical: true,
          order: 1
        },
        {
          id: 'i2',
          name: '鋼筋外觀檢查',
          checkType: 'photo',
          acceptanceCriteria: '無鏽蝕、變形',
          isRequired: true,
          order: 2
        }
      ]
    }
  ],
  frequency: 'milestone'
});
```

### 3. 記錄缺失

```typescript
// 記錄缺失
const defect = await qaApi.defect.createDefect({
  blueprintId: 'blueprint-123',
  title: '柱體混凝土蜂窩',
  description: '1F A軸柱體出現蜂窩現象，面積約 30x40 cm',
  category: 'workmanship',
  severity: 'major',
  location: {
    buildingId: 'building-1',
    floor: '1F',
    zone: 'A',
    description: 'A軸柱體'
  },
  discoveredBy: 'inspector-1',
  discoveredAt: new Date(),
  photos: [
    {
      id: 'photo-1',
      url: 'https://storage.example.com/defect-photos/photo1.jpg',
      caption: '柱體蜂窩正面',
      takenAt: new Date(),
      takenBy: 'inspector-1'
    }
  ],
  priority: 'high',
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 天內修復
});
```

### 4. 執行現場巡檢

```typescript
// 開始巡檢
const inspection = await qaApi.inspection.startInspection({
  blueprintId: 'blueprint-123',
  inspectionType: 'routine',
  inspector: 'inspector-1',
  inspectorName: 'Wang Inspector',
  checkpoints: [
    {
      checkpointId: 'cp1',
      checkpointName: '基礎工程區',
      status: 'pass',
      findings: [],
      photos: [],
      gpsLocation: { lat: 25.0330, lng: 121.5654 },
      visitedAt: new Date()
    }
  ]
});
```

## 📖 API Reference

### Checklist API

```typescript
interface IChecklistApi {
  // 範本管理
  createTemplate(data: CreateChecklistTemplateData): Promise<ChecklistTemplate>;
  updateTemplate(templateId: string, data: Partial<ChecklistTemplate>): Promise<ChecklistTemplate>;
  getTemplates(blueprintId: string): Observable<ChecklistTemplate[]>;
  
  // 執行檢查
  startExecution(templateId: string, data: StartExecutionData): Promise<ChecklistExecution>;
  submitCheckResult(executionId: string, result: ChecklistResult): Promise<void>;
  completeExecution(executionId: string): Promise<ChecklistExecution>;
  
  // 查詢
  getExecutions(blueprintId: string, filters?: ExecutionFilters): Observable<ChecklistExecution[]>;
  getExecutionById(executionId: string): Observable<ChecklistExecution>;
}
```

### Defect API

```typescript
interface IDefectApi {
  // 缺失管理
  createDefect(data: CreateDefectData): Promise<Defect>;
  updateDefect(defectId: string, data: Partial<Defect>): Promise<Defect>;
  assignDefect(defectId: string, assignedTo: string): Promise<Defect>;
  
  // 狀態更新
  updateDefectStatus(defectId: string, status: DefectStatus, notes?: string): Promise<Defect>;
  markAsFixed(defectId: string, fixData: FixData): Promise<Defect>;
  verifyDefect(defectId: string, verificationData: VerificationData): Promise<Defect>;
  closeDefect(defectId: string): Promise<Defect>;
  
  // 查詢
  getDefects(blueprintId: string, filters?: DefectFilters): Observable<Defect[]>;
  getDefectById(defectId: string): Observable<Defect>;
  getDefectStatistics(blueprintId: string, period?: DateRange): Promise<DefectStatistics>;
}
```

### Inspection API

```typescript
interface IInspectionApi {
  // 計畫管理
  createPlan(data: CreateInspectionPlanData): Promise<InspectionPlan>;
  updatePlan(planId: string, data: Partial<InspectionPlan>): Promise<InspectionPlan>;
  getPlans(blueprintId: string): Observable<InspectionPlan[]>;
  
  // 執行巡檢
  startInspection(data: StartInspectionData): Promise<InspectionRecord>;
  updateCheckpoint(inspectionId: string, checkpointResult: CheckpointResult): Promise<void>;
  completeInspection(inspectionId: string, summary: string): Promise<InspectionRecord>;
  
  // 查詢
  getInspections(blueprintId: string, filters?: InspectionFilters): Observable<InspectionRecord[]>;
  getInspectionById(inspectionId: string): Observable<InspectionRecord>;
}
```

### Report API

```typescript
interface IReportApi {
  // 報告生成
  generateReport(blueprintId: string, config: ReportConfig): Promise<QAReport>;
  updateReport(reportId: string, data: Partial<QAReport>): Promise<QAReport>;
  finalizeReport(reportId: string): Promise<QAReport>;
  
  // 報告匯出
  exportToPDF(reportId: string): Promise<Blob>;
  exportToExcel(reportId: string): Promise<Blob>;
  
  // 報告分發
  distributeReport(reportId: string, recipients: string[]): Promise<void>;
  
  // 查詢
  getReports(blueprintId: string, filters?: ReportFilters): Observable<QAReport[]>;
  getReportById(reportId: string): Observable<QAReport>;
}
```

## 🔧 Configuration

### Module Configuration

```typescript
import { IQAConfig, DEFAULT_QA_CONFIG } from '@core/blueprint/modules/implementations/qa';

const customConfig: IQAConfig = {
  ...DEFAULT_QA_CONFIG,
  features: {
    enableChecklist: true,
    enableDefectManagement: true,
    enableInspection: true,
    enableQAReport: true,
    enablePhotoAnnotation: true,
    enableVoiceRecording: true,
    enableOfflineMode: true
  },
  settings: {
    defectNumberPrefix: 'QA',
    autoAssignDefects: true,
    defectAutoCloseAfterVerification: false,
    maxPhotoSize: 5 * 1024 * 1024, // 5MB
    photoCompression: true,
    enableGPS: true,
    enableWeatherTracking: true
  }
};
```

## 🎯 Event Bus Integration

### Emitted Events

```typescript
const QA_EVENTS = {
  CHECKLIST_COMPLETED: 'QA_CHECKLIST_COMPLETED',
  DEFECT_CREATED: 'QA_DEFECT_CREATED',
  DEFECT_ASSIGNED: 'QA_DEFECT_ASSIGNED',
  DEFECT_FIXED: 'QA_DEFECT_FIXED',
  DEFECT_VERIFIED: 'QA_DEFECT_VERIFIED',
  DEFECT_CLOSED: 'QA_DEFECT_CLOSED',
  CRITICAL_DEFECT_FOUND: 'QA_CRITICAL_DEFECT_FOUND',
  INSPECTION_COMPLETED: 'QA_INSPECTION_COMPLETED',
  REPORT_GENERATED: 'QA_REPORT_GENERATED'
};
```

## 📝 Best Practices

### 1. 檢查表設計

```typescript
// ✅ 好的做法: 結構化的檢查表
const checklist = {
  sections: [
    { name: '施工前檢查', items: [...] },
    { name: '施工中檢查', items: [...] },
    { name: '施工後檢查', items: [...] }
  ]
};
```

### 2. 缺失照片

```typescript
// ✅ 好的做法: 包含標註和說明
const photo = {
  url: 'photo.jpg',
  caption: '柱體蜂窩 - 正面視角',
  annotations: [
    {
      type: 'circle',
      coordinates: { x: 100, y: 150, radius: 50 },
      color: 'red'
    }
  ]
};
```

### 3. 缺失追蹤

```typescript
// ✅ 好的做法: 完整的狀態追蹤
await qaApi.defect.updateDefectStatus(defectId, 'fixing', '承包商已開始修復');
await qaApi.defect.markAsFixed(defectId, {
  fixedBy: 'contractor-1',
  fixDescription: '已重新澆置混凝土',
  fixCost: 5000
});
```

## 🔗 Domain 依賴關係

### 被依賴關係

QA Domain 可能被以下 Domains 使用：
- **Task Domain**: 任務與檢查關聯
- **Acceptance Domain**: 驗收前品質確認

### 依賴關係

QA Domain 依賴：
- **Platform Layer**: Event Bus, Context
- **Log Domain**: 記錄檢查與缺失歷史
- **Workflow Domain**: 缺失修復流程
- **Supabase**: 資料儲存與檔案儲存

## 📚 References

- [Blueprint Container 架構](../../README.md)
- [Event Bus 整合指南](../../../../../docs/blueprint-event-bus-integration.md)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [next.md - Domain 架構說明](../../../../../../next.md)

## 🤝 Contributing

在實作 QA 模組前，請確保：

1. 理解 Blueprint Container 架構
2. 遵循 IBlueprintModule 介面規範
3. 維持零耦合設計原則
4. 正確使用 Event Bus 通訊
5. 添加適當的測試
6. 更新相關文檔

## 📄 License

MIT License - 請參考專案根目錄的 LICENSE 檔案

---

**Maintained by**: GigHub Development Team  
**Last Updated**: 2025-12-16  
**Domain Priority**: P2 (必要)  
**Contact**: 請透過專案 GitHub Issues 回報問題

---

## 📦 SETC-040 ~ SETC-045: Defect Management Integration

> **狀態**: ✅ 已完成  
> **實作日期**: 2025-12-16

### 新增服務

| 服務 | 檔案 | 描述 |
|------|------|------|
| DefectLifecycleService | `services/defect-lifecycle.service.ts` | 缺失生命週期管理 |
| DefectResolutionService | `services/defect-resolution.service.ts` | 缺失整改流程 |
| DefectReinspectionService | `services/defect-reinspection.service.ts` | 缺失複驗管理 |
| DefectIssueIntegrationService | `services/defect-issue-integration.service.ts` | 缺失-Issue 整合 |

### 功能說明

#### 1. DefectLifecycleService (SETC-041)
- QC 失敗自動建立缺失
- 狀態機管理 (open → assigned → in_progress → resolved → verified → closed)
- 責任人分配
- 期限管理

#### 2. DefectResolutionService (SETC-042)
- 開始整改流程
- 進度追蹤與更新
- 完成整改回報
- 附件/照片管理

#### 3. DefectReinspectionService (SETC-043)
- 複驗排程安排
- 執行複驗驗證
- 通過/不通過處理
- 多次複驗追蹤

#### 4. DefectIssueIntegrationService (SETC-044)
- 嚴重缺失自動建立 Issue
- 雙向狀態同步
- 關聯追蹤

### 使用範例

```typescript
import { 
  DefectLifecycleService,
  DefectResolutionService,
  DefectReinspectionService,
  DefectIssueIntegrationService 
} from '@core/blueprint/modules/implementations/qa';

// 1. QC 失敗自動建立缺失
const defects = await defectLifecycleService.autoCreateFromQCInspection(
  inspection,
  failedItems,
  actor
);

// 2. 指派責任人
await defectLifecycleService.assignResponsible(
  blueprintId,
  defectId,
  responsibleUserId,
  actor
);

// 3. 開始整改
await defectResolutionService.startResolution(
  blueprintId,
  defectId,
  { plan: '修復計畫', estimatedCompletionDate: new Date() },
  actor
);

// 4. 完成整改
await defectResolutionService.completeResolution(
  blueprintId,
  defectId,
  { summary: '已完成修復', photos: [] },
  actor
);

// 5. 安排複驗
const reinspection = await defectReinspectionService.scheduleReinspection(
  blueprintId,
  defectId,
  { scheduledDate: new Date(), inspectorId: 'inspector-001' },
  actor
);

// 6. 執行複驗
await defectReinspectionService.performReinspection(
  reinspection.id,
  { result: 'pass', notes: '複驗通過' },
  actor
);

// 7. 嚴重缺失自動建立 Issue
if (defectIssueIntegrationService.shouldAutoCreateIssue(defect)) {
  await defectIssueIntegrationService.autoCreateIssueFromDefect(
    blueprintId,
    defectId,
    actor
  );
}
```
