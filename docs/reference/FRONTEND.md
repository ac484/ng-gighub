# FRONTEND

## 1. 目的
- 定義 UI / Presentation 層
- 負責頁面呈現、用戶互動、路由

> 實際路徑：`/src/app/routes`（UI/Presentation），共用元件於 `/src/app/shared`

## 2. 範疇
- Standalone 組件 / 路由
- 頁面 / Route
- 表單、表格、Dialog 等 UI 元件
- 前端狀態管理（Signals / Service state；必要時 NgRx）
- Facade/Service（呼叫 core data-access / Cloud Functions）

## 3. 原則
- 單向數據流：UI 不直接操作 Domain 層
- 模組化：每個頁面 / 功能應有單一責任
- 重用共享組件：依賴 SHARED_LAYER
- 可測試：UI 與 Service 可單元測試

## 4. 目錄建議（對應現況）
```
/src/app/routes/
├─ <feature>/
│  ├─ pages/ | components/         # UI/Presentation 專用
│  ├─ state/  (optional Signals)
│  └─ services/ (僅 UI 協調，不含資料存取)
├─ layout/                         # Navbar/Sidebar/Workspace switcher
└─ routes.ts                       # 路由入口

/src/app/shared/                   # 共用 UI / utils（參見 SHARED_LAYER）
```
