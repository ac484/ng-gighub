# 架構設計原則

> **來源**: 從根目錄 `原則.md` 提取並強化  
> **目的**: 定義 GigHub 系統的核心架構原則與技術實作標準

## 核心理念

GigHub 是企業級的工地施工進度追蹤管理系統，建立在以下核心原則：

- 🔹 **多租戶架構** (Multi-Tenancy)
- 🔹 **高度可擴充** (Scalability)
- 🔹 **權限與安全** (Security & Authorization)
- 🔹 **長期演進能力** (Long-term Evolution)

## 系統實體定義 (MANDATORY)

### 基礎實體

- **用戶 (User)** - 系統的個別使用者
- **組織 (Organization)** - 企業或團體實體
- **團隊 (Team)** - 組織內部的協作單位
- **夥伴 (Partner)** - 組織外部的協作實體
- **藍圖 (Blueprint)** - 專案的容器與權限邊界

### Blueprint 的本質 (MANDATORY)

**Blueprint 只做一件事: 定義誰能存取什麼資源**

- 它有一個 **Owner**，Owner 可以是不同型別（User 或 Organization）
- Blueprint 是**權限邊界**，不是資料邊界

### 子帳戶關係

✅ **Team 與 Partner 都是組織的子帳戶（Sub-Account）**  
❌ **但它們不是同一種子帳戶**

- **Team** = 組織內部子帳戶 (Internal Sub-Account)
- **Partner** = 組織外部關係子帳戶 (External / Federated Sub-Account)

### 成員結構

#### 當 Owner = User 時
→ Members: User / Collaborators (僅限使用者)

#### 當 Owner = Organization 時
→ Members: Organization Members / Teams / Partners

### 任務指派規則

Task assignment is scoped to blueprint membership.

- 任務只能指派給藍圖的有效成員（users, teams, partners）
- 允許的 assignee 類型由藍圖的 owner 決定

## 十大設計原則 (MANDATORY)

### 一、身份與角色必須嚴格解耦 (MUST) 🔴

#### 原則 1: 身份 ≠ 權限 ≠ 行為

**User / Organization / Team / Partner** → 只代表「**誰**」  
**Role / Permission** → 代表「**能做什麼**」  
**Action / Policy** → 代表「**在什麼條件下能做**」

#### Blueprint 不應 hardcode 任何角色語意

❌ **錯誤做法**:
- Team 就一定可以指派任務
- Partner 一定不能看財務

✅ **正確做法**:

Blueprint Owner 決定:
- 哪些 Member Type 可存在
- 哪些 Role 可被賦予
- 哪些 Role 可執行哪些 Action

> 🔑 **這是避免 Partner 特例地獄的關鍵**

---

### 二、Blueprint 是權限邊界不是資料邊界 (MUST) 🔴

#### 原則 2: Blueprint = Authorization Boundary

Blueprint 只做三件事:

1. **定義誰是成員**
2. **定義成員能做什麼**
3. **限制行為只能在成員集合內發生**

#### Blueprint 不應:

- ❌ 強制資料儲存方式
- ❌ 綁定某個 domain schema
- ❌ 知道任務/財務/文件的內部結構

#### 所有 domain 都必須做到:

```
Domain Data
→ 只知道 blueprint_id
→ 不知道 owner 是誰
```

---

### 三、Owner Type 必須是策略而不是分支判斷 (MUST) 🔴

#### 原則 3: Owner 是 Policy Source，不是 if-else

Blueprint has exactly ONE owner:
```
Owner ∈ {User, Organization}
```

#### ❌ 不要寫:

```typescript
if (owner.type === 'organization') {
  // 特定邏輯
}
```

#### ✅ 而是:

```typescript
ownerPolicy.canAssignTo(memberType)
ownerPolicy.canInvite(memberType)
ownerPolicy.allowedAssigneeTypes
```

---

### 四、Membership 是關係模型不是 Entity 屬性 (MUST) 🔴

#### 原則 4: Membership 永遠是獨立模型

```typescript
BlueprintMember {
  blueprint_id
  member_type (user | team | partner)
  member_id
  role
  status
}
```

#### 禁止:

```typescript
team.blueprints[]
partner.blueprints[]
```

> 🔥 **一個成員，在不同 Blueprint 裡，權限永遠不同**

---

### 五、Task Assignment ≠ Ownership ≠ Responsibility (MUST) 🔴

#### 原則 5: 任務指派不等於責任歸屬

即使允許指派給 Team 或 Partner，也必須保證:

- **最終執行人永遠是 User**
- **行為審計永遠回到 User**

#### 建議結構:

```typescript
Task {
  assigned_to (team / partner / user)
  executor (user, nullable)
  accountable (user or organization)
}
```

---

### 六、跨 Blueprint 行為必須是顯式授權 (MUST) 🔴

#### 原則 6: Blueprint 不自動信任 Blueprint

#### 禁止:

- ❌ 同一個 Organization 的 Blueprint 可以互相存取

#### 所有跨 Blueprint 行為都必須:

- ✅ 建立 Link / Grant / Contract
- ✅ 有 scope
- ✅ 可撤銷
- ✅ 可審計

---

### 七、審計是一級公民 (MUST) 🔴

#### 原則 7: 任何跨帳戶行為必須可追溯

只要牽涉到 Partner、Team 代表行為、組織資源，就必須記錄:

```typescript
AuditLog {
  who (user)
  acting_as (team / partner / org)
  in_blueprint
  did_what
  when
}
```

---

### 八、Blueprint 是容器不是流程 (MUST) 🔴

#### 原則 8: 流程屬於 Engine，不屬於 Blueprint

Blueprint 不應該:
- ❌ hardcode workflow
- ❌ 綁定某一種 task flow
- ❌ 內建狀態機邏輯

它只提供: Context, Membership, Policy Surface

---

### 九、刪除永遠是狀態不是消失 (MUST) 🔴

#### 原則 9: 永不硬刪 Owner / Member

特別是 Partner: 歷史任務、合約、責任歸屬 **都不能消失**

```typescript
status = suspended | revoked | archived
```

---

### 十、Blueprint 是最小治理單位 (MUST) 🔴

#### 原則 10: 所有治理行為必須可下沉到 Blueprint

包括: 成員管理、權限調整、Partner 存取、任務範圍

#### 禁止:

- ❌ 只能在 Organization 全域設定

---

## 技術實作考量 (MANDATORY)

### Angular 安全性最佳實踐

基於 Angular 官方文檔和 Google 安全工程團隊建議:

#### 1. 內建安全機制 (MUST) 🔴

- **HTML Sanitization** - Angular 自動清理不安全的 HTML
- **Trusted Types** - 支援瀏覽器的 Trusted Types API
- **XSRF Protection** - HttpClient 內建 XSRF 防護

#### 2. 安全 API 使用 (MUST NOT) 🔴

❌ **避免使用標記為 "Security Risk" 的 API**:
- `bypassSecurityTrustHtml()`
- `bypassSecurityTrustScript()`
- `bypassSecurityTrustStyle()`
- `bypassSecurityTrustUrl()`
- `bypassSecurityTrustResourceUrl()`

✅ **應該**:
- 使用 Angular 內建清理機制
- 只在確定安全時 bypass
- 每次 bypass 都需註解說明原因

#### 3. Content Security Policy (MUST) 🔴

```typescript
import { CSP_NONCE } from '@angular/core';

providers: [
  { provide: CSP_NONCE, useValue: generateUniqueNonce() }
]
```

#### 4. 定期更新與審計 (SHOULD) ⚠️

- 保持 Angular 版本最新
- 不要修改 Angular 核心代碼
- 定期安全審計

### Firebase/Firestore 安全性 (MANDATORY)

#### 1. Security Rules 最佳實踐 (MUST) 🔴

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 藍圖資料 - 只有成員可存取
    match /blueprints/{blueprintId} {
      allow read: if isAuthenticated() && isBlueprintMember(blueprintId);
      allow write: if isAuthenticated() && isBlueprintOwnerOrAdmin(blueprintId);
      
      // 藍圖內的任務
      match /tasks/{taskId} {
        allow read: if isAuthenticated() && isBlueprintMember(blueprintId);
        allow create: if isAuthenticated() && canCreateTask(blueprintId);
        allow update: if isAuthenticated() && canUpdateTask(blueprintId, taskId);
        allow delete: if isAuthenticated() && canDeleteTask(blueprintId, taskId);
      }
    }
    
    // 輔助函數
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isBlueprintMember(blueprintId) {
      return exists(/databases/$(database)/documents/blueprintMembers/$(request.auth.uid + '_' + blueprintId));
    }
  }
}
```

#### 2. 多租戶資料隔離策略 (MUST) 🔴

**方法 1: Document-level isolation**
```
/blueprints/{blueprintId}
  - ownerId: string
  - members: array<string>
  
Security Rule: request.auth.uid in resource.data.members
```

**方法 2: Collection-level isolation with subcollections**
```
/organizations/{orgId}
  /blueprints/{blueprintId}
    /tasks/{taskId}
    
Security Rule: 在父文件檢查成員資格
```

**方法 3: Dedicated membership collection** (推薦)
```
/blueprintMembers/{userId_blueprintId}
  - blueprintId: string
  - userId: string
  - role: string
  - permissions: array<string>
  
Security Rule: exists(/databases/$(database)/documents/blueprintMembers/$(request.auth.uid + '_' + blueprintId))
```

#### 3. IAM vs Security Rules 使用時機

| 使用場景 | 推薦方案 | 原因 |
|---------|---------|------|
| Mobile/Web Client | Security Rules | 細粒度權限控制 |
| Server/Cloud Functions | IAM | 服務帳戶 |
| 管理後台 | Security Rules | 管理員也應遵循規則 |
| 批次處理 | IAM | 需要全域存取 |
| Realtime Updates | Security Rules | 即時資料同步 |

### Angular 現代狀態管理 (MANDATORY)

#### 1. Signals 響應式狀態管理 (MUST) 🔴

```typescript
import { Component, signal, computed, effect, inject } from '@angular/core';

@Component({
  selector: 'app-task-list',
  standalone: true,
  template: `
    @if (loading()) {
      <nz-spin nzSimple />
    } @else if (hasError()) {
      <nz-alert nzType="error" [nzMessage]="error()!" />
    } @else {
      @for (task of tasks(); track task.id) {
        <app-task-item [task]="task" />
      }
    }
  `
})
export class TaskListComponent {
  // Writable signals
  tasks = signal<Task[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  
  // Computed signals - 自動追蹤依賴
  totalTasks = computed(() => this.tasks().length);
  hasError = computed(() => this.error() !== null);
  
  constructor() {
    // Effect - 當相依 signal 改變時自動執行
    effect(() => {
      console.log('Tasks updated:', this.tasks().length);
    });
  }
}
```

#### 2. 依賴注入最佳實踐 (MUST) 🔴

```typescript
// ✅ 使用 inject() 函數
import { inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);
  private logger = inject(LoggerService);
}

// ❌ 禁止 constructor 注入
constructor(private taskService: TaskService) {}
```

### 企業級架構考量 (SHOULD)

#### 1. 可測試性與可維護性 ⚠️

```typescript
describe('TaskService', () => {
  let service: TaskService;
  let mockRepository: jasmine.SpyObj<TaskRepository>;
  
  beforeEach(() => {
    mockRepository = jasmine.createSpyObj('TaskRepository', ['findAll']);
    
    TestBed.configureTestingModule({
      providers: [
        TaskService,
        { provide: TaskRepository, useValue: mockRepository }
      ]
    });
    
    service = TestBed.inject(TaskService);
  });
});
```

#### 2. 模組化與可擴充性 (MUST) 🔴

**三層架構範例**:

```typescript
// 1. Foundation Layer - 核心服務
@Injectable({ providedIn: 'root' })
export class AuthService { }

// 2. Container Layer - 業務容器
@Injectable({ providedIn: 'root' })
export class BlueprintFacade {
  private blueprintRepo = inject(BlueprintRepository);
  private authService = inject(AuthService);
}

// 3. Business Layer - 業務模組
@Component({ standalone: true })
export class BlueprintsComponent {
  private blueprintFacade = inject(BlueprintFacade);
}
```

#### 3. 效能優化策略 (SHOULD) ⚠️

```typescript
// OnPush Change Detection
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskItemComponent { }

// TrackBy 函數
trackByTaskId(index: number, task: Task): string {
  return task.id;
}

// 延遲載入路由
export const routes: Routes = [
  {
    path: 'blueprints',
    loadComponent: () => import('./routes/blueprints/blueprints.component')
  }
];
```

## 開發流程建議 (SHOULD)

### 1. 需求分析階段
- 明確定義 Blueprint Owner 型別
- 規劃 Member 類型與角色
- 設計權限矩陣

### 2. 架構設計階段
- 使用三層架構劃分職責
- 設計 Firestore Security Rules
- 規劃 Angular 組件結構

### 3. 開發階段
- 遵循 Angular 20 最佳實踐
- 使用 Signals 管理狀態
- 實作 Security Rules 並測試

### 4. 測試階段
- Firebase Emulator 本地測試
- Security Rules 單元測試
- Angular 組件測試

### 5. 部署與監控
- Firebase Hosting 部署
- Cloud Functions 後端邏輯
- Firebase Analytics 追蹤

---

**版本**: v1.0  
**最後更新**: 2025-12-17  
**來源**: 原則.md  
**強制執行**: MANDATORY for core principles, SHOULD for best practices
