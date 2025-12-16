# 🐛 Issue Module (問題管理模組)

> **SETC 任務編號**: SETC-001 ~ SETC-008  
> **模組狀態**: ✅ 文檔完成，實作進行中  
> **預估工時**: 已完成（首個實作模組）

---

## 🏗️ Blueprint Event Bus 整合 (MANDATORY)

### 🚨 核心要求
- ✅ **零直接依賴**: Issue Module 不得直接注入其他模組服務
- ✅ **事件驅動**: 所有模組間通訊透過 BlueprintEventBus
- ✅ **訂閱其他模組事件**: 監聽 Acceptance、QC、Warranty 事件
- ✅ **發送領域事件**: 發送 issue.* 系列事件

### 📡 事件整合

#### 訂閱事件 (Subscribe)
```typescript
// Issue Module 監聽其他模組事件
'acceptance.rejected'        → 自動建立 Issue
'qc.defect_critical'         → 自動建立 Issue  
'warranty.defect_reported'   → 自動建立 Issue
```

#### 發送事件 (Emit)
```typescript
// Issue Module 發送的領域事件
'issue.created'              → 通知其他模組有新問題
'issue.assigned'             → 通知責任人
'issue.resolved'             → 通知相關模組問題已解決
'issue.verified'             → 驗證通過
'issue.closed'               → 問題關閉
'issue.reopened'             → 問題重新開啟
```

#### 事件處理範例
```typescript
@Injectable({ providedIn: 'root' })
export class IssueEventService {
  private eventBus = inject(BlueprintEventBusService);
  private destroyRef = inject(DestroyRef);
  
  constructor() {
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    // 監聽驗收不通過 → 自動建立 Issue
    this.eventBus.on('acceptance.rejected')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        if (event.data.createIssue) {
          this.autoCreateIssueFromAcceptance(event);
        }
      });
    
    // 監聽嚴重 QC 缺失 → 自動建立 Issue
    this.eventBus.on('qc.defect_critical')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        this.autoCreateIssueFromQC(event);
      });
  }
}
```

### 🚫 禁止模式
```typescript
// ❌ 禁止: 直接注入其他模組服務
@Injectable({ providedIn: 'root' })
export class IssueService {
  private acceptanceService = inject(AcceptanceService);  // ❌ 絕對禁止
  private qcService = inject(QCService);                  // ❌ 絕對禁止
}

// ❌ 禁止: 直接查詢其他模組 Firestore
async checkAcceptanceStatus(acceptanceId: string) {
  const doc = await getDoc(
    doc(this.firestore, 'acceptances', acceptanceId)  // ❌ 跨模組查詢
  );
}
```

---

## 📋 任務清單

### SETC-001: Issue Module Foundation
**檔案**: `SETC-001-issue-module-foundation.md`  
**目的**: 建立 Issue Module 基礎架構  
**內容**:
- 模組定義與職責
- 核心資料模型設計
- 模組註冊與配置
- 基礎目錄結構

---

### SETC-002: Issue Repository Layer
**檔案**: `SETC-002-issue-repository-layer.md`  
**目的**: 實作資料存取層 (Repository Pattern)  
**內容**:
- IssueRepository 介面定義
- Firestore 資料存取實作
- CRUD 操作封裝
- 查詢優化策略

---

### SETC-003: Issue Core Services
**檔案**: `SETC-003-issue-core-services.md`  
**目的**: 實作核心業務邏輯服務  
**內容**:
- IssueService 業務邏輯
- 狀態轉換管理
- 業務規則驗證
- 權限檢查整合

---

### SETC-004: Issue Resolution Verification
**檔案**: `SETC-004-issue-resolution-verification.md`  
**目的**: 實作問題解決與驗證流程  
**內容**:
- 解決方案提交機制
- 驗證工作流程
- 狀態追蹤
- 通知機制

---

### SETC-005: Issue Event Integration
**檔案**: `SETC-005-issue-event-integration.md`  
**目的**: 整合事件驅動架構  
**內容**:
- 領域事件定義
- EventBus 整合
- 事件發送與訂閱
- 跨模組通訊

---

### SETC-006: Issue Module Facade
**檔案**: `SETC-006-issue-module-facade.md`  
**目的**: 建立 Facade 層統一介面  
**內容**:
- IssueFacade 設計
- API 統一封裝
- 錯誤處理標準化
- 使用範例

---

### SETC-007: Issue UI Components
**檔案**: `SETC-007-issue-ui-components.md`  
**目的**: 實作使用者介面元件  
**內容**:
- Issue List Component
- Issue Detail Component
- Issue Form Component
- ng-zorro-antd 元件整合

---

### SETC-008: Issue Module Testing
**檔案**: `SETC-008-issue-module-testing.md`  
**目的**: 完整測試覆蓋  
**內容**:
- 單元測試 (Repository, Service)
- 元件測試
- 整合測試
- E2E 測試場景

---

## 🏗️ 架構設計

### 三層架構
```
UI Layer (routes/issue/)
    ↓
Service Layer (core/services/issue.service.ts)
    ↓
Repository Layer (core/data-access/issue.repository.ts)
    ↓
Firestore
```

### 核心元件
- **Models**: `Issue`, `IssueStatus`, `IssuePriority`, `IssueResolution`
- **Repository**: `IssueRepository` (Firestore 操作)
- **Service**: `IssueService` (業務邏輯)
- **Components**: List, Detail, Form, Status Badge
- **Events**: `issue.created`, `issue.updated`, `issue.resolved`, `issue.verified`

---

## 📊 進度追蹤

| 任務編號 | 任務名稱 | 文檔狀態 | 實作狀態 | 測試狀態 |
|---------|---------|---------|---------|---------|
| SETC-001 | Foundation | ✅ 完成 | 🟢 完成 | ✅ 通過 |
| SETC-002 | Repository | ✅ 完成 | 🟢 完成 | ✅ 通過 |
| SETC-003 | Services | ✅ 完成 | 🟢 完成 | ✅ 通過 |
| SETC-004 | Resolution | ✅ 完成 | 🟡 進行中 | ⏳ 待測試 |
| SETC-005 | Events | ✅ 完成 | 🟡 進行中 | ⏳ 待測試 |
| SETC-006 | Facade | ✅ 完成 | ⏳ 未開始 | ⏳ 未開始 |
| SETC-007 | UI | ✅ 完成 | ⏳ 未開始 | ⏳ 未開始 |
| SETC-008 | Testing | ✅ 完成 | ⏳ 未開始 | ⏳ 未開始 |

---

## 🎯 實作參考

詳細實作步驟請參考：
- **實作指南**: [../03-implementation/](../03-implementation/)
- **實作索引**: [SETC-IMPLEMENTATION-INDEX.md](../03-implementation/SETC-IMPLEMENTATION-INDEX.md)

---

## 🔗 相關連結

- **上層目錄**: [返回 discussions](../)
- **總覽文檔**: [01-overview](../01-overview/)
- **實作指南**: [03-implementation](../03-implementation/)

---

**模組負責人**: GigHub Development Team  
**最後更新**: 2025-12-16  
**任務數**: 8 個  
**狀態**: 🟡 實作進行中
