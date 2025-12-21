# SETC-000-07: Issue Module (問題追蹤模組)

> **模組 ID**: `issue`  
> **版本**: 1.0.0  
> **狀態**: ✅ 已實作完成 (Foundation + Event Integration)  
> **優先級**: P1 (必要)  
> **架構**: Blueprint Container Module  
> **歸檔日期**: 2025-12-16

---

## 📋 模組概述

獨立的問題管理模組，支援手動建立與多來源自動生成。提供統一的問題追蹤系統，整合來自驗收失敗、品質檢查失敗、保固缺失、安全事故等多種來源的問題。

### 業務範圍

統一的問題追蹤與管理，包括：
- 手動建立問題單
- 從驗收失敗自動生成
- 從品質檢查失敗自動生成
- 從保固缺失自動生成
- 從安全事故自動生成
- 問題解決工作流程
- 問題驗證工作流程

### 核心特性

- ✅ **手動建立**: 使用者可直接透過 UI 建立問題單
- ✅ **多來源自動建立**: 支援從多個來源自動生成問題單
- ✅ **完整生命週期**: open → in_progress → resolved → verified → closed
- ✅ **解決工作流程**: 結構化的問題解決流程
- ✅ **驗證工作流程**: 解決後的品質驗證流程
- ✅ **零耦合設計**: 透過 Event Bus 與其他模組通訊
- ✅ **完整生命週期管理**: 實作 IBlueprintModule 介面

### 設計原則

1. **統一入口**: 所有問題都透過統一系統管理
2. **來源追溯**: 記錄問題來源以便追溯
3. **工作流程化**: 標準化的解決與驗證流程
4. **事件驅動**: 透過事件自動建立與更新

---

## 🏗️ 架構設計

### 目錄結構

```
issue/
├── models/                           # Domain models and TypeScript interfaces
│   ├── issue.model.ts
│   ├── issue-resolution.model.ts
│   └── issue-verification.model.ts
├── services/                         # Business logic services
│   ├── issue-management.service.ts   # CRUD operations
│   ├── issue-creation.service.ts     # Auto-creation from sources
│   ├── issue-resolution.service.ts   # Resolution workflows
│   ├── issue-verification.service.ts # Verification workflows
│   ├── issue-lifecycle.service.ts    # State management
│   └── issue-event.service.ts        # Event Bus integration
├── repositories/                     # Data access layer (Firestore)
│   └── issue.repository.ts
├── config/                           # Module configuration
│   └── issue.config.ts
├── exports/                          # Public API definitions
│   └── issue-api.exports.ts
├── components/                       # UI components
│   ├── issue-list/
│   ├── issue-detail/
│   └── issue-form/
├── issue.module.ts                   # Angular module
├── module.metadata.ts                # Module metadata
├── index.ts                          # Unified export
└── README.md                         # Module documentation
```

---

## 📦 子模組 (Sub-Modules)

### 1️⃣ Issue Management Sub-Module (問題管理)

**職責**: CRUD operations for manual issue management

**核心功能**:
- 建立問題單
- 編輯問題單
- 刪除問題單
- 查詢問題單
- 指派問題單

**資料模型**:
```typescript
interface Issue {
  id: string;
  blueprintId: string;
  issueNumber: string;
  title: string;
  description: string;
  
  // 來源資訊
  source: IssueSource;        // 'manual' | 'acceptance' | 'qc' | 'warranty' | 'safety'
  sourceId?: string;          // 來源記錄 ID
  
  // 分類與等級
  category: IssueCategory;    // 'quality' | 'safety' | 'schedule' | 'cost' | 'other'
  severity: IssueSeverity;    // 'critical' | 'major' | 'minor'
  priority: IssuePriority;    // 'urgent' | 'high' | 'medium' | 'low'
  
  // 狀態與工作流程
  status: IssueStatus;        // 'open' | 'in_progress' | 'resolved' | 'verified' | 'closed'
  
  // 責任與指派
  responsibleParty?: string;
  assignedTo?: string;
  assignedToName?: string;
  
  // 解決資訊
  resolution?: IssueResolution;
  
  // 驗證資訊
  verification?: IssueVerification;
  
  // 位置與附件
  location?: string;
  attachments?: string[];
  
  // 審計
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt: Date;
  closedAt?: Date;
}
```

### 2️⃣ Issue Creation Sub-Module (問題建立)

**職責**: Auto-creation from multiple sources

**核心功能**:
- 從驗收失敗自動建立
- 從品質檢查失敗自動建立
- 從保固缺失自動建立
- 從安全事故自動建立
- 批次建立問題單

**自動建立規則**:
```typescript
interface AutoCreationRule {
  sourceType: IssueSource;
  condition: (data: any) => boolean;
  severityMapping: (data: any) => IssueSeverity;
  categoryMapping: (data: any) => IssueCategory;
  titleTemplate: (data: any) => string;
  descriptionTemplate: (data: any) => string;
}
```

### 3️⃣ Issue Resolution Sub-Module (問題解決)

**職責**: Resolution workflows (problem fixing)

**核心功能**:
- 開始解決問題
- 記錄解決過程
- 上傳解決證明
- 標記為已解決

**資料模型**:
```typescript
interface IssueResolution {
  resolvedBy: string;
  resolvedByName: string;
  resolvedAt: Date;
  resolutionMethod: string;
  resolutionDescription: string;
  resolutionProof?: string[];   // 解決證明文件
  cost?: number;
  duration?: number;            // 解決耗時（小時）
}
```

### 4️⃣ Issue Verification Sub-Module (問題驗證)

**職責**: Verification workflows (quality checks)

**核心功能**:
- 驗證問題解決
- 記錄驗證結果
- 通過或退回
- 結案處理

**資料模型**:
```typescript
interface IssueVerification {
  verifiedBy: string;
  verifiedByName: string;
  verifiedAt: Date;
  verificationResult: VerificationResult;  // 'pass' | 'fail'
  verificationNotes?: string;
  verificationProof?: string[];
}
```

### 5️⃣ Issue Lifecycle Sub-Module (生命週期)

**職責**: State transition management

**狀態機**:
```
open → in_progress → resolved → verified → closed
  ↓                      ↓          ↓
cancelled           reopened    failed
```

### 6️⃣ Issue Event Sub-Module (事件整合)

**職責**: Event subscription and emission

**訂閱事件**:
- `acceptance.failed` → 建立問題單
- `qa.defect.created` → 建立問題單 (依嚴重程度)
- `warranty.defect.created` → 建立問題單
- `safety.incident.created` → 建立問題單

---

## 🔌 公開 API

### IIssueModuleApi

```typescript
interface IIssueModuleApi {
  management: IIssueManagementApi;
  creation: IIssueCreationApi;
  resolution: IIssueResolutionApi;
  verification: IIssueVerificationApi;
  lifecycle: IIssueLifecycleApi;
  event: IIssueEventApi;
}
```

### IIssueCreationApi

```typescript
interface IIssueCreationApi {
  createFromAcceptance(acceptanceId: string, failureDetails: any): Promise<Issue>;
  createFromQC(defectId: string): Promise<Issue>;
  createFromWarranty(warrantyDefectId: string): Promise<Issue>;
  createFromSafety(incidentId: string): Promise<Issue>;
  batchCreate(sources: IssueSource[]): Promise<Issue[]>;
}
```

---

## 📡 事件整合

### 訂閱事件並自動建立問題

```typescript
// 訂閱驗收失敗事件
this.eventBus.on('acceptance.failed')
  .pipe(takeUntilDestroyed(this.destroyRef))
  .subscribe(async event => {
    const issue = await this.issueCreationService.createFromAcceptance(
      event.data.acceptanceId,
      event.data.failureDetails
    );
    console.log('Auto-created issue from acceptance:', issue);
  });

// 訂閱 QA 缺失事件
this.eventBus.on('qa.defect.created')
  .pipe(takeUntilDestroyed(this.destroyRef))
  .subscribe(async event => {
    // 只有嚴重程度達標才建立問題單
    if (event.data.severity === 'critical' || event.data.severity === 'major') {
      const issue = await this.issueCreationService.createFromQC(
        event.data.defectId
      );
      console.log('Auto-created issue from QC:', issue);
    }
  });
```

### 發送問題事件

```typescript
// 問題建立事件
this.eventBus.emit({
  type: 'issue.created',
  blueprintId: issue.blueprintId,
  timestamp: new Date(),
  actor: userId,
  data: { 
    issueId: issue.id,
    source: issue.source,
    severity: issue.severity
  }
});

// 問題解決事件
this.eventBus.emit({
  type: 'issue.resolved',
  blueprintId: issue.blueprintId,
  timestamp: new Date(),
  actor: userId,
  data: { issueId: issue.id }
});

// 問題驗證通過事件
this.eventBus.emit({
  type: 'issue.verified',
  blueprintId: issue.blueprintId,
  timestamp: new Date(),
  actor: userId,
  data: { issueId: issue.id, result: 'pass' }
});
```

---

## 🚀 使用範例

### 1. 手動建立問題單

```typescript
const issue = await this.issueManagementService.createIssue({
  blueprintId: 'bp-001',
  title: '牆面裂縫',
  description: '客廳西側牆面發現裂縫，長度約 50cm',
  location: '客廳西側',
  severity: 'major',
  category: 'quality',
  responsibleParty: 'contractor-001',
  createdBy: 'user-001'
});
```

### 2. 從驗收失敗自動建立

```typescript
// 驗收失敗時自動觸發
const issue = await this.issueCreationService.createFromAcceptance(
  'acceptance-123',
  {
    failureReason: '混凝土強度不足',
    location: '2F 樑柱',
    photos: ['photo-url-1', 'photo-url-2']
  }
);
```

### 3. 解決問題工作流程

```typescript
// 開始處理問題
await this.issueLifecycleService.startProgress(issue.id, 'worker-001');

// 記錄解決過程
await this.issueResolutionService.resolve(issue.id, {
  resolvedBy: 'worker-001',
  resolvedByName: '李師傅',
  resolutionMethod: '重新施作',
  resolutionDescription: '打除原有粉刷層，重新粉刷',
  resolutionProof: ['repair-photo-1.jpg', 'repair-photo-2.jpg'],
  cost: 5000,
  duration: 4
});

// 驗證解決結果
await this.issueVerificationService.verify(issue.id, {
  verifiedBy: 'inspector-001',
  verifiedByName: '王驗收員',
  verificationResult: 'pass',
  verificationNotes: '已確認修復完成，品質符合要求'
});

// 結案
await this.issueLifecycleService.close(issue.id);
```

---

## 🧪 測試

### 單元測試

```bash
# 執行問題模組單元測試
yarn test --include="**/issue/**/*.spec.ts"
```

### 測試覆蓋範圍

- ✅ **issue-lifecycle.service.spec.ts**: 狀態轉換驗證測試
- ✅ **issue-management.service.spec.ts**: CRUD 操作測試
- ✅ **issue-creation.service.spec.ts**: 自動建立測試 (4 個來源)

---

## 📝 事件類型

所有事件都以 `issue.` 為前綴：

- `issue.created` - 手動建立問題單
- `issue.created_from_acceptance` - 從驗收失敗建立
- `issue.created_from_qc` - 從 QC 失敗建立
- `issue.created_from_warranty` - 從保固缺失建立
- `issue.created_from_safety` - 從安全事故建立
- `issue.updated` - 問題單更新
- `issue.assigned` - 問題單指派
- `issue.resolved` - 問題解決
- `issue.verified` - 問題驗證
- `issue.verification_failed` - 驗證失敗
- `issue.closed` - 問題結案

---

## 📝 待實作功能

1. ⏳ **問題分析**: 問題統計與趨勢分析
2. ⏳ **問題範本**: 常見問題範本庫
3. ⏳ **SLA 管理**: 問題解決時效管理
4. ⏳ **問題評分**: 問題嚴重性自動評分
5. ⏳ **智能推薦**: AI 推薦解決方案

---

## 🔗 相關模組

- **Acceptance Module**: 驗收失敗自動建立問題
- **QA Module**: QC 缺失轉換為問題
- **Warranty Module**: 保固缺失建立問題
- **Safety Module**: 安全事故建立問題
- **Task Module**: 問題轉換為任務
- **Log Module**: 記錄問題處理過程

---

## 📚 參考資源

- [問題模組 README](../../src/app/core/blueprint/modules/implementations/issue/README.md)
- [Blueprint Container 架構](../ARCHITECTURE.md)
- [核心開發規範](../discussions/⭐.md)
- [SETC 任務規劃](../discussions/SETC-001-issue-module-foundation.md)

---

**文檔維護**: 2025-12-16  
**維護者**: Architecture Team  
**歸檔原因**: 備查使用，記錄模組功能與架構設計
