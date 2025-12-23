# BACKEND

## 1. 目的
- 定義應用服務層與基礎設施
- 負責資料存取、業務邏輯執行、整合第三方

注意：本文件的目錄與結構部分已統一採用 [docs/reference/Skeleton.md](docs/reference/Skeleton.md) 作為權威來源，請以該文件為主要參照。

> 前端應用的「後端」分兩層：  
> 1) 前端內部的資料存取/服務層（`/src/app/core/data-access`, `/src/app/core/services`）  
> 2) Cloud Functions 等真正的伺服端程式（本倉庫的 `functions-*` 套件）

## 2. 範疇
- Application Services / Use Cases（前端協調層）
- Repository / Firestore / Database（`src/app/core/data-access/*`）
- 認證 / 權限 / 安全（guards/interceptors + Rules）
- 任務 / 排程 / Background Job（Cloud Functions）
- API / HTTP Endpoints（Functions callable / HTTPS）

## 3. 原則
- 模組化：服務應單一責任
- 層次分明：UI 不直接操作 DB
- 重用 SHARED_LAYER 工具與服務
- 可測試：Service / Repository 可單元測試

## 4. 目錄建議（對應現況）
前端（資料層與協調層）
```
/src/app/core/
├─ data-access/     # Firestore/HTTP repository 封裝
├─ services/        # 業務協調（不含 UI）
├─ facades/         # 提供給 routes 的邊界
└─ blueprint/       # 跨模組流程/事件（參見 BLUEPRINT_LAYER）
```

伺服端（Cloud Functions）
```
/functions-*/
├─ src/functions/   # callable / https endpoints（唯一入口）
├─ src/services/    # 具體邏輯、SDK adapter
├─ src/config/      # model pinning / quota / env
└─ src/utils/       # 共用工具（logging, redaction）
```
