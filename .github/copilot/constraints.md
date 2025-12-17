# 系統約束與反模式規則

> 本專案絕對禁止的行為與反模式清單

📖 **編碼標準請參考**: [docs/reference/coding-standards.md](../../docs/reference/coding-standards.md)

---

## 🚫 絕對禁止的程式碼模式

### 1. Angular 反模式

```typescript
// ❌ 禁止：使用裝飾器定義輸入輸出
@Input() task!: Task;
@Output() taskChange = new EventEmitter<Task>();

// ✅ 正確：使用函數式 API
task = input.required<Task>();
taskChange = output<Task>();
```

```typescript
// ❌ 禁止：constructor 注入
constructor(private taskService: TaskService) {}

// ✅ 正確：使用 inject() 函數
private readonly taskService = inject(TaskService);
```

```typescript
// ❌ 禁止：使用 NgModule
@NgModule({
  declarations: [TaskComponent],
  imports: [CommonModule]
})
export class TaskModule {}

// ✅ 正確：使用 Standalone Component
@Component({
  standalone: true,
  imports: [CommonModule]
})
export class TaskComponent {}
```

```typescript
// ❌ 禁止：使用 any 類型
function processData(data: any): any { ... }

// ✅ 正確：明確類型定義
function processData(data: TaskDto): Task { ... }
```

### 2. 狀態管理反模式

```typescript
// ❌ 禁止：直接修改 Signal 內部值
this._tasks().push(newTask);

// ✅ 正確：使用 update 方法
this._tasks.update(tasks => [...tasks, newTask]);
```

```typescript
// ❌ 禁止：在元件中管理複雜狀態
@Component({ ... })
export class TaskListComponent {
  tasks: Task[] = [];
  loading = false;
  error: string | null = null;
  
  async loadTasks() { ... }
}

// ✅ 正確：使用 Store 管理狀態
@Component({ ... })
export class TaskListComponent {
  private readonly store = inject(TaskStore);
  
  protected readonly tasks = this.store.tasks;
  protected readonly loading = this.store.loading;
}
```

### 3. API 呼叫反模式

```typescript
// ❌ 禁止：在元件中直接呼叫 Firebase/Firestore
@Component({ ... })
export class TaskComponent {
  private readonly firebase = inject(Firebase/FirestoreService);
  
  async loadTasks() {
    const { data } = await this.firebase.client
      .from('tasks')
      .select('*');
  }
}

// ✅ 正確：透過 Repository 封裝
@Component({ ... })
export class TaskComponent {
  private readonly repository = inject(TaskRepository);
  
  async loadTasks() {
    const tasks = await this.repository.findAll();
  }
}
```

---

## 🚫 禁止的資料庫操作

### 1. RLS 政策違規

```sql
-- ❌ 禁止：在 RLS 中直接查詢受保護的表（會導致無限遞迴）
CREATE POLICY "..." ON accounts
USING (id IN (SELECT account_id FROM organization_members WHERE ...));

-- ✅ 正確：使用 Helper Function
CREATE POLICY "..." ON accounts
USING (is_org_member(owner_id));
```

```sql
-- ❌ 禁止：沒有 RLS 政策的表
CREATE TABLE tasks (...);

-- ✅ 正確：建表後必須啟用 RLS 並建立政策
CREATE TABLE tasks (...);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "..." ON tasks USING (...);
```

### 2. 資料完整性

```sql
-- ❌ 禁止：硬刪除重要資料
DELETE FROM tasks WHERE id = :id;

-- ✅ 正確：軟刪除
UPDATE tasks SET deleted_at = now() WHERE id = :id;
```

```sql
-- ❌ 禁止：沒有外鍵約束
CREATE TABLE task_attachments (
  task_id UUID  -- 沒有 REFERENCES
);

-- ✅ 正確：建立外鍵約束
CREATE TABLE task_attachments (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE
);
```

---

## 🚫 禁止的檔案操作

### 1. 檔案大小與格式

| 類型 | 限制 | 違規處理 |
|------|------|----------|
| 圖片 | 最大 10 MB | 拒絕上傳並提示壓縮 |
| 文件 | 最大 50 MB | 拒絕上傳 |
| 工程圖 | 最大 100 MB | 拒絕上傳 |

### 2. 禁止的檔案類型

```
❌ 禁止上傳：
- .exe, .bat, .cmd, .com  （執行檔）
- .js, .vbs, .ps1         （腳本）
- .dll, .sys              （系統檔）
```

---

## 🚫 禁止的架構違規

### 1. 層級違規

```
❌ 禁止：業務層直接存取基礎層
features/blueprint/ 不應直接 import core/facades/account/

✅ 正確：透過容器層傳遞上下文
features/blueprint/ 從 BlueprintStore 取得已注入的上下文
```

### 2. 循環依賴

```typescript
// ❌ 禁止：模組之間循環依賴
// task.service.ts
import { DiaryService } from '../diary/diary.service';

// diary.service.ts
import { TaskService } from '../task/task.service';

// ✅ 正確：使用事件解耦
// task.service.ts
this.eventBus.publish('task.completed', task);

// diary.service.ts
this.eventBus.subscribe('task.completed', this.handleTaskCompleted);
```

### 3. 檔案大小超限

```
❌ 禁止：
- Component TypeScript > 500 行
- Template HTML > 300 行
- LESS 樣式 > 200 行

✅ 正確：
- 拆分為多個子元件
- 抽取共用邏輯到 Service
- 使用 Mixin 或工具類
```

---

## 🚫 禁止的安全違規

### 1. 敏感資料處理

```typescript
// ❌ 禁止：在日誌中輸出敏感資料
console.log('User token:', token);
console.log('Password:', password);

// ✅ 正確：只記錄必要資訊
console.log('User authenticated:', userId);
```

```typescript
// ❌ 禁止：在 URL 中傳遞敏感資料
router.navigate(['/api'], { queryParams: { token: authToken } });

// ✅ 正確：使用 Header 或 Body
this.http.post('/api', data, { headers: { Authorization: `Bearer ${token}` } });
```

### 2. XSS 防護

```typescript
// ❌ 禁止：直接使用 innerHTML
element.innerHTML = userInput;

// ✅ 正確：使用 Angular 的安全機制
@Component({ template: `<div [innerHTML]="sanitizedContent"></div>` })
class MyComponent {
  sanitizedContent = this.sanitizer.bypassSecurityTrustHtml(content);
}
```

### 3. SQL 注入

```typescript
// ❌ 禁止：字串拼接 SQL
const query = `SELECT * FROM tasks WHERE name = '${userInput}'`;

// ✅ 正確：使用參數化查詢
const { data } = await firebase
  .from('tasks')
  .select('*')
  .eq('name', userInput);
```

---

## 🚫 禁止的效能反模式

### 1. 記憶體洩漏

```typescript
// ❌ 禁止：未清理 Subscription
ngOnInit() {
  this.data$.subscribe(data => { ... });
}

// ✅ 正確：使用 takeUntilDestroyed
private destroyRef = inject(DestroyRef);

ngOnInit() {
  this.data$
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(data => { ... });
}
```

```typescript
// ❌ 禁止：未取消 Realtime 訂閱
ngOnInit() {
  firebase.channel('tasks').subscribe();
}

// ✅ 正確：在 ngOnDestroy 中取消
ngOnDestroy() {
  this.channel?.unsubscribe();
}
```

### 2. 不必要的渲染

```typescript
// ❌ 禁止：使用預設變更偵測
@Component({ ... })
export class TaskComponent {}

// ✅ 正確：使用 OnPush 策略
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskComponent {}
```

```html
<!-- ❌ 禁止：ngFor 沒有 trackBy -->
<div *ngFor="let task of tasks">{{ task.name }}</div>

<!-- ✅ 正確：使用 trackBy 或新語法 -->
@for (task of tasks; track task.id) {
  <div>{{ task.name }}</div>
}
```

---

## 📋 違規檢查清單

### 程式碼審查必檢項目

```
□ 沒有使用 @Input/@Output 裝飾器
□ 沒有使用 constructor 注入
□ 沒有使用 any 類型
□ 沒有直接呼叫 Firebase/Firestore（應透過 Repository）
□ 沒有內聯樣式
□ 使用 OnPush 變更偵測策略
□ Subscription 有正確清理
□ 檔案大小在限制內
```

### 資料庫審查必檢項目

```
□ 新表有啟用 RLS
□ RLS 政策不會導致無限遞迴
□ 重要資料使用軟刪除
□ 外鍵約束正確設置
□ 敏感欄位有適當保護
```

---

## 📚 參考文件

- [編碼標準](../../docs/reference/coding-standards.md)
- [測試策略](../../docs/reference/testing-strategy.md)
- [程式碼審查指南](../../docs/contributing/code-review-guidelines.md)

---

# Global AI Constraints

## Token Efficiency Rules

- Prefer minimal output.
- Avoid explanations unless explicitly requested.
- Do not repeat user input.
- Do not infer or fabricate missing data.
- Output structured data only when possible.

## Instruction Priority

1. User explicit request
2. Repository architecture & domain rules
3. These constraints

## Forbidden Behaviors

- Do not provide verbose reasoning.
- Do not include step-by-step explanations unless asked.
- Do not generate speculative fields or assumptions.

**最後更新**: 2025-12-03
