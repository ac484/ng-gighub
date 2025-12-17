# SETC-053: Task UI Components & Testing

> **任務編號**: SETC-053  
> **模組**: Task Module (任務模組)  
> **優先級**: P1 (Important)  
> **預估工時**: 3 天  
> **依賴**: SETC-052  
> **狀態**: 📋 待開始

---

## 📋 任務概述

### 目標
實作 Task Module 的 UI 元件庫和完整測試套件，提供任務列表、任務表單、任務詳情、甘特圖等視覺化元件，並確保所有服務的測試覆蓋率達標。

### 範圍
- 任務列表元件（含篩選、排序）
- 任務表單元件（建立/編輯）
- 任務詳情元件
- 任務甘特圖元件
- 任務日曆元件
- 單元測試與整合測試

---

## 🏗️ UI 元件實作

### 1. 任務列表元件

```typescript
import { Component, inject, signal, computed, input, output, OnInit } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { STColumn, STData, STChange } from '@delon/abc/st';
import { TaskRepository } from '../repositories/task.repository';
import { Task, TaskStatus, TaskFilters } from '../models/task.model';
import { TaskProgressBarComponent } from './task-progress-bar.component';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [SHARED_IMPORTS, TaskProgressBarComponent],
  template: `
    <nz-card [nzTitle]="titleTpl" [nzExtra]="extraTpl">
      <ng-template #titleTpl>
        <span>任務列表</span>
        <nz-badge [nzCount]="tasks().length" nzShowZero class="ml-sm" />
      </ng-template>
      
      <ng-template #extraTpl>
        <nz-space>
          <button *nzSpaceItem nz-button nzType="primary" (click)="onCreateTask()">
            <i nz-icon nzType="plus"></i>
            新增任務
          </button>
          <button *nzSpaceItem nz-button (click)="toggleFilters()">
            <i nz-icon nzType="filter"></i>
            篩選
          </button>
        </nz-space>
      </ng-template>

      <!-- 篩選面板 -->
      @if (showFilters()) {
        <div class="filter-panel mb-md">
          <nz-row [nzGutter]="16">
            <nz-col [nzSpan]="6">
              <nz-select 
                [(ngModel)]="selectedStatus" 
                nzPlaceHolder="狀態"
                nzAllowClear
                (ngModelChange)="applyFilters()"
              >
                @for (status of statusOptions; track status.value) {
                  <nz-option [nzValue]="status.value" [nzLabel]="status.label" />
                }
              </nz-select>
            </nz-col>
            <nz-col [nzSpan]="6">
              <nz-select 
                [(ngModel)]="selectedPriority" 
                nzPlaceHolder="優先級"
                nzAllowClear
                (ngModelChange)="applyFilters()"
              >
                <nz-option nzValue="low" nzLabel="低" />
                <nz-option nzValue="medium" nzLabel="中" />
                <nz-option nzValue="high" nzLabel="高" />
                <nz-option nzValue="critical" nzLabel="緊急" />
              </nz-select>
            </nz-col>
            <nz-col [nzSpan]="6">
              <nz-input-group nzSearch [nzAddOnAfter]="searchBtn">
                <input nz-input placeholder="搜尋任務..." [(ngModel)]="searchText" />
              </nz-input-group>
              <ng-template #searchBtn>
                <button nz-button nzType="primary" (click)="applyFilters()">
                  <i nz-icon nzType="search"></i>
                </button>
              </ng-template>
            </nz-col>
          </nz-row>
        </div>
      }

      <!-- 任務表格 -->
      <st 
        [data]="tasks()" 
        [columns]="columns"
        [loading]="loading()"
        [page]="{ show: true, pageSize: 20 }"
        (change)="handleTableChange($event)"
      />
    </nz-card>
  `,
  styles: [`
    .filter-panel {
      padding: 16px;
      background: #fafafa;
      border-radius: 4px;
    }
    nz-select {
      width: 100%;
    }
  `]
})
export class TaskListComponent implements OnInit {
  // Inputs
  blueprintId = input.required<string>();
  
  // Outputs
  taskSelected = output<Task>();
  createTask = output<void>();
  
  // Services
  private taskRepository = inject(TaskRepository);
  
  // State
  tasks = signal<Task[]>([]);
  loading = signal(false);
  showFilters = signal(false);
  selectedStatus: TaskStatus | null = null;
  selectedPriority: string | null = null;
  searchText = '';
  
  // Table columns
  columns: STColumn[] = [
    { title: '編號', index: 'taskNumber', width: 100 },
    { title: '任務名稱', index: 'title', width: 250 },
    { 
      title: '狀態', 
      index: 'status', 
      width: 100,
      type: 'badge',
      badge: {
        draft: { text: '草稿', color: 'default' },
        pending: { text: '待開始', color: 'warning' },
        assigned: { text: '已指派', color: 'processing' },
        in_progress: { text: '進行中', color: 'processing' },
        submitted: { text: '已提報', color: 'purple' },
        confirmed: { text: '已確認', color: 'success' },
        cancelled: { text: '已取消', color: 'error' }
      }
    },
    { 
      title: '進度', 
      index: 'progress',
      width: 120,
      format: (item) => `${item.progress || 0}%`
    },
    { 
      title: '負責人', 
      index: 'assignedTo',
      width: 120
    },
    { 
      title: '截止日期', 
      index: 'plannedEndDate',
      type: 'date',
      width: 120
    },
    {
      title: '操作',
      width: 150,
      buttons: [
        { text: '查看', click: (item: any) => this.viewTask(item) },
        { text: '編輯', click: (item: any) => this.editTask(item) },
        { 
          text: '更多',
          children: [
            { text: '刪除', click: (item: any) => this.deleteTask(item) }
          ]
        }
      ]
    }
  ];

  statusOptions = [
    { value: 'draft', label: '草稿' },
    { value: 'pending', label: '待開始' },
    { value: 'assigned', label: '已指派' },
    { value: 'in_progress', label: '進行中' },
    { value: 'submitted', label: '已提報' },
    { value: 'confirmed', label: '已確認' },
    { value: 'cancelled', label: '已取消' }
  ];

  ngOnInit(): void {
    this.loadTasks();
  }

  async loadTasks(): Promise<void> {
    this.loading.set(true);
    try {
      const filters: TaskFilters = {};
      if (this.selectedStatus) filters.status = this.selectedStatus;
      if (this.selectedPriority) filters.priority = this.selectedPriority as any;
      if (this.searchText) filters.searchText = this.searchText;
      
      const tasks = await this.taskRepository.findByBlueprint(
        this.blueprintId(), 
        filters
      );
      this.tasks.set(tasks);
    } finally {
      this.loading.set(false);
    }
  }

  toggleFilters(): void {
    this.showFilters.update(v => !v);
  }

  applyFilters(): void {
    this.loadTasks();
  }

  onCreateTask(): void {
    this.createTask.emit();
  }

  viewTask(task: Task): void {
    this.taskSelected.emit(task);
  }

  editTask(task: Task): void {
    // TODO: 開啟編輯 modal
  }

  deleteTask(task: Task): void {
    // TODO: 確認刪除
  }

  handleTableChange(e: STChange): void {
    // 處理表格變更事件
  }
}
```

### 2. 任務表單元件

```typescript
import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import { SFSchema } from '@delon/form';
import { TaskRepository } from '../repositories/task.repository';
import { Task, CreateTaskData } from '../models/task.model';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [SHARED_IMPORTS, ReactiveFormsModule],
  template: `
    <nz-modal
      [nzVisible]="visible()"
      [nzTitle]="task() ? '編輯任務' : '新增任務'"
      [nzWidth]="720"
      (nzOnCancel)="onCancel()"
      (nzOnOk)="onSubmit()"
      [nzOkLoading]="submitting()"
    >
      <ng-container *nzModalContent>
        <form nz-form [formGroup]="form" nzLayout="vertical">
          <nz-row [nzGutter]="16">
            <nz-col [nzSpan]="24">
              <nz-form-item>
                <nz-form-label nzRequired>任務名稱</nz-form-label>
                <nz-form-control nzErrorTip="請輸入任務名稱">
                  <input nz-input formControlName="title" placeholder="請輸入任務名稱" />
                </nz-form-control>
              </nz-form-item>
            </nz-col>
          </nz-row>

          <nz-row [nzGutter]="16">
            <nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label>分類</nz-form-label>
                <nz-form-control>
                  <nz-select formControlName="category" nzPlaceHolder="選擇分類">
                    <nz-option nzValue="construction" nzLabel="施工" />
                    <nz-option nzValue="inspection" nzLabel="檢驗" />
                    <nz-option nzValue="procurement" nzLabel="採購" />
                    <nz-option nzValue="documentation" nzLabel="文件" />
                    <nz-option nzValue="other" nzLabel="其他" />
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label>優先級</nz-form-label>
                <nz-form-control>
                  <nz-select formControlName="priority" nzPlaceHolder="選擇優先級">
                    <nz-option nzValue="low" nzLabel="低" />
                    <nz-option nzValue="medium" nzLabel="中" />
                    <nz-option nzValue="high" nzLabel="高" />
                    <nz-option nzValue="critical" nzLabel="緊急" />
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </nz-col>
          </nz-row>

          <nz-row [nzGutter]="16">
            <nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label>計畫開始日期</nz-form-label>
                <nz-form-control>
                  <nz-date-picker 
                    formControlName="plannedStartDate" 
                    nzPlaceHolder="選擇日期"
                    style="width: 100%"
                  />
                </nz-form-control>
              </nz-form-item>
            </nz-col>
            <nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label>計畫完成日期</nz-form-label>
                <nz-form-control>
                  <nz-date-picker 
                    formControlName="plannedEndDate" 
                    nzPlaceHolder="選擇日期"
                    style="width: 100%"
                  />
                </nz-form-control>
              </nz-form-item>
            </nz-col>
          </nz-row>

          <nz-form-item>
            <nz-form-label>描述</nz-form-label>
            <nz-form-control>
              <textarea 
                nz-input 
                formControlName="description" 
                placeholder="請輸入任務描述"
                [nzAutosize]="{ minRows: 3, maxRows: 6 }"
              ></textarea>
            </nz-form-control>
          </nz-form-item>
        </form>
      </ng-container>
    </nz-modal>
  `
})
export class TaskFormComponent implements OnInit {
  visible = input<boolean>(false);
  task = input<Task | null>(null);
  blueprintId = input.required<string>();
  
  saved = output<Task>();
  cancelled = output<void>();
  
  private fb = inject(FormBuilder);
  private taskRepository = inject(TaskRepository);
  
  submitting = signal(false);
  
  form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: [''],
    category: ['construction'],
    priority: ['medium'],
    plannedStartDate: [null as Date | null],
    plannedEndDate: [null as Date | null]
  });

  ngOnInit(): void {
    if (this.task()) {
      this.form.patchValue(this.task() as any);
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.form.valid) return;
    
    this.submitting.set(true);
    try {
      const formValue = this.form.value;
      
      if (this.task()) {
        // 更新
        const updated = await this.taskRepository.update(this.task()!.id, formValue as any);
        this.saved.emit(updated);
      } else {
        // 建立
        const created = await this.taskRepository.create({
          ...formValue,
          blueprintId: this.blueprintId(),
          createdBy: 'current-user' // TODO: 從 AuthService 取得
        } as CreateTaskData);
        this.saved.emit(created);
      }
    } finally {
      this.submitting.set(false);
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
```

### 3. 任務甘特圖元件

```typescript
import { Component, inject, input, signal, computed, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { TaskScheduleService } from '../services/task-schedule.service';
import { GanttData, GanttTask } from '../services/task-schedule.interface';

@Component({
  selector: 'app-task-gantt',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-card nzTitle="甘特圖">
      @if (loading()) {
        <nz-spin nzSimple />
      } @else {
        <div class="gantt-container" #ganttContainer>
          <!-- 左側任務列表 -->
          <div class="gantt-sidebar">
            <div class="gantt-header-row">
              <span>任務名稱</span>
            </div>
            @for (task of ganttData()?.tasks || []; track task.id) {
              <div 
                class="gantt-task-row" 
                [style.padding-left.px]="task.level * 20"
              >
                <span>{{ task.title }}</span>
              </div>
            }
          </div>
          
          <!-- 右側時間軸 -->
          <div class="gantt-timeline">
            <div class="gantt-header-row">
              @for (date of dateHeaders(); track date) {
                <div class="gantt-date-cell">{{ date | date:'MM/dd' }}</div>
              }
            </div>
            @for (task of ganttData()?.tasks || []; track task.id) {
              <div class="gantt-task-timeline">
                <div 
                  class="gantt-bar"
                  [style.left.%]="getBarLeft(task)"
                  [style.width.%]="getBarWidth(task)"
                  [style.background-color]="getBarColor(task)"
                >
                  <div 
                    class="gantt-bar-progress" 
                    [style.width.%]="task.progress"
                  ></div>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </nz-card>
  `,
  styles: [`
    .gantt-container {
      display: flex;
      overflow: auto;
      min-height: 400px;
    }
    .gantt-sidebar {
      min-width: 200px;
      border-right: 1px solid #e8e8e8;
    }
    .gantt-timeline {
      flex: 1;
      overflow-x: auto;
    }
    .gantt-header-row {
      height: 40px;
      display: flex;
      align-items: center;
      background: #fafafa;
      border-bottom: 1px solid #e8e8e8;
      padding: 0 8px;
      font-weight: bold;
    }
    .gantt-task-row {
      height: 36px;
      display: flex;
      align-items: center;
      border-bottom: 1px solid #f0f0f0;
      padding: 0 8px;
    }
    .gantt-date-cell {
      min-width: 50px;
      text-align: center;
      border-right: 1px solid #f0f0f0;
    }
    .gantt-task-timeline {
      height: 36px;
      position: relative;
      border-bottom: 1px solid #f0f0f0;
    }
    .gantt-bar {
      position: absolute;
      height: 24px;
      top: 6px;
      border-radius: 4px;
      min-width: 10px;
    }
    .gantt-bar-progress {
      height: 100%;
      background: rgba(255,255,255,0.3);
      border-radius: 4px;
    }
  `]
})
export class TaskGanttComponent implements OnInit {
  blueprintId = input.required<string>();
  
  private scheduleService = inject(TaskScheduleService);
  
  loading = signal(false);
  ganttData = signal<GanttData | null>(null);
  
  dateHeaders = computed(() => {
    const data = this.ganttData();
    if (!data) return [];
    
    const dates: Date[] = [];
    const current = new Date(data.dateRange.start);
    const end = new Date(data.dateRange.end);
    
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  });

  async ngOnInit(): Promise<void> {
    await this.loadGanttData();
  }

  async loadGanttData(): Promise<void> {
    this.loading.set(true);
    try {
      const data = await this.scheduleService.getGanttData(this.blueprintId());
      this.ganttData.set(data);
    } finally {
      this.loading.set(false);
    }
  }

  getBarLeft(task: GanttTask): number {
    const data = this.ganttData();
    if (!data) return 0;
    
    const totalDays = data.totalDays || 1;
    const startOffset = this.daysBetween(data.dateRange.start, task.startDate);
    return (startOffset / totalDays) * 100;
  }

  getBarWidth(task: GanttTask): number {
    const data = this.ganttData();
    if (!data) return 10;
    
    const totalDays = data.totalDays || 1;
    const taskDays = this.daysBetween(task.startDate, task.endDate) || 1;
    return Math.max((taskDays / totalDays) * 100, 2);
  }

  getBarColor(task: GanttTask): string {
    const colors: Record<string, string> = {
      draft: '#d9d9d9',
      pending: '#faad14',
      assigned: '#1890ff',
      in_progress: '#1890ff',
      submitted: '#722ed1',
      confirmed: '#52c41a',
      cancelled: '#ff4d4f'
    };
    return colors[task.status] || '#1890ff';
  }

  private daysBetween(start: Date, end: Date): number {
    return Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));
  }
}
```

---

## 🧪 測試規格

### 服務單元測試

```typescript
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TaskRepository } from '../repositories/task.repository';
import { TaskAssignmentService } from '../services/task-assignment.service';
import { TaskStateMachineService } from '../services/task-state-machine.service';

describe('TaskRepository', () => {
  let repository: TaskRepository;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        TaskRepository
      ]
    });
    repository = TestBed.inject(TaskRepository);
  });

  it('should create a task', async () => {
    const task = await repository.create({
      blueprintId: 'bp-123',
      title: 'Test Task',
      createdBy: 'user-123'
    });
    expect(task.id).toBeDefined();
    expect(task.taskNumber).toMatch(/^TASK-\d{4}$/);
  });

  it('should find tasks by blueprint', async () => {
    const tasks = await repository.findByBlueprint('bp-123');
    expect(Array.isArray(tasks)).toBe(true);
  });
});

describe('TaskStateMachineService', () => {
  let service: TaskStateMachineService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        TaskStateMachineService,
        TaskRepository
      ]
    });
    service = TestBed.inject(TaskStateMachineService);
  });

  it('should validate allowed transitions', async () => {
    const validation = await service.canTransition('task-1', 'in_progress', 'user-1');
    expect(validation).toBeDefined();
    expect(typeof validation.allowed).toBe('boolean');
  });

  it('should reject invalid transitions', async () => {
    // confirmed 是終態，不應該能轉換
    const validation = await service.canTransition('confirmed-task', 'draft', 'user-1');
    expect(validation.allowed).toBe(false);
  });
});

describe('TaskAssignmentService', () => {
  let service: TaskAssignmentService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        TaskAssignmentService,
        TaskRepository
      ]
    });
    service = TestBed.inject(TaskAssignmentService);
  });

  it('should calculate user workload', async () => {
    const workload = await service.getUserWorkload('user-123');
    expect(workload.userId).toBe('user-123');
    expect(typeof workload.totalTasks).toBe('number');
    expect(typeof workload.utilizationRate).toBe('number');
  });
});
```

### 元件測試

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskListComponent } from './task-list.component';

describe('TaskListComponent', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskListComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskListComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('blueprintId', 'bp-123');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load tasks on init', async () => {
    await fixture.whenStable();
    expect(component.tasks()).toBeDefined();
  });

  it('should toggle filters', () => {
    expect(component.showFilters()).toBe(false);
    component.toggleFilters();
    expect(component.showFilters()).toBe(true);
  });
});
```

---

## ✅ 交付物

- [ ] `task-list.component.ts` - 任務列表元件
- [ ] `task-form.component.ts` - 任務表單元件
- [ ] `task-detail.component.ts` - 任務詳情元件
- [ ] `task-gantt.component.ts` - 任務甘特圖元件
- [ ] `task-calendar.component.ts` - 任務日曆元件
- [ ] `task-progress-bar.component.ts` - 進度條元件
- [ ] `*.spec.ts` - 所有單元測試
- [ ] 更新 `index.ts` 匯出

---

## 🎯 驗收標準

1. ✅ 所有 UI 元件正確渲染
2. ✅ 元件互動功能正常
3. ✅ 響應式設計適配
4. ✅ 與服務層正確整合
5. ✅ 單元測試覆蓋率 >80%
6. ✅ TypeScript 編譯無錯誤

---

**文件版本**: 1.0.0  
**建立日期**: 2025-12-15  
**最後更新**: 2025-12-15
