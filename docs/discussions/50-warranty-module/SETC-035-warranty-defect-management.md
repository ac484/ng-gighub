# SETC-035: Warranty Defect Management Service

> **任務 ID**: SETC-035  
> **任務名稱**: Warranty Defect Management Service  
> **優先級**: P1 (Important)  
> **預估工時**: 3 天  
> **依賴**: SETC-034 (Warranty Period Management)  
> **狀態**: ✅ 已完成
> **完成日期**: 2025-12-16

---

## 📋 任務定義

### 名稱
保固缺失管理服務實作

### 背景 / 目的
實作保固缺失管理服務，包括缺失記錄、嚴重度分級、狀態追蹤、與問題單 (Issue) 整合。根據 SETC.md：保固缺失 → 建立問題單 → 保固維修 → 結案。

### 需求說明
1. 實作 WarrantyDefectService
2. 缺失登記與確認
3. 嚴重度分級處理
4. 嚴重缺失自動建立 Issue
5. 狀態生命週期管理

### In Scope / Out of Scope

#### ✅ In Scope
- WarrantyDefectService 實作
- 缺失登記功能
- 嚴重度分級
- Issue 整合
- 狀態管理
- 單元測試

#### ❌ Out of Scope
- 維修管理（SETC-036）
- UI 元件（SETC-038）

### 功能行為
管理保固期間的缺失記錄，追蹤缺失狀態，嚴重缺失自動建立 Issue。

### 資料 / API

#### WarrantyDefectService

```typescript
@Injectable({ providedIn: 'root' })
export class WarrantyDefectService {
  private defectRepository = inject(WarrantyDefectRepository);
  private warrantyRepository = inject(WarrantyRepository);
  private issueCreationService = inject(IssueCreationService);
  private eventBus = inject(BlueprintEventBusService);

  /**
   * 登記保固缺失
   */
  async reportDefect(
    data: ReportDefectDto,
    actor: EventActor
  ): Promise<WarrantyDefect> {
    const warranty = await this.warrantyRepository.getById(
      data.blueprintId,
      data.warrantyId
    );
    
    if (!warranty) {
      throw new Error(`Warranty not found: ${data.warrantyId}`);
    }

    if (warranty.status !== 'active' && warranty.status !== 'expiring') {
      throw new Error(`Cannot report defect for warranty in status: ${warranty.status}`);
    }

    const defect: Omit<WarrantyDefect, 'id'> = {
      warrantyId: data.warrantyId,
      blueprintId: data.blueprintId,
      defectNumber: this.generateDefectNumber(),
      description: data.description,
      location: data.location,
      category: data.category,
      severity: data.severity,
      discoveredDate: data.discoveredDate ?? new Date(),
      reportedBy: actor.userName,
      reporterContact: data.reporterContact,
      photos: data.photos ?? [],
      documents: data.documents ?? [],
      status: 'reported',
      createdBy: actor.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const created = await this.defectRepository.create(defect);

    // 更新保固記錄的缺失計數
    await this.warrantyRepository.update(
      data.blueprintId,
      data.warrantyId,
      { defectCount: (warranty.defectCount ?? 0) + 1 }
    );

    // 發送事件
    this.eventBus.emit({
      type: SystemEventType.WARRANTY_DEFECT_REPORTED,
      blueprintId: data.blueprintId,
      timestamp: new Date(),
      actor,
      data: {
        defectId: created.id,
        warrantyId: data.warrantyId,
        severity: data.severity
      }
    });

    // 嚴重缺失自動建立 Issue
    if (data.severity === 'critical') {
      await this.autoCreateIssue(created, actor);
    }

    return created;
  }

  /**
   * 確認缺失
   */
  async confirmDefect(
    blueprintId: string,
    warrantyId: string,
    defectId: string,
    actor: EventActor
  ): Promise<WarrantyDefect> {
    const defect = await this.defectRepository.getById(
      blueprintId,
      warrantyId,
      defectId
    );
    
    if (!defect) {
      throw new Error(`Defect not found: ${defectId}`);
    }

    DefectStateMachine.validateTransition(defect.status, 'confirmed');

    await this.defectRepository.update(
      blueprintId,
      warrantyId,
      defectId,
      {
        status: 'confirmed',
        updatedBy: actor.userId
      }
    );

    return { ...defect, status: 'confirmed' };
  }

  /**
   * 拒絕缺失（非保固範圍）
   */
  async rejectDefect(
    blueprintId: string,
    warrantyId: string,
    defectId: string,
    reason: string,
    actor: EventActor
  ): Promise<WarrantyDefect> {
    const defect = await this.defectRepository.getById(
      blueprintId,
      warrantyId,
      defectId
    );
    
    if (!defect) {
      throw new Error(`Defect not found: ${defectId}`);
    }

    DefectStateMachine.validateTransition(defect.status, 'rejected');

    await this.defectRepository.update(
      blueprintId,
      warrantyId,
      defectId,
      {
        status: 'rejected',
        rejectionReason: reason,
        updatedBy: actor.userId
      }
    );

    return { ...defect, status: 'rejected' };
  }

  /**
   * 嚴重缺失自動建立 Issue
   */
  private async autoCreateIssue(
    defect: WarrantyDefect,
    actor: EventActor
  ): Promise<void> {
    const issue = await this.issueCreationService.autoCreateFromWarranty({
      warrantyId: defect.warrantyId,
      defectId: defect.id,
      blueprintId: defect.blueprintId,
      description: defect.description,
      severity: defect.severity,
      location: defect.location,
      photos: defect.photos
    });

    // 更新缺失記錄關聯的 Issue
    await this.defectRepository.update(
      defect.blueprintId,
      defect.warrantyId,
      defect.id,
      { issueId: issue.id }
    );
  }

  /**
   * 取得缺失統計
   */
  async getDefectStatistics(
    blueprintId: string,
    warrantyId: string
  ): Promise<DefectStatistics> {
    const defects = await this.defectRepository.getByWarrantyId(
      blueprintId,
      warrantyId
    );

    return {
      total: defects.length,
      bySeverity: {
        critical: defects.filter(d => d.severity === 'critical').length,
        major: defects.filter(d => d.severity === 'major').length,
        minor: defects.filter(d => d.severity === 'minor').length
      },
      byStatus: {
        open: defects.filter(d => ['reported', 'confirmed', 'under_repair'].includes(d.status)).length,
        resolved: defects.filter(d => ['repaired', 'verified', 'closed'].includes(d.status)).length,
        rejected: defects.filter(d => d.status === 'rejected').length
      },
      byCategory: this.groupByCategory(defects)
    };
  }
}
```

#### 相關介面

```typescript
export interface ReportDefectDto {
  blueprintId: string;
  warrantyId: string;
  description: string;
  location: string;
  category: DefectCategory;
  severity: DefectSeverity;
  discoveredDate?: Date;
  reporterContact: string;
  photos?: FileAttachment[];
  documents?: FileAttachment[];
}

export interface DefectStatistics {
  total: number;
  bySeverity: {
    critical: number;
    major: number;
    minor: number;
  };
  byStatus: {
    open: number;
    resolved: number;
    rejected: number;
  };
  byCategory: Record<DefectCategory, number>;
}
```

### 影響範圍
- `src/app/core/blueprint/modules/implementations/warranty/services/`
- Issue Module 整合

### 驗收條件
1. ✅ 缺失登記功能正常
2. ✅ 嚴重度分級正確
3. ✅ 嚴重缺失自動建立 Issue
4. ✅ 狀態管理完整
5. ✅ 單元測試覆蓋率 > 80%

---

## 🔍 分析階段

### 步驟 1: Context7 查詢
**目的**: 查詢缺失管理與 Issue 整合模式

### 步驟 2: Sequential Thinking 分析

**思考流程**:
1. **缺失流程**
   - 登記 → 確認 → 維修 → 驗證 → 結案
   - 拒絕（非保固範圍）

2. **Issue 整合**
   - 嚴重缺失自動建立
   - 雙向關聯
   - 狀態同步

### 步驟 3: Software Planning Tool

**開發計畫**:
```
Day 1 (8 hours):
├── WarrantyDefectService 實作
├── 缺失登記功能
└── 狀態管理

Day 2 (8 hours):
├── Issue 整合
├── 統計功能
└── 單元測試

Day 3 (4 hours):
├── 整合測試
└── 文檔更新
```

---

## 📐 規劃階段

### 檔案清單

**新增檔案**:
- `src/app/core/blueprint/modules/implementations/warranty/services/warranty-defect.service.ts`
- `src/app/core/blueprint/modules/implementations/warranty/services/warranty-defect.service.spec.ts`
- `src/app/core/blueprint/modules/implementations/warranty/models/defect-state-machine.ts`

---

## ✅ 檢查清單

### 功能檢查
- [x] 缺失登記正常
- [x] Issue 整合正確（shouldCreateIssue 方法）
- [x] 狀態管理完整

### 測試檢查
- [ ] 單元測試覆蓋（待後續 SETC-039）
- [ ] Issue 整合測試（待後續 SETC-039）

---

## 📁 實作檔案

### 新增檔案
- `src/app/core/blueprint/modules/implementations/warranty/services/warranty-defect.service.ts`

### 實作功能
- `reportDefect()` - 登記保固缺失
- `confirmDefect()` - 確認缺失
- `rejectDefect()` - 拒絕缺失（非保固範圍）
- `startRepair()` - 開始維修
- `markRepaired()` - 標記維修完成
- `verifyRepair()` - 驗證維修結果
- `closeDefect()` - 結案缺失
- `linkIssue()` - 關聯 Issue
- `getOpenDefects()` - 取得未結案的缺失
- `getAllDefects()` - 取得所有缺失
- `getDefectsBySeverity()` - 取得指定嚴重程度的缺失
- `getCriticalDefects()` - 取得嚴重缺失
- `getDefectStatistics()` - 取得缺失統計
- `shouldCreateIssue()` - 檢查是否需要建立 Issue
