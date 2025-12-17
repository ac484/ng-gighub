# SETC-046: Task Module Enhancement Planning

> **任務編號**: SETC-046  
> **模組**: Task Module (任務模組)  
> **優先級**: P1 (Important)  
> **預估工時**: 1 天  
> **依賴**: 現有 Task Module 基礎實作  
> **狀態**: 📋 待開始

---

## 📋 任務概述

### 目標
規劃 Task Module 的擴展架構，完善現有基礎實作，建立完整的任務管理系統，與 SETC 工作流程完全整合。

### 範圍
- 分析現有 Task Module 實作狀態
- 識別待實作的功能模塊
- 設計擴展架構與資料模型
- 定義與其他模組的事件整合方案
- 制定實作計畫與驗收標準

---

## 🔍 現有實作分析

### 已完成功能
根據 `src/app/core/blueprint/modules/implementations/tasks/README.md`：

- ✅ 模組基礎結構 (`TasksModule`, `module.metadata.ts`)
- ✅ 資料存取層 (`tasks.repository.ts`)
- ✅ 核心服務 (`tasks.service.ts`)
- ✅ 基本 UI 元件 (`tasks.component.ts`, `task-modal.component.ts`)
- ✅ 路由配置 (`tasks.routes.ts`)
- ✅ Blueprint Container 整合

### 待實作功能
- 🔴 Assignment Sub-Module (任務指派)
- 🔴 State Machine Sub-Module (狀態機)
- 🔴 Progress Tracking Sub-Module (進度追蹤)
- 🔴 Schedule Sub-Module (排程管理)
- 🔴 Subtask Sub-Module (子任務)
- 🔴 Event Bus 完整整合

---

## 🏗️ 架構設計

### 模組結構

```
tasks/
├── tasks.module.ts                  # Domain 主模塊
├── module.metadata.ts               # Domain 元資料
├── tasks.repository.ts              # Firestore Repository
├── tasks.routes.ts                  # Domain 路由配置
├── services/
│   ├── task-crud.service.ts         # CRUD 服務 (重構)
│   ├── task-assignment.service.ts   # 任務指派服務 (新增)
│   ├── task-state-machine.service.ts # 狀態機服務 (新增)
│   ├── task-progress.service.ts     # 進度追蹤服務 (新增)
│   ├── task-schedule.service.ts     # 排程管理服務 (新增)
│   ├── task-subtask.service.ts      # 子任務服務 (新增)
│   └── task-event.service.ts        # 事件整合服務 (新增)
├── models/
│   ├── task.model.ts                # 任務資料模型
│   ├── task-assignment.model.ts     # 指派資料模型
│   └── task-progress.model.ts       # 進度資料模型
├── components/
│   ├── task-list/
│   ├── task-form/
│   ├── task-detail/
│   ├── task-assignment/
│   ├── task-progress/
│   └── task-gantt/
├── config/
│   └── tasks.config.ts              # 模組配置
├── exports/
│   └── tasks-api.exports.ts         # 公開 API
└── index.ts                         # 統一匯出
```

### 資料模型設計

```typescript
// 任務主模型
interface Task {
  id: string;
  blueprintId: string;
  parentTaskId?: string;
  taskNumber: string;
  
  // 基本資訊
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  
  // 合約關聯
  contractId?: string;
  workItemId?: string;
  workItemCode?: string;
  
  // 狀態與進度
  status: TaskStatus;
  progress: number; // 0-100
  
  // 指派
  assignedTo?: string;
  assignedTeam?: string;
  assignedBy?: string;
  assignedAt?: Date;
  
  // 排程
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  
  // 完成資訊
  completedBy?: string;
  completedAt?: Date;
  completionNotes?: string;
  
  // 審計
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// 任務狀態
type TaskStatus = 
  | 'draft'           // 草稿
  | 'pending'         // 待開始
  | 'assigned'        // 已指派
  | 'in_progress'     // 進行中
  | 'submitted'       // 已提報完成
  | 'confirmed'       // 管理確認完成
  | 'cancelled';      // 已取消

// 任務優先級
type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

// 任務分類
type TaskCategory = 
  | 'construction'    // 施工
  | 'inspection'      // 檢驗
  | 'procurement'     // 採購
  | 'documentation'   // 文件
  | 'other';          // 其他
```

---

## 🔄 SETC 工作流程整合

### 任務在 SETC 流程中的位置

根據 SETC.md 工作流程定義：

```
階段一：任務與施工階段
───────────────────────
任務建立（關聯合約/工項/金額）【手動】
    ↓
指派用戶 / 團隊【手動】
    ↓
施工執行
    ↓
提報完成【手動】
    ↓
管理確認完成【手動】（關鍵控制點）
    ↓
[自動觸發] → 建立施工日誌
```

### 事件整合設計

```typescript
// 任務事件類型
const TASK_EVENTS = {
  // 生命週期事件
  TASK_CREATED: 'task.created',
  TASK_UPDATED: 'task.updated',
  TASK_DELETED: 'task.deleted',
  
  // 指派事件
  TASK_ASSIGNED: 'task.assigned',
  TASK_REASSIGNED: 'task.reassigned',
  
  // 狀態變更事件
  TASK_STATUS_CHANGED: 'task.status_changed',
  TASK_STARTED: 'task.started',
  TASK_SUBMITTED: 'task.submitted',        // 提報完成
  TASK_CONFIRMED: 'task.confirmed',        // 管理確認完成 ⭐
  TASK_CANCELLED: 'task.cancelled',
  
  // 進度事件
  TASK_PROGRESS_UPDATED: 'task.progress_updated',
  
  // 排程事件
  TASK_DUE_DATE_APPROACHING: 'task.due_date_approaching',
  TASK_OVERDUE: 'task.overdue'
};

// 關鍵事件：管理確認完成 → 觸發施工日誌建立
eventBus.on('task.confirmed', async (data: TaskConfirmedEvent) => {
  // 自動建立施工日誌
  await logModule.autoCreateFromTask(data);
});
```

---

## 📊 擴展任務分解

### SETC-046 ~ SETC-053 任務清單

| SETC ID | 任務名稱 | 工時 | 依賴 |
|---------|---------|------|------|
| SETC-046 | Task Module Enhancement Planning | 1 天 | - |
| SETC-047 | Task Repository Enhancement | 2 天 | SETC-046 |
| SETC-048 | Task Assignment Service | 2 天 | SETC-047 |
| SETC-049 | Task State Machine Service | 2 天 | SETC-047 |
| SETC-050 | Task Progress Tracking Service | 2 天 | SETC-048 |
| SETC-051 | Task Schedule Management Service | 2 天 | SETC-049 |
| SETC-052 | Task Event Integration | 2 天 | SETC-050, SETC-051 |
| SETC-053 | Task UI Components & Testing | 3 天 | SETC-052 |

**總計**: 8 個任務，16 天

---

## ✅ 交付物

### 文件交付
- [ ] Task Module 擴展架構設計文檔
- [ ] 資料模型定義文檔
- [ ] API 契約定義
- [ ] 事件整合規格書
- [ ] 實作計畫與時程表

### 技術交付
- [ ] 更新 `tasks/README.md`
- [ ] 更新模組元資料
- [ ] Firestore Collection 設計
- [ ] Security Rules 草案

---

## 🎯 驗收標準

1. ✅ 完成現有實作狀態分析報告
2. ✅ 制定完整的擴展架構設計
3. ✅ 定義所有資料模型與介面
4. ✅ 規劃事件整合方案
5. ✅ 建立 SETC-047 ~ SETC-053 任務文檔
6. ✅ 更新 SETC 主索引與追蹤文件

---

## 📚 參考文檔

- [SETC.md](./SETC.md) - 工作流程定義
- [Task Module README](../../src/app/core/blueprint/modules/implementations/tasks/README.md)
- [SETC-020: Task → Log Automation](./SETC-020-task-to-log-automation.md)
- [Angular 20 Signals 文檔](https://angular.dev)

---

**文件版本**: 1.0.0  
**建立日期**: 2025-12-15  
**最後更新**: 2025-12-15  
**作者**: GigHub Development Team
