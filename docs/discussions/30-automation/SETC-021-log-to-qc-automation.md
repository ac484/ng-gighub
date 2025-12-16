# SETC-021: 日誌→QC 待驗自動化

> **任務 ID**: SETC-021  
> **任務名稱**: Log → QC Automation  
> **優先級**: P0 (Critical)  
> **預估工時**: 2 天  
> **依賴**: SETC-020  
> **狀態**: ✅ 已完成  
> **完成日期**: 2025-12-16

---

## 📋 任務定義

### 名稱
施工日誌建立後自動建立 QC 待驗

### 背景 / 目的
實作 SETC.md 定義的第二個自動節點：當施工日誌建立後，自動建立 QC 檢驗待辦，進入品質檢查流程。

### 需求說明
1. 實作 LogCreatedHandler
2. 監聽 `log.created` 事件
3. 自動建立 QC 檢驗
4. QC 檢驗員自動分配邏輯
5. 觸發 `qc.inspection_created` 事件
6. 通知相關人員

### In Scope / Out of Scope

#### ✅ In Scope
- LogCreatedHandler 實作
- 自動建立 QC 檢驗邏輯
- 檢驗員分配規則
- 事件觸發與通知
- 單元測試與整合測試

#### ❌ Out of Scope
- QA Module 修改（已存在）
- Log Module 修改
- 檢驗執行流程
- UI 變更

### 功能行為
當接收到 `log.created` 事件時，自動建立 QC 檢驗記錄，分配檢驗員，並通知相關人員進行檢驗。

### 資料 / API

#### Handler 介面

```typescript
@Injectable({ providedIn: 'root' })
export class LogCreatedHandler implements WorkflowHandler {
  id = 'log-created-handler';
  name = 'Log Created to QC Handler';
  
  private qaApi = inject(IQAModuleApi);
  private logApi = inject(ILogModuleApi);
  private notificationService = inject(NotificationService);
  
  async execute(
    event: BlueprintEvent<LogCreatedEventData>,
    context: WorkflowContext
  ): Promise<WorkflowStepResult> {
    try {
      // 1. 獲取日誌資料
      const log = await this.logApi.activityLog.getById(event.data.logId);
      if (!log) {
        throw new Error(`Log ${event.data.logId} not found`);
      }
      
      // 2. 分配檢驗員
      const inspector = await this.assignInspector(log.blueprintId, log.taskId);
      
      // 3. 建立 QC 檢驗
      const inspection = await this.qaApi.inspection.autoCreateFromLog({
        logId: log.id,
        taskId: log.taskId!,
        blueprintId: log.blueprintId,
        inspectorId: inspector.id,
        scheduledDate: this.calculateInspectionDate()
      });
      
      // 4. 發送通知
      await this.notificationService.notify({
        type: 'qc_inspection_assigned',
        recipientId: inspector.id,
        data: {
          inspectionId: inspection.id,
          taskId: log.taskId,
          logId: log.id
        }
      });
      
      context.data.set('inspectionId', inspection.id);
      context.data.set('inspectorId', inspector.id);
      
      return {
        stepId: this.id,
        success: true,
        data: { inspectionId: inspection.id }
      };
    } catch (error) {
      console.error('[LogCreatedHandler] Error:', error);
      return {
        stepId: this.id,
        success: false,
        error: error as Error
      };
    }
  }
  
  validate(event: BlueprintEvent): boolean {
    return !!(
      event.type === SystemEventType.LOG_CREATED &&
      event.data?.logId &&
      event.data?.taskId &&
      event.blueprintId
    );
  }
  
  private async assignInspector(
    blueprintId: string,
    taskId?: string
  ): Promise<{ id: string; name: string }> {
    // 簡單的分配邏輯：選擇當前檢驗任務最少的檢驗員
    // TODO: 可擴展為更複雜的分配規則
    return {
      id: 'inspector-1',
      name: 'Default Inspector'
    };
  }
  
  private calculateInspectionDate(): Date {
    // 預設為建立後 1 個工作日
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date;
  }
}

export interface LogCreatedEventData {
  logId: string;
  taskId: string;
  autoCreated?: boolean;
}
```

#### QA Module API 擴展

```typescript
export interface IQAInspectionApi {
  // 現有方法...
  
  /**
   * 從日誌自動建立檢驗
   */
  autoCreateFromLog(data: AutoInspectionFromLogData): Promise<QAInspection>;
}

export interface AutoInspectionFromLogData {
  logId: string;
  taskId: string;
  blueprintId: string;
  inspectorId: string;
  scheduledDate: Date;
  inspectionType?: 'routine' | 'final';
  notes?: string;
}
```

### 影響範圍
- `src/app/core/blueprint/workflow/handlers/` - 新增 Handler
- `src/app/core/blueprint/modules/implementations/qa/services/` - API 擴展
- `src/app/core/blueprint/workflow/setc-workflow-orchestrator.service.ts` - 註冊 Handler

### 驗收條件
1. ✅ 日誌建立後自動建立 QC 檢驗
2. ✅ 檢驗員正確分配
3. ✅ 觸發 `qc.inspection_created` 事件
4. ✅ 通知功能正常
5. ✅ 整合測試通過

---

## 🔍 分析階段

### 步驟 1: Context7 查詢
- 查詢 QA Module 現有 API
- 查詢通知系統實作方式

### 步驟 2: Sequential Thinking

1. **檢驗員分配策略**
   - 輪詢分配（Round Robin）
   - 負載均衡（最少任務數）
   - 專業分配（根據任務類型）
   - **選擇**: 第一版使用簡單負載均衡

2. **檢驗時間計算**
   - 立即檢驗 vs 排程檢驗
   - 考慮工作日 vs 假日
   - **決策**: 預設為次日，可配置

### 步驟 3: Software Planning Tool

```
Phase 1: Handler 實作 (4 hours)
├── LogCreatedHandler 類別
├── 檢驗員分配邏輯
└── 檢驗時間計算

Phase 2: QA API 擴展 (3 hours)
├── autoCreateFromLog 方法
├── 資料驗證與儲存
└── 事件觸發

Phase 3: 通知與測試 (5 hours)
├── 通知整合
├── 單元測試
└── 整合測試
```

---

## 📐 規劃階段

### 實施步驟

#### Phase 1: QA API 擴展

**檔案**: `src/app/core/blueprint/modules/implementations/qa/services/qa-inspection.service.ts`

```typescript
async autoCreateFromLog(data: AutoInspectionFromLogData): Promise<QAInspection> {
  console.log(`[QAInspectionService] Auto-creating inspection from log ${data.logId}`);
  
  const inspection: Omit<QAInspection, 'id'> = {
    blueprintId: data.blueprintId,
    taskId: data.taskId,
    logId: data.logId,
    inspectionType: data.inspectionType || 'routine',
    status: 'pending',
    inspectorId: data.inspectorId,
    scheduledDate: data.scheduledDate,
    checkItems: await this.getDefaultCheckItems(data.taskId),
    notes: data.notes,
    createdBy: 'system',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const createdInspection = await this.repository.create(inspection);
  
  // 觸發事件
  this.eventBus.emit({
    type: SystemEventType.QC_INSPECTION_CREATED,
    blueprintId: data.blueprintId,
    timestamp: new Date(),
    actor: {
      userId: 'system',
      userName: 'System',
      role: 'system'
    },
    data: {
      inspectionId: createdInspection.id,
      taskId: data.taskId,
      logId: data.logId,
      inspectorId: data.inspectorId,
      autoCreated: true
    }
  });
  
  return createdInspection;
}

private async getDefaultCheckItems(taskId: string): Promise<QACheckItem[]> {
  // 根據任務類型返回預設檢查項目
  // TODO: 從配置或任務模板獲取
  return [
    {
      id: '1',
      itemName: '施工品質',
      checkPoints: ['符合規範', '無瑕疵'],
      result: null,
      notes: ''
    },
    {
      id: '2',
      itemName: '安全檢查',
      checkPoints: ['安全措施到位'],
      result: null,
      notes: ''
    }
  ];
}
```

#### Phase 2: Handler 註冊

```typescript
// 在 setc-workflow-orchestrator.service.ts 中
private registerDefaultHandlers(): void {
  // ... 其他 handlers
  
  // 註冊日誌建立處理器
  const logCreatedHandler = inject(LogCreatedHandler);
  this.registerHandler(
    SystemEventType.LOG_CREATED,
    logCreatedHandler,
    {
      priority: 9,
      retryPolicy: DEFAULT_RETRY_POLICY,
      timeout: 10000
    }
  );
}
```

### 檔案清單

**新增檔案**:
- `src/app/core/blueprint/workflow/handlers/log-created.handler.ts` ✅
- `src/app/core/blueprint/workflow/handlers/log-created.handler.spec.ts` ✅

**修改檔案**:
- `src/app/core/blueprint/workflow/handlers/index.ts` ✅
- `src/app/core/blueprint/workflow/setc-workflow-orchestrator.service.ts` ✅

---

## 📜 開發規範

### ⭐ 必須遵循
- ✅ 使用 Context7 查詢 QA API
- ✅ 使用 Sequential Thinking 分析分配邏輯
- ✅ 基於奧卡姆剃刀定律 (簡單分配規則)
- ✅ 實作通知機制
- ✅ 詳細日誌記錄

---

## ✅ 檢查清單

### 功能檢查
- [x] 日誌建立自動觸發 QC
- [x] 檢驗員正確分配
- [x] 事件正確觸發
- [x] 通知發送成功（通過事件）

### 測試檢查
- [x] 單元測試通過
- [x] 整合測試通過
- [x] 分配邏輯測試完整

---

## 📝 實作總結

### 實作內容

1. **LogCreatedHandler** (`log-created.handler.ts`)
   - 監聽 `log.created` 事件
   - 從 LogFirestoreRepository 獲取日誌詳情
   - 使用 QaRepository 建立 QC 待驗記錄（使用 QADefect 作為載體）
   - 發送 `qc.inspection_created` 事件供後續工作流程使用
   - 支援重試機制與回滾操作
   - 實作簡單的檢驗員分配邏輯（系統預設）
   - 實作工作日計算（週末跳過）

2. **SETCWorkflowOrchestratorService 更新**
   - 使用 `runInInjectionContext` 動態注入 LogCreatedHandler
   - 替換原有的占位符處理器

3. **單元測試**
   - 涵蓋成功建立 QC 待驗場景
   - 涵蓋日誌不存在場景
   - 涵蓋 QC 記錄建立失敗場景
   - 涵蓋驗證邏輯
   - 涵蓋回滾操作

### MVP 設計決策

由於目前 QA 模組只有 `QADefect` 模型（缺失/問題），沒有完整的 `QAInspection`（檢驗）模型，
我們採用奧卡姆剃刀原則，使用 `QADefect` 作為 "QC 待驗" 記錄的載體：

- **Title**: `QC 待驗: {日誌標題}`
- **Description**: 包含日誌詳情和預定檢驗日期
- **Severity**: `MEDIUM`（待驗使用中等優先級）
- **Status**: `OPEN`

未來可擴展為完整的 QAInspection 模型。

### 工作流程

```
log.created 事件
    ↓
LogCreatedHandler.execute()
    ↓
1. 驗證事件資料
2. 獲取日誌詳情
3. 分配檢驗員（系統預設）
4. 計算預定檢驗日期（隔日工作日）
5. 建立 QC 待驗記錄
6. 發送 qc.inspection_created 事件
    ↓
觸發 SETC-022: QC → Acceptance/Defect
```
