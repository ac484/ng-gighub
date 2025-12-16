# SETC-000-05: Acceptance Module (驗收管理模組)

> **模組 ID**: `acceptance`  
> **版本**: 1.0.0  
> **狀態**: ✅ 已實作 (基礎架構)  
> **優先級**: P2 (必要)  
> **架構**: Blueprint Container Module  
> **歸檔日期**: 2025-12-16

---

## 📋 模組概述

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

---

## 🏗️ 架構設計

### 目錄結構

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
├── components/                       # Domain UI 元件
│   ├── acceptance-request/
│   ├── acceptance-review/
│   ├── preliminary/
│   └── conclusion/
├── config/
│   └── acceptance.config.ts          # 模組配置
├── exports/
│   └── acceptance-api.exports.ts     # 公開 API
├── index.ts                          # 統一匯出
└── README.md                         # 模組文檔
```

---

## 📦 子模組 (Sub-Modules)

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
  taskIds?: string[];
  contractId?: string;
  phase?: string;
  
  // 申請方
  requestedBy: string;
  requestedByName: string;
  requestedByRole: RequestorRole;
  requestedAt: Date;
  
  // 文件
  requiredDocuments: DocumentRequirement[];
  submittedDocuments: SubmittedDocument[];
  
  // 狀態
  status: RequestStatus;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  
  // 排程
  proposedDate?: Date;
  scheduledDate?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}
```

### 2️⃣ Acceptance Review Sub-Module (驗收審核)

**職責**: 驗收申請審核流程管理

**核心功能**:
- 審核驗收申請
- 審核意見記錄
- 審核文件檢查
- 審核結果通知

### 3️⃣ Preliminary Acceptance Sub-Module (初驗)

**職責**: 初驗流程執行與記錄

**核心功能**:
- 初驗排程
- 初驗執行記錄
- 缺失記錄
- 初驗報告生成

**資料模型**:
```typescript
interface PreliminaryAcceptance {
  id: string;
  blueprintId: string;
  requestId: string;
  acceptanceNumber: string;
  scheduledDate: Date;
  actualDate?: Date;
  
  // 驗收團隊
  inspector: PartyInfo;        // 業主代表
  supervisor?: PartyInfo;      // 監造單位
  contractor: PartyInfo;       // 承包商
  
  // 驗收結果
  result: AcceptanceResult;    // 'pass' | 'conditional_pass' | 'fail'
  overallScore?: number;
  checkItems: CheckItemResult[];
  defects: DefectRecord[];
  
  // 決議
  resolution?: string;
  conditions?: string[];       // 附帶條件
  requiredActions?: string[];  // 需改善事項
  
  // 文件
  report?: string;             // 驗收報告
  photos?: string[];
  signedDocument?: string;
  
  status: AcceptanceStatus;
  createdAt: Date;
  completedAt?: Date;
}
```

### 4️⃣ Re-inspection Sub-Module (複驗)

**職責**: 複驗流程與缺失改善確認

**核心功能**:
- 複驗排程
- 改善確認
- 複驗記錄
- 複驗報告

### 5️⃣ Acceptance Conclusion Sub-Module (驗收結論)

**職責**: 驗收結論判定與證明文件

**核心功能**:
- 驗收結論判定
- 驗收證明生成
- 保固期啟動
- 驗收歸檔

---

## 🔌 公開 API

### IAcceptanceModuleApi

```typescript
interface IAcceptanceModuleApi {
  request: IAcceptanceRequestApi;
  review: IAcceptanceReviewApi;
  preliminary: IPreliminaryAcceptanceApi;
  reInspection: IReInspectionApi;
  conclusion: IAcceptanceConclusionApi;
}
```

### IAcceptanceRequestApi

```typescript
interface IAcceptanceRequestApi {
  create(request: CreateAcceptanceRequestDto): Promise<AcceptanceRequest>;
  update(id: string, request: UpdateAcceptanceRequestDto): Promise<AcceptanceRequest>;
  submit(id: string): Promise<void>;
  withdraw(id: string, reason: string): Promise<void>;
  findById(id: string): Promise<AcceptanceRequest | undefined>;
  findAll(blueprintId: string, filter?: RequestFilter): Promise<AcceptanceRequest[]>;
}
```

---

## 📡 事件整合

### 發送事件

```typescript
// 驗收申請提交事件
this.eventBus.emit({
  type: 'acceptance.request.submitted',
  blueprintId: request.blueprintId,
  timestamp: new Date(),
  actor: userId,
  data: { requestId: request.id }
});

// 驗收通過事件
this.eventBus.emit({
  type: 'acceptance.passed',
  blueprintId: acceptance.blueprintId,
  timestamp: new Date(),
  actor: userId,
  data: { 
    acceptanceId: acceptance.id,
    requestId: acceptance.requestId,
    result: 'pass'
  }
});

// 觸發保固模組
this.eventBus.emit({
  type: 'acceptance.completed',
  blueprintId: acceptance.blueprintId,
  timestamp: new Date(),
  actor: userId,
  data: {
    acceptanceId: acceptance.id,
    startWarranty: true,
    warrantyPeriod: 12  // 月
  }
});
```

---

## 🚀 使用範例

### 1. 建立驗收申請

```typescript
const request = await this.acceptanceRequestService.create({
  blueprintId: 'bp-123',
  requestType: 'preliminary',
  title: '大樓主體結構初驗',
  description: '1-5樓主體結構完成，申請初驗',
  scope: {
    buildingIds: ['building-1'],
    floors: ['1F', '2F', '3F', '4F', '5F'],
    areaDescription: '主體結構',
    estimatedArea: 5000
  },
  workItems: [
    {
      code: 'W001',
      name: '基礎工程',
      completionPercentage: 100,
      isComplete: true
    }
  ],
  requiredDocuments: [
    { name: '施工日誌', isRequired: true },
    { name: '材料證明', isRequired: true }
  ]
});
```

### 2. 執行初驗

```typescript
const preliminary = await this.preliminaryService.create({
  blueprintId: 'bp-123',
  requestId: request.id,
  scheduledDate: new Date('2025-02-01'),
  inspector: {
    id: 'user-1',
    name: '王經理',
    role: 'owner'
  },
  contractor: {
    id: 'contractor-1',
    name: 'XYZ 營造',
    role: 'contractor'
  }
});

// 記錄缺失
await this.preliminaryService.addDefect(preliminary.id, {
  title: '牆面粉刷不平整',
  description: '3樓東側牆面粉刷不平整',
  severity: 'minor',
  location: '3F-東側',
  photos: ['photo-url-1']
});

// 完成驗收
await this.preliminaryService.complete(preliminary.id, {
  result: 'conditional_pass',
  overallScore: 85,
  requiredActions: [
    '改善3樓東側牆面粉刷',
    '補齊材料證明文件'
  ]
});
```

---

## 🧪 測試

### 單元測試

```bash
# 執行驗收模組單元測試
yarn test --include="**/acceptance/**/*.spec.ts"
```

---

## 📝 待實作功能

1. ⏳ **線上簽核**: 數位簽章與線上簽核
2. ⏳ **驗收範本**: 可重複使用的驗收檢查範本
3. ⏳ **行動驗收**: 行動裝置現場驗收 APP
4. ⏳ **AI 協助**: AI 分析驗收照片與文件
5. ⏳ **統計分析**: 驗收通過率與缺失統計
6. ⏳ **電子存證**: 區塊鏈驗收證明存證

---

## 🔗 相關模組

- **Task Module**: 任務完成觸發驗收
- **QA Module**: 品質檢查與驗收關聯
- **Contract Module**: 合約工項驗收
- **Warranty Module**: 驗收通過啟動保固
- **Finance Module**: 驗收與請款關聯
- **Issue Module**: 驗收缺失轉問題追蹤

---

## 📚 參考資源

- [驗收模組 README](../../src/app/core/blueprint/modules/implementations/acceptance/README.md)
- [Blueprint Container 架構](../ARCHITECTURE.md)
- [核心開發規範](../discussions/⭐.md)
- [SETC 任務規劃](../discussions/SETC-054-acceptance-module-enhancement-planning.md)

---

**文檔維護**: 2025-12-16  
**維護者**: Architecture Team  
**歸檔原因**: 備查使用，記錄模組功能與架構設計
