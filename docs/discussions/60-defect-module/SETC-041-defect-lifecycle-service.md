# SETC-041: Defect Lifecycle Service

> **任務 ID**: SETC-041  
> **任務名稱**: Defect Lifecycle Service  
> **優先級**: P1 (Important)  
> **預估工時**: 2 天  
> **依賴**: SETC-040 (Defect Service Expansion Planning)  
> **狀態**: ✅ 已完成

---

## 📋 任務定義

### 名稱
缺失生命週期管理服務

### 背景 / 目的
實作 QC 缺失的完整生命週期管理，包括狀態控制、自動建立、責任分配。根據 SETC.md：QC 不通過 → 自動建立缺失單。

### 需求說明
1. 實作 DefectLifecycleService
2. QC 失敗自動建立缺失
3. 狀態機管理
4. 責任人分配
5. 期限管理

### In Scope / Out of Scope

#### ✅ In Scope
- DefectLifecycleService 實作
- 自動建立機制
- 狀態管理
- 責任分配
- 期限追蹤

#### ❌ Out of Scope
- 解決服務（SETC-042）
- 複驗服務（SETC-043）

### 功能行為
管理缺失的完整生命週期，從建立到結案。

### 資料 / API

#### DefectLifecycleService

```typescript
@Injectable({ providedIn: 'root' })
export class DefectLifecycleService {
  private defectRepository = inject(QCDefectRepository);
  private eventBus = inject(BlueprintEventBusService);

  /**
   * 從 QC 失敗自動建立缺失
   */
  async autoCreateFromQCInspection(
    inspection: QCInspection,
    failedItems: QCInspectionItem[],
    actor: EventActor
  ): Promise<QCDefect[]> {
    const defects: QCDefect[] = [];

    for (const item of failedItems) {
      const defect: Omit<QCDefect, 'id'> = {
        blueprintId: inspection.blueprintId,
        inspectionId: inspection.id,
        taskId: inspection.taskId,
        workItemId: item.workItemId,
        defectNumber: this.generateDefectNumber(),
        description: item.failureReason,
        location: item.location,
        category: this.mapCategory(item),
        severity: this.determineSeverity(item),
        status: 'open',
        deadline: this.calculateDeadline(item.severity),
        createdBy: actor.userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const created = await this.defectRepository.create(defect);
      defects.push(created);

      this.eventBus.emit({
        type: SystemEventType.QC_DEFECT_CREATED,
        blueprintId: inspection.blueprintId,
        timestamp: new Date(),
        actor,
        data: {
          defectId: created.id,
          inspectionId: inspection.id,
          severity: created.severity
        }
      });
    }

    return defects;
  }

  /**
   * 指派責任人
   */
  async assignResponsible(
    defectId: string,
    responsibleUserId: string,
    actor: EventActor
  ): Promise<QCDefect> {
    const defect = await this.defectRepository.getById(defectId);
    if (!defect) {
      throw new Error(`Defect not found: ${defectId}`);
    }

    await this.defectRepository.update(defect.blueprintId, defectId, {
      responsibleUserId,
      assignedAt: new Date(),
      status: 'assigned',
      updatedBy: actor.userId
    });

    return { ...defect, responsibleUserId, status: 'assigned' };
  }

  /**
   * 設定/更新期限
   */
  async setDeadline(
    defectId: string,
    deadline: Date,
    actor: EventActor
  ): Promise<QCDefect> {
    const defect = await this.defectRepository.getById(defectId);
    if (!defect) {
      throw new Error(`Defect not found: ${defectId}`);
    }

    await this.defectRepository.update(defect.blueprintId, defectId, {
      deadline,
      updatedBy: actor.userId
    });

    return { ...defect, deadline };
  }

  /**
   * 檢查逾期缺失
   */
  async getOverdueDefects(blueprintId: string): Promise<QCDefect[]> {
    const now = new Date();
    const openDefects = await this.defectRepository.getByStatus(
      blueprintId,
      ['open', 'assigned', 'in_progress']
    );

    return openDefects.filter(d => d.deadline && d.deadline < now);
  }

  /**
   * 取得缺失統計
   */
  async getDefectStatistics(blueprintId: string): Promise<DefectStatistics> {
    const defects = await this.defectRepository.getByBlueprintId(blueprintId);

    return {
      total: defects.length,
      byStatus: {
        open: defects.filter(d => d.status === 'open').length,
        assigned: defects.filter(d => d.status === 'assigned').length,
        inProgress: defects.filter(d => d.status === 'in_progress').length,
        resolved: defects.filter(d => d.status === 'resolved').length,
        verified: defects.filter(d => d.status === 'verified').length,
        closed: defects.filter(d => d.status === 'closed').length
      },
      bySeverity: {
        critical: defects.filter(d => d.severity === 'critical').length,
        major: defects.filter(d => d.severity === 'major').length,
        minor: defects.filter(d => d.severity === 'minor').length
      },
      overdue: defects.filter(d => this.isOverdue(d)).length
    };
  }

  private generateDefectNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `DEF-${timestamp}-${random}`;
  }

  private determineSeverity(item: QCInspectionItem): DefectSeverity {
    // 基於檢查項目決定嚴重度
    if (item.isStructural || item.isSafety) return 'critical';
    if (item.isWaterproofing || item.isElectrical) return 'major';
    return 'minor';
  }

  private calculateDeadline(severity: DefectSeverity): Date {
    const deadline = new Date();
    const daysMap: Record<DefectSeverity, number> = {
      critical: 3,
      major: 7,
      minor: 14
    };
    deadline.setDate(deadline.getDate() + daysMap[severity]);
    return deadline;
  }

  private isOverdue(defect: QCDefect): boolean {
    if (!defect.deadline) return false;
    if (['verified', 'closed'].includes(defect.status)) return false;
    return new Date() > defect.deadline;
  }
}
```

### 影響範圍
- `src/app/core/blueprint/modules/implementations/qa/services/`

### 驗收條件
1. ✅ QC 失敗自動建立缺失
2. ✅ 狀態管理正確
3. ✅ 責任分配正常
4. ✅ 期限追蹤準確
5. ✅ 單元測試覆蓋率 > 80%

---

## 🔍 分析階段

### 步驟 1: Context7 查詢
**目的**: 查詢品質管理生命週期模式

### 步驟 2: Sequential Thinking 分析

**思考流程**:
1. **狀態定義**
   - open → assigned → in_progress → resolved → verified → closed

2. **自動化流程**
   - QC 失敗觸發
   - 批次建立

### 步驟 3: Software Planning Tool

**開發計畫**:
```
Day 1 (8 hours):
├── DefectLifecycleService 實作
├── 自動建立邏輯
└── 狀態管理

Day 2 (8 hours):
├── 責任分配
├── 期限管理
└── 單元測試
```

---

## 📐 規劃階段

### 檔案清單

**新增檔案**:
- `src/app/core/blueprint/modules/implementations/qa/services/defect-lifecycle.service.ts`
- `src/app/core/blueprint/modules/implementations/qa/services/defect-lifecycle.service.spec.ts`

---

## ✅ 檢查清單

### 功能檢查
- [ ] 自動建立正常
- [ ] 狀態管理正確
- [ ] 期限追蹤準確

### 測試檢查
- [ ] 單元測試覆蓋
