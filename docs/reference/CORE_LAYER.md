# CORE_LAYER

## 1. 目的
- 定義核心領域模型
- 核心業務邏輯，Domain-Driven Design 核心層

## 2. 範疇
- 核心實體 (Entities)
- 值物件 (Value Objects)
- 聚合根 (Aggregates)
- 核心 Domain Services
- Domain Events
- 核心規則 / Policies

## 3. 原則
- 業務優先：不處理 UI 或基礎設施
- 不可變性：Value Object 不可修改
- 封裝聚合：聚合根管理內部狀態
- 可測試性：所有核心邏輯可單元測試

## 4. 目錄建議
```

src/app/core/
├─ entities/
├─ value-objects/
├─ aggregates/
├─ services/
├─ events/
├─ rules/

```
