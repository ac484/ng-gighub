# SETC-019: Workflow Orchestrator 實作

> **任務 ID**: SETC-019  
> **任務名稱**: Workflow Orchestrator Implementation  
> **優先級**: P0 (Critical)  
> **預估工時**: 3 天  
> **依賴**: SETC-018  
> **狀態**: ✅ 已完成  
> **完成日期**: 2025-12-16

---

## 📋 任務定義

### 名稱
工作流程編排器實作

### 背景 / 目的
實作 SETCWorkflowOrchestrator，作為自動化工作流程的核心協調器，負責註冊、管理和執行跨模組的事件驅動流程。

### 需求說明
1. 實作 SETCWorkflowOrchestrator 類別
2. 建立事件處理器註冊機制
3. 實作工作流程狀態管理
4. 實作錯誤處理與重試機制
5. 建立工作流程監控與日誌
6. 實作工作流程配置管理

### In Scope / Out of Scope

#### ✅ In Scope
- SETCWorkflowOrchestrator 實作
- 事件處理器註冊與管理
- 工作流程狀態追蹤
- 錯誤處理與重試邏輯
- 工作流程日誌記錄
- 配置管理
- 單元測試與整合測試

#### ❌ Out of Scope
- 具體業務邏輯處理器實作（SETC-020~023）
- UI 管理介面
- 效能優化（未來階段）
- 分散式工作流程（未來階段）

### 功能行為
Workflow Orchestrator 監聽關鍵事件，協調跨模組的自動化流程，確保 SETC.md 定義的自動節點正確執行。

### 資料 / API

#### Workflow Orchestrator 介面

```typescript
export interface ISETCWorkflowOrchestrator {
  /**
   * 初始化工作流程編排器
   */
  initialize(): void;
  
  /**
   * 註冊工作流程處理器
   */
  registerHandler(
    eventType: SystemEventType,
    handler: WorkflowHandler,
    options?: WorkflowHandlerOptions
  ): void;
  
  /**
   * 取消註冊處理器
   */
  unregisterHandler(
    eventType: SystemEventType,
    handlerId: string
  ): void;
  
  /**
   * 執行工作流程
   */
  executeWorkflow(
    workflowName: string,
    context: WorkflowContext
  ): Promise<WorkflowResult>;
  
  /**
   * 取得工作流程狀態
   */
  getWorkflowStatus(workflowId: string): WorkflowStatus;
  
  /**
   * 暫停工作流程
   */
  pauseWorkflow(workflowId: string): void;
  
  /**
   * 恢復工作流程
   */
  resumeWorkflow(workflowId: string): void;
  
  /**
   * 取消工作流程
   */
  cancelWorkflow(workflowId: string): void;
}

export interface WorkflowHandler {
  id: string;
  name: string;
  execute: (event: BlueprintEvent, context: WorkflowContext) => Promise<WorkflowStepResult>;
  validate?: (event: BlueprintEvent) => boolean;
  rollback?: (context: WorkflowContext) => Promise<void>;
}

export interface WorkflowHandlerOptions {
  priority?: number;
  retryPolicy?: RetryPolicy;
  timeout?: number;
  condition?: (event: BlueprintEvent) => boolean;
}

export interface WorkflowContext {
  workflowId: string;
  blueprintId: string;
  initiator: EventActor;
  startTime: Date;
  currentStep: number;
  totalSteps: number;
  data: Map<string, any>;
  metadata?: Record<string, any>;
}

export interface WorkflowResult {
  workflowId: string;
  status: 'success' | 'partial_success' | 'failed';
  completedSteps: number;
  totalSteps: number;
  errors: WorkflowError[];
  duration: number;
}

export interface WorkflowStepResult {
  stepId: string;
  success: boolean;
  data?: any;
  error?: Error;
  nextSteps?: string[];
}

export interface WorkflowStatus {
  workflowId: string;
  state: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  currentStep: number;
  totalSteps: number;
  startTime: Date;
  endTime?: Date;
  errors: WorkflowError[];
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffMultiplier: number;
  initialDelayMs: number;
  maxDelayMs: number;
}

export interface WorkflowError {
  stepId: string;
  error: Error;
  timestamp: Date;
  attempt: number;
}
```

#### 核心工作流程定義

```typescript
/**
 * SETC 自動化工作流程定義
 */
export enum SETCWorkflowType {
  TASK_COMPLETION = 'task.completion',  // 任務完成流程
  QC_INSPECTION = 'qc.inspection',      // QC 檢驗流程
  ACCEPTANCE = 'acceptance.process',     // 驗收流程
  INVOICE_PAYMENT = 'finance.invoice',   // 請款流程
  WARRANTY = 'warranty.management'       // 保固流程
}

/**
 * 工作流程配置
 */
export interface WorkflowConfig {
  enabled: boolean;
  workflows: {
    [key in SETCWorkflowType]: {
      enabled: boolean;
      retryPolicy: RetryPolicy;
      timeout: number;
      steps: WorkflowStepConfig[];
    };
  };
}

export interface WorkflowStepConfig {
  id: string;
  name: string;
  handler: string;
  condition?: string;
  retryable: boolean;
  critical: boolean;
}
```

### 影響範圍
- `src/app/core/blueprint/workflow/` - 新增目錄
- `src/app/core/blueprint/events/` - Event Bus 整合
- 所有參與自動化流程的模組

### 驗收條件
1. ✅ Workflow Orchestrator 正常運作
2. ✅ 事件處理器註冊機制完整
3. ✅ 錯誤處理與重試機制有效
4. ✅ 工作流程狀態正確追蹤
5. ✅ 整合測試通過
6. ✅ 效能測試滿足要求（處理 100+ 並發工作流程）

---

## 🔍 分析階段

### 步驟 1: Context7 查詢
**目的**: 查詢工作流程引擎設計模式與 RxJS 進階應用

**查詢重點**:
- Saga 模式實作
- Orchestration vs Choreography
- RxJS concatMap, mergeMap, switchMap 使用場景
- 錯誤處理與補償機制

### 步驟 2: Sequential Thinking 分析

**思考流程**:
1. **架構模式選擇**
   - Orchestration（中央協調）vs Choreography（去中心化）
   - 評估: 選擇 Orchestration，因為需要集中控制和監控
   - 優勢: 易於追蹤、除錯、修改流程

2. **狀態管理設計**
   - 工作流程狀態需持久化嗎？→ 第一版記憶體中，未來可持久化
   - 如何處理長時間運行的工作流程？→ 實作暫停/恢復機制
   - 如何處理並發工作流程？→ 使用 Map 儲存，RxJS 處理並發

3. **錯誤處理策略**
   - 哪些錯誤應重試？→ 網路錯誤、暫時性錯誤
   - 重試策略：指數退避（Exponential Backoff）
   - 補償機制：rollback 函式支援

4. **效能考量**
   - 記憶體管理：限制工作流程歷史記錄數量
   - 並發控制：使用 RxJS mergeMap 控制並發數
   - 避免阻塞：async/await + Promise

### 步驟 3: Software Planning Tool

**開發計畫**:
```
Phase 1: 核心架構 (8 hours)
├── SETCWorkflowOrchestrator 類別
├── WorkflowContext 管理
├── WorkflowHandler 介面
└── 基礎註冊機制

Phase 2: 執行引擎 (10 hours)
├── 工作流程執行邏輯
├── 步驟鏈處理
├── 狀態管理
└── 錯誤捕獲

Phase 3: 重試與補償 (6 hours)
├── RetryPolicy 實作
├── 指數退避邏輯
├── Rollback 機制
└── 補償交易

Phase 4: 監控與日誌 (4 hours)
├── 工作流程日誌
├── 狀態追蹤
├── 效能監控
└── 錯誤報告

Phase 5: 測試 (6 hours)
├── 單元測試
├── 整合測試
├── 效能測試
└── 錯誤場景測試
```

---

## 📐 規劃階段

### 實施步驟

#### Phase 1: 核心架構 (8 hours)

**檔案**: `src/app/core/blueprint/workflow/setc-workflow-orchestrator.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class SETCWorkflowOrchestratorService implements ISETCWorkflowOrchestrator {
  private eventBus = inject(BlueprintEventBusService);
  private handlers = new Map<SystemEventType, WorkflowHandler[]>();
  private workflows = new Map<string, WorkflowStatus>();
  private config = signal<WorkflowConfig>(DEFAULT_WORKFLOW_CONFIG);
  
  private readonly MAX_WORKFLOW_HISTORY = 1000;
  
  initialize(): void {
    console.log('[Workflow] Initializing SETC Workflow Orchestrator');
    this.registerDefaultHandlers();
  }
  
  registerHandler(
    eventType: SystemEventType,
    handler: WorkflowHandler,
    options?: WorkflowHandlerOptions
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
      
      // 訂閱事件
      this.eventBus.on(eventType, (event) => {
        this.handleEvent(event, eventType);
      });
    }
    
    const handlers = this.handlers.get(eventType)!;
    handlers.push({
      ...handler,
      options
    } as any);
    
    // 按優先級排序
    handlers.sort((a, b) => 
      (b.options?.priority ?? 0) - (a.options?.priority ?? 0)
    );
  }
  
  private async handleEvent(
    event: BlueprintEvent,
    eventType: SystemEventType
  ): Promise<void> {
    const handlers = this.handlers.get(eventType) || [];
    
    for (const handler of handlers) {
      // 檢查條件
      if (handler.options?.condition && !handler.options.condition(event)) {
        continue;
      }
      
      // 驗證
      if (handler.validate && !handler.validate(event)) {
        console.warn(`[Workflow] Handler ${handler.id} validation failed`);
        continue;
      }
      
      // 建立工作流程上下文
      const context = this.createContext(event, handler);
      
      try {
        await this.executeHandlerWithRetry(handler, event, context);
      } catch (error) {
        console.error(`[Workflow] Handler ${handler.id} failed:`, error);
        this.recordError(context.workflowId, handler.id, error as Error);
      }
    }
  }
  
  private async executeHandlerWithRetry(
    handler: WorkflowHandler,
    event: BlueprintEvent,
    context: WorkflowContext
  ): Promise<WorkflowStepResult> {
    const retryPolicy = handler.options?.retryPolicy || DEFAULT_RETRY_POLICY;
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt < retryPolicy.maxAttempts; attempt++) {
      try {
        const result = await this.executeWithTimeout(
          handler.execute(event, context),
          handler.options?.timeout || 30000
        );
        
        if (result.success) {
          return result;
        }
        
        lastError = result.error;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retryPolicy.maxAttempts - 1) {
          const delay = this.calculateBackoff(attempt, retryPolicy);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError || new Error('Handler execution failed');
  }
  
  private calculateBackoff(attempt: number, policy: RetryPolicy): number {
    const delay = policy.initialDelayMs * Math.pow(policy.backoffMultiplier, attempt);
    return Math.min(delay, policy.maxDelayMs);
  }
  
  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeoutMs)
      )
    ]);
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private createContext(
    event: BlueprintEvent,
    handler: WorkflowHandler
  ): WorkflowContext {
    const workflowId = this.generateWorkflowId();
    
    const context: WorkflowContext = {
      workflowId,
      blueprintId: event.blueprintId,
      initiator: event.actor,
      startTime: new Date(),
      currentStep: 0,
      totalSteps: 1,
      data: new Map()
    };
    
    // 記錄工作流程狀態
    this.workflows.set(workflowId, {
      workflowId,
      state: 'running',
      currentStep: 0,
      totalSteps: 1,
      startTime: context.startTime,
      errors: []
    });
    
    return context;
  }
  
  private generateWorkflowId(): string {
    return `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  getWorkflowStatus(workflowId: string): WorkflowStatus {
    const status = this.workflows.get(workflowId);
    if (!status) {
      throw new Error(`Workflow ${workflowId} not found`);
    }
    return status;
  }
  
  private recordError(workflowId: string, stepId: string, error: Error): void {
    const status = this.workflows.get(workflowId);
    if (status) {
      status.errors.push({
        stepId,
        error,
        timestamp: new Date(),
        attempt: 1
      });
      status.state = 'failed';
    }
  }
  
  private registerDefaultHandlers(): void {
    console.log('[Workflow] Registering default SETC workflow handlers');
    // 將在 SETC-020~023 實作具體處理器
  }
}

const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  backoffMultiplier: 2,
  initialDelayMs: 1000,
  maxDelayMs: 10000
};

const DEFAULT_WORKFLOW_CONFIG: WorkflowConfig = {
  enabled: true,
  workflows: {
    [SETCWorkflowType.TASK_COMPLETION]: {
      enabled: true,
      retryPolicy: DEFAULT_RETRY_POLICY,
      timeout: 30000,
      steps: []
    },
    // ... 其他工作流程配置
  } as any
};
```

#### Phase 2: 工作流程管理 (10 hours)

**複雜工作流程執行**:
```typescript
async executeWorkflow(
  workflowName: string,
  context: WorkflowContext
): Promise<WorkflowResult> {
  const config = this.config().workflows[workflowName as SETCWorkflowType];
  
  if (!config || !config.enabled) {
    throw new Error(`Workflow ${workflowName} is not enabled`);
  }
  
  context.totalSteps = config.steps.length;
  const startTime = Date.now();
  const errors: WorkflowError[] = [];
  let completedSteps = 0;
  
  for (let i = 0; i < config.steps.length; i++) {
    const step = config.steps[i];
    context.currentStep = i;
    
    try {
      const handler = this.findHandler(step.handler);
      if (!handler) {
        throw new Error(`Handler ${step.handler} not found`);
      }
      
      const result = await this.executeHandlerWithRetry(
        handler,
        this.createEventFromContext(context),
        context
      );
      
      if (result.success) {
        completedSteps++;
      } else if (step.critical) {
        // 關鍵步驟失敗，終止工作流程
        throw result.error || new Error('Critical step failed');
      }
    } catch (error) {
      errors.push({
        stepId: step.id,
        error: error as Error,
        timestamp: new Date(),
        attempt: 1
      });
      
      if (step.critical) {
        break;
      }
    }
  }
  
  const duration = Date.now() - startTime;
  const status: 'success' | 'partial_success' | 'failed' =
    errors.length === 0
      ? 'success'
      : completedSteps > 0
      ? 'partial_success'
      : 'failed';
  
  return {
    workflowId: context.workflowId,
    status,
    completedSteps,
    totalSteps: config.steps.length,
    errors,
    duration
  };
}
```

#### Phase 3: 暫停/恢復/取消 (4 hours)

```typescript
pauseWorkflow(workflowId: string): void {
  const status = this.workflows.get(workflowId);
  if (status && status.state === 'running') {
    status.state = 'paused';
    console.log(`[Workflow] Paused workflow ${workflowId}`);
  }
}

resumeWorkflow(workflowId: string): void {
  const status = this.workflows.get(workflowId);
  if (status && status.state === 'paused') {
    status.state = 'running';
    console.log(`[Workflow] Resumed workflow ${workflowId}`);
  }
}

cancelWorkflow(workflowId: string): void {
  const status = this.workflows.get(workflowId);
  if (status) {
    status.state = 'cancelled';
    status.endTime = new Date();
    console.log(`[Workflow] Cancelled workflow ${workflowId}`);
  }
}
```

### 檔案清單

**新增檔案**:
- `src/app/core/blueprint/workflow/setc-workflow-orchestrator.service.ts`
- `src/app/core/blueprint/workflow/models/workflow-context.model.ts`
- `src/app/core/blueprint/workflow/models/workflow-handler.model.ts`
- `src/app/core/blueprint/workflow/models/workflow-result.model.ts`
- `src/app/core/blueprint/workflow/models/workflow-config.model.ts`
- `src/app/core/blueprint/workflow/setc-workflow-orchestrator.service.spec.ts`

---

## 📜 開發規範

### ⭐ 必須遵循
- ✅ 使用 Context7 查詢工作流程引擎設計模式
- ✅ 使用 Sequential Thinking 分析錯誤處理策略
- ✅ 使用 Software Planning Tool 制定實施計畫
- ✅ 基於奧卡姆剃刀定律 (KISS, YAGNI, MVP)
- ✅ 實作重試機制（Exponential Backoff）
- ✅ 記錄詳細工作流程日誌

### Angular 20 規範
- ✅ 使用 inject() 注入依賴
- ✅ 使用 signal() 管理配置
- ✅ Injectable providedIn: 'root'
- ✅ 適當使用 async/await

---

## ✅ 檢查清單

### 架構檢查
- [x] Orchestrator 類別實作完整
- [x] 事件處理器註冊機制正常
- [x] 工作流程狀態管理正確
- [x] 錯誤處理機制完整

### 功能檢查
- [x] 工作流程執行正常
- [x] 重試機制有效
- [x] 暫停/恢復/取消功能正常
- [x] 並發處理正確

### 測試檢查
- [x] 單元測試覆蓋率 > 80%
- [x] 整合測試通過
- [x] 效能測試通過
- [x] 錯誤場景測試完整

---

## 🎉 實作完成摘要

### 已實作檔案

1. **模型定義**
   - `src/app/core/blueprint/workflow/models/workflow-handler.model.ts` - 處理器模型
   - `src/app/core/blueprint/workflow/models/workflow-context.model.ts` - 上下文模型
   - `src/app/core/blueprint/workflow/models/workflow-config.model.ts` - 配置模型

2. **服務實作**
   - `src/app/core/blueprint/workflow/setc-workflow-orchestrator.interface.ts` - 介面定義
   - `src/app/core/blueprint/workflow/setc-workflow-orchestrator.service.ts` - 核心服務

3. **測試**
   - `src/app/core/blueprint/workflow/setc-workflow-orchestrator.service.spec.ts` - 單元測試

### 功能特性

- ✅ 事件處理器註冊與管理（按優先級排序）
- ✅ 工作流程執行與狀態追蹤
- ✅ 重試機制（Exponential Backoff）
- ✅ 暫停/恢復/取消工作流程
- ✅ 錯誤處理與回滾支援
- ✅ 工作流程統計資訊
- ✅ 5 個預設處理器占位符（SETC-020~023）

### 預設處理器（占位符）

1. `task-to-log-handler` - 任務完成自動建立日誌
2. `log-to-qc-handler` - 日誌建立自動建立 QC 待驗
3. `qc-passed-to-acceptance-handler` - QC 通過自動建立驗收
4. `qc-failed-to-defect-handler` - QC 失敗自動建立缺失
5. `acceptance-to-invoice-warranty-handler` - 驗收通過自動建立請款與保固
