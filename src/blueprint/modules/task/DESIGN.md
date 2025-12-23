## Task 模組設計

### 核心目標
- 支援多視圖：Tree、Tree List、Gantt、Calendar、Timeline。
- 保持單一職責：Task 模組僅管理任務/WBS，跨模組流程交由 workflow。
- 事件驅動：發布 `task.<fact>` 事件，Payload 只含識別資訊。

### 目錄結構與檔案用途
```
modules/task/
├─ models/                # 任務核心模型、WBS 欄位
├─ states/                # 任務狀態 enum + 轉移表
├─ services/              # 業務行為、狀態轉移、事件發布
├─ repositories/          # 介面 + 實作（隔離 Firestore/API）
├─ events/                # task.<fact> 事件定義
├─ policies/              # 建立/編輯/刪除/排序/分享前置檢查
├─ facade/                # 唯一入口 (CRUD、排序、視圖查詢)
├─ config/                # 模組設定
├─ module.metadata.ts     # 模組描述（事件、能力）
├─ task.module.ts         # DI 註冊
├─ DESIGN.md              # 設計文件（本檔）
└─ README.md              # 模組說明
```

### 視圖需求

#### 1️⃣ 結構與層級視圖 (Structure & Hierarchy)
- **Tree View**：ng-zorro-antd/tree-view；用於 WBS/父子關係，可展開/摺疊、拖拽重組。
- **Tree List / Hierarchical Table**：nz-table + 階層展開；可排序/篩選/批次操作，適合任務列表、匯出。

#### 2️⃣ 排程與時間視圖 (Scheduling & Timeline)
- **Gantt**：@delon/chart 或第三方 Gantt；時間軸、依賴線、拖拽調整、進度條；用於時程規劃與關鍵路徑。
- **Calendar**：nz-calendar；顯示每日/週/月分佈、截止提醒、工作負載。

#### 3️⃣ 流程與順序視圖 (Process & Sequence)
- **Timeline**：nz-timeline；事件順序、里程碑與歷史追蹤。

### 視圖切換與狀態
- 視圖切換器：在 Facade/Service 暴露視圖查詢接口，前端切換時帶 Workspace/Blueprint Context。
- 視圖狀態管理：Task Store 保存當前視圖類型、展開節點、排序/篩選設定；切換時快取/復原。

### 資料模型
- **Task Core**：`id`, `blueprintId`, `workspaceId`, `parentId`, `title`, `status`, `assigneeId`, `assigneeType`, `startAt`, `endAt`, `progress`, `priority`, `dependencies`, `wbsPath`.
- **WBS 欄位**：`wbsCode`, `sequence`, `depth`, `path`；支援 Tree/Tree List/Gantt。
- **視圖投影**：根據視圖需求提供只讀 DTO（TreeNode DTO、Gantt DTO、Calendar DTO）。

### 狀態管理
- `states/task.states.ts`：列出狀態（pending/in-progress/done/blocked/archived）與轉移規則。
- Task Store（signals 或 NgRx）存放任務集合、視圖設定、載入/錯誤狀態。

### 事件與政策
- 事件命名：`task.created`, `task.updated`, `task.deleted`, `task.resequenced`, `task.progressed`, `task.scheduled`.
- Policies：建立/更新/刪除/排序需檢查角色、擁有者、Workspace/Blueprint Context、依賴合法性、日期合理性。

### 介面與交互
- Facade 暴露：`create/update/delete`, `move/resequence`, `setProgress`, `setSchedule`, `getTree`, `getTreeList`, `getGantt`, `getCalendar`, `getTimeline`.
- Repository：提供讀寫接口並隔離 Firestore/API。

### 一致性與缺口檢查
- 建立者限定遵循 Blueprint/SaaS 規範：僅個人或組織核心成員可建立任務所屬的 Blueprint。
- 互動分層：UI → Facade → Service → Repository；不得跨模組直呼 Repository/Service。
- Context：所有操作必須帶 Workspace/Blueprint Context。
- 防護：高風險操作（刪除/批次移動/分享）需 Policy + Audit；事件 Payload 僅識別資訊。
