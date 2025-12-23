# SHARED_LAYER

## 1. 目的
- 系統多模組共用資源
- 提升復用性與一致性

> 實際路徑：`/src/app/shared`

注意：本文件的目錄與結構部分已統一採用 [docs/reference/Skeleton.md](docs/reference/Skeleton.md) 作為權威來源，請以該文件為主要參照。

## 2. 範疇
- 公用 UI 組件 (Components)
- 公用服務 (Services) — 僅封裝無業務語意的共用邏輯
- 公用型別 / Value Objects (Types / VO)
- 工具函數 (Utils / Helpers)
- 常量 / 配置 (Constants / Configs)

## 3. 原則
- 通用性：不包含業務邏輯
- 單向依賴：不依賴 Module 或 Blueprint
- 封裝性：對外暴露最小接口
- 版本控制：修改需考慮全系統影響

## 4. 目錄建議（對應現況）
目錄與檔案結構請參考權威來源：[docs/reference/Skeleton.md](docs/reference/Skeleton.md)。
