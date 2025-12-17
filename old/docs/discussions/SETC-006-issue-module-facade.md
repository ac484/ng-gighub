# SETC-006: Issue Module Facade

> **任務 ID**: SETC-006  
> **任務名稱**: Issue Module Facade Implementation  
> **優先級**: P1 (Critical)  
> **預估工時**: 1 天  
> **依賴**: SETC-005 (Issue Event Integration)  
> **狀態**: 📋 待開始

---

## 📋 任務定義

### 名稱
問題單模組 Facade 實作

### 背景 / 目的
實作 Issue Module 的 Facade 層，提供統一的對外 API，簡化與其他模組的整合，遵循三層架構原則。

### 需求說明
1. 實作 IssueModuleFacade
2. 整合所有服務功能
3. 提供簡化的對外 API
4. 遵循 Blueprint Module 介面

### In Scope / Out of Scope

#### ✅ In Scope
- IssueModuleFacade 實作
- API 整合
- 文檔

#### ❌ Out of Scope
- UI 元件（SETC-007）
- 測試（SETC-008）

### 功能行為
提供問題單模組的統一對外介面。

### 資料 / API

#### IssueModuleFacade

```typescript
@Injectable({ providedIn: 'root' })
export class IssueModuleFacade implements IModuleFacade {
  private creationService = inject(IssueCreationService);
  private managementService = inject(IssueManagementService);
  private resolutionService = inject(IssueResolutionService);
  private verificationService = inject(IssueVerificationService);
  private issueRepository = inject(IssueRepository);

  // ========================================
  // 建立 API
  // ========================================

  /**
   * 手動建立問題單
   */
  async createIssue(
    data: CreateIssueDto,
    actor: EventActor
  ): Promise<Issue> {
    return this.creationService.createManual(data, actor);
  }

  /**
   * 從驗收建立問題單
   */
  async createFromAcceptance(
    data: CreateFromAcceptanceDto
  ): Promise<Issue> {
    return this.creationService.autoCreateFromAcceptance(data);
  }

  /**
   * 從 QC 缺失建立問題單
   */
  async createFromQC(data: CreateFromQCDto): Promise<Issue> {
    return this.creationService.autoCreateFromQC(data);
  }

  /**
   * 從保固缺失建立問題單
   */
  async createFromWarranty(data: CreateFromWarrantyDto): Promise<Issue> {
    return this.creationService.autoCreateFromWarranty(data);
  }

  // ========================================
  // 管理 API
  // ========================================

  /**
   * 取得問題單
   */
  async getIssue(issueId: string): Promise<Issue | null> {
    return this.issueRepository.getById(issueId);
  }

  /**
   * 取得問題單列表
   */
  async getIssues(blueprintId: string): Promise<Issue[]> {
    return this.issueRepository.getByBlueprintId(blueprintId);
  }

  /**
   * 取得問題單 Observable
   */
  getIssues$(blueprintId: string): Observable<Issue[]> {
    return this.issueRepository.getByBlueprintId$(blueprintId);
  }

  /**
   * 更新問題單
   */
  async updateIssue(
    issueId: string,
    data: UpdateIssueDto,
    actor: EventActor
  ): Promise<Issue> {
    return this.managementService.update(issueId, data, actor);
  }

  /**
   * 指派問題單
   */
  async assignIssue(
    issueId: string,
    assignedTo: string,
    actor: EventActor
  ): Promise<Issue> {
    return this.managementService.assign(issueId, assignedTo, actor);
  }

  // ========================================
  // 解決與驗證 API
  // ========================================

  /**
   * 開始處理問題單
   */
  async startProgress(
    issueId: string,
    actor: EventActor
  ): Promise<Issue> {
    return this.resolutionService.startProgress(issueId, actor);
  }

  /**
   * 提交解決方案
   */
  async submitResolution(
    issueId: string,
    data: SubmitResolutionDto,
    actor: EventActor
  ): Promise<Issue> {
    return this.resolutionService.submitResolution(issueId, data, actor);
  }

  /**
   * 驗證解決方案
   */
  async verifyIssue(
    issueId: string,
    data: VerifyIssueDto,
    actor: EventActor
  ): Promise<Issue> {
    return this.verificationService.verify(issueId, data, actor);
  }

  /**
   * 結案
   */
  async closeIssue(
    issueId: string,
    actor: EventActor,
    notes?: string
  ): Promise<Issue> {
    return this.verificationService.close(issueId, actor, notes);
  }

  // ========================================
  // 查詢 API
  // ========================================

  /**
   * 依狀態查詢
   */
  async getByStatus(
    blueprintId: string,
    statuses: IssueStatus[]
  ): Promise<Issue[]> {
    return this.issueRepository.getByStatus(blueprintId, statuses);
  }

  /**
   * 依來源查詢
   */
  async getBySource(
    blueprintId: string,
    source: IssueSource
  ): Promise<Issue[]> {
    return this.issueRepository.getBySource(blueprintId, source);
  }

  /**
   * 依來源 ID 查詢
   */
  async getBySourceId(
    blueprintId: string,
    sourceId: string
  ): Promise<Issue | null> {
    return this.issueRepository.getBySourceId(blueprintId, sourceId);
  }

  /**
   * 取得待處理問題單
   */
  async getPendingIssues(blueprintId: string): Promise<Issue[]> {
    return this.getByStatus(blueprintId, ['open', 'in_progress']);
  }

  // ========================================
  // 統計 API
  // ========================================

  /**
   * 取得問題單統計
   */
  async getStatistics(blueprintId: string): Promise<IssueStatistics> {
    return this.managementService.getStatistics(blueprintId);
  }

  /**
   * 取得解決報表
   */
  async getResolutionReport(blueprintId: string): Promise<ResolutionReport> {
    return this.resolutionService.getResolutionReport(blueprintId);
  }

  /**
   * 取得驗證統計
   */
  async getVerificationStatistics(
    blueprintId: string
  ): Promise<VerificationStats> {
    return this.verificationService.getVerificationStatistics(blueprintId);
  }
}
```

#### 模組 API 匯出

```typescript
// exports/issue.api.ts
export * from '../models';
export * from '../services/issue-creation.service';
export * from '../services/issue-management.service';
export * from '../services/issue-resolution.service';
export * from '../services/issue-verification.service';
export * from '../issue-module.facade';
```

### 影響範圍
- `src/app/core/blueprint/modules/implementations/issue/`

### 驗收條件
1. ✅ Facade 整合所有服務
2. ✅ API 設計清晰
3. ✅ 符合 Blueprint Module 介面
4. ✅ 文檔完整

---

## 🔍 分析階段

### 步驟 1: Context7 查詢
**目的**: 查詢 Facade 設計模式

### 步驟 2: Sequential Thinking 分析

**思考流程**:
1. **API 分類**
   - 建立 API
   - 管理 API
   - 解決驗證 API
   - 查詢 API

2. **整合策略**
   - 簡化對外介面
   - 隱藏內部複雜性

### 步驟 3: Software Planning Tool

**開發計畫**:
```
Day 1 (8 hours):
├── IssueModuleFacade 實作
├── API 整合
└── 文檔
```

---

## 📐 規劃階段

### 檔案清單

**新增檔案**:
- `src/app/core/blueprint/modules/implementations/issue/issue-module.facade.ts`
- `src/app/core/blueprint/modules/implementations/issue/exports/issue.api.ts`

---

## ✅ 檢查清單

### 功能檢查
- [ ] Facade 整合完整
- [ ] API 設計清晰

### 文檔檢查
- [ ] API 文檔完整
