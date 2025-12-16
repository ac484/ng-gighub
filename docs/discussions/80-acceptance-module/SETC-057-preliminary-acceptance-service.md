# SETC-057: Preliminary Acceptance Service

> **任務編號**: SETC-057  
> **模組**: Acceptance Module (驗收模組)  
> **優先級**: P1 (Important)  
> **預估工時**: 2 天  
> **依賴**: SETC-056  
> **狀態**: 📋 待開始

---

## 📋 任務概述

### 目標
實作初驗服務，管理初驗執行、檢查項目記錄、缺失記錄和初驗報告生成。

### 範圍
- 初驗排程與執行
- 檢查項目記錄
- 缺失發現與記錄
- 初驗結果判定
- 初驗報告生成

---

## 🏗️ 技術實作

### 服務介面

```typescript
import { Observable } from 'rxjs';

export interface IPreliminaryAcceptanceService {
  // 初驗管理
  createPreliminary(requestId: string, data: CreatePreliminaryInput): Promise<PreliminaryAcceptance>;
  updatePreliminary(id: string, data: UpdatePreliminaryInput): Promise<PreliminaryAcceptance>;
  
  // 執行初驗
  conductAcceptance(id: string, data: ConductAcceptanceInput): Promise<PreliminaryAcceptance>;
  recordCheckResult(id: string, result: CheckResultInput): Promise<void>;
  recordDefect(id: string, defect: DefectInput): Promise<PreliminaryDefect>;
  
  // 結果
  submitResult(id: string, result: AcceptanceResult): Promise<PreliminaryAcceptance>;
  requireReinspection(id: string, defectIds: string[], scheduledDate: Date): Promise<PreliminaryAcceptance>;
  
  // 報告
  generateReport(id: string): Promise<string>; // Report URL
  
  // 查詢
  getPreliminary(id: string): Promise<PreliminaryAcceptance | null>;
  getPreliminaryByRequest(requestId: string): Observable<PreliminaryAcceptance | null>;
  
  // 簽核
  addSignature(id: string, signature: SignatureInput): Promise<void>;
}

export interface CreatePreliminaryInput {
  acceptanceDate: Date;
  acceptanceLocation: string;
  attendees: AttendeeInput[];
  inspectionItems?: InspectionItem[];
}

export interface ConductAcceptanceInput {
  attendees: AttendeeInput[];
  checkResults: CheckResultInput[];
  tests?: AcceptanceTest[];
  measurements?: Measurement[];
  photos: PhotoInput[];
  findings?: string[];
}

export interface CheckResultInput {
  itemId: string;
  result: 'passed' | 'failed' | 'conditional' | 'na';
  measuredValue?: any;
  notes?: string;
  photos?: string[];
  checkedBy: string;
}

export interface DefectInput {
  description: string;
  location: string;
  severity: 'critical' | 'major' | 'minor';
  photos: string[];
  requiresFixing: boolean;
  estimatedFixDuration?: number;
}

export type AcceptanceResult = 'passed' | 'passed_with_conditions' | 'failed';
```

### 服務實作

```typescript
import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { PreliminaryAcceptanceRepository } from '../repositories/preliminary.repository';
import { IEventBus } from '@core/blueprint/platform/event-bus';
import { 
  IPreliminaryAcceptanceService,
  PreliminaryAcceptance,
  CreatePreliminaryInput,
  ConductAcceptanceInput,
  AcceptanceResult
} from './preliminary.interface';

@Injectable({ providedIn: 'root' })
export class PreliminaryAcceptanceService implements IPreliminaryAcceptanceService {
  private repository = inject(PreliminaryAcceptanceRepository);
  private eventBus = inject(IEventBus);

  /**
   * 建立初驗記錄
   */
  async createPreliminary(
    requestId: string, 
    data: CreatePreliminaryInput
  ): Promise<PreliminaryAcceptance> {
    const acceptanceNumber = await this.generateAcceptanceNumber();
    
    const preliminary = await this.repository.create({
      requestId,
      acceptanceNumber,
      ...data,
      overallResult: 'pending',
      defectsFound: 0,
      defectsList: [],
      photos: [],
      reInspectionRequired: false
    });
    
    this.eventBus.emit('acceptance.preliminary_created', {
      preliminaryId: preliminary.id,
      requestId,
      scheduledDate: data.acceptanceDate,
      timestamp: new Date()
    });
    
    return preliminary;
  }

  /**
   * 執行初驗
   */
  async conductAcceptance(
    id: string, 
    data: ConductAcceptanceInput
  ): Promise<PreliminaryAcceptance> {
    const preliminary = await this.repository.findById(id);
    if (!preliminary) {
      throw new Error(`Preliminary acceptance ${id} not found`);
    }
    
    // 計算通過率
    const passedCount = data.checkResults.filter(r => r.result === 'passed').length;
    const totalCount = data.checkResults.filter(r => r.result !== 'na').length;
    const passRate = totalCount > 0 ? (passedCount / totalCount) * 100 : 0;
    
    // 統計缺失
    const failedItems = data.checkResults.filter(r => r.result === 'failed');
    
    const updated = await this.repository.update(id, {
      attendees: data.attendees.map(a => ({
        ...a,
        attended: true
      })),
      checkResults: data.checkResults.map(r => ({
        ...r,
        checkedAt: new Date()
      })),
      tests: data.tests || [],
      measurements: data.measurements || [],
      photos: data.photos,
      findings: data.findings || [],
      passRate: Math.round(passRate),
      defectsFound: failedItems.length
    });
    
    this.eventBus.emit('acceptance.preliminary_conducted', {
      preliminaryId: id,
      passRate,
      defectsFound: failedItems.length,
      timestamp: new Date()
    });
    
    return updated;
  }

  /**
   * 記錄缺失
   */
  async recordDefect(id: string, defect: DefectInput): Promise<PreliminaryDefect> {
    const preliminary = await this.repository.findById(id);
    if (!preliminary) {
      throw new Error(`Preliminary acceptance ${id} not found`);
    }
    
    const defectNumber = await this.generateDefectNumber(id);
    
    const newDefect: PreliminaryDefect = {
      id: `defect-${Date.now()}`,
      defectNumber,
      ...defect,
      status: 'reported',
      createdAt: new Date()
    };
    
    const defectsList = [...(preliminary.defectsList || []), newDefect];
    
    await this.repository.update(id, {
      defectsList,
      defectsFound: defectsList.length
    });
    
    // 發送缺失事件
    this.eventBus.emit('acceptance.defect_found', {
      preliminaryId: id,
      defectId: newDefect.id,
      severity: defect.severity,
      timestamp: new Date()
    });
    
    return newDefect;
  }

  /**
   * 提交初驗結果
   */
  async submitResult(
    id: string, 
    result: AcceptanceResult
  ): Promise<PreliminaryAcceptance> {
    const preliminary = await this.repository.findById(id);
    if (!preliminary) {
      throw new Error(`Preliminary acceptance ${id} not found`);
    }
    
    const updated = await this.repository.update(id, {
      overallResult: result,
      reInspectionRequired: result === 'failed' || result === 'passed_with_conditions'
    });
    
    // 根據結果發送不同事件
    if (result === 'passed') {
      this.eventBus.emit('acceptance.preliminary_passed', {
        preliminaryId: id,
        requestId: preliminary.requestId,
        timestamp: new Date()
      });
    } else {
      this.eventBus.emit('acceptance.preliminary_requires_reinspection', {
        preliminaryId: id,
        requestId: preliminary.requestId,
        defectsCount: preliminary.defectsFound,
        timestamp: new Date()
      });
    }
    
    return updated;
  }

  /**
   * 生成初驗報告
   */
  async generateReport(id: string): Promise<string> {
    const preliminary = await this.repository.findById(id);
    if (!preliminary) {
      throw new Error(`Preliminary acceptance ${id} not found`);
    }
    
    // TODO: 使用報表服務生成 PDF
    const reportUrl = `/reports/preliminary/${id}/report.pdf`;
    
    await this.repository.update(id, {
      reportGenerated: true,
      reportUrl,
      reportGeneratedAt: new Date()
    });
    
    return reportUrl;
  }

  // ============ Private Methods ============

  private async generateAcceptanceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000);
    return `PA-${year}-${String(random).padStart(4, '0')}`;
  }

  private async generateDefectNumber(preliminaryId: string): Promise<string> {
    const preliminary = await this.repository.findById(preliminaryId);
    const count = (preliminary?.defectsList?.length || 0) + 1;
    return `DEF-${preliminary?.acceptanceNumber}-${String(count).padStart(3, '0')}`;
  }
}
```

---

## ✅ 交付物

- [ ] `preliminary.service.ts`
- [ ] `preliminary.interface.ts`
- [ ] `preliminary.service.spec.ts`
- [ ] 更新 `index.ts` 匯出

---

## 🎯 驗收標準

1. ✅ 初驗記錄建立正確
2. ✅ 檢查結果記錄完整
3. ✅ 缺失記錄功能運作
4. ✅ 結果判定邏輯正確
5. ✅ 報告生成功能正常
6. ✅ 單元測試覆蓋率 >80%

---

**文件版本**: 1.0.0  
**建立日期**: 2025-12-15  
**最後更新**: 2025-12-15
