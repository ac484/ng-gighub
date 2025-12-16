# Core Domain Layer

> **純業務邏輯層** - 不依賴基礎設施的領域模型和類型定義

## 📋 目錄說明

### models/
領域模型定義，代表核心業務實體。

**範例**:
- `blueprint.model.ts` - Blueprint 領域模型
- `notification.model.ts` - 通知領域模型
- `blueprint-config.model.ts` - Blueprint 配置模型

**規則**:
- 純數據結構，無業務邏輯（或僅包含領域不變量驗證）
- 不依賴基礎設施層（如 Firestore, HTTP）
- 使用 TypeScript interfaces 或 classes

### types/
領域類型定義和枚舉，按業務領域組織。

**子目錄結構**:
```
types/
├── blueprint/          # Blueprint 相關類型
├── workflow/           # 工作流程類型
├── events/             # 事件類型
├── module/             # 模組類型
├── task/               # 任務類型
├── log/                # 日誌類型
├── permission/         # 權限類型
├── quality-control/    # 品質控制類型
├── storage/            # 儲存類型
└── configuration/      # 配置類型
```

**範例**:
```typescript
// types/blueprint/blueprint-status.enum.ts
export enum BlueprintStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived'
}

// types/blueprint/blueprint.types.ts
export interface BlueprintMetadata {
  id: string;
  name: string;
  status: BlueprintStatus;
  createdAt: Date;
}
```

### interfaces/ (預留)
領域介面定義（當前可能未使用，但預留供未來擴展）。

**用途**:
- 領域服務介面
- Repository 介面定義
- 領域事件介面

## 🎯 設計原則

### 1. 依賴方向
```
Domain Layer (獨立)
    ↑ 依賴
Infrastructure Layer
    ↑ 依賴
Application Layer
    ↑ 依賴
Presentation Layer
```

**Domain Layer 不依賴任何其他層！**

### 2. 純業務邏輯
- ✅ 領域模型和類型
- ✅ 業務規則和驗證
- ✅ 領域不變量
- ❌ 資料存取邏輯
- ❌ HTTP 請求
- ❌ UI 邏輯

### 3. 技術無關性
Domain Layer 應該：
- 不知道使用的是 Firestore 還是 PostgreSQL
- 不知道使用的是 Angular 還是 React
- 不知道使用的是 REST API 還是 GraphQL

### 4. 高內聚低耦合
- 相關的類型和模型放在同一個子目錄
- 使用 `index.ts` 統一匯出
- 避免循環依賴

## 📝 使用範例

### 定義領域模型

```typescript
// models/task.model.ts
import { TaskStatus } from '../types/task/task-status.enum';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeId: string | null;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskCreateDto {
  title: string;
  description: string;
  assigneeId?: string;
  dueDate?: Date;
}

export interface TaskUpdateDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  assigneeId?: string;
  dueDate?: Date;
}
```

### 定義領域類型

```typescript
// types/task/task-status.enum.ts
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// types/task/task.types.ts
export interface TaskFilters {
  status?: TaskStatus;
  assigneeId?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
}

export interface TaskStatistics {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}
```

### 在其他層使用

```typescript
// ✅ Infrastructure Layer 使用
import { Task } from '@core/domain/models';
import { TaskStatus } from '@core/domain/types/task';

@Injectable({ providedIn: 'root' })
export class TaskRepository {
  async findAll(): Promise<Task[]> {
    // 實作資料存取邏輯
  }
}

// ✅ Application Layer 使用
import { Task, TaskCreateDto } from '@core/domain/models';
import { TaskStatus } from '@core/domain/types/task';

@Injectable({ providedIn: 'root' })
export class TaskStore {
  private _tasks = signal<Task[]>([]);
  
  async createTask(dto: TaskCreateDto): Promise<void> {
    // 使用 repository 建立任務
  }
}

// ✅ Presentation Layer 使用
import { Task } from '@core/domain/models';
import { TaskStatus } from '@core/domain/types/task';

@Component({
  template: `
    @for (task of tasks(); track task.id) {
      <div>{{ task.title }}</div>
    }
  `
})
export class TaskListComponent {
  tasks = input.required<Task[]>();
}
```

## 🔍 相關文檔

- [Core Layer README](../README.md) - Core 層總覽
- [ADR-0002: 混合 Repository 策略](../../../docs/architecture/decisions/0002-hybrid-repository-strategy.md)
- [ARCHITECTURE_REVIEW.md](../../../docs/architecture/ARCHITECTURE_REVIEW.md)

## ⚠️ 注意事項

### 避免的反模式

```typescript
// ❌ 錯誤: Domain model 依賴 Angular
import { Injectable } from '@angular/core';

export class Task {
  constructor(private http: HttpClient) {}  // 不要！
}

// ❌ 錯誤: Domain model 依賴 Firestore
import { Firestore } from '@angular/fire/firestore';

export class Task {
  save(): void {
    // 直接呼叫 Firestore - 不要！
  }
}

// ✅ 正確: 純數據結構
export interface Task {
  id: string;
  title: string;
  // 只有數據，無依賴
}
```

### ESLint 規則建議

可以在 `eslint.config.mjs` 添加規則，防止 Domain Layer 意外依賴其他層：

```javascript
{
  files: ['src/app/core/domain/**/*.ts'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['**/infrastructure/**', '**/data-access/**', '**/@angular/fire/**'],
            message: 'Domain layer cannot import from infrastructure layer'
          }
        ]
      }
    ]
  }
}
```

---

**維護者**: Architecture Team  
**建立日期**: 2025-12-14  
**版本**: 1.0
