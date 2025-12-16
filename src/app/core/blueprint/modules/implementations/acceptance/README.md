# Acceptance Domain (驗收域)

> **Domain ID**: `acceptance`  
> **Version**: 1.0.0  
> **Status**: Ready for Implementation  
> **Architecture**: Blueprint Container Module  
> **Priority**: P2 (必要)

## 📋 Overview

驗收域負責正式驗收流程管理，與 QA Domain 分開，流程更正式。提供驗收申請、驗收審核、初驗、複驗及驗收結論等功能。本模組遵循 Blueprint Container 架構設計，實現零耦合、可擴展的模組化設計。

### 業務範圍

正式驗收流程（與 QA 分開，流程更正式），包括：
- 驗收申請提交與資料管理
- 驗收審核流程與審核意見
- 初驗流程與記錄
- 複驗流程與缺失改善確認
- 驗收結論判定與證明文件

### 核心特性

- ✅ **正式驗收流程**: 規範化的驗收作業流程
- ✅ **多階段驗收**: 初驗、複驗、正式驗收
- ✅ **驗收文件管理**: 完整的驗收文件與簽核記錄
- ✅ **缺失追蹤**: 驗收發現的缺失追蹤與改善
- ✅ **證明文件**: 自動生成驗收證明與相關文件
- ✅ **零耦合設計**: 透過 Event Bus 與其他模組通訊
- ✅ **完整生命週期管理**: 實作 IBlueprintModule 介面

### 設計原則

1. **正式流程**: 比 QA 檢查更正式的驗收程序
2. **文件完整**: 所有驗收都需要完整文件記錄
3. **多方簽核**: 支援業主、監造、承包商等多方簽核
4. **法律效力**: 驗收文件具法律效力

## 🏗️ Architecture

### Domain 結構

```
acceptance/
├── acceptance.module.ts              # Domain 主模塊 (實作 IBlueprintModule)
├── module.metadata.ts                # Domain 元資料
├── acceptance.repository.ts          # 共用資料存取層
├── acceptance.routes.ts              # Domain 路由配置
├── services/                         # Sub-Module Services
│   ├── acceptance-request.service.ts # Sub-Module: Acceptance Request
│   ├── acceptance-review.service.ts  # Sub-Module: Acceptance Review
│   ├── preliminary.service.ts        # Sub-Module: Preliminary Acceptance
│   ├── re-inspection.service.ts      # Sub-Module: Re-inspection
│   └── conclusion.service.ts         # Sub-Module: Acceptance Conclusion
├── models/                           # Domain 模型
│   ├── acceptance-request.model.ts
│   ├── acceptance-review.model.ts
│   ├── preliminary-acceptance.model.ts
│   ├── re-inspection.model.ts
│   └── acceptance-conclusion.model.ts
├── views/                            # Domain UI 元件
│   ├── acceptance-request/
│   ├── acceptance-review/
│   ├── preliminary/
│   └── conclusion/
├── config/
│   └── acceptance.config.ts          # 模組配置
├── exports/
│   └── acceptance-api.exports.ts     # 公開 API
├── index.ts                          # 統一匯出
└── README.md                         # 本文件
```

## 📦 Sub-Modules (子模塊)

### 1️⃣ Acceptance Request Sub-Module (驗收申請)

**職責**: 驗收申請提交與申請資料管理

**核心功能**:
- 驗收申請單建立
- 申請資料填寫與上傳
- 申請單提交與撤回
- 申請單審查
- 申請狀態追蹤

**資料模型**:
```typescript
interface AcceptanceRequest {
  id: string;
  blueprintId: string;
  requestNumber: string;        // 驗收申請編號
  requestType: AcceptanceType;  // 'preliminary' | 'final' | 'partial' | 'phased'
  
  // 申請資訊
  title: string;
  description: string;
  scope: AcceptanceScope;       // 驗收範圍
  workItems: WorkItem[];        // 驗收工項
  
  // 關聯資訊
  taskIds?: string[];           // 關聯的任務
  contractId?: string;          // 合約編號
  phase?: string;               // 工程階段
  
  // 申請方
  requestedBy: string;
  requestedByName: string;
  requestedByRole: RequestorRole; // 'contractor' | 'subcontractor' | 'owner'
  requestedAt: Date;
  
  // 文件
  requiredDocuments: DocumentRequirement[];
  submittedDocuments: SubmittedDocument[];
  
  // 狀態
  status: RequestStatus;        // 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'withdrawn'
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  
  // 排程
  proposedDate?: Date;
  scheduledDate?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

interface AcceptanceScope {
  buildingIds?: string[];
  floors?: string[];
  zones?: string[];
  areaDescription?: string;
  estimatedArea?: number;
  estimatedValue?: number;
}

interface WorkItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  unit: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  completionPercentage: number;
  isComplete: boolean;
}

interface DocumentRequirement {
  id: string;
  name: string;
  description?: string;
  isRequired: boolean;
  category: DocumentCategory;   // 'drawing' | 'specification' | 'test_report' | 'certificate' | 'photo'
}

interface SubmittedDocument {
  requirementId: string;
  documentName: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: Date;
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  verificationNotes?: string;
}
```

### 2️⃣ Acceptance Review Sub-Module (驗收審核)

**職責**: 驗收審核流程與審核意見記錄

**核心功能**:
- 申請案審核
- 審核意見記錄
- 文件審查
- 審核結果通知
- 審核歷史查詢

**資料模型**:
```typescript
interface AcceptanceReview {
  id: string;
  requestId: string;
  blueprintId: string;
  
  // 審核資訊
  reviewType: ReviewType;       // 'document' | 'technical' | 'administrative' | 'final'
  reviewers: Reviewer[];
  reviewStartedAt: Date;
  reviewCompletedAt?: Date;
  
  // 審核結果
  overallDecision: ReviewDecision; // 'approved' | 'conditionally_approved' | 'rejected' | 'requires_revision'
  reviewItems: ReviewItem[];
  
  // 審核意見
  generalComments?: string;
  technicalComments?: string;
  administrativeComments?: string;
  
  // 條件與要求
  conditions?: AcceptanceCondition[];
  requirements?: AcceptanceRequirement[];
  
  // 簽核
  signatures: ReviewSignature[];
  
  createdAt: Date;
  updatedAt: Date;
}

interface Reviewer {
  userId: string;
  userName: string;
  role: ReviewerRole;           // 'owner_representative' | 'designer' | 'supervisor' | 'consultant'
  organization: string;
  isRequired: boolean;
  hasReviewed: boolean;
  reviewedAt?: Date;
}

interface ReviewItem {
  id: string;
  category: string;
  item: string;
  status: ItemStatus;           // 'pass' | 'fail' | 'conditional' | 'na'
  comments?: string;
  requiresAction: boolean;
  actionDescription?: string;
}

interface AcceptanceCondition {
  id: string;
  description: string;
  priority: ConditionPriority;  // 'critical' | 'major' | 'minor'
  dueDate?: Date;
  assignedTo?: string;
  status: ConditionStatus;      // 'open' | 'in_progress' | 'resolved' | 'verified'
}

interface ReviewSignature {
  reviewerId: string;
  reviewerName: string;
  role: string;
  signedAt: Date;
  signature: string;            // Digital signature or image URL
  comments?: string;
}
```

### 3️⃣ Preliminary Acceptance Sub-Module (初驗)

**職責**: 初驗流程與記錄

**核心功能**:
- 初驗排程
- 初驗執行與記錄
- 初驗缺失記錄
- 初驗報告生成
- 初驗證明文件

**資料模型**:
```typescript
interface PreliminaryAcceptance {
  id: string;
  requestId: string;
  blueprintId: string;
  acceptanceNumber: string;     // 初驗編號
  
  // 初驗資訊
  acceptanceDate: Date;
  acceptanceLocation: string;
  attendees: AcceptanceAttendee[];
  
  // 檢查項目
  inspectionItems: InspectionItem[];
  checkResults: PreliminaryCheckResult[];
  
  // 初驗結果
  overallResult: AcceptanceResult; // 'passed' | 'passed_with_conditions' | 'failed'
  passRate: number;
  defectsFound: number;
  defectsList: PreliminaryDefect[];
  
  // 測試與檢驗
  tests: AcceptanceTest[];
  measurements: Measurement[];
  
  // 文件
  photos: AcceptancePhoto[];
  videos?: AcceptanceVideo[];
  documents: string[];
  
  // 意見與建議
  findings: string[];
  recommendations: string[];
  ownerComments?: string;
  supervisorComments?: string;
  contractorResponse?: string;
  
  // 後續行動
  followUpActions: FollowUpAction[];
  nextSteps?: string;
  reInspectionRequired: boolean;
  reInspectionDate?: Date;
  
  // 簽核
  signatures: AcceptanceSignature[];
  
  // 報告
  reportGenerated: boolean;
  reportUrl?: string;
  reportGeneratedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

interface AcceptanceAttendee {
  userId: string;
  userName: string;
  role: AttendeeRole;           // 'owner' | 'supervisor' | 'contractor' | 'designer' | 'consultant'
  organization: string;
  title: string;
  isRequired: boolean;
  attended: boolean;
  signature?: string;
}

interface InspectionItem {
  id: string;
  category: string;
  item: string;
  standard: string;
  acceptanceCriteria: string;
  priority: ItemPriority;       // 'critical' | 'major' | 'minor'
}

interface PreliminaryCheckResult {
  itemId: string;
  itemName: string;
  result: CheckResultType;      // 'passed' | 'failed' | 'conditional' | 'na'
  measuredValue?: any;
  standardValue?: any;
  deviation?: number;
  notes?: string;
  photos?: string[];
  checkedBy: string;
  checkedAt: Date;
}

interface PreliminaryDefect {
  id: string;
  defectNumber: string;
  description: string;
  location: string;
  severity: DefectSeverity;     // 'critical' | 'major' | 'minor'
  photos: string[];
  requiresFixing: boolean;
  estimatedFixDuration?: number;
  assignedTo?: string;
}

interface AcceptanceTest {
  id: string;
  testName: string;
  testType: TestType;           // 'material' | 'structural' | 'functional' | 'performance'
  standard: string;
  result: TestResult;           // 'passed' | 'failed' | 'inconclusive'
  testValue?: any;
  acceptableRange?: string;
  testDate: Date;
  testedBy: string;
  certificateUrl?: string;
}

interface Measurement {
  id: string;
  item: string;
  designValue: number;
  actualValue: number;
  tolerance: number;
  unit: string;
  withinTolerance: boolean;
  measuredBy: string;
  measuredAt: Date;
}
```

### 4️⃣ Re-inspection Sub-Module (複驗)

**職責**: 複驗流程與缺失改善確認

**核心功能**:
- 複驗排程
- 缺失改善確認
- 複驗記錄
- 複驗報告
- 複驗證明

**資料模型**:
```typescript
interface ReInspection {
  id: string;
  preliminaryAcceptanceId: string;
  blueprintId: string;
  reInspectionNumber: string;   // 複驗編號
  reInspectionRound: number;    // 第幾次複驗
  
  // 複驗資訊
  reInspectionDate: Date;
  attendees: AcceptanceAttendee[];
  
  // 改善確認
  defectResolutions: DefectResolution[];
  conditionVerifications: ConditionVerification[];
  
  // 複驗結果
  overallResult: ReInspectionResult; // 'passed' | 'failed' | 'requires_another_reinspection'
  resolvedDefects: number;
  unresolvedDefects: number;
  newDefectsFound: number;
  
  // 新發現問題
  newDefects?: PreliminaryDefect[];
  additionalRequirements?: string[];
  
  // 文件
  photos: AcceptancePhoto[];
  comparisonPhotos?: ComparisonPhoto[];
  documents: string[];
  
  // 意見
  findings: string[];
  verificationComments?: string;
  contractorExplanation?: string;
  
  // 後續
  finalAcceptanceRecommended: boolean;
  additionalWorkRequired?: string[];
  nextReInspectionDate?: Date;
  
  // 簽核
  signatures: AcceptanceSignature[];
  
  // 報告
  reportUrl?: string;
  reportGeneratedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

interface DefectResolution {
  defectId: string;
  defectNumber: string;
  originalDescription: string;
  
  // 改善資訊
  resolutionMethod: string;
  resolutionDate: Date;
  resolvedBy: string;
  resolutionCost?: number;
  
  // 驗證
  verificationResult: VerificationResult; // 'acceptable' | 'unacceptable' | 'requires_improvement'
  verificationNotes?: string;
  verifiedBy: string;
  verifiedAt: Date;
  
  // 前後對比
  beforePhotos: string[];
  afterPhotos: string[];
}

interface ConditionVerification {
  conditionId: string;
  conditionDescription: string;
  
  // 執行狀況
  completionStatus: CompletionStatus; // 'completed' | 'partially_completed' | 'not_completed'
  completionEvidence: string[];
  completionDate?: Date;
  
  // 驗證
  verificationResult: VerificationResult;
  verificationNotes?: string;
  verifiedBy: string;
  verifiedAt: Date;
}

interface ComparisonPhoto {
  defectId: string;
  beforePhotoUrl: string;
  afterPhotoUrl: string;
  caption?: string;
  annotated?: boolean;
}
```

### 5️⃣ Acceptance Conclusion Sub-Module (驗收結論)

**職責**: 驗收結果判定與證明文件生成

**核心功能**:
- 驗收結果判定
- 驗收證明文件生成
- 驗收報告彙整
- 驗收證書核發
- 驗收資料歸檔

**資料模型**:
```typescript
interface AcceptanceConclusion {
  id: string;
  requestId: string;
  blueprintId: string;
  conclusionNumber: string;     // 驗收結論編號
  
  // 驗收歷程
  preliminaryAcceptanceId: string;
  reInspectionIds?: string[];
  totalInspectionRounds: number;
  
  // 最終結論
  finalDecision: FinalDecision; // 'accepted' | 'conditionally_accepted' | 'rejected'
  acceptanceDate: Date;
  effectiveDate: Date;
  
  // 驗收摘要
  scope: AcceptanceScope;
  workItemsSummary: WorkItemSummary[];
  overallQualityRating: QualityRating; // 'excellent' | 'good' | 'acceptable' | 'poor'
  
  // 缺失摘要
  totalDefectsFound: number;
  totalDefectsResolved: number;
  outstandingDefects: number;
  outstandingDefectsList?: PreliminaryDefect[];
  
  // 條件與限制
  acceptanceConditions?: AcceptanceCondition[];
  warranties?: WarrantyItem[];
  maintenanceRequirements?: MaintenanceRequirement[];
  
  // 財務
  acceptedAmount: number;
  retainageAmount?: number;
  retainageReleaseConditions?: string[];
  
  // 證明文件
  certificates: Certificate[];
  
  // 簽核
  finalSignatures: FinalSignature[];
  
  // 報告
  finalReportUrl?: string;
  summaryReportUrl?: string;
  
  // 備註
  notes?: string;
  specialConditions?: string[];
  
  // 後續
  warrantyPeriodStart: Date;
  warrantyPeriodEnd: Date;
  maintenanceGuidanceProvided: boolean;
  operationalHandoverComplete: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

interface WorkItemSummary {
  workItemId: string;
  workItemName: string;
  plannedQuantity: number;
  acceptedQuantity: number;
  acceptanceRate: number;
  qualityGrade: QualityGrade;   // 'A' | 'B' | 'C' | 'D'
  notes?: string;
}

interface WarrantyItem {
  id: string;
  itemName: string;
  description: string;
  warrantyPeriod: number;       // 保固期（月）
  warrantyStartDate: Date;
  warrantyEndDate: Date;
  warrantyConditions?: string[];
}

interface MaintenanceRequirement {
  id: string;
  item: string;
  frequency: string;
  description: string;
  responsibility: MaintenanceResponsibility; // 'owner' | 'contractor' | 'third_party'
}

interface Certificate {
  id: string;
  type: CertificateType;        // 'acceptance_certificate' | 'completion_certificate' | 'test_certificate'
  name: string;
  certificateNumber: string;
  issueDate: Date;
  expiryDate?: Date;
  issuedBy: string;
  fileUrl: string;
  digitalSignature?: string;
}

interface FinalSignature {
  signerId: string;
  signerName: string;
  role: SignerRole;             // 'owner' | 'supervisor' | 'contractor' | 'designer'
  organization: string;
  title: string;
  signedAt: Date;
  signature: string;
  seal?: string;                // 印章圖片
  comments?: string;
}
```

## 🚀 Quick Start

### 1. 載入模組到 Blueprint Container

```typescript
import { BlueprintContainer } from '@core/blueprint/container/blueprint-container';
import { AcceptanceModule } from '@core/blueprint/modules/implementations/acceptance';

// 初始化容器
const container = new BlueprintContainer(config);
await container.initialize();

// 載入驗收模組
const acceptanceModule = new AcceptanceModule();
await container.loadModule(acceptanceModule);

// 啟動容器
await container.start();
```

### 2. 提交驗收申請

```typescript
import { IAcceptanceModuleApi } from '@core/blueprint/modules/implementations/acceptance';

// 取得驗收模組 API
const acceptanceApi = context.resources.getModule('acceptance')?.exports as IAcceptanceModuleApi;

// 建立驗收申請
const request = await acceptanceApi.acceptanceRequest.createRequest({
  blueprintId: 'blueprint-123',
  requestType: 'preliminary',
  title: '地下室結構工程初驗申請',
  description: 'B1-B3 地下室結構體工程驗收',
  scope: {
    buildingIds: ['building-1'],
    floors: ['B1', 'B2', 'B3'],
    areaDescription: '地下室結構體',
    estimatedArea: 3000,
    estimatedValue: 15000000
  },
  workItems: [
    {
      id: 'wi1',
      code: '03100',
      name: '鋼筋工程',
      unit: 'ton',
      quantity: 120,
      completionPercentage: 100,
      isComplete: true
    },
    {
      id: 'wi2',
      code: '03200',
      name: '混凝土工程',
      unit: 'm³',
      quantity: 800,
      completionPercentage: 100,
      isComplete: true
    }
  ],
  requestedBy: 'contractor-1',
  requestedByName: 'ABC Construction',
  requestedByRole: 'contractor',
  proposedDate: new Date('2025-12-20')
});
```

### 3. 執行初驗

```typescript
// 執行初驗
const preliminary = await acceptanceApi.preliminary.conductAcceptance({
  requestId: request.id,
  blueprintId: 'blueprint-123',
  acceptanceDate: new Date(),
  attendees: [
    {
      userId: 'owner-1',
      userName: 'Owner Rep',
      role: 'owner',
      organization: 'Owner Company',
      title: 'Project Manager',
      isRequired: true,
      attended: true
    },
    {
      userId: 'supervisor-1',
      userName: 'Supervisor',
      role: 'supervisor',
      organization: 'Supervision Company',
      title: 'Chief Inspector',
      isRequired: true,
      attended: true
    }
  ],
  checkResults: [
    {
      itemId: 'check-1',
      itemName: '鋼筋間距',
      result: 'passed',
      standardValue: '150mm',
      measuredValue: '148mm',
      deviation: -2,
      checkedBy: 'inspector-1',
      checkedAt: new Date()
    }
  ],
  overallResult: 'passed_with_conditions'
});
```

## 📖 API Reference

### Acceptance Request API

```typescript
interface IAcceptanceRequestApi {
  createRequest(data: CreateAcceptanceRequestData): Promise<AcceptanceRequest>;
  updateRequest(requestId: string, data: Partial<AcceptanceRequest>): Promise<AcceptanceRequest>;
  submitRequest(requestId: string): Promise<AcceptanceRequest>;
  withdrawRequest(requestId: string, reason: string): Promise<AcceptanceRequest>;
  getRequests(blueprintId: string, filters?: RequestFilters): Observable<AcceptanceRequest[]>;
}
```

### Acceptance Review API

```typescript
interface IAcceptanceReviewApi {
  startReview(requestId: string, reviewers: Reviewer[]): Promise<AcceptanceReview>;
  submitReviewItem(reviewId: string, item: ReviewItem): Promise<void>;
  completeReview(reviewId: string, decision: ReviewDecision): Promise<AcceptanceReview>;
  addSignature(reviewId: string, signature: ReviewSignature): Promise<void>;
}
```

### Preliminary Acceptance API

```typescript
interface IPreliminaryAcceptanceApi {
  conductAcceptance(data: ConductPreliminaryData): Promise<PreliminaryAcceptance>;
  recordDefect(acceptanceId: string, defect: PreliminaryDefect): Promise<void>;
  generateReport(acceptanceId: string): Promise<string>; // Report URL
}
```

### Re-inspection API

```typescript
interface IReInspectionApi {
  scheduleReInspection(preliminaryId: string, date: Date): Promise<ReInspection>;
  verifyDefectResolution(reInspectionId: string, resolution: DefectResolution): Promise<void>;
  completeReInspection(reInspectionId: string, result: ReInspectionResult): Promise<ReInspection>;
}
```

### Acceptance Conclusion API

```typescript
interface IAcceptanceConclusionApi {
  generateConclusion(requestId: string, decision: FinalDecision): Promise<AcceptanceConclusion>;
  issueCertificate(conclusionId: string, certificateType: CertificateType): Promise<Certificate>;
  finalizeAcceptance(conclusionId: string): Promise<AcceptanceConclusion>;
}
```

## 🔧 Configuration

```typescript
import { IAcceptanceConfig, DEFAULT_ACCEPTANCE_CONFIG } from '@core/blueprint/modules/implementations/acceptance';

const customConfig: IAcceptanceConfig = {
  ...DEFAULT_ACCEPTANCE_CONFIG,
  features: {
    enableAcceptanceRequest: true,
    enableAcceptanceReview: true,
    enablePreliminaryAcceptance: true,
    enableReInspection: true,
    enableAcceptanceConclusion: true,
    enableDigitalSignature: true,
    enableCertificateGeneration: true
  },
  settings: {
    requestNumberPrefix: 'ACC',
    maxReInspectionRounds: 3,
    warrantDefaultPeriod: 12,
    requireDigitalSignatures: true,
    autoGenerateCertificates: true
  }
};
```

## 🎯 Event Bus Integration

```typescript
const ACCEPTANCE_EVENTS = {
  REQUEST_SUBMITTED: 'ACCEPTANCE_REQUEST_SUBMITTED',
  REQUEST_APPROVED: 'ACCEPTANCE_REQUEST_APPROVED',
  PRELIMINARY_COMPLETED: 'ACCEPTANCE_PRELIMINARY_COMPLETED',
  REINSPECTION_REQUIRED: 'ACCEPTANCE_REINSPECTION_REQUIRED',
  REINSPECTION_COMPLETED: 'ACCEPTANCE_REINSPECTION_COMPLETED',
  ACCEPTANCE_FINALIZED: 'ACCEPTANCE_FINALIZED',
  CERTIFICATE_ISSUED: 'ACCEPTANCE_CERTIFICATE_ISSUED'
};
```

## 🔗 Domain 依賴關係

### 被依賴關係

Acceptance Domain 通常是流程終點，較少被其他 Domain 依賴。

### 依賴關係

Acceptance Domain 依賴：
- **Platform Layer**: Event Bus, Context
- **QA Domain**: 品質檢查結果
- **Log Domain**: 記錄驗收歷程
- **Workflow Domain**: 驗收審核流程
- **Task Domain**: 關聯的任務資訊
- **Supabase**: 資料儲存與文件儲存

## 📚 References

- [Blueprint Container 架構](../../README.md)
- [Event Bus 整合指南](../../../../../docs/blueprint-event-bus-integration.md)
- [next.md - Domain 架構說明](../../../../../../next.md)

## 📄 License

MIT License - 請參考專案根目錄的 LICENSE 檔案

---

**Maintained by**: GigHub Development Team  
**Last Updated**: 2025-12-13  
**Domain Priority**: P2 (必要)  
**Contact**: 請透過專案 GitHub Issues 回報問題
