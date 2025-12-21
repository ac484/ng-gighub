# SETC-036: Warranty Repair Management Service

> **任務 ID**: SETC-036  
> **任務名稱**: Warranty Repair Management Service  
> **優先級**: P1 (Important)  
> **預估工時**: 3 天  
> **依賴**: SETC-035 (Warranty Defect Management)  
> **狀態**: ✅ 已完成
> **完成日期**: 2025-12-16

---

## 📋 任務定義

### 名稱
保固維修管理服務實作

### 背景 / 目的
實作保固維修管理服務，包括維修派工、進度追蹤、完工驗收。根據 SETC.md：保固缺失 → 保固維修 → 結案。

### 需求說明
1. 實作 WarrantyRepairService
2. 維修派工功能
3. 進度追蹤
4. 完工驗收
5. 維修歷史記錄

### In Scope / Out of Scope

#### ✅ In Scope
- WarrantyRepairService 實作
- 維修派工
- 進度追蹤
- 完工驗收
- 狀態管理

#### ❌ Out of Scope
- UI 元件（SETC-038）

### 功能行為
管理保固維修流程，從派工到驗收完成。

### 資料 / API

#### WarrantyRepairService

```typescript
@Injectable({ providedIn: 'root' })
export class WarrantyRepairService {
  private repairRepository = inject(WarrantyRepairRepository);
  private defectRepository = inject(WarrantyDefectRepository);
  private warrantyRepository = inject(WarrantyRepository);
  private eventBus = inject(BlueprintEventBusService);

  /**
   * 建立維修工單
   */
  async createRepair(
    data: CreateRepairDto,
    actor: EventActor
  ): Promise<WarrantyRepair> {
    const defect = await this.defectRepository.getById(
      data.blueprintId,
      data.warrantyId,
      data.defectId
    );
    
    if (!defect) {
      throw new Error(`Defect not found: ${data.defectId}`);
    }

    if (defect.status !== 'confirmed') {
      throw new Error(`Defect must be confirmed before repair: ${defect.status}`);
    }

    const repair: Omit<WarrantyRepair, 'id'> = {
      warrantyId: data.warrantyId,
      defectId: data.defectId,
      blueprintId: data.blueprintId,
      repairNumber: this.generateRepairNumber(),
      description: data.description,
      repairMethod: data.repairMethod,
      contractor: data.contractor,
      assignedWorkers: data.assignedWorkers ?? [],
      scheduledDate: data.scheduledDate,
      status: data.scheduledDate ? 'scheduled' : 'pending',
      costResponsibility: 'warrantor',
      completionPhotos: [],
      createdBy: actor.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const created = await this.repairRepository.create(repair);

    // 更新缺失狀態
    await this.defectRepository.update(
      data.blueprintId,
      data.warrantyId,
      data.defectId,
      { status: 'under_repair', repairId: created.id }
    );

    // 更新保固記錄
    const warranty = await this.warrantyRepository.getById(
      data.blueprintId,
      data.warrantyId
    );
    await this.warrantyRepository.update(
      data.blueprintId,
      data.warrantyId,
      { repairCount: (warranty?.repairCount ?? 0) + 1 }
    );

    return created;
  }

  /**
   * 排程維修
   */
  async scheduleRepair(
    blueprintId: string,
    warrantyId: string,
    repairId: string,
    scheduledDate: Date,
    actor: EventActor
  ): Promise<WarrantyRepair> {
    const repair = await this.repairRepository.getById(
      blueprintId,
      warrantyId,
      repairId
    );
    
    if (!repair) {
      throw new Error(`Repair not found: ${repairId}`);
    }

    RepairStateMachine.validateTransition(repair.status, 'scheduled');

    await this.repairRepository.update(
      blueprintId,
      warrantyId,
      repairId,
      {
        status: 'scheduled',
        scheduledDate,
        updatedBy: actor.userId
      }
    );

    return { ...repair, status: 'scheduled', scheduledDate };
  }

  /**
   * 開始維修
   */
  async startRepair(
    blueprintId: string,
    warrantyId: string,
    repairId: string,
    actor: EventActor
  ): Promise<WarrantyRepair> {
    const repair = await this.repairRepository.getById(
      blueprintId,
      warrantyId,
      repairId
    );
    
    if (!repair) {
      throw new Error(`Repair not found: ${repairId}`);
    }

    RepairStateMachine.validateTransition(repair.status, 'in_progress');

    await this.repairRepository.update(
      blueprintId,
      warrantyId,
      repairId,
      {
        status: 'in_progress',
        startedDate: new Date(),
        updatedBy: actor.userId
      }
    );

    return { ...repair, status: 'in_progress' };
  }

  /**
   * 完成維修
   */
  async completeRepair(
    blueprintId: string,
    warrantyId: string,
    repairId: string,
    data: CompleteRepairDto,
    actor: EventActor
  ): Promise<WarrantyRepair> {
    const repair = await this.repairRepository.getById(
      blueprintId,
      warrantyId,
      repairId
    );
    
    if (!repair) {
      throw new Error(`Repair not found: ${repairId}`);
    }

    RepairStateMachine.validateTransition(repair.status, 'completed');

    await this.repairRepository.update(
      blueprintId,
      warrantyId,
      repairId,
      {
        status: 'completed',
        completedDate: new Date(),
        completionPhotos: data.photos,
        completionNotes: data.notes,
        cost: data.cost,
        updatedBy: actor.userId
      }
    );

    // 更新缺失狀態
    await this.defectRepository.update(
      blueprintId,
      warrantyId,
      repair.defectId,
      { status: 'repaired' }
    );

    this.eventBus.emit({
      type: SystemEventType.WARRANTY_REPAIR_COMPLETED,
      blueprintId,
      timestamp: new Date(),
      actor,
      data: { repairId, warrantyId, defectId: repair.defectId }
    });

    return { ...repair, status: 'completed' };
  }

  /**
   * 驗收維修
   */
  async verifyRepair(
    blueprintId: string,
    warrantyId: string,
    repairId: string,
    passed: boolean,
    notes: string,
    actor: EventActor
  ): Promise<WarrantyRepair> {
    const repair = await this.repairRepository.getById(
      blueprintId,
      warrantyId,
      repairId
    );
    
    if (!repair) {
      throw new Error(`Repair not found: ${repairId}`);
    }

    const newStatus = passed ? 'verified' : 'failed';
    RepairStateMachine.validateTransition(repair.status, newStatus);

    await this.repairRepository.update(
      blueprintId,
      warrantyId,
      repairId,
      {
        status: newStatus,
        verifiedDate: passed ? new Date() : undefined,
        verificationNotes: notes,
        updatedBy: actor.userId
      }
    );

    // 更新缺失狀態
    const newDefectStatus = passed ? 'verified' : 'under_repair';
    await this.defectRepository.update(
      blueprintId,
      warrantyId,
      repair.defectId,
      { status: newDefectStatus }
    );

    return { ...repair, status: newStatus };
  }

  /**
   * 取得維修進度摘要
   */
  async getRepairSummary(
    blueprintId: string,
    warrantyId: string
  ): Promise<RepairSummary> {
    const repairs = await this.repairRepository.getByWarrantyId(
      blueprintId,
      warrantyId
    );

    return {
      total: repairs.length,
      pending: repairs.filter(r => r.status === 'pending').length,
      scheduled: repairs.filter(r => r.status === 'scheduled').length,
      inProgress: repairs.filter(r => r.status === 'in_progress').length,
      completed: repairs.filter(r => r.status === 'completed').length,
      verified: repairs.filter(r => r.status === 'verified').length,
      failed: repairs.filter(r => r.status === 'failed').length,
      totalCost: repairs.reduce((sum, r) => sum + (r.cost ?? 0), 0)
    };
  }
}
```

#### 相關介面

```typescript
export interface CreateRepairDto {
  blueprintId: string;
  warrantyId: string;
  defectId: string;
  description: string;
  repairMethod: string;
  contractor: WarrantorInfo;
  assignedWorkers?: string[];
  scheduledDate?: Date;
}

export interface CompleteRepairDto {
  photos: FileAttachment[];
  notes?: string;
  cost?: number;
}

export interface RepairSummary {
  total: number;
  pending: number;
  scheduled: number;
  inProgress: number;
  completed: number;
  verified: number;
  failed: number;
  totalCost: number;
}
```

### 影響範圍
- `src/app/core/blueprint/modules/implementations/warranty/services/`

### 驗收條件
1. ✅ 維修派工正常
2. ✅ 進度追蹤準確
3. ✅ 完工驗收完整
4. ✅ 狀態管理正確
5. ✅ 單元測試覆蓋率 > 80%

---

## 🔍 分析階段

### 步驟 1: Context7 查詢
**目的**: 查詢工單管理與狀態機模式

### 步驟 2: Sequential Thinking 分析

**思考流程**:
1. **維修流程**
   - 派工 → 排程 → 進行 → 完成 → 驗收

2. **狀態同步**
   - 維修狀態 ↔ 缺失狀態
   - 驗收失敗處理

### 步驟 3: Software Planning Tool

**開發計畫**:
```
Day 1 (8 hours):
├── WarrantyRepairService 實作
├── 派工與排程
└── 狀態管理

Day 2 (8 hours):
├── 完工與驗收
├── 缺失狀態同步
└── 進度摘要

Day 3 (4 hours):
├── 單元測試
└── 整合測試
```

---

## 📐 規劃階段

### 檔案清單

**新增檔案**:
- `src/app/core/blueprint/modules/implementations/warranty/services/warranty-repair.service.ts`
- `src/app/core/blueprint/modules/implementations/warranty/services/warranty-repair.service.spec.ts`
- `src/app/core/blueprint/modules/implementations/warranty/models/repair-state-machine.ts`

---

## ✅ 檢查清單

### 功能檢查
- [ ] 派工功能正常
- [ ] 進度追蹤準確
- [ ] 驗收流程完整

### 測試檢查
- [ ] 單元測試覆蓋
- [ ] 狀態轉換測試
