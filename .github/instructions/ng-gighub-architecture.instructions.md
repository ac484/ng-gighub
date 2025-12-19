---
description: 'GigHub 三層架構與 Blueprint 系統設計原則'
applyTo: '**/*.ts, **/*.html, **/*.scss'
---

# GigHub 系統架構設計

> **專案專用**: GigHub 工地施工進度追蹤管理系統

## 🎯 核心理念 (MUST) 🔴

GigHub 是企業級的工地施工進度追蹤管理系統，建立在以下核心原則：

- 🔹 **多租戶架構** (Multi-Tenancy) - 資料隔離與權限控制
- 🔹 **高度可擴充** (Scalability) - 模組化設計，易於擴展
- 🔹 **權限與安全** (Security & Authorization) - Security Rules 優先
- 🔹 **長期演進能力** (Long-term Evolution) - 架構彈性，技術可升級

## 📐 三層架構 (MANDATORY) 🔴

### 架構概覽

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│                     (UI Components)                      │
│  src/app/routes/*/                                      │
│  - 展示邏輯 (Display Logic)                             │
│  - 使用者互動 (User Interaction)                        │
│  - Signals for state (signal(), computed())             │
└─────────────────────────────────────────────────────────┘
                           ↓ inject()
┌─────────────────────────────────────────────────────────┐
│                     Business Layer                       │
│                (Services / Facades / Stores)             │
│  src/app/core/services/, src/app/core/facades/         │
│  - 業務邏輯協調 (Business Logic Coordination)           │
│  - 事件發布訂閱 (Event Bus)                            │
│  - 狀態管理 (State Management)                          │
└─────────────────────────────────────────────────────────┘
                           ↓ inject()
┌─────────────────────────────────────────────────────────┐
│                      Data Layer                          │
│                    (Repositories)                        │
│  src/app/core/data-access/*/                           │
│  - 資料存取抽象 (Data Access Abstraction)               │
│  - Firestore 操作封裝                                   │
│  - CRUD 操作 (Create, Read, Update, Delete)            │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    Firebase/Firestore                    │
│                  (Database + Security Rules)             │
└─────────────────────────────────────────────────────────┘
```

### 層級職責 (MUST) 🔴

#### 1. Presentation Layer (UI)

**職責**:
- 展示資料給使用者
- 處理使用者輸入與互動
- 使用 Signals 管理本地 UI 狀態

**禁止**:
- ❌ 直接呼叫 Repository
- ❌ 直接操作 Firestore
- ❌ 包含複雜業務邏輯

**範例**:

```typescript
import { Component, signal, computed, inject } from '@angular/core';
import { TaskService } from '@core/services/task.service';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    @if (loading()) {
      <nz-spin nzSimple />
    } @else {
      @for (task of tasks(); track task.id) {
        <app-task-item [task]="task" (taskChange)="updateTask($event)" />
      }
    }
  `
})
export class TaskListComponent {
  // ✅ 注入 Service，不是 Repository
  private taskService = inject(TaskService);
  
  // ✅ 使用 Signals 管理 UI 狀態
  loading = signal(false);
  tasks = signal<Task[]>([]);
  
  // ✅ 計算衍生狀態
  totalTasks = computed(() => this.tasks().length);
  
  ngOnInit(): void {
    this.loadTasks();
  }
  
  async loadTasks(): Promise<void> {
    this.loading.set(true);
    try {
      // ✅ 透過 Service 獲取資料
      const tasks = await this.taskService.getTasks();
      this.tasks.set(tasks);
    } finally {
      this.loading.set(false);
    }
  }
  
  async updateTask(task: Task): Promise<void> {
    // ✅ 透過 Service 更新資料
    await this.taskService.updateTask(task.id, task);
  }
}
```

#### 2. Business Layer (Service/Store)

**職責**:
- 協調多個 Repository
- 實作業務邏輯規則
- 發布和訂閱領域事件
- 管理跨元件共享狀態

**禁止**:
- ❌ 直接操作 Firestore
- ❌ 包含 UI 邏輯

**範例**:

```typescript
import { Injectable, signal, inject } from '@angular/core';
import { TaskRepository } from '@core/data-access/task.repository';
import { BlueprintEventBus } from '@core/services/blueprint-event-bus.service';

@Injectable({ providedIn: 'root' })
export class TaskService {
  // ✅ 注入 Repository
  private taskRepository = inject(TaskRepository);
  private eventBus = inject(BlueprintEventBus);
  
  // ✅ 共享狀態
  private _tasks = signal<Task[]>([]);
  tasks = this._tasks.asReadonly();
  
  async getTasks(): Promise<Task[]> {
    try {
      // ✅ 透過 Repository 獲取資料
      const tasks = await this.taskRepository.findAll();
      this._tasks.set(tasks);
      return tasks;
    } catch (error) {
      console.error('Failed to get tasks:', error);
      throw error;
    }
  }
  
  async createTask(blueprintId: string, task: Omit<Task, 'id'>): Promise<Task> {
    try {
      // ✅ 業務邏輯驗證
      this.validateTask(task);
      
      // ✅ 透過 Repository 創建資料
      const created = await this.taskRepository.create(task);
      
      // ✅ 發布領域事件
      this.eventBus.publish({
        type: 'task.created',
        blueprintId,
        timestamp: new Date(),
        actor: 'current-user-id',
        data: created
      });
      
      return created;
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  }
  
  private validateTask(task: Omit<Task, 'id'>): void {
    if (!task.title || task.title.trim().length === 0) {
      throw new Error('Task title is required');
    }
  }
}
```

#### 3. Data Layer (Repository)

**職責**:
- 直接使用 @angular/fire 服務（Firestore, Auth, Storage）
- 實作領域特定查詢與資料轉換
- 處理資料存取錯誤

**禁止**:
- ❌ 包含業務邏輯
- ❌ 封裝 Firebase API（app.config.ts 已統一初始化）
- ❌ 直接被 UI 呼叫

**範例**:

```typescript
import { Injectable, inject } from '@angular/core';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class TaskRepository {
  private firestore = inject(Firestore); // ✅ 直接注入
  
  async findByBlueprint(blueprintId: string): Promise<Task[]> {
    const q = query(
      collection(this.firestore, 'tasks'),
      where('blueprint_id', '==', blueprintId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
  }
}
```

## 🏗️ Blueprint 系統設計 (MUST) 🔴

### Blueprint 的本質

**Blueprint 只做一件事: 定義誰能存取什麼資源**

- Blueprint 是**權限邊界**，不是資料邊界
- 它有一個 **Owner** (User 或 Organization)
- 它定義**誰是成員**以及**成員能做什麼**

### 系統實體定義

```typescript
// 基礎實體
interface User {
  id: string;
  email: string;
  displayName: string;
}

interface Organization {
  id: string;
  name: string;
  ownerId: string;
}

interface Team {
  id: string;
  name: string;
  organizationId: string;
  // Team 是組織內部子帳戶
}

interface Partner {
  id: string;
  name: string;
  organizationId: string;
  // Partner 是組織外部關係子帳戶
}

interface Blueprint {
  id: string;
  name: string;
  ownerType: 'user' | 'organization';
  ownerId: string;
  // Blueprint 是權限邊界
}

interface BlueprintMember {
  blueprintId: string;
  memberType: 'user' | 'team' | 'partner';
  memberId: string;
  role: string;
  permissions: string[];
  status: 'active' | 'suspended' | 'revoked';
}
```

### 成員結構規則

#### 當 Owner = User 時
→ Members: **僅限 User / Collaborators**

#### 當 Owner = Organization 時
→ Members: **Organization Members / Teams / Partners**

### 任務指派規則

```typescript
interface Task {
  id: string;
  blueprintId: string;
  title: string;
  description: string;
  
  // 任務指派
  assignedTo: string;  // userId, teamId, or partnerId
  assignedToType: 'user' | 'team' | 'partner';
  
  // 責任歸屬
  executor?: string;      // 最終執行人 (User ID)
  accountable: string;    // 責任人 (User or Organization ID)
  
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}
```

**規則** (MUST) 🔴:
- 任務只能指派給藍圖的有效成員
- 允許的 assignee 類型由藍圖的 owner 決定
- 最終執行人永遠是 User
- 行為審計永遠回到 User

## 📁 檔案組織結構

```
src/app/
├── core/                           # 核心層
│   ├── data-access/               # Repository Layer
│   │   ├── task.repository.ts
│   │   ├── blueprint.repository.ts
│   │   └── user.repository.ts
│   ├── services/                  # Business Layer
│   │   ├── task.service.ts
│   │   ├── blueprint.service.ts
│   │   └── permission.service.ts
│   ├── facades/                   # 複雜協調層 (optional)
│   │   └── blueprint.facade.ts
│   └── state/                     # 全域狀態 (optional)
│       └── app.store.ts
├── routes/                        # Presentation Layer
│   ├── blueprints/
│   │   ├── blueprints.component.ts
│   │   └── blueprint-detail.component.ts
│   └── tasks/
│       ├── task-list.component.ts
│       └── task-detail.component.ts
└── shared/                        # 共享資源
    ├── components/
    └── utils/
```

## ✅ 架構驗證檢查清單

### 三層分離驗證 (MUST) 🔴

- [ ] UI 元件僅注入 Service，不注入 Repository
- [ ] Service 可注入多個 Repository 進行協調
- [ ] Repository 僅負責資料存取，不包含業務邏輯
- [ ] 無跨層直接依賴 (UI → Repository)

### Blueprint 設計驗證 (MUST) 🔴

- [ ] Blueprint 只定義權限邊界，不強制資料結構
- [ ] BlueprintMember 是獨立模型，不是 Entity 屬性
- [ ] 任務指派遵循成員資格規則
- [ ] 跨 Blueprint 行為有顯式授權

### 檔案組織驗證 (MUST) 🔴

- [ ] Repository 檔案位於 `core/data-access/`
- [ ] Service 檔案位於 `core/services/`
- [ ] UI 元件位於 `routes/` 下對應功能目錄
- [ ] 檔案命名遵循 kebab-case

## 🚫 常見錯誤模式

### ❌ 錯誤: UI 直接呼叫 Repository

```typescript
// ❌ 錯誤
@Component({ ... })
export class TaskListComponent {
  private taskRepository = inject(TaskRepository);  // 不應直接注入 Repository
  
  async loadTasks(): Promise<void> {
    this.tasks = await this.taskRepository.findAll();
  }
}
```

### ✅ 正確: UI 透過 Service

```typescript
// ✅ 正確
@Component({ ... })
export class TaskListComponent {
  private taskService = inject(TaskService);  // 注入 Service
  
  async loadTasks(): Promise<void> {
    this.tasks.set(await this.taskService.getTasks());
  }
}
```

### ❌ 錯誤: Repository 包含業務邏輯

```typescript
// ❌ 錯誤
export class TaskRepository {
  async create(task: Task): Promise<Task> {
    // ❌ 業務邏輯不應在 Repository
    if (task.dueDate < new Date()) {
      throw new Error('Due date cannot be in the past');
    }
    return await addDoc(this.tasksCollection, task);
  }
}
```

### ✅ 正確: 業務邏輯在 Service

```typescript
// ✅ 正確
export class TaskService {
  async createTask(task: Task): Promise<Task> {
    // ✅ 業務邏輯在 Service
    if (task.dueDate < new Date()) {
      throw new Error('Due date cannot be in the past');
    }
    return await this.taskRepository.create(task);
  }
}
```

## 📚 參考資料

- Angular Architecture Patterns: https://angular.dev/guide/architecture
- Clean Architecture: https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
- Repository Pattern: https://martinfowler.com/eaaCatalog/repository.html

---

**版本**: v1.0  
**最後更新**: 2025-12-18  
**維護者**: GigHub 開發團隊
