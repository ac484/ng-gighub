# SETC-058: Reinspection Service

> **任務編號**: SETC-058  
> **模組**: Acceptance Module (驗收模組)  
> **優先級**: P1 (Important)  
> **預估工時**: 2 天  
> **依賴**: SETC-057  
> **狀態**: 📋 待開始

---

## 📋 任務概述

### 目標
實作複驗服務，管理缺失改善確認、複驗執行和複驗結果判定。

### 範圍
- 複驗排程管理
- 缺失改善驗證
- 複驗執行與記錄
- 複驗結果判定
- 多輪複驗追蹤

---

## 🏗️ 技術實作

### 服務介面

```typescript
import { Observable } from 'rxjs';

export interface IReinspectionService {
  // 複驗管理
  scheduleReinspection(
    preliminaryId: string, 
    scheduledDate: Date,
    defectIds: string[]
  ): Promise<Reinspection>;
  
  conductReinspection(
    id: string, 
    data: ConductReinspectionInput
  ): Promise<Reinspection>;
  
  // 缺失驗證
  verifyDefectResolution(
    reinspectionId: string, 
    verification: DefectVerificationInput
  ): Promise<DefectResolution>;
  
  verifyCondition(
    reinspectionId: string,
    verification: ConditionVerificationInput
  ): Promise<ConditionVerification>;
  
  // 結果
  submitResult(
    id: string, 
    result: ReinspectionResult
  ): Promise<Reinspection>;
  
  // 查詢
  getReinspection(id: string): Promise<Reinspection | null>;
  getReinspectionsByPreliminary(preliminaryId: string): Observable<Reinspection[]>;
  getPendingReinspections(blueprintId: string): Observable<Reinspection[]>;
  
  // 報告
  generateReport(id: string): Promise<string>;
}

export interface ConductReinspectionInput {
  attendees: AttendeeInput[];
  defectResolutions: DefectResolutionInput[];
  newDefects?: DefectInput[];
  photos: PhotoInput[];
  comparisonPhotos?: ComparisonPhotoInput[];
  findings?: string[];
}

export interface DefectVerificationInput {
  defectId: string;
  verificationResult: 'acceptable' | 'unacceptable' | 'requires_improvement';
  verificationNotes?: string;
  beforePhotos: string[];
  afterPhotos: string[];
}

export interface ConditionVerificationInput {
  conditionId: string;
  completionStatus: 'completed' | 'partially_completed' | 'not_completed';
  completionEvidence: string[];
  verificationNotes?: string;
}

export type ReinspectionResult = 'passed' | 'failed' | 'requires_another_reinspection';
```

### 服務實作

```typescript
import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ReinspectionRepository } from '../repositories/reinspection.repository';
import { PreliminaryAcceptanceRepository } from '../repositories/preliminary.repository';
import { IEventBus } from '@core/blueprint/platform/event-bus';
import { 
  IReinspectionService,
  Reinspection,
  ConductReinspectionInput,
  ReinspectionResult
} from './reinspection.interface';

@Injectable({ providedIn: 'root' })
export class ReinspectionService implements IReinspectionService {
  private repository = inject(ReinspectionRepository);
  private preliminaryRepo = inject(PreliminaryAcceptanceRepository);
  private eventBus = inject(IEventBus);

  /**
   * 排程複驗
   */
  async scheduleReinspection(
    preliminaryId: string,
    scheduledDate: Date,
    defectIds: string[]
  ): Promise<Reinspection> {
    const preliminary = await this.preliminaryRepo.findById(preliminaryId);
    if (!preliminary) {
      throw new Error(`Preliminary acceptance ${preliminaryId} not found`);
    }
    
    // 計算這是第幾次複驗
    const existingReinspections = await this.repository.findByPreliminary(preliminaryId);
    const round = existingReinspections.length + 1;
    
    const reinspectionNumber = `RI-${preliminary.acceptanceNumber}-${round}`;
    
    const reinspection = await this.repository.create({
      preliminaryAcceptanceId: preliminaryId,
      blueprintId: preliminary.blueprintId,
      reInspectionNumber: reinspectionNumber,
      reInspectionRound: round,
      reInspectionDate: scheduledDate,
      defectResolutions: defectIds.map(id => {
        const defect = preliminary.defectsList?.find(d => d.id === id);
        return {
          defectId: id,
          defectNumber: defect?.defectNumber || '',
          originalDescription: defect?.description || '',
          verificationResult: 'pending' as any,
          beforePhotos: defect?.photos || [],
          afterPhotos: []
        };
      }),
      overallResult: 'pending' as any,
      resolvedDefects: 0,
      unresolvedDefects: defectIds.length,
      newDefectsFound: 0
    });
    
    this.eventBus.emit('acceptance.reinspection_scheduled', {
      reinspectionId: reinspection.id,
      preliminaryId,
      round,
      scheduledDate,
      defectsToVerify: defectIds.length,
      timestamp: new Date()
    });
    
    return reinspection;
  }

  /**
   * 執行複驗
   */
  async conductReinspection(
    id: string,
    data: ConductReinspectionInput
  ): Promise<Reinspection> {
    const reinspection = await this.repository.findById(id);
    if (!reinspection) {
      throw new Error(`Reinspection ${id} not found`);
    }
    
    // 統計驗證結果
    const resolved = data.defectResolutions.filter(
      r => r.verificationResult === 'acceptable'
    ).length;
    const unresolved = data.defectResolutions.filter(
      r => r.verificationResult !== 'acceptable'
    ).length;
    
    const updated = await this.repository.update(id, {
      attendees: data.attendees,
      defectResolutions: data.defectResolutions.map(r => ({
        ...r,
        verifiedAt: new Date()
      })),
      newDefects: data.newDefects || [],
      photos: data.photos,
      comparisonPhotos: data.comparisonPhotos || [],
      findings: data.findings || [],
      resolvedDefects: resolved,
      unresolvedDefects: unresolved,
      newDefectsFound: data.newDefects?.length || 0
    });
    
    this.eventBus.emit('acceptance.reinspection_conducted', {
      reinspectionId: id,
      resolved,
      unresolved,
      newDefects: data.newDefects?.length || 0,
      timestamp: new Date()
    });
    
    return updated;
  }

  /**
   * 驗證缺失改善
   */
  async verifyDefectResolution(
    reinspectionId: string,
    verification: DefectVerificationInput
  ): Promise<DefectResolution> {
    const reinspection = await this.repository.findById(reinspectionId);
    if (!reinspection) {
      throw new Error(`Reinspection ${reinspectionId} not found`);
    }
    
    const resolutions = reinspection.defectResolutions || [];
    const index = resolutions.findIndex(r => r.defectId === verification.defectId);
    
    if (index === -1) {
      throw new Error(`Defect ${verification.defectId} not found in reinspection`);
    }
    
    const updatedResolution: DefectResolution = {
      ...resolutions[index],
      verificationResult: verification.verificationResult,
      verificationNotes: verification.verificationNotes,
      afterPhotos: verification.afterPhotos,
      verifiedAt: new Date()
    };
    
    resolutions[index] = updatedResolution;
    
    await this.repository.update(reinspectionId, {
      defectResolutions: resolutions
    });
    
    return updatedResolution;
  }

  /**
   * 提交複驗結果
   */
  async submitResult(
    id: string,
    result: ReinspectionResult
  ): Promise<Reinspection> {
    const reinspection = await this.repository.findById(id);
    if (!reinspection) {
      throw new Error(`Reinspection ${id} not found`);
    }
    
    const updated = await this.repository.update(id, {
      overallResult: result,
      finalAcceptanceRecommended: result === 'passed'
    });
    
    // 根據結果發送事件
    if (result === 'passed') {
      this.eventBus.emit('acceptance.reinspection_passed', {
        reinspectionId: id,
        preliminaryId: reinspection.preliminaryAcceptanceId,
        round: reinspection.reInspectionRound,
        timestamp: new Date()
      });
    } else if (result === 'requires_another_reinspection') {
      this.eventBus.emit('acceptance.reinspection_requires_another', {
        reinspectionId: id,
        preliminaryId: reinspection.preliminaryAcceptanceId,
        round: reinspection.reInspectionRound,
        unresolvedDefects: reinspection.unresolvedDefects,
        timestamp: new Date()
      });
    }
    
    return updated;
  }

  /**
   * 生成複驗報告
   */
  async generateReport(id: string): Promise<string> {
    const reinspection = await this.repository.findById(id);
    if (!reinspection) {
      throw new Error(`Reinspection ${id} not found`);
    }
    
    // TODO: 使用報表服務生成 PDF
    const reportUrl = `/reports/reinspection/${id}/report.pdf`;
    
    await this.repository.update(id, {
      reportUrl,
      reportGeneratedAt: new Date()
    });
    
    return reportUrl;
  }
}
```

---

## ✅ 交付物

- [ ] `reinspection.service.ts`
- [ ] `reinspection.interface.ts`
- [ ] `reinspection.service.spec.ts`
- [ ] 更新 `index.ts` 匯出

---

## 🎯 驗收標準

1. ✅ 複驗排程功能正確
2. ✅ 缺失驗證機制完整
3. ✅ 多輪複驗追蹤正確
4. ✅ 結果判定邏輯正確
5. ✅ 事件正確發送
6. ✅ 單元測試覆蓋率 >80%

---

**文件版本**: 1.0.0  
**建立日期**: 2025-12-15  
**最後更新**: 2025-12-15
