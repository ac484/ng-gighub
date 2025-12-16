# SETC-018: Event Bus 強化與事件類型定義

> **任務 ID**: SETC-018  
> **任務名稱**: Event Bus Enhancement & Event Type Definitions  
> **優先級**: P0 (Critical)  
> **預估工時**: 2 天  
> **依賴**: 無  
> **狀態**: ✅ 已完成
> **實作 Commit**: 見 PR 提交記錄

---

## 📋 任務定義

### 名稱
Event Bus 強化與統一事件類型定義

### 背景 / 目的
為實現 SETC.md 定義的自動化工作流程，需要強化現有的 Event Bus 機制，並建立統一的事件類型定義系統。這是實作事件驅動自動化的基礎設施。

### 需求說明
1. 強化 BlueprintEventBus 功能
2. 定義 SystemEventType 完整列舉
3. 建立事件驗證機制
4. 實作事件序列化/反序列化
5. 建立事件追蹤與日誌系統
6. 實作事件優先級機制

### In Scope / Out of Scope

#### ✅ In Scope
- Event Bus 功能強化
- SystemEventType 完整定義
- 事件驗證與序列化
- 事件日誌記錄
- 事件優先級支援
- 文檔與測試

#### ❌ Out of Scope
- Workflow Orchestrator 實作（SETC-019）
- 具體業務邏輯處理器（SETC-020~023）
- UI 元件
- 效能優化（未來階段）

### 功能行為
提供強化的事件總線功能，支援統一的事件類型定義、驗證、日誌記錄與優先級處理。

### 資料 / API

#### SystemEventType 完整定義

```typescript
/**
 * 系統事件類型 - 完整列舉
 * 命名規範: [module].[action]
 */
export enum SystemEventType {
  // Contract Events
  CONTRACT_CREATED = 'contract.created',
  CONTRACT_UPDATED = 'contract.updated',
  CONTRACT_ACTIVATED = 'contract.activated',
  CONTRACT_COMPLETED = 'contract.completed',
  CONTRACT_TERMINATED = 'contract.terminated',
  CONTRACT_WORK_ITEM_CREATED = 'contract.work_item.created',
  CONTRACT_WORK_ITEM_UPDATED = 'contract.work_item.updated',
  
  // Task Events
  TASK_CREATED = 'task.created',
  TASK_UPDATED = 'task.updated',
  TASK_ASSIGNED = 'task.assigned',
  TASK_STARTED = 'task.started',
  TASK_COMPLETED = 'task.completed',  // ⭐ 觸發日誌建立
  TASK_CANCELLED = 'task.cancelled',
  
  // Log Events
  LOG_CREATED = 'log.created',  // ⭐ 觸發 QC 建立
  LOG_UPDATED = 'log.updated',
  LOG_DELETED = 'log.deleted',
  
  // QA/QC Events
  QC_INSPECTION_CREATED = 'qc.inspection_created',
  QC_INSPECTION_STARTED = 'qc.inspection_started',
  QC_INSPECTION_PASSED = 'qc.inspection_passed',  // ⭐ 觸發驗收
  QC_INSPECTION_FAILED = 'qc.inspection_failed',  // ⭐ 觸發缺失單
  QC_DEFECT_CREATED = 'qc.defect_created',
  QC_DEFECT_RESOLVED = 'qc.defect_resolved',
  
  // Acceptance Events
  ACCEPTANCE_REQUEST_CREATED = 'acceptance.request_created',
  ACCEPTANCE_INSPECTION_SCHEDULED = 'acceptance.inspection_scheduled',
  ACCEPTANCE_INSPECTION_COMPLETED = 'acceptance.inspection_completed',
  ACCEPTANCE_FINALIZED = 'acceptance.finalized',  // ⭐ 觸發請款/保固
  ACCEPTANCE_REJECTED = 'acceptance.rejected',
  
  // Issue Events
  ISSUE_CREATED = 'issue.created',
  ISSUE_CREATED_FROM_ACCEPTANCE = 'issue.created_from_acceptance',
  ISSUE_CREATED_FROM_QC = 'issue.created_from_qc',
  ISSUE_CREATED_FROM_WARRANTY = 'issue.created_from_warranty',
  ISSUE_UPDATED = 'issue.updated',
  ISSUE_RESOLVED = 'issue.resolved',
  ISSUE_VERIFIED = 'issue.verified',
  ISSUE_CLOSED = 'issue.closed',
  
  // Finance Events
  INVOICE_GENERATED = 'invoice.generated',
  INVOICE_SUBMITTED = 'invoice.submitted',
  INVOICE_APPROVED = 'invoice.approved',
  INVOICE_REJECTED = 'invoice.rejected',
  INVOICE_PAID = 'invoice.paid',
  PAYMENT_GENERATED = 'payment.generated',
  PAYMENT_SUBMITTED = 'payment.submitted',
  PAYMENT_APPROVED = 'payment.approved',
  PAYMENT_COMPLETED = 'payment.completed',
  
  // Warranty Events
  WARRANTY_PERIOD_STARTED = 'warranty.period_started',
  WARRANTY_DEFECT_REPORTED = 'warranty.defect_reported',
  WARRANTY_REPAIR_COMPLETED = 'warranty.repair_completed',
  WARRANTY_PERIOD_EXPIRED = 'warranty.period_expired',
  
  // Blueprint Events
  BLUEPRINT_CREATED = 'blueprint.created',
  BLUEPRINT_UPDATED = 'blueprint.updated',
  BLUEPRINT_ARCHIVED = 'blueprint.archived',
}
```

#### 強化的 Event Bus 介面

```typescript
export interface IBlueprintEventBus {
  /**
   * 發送事件
   * @param event 事件物件
   * @param priority 優先級（0-10，數字越大優先級越高）
   */
  emit<T = any>(
    event: BlueprintEvent<T>,
    priority?: EventPriority
  ): void;
  
  /**
   * 訂閱事件
   * @param eventType 事件類型
   * @param handler 處理函式
   * @param options 訂閱選項
   * @returns 取消訂閱函式
   */
  on<T = any>(
    eventType: SystemEventType | string,
    handler: EventHandler<T>,
    options?: SubscriptionOptions
  ): UnsubscribeFunction;
  
  /**
   * 一次性訂閱
   */
  once<T = any>(
    eventType: SystemEventType | string,
    handler: EventHandler<T>
  ): UnsubscribeFunction;
  
  /**
   * 取消訂閱
   */
  off<T = any>(
    eventType: SystemEventType | string,
    handler: EventHandler<T>
  ): void;
  
  /**
   * 驗證事件格式
   */
  validateEvent(event: BlueprintEvent): boolean;
  
  /**
   * 取得事件日誌
   */
  getEventLog(filter?: EventLogFilter): EventLogEntry[];
  
  /**
   * 清除事件日誌
   */
  clearEventLog(): void;
}

export interface BlueprintEvent<T = any> {
  type: SystemEventType | string;
  blueprintId: string;
  timestamp: Date;
  actor: {
    userId: string;
    userName: string;
    role: string;
  };
  data: T;
  metadata?: {
    source?: string;
    correlationId?: string;
    causationId?: string;
    [key: string]: any;
  };
}

export enum EventPriority {
  LOW = 0,
  NORMAL = 5,
  HIGH = 8,
  CRITICAL = 10
}

export interface SubscriptionOptions {
  priority?: EventPriority;
  filter?: (event: BlueprintEvent) => boolean;
  context?: any;
}

export interface EventLogEntry {
  eventId: string;
  event: BlueprintEvent;
  timestamp: Date;
  processingTime?: number;
  error?: Error;
  handlerResults?: any[];
}

export interface EventLogFilter {
  eventTypes?: SystemEventType[];
  blueprintId?: string;
  startTime?: Date;
  endTime?: Date;
  hasError?: boolean;
}
```

### 影響範圍
- `src/app/core/blueprint/events/` - Event Bus 實作
- `src/app/core/blueprint/events/types/` - 事件類型定義
- 所有使用 Event Bus 的模組

### 驗收條件
1. ✅ SystemEventType 完整定義（包含所有模組事件）
2. ✅ Event Bus 支援優先級處理
3. ✅ 事件驗證機制正常運作
4. ✅ 事件日誌正確記錄
5. ✅ 單元測試覆蓋率 > 80%
6. ✅ TypeScript 嚴格模式無錯誤

---

## 🔍 分析階段

### 步驟 1: Context7 查詢
**目的**: 查詢 RxJS 與事件處理最佳實踐

**查詢重點**:
- RxJS Subject vs BehaviorSubject 使用場景
- 事件優先級實作模式
- 錯誤處理與重試機制

### 步驟 2: Sequential Thinking 分析

**思考流程**:
1. **現有 Event Bus 評估**
   - 檢視當前 BlueprintEventBus 實作
   - 識別需要強化的功能點
   - 評估向後相容性

2. **事件類型架構設計**
   - 確定事件命名規範
   - 建立事件分類體系
   - 設計事件繼承結構

3. **優先級機制設計**
   - 評估優先級實作方案
   - 設計優先級佇列機制
   - 考慮效能影響

4. **日誌系統設計**
   - 確定日誌儲存策略
   - 設計日誌查詢介面
   - 考慮記憶體與效能

### 步驟 3: Software Planning Tool

**開發計畫**:
```
Phase 1: 事件類型定義 (4 hours)
├── SystemEventType 列舉定義
├── BlueprintEvent 介面強化
└── 事件類型文檔

Phase 2: Event Bus 強化 (8 hours)
├── 優先級機制實作
├── 事件驗證邏輯
├── 序列化/反序列化
└── 錯誤處理增強

Phase 3: 日誌系統 (4 hours)
├── EventLogEntry 結構
├── 日誌記錄邏輯
├── 日誌查詢方法
└── 日誌清理機制

Phase 4: 測試與文檔 (4 hours)
├── 單元測試
├── 整合測試
├── API 文檔
└── 使用範例
```

---

## 📐 規劃階段

### 實施步驟

#### Phase 1: 事件類型定義 (4 hours)

**檔案**: `src/app/core/blueprint/events/types/system-event-type.enum.ts`
```typescript
export enum SystemEventType {
  // ... 完整事件類型定義
}
```

**檔案**: `src/app/core/blueprint/events/models/blueprint-event.model.ts`
```typescript
export interface BlueprintEvent<T = any> {
  type: SystemEventType | string;
  blueprintId: string;
  timestamp: Date;
  actor: EventActor;
  data: T;
  metadata?: EventMetadata;
}

export interface EventActor {
  userId: string;
  userName: string;
  role: string;
}

export interface EventMetadata {
  source?: string;
  correlationId?: string;
  causationId?: string;
  [key: string]: any;
}
```

#### Phase 2: Event Bus 強化 (8 hours)

**檔案**: `src/app/core/blueprint/events/blueprint-event-bus.service.ts`
```typescript
@Injectable({ providedIn: 'root' })
export class BlueprintEventBusService implements IBlueprintEventBus {
  private eventStreams = new Map<string, Subject<BlueprintEvent>>();
  private eventLog: EventLogEntry[] = [];
  private maxLogSize = 1000;

  emit<T = any>(
    event: BlueprintEvent<T>,
    priority: EventPriority = EventPriority.NORMAL
  ): void {
    if (!this.validateEvent(event)) {
      throw new Error(`Invalid event format: ${JSON.stringify(event)}`);
    }
    
    // 記錄事件
    this.logEvent(event);
    
    // 發送到對應的 stream
    const stream = this.getOrCreateStream(event.type);
    stream.next(event);
    
    // 發送到全域 stream
    const globalStream = this.getOrCreateStream('*');
    globalStream.next(event);
  }

  on<T = any>(
    eventType: SystemEventType | string,
    handler: EventHandler<T>,
    options?: SubscriptionOptions
  ): UnsubscribeFunction {
    const stream = this.getOrCreateStream(eventType);
    
    let observable = stream.asObservable();
    
    // 應用過濾器
    if (options?.filter) {
      observable = observable.pipe(
        filter(options.filter)
      );
    }
    
    const subscription = observable.subscribe({
      next: handler,
      error: (error) => this.handleError(error, eventType)
    });
    
    return () => subscription.unsubscribe();
  }

  validateEvent(event: BlueprintEvent): boolean {
    return !!(
      event.type &&
      event.blueprintId &&
      event.timestamp &&
      event.actor &&
      event.data !== undefined
    );
  }

  private logEvent(event: BlueprintEvent): void {
    const entry: EventLogEntry = {
      eventId: this.generateEventId(),
      event,
      timestamp: new Date()
    };
    
    this.eventLog.push(entry);
    
    // 限制日誌大小
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift();
    }
  }

  private getOrCreateStream(eventType: string): Subject<BlueprintEvent> {
    if (!this.eventStreams.has(eventType)) {
      this.eventStreams.set(eventType, new Subject<BlueprintEvent>());
    }
    return this.eventStreams.get(eventType)!;
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

#### Phase 3: 日誌系統 (4 hours)

**日誌查詢方法**:
```typescript
getEventLog(filter?: EventLogFilter): EventLogEntry[] {
  let logs = [...this.eventLog];
  
  if (filter) {
    if (filter.eventTypes) {
      logs = logs.filter(log =>
        filter.eventTypes!.includes(log.event.type as SystemEventType)
      );
    }
    
    if (filter.blueprintId) {
      logs = logs.filter(log =>
        log.event.blueprintId === filter.blueprintId
      );
    }
    
    if (filter.startTime) {
      logs = logs.filter(log =>
        log.timestamp >= filter.startTime!
      );
    }
    
    if (filter.endTime) {
      logs = logs.filter(log =>
        log.timestamp <= filter.endTime!
      );
    }
    
    if (filter.hasError !== undefined) {
      logs = logs.filter(log =>
        filter.hasError ? !!log.error : !log.error
      );
    }
  }
  
  return logs;
}

clearEventLog(): void {
  this.eventLog = [];
}
```

#### Phase 4: 測試與文檔 (4 hours)

**單元測試**: `blueprint-event-bus.service.spec.ts`
```typescript
describe('BlueprintEventBusService', () => {
  let service: BlueprintEventBusService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BlueprintEventBusService]
    });
    service = TestBed.inject(BlueprintEventBusService);
  });
  
  it('should emit and receive events', (done) => {
    const testEvent: BlueprintEvent = {
      type: SystemEventType.TASK_COMPLETED,
      blueprintId: 'test-bp',
      timestamp: new Date(),
      actor: { userId: 'user1', userName: 'Test', role: 'admin' },
      data: { taskId: 'task1' }
    };
    
    service.on(SystemEventType.TASK_COMPLETED, (event) => {
      expect(event.data.taskId).toBe('task1');
      done();
    });
    
    service.emit(testEvent);
  });
  
  it('should validate event format', () => {
    const invalidEvent = { type: 'test' } as any;
    expect(() => service.emit(invalidEvent)).toThrow();
  });
  
  it('should log events', () => {
    const testEvent: BlueprintEvent = {
      type: SystemEventType.TASK_CREATED,
      blueprintId: 'test-bp',
      timestamp: new Date(),
      actor: { userId: 'user1', userName: 'Test', role: 'admin' },
      data: {}
    };
    
    service.emit(testEvent);
    const logs = service.getEventLog();
    expect(logs.length).toBeGreaterThan(0);
  });
});
```

### 檔案清單

**新增檔案**:
- `src/app/core/blueprint/events/types/system-event-type.enum.ts`
- `src/app/core/blueprint/events/models/blueprint-event.model.ts`
- `src/app/core/blueprint/events/models/event-priority.enum.ts`
- `src/app/core/blueprint/events/models/event-log-entry.model.ts`

**修改檔案**:
- `src/app/core/blueprint/events/blueprint-event-bus.service.ts`
- `src/app/core/blueprint/events/blueprint-event-bus.service.spec.ts`
- `src/app/core/blueprint/events/index.ts` (exports)

---

## 📜 開發規範

### ⭐ 必須遵循
- ✅ 使用 Context7 查詢 RxJS 最佳實踐
- ✅ 使用 Sequential Thinking 分析優先級機制
- ✅ 使用 Software Planning Tool 制定實施計畫
- ✅ 基於奧卡姆剃刀定律 (KISS, YAGNI, MVP)
- ✅ 事件命名遵循 `[module].[action]` 格式
- ✅ 所有事件必須包含 blueprintId 和 actor

### Angular 20 規範
- ✅ 使用 inject() 注入依賴
- ✅ 使用 signal() 管理狀態（如需要）
- ✅ 使用 takeUntilDestroyed() 管理訂閱
- ✅ Injectable providedIn: 'root'

### 錯誤處理
```typescript
private handleError(error: Error, eventType: string): void {
  console.error(`Event handler error for ${eventType}:`, error);
  
  // 記錄到日誌
  const lastLog = this.eventLog[this.eventLog.length - 1];
  if (lastLog) {
    lastLog.error = error;
  }
  
  // 發送錯誤事件
  this.emit({
    type: 'system.error',
    blueprintId: 'system',
    timestamp: new Date(),
    actor: { userId: 'system', userName: 'System', role: 'system' },
    data: { originalEvent: eventType, error: error.message }
  });
}
```

---

## ✅ 檢查清單

### 架構檢查
- [ ] 遵循三層架構原則
- [ ] 使用 inject() 注入依賴
- [ ] 事件類型定義完整
- [ ] 向後相容性確保

### 功能檢查
- [ ] 事件發送正常運作
- [ ] 事件訂閱正常運作
- [ ] 事件驗證機制有效
- [ ] 事件日誌記錄正確
- [ ] 優先級機制實作

### 測試檢查
- [ ] 單元測試覆蓋率 > 80%
- [ ] 事件發送/接收測試
- [ ] 驗證機制測試
- [ ] 日誌系統測試
- [ ] 錯誤處理測試

### 文檔檢查
- [ ] JSDoc 註解完整
- [ ] API 文檔更新
- [ ] 使用範例提供
- [ ] AGENTS.md 更新
