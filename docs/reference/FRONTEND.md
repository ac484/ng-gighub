# FRONTEND

## 1. 目的
- 定義 UI / Presentation 層
- 負責頁面呈現、用戶互動、路由

## 2. 範疇
- Angular 組件 / 模組
- 頁面 / Route
- 表單、表格、Dialog 等 UI 元件
- 前端狀態管理 (NgRx / Signals / Service State)
- API Service（呼叫 BACKEND）

## 3. 原則
- 單向數據流：UI 不直接操作 Domain 層
- 模組化：每個頁面 / 功能應有單一責任
- 重用共享組件：依賴 SHARED_LAYER
- 可測試：UI 與 Service 可單元測試

## 4. 目錄建議
```

src/app/routes/
├─ pages/
├─ components/
├─ services/
├─ store/   # optional

```
