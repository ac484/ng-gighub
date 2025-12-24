# CORE_LAYER

## 1. 目的
- 定義核心領域模型
- 核心業務邏輯，Domain-Driven Design 核心層

> 實際路徑：`/src/app/core`（含 blueprint layer、data-access、domain、services、facades 等）

注意：本文件的目錄與結構部分已統一採用 [docs/reference/Skeleton.md](docs/reference/Skeleton.md) 作為權威來源，請以該文件為主要參照。

## 2. 範疇
- 核心實體 / 值物件 / 聚合根（`/src/app/core/domain`）
- 核心 Domain Services / Policies / Events
- 跨模組流程與事件（`/src/app/core/blueprint`，詳見 BLUEPRINT_LAYER）
- Repository / Data Access 抽象層（`/src/app/core/data-access`）
- Facades / Services（對 routes 提供邊界）

## 3. 原則
- 業務優先：不處理 UI 或基礎設施
- 不可變性：Value Object 不可修改
- 封裝聚合：聚合根管理內部狀態
- 可測試性：所有核心邏輯可單元測試

## 4. 目錄建議（對應現況）
目錄與檔案結構請參考權威來源：[docs/reference/Skeleton.md](docs/reference/Skeleton.md)。
