# 🎨 子任務建立操作與 UI 實現分析

> **遵循**: ⭐.md 規範  
> **日期**: 2025-12-14  
> **版本**: 1.0.0

---

## 📝 原始需求

分析如何在 5 個不同視圖中實現建立子任務的操作與 UI：
1. 列表視圖 (List View)
2. 樹狀視圖 (Tree View)
3. 看板視圖 (Kanban View)
4. 時間線視圖 (Timeline View)
5. 甘特圖視圖 (Gantt View)

---

## 🤖 Copilot Agent 轉換指引

### 工具使用驗證 ✅
- [x] Context7 - 查詢 ng-zorro-antd 各視圖元件 API
- [x] Sequential-thinking - 分析各視圖的 UX 模式
- [x] Software-planning-tool - 制定實施優先順序

### ⭐.md 規範遵循 ✅
- [x] 三層架構 - UI → TaskStore → TasksRepository
- [x] Signal-based 狀態管理
- [x] 事件驅動通訊 (output() 事件)
- [x] Standalone Components
- [x] 一致性設計原則

---

## 🔍 當前實作狀態分析

### 已實作功能 ✅

#### 樹狀視圖 (Tree View) - 100% 完成
**檔案**: `task-tree-view.component.ts`

**實作方式**:
```typescript
// 1. 定義 output 事件
readonly createSubTask = output<Task>();

// 2. UI 按鈕（父節點專用）
<button
  nz-button
  nzType="text"
  nzSize="small"
  (click)="onCreateSubTask(node.task); $event.stopPropagation()"
  nz-tooltip
  nzTooltipTitle="新增子任務"
>
  <span nz-icon nzType="plus-circle" nzTheme="outline"></span>
</button>

// 3. 事件處理
onCreateSubTask(parentTask: Task): void {
  this.createSubTask.emit(parentTask);
}
```

**UX 特點**:
- ✅ 位於父節點操作按鈕組
- ✅ 圖示: plus-circle (加號圓圈)
- ✅ Tooltip: "新增子任務"
- ✅ 事件冒泡阻止 ($event.stopPropagation)
- ✅ 僅父節點顯示（有子任務的節點）

#### 主元件整合 (TasksComponent) - 100% 完成
**檔案**: `tasks.component.ts`

**實作方式**:
```typescript
// 接收子任務建立事件
<app-task-tree-view
  [blueprintId]="_blueprintId()"
  (editTask)="editTask($event)"
  (deleteTask)="deleteTask($event)"
  (createSubTask)="createSubTask($event)"  // ← 事件綁定
/>

// 處理方法
createSubTask(parentTask: Task): void {
  const blueprintId = this._blueprintId();
  if (!blueprintId) {
    this.message.warning('請先選擇藍圖');
    return;
  }

  this.modal.create({
    nzTitle: `新增子任務 - ${parentTask.title}`,
    nzContent: TaskModalComponent,
    nzData: {
      blueprintId: blueprintId,
      parentTask: parentTask,  // ← 傳遞父任務
      mode: 'create'
    },
    nzWidth: 800,
    nzFooter: null
  });
}
```

### 待實作視圖 ⏳

#### 1. 列表視圖 (List View) - 0%
**狀態**: ❌ 未實作

#### 2. 看板視圖 (Kanban View) - 0%
**狀態**: ❌ 未實作

#### 3. 時間線視圖 (Timeline View) - 0%
**狀態**: ❌ 未實作

#### 4. 甘特圖視圖 (Gantt View) - 0%
**狀態**: ❌ 未實作

---

## 📐 設計方案

### 設計原則

1. **一致性** - 所有視圖使用相同的 UI 模式和圖示
2. **可發現性** - 操作按鈕易於發現
3. **情境感知** - 根據視圖特性調整位置和樣式
4. **事件統一** - 統一使用 `createSubTask` output 事件
5. **模態框統一** - 使用同一個 TaskModalComponent

### 通用 UI 元素

#### 按鈕設計標準
```typescript
<button
  nz-button
  nzType="text"        // 或 "default"（視圖而定）
  nzSize="small"
  (click)="onCreateSubTask(task); $event.stopPropagation()"
  nz-tooltip
  nzTooltipTitle="新增子任務"
>
  <span nz-icon nzType="plus-circle" nzTheme="outline"></span>
</button>
```

#### 圖示標準
- **主圖示**: `plus-circle` (加號圓圈)
- **主題**: `outline`
- **顏色**: 預設或主題色 (#1890ff)

#### Tooltip 文字
- 繁體中文: "新增子任務"
- 英文 (備用): "Add Subtask"

---

## 🎯 各視圖實施方案

### 1️⃣ 列表視圖 (List View)

#### 技術方案 A: ST Table 按鈕列 ✅ **推薦**

**實作位置**: 操作列 (buttons 欄位)

**優點**:
- 與編輯、刪除按鈕並列，符合使用者習慣
- ST Table 原生支援，無需額外佈局
- 行內操作，直觀明確

**缺點**:
- 增加操作列寬度

**實作代碼**:
```typescript
// task-list-view.component.ts

// 1. 新增 output 事件
readonly createSubTask = output<Task>();

// 2. 更新 ST columns
columns: STColumn[] = [
  // ... 其他欄位
  {
    title: '操作',
    buttons: [
      {
        text: '編輯',
        icon: 'edit',
        click: (record: Task) => this.editTask.emit(record)
      },
      {
        text: '新增子任務',        // ← 新增
        icon: 'plus-circle',
        type: 'default',
        click: (record: Task) => this.createSubTask.emit(record)
      },
      {
        text: '刪除',
        icon: 'delete',
        type: 'del',
        pop: {
          title: '確認刪除此任務？',
          okType: 'danger'
        },
        click: (record: Task) => this.deleteTask.emit(record)
      }
    ]
  }
];
```

**TasksComponent 綁定**:
```typescript
<app-task-list-view
  [blueprintId]="_blueprintId()"
  (editTask)="editTask($event)"
  (deleteTask)="deleteTask($event)"
  (createSubTask)="createSubTask($event)"  // ← 新增綁定
/>
```

#### 技術方案 B: 下拉選單

**優點**: 節省空間
**缺點**: 多一層操作，可發現性降低
**建議**: 不推薦（除非操作按鈕過多）

---

### 2️⃣ 樹狀視圖 (Tree View) - ✅ 已實作

**當前實作**: 完美 ✅

**保持現狀**:
- 父節點顯示「新增子任務」按鈕
- 與編輯、刪除按鈕並列
- 事件驅動，模態框統一

**無需修改** ✨

---

### 3️⃣ 看板視圖 (Kanban View)

#### 技術方案 A: 卡片內按鈕 ✅ **推薦**

**實作位置**: 任務卡片底部操作區

**優點**:
- 卡片內操作，符合看板 UX
- 與編輯、刪除按鈕並列
- 視覺層次清晰

**實作代碼**:
```typescript
// task-kanban-view.component.ts

// 1. 新增 output 事件
readonly createSubTask = output<Task>();

// 2. 更新卡片模板
@for (task of tasksInColumn; track task.id) {
  <nz-card
    class="task-card"
    [nzHoverable]="true"
    [nzSize]="'small'"
  >
    <!-- 卡片內容 -->
    <div class="task-header">
      <h4>{{ task.title }}</h4>
      <nz-tag [nzColor]="getPriorityColor(task.priority)">
        {{ getPriorityLabel(task.priority) }}
      </nz-tag>
    </div>
    
    <!-- 操作按鈕區 -->
    <div class="task-actions" style="margin-top: 12px; display: flex; gap: 8px;">
      <button
        nz-button
        nzType="default"
        nzSize="small"
        (click)="onEditTask(task)"
      >
        <span nz-icon nzType="edit"></span>
        編輯
      </button>
      
      <!-- 新增子任務按鈕 -->
      <button
        nz-button
        nzType="default"
        nzSize="small"
        (click)="onCreateSubTask(task)"
      >
        <span nz-icon nzType="plus-circle"></span>
        子任務
      </button>
      
      <button
        nz-button
        nzType="default"
        nzDanger
        nzSize="small"
        nz-popconfirm
        nzPopconfirmTitle="確認刪除？"
        (nzOnConfirm)="onDeleteTask(task)"
      >
        <span nz-icon nzType="delete"></span>
      </button>
    </div>
  </nz-card>
}

// 3. 事件處理方法
onCreateSubTask(task: Task): void {
  this.createSubTask.emit(task);
}
```

**TasksComponent 綁定**:
```typescript
<app-task-kanban-view
  [blueprintId]="_blueprintId()"
  (createSubTask)="createSubTask($event)"  // ← 新增綁定
/>
```

#### 技術方案 B: 卡片右鍵選單

**優點**: 節省空間
**缺點**: 可發現性低
**建議**: 可作為輔助方案

---

### 4️⃣ 時間線視圖 (Timeline View)

#### 技術方案 A: Timeline Item 內按鈕 ✅ **推薦**

**實作位置**: Timeline 項目的操作區

**優點**:
- 符合 Timeline 佈局
- 操作明確
- 易於擴展

**實作代碼**:
```typescript
// task-timeline-view.component.ts

// 1. 新增 output 事件
readonly createSubTask = output<Task>();

// 2. 更新 Timeline 模板
<nz-timeline [nzPending]="'進行中的任務...'" [nzReverse]="false">
  @for (task of sortedTasks(); track task.id) {
    <nz-timeline-item [nzColor]="getTimelineColor(task.status)">
      <!-- 時間戳 -->
      <div class="timeline-time">
        {{ task.createdAt | date: 'yyyy-MM-dd HH:mm' }}
      </div>
      
      <!-- 任務內容 -->
      <div class="timeline-content">
        <h4>{{ task.title }}</h4>
        <p>{{ task.description }}</p>
        
        <!-- 標籤 -->
        <nz-space [nzSize]="8">
          <nz-tag *nzSpaceItem [nzColor]="getStatusColor(task.status)">
            {{ getStatusLabel(task.status) }}
          </nz-tag>
          <nz-tag *nzSpaceItem [nzColor]="getPriorityColor(task.priority)">
            {{ getPriorityLabel(task.priority) }}
          </nz-tag>
        </nz-space>
        
        <!-- 操作按鈕 -->
        <div class="timeline-actions" style="margin-top: 12px;">
          <button
            nz-button
            nzType="text"
            nzSize="small"
            (click)="onEditTask(task)"
          >
            <span nz-icon nzType="edit"></span>
            編輯
          </button>
          
          <!-- 新增子任務按鈕 -->
          <button
            nz-button
            nzType="text"
            nzSize="small"
            (click)="onCreateSubTask(task)"
          >
            <span nz-icon nzType="plus-circle"></span>
            子任務
          </button>
          
          <button
            nz-button
            nzType="text"
            nzSize="small"
            nzDanger
            nz-popconfirm
            nzPopconfirmTitle="確認刪除？"
            (nzOnConfirm)="onDeleteTask(task)"
          >
            <span nz-icon nzType="delete"></span>
          </button>
        </div>
      </div>
    </nz-timeline-item>
  }
</nz-timeline>

// 3. 事件處理方法
onCreateSubTask(task: Task): void {
  this.createSubTask.emit(task);
}
```

**TasksComponent 綁定**:
```typescript
<app-task-timeline-view
  [blueprintId]="_blueprintId()"
  (createSubTask)="createSubTask($event)"  // ← 新增綁定
/>
```

---

### 5️⃣ 甘特圖視圖 (Gantt View)

#### 技術方案 A: 右鍵選單 ✅ **推薦**

**實作位置**: 甘特圖任務條右鍵選單

**優點**:
- 符合甘特圖 UX 慣例
- 不影響視覺佈局
- 專業工具常見模式

**缺點**:
- 需要實作右鍵選單邏輯

**實作代碼**:
```typescript
// task-gantt-view.component.ts

// 1. 新增 output 事件
readonly createSubTask = output<Task>();

// 2. 新增右鍵選單邏輯
onTaskContextMenu(event: MouseEvent, task: Task): void {
  event.preventDefault();
  
  // 使用 nz-dropdown 實作右鍵選單
  this.contextMenuTask = task;
  this.contextMenuVisible = true;
  this.contextMenuPosition = { x: event.clientX, y: event.clientY };
}

// 3. 右鍵選單模板
<nz-dropdown-menu #contextMenu="nzDropdownMenu">
  <ul nz-menu>
    <li nz-menu-item (click)="onEditTask(contextMenuTask!)">
      <span nz-icon nzType="edit"></span>
      編輯任務
    </li>
    
    <!-- 新增子任務選項 -->
    <li nz-menu-item (click)="onCreateSubTask(contextMenuTask!)">
      <span nz-icon nzType="plus-circle"></span>
      新增子任務
    </li>
    
    <li nz-menu-divider></li>
    
    <li nz-menu-item nzDanger (click)="onDeleteTask(contextMenuTask!)">
      <span nz-icon nzType="delete"></span>
      刪除任務
    </li>
  </ul>
</nz-dropdown-menu>

// 4. 任務條綁定右鍵事件
<div
  class="gantt-task-bar"
  (contextmenu)="onTaskContextMenu($event, task)"
  [style.left]="getTaskPosition(task).left"
  [style.width]="getTaskPosition(task).width"
>
  {{ task.title }}
</div>

// 5. 事件處理方法
onCreateSubTask(task: Task): void {
  this.contextMenuVisible = false;
  this.createSubTask.emit(task);
}
```

#### 技術方案 B: Hover 顯示操作按鈕

**優點**: 操作直觀
**缺點**: 空間有限，可能遮擋內容
**建議**: 可作為輔助方案

**實作代碼**:
```typescript
// 任務條 hover 樣式
<div
  class="gantt-task-bar"
  [class.hover]="hoveredTaskId === task.id"
  (mouseenter)="hoveredTaskId = task.id"
  (mouseleave)="hoveredTaskId = null"
>
  {{ task.title }}
  
  <!-- Hover 顯示的操作按鈕 -->
  @if (hoveredTaskId === task.id) {
    <div class="task-quick-actions">
      <button
        nz-button
        nzType="text"
        nzSize="small"
        (click)="onCreateSubTask(task); $event.stopPropagation()"
        nz-tooltip
        nzTooltipTitle="新增子任務"
      >
        <span nz-icon nzType="plus-circle"></span>
      </button>
    </div>
  }
</div>
```

**TasksComponent 綁定**:
```typescript
<app-task-gantt-view
  [blueprintId]="_blueprintId()"
  (createSubTask)="createSubTask($event)"  // ← 新增綁定
/>
```

---

## 📋 實施計畫

### Phase 1: 列表視圖 (優先順序: P0)
**預估時間**: 30 分鐘

**任務**:
- [ ] 新增 `createSubTask` output 事件
- [ ] 更新 ST columns 配置，加入「新增子任務」按鈕
- [ ] TasksComponent 綁定事件
- [ ] 測試驗證

### Phase 2: 看板視圖 (優先順序: P1)
**預估時間**: 45 分鐘

**任務**:
- [ ] 新增 `createSubTask` output 事件
- [ ] 更新卡片模板，加入操作按鈕
- [ ] 優化卡片佈局（確保按鈕不擁擠）
- [ ] TasksComponent 綁定事件
- [ ] 測試驗證

### Phase 3: 時間線視圖 (優先順序: P1)
**預估時間**: 30 分鐘

**任務**:
- [ ] 新增 `createSubTask` output 事件
- [ ] 更新 Timeline Item 模板
- [ ] TasksComponent 綁定事件
- [ ] 測試驗證

### Phase 4: 甘特圖視圖 (優先順序: P2)
**預估時間**: 1 小時

**任務**:
- [ ] 新增 `createSubTask` output 事件
- [ ] 實作右鍵選單邏輯
- [ ] 設計右鍵選單 UI
- [ ] TasksComponent 綁定事件
- [ ] 測試驗證（包含右鍵選單互動）

---

## ✅ 檢查清單

### 設計一致性檢查
- [ ] 所有視圖使用相同圖示 (plus-circle)
- [ ] 所有視圖使用相同 Tooltip 文字
- [ ] 所有視圖使用統一 output 事件名稱 (`createSubTask`)
- [ ] 模態框標題格式一致：`新增子任務 - ${parentTask.title}`

### 技術規範檢查
- [ ] 使用 `output()` 函數（Angular 19+）
- [ ] 事件處理使用 `$event.stopPropagation()`（防止冒泡）
- [ ] 使用 `inject()` 注入依賴
- [ ] 遵循 Standalone Components 模式
- [ ] Signal-based 狀態管理

### UX 檢查
- [ ] 按鈕易於發現（不隱藏在過深選單）
- [ ] 操作回饋明確（Tooltip 說明）
- [ ] 視覺層次清晰（與其他操作區分）
- [ ] 響應式設計（小螢幕也可用）

### 安全性檢查
- [ ] 檢查使用者權限（可建立子任務）
- [ ] 驗證父任務存在
- [ ] 驗證 blueprintId 有效

---

## 🎯 總結

### 推薦實施順序

1. **列表視圖** (P0) - 最常用，優先實施
2. **看板視圖** (P1) - 敏捷團隊常用
3. **時間線視圖** (P1) - 簡單易實作
4. **甘特圖視圖** (P2) - 較複雜，最後實施

### 預估總工時

- **開發**: 3-4 小時
- **測試**: 1-2 小時
- **文檔**: 30 分鐘
- **總計**: 5-7 小時

### 技術亮點

- ✅ **一致性設計** - 統一的 UI 模式和事件處理
- ✅ **符合 ⭐.md 規範** - 三層架構、Signal、事件驅動
- ✅ **用戶體驗優先** - 根據視圖特性優化操作位置
- ✅ **可維護性高** - 統一的事件處理邏輯，易於擴展

### 未來優化

1. **批次建立子任務** - 一次建立多個子任務
2. **子任務範本** - 預設子任務結構
3. **拖放建立子任務** - 從其他任務拖放建立關聯
4. **快捷鍵支援** - Ctrl+Shift+N 快速建立子任務

---

## 📚 參考資料

### 相關文件
- [⭐.md](../../⭐.md) - 專案規範
- [SUBTASK_FEATURE_DESIGN.md](./SUBTASK_FEATURE_DESIGN.md) - 子任務功能設計
- [Task Module README](../../src/app/core/blueprint/modules/implementations/tasks/README.md)

### 程式碼檔案
- [tasks.component.ts](../../src/app/core/blueprint/modules/implementations/tasks/tasks.component.ts)
- [task-list-view.component.ts](../../src/app/core/blueprint/modules/implementations/tasks/views/task-list-view.component.ts)
- [task-tree-view.component.ts](../../src/app/core/blueprint/modules/implementations/tasks/views/task-tree-view.component.ts)
- [task-kanban-view.component.ts](../../src/app/core/blueprint/modules/implementations/tasks/views/task-kanban-view.component.ts)
- [task-timeline-view.component.ts](../../src/app/core/blueprint/modules/implementations/tasks/views/task-timeline-view.component.ts)
- [task-gantt-view.component.ts](../../src/app/core/blueprint/modules/implementations/tasks/views/task-gantt-view.component.ts)

### ng-zorro-antd 文檔
- [ST Table](https://ng.ant.design/components/st/en)
- [Tree View](https://ng.ant.design/components/tree-view/en)
- [Timeline](https://ng.ant.design/components/timeline/en)
- [Dropdown](https://ng.ant.design/components/dropdown/en)

---

**文件版本**: 1.0.0  
**建立日期**: 2025-12-14  
**作者**: GitHub Copilot  
**狀態**: 📋 設計完成，待實施  
**遵循規範**: ⭐.md
