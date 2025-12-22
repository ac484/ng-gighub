# QA Module (品質控管模組)

## 概述 (Overview)

品質控管模組提供工地品質管理功能，包括品質檢驗、標準管理等。本模組採用特徵導向架構 (Feature-based Architecture)，具有高內聚性 (High Cohesion)、低耦合性 (Low Coupling) 和良好的可擴展性 (Extensibility)。所有內容必須符合 `modules/README.md` 並保持本模組自有化（self-owned）。

## 設計原則 (Design Principles)

- **問題透過問題模組處理**：NCR (不符合報告) 功能已遷移至「問題」模組
- **簡化設計**：本模組提供基礎品質記錄功能
- **高內聚性**：所有 QA 功能集中在一個模組中
- **低耦合性**：透過清晰的介面與其他模組溝通
- **易擴展**：未來可輕鬆添加缺陷管理、報告生成等功能

## 架構 (Architecture)

### 目錄結構 (Directory Structure)

```
qa/
├── qa-module-view.component.ts     # 主協調器 (Main Orchestrator)
├── features/                        # 功能元件 (Feature Components)
│   ├── qa-stats/                   # 統計儀表板
│   │   ├── qa-stats.component.ts
│   │   └── index.ts
│   ├── qa-inspections/             # 檢驗列表
│   │   ├── qa-inspections.component.ts
│   │   └── index.ts
│   └── qa-standards/               # 標準列表
│       ├── qa-standards.component.ts
│       └── index.ts
└── index.ts                        # 桶式匯出 (Barrel Export)
```

### 元件職責 (Component Responsibilities)

#### 1. QaModuleViewComponent (主協調器)
- **職責**：協調所有 QA 功能元件
- **不包含**：業務邏輯實作
- **整合**：將各功能元件組合成完整的 QA 模組視圖

#### 2. QaStatsComponent (統計元件)
- 顯示品質統計資訊
- 檢驗次數、合格率、待處理問題數
- 支援資料重新整理

#### 3. QaInspectionsComponent (檢驗列表元件)
- 顯示品質檢驗記錄
- 支援新增、查看檢驗
- 整合 ST 表格元件

#### 4. QaStandardsComponent (標準列表元件)
- 顯示品質標準與規範
- 連結至雲端模組進行文件管理

## 使用方式 (Usage)

### 基本使用

```typescript
import { QaModuleViewComponent } from './modules/qa';

@Component({
  imports: [QaModuleViewComponent],
  template: `
    <app-qa-module-view [blueprintId]="blueprintId" />
  `
})
export class ParentComponent {
  blueprintId = 'blueprint-id';
}
```

### 進階使用 (使用個別功能元件)

```typescript
import { QaStatsComponent, QaInspectionsComponent } from './modules/qa';

@Component({
  imports: [QaStatsComponent, QaInspectionsComponent],
  template: `
    <app-qa-stats [blueprintId]="blueprintId" />
    <app-qa-inspections [blueprintId]="blueprintId" />
  `
})
export class CustomComponent {
  blueprintId = 'blueprint-id';
}
```

## 整合服務 (Service Integration)

本模組可以整合來自 `@core/blueprint/modules/implementations/qa` 的服務：

```typescript
import { 
  DefectService,
  InspectionService,
  ChecklistService 
} from '@core/blueprint/modules/implementations/qa';
```

### 可用服務 API (Available Service APIs)

- **DefectService**: 缺陷管理
- **InspectionService**: 檢驗管理
- **ChecklistService**: 檢查清單管理
- **DefectLifecycleService**: 缺陷生命週期
- **DefectResolutionService**: 缺陷解決
- **DefectReinspectionService**: 缺陷複檢
- **DefectIssueIntegrationService**: 缺陷-問題整合
- **ReportService**: 報告生成

## 未來擴展計劃 (Future Extension Points)

### 短期 (Short-term)
- [ ] 整合 QA 核心服務
- [ ] 實作缺陷管理功能
- [ ] 新增檢驗表單元件

### 中期 (Mid-term)
- [ ] 品質報告生成
- [ ] 檢查清單範本管理
- [ ] 批次操作功能

### 長期 (Long-term)
- [ ] 品質趨勢分析
- [ ] 預測性品質管理
- [ ] 與外部系統整合

## 技術規格 (Technical Specifications)

- **Angular Version**: 20.3.x
- **Change Detection**: OnPush
- **Component Type**: Standalone
- **State Management**: Signals
- **UI Framework**: ng-zorro-antd 20.x

## 參考 (References)

- [Members Module](../members/README.md) - 參考實作
- [Issues Module](../issues/README.md) - 問題模組整合
- [QA Core Module](../../../core/blueprint/modules/implementations/qa/README.md) - 核心服務

---

**版本 (Version)**: 1.0.0  
**最後更新 (Last Updated)**: 2025-12-19  
**維護者 (Maintainer)**: GigHub Development Team
