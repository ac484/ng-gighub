# SETC-042: Defect Resolution Service

> **任務 ID**: SETC-042  
> **任務名稱**: Defect Resolution Service  
> **優先級**: P1 (Important)  
> **預估工時**: 2 天  
> **依賴**: SETC-041 (Defect Lifecycle Service)  
> **狀態**: ✅ 已完成

---

## 📋 任務定義

### 名稱
缺失解決服務實作

### 背景 / 目的
實作缺失整改流程服務，包括整改通知、進度追蹤、完成回報。根據 SETC.md：缺失整改 → 整改回報。

### 需求說明
1. 實作 DefectResolutionService
2. 整改通知機制
3. 進度追蹤
4. 完成回報
5. 整改照片/文件管理

### In Scope / Out of Scope

#### ✅ In Scope
- DefectResolutionService 實作
- 整改通知
- 進度追蹤
- 完成回報
- 附件管理

#### ❌ Out of Scope
- 複驗服務（SETC-043）

### 功能行為
管理缺失的整改過程，追蹤進度，記錄完成狀態。

### 資料 / API

#### DefectResolutionService

```typescript
@Injectable({ providedIn: 'root' })
export class DefectResolutionService {
  private defectRepository = inject(QCDefectRepository);
  private notificationService = inject(NotificationService);
  private eventBus = inject(BlueprintEventBusService);

  /**
   * 開始整改
   */
  async startResolution(
    defectId: string,
    data: StartResolutionDto,
    actor: EventActor
  ): Promise<QCDefect> {
    const defect = await this.defectRepository.getById(defectId);
    if (!defect) {
      throw new Error(`Defect not found: ${defectId}`);
    }

    DefectStateMachine.validateTransition(defect.status, 'in_progress');

    await this.defectRepository.update(defect.blueprintId, defectId, {
      status: 'in_progress',
      resolutionPlan: data.plan,
      resolutionStartedAt: new Date(),
      estimatedCompletionDate: data.estimatedCompletionDate,
      updatedBy: actor.userId
    });

    this.eventBus.emit({
      type: 'defect.resolution_started',
      blueprintId: defect.blueprintId,
      timestamp: new Date(),
      actor,
      data: { defectId }
    });

    return { ...defect, status: 'in_progress' };
  }

  /**
   * 更新進度
   */
  async updateProgress(
    defectId: string,
    data: UpdateProgressDto,
    actor: EventActor
  ): Promise<QCDefect> {
    const defect = await this.defectRepository.getById(defectId);
    if (!defect) {
      throw new Error(`Defect not found: ${defectId}`);
    }

    const progress = {
      id: this.generateProgressId(),
      description: data.description,
      percentage: data.percentage,
      photos: data.photos ?? [],
      createdBy: actor.userId,
      createdAt: new Date()
    };

    const existingProgress = defect.progressUpdates ?? [];
    
    await this.defectRepository.update(defect.blueprintId, defectId, {
      progressUpdates: [...existingProgress, progress],
      currentProgress: data.percentage,
      updatedBy: actor.userId
    });

    return { ...defect, currentProgress: data.percentage };
  }

  /**
   * 完成整改
   */
  async completeResolution(
    defectId: string,
    data: CompleteResolutionDto,
    actor: EventActor
  ): Promise<QCDefect> {
    const defect = await this.defectRepository.getById(defectId);
    if (!defect) {
      throw new Error(`Defect not found: ${defectId}`);
    }

    DefectStateMachine.validateTransition(defect.status, 'resolved');

    await this.defectRepository.update(defect.blueprintId, defectId, {
      status: 'resolved',
      resolutionCompletedAt: new Date(),
      resolutionDescription: data.description,
      resolutionPhotos: data.photos,
      resolutionDocuments: data.documents,
      currentProgress: 100,
      updatedBy: actor.userId
    });

    this.eventBus.emit({
      type: SystemEventType.QC_DEFECT_RESOLVED,
      blueprintId: defect.blueprintId,
      timestamp: new Date(),
      actor,
      data: { defectId }
    });

    // 通知需要複驗
    await this.notificationService.send({
      type: 'defect_ready_for_verification',
      recipients: [defect.inspectorId],
      data: {
        defectNumber: defect.defectNumber,
        description: defect.description
      }
    });

    return { ...defect, status: 'resolved' };
  }

  /**
   * 發送整改通知
   */
  async sendResolutionNotification(defectId: string): Promise<void> {
    const defect = await this.defectRepository.getById(defectId);
    if (!defect) return;

    await this.notificationService.send({
      type: 'defect_requires_resolution',
      recipients: [defect.responsibleUserId],
      data: {
        defectNumber: defect.defectNumber,
        description: defect.description,
        deadline: defect.deadline,
        severity: defect.severity
      }
    });
  }

  /**
   * 取得整改進度報表
   */
  async getResolutionReport(blueprintId: string): Promise<ResolutionReport> {
    const defects = await this.defectRepository.getByBlueprintId(blueprintId);
    const inProgress = defects.filter(d => d.status === 'in_progress');
    const resolved = defects.filter(d => d.status === 'resolved');

    const avgResolutionTime = this.calculateAverageResolutionTime(resolved);

    return {
      totalInProgress: inProgress.length,
      totalResolved: resolved.length,
      averageResolutionDays: avgResolutionTime,
      overdueCount: inProgress.filter(d => this.isOverdue(d)).length,
      resolutionsByWeek: this.groupByWeek(resolved)
    };
  }

  private calculateAverageResolutionTime(defects: QCDefect[]): number {
    if (defects.length === 0) return 0;
    
    const totalDays = defects.reduce((sum, d) => {
      if (!d.resolutionCompletedAt || !d.createdAt) return sum;
      const days = (d.resolutionCompletedAt.getTime() - d.createdAt.getTime()) 
        / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    
    return Math.round(totalDays / defects.length);
  }
}
```

#### 相關介面

```typescript
export interface StartResolutionDto {
  plan: string;
  estimatedCompletionDate: Date;
}

export interface UpdateProgressDto {
  description: string;
  percentage: number;
  photos?: FileAttachment[];
}

export interface CompleteResolutionDto {
  description: string;
  photos: FileAttachment[];
  documents?: FileAttachment[];
}

export interface ResolutionReport {
  totalInProgress: number;
  totalResolved: number;
  averageResolutionDays: number;
  overdueCount: number;
  resolutionsByWeek: Record<string, number>;
}
```

### 影響範圍
- `src/app/core/blueprint/modules/implementations/qa/services/`

### 驗收條件
1. ✅ 整改流程完整
2. ✅ 進度追蹤準確
3. ✅ 通知機制正常
4. ✅ 報表準確
5. ✅ 單元測試覆蓋率 > 80%

---

## 🔍 分析階段

### 步驟 1: Context7 查詢
**目的**: 查詢缺失整改最佳實踐

### 步驟 2: Sequential Thinking 分析

**思考流程**:
1. **整改流程**
   - 開始 → 進度更新 → 完成

2. **進度追蹤**
   - 百分比
   - 照片記錄

### 步驟 3: Software Planning Tool

**開發計畫**:
```
Day 1 (8 hours):
├── DefectResolutionService 實作
├── 整改流程
└── 進度追蹤

Day 2 (8 hours):
├── 通知機制
├── 報表
└── 單元測試
```

---

## 📐 規劃階段

### 檔案清單

**新增檔案**:
- `src/app/core/blueprint/modules/implementations/qa/services/defect-resolution.service.ts`
- `src/app/core/blueprint/modules/implementations/qa/services/defect-resolution.service.spec.ts`

---

## ✅ 檢查清單

### 功能檢查
- [ ] 整改流程完整
- [ ] 進度追蹤準確
- [ ] 通知正常

### 測試檢查
- [ ] 單元測試覆蓋
