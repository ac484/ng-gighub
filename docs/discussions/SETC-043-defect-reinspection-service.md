# SETC-043: Defect Reinspection Service

> **任務 ID**: SETC-043  
> **任務名稱**: Defect Reinspection Service  
> **優先級**: P1 (Important)  
> **預估工時**: 2 天  
> **依賴**: SETC-042 (Defect Resolution Service)  
> **狀態**: ✅ 已完成

---

## 📋 任務定義

### 名稱
缺失複驗服務實作

### 背景 / 目的
實作缺失複驗流程服務，包括複驗排程、驗證執行、通過/不通過處理。根據 SETC.md：缺失整改 → 缺失複驗 → 結案/重新整改。

### 需求說明
1. 實作 DefectReinspectionService
2. 複驗排程
3. 驗證執行
4. 通過/不通過處理
5. 多次複驗追蹤

### In Scope / Out of Scope

#### ✅ In Scope
- DefectReinspectionService 實作
- 複驗排程
- 驗證執行
- 通過/不通過處理
- 歷史記錄

#### ❌ Out of Scope
- Issue 整合（SETC-044）

### 功能行為
管理缺失的複驗流程，確保整改品質。

### 資料 / API

#### DefectReinspectionService

```typescript
@Injectable({ providedIn: 'root' })
export class DefectReinspectionService {
  private defectRepository = inject(QCDefectRepository);
  private reinspectionRepository = inject(ReinspectionRepository);
  private eventBus = inject(BlueprintEventBusService);

  /**
   * 安排複驗
   */
  async scheduleReinspection(
    defectId: string,
    data: ScheduleReinspectionDto,
    actor: EventActor
  ): Promise<Reinspection> {
    const defect = await this.defectRepository.getById(defectId);
    if (!defect) {
      throw new Error(`Defect not found: ${defectId}`);
    }

    if (defect.status !== 'resolved') {
      throw new Error(`Defect must be resolved before reinspection: ${defect.status}`);
    }

    const reinspection: Omit<Reinspection, 'id'> = {
      defectId,
      blueprintId: defect.blueprintId,
      reinspectionNumber: this.generateReinspectionNumber(defect.defectNumber),
      scheduledDate: data.scheduledDate,
      inspectorId: data.inspectorId,
      status: 'scheduled',
      attempt: (defect.reinspectionCount ?? 0) + 1,
      createdBy: actor.userId,
      createdAt: new Date()
    };

    const created = await this.reinspectionRepository.create(reinspection);

    return created;
  }

  /**
   * 執行複驗
   */
  async performReinspection(
    reinspectionId: string,
    data: PerformReinspectionDto,
    actor: EventActor
  ): Promise<Reinspection> {
    const reinspection = await this.reinspectionRepository.getById(reinspectionId);
    if (!reinspection) {
      throw new Error(`Reinspection not found: ${reinspectionId}`);
    }

    const passed = data.result === 'pass';
    const status = passed ? 'passed' : 'failed';

    await this.reinspectionRepository.update(reinspectionId, {
      status,
      performedDate: new Date(),
      result: data.result,
      notes: data.notes,
      photos: data.photos,
      checklistResults: data.checklistResults
    });

    // 更新缺失狀態
    const newDefectStatus = passed ? 'verified' : 'in_progress';
    await this.defectRepository.update(
      reinspection.blueprintId,
      reinspection.defectId,
      {
        status: newDefectStatus,
        reinspectionCount: reinspection.attempt,
        lastReinspectionId: reinspectionId,
        lastReinspectionResult: data.result,
        updatedBy: actor.userId
      }
    );

    // 發送事件
    this.eventBus.emit({
      type: passed ? 'defect.verified' : 'defect.verification_failed',
      blueprintId: reinspection.blueprintId,
      timestamp: new Date(),
      actor,
      data: {
        defectId: reinspection.defectId,
        reinspectionId,
        result: data.result,
        attempt: reinspection.attempt
      }
    });

    return { ...reinspection, status };
  }

  /**
   * 結案
   */
  async closeDefect(
    defectId: string,
    actor: EventActor
  ): Promise<QCDefect> {
    const defect = await this.defectRepository.getById(defectId);
    if (!defect) {
      throw new Error(`Defect not found: ${defectId}`);
    }

    if (defect.status !== 'verified') {
      throw new Error(`Defect must be verified before closing: ${defect.status}`);
    }

    await this.defectRepository.update(defect.blueprintId, defectId, {
      status: 'closed',
      closedAt: new Date(),
      closedBy: actor.userId
    });

    this.eventBus.emit({
      type: 'defect.closed',
      blueprintId: defect.blueprintId,
      timestamp: new Date(),
      actor,
      data: { defectId }
    });

    return { ...defect, status: 'closed' };
  }

  /**
   * 取得複驗歷史
   */
  async getReinspectionHistory(defectId: string): Promise<Reinspection[]> {
    return this.reinspectionRepository.getByDefectId(defectId);
  }

  /**
   * 取得複驗統計
   */
  async getReinspectionStatistics(
    blueprintId: string
  ): Promise<ReinspectionStatistics> {
    const reinspections = await this.reinspectionRepository.getByBlueprintId(
      blueprintId
    );

    const passed = reinspections.filter(r => r.status === 'passed').length;
    const failed = reinspections.filter(r => r.status === 'failed').length;
    const pending = reinspections.filter(r => r.status === 'scheduled').length;

    return {
      total: reinspections.length,
      passed,
      failed,
      pending,
      passRate: reinspections.length > 0 
        ? (passed / (passed + failed)) * 100 
        : 0,
      averageAttempts: this.calculateAverageAttempts(reinspections)
    };
  }

  private generateReinspectionNumber(defectNumber: string): string {
    const attempt = Date.now().toString(36).toUpperCase();
    return `${defectNumber}-RI-${attempt}`;
  }
}
```

#### 相關介面

```typescript
export interface Reinspection {
  id: string;
  defectId: string;
  blueprintId: string;
  reinspectionNumber: string;
  scheduledDate: Date;
  performedDate?: Date;
  inspectorId: string;
  status: 'scheduled' | 'passed' | 'failed' | 'cancelled';
  attempt: number;
  result?: 'pass' | 'fail' | 'partial';
  notes?: string;
  photos?: FileAttachment[];
  checklistResults?: ChecklistResult[];
  createdBy: string;
  createdAt: Date;
}

export interface ScheduleReinspectionDto {
  scheduledDate: Date;
  inspectorId: string;
}

export interface PerformReinspectionDto {
  result: 'pass' | 'fail' | 'partial';
  notes?: string;
  photos?: FileAttachment[];
  checklistResults?: ChecklistResult[];
}

export interface ReinspectionStatistics {
  total: number;
  passed: number;
  failed: number;
  pending: number;
  passRate: number;
  averageAttempts: number;
}
```

### 影響範圍
- `src/app/core/blueprint/modules/implementations/qa/services/`

### 驗收條件
1. ✅ 複驗排程正常
2. ✅ 驗證執行完整
3. ✅ 通過/不通過處理正確
4. ✅ 歷史記錄準確
5. ✅ 單元測試覆蓋率 > 80%

---

## 🔍 分析階段

### 步驟 1: Context7 查詢
**目的**: 查詢品質複驗流程

### 步驟 2: Sequential Thinking 分析

**思考流程**:
1. **複驗流程**
   - 排程 → 執行 → 結果判定

2. **多次複驗**
   - 失敗後重新整改
   - 追蹤複驗次數

### 步驟 3: Software Planning Tool

**開發計畫**:
```
Day 1 (8 hours):
├── DefectReinspectionService 實作
├── 複驗排程
└── 驗證執行

Day 2 (8 hours):
├── 結果處理
├── 統計功能
└── 單元測試
```

---

## 📐 規劃階段

### 檔案清單

**新增檔案**:
- `src/app/core/blueprint/modules/implementations/qa/services/defect-reinspection.service.ts`
- `src/app/core/blueprint/modules/implementations/qa/services/defect-reinspection.service.spec.ts`
- `src/app/core/blueprint/modules/implementations/qa/repositories/reinspection.repository.ts`

---

## ✅ 檢查清單

### 功能檢查
- [ ] 複驗排程正常
- [ ] 驗證執行完整
- [ ] 結果處理正確

### 測試檢查
- [ ] 單元測試覆蓋
