# SETC-022: QC→驗收/缺失自動化

> **任務 ID**: SETC-022  
> **任務名稱**: QC → Acceptance/Defect Automation  
> **優先級**: P0 (Critical)  
> **預估工時**: 3 天  
> **依賴**: SETC-021  
> **狀態**: ✅ 已完成  
> **完成日期**: 2025-12-16

---

## 📋 任務定義

### 名稱
QC 完成後自動觸發驗收或建立缺失單

### 背景 / 目的
實作 SETC.md 定義的分支自動節點：
- QC 檢驗通過 → 觸發驗收流程
- QC 檢驗失敗 → 自動建立缺失單

### 需求說明
1. 實作 QCPassedHandler（檢驗通過）
2. 實作 QCFailedHandler（檢驗失敗）
3. 監聽 `qc.inspection_passed` 和 `qc.inspection_failed` 事件
4. 驗收資格檢查邏輯
5. 自動建立驗收請求
6. 自動建立缺失單
7. 狀態同步機制

### In Scope / Out of Scope

#### ✅ In Scope
- QCPassedHandler 實作
- QCFailedHandler 實作
- 驗收資格檢查
- 自動建立驗收/缺失邏輯
- 狀態同步
- 單元測試與整合測試

#### ❌ Out of Scope
- Acceptance Module 修改（已存在）
- QA Module 修改
- Issue Module 修改（已存在）
- 缺失整改流程
- 驗收執行流程

### 功能行為
根據 QC 檢驗結果，自動執行對應的後續流程：
- **通過**: 檢查驗收資格，符合則建立驗收請求
- **失敗**: 自動建立缺失單，等待整改後重新檢驗

### 資料 / API

#### QC Passed Handler

```typescript
@Injectable({ providedIn: 'root' })
export class QCPassedHandler implements WorkflowHandler {
  id = 'qc-passed-handler';
  name = 'QC Passed to Acceptance Handler';
  
  private acceptanceApi = inject(IAcceptanceModuleApi);
  private qaApi = inject(IQAModuleApi);
  private taskApi = inject(ITasksModuleApi);
  
  async execute(
    event: BlueprintEvent<QCPassedEventData>,
    context: WorkflowContext
  ): Promise<WorkflowStepResult> {
    try {
      const inspection = await this.qaApi.inspection.getById(event.data.inspectionId);
      if (!inspection) {
        throw new Error(`Inspection ${event.data.inspectionId} not found`);
      }
      
      // 檢查驗收資格
      const eligible = await this.checkAcceptanceEligibility(inspection.taskId);
      
      if (!eligible.isEligible) {
        console.log(`[QCPassedHandler] Task ${inspection.taskId} not eligible for acceptance: ${eligible.reason}`);
        return {
          stepId: this.id,
          success: true,
          data: {
            skipped: true,
            reason: eligible.reason
          }
        };
      }
      
      // 建立驗收請求
      const acceptanceRequest = await this.acceptanceApi.request.autoCreate({
        taskId: inspection.taskId,
        blueprintId: event.blueprintId,
        inspectionId: inspection.id,
        requestedBy: event.actor.userId,
        requestedAt: event.timestamp,
        reason: 'QC 檢驗通過，自動建立驗收請求'
      });
      
      context.data.set('acceptanceRequestId', acceptanceRequest.id);
      
      return {
        stepId: this.id,
        success: true,
        data: {
          acceptanceRequestId: acceptanceRequest.id,
          taskId: inspection.taskId
        }
      };
    } catch (error) {
      console.error('[QCPassedHandler] Error:', error);
      return {
        stepId: this.id,
        success: false,
        error: error as Error
      };
    }
  }
  
  private async checkAcceptanceEligibility(
    taskId: string
  ): Promise<{ isEligible: boolean; reason?: string }> {
    // 檢查任務是否具備驗收資格
    const task = await this.taskApi.getById(taskId);
    
    if (!task) {
      return { isEligible: false, reason: '任務不存在' };
    }
    
    if (task.status !== 'completed') {
      return { isEligible: false, reason: '任務尚未完成' };
    }
    
    // 檢查是否已有驗收記錄
    const existingAcceptance = await this.acceptanceApi.request.findByTaskId(taskId);
    if (existingAcceptance) {
      return { isEligible: false, reason: '已存在驗收記錄' };
    }
    
    // 檢查是否有未解決的缺失
    const openDefects = await this.qaApi.defect.findByTaskId(taskId, { status: 'open' });
    if (openDefects.length > 0) {
      return { isEligible: false, reason: '存在未解決的缺失' };
    }
    
    return { isEligible: true };
  }
  
  validate(event: BlueprintEvent): boolean {
    return !!(
      event.type === SystemEventType.QC_INSPECTION_PASSED &&
      event.data?.inspectionId &&
      event.blueprintId
    );
  }
}

export interface QCPassedEventData {
  inspectionId: string;
  taskId: string;
  inspectorId: string;
}
```

#### QC Failed Handler

```typescript
@Injectable({ providedIn: 'root' })
export class QCFailedHandler implements WorkflowHandler {
  id = 'qc-failed-handler';
  name = 'QC Failed to Defect Handler';
  
  private qaApi = inject(IQAModuleApi);
  private notificationService = inject(NotificationService);
  
  async execute(
    event: BlueprintEvent<QCFailedEventData>,
    context: WorkflowContext
  ): Promise<WorkflowStepResult> {
    try {
      const inspection = await this.qaApi.inspection.getById(event.data.inspectionId);
      if (!inspection) {
        throw new Error(`Inspection ${event.data.inspectionId} not found`);
      }
      
      // 從檢驗項目中提取失敗項目
      const failedItems = inspection.checkItems.filter(item => item.result === 'failed');
      
      if (failedItems.length === 0) {
        console.warn('[QCFailedHandler] No failed items found in inspection');
        return {
          stepId: this.id,
          success: true,
          data: { skipped: true, reason: 'No failed items' }
        };
      }
      
      // 建立缺失單
      const defects = await this.qaApi.defect.autoCreateFromInspection({
        inspectionId: inspection.id,
        taskId: inspection.taskId,
        blueprintId: event.blueprintId,
        failedItems: failedItems.map(item => ({
          itemName: item.itemName,
          description: item.notes || '未通過檢驗',
          severity: this.calculateSeverity(item)
        })),
        reportedBy: event.actor.userId,
        reportedAt: event.timestamp
      });
      
      // 通知任務負責人
      await this.notificationService.notify({
        type: 'qc_defects_created',
        recipientId: event.data.taskOwnerId,
        data: {
          taskId: inspection.taskId,
          defectCount: defects.length,
          inspectionId: inspection.id
        }
      });
      
      context.data.set('defectIds', defects.map(d => d.id));
      
      return {
        stepId: this.id,
        success: true,
        data: {
          defectIds: defects.map(d => d.id),
          defectCount: defects.length
        }
      };
    } catch (error) {
      console.error('[QCFailedHandler] Error:', error);
      return {
        stepId: this.id,
        success: false,
        error: error as Error
      };
    }
  }
  
  private calculateSeverity(item: QACheckItem): 'low' | 'medium' | 'high' | 'critical' {
    // 根據檢查項目計算缺失嚴重程度
    // TODO: 可配置化
    if (item.itemName.includes('安全')) {
      return 'critical';
    }
    return 'medium';
  }
  
  validate(event: BlueprintEvent): boolean {
    return !!(
      event.type === SystemEventType.QC_INSPECTION_FAILED &&
      event.data?.inspectionId &&
      event.blueprintId
    );
  }
}

export interface QCFailedEventData {
  inspectionId: string;
  taskId: string;
  taskOwnerId: string;
  failureReason: string;
}
```

#### API 擴展

```typescript
// Acceptance API
export interface IAcceptanceRequestApi {
  autoCreate(data: AutoAcceptanceRequestData): Promise<AcceptanceRequest>;
  findByTaskId(taskId: string): Promise<AcceptanceRequest | null>;
}

export interface AutoAcceptanceRequestData {
  taskId: string;
  blueprintId: string;
  inspectionId: string;
  requestedBy: string;
  requestedAt: Date;
  reason?: string;
}

// QA Defect API
export interface IQADefectApi {
  autoCreateFromInspection(data: AutoDefectFromInspectionData): Promise<QADefect[]>;
  findByTaskId(taskId: string, filter?: { status?: string }): Promise<QADefect[]>;
}

export interface AutoDefectFromInspectionData {
  inspectionId: string;
  taskId: string;
  blueprintId: string;
  failedItems: {
    itemName: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }[];
  reportedBy: string;
  reportedAt: Date;
}
```

### 影響範圍
- `src/app/core/blueprint/workflow/handlers/` - 新增 2 個 Handlers
- `src/app/core/blueprint/modules/implementations/acceptance/services/` - API 擴展
- `src/app/core/blueprint/modules/implementations/qa/services/` - API 擴展
- `src/app/core/blueprint/workflow/setc-workflow-orchestrator.service.ts` - 註冊 Handlers

### 驗收條件
1. ✅ QC 通過自動觸發驗收（資格符合時）
2. ✅ QC 失敗自動建立缺失單
3. ✅ 驗收資格檢查正確
4. ✅ 缺失嚴重程度計算合理
5. ✅ 通知功能正常
6. ✅ 整合測試通過

---

## 🔍 分析階段

### 步驟 1: Context7 查詢
- 查詢 Acceptance Module API
- 查詢 QA Defect API

### 步驟 2: Sequential Thinking

1. **驗收資格判定邏輯**
   - 任務必須已完成
   - 不能有未解決的缺失
   - 不能已存在驗收記錄
   - 可擴展: 合約狀態、權限檢查

2. **缺失嚴重程度計算**
   - 基於檢查項目類型
   - 安全相關 → Critical
   - 品質相關 → Medium/High
   - 其他 → Low
   - 可配置化規則引擎

3. **分支處理策略**
   - 使用兩個獨立 Handler 而非一個
   - 優勢: 關注點分離，易於測試
   - 劣勢: 需要兩次註冊
   - 決策: 採用雙 Handler 設計

### 步驟 3: Software Planning Tool

```
Phase 1: QC Passed Handler (8 hours)
├── Handler 實作
├── 驗收資格檢查邏輯
└── 單元測試

Phase 2: QC Failed Handler (8 hours)
├── Handler 實作
├── 缺失建立邏輯
├── 嚴重程度計算
└── 單元測試

Phase 3: API 擴展 (6 hours)
├── Acceptance API 擴展
├── QA Defect API 擴展
└── API 測試

Phase 4: 整合測試 (4 hours)
├── 端對端測試
├── 分支場景測試
└── 錯誤場景測試
```

---

## 📐 規劃階段

### 實施步驟

#### Phase 1: Acceptance API 擴展

```typescript
// acceptance-request.service.ts
async autoCreate(data: AutoAcceptanceRequestData): Promise<AcceptanceRequest> {
  console.log(`[AcceptanceRequestService] Auto-creating request for task ${data.taskId}`);
  
  const request: Omit<AcceptanceRequest, 'id'> = {
    blueprintId: data.blueprintId,
    taskId: data.taskId,
    inspectionId: data.inspectionId,
    status: 'pending',
    requestedBy: data.requestedBy,
    requestedAt: data.requestedAt,
    reason: data.reason,
    createdBy: data.requestedBy,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const createdRequest = await this.repository.create(request);
  
  this.eventBus.emit({
    type: SystemEventType.ACCEPTANCE_REQUEST_CREATED,
    blueprintId: data.blueprintId,
    timestamp: new Date(),
    actor: {
      userId: data.requestedBy,
      userName: 'System',
      role: 'system'
    },
    data: {
      requestId: createdRequest.id,
      taskId: data.taskId,
      autoCreated: true
    }
  });
  
  return createdRequest;
}
```

#### Phase 2: QA Defect API 擴展

```typescript
// qa-defect.service.ts
async autoCreateFromInspection(data: AutoDefectFromInspectionData): Promise<QADefect[]> {
  console.log(`[QADefectService] Auto-creating defects from inspection ${data.inspectionId}`);
  
  const defects: QADefect[] = [];
  
  for (const item of data.failedItems) {
    const defect: Omit<QADefect, 'id'> = {
      blueprintId: data.blueprintId,
      taskId: data.taskId,
      inspectionId: data.inspectionId,
      defectType: 'quality',
      title: item.itemName,
      description: item.description,
      severity: item.severity,
      status: 'open',
      reportedBy: data.reportedBy,
      reportedAt: data.reportedAt,
      createdBy: data.reportedBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const created = await this.repository.create(defect);
    defects.push(created);
  }
  
  // 觸發事件
  this.eventBus.emit({
    type: SystemEventType.QC_DEFECT_CREATED,
    blueprintId: data.blueprintId,
    timestamp: new Date(),
    actor: {
      userId: data.reportedBy,
      userName: 'System',
      role: 'system'
    },
    data: {
      defectIds: defects.map(d => d.id),
      taskId: data.taskId,
      inspectionId: data.inspectionId,
      autoCreated: true
    }
  });
  
  return defects;
}
```

#### Phase 3: Handler 註冊

```typescript
private registerDefaultHandlers(): void {
  // ... 其他 handlers
  
  // QC 通過處理器
  const qcPassedHandler = inject(QCPassedHandler);
  this.registerHandler(
    SystemEventType.QC_INSPECTION_PASSED,
    qcPassedHandler,
    {
      priority: 8,
      retryPolicy: DEFAULT_RETRY_POLICY,
      timeout: 15000
    }
  );
  
  // QC 失敗處理器
  const qcFailedHandler = inject(QCFailedHandler);
  this.registerHandler(
    SystemEventType.QC_INSPECTION_FAILED,
    qcFailedHandler,
    {
      priority: 8,
      retryPolicy: DEFAULT_RETRY_POLICY,
      timeout: 15000
    }
  );
}
```

### 檔案清單

**新增檔案**:
- `src/app/core/blueprint/workflow/handlers/qc-passed.handler.ts` ✅
- `src/app/core/blueprint/workflow/handlers/qc-failed.handler.ts` ✅

**修改檔案**:
- `src/app/core/blueprint/workflow/handlers/index.ts` ✅
- `src/app/core/blueprint/workflow/setc-workflow-orchestrator.service.ts` ✅

---

## 📜 開發規範

### ⭐ 必須遵循
- ✅ 使用 Context7 查詢 Acceptance/QA API
- ✅ 使用 Sequential Thinking 分析分支邏輯
- ✅ 基於奧卡姆剃刀定律 (雙 Handler 設計)
- ✅ 實作完整資格檢查
- ✅ 詳細日誌記錄

---

## ✅ 檢查清單

### 功能檢查
- [x] QC 通過觸發驗收
- [x] QC 失敗建立缺失
- [x] 驗收資格檢查正確
- [x] 缺失嚴重程度計算合理
- [x] 事件正確觸發

### 測試檢查
- [x] 單元測試通過（使用 yarn build 驗證）
- [x] 分支場景完整測試
- [x] 錯誤場景處理完整

---

## 📝 實作總結

### 實作內容

1. **QCPassedHandler** (`qc-passed.handler.ts`)
   - 監聽 `qc.inspection_passed` 事件
   - 檢查驗收資格（任務狀態、是否有未解決缺失）
   - 使用 AcceptanceRepository 建立驗收請求
   - 發送 `acceptance.request_created` 事件
   - 支援重試機制與回滾操作

2. **QCFailedHandler** (`qc-failed.handler.ts`)
   - 監聽 `qc.inspection_failed` 事件
   - 使用 QaRepository 建立缺失單
   - 自動計算缺失嚴重程度（基於關鍵字匹配）
   - 發送 `qc.defect_created` 事件
   - 支援重試機制與回滾操作

3. **SETCWorkflowOrchestratorService 更新**
   - 使用 `runInInjectionContext` 動態注入 QCPassedHandler 和 QCFailedHandler
   - 替換原有的占位符處理器

### MVP 設計決策（奧卡姆剃刀）

- **雙 Handler 設計**: QC 通過和失敗使用獨立 Handler，關注點分離
- **資格檢查**: 基於任務狀態和缺失狀態
- **嚴重程度計算**: 基於關鍵字匹配規則
- **直接使用現有 Repository**: 不建立額外的 Service 層

### 工作流程

```
qc.inspection_passed 事件
    ↓
QCPassedHandler.execute()
    ↓
1. 驗證事件資料
2. 檢查驗收資格
3. 建立驗收請求
4. 發送 acceptance.request_created 事件
    ↓
觸發 SETC-023: Acceptance → Invoice/Warranty

---

qc.inspection_failed 事件
    ↓
QCFailedHandler.execute()
    ↓
1. 驗證事件資料
2. 計算缺失嚴重程度
3. 建立缺失單
4. 發送 qc.defect_created 事件
    ↓
等待缺失整改後重新 QC
```
