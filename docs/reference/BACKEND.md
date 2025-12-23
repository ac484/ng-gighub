# BACKEND

## 1. 目的
- 定義應用服務層與基礎設施
- 負責資料存取、業務邏輯執行、整合第三方

## 2. 範疇
- Application Services / Use Cases
- Repository / Firestore / Database
- 認證 / 權限 / 安全
- 任務 / 排程 / Background Job
- API / HTTP Endpoints

## 3. 原則
- 模組化：服務應單一責任
- 層次分明：UI 不直接操作 DB
- 重用 SHARED_LAYER 工具與服務
- 可測試：Service / Repository 可單元測試

## 4. 目錄建議
```

src/app/modules/
├─ <feature-module>/
│  ├─ services/
│  ├─ repositories/
│  ├─ events/
│  ├─ policies/
├─ core/      # optional：Domain 核心
├─ infra/     # optional：外部資源整合

```
