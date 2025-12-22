# Warranty Module (Refactored)

保固管理模組 - 採用功能導向架構設計。所有內容必須遵循 `modules/README.md` 並維持本模組自有化（self-owned）。

## 🎯 架構原則

本模組遵循以下核心原則:
- **高內聚 (High Cohesion)**: 相關功能組織在同一 feature 中
- **低耦合 (Low Coupling)**: Features 間透過明確接口溝通
- **可擴展性 (Extensibility)**: 易於新增 features 或擴展現有功能
- **可維護性 (Maintainability)**: 清晰結構，小型專注元件

## 📁 目錄結構 (Feature-Based)

```
warranty/
├── warranty-module-view.component.ts         # 主協調器 (thin orchestrator)
├── index.ts                                  # Public API
├── README.md                                 # 本文件
├── routes.ts                                 # 模組路由
│
├── features/                                 # 功能模組
│   ├── list/                                 # 🔍 列表功能
│   │   ├── warranty-list.component.ts        # Feature 主元件
│   │   ├── components/
│   │   │   ├── warranty-statistics.component.ts  # 統計卡片
│   │   │   ├── warranty-filters.component.ts     # 篩選與操作
│   │   │   └── warranty-table.component.ts       # 表格顯示
│   │   └── index.ts
│   │
│   ├── defects/                              # 🐛 缺失功能
│   │   ├── warranty-defects.component.ts     # Feature 主元件
│   │   ├── components/
│   │   │   ├── defect-statistics.component.ts    # 統計卡片
│   │   │   ├── defect-filters.component.ts       # 篩選與操作
│   │   │   └── defect-table.component.ts         # 表格顯示
│   │   └── index.ts
│   │
│   └── detail/                               # 👁️ 詳情功能
│       ├── warranty-detail-drawer.component.ts   # Feature 主元件
│       ├── components/
│       │   ├── basic-info-tab.component.ts       # 基本資訊 Tab
│       │   ├── defects-tab.component.ts          # 缺失 Tab
│       │   └── repairs-tab.component.ts          # 維修 Tab
│       └── index.ts
│
└── shared/                                   # 🔄 共享元件
    ├── components/
    │   └── warranty-status-badge.component.ts    # 狀態標籤
    └── index.ts
```

## 🎨 架構設計

### 主協調器 (Main Orchestrator)

**`WarrantyModuleViewComponent`** - Thin orchestration layer

責任:
- 管理高層狀態 (warranties, loading, drawer mode)
- 協調 features 互動
- 處理 feature 事件

特點:
- **Thin Layer**: 最小化邏輯，委託給 features
- **Event-Driven**: 透過 inputs/outputs 與 features 溝通
- **Stateful**: 只管理必要的全域狀態

### Features 架構

每個 feature 是自包含的功能模組:

#### 1. List Feature 🔍

**職責**: 顯示保固列表與統計資訊

**元件**:
- `WarrantyListComponent` - Feature 協調器
- `WarrantyStatisticsComponent` - 統計卡片 (active, expiring, expired, completed)
- `WarrantyFiltersComponent` - 狀態篩選與搜尋
- `WarrantyTableComponent` - ST Table 顯示

**接口**:
```typescript
@Input() blueprintId: string
@Output() viewDetail: Warranty
@Output() viewDefects: Warranty
```

#### 2. Defects Feature 🐛

**職責**: 顯示保固缺失列表與統計

**元件**:
- `WarrantyDefectsComponent` - Feature 協調器
- `DefectStatisticsComponent` - 統計卡片 (total, by severity, by status)
- `DefectFiltersComponent` - 狀態與嚴重程度篩選
- `DefectTableComponent` - ST Table 顯示

**接口**:
```typescript
@Input() blueprintId: string
@Input() warrantyId: string
@Input() warrantyNumber: string
@Output() reportDefect: void
@Output() createRepair: WarrantyDefect
@Output() viewDetail: WarrantyDefect
@Output() goBack: void
```

#### 3. Detail Feature 👁️

**職責**: 顯示保固詳情與相關記錄

**元件**:
- `WarrantyDetailDrawerComponent` - 抽屜協調器
- `BasicInfoTabComponent` - 基本資訊 Tab
- `DefectsTabComponent` - 缺失列表 Tab
- `RepairsTabComponent` - 維修記錄 Tab

**接口**:
```typescript
@Input() visible: boolean
@Input() warranty: Warranty | null
@Input() defects: WarrantyDefect[]
@Input() repairs: any[]
@Output() close: void
@Output() edit: Warranty
@Output() viewDefect: WarrantyDefect
```

### 共享元件 🔄

**可重用元件**, 無外部依賴:

- `WarrantyStatusBadgeComponent` - 狀態標籤顯示

## 📋 使用方式

### 匯入與使用

```typescript
// 主視圖 (使用重構版本)
import { WarrantyModuleViewComponent } from './warranty';

// 或獨立使用 features
import { WarrantyListComponent } from './warranty/features/list';
import { WarrantyDefectsComponent } from './warranty/features/defects';
import { WarrantyDetailDrawerComponent } from './warranty/features/detail';

// 共享元件
import { WarrantyStatusBadgeComponent } from './warranty/shared';
```

### Blueprint 整合

保固模組整合在 Blueprint 詳情頁的 Tab 中:

```
/blueprints/:id  →  Blueprint Detail  →  「保固」Tab
                                      ↓
                      WarrantyModuleViewComponent
```

### Feature 互動流程

```
User Action → Main Orchestrator → Feature Component → Event → Orchestrator → Update State
```

**範例 - 查看保固詳情**:
1. User 點擊「查看」
2. `WarrantyListComponent` 發出 `viewDetail` 事件
3. Orchestrator 接收事件
4. Orchestrator 開啟 `WarrantyDetailDrawerComponent`
5. User 互動完成，關閉 Drawer
6. Orchestrator 更新狀態

## 🧩 擴展性範例

### 新增 Feature

**範例: 新增 "報表" Feature**

1. 建立 feature 目錄:
```
features/reports/
├── warranty-reports.component.ts
├── components/
│   ├── report-filters.component.ts
│   └── report-chart.component.ts
└── index.ts
```

2. 定義接口:
```typescript
@Input() blueprintId: string
@Output() generateReport: ReportConfig
```

3. 在 Orchestrator 整合:
```typescript
openReports(): void {
  // Open reports feature
}
```

### 新增子元件

**範例: 在 List Feature 新增匯出功能**

1. 建立元件:
```
features/list/components/warranty-export.component.ts
```

2. 在 WarrantyListComponent 整合:
```typescript
<app-warranty-export [warranties]="warranties()" (export)="onExport($event)" />
```

## 🎯 設計原則

### 單一職責原則 (Single Responsibility)
- 每個元件只負責一件事
- 協調器元件只協調，不包含 UI 邏輯
- 子元件只處理自己的 UI 邏輯

### 開放/封閉原則 (Open/Closed)
- Features 對擴展開放
- Features 對修改封閉
- 新增功能不需修改現有 features

### 依賴反轉原則 (Dependency Inversion)
- 依賴抽象 (interfaces), 不依賴具體實作
- Features 透過 inputs/outputs 溝通
- No direct feature-to-feature dependencies

## 💡 最佳實踐

### 元件大小
- **Orchestrator**: < 200 lines
- **Feature Main Component**: < 150 lines
- **Sub Components**: < 100 lines

### 命名規範
- Feature folders: lowercase with dash (e.g., `list`, `defects`)
- Components: feature-action.component.ts (e.g., `warranty-list.component.ts`)
- Sub-components: descriptive name (e.g., `warranty-statistics.component.ts`)

### 狀態管理
- **Global State**: Orchestrator (selected warranty, drawer visibility)
- **Feature State**: Feature main component (loading, data, filters)
- **Local State**: Sub-components (expanded, selected)

### 事件處理
- Use outputs for feature → orchestrator communication
- Use inputs for orchestrator → feature data flow
- Keep events semantic (e.g., `viewDetail`, not `buttonClicked`)

## 📚 資料模型

保固相關的資料模型定義在 `@core/blueprint/modules/implementations/warranty`:

```typescript
interface Warranty {
  id: string;
  blueprintId: string;
  warrantyNumber: string;
  warrantyType: 'standard' | 'extended' | 'special';
  status: WarrantyStatus;
  startDate: Date;
  endDate: Date;
  periodInMonths: number;
  warrantor: WarrantorInfo;
  defectCount: number;
  repairCount: number;
}

type WarrantyStatus = 'pending' | 'active' | 'expiring' | 'expired' | 'completed' | 'voided';

interface WarrantyDefect {
  id: string;
  warrantyId: string;
  defectNumber: string;
  severity: 'critical' | 'major' | 'minor';
  status: WarrantyDefectStatus;
  category: string;
  location: string;
  description: string;
  discoveredDate: Date;
}
```

## 🚀 未來擴展方向

- 保固報表功能
- 保固證明生成
- 保固提醒通知
- 保固文件管理
- 保固審批流程
- 保固模板管理

## 技術棧

- Angular 20.x
- ng-alain 20.x
- ng-zorro-antd 20.x
- Signals for state management
- Standalone Components
- TypeScript 5.x

## 維護者

GigHub Development Team
