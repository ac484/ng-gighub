# CORE_LAYER

## 1. 目的
- 定義核心領域模型
- 核心業務邏輯，Domain-Driven Design 核心層

> 實際路徑：`/src/app/core`（含 blueprint layer、data-access、domain、services、facades 等）

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
```
/src/app/core/
├─ domain/           # 聚合、VO、Domain events
├─ blueprint/        # 跨模組流程/事件/模組實作
├─ data-access/      # Firestore/API repositories
├─ services/         # 業務協調服務
├─ facades/          # 提供給 routes 的介面
├─ i18n/ | errors/ | net/ | infrastructure/  # 橫切支援
└─ index.ts
```
