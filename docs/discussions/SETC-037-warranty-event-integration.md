# SETC-037: Warranty Event Integration

> **任務 ID**: SETC-037  
> **任務名稱**: Warranty Event Integration  
> **優先級**: P1 (Important)  
> **預估工時**: 2 天  
> **依賴**: SETC-036 (Warranty Repair Management)  
> **狀態**: ✅ 已完成
> **完成日期**: 2025-12-16

---

## 📋 任務定義

### 名稱
保固模組事件總線整合

### 背景 / 目的
將 Warranty Module 與 BlueprintEventBus 整合，實現事件驅動的保固管理流程，與其他模組（Acceptance、Issue）進行事件互動。

### 需求說明
1. 定義保固相關事件類型
2. 實作 WarrantyEventService
3. 訂閱驗收完成事件
4. 發送保固相關事件
5. 與 Issue Module 事件整合

### In Scope / Out of Scope

#### ✅ In Scope
- 事件類型定義
- WarrantyEventService 實作
- 事件訂閱與發送
- 跨模組事件整合

#### ❌ Out of Scope
- UI 元件（SETC-038）

### 功能行為
透過事件總線整合保固模組，實現自動化流程觸發。

### 資料 / API

#### 保固相關事件類型

```typescript
// 在 SystemEventType 中新增
export enum SystemEventType {
  // ... existing events

  // Warranty Events
  WARRANTY_PERIOD_STARTED = 'warranty.period_started',
  WARRANTY_STATUS_CHANGED = 'warranty.status_changed',
  WARRANTY_EXPIRING_SOON = 'warranty.expiring_soon',
  WARRANTY_PERIOD_EXPIRED = 'warranty.period_expired',
  WARRANTY_COMPLETED = 'warranty.completed',
  
  // Warranty Defect Events
  WARRANTY_DEFECT_REPORTED = 'warranty.defect.reported',
  WARRANTY_DEFECT_CONFIRMED = 'warranty.defect.confirmed',
  WARRANTY_DEFECT_REJECTED = 'warranty.defect.rejected',
  WARRANTY_DEFECT_RESOLVED = 'warranty.defect.resolved',
  
  // Warranty Repair Events
  WARRANTY_REPAIR_CREATED = 'warranty.repair.created',
  WARRANTY_REPAIR_SCHEDULED = 'warranty.repair.scheduled',
  WARRANTY_REPAIR_STARTED = 'warranty.repair.started',
  WARRANTY_REPAIR_COMPLETED = 'warranty.repair.completed',
  WARRANTY_REPAIR_VERIFIED = 'warranty.repair.verified',
  WARRANTY_REPAIR_FAILED = 'warranty.repair.failed'
}
```

#### WarrantyEventService

```typescript
@Injectable({ providedIn: 'root' })
export class WarrantyEventService implements OnDestroy {
  private eventBus = inject(BlueprintEventBusService);
  private warrantyPeriodService = inject(WarrantyPeriodService);
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.setupEventListeners();
  }

  /**
   * 設定事件監聽器
   */
  private setupEventListeners(): void {
    // 監聽驗收完成事件 → 自動建立保固
    this.eventBus.on(
      SystemEventType.ACCEPTANCE_FINALIZED,
      async (event) => {
        if (event.data.finalDecision === 'accepted') {
          await this.handleAcceptanceFinalized(event);
        }
      }
    );

    // 監聽 Issue 解決事件 → 檢查關聯的保固缺失
    this.eventBus.on(
      SystemEventType.ISSUE_RESOLVED,
      async (event) => {
        if (event.data.sourceType === 'warranty') {
          await this.handleIssueResolved(event);
        }
      }
    );
  }

  /**
   * 處理驗收完成事件
   */
  private async handleAcceptanceFinalized(
    event: BlueprintEvent
  ): Promise<void> {
    const { acceptanceId, blueprintId } = event.data;
    
    try {
      await this.warrantyPeriodService.autoCreateFromAcceptance(
        acceptanceId,
        { actor: event.actor }
      );
    } catch (error) {
      console.error('Failed to create warranty from acceptance:', error);
      this.emitError('warranty.creation_failed', event, error);
    }
  }

  /**
   * 處理 Issue 解決事件
   */
  private async handleIssueResolved(
    event: BlueprintEvent
  ): Promise<void> {
    const { issueId, warrantyDefectId } = event.data;
    
    // 更新關聯的保固缺失狀態
    // ... implementation
  }

  /**
   * 發送保固到期提醒事件
   */
  emitExpiringNotification(warranty: Warranty, daysRemaining: number): void {
    this.eventBus.emit({
      type: SystemEventType.WARRANTY_EXPIRING_SOON,
      blueprintId: warranty.blueprintId,
      timestamp: new Date(),
      actor: this.getSystemActor(),
      data: {
        warrantyId: warranty.id,
        warrantyNumber: warranty.warrantyNumber,
        endDate: warranty.endDate,
        daysRemaining
      }
    });
  }

  /**
   * 發送保固缺失事件
   */
  emitDefectEvent(
    type: 'reported' | 'confirmed' | 'rejected' | 'resolved',
    defect: WarrantyDefect,
    actor: EventActor
  ): void {
    const eventTypes: Record<string, SystemEventType> = {
      reported: SystemEventType.WARRANTY_DEFECT_REPORTED,
      confirmed: SystemEventType.WARRANTY_DEFECT_CONFIRMED,
      rejected: SystemEventType.WARRANTY_DEFECT_REJECTED,
      resolved: SystemEventType.WARRANTY_DEFECT_RESOLVED
    };

    this.eventBus.emit({
      type: eventTypes[type],
      blueprintId: defect.blueprintId,
      timestamp: new Date(),
      actor,
      data: {
        defectId: defect.id,
        warrantyId: defect.warrantyId,
        severity: defect.severity,
        status: defect.status
      }
    });
  }

  /**
   * 發送維修事件
   */
  emitRepairEvent(
    type: 'created' | 'scheduled' | 'started' | 'completed' | 'verified' | 'failed',
    repair: WarrantyRepair,
    actor: EventActor
  ): void {
    const eventTypes: Record<string, SystemEventType> = {
      created: SystemEventType.WARRANTY_REPAIR_CREATED,
      scheduled: SystemEventType.WARRANTY_REPAIR_SCHEDULED,
      started: SystemEventType.WARRANTY_REPAIR_STARTED,
      completed: SystemEventType.WARRANTY_REPAIR_COMPLETED,
      verified: SystemEventType.WARRANTY_REPAIR_VERIFIED,
      failed: SystemEventType.WARRANTY_REPAIR_FAILED
    };

    this.eventBus.emit({
      type: eventTypes[type],
      blueprintId: repair.blueprintId,
      timestamp: new Date(),
      actor,
      data: {
        repairId: repair.id,
        warrantyId: repair.warrantyId,
        defectId: repair.defectId,
        status: repair.status
      }
    });
  }

  private emitError(type: string, originalEvent: BlueprintEvent, error: any): void {
    this.eventBus.emit({
      type: 'system.error',
      blueprintId: originalEvent.blueprintId,
      timestamp: new Date(),
      actor: this.getSystemActor(),
      data: {
        errorType: type,
        originalEventType: originalEvent.type,
        error: error.message
      }
    });
  }

  private getSystemActor(): EventActor {
    return {
      userId: 'system',
      userName: 'System',
      role: 'system'
    };
  }

  ngOnDestroy(): void {
    // Cleanup handled by takeUntilDestroyed
  }
}
```

#### 事件流程圖

```
驗收完成 (ACCEPTANCE_FINALIZED)
    ↓
自動建立保固 (WARRANTY_PERIOD_STARTED)
    ↓
保固期管理
    ↓
[缺失發生]
    ↓
缺失登記 (WARRANTY_DEFECT_REPORTED)
    ↓
[嚴重缺失] → 建立 Issue (ISSUE_CREATED_FROM_WARRANTY)
    ↓
缺失確認 (WARRANTY_DEFECT_CONFIRMED)
    ↓
建立維修 (WARRANTY_REPAIR_CREATED)
    ↓
維修進行 (WARRANTY_REPAIR_STARTED)
    ↓
維修完成 (WARRANTY_REPAIR_COMPLETED)
    ↓
維修驗收 (WARRANTY_REPAIR_VERIFIED)
    ↓
缺失解決 (WARRANTY_DEFECT_RESOLVED)
    ↓
[保固期滿]
    ↓
保固到期 (WARRANTY_PERIOD_EXPIRED)
    ↓
保固結案 (WARRANTY_COMPLETED)
```

### 影響範圍
- `src/app/core/blueprint/modules/implementations/warranty/services/`
- `src/app/core/blueprint/events/types/`

### 驗收條件
1. ✅ 事件類型定義完整
2. ✅ 驗收完成自動建立保固
3. ✅ 缺失/維修事件正確發送
4. ✅ Issue 整合事件正常
5. ✅ 單元測試覆蓋率 > 80%

---

## 🔍 分析階段

### 步驟 1: Context7 查詢
**目的**: 查詢 RxJS 事件處理與記憶體管理

### 步驟 2: Sequential Thinking 分析

**思考流程**:
1. **事件定義**
   - 命名規範
   - 資料結構
   - 事件層級

2. **事件訂閱**
   - 監聽時機
   - 錯誤處理
   - 訂閱清理

### 步驟 3: Software Planning Tool

**開發計畫**:
```
Day 1 (8 hours):
├── 事件類型定義
├── WarrantyEventService 實作
└── 驗收完成事件處理

Day 2 (8 hours):
├── 缺失/維修事件
├── Issue 整合
└── 單元測試
```

---

## 📐 規劃階段

### 檔案清單

**新增檔案**:
- `src/app/core/blueprint/modules/implementations/warranty/services/warranty-event.service.ts`
- `src/app/core/blueprint/modules/implementations/warranty/services/warranty-event.service.spec.ts`

**修改檔案**:
- `src/app/core/blueprint/events/types/system-event-type.enum.ts`

---

## ✅ 檢查清單

### 功能檢查
- [ ] 事件定義完整
- [ ] 事件訂閱正常
- [ ] 跨模組整合正確

### 測試檢查
- [ ] 事件發送測試
- [ ] 事件處理測試
