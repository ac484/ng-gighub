# Material / Asset Domain (材料/資產域)

> **Domain ID**: `material`  
> **Version**: 1.0.0  
> **Status**: Ready for Implementation  
> **Architecture**: Blueprint Container Module  
> **Priority**: P3 (推薦)

## 📋 Overview

材料/資產域負責材料與資產管理，提供材料基本資料管理、材料領用、出入庫管理、設備資產追蹤及損耗記錄等功能。本模組遵循 Blueprint Container 架構設計，實現零耦合、可擴展的模組化設計。

### 業務範圍

材料與資產管理，包括：
- 材料基本資料與材料分類
- 材料領用申請與領料記錄
- 入庫管理、出庫管理與庫存追蹤
- 設備管理與資產追蹤
- 材料損耗記錄與損耗分析

### 核心特性

- ✅ **材料主檔管理**: 完整的材料基本資料管理
- ✅ **庫存管理**: 即時庫存追蹤與預警
- ✅ **領料管理**: 規範化的領料流程
- ✅ **資產追蹤**: 設備與資產生命週期管理
- ✅ **損耗分析**: 材料損耗統計與分析
- ✅ **零耦合設計**: 透過 Event Bus 與其他模組通訊
- ✅ **完整生命週期管理**: 實作 IBlueprintModule 介面

## 🏗️ Architecture

### Domain 結構

```
material/
├── material.module.ts                # Domain 主模塊 (實作 IBlueprintModule)
├── module.metadata.ts                # Domain 元資料
├── material.repository.ts            # 共用資料存取層
├── material.routes.ts                # Domain 路由配置
├── services/                         # Sub-Module Services
│   ├── material-management.service.ts # Sub-Module: Material Management
│   ├── material-issue.service.ts     # Sub-Module: Material Issue
│   ├── inventory.service.ts          # Sub-Module: Inventory
│   ├── asset.service.ts              # Sub-Module: Equipment/Asset
│   └── consumption.service.ts        # Sub-Module: Consumption Record
├── models/                           # Domain 模型
│   ├── material.model.ts
│   ├── material-issue.model.ts
│   ├── inventory.model.ts
│   ├── asset.model.ts
│   └── consumption.model.ts
├── views/                            # Domain UI 元件
│   ├── material/
│   ├── inventory/
│   └── asset/
├── config/
│   └── material.config.ts            # 模組配置
├── exports/
│   └── material-api.exports.ts       # 公開 API
├── index.ts                          # 統一匯出
└── README.md                         # 本文件
```

## 📦 Sub-Modules (子模塊)

### 1️⃣ Material Management Sub-Module (材料管理)

材料基本資料與材料分類管理功能。

### 2️⃣ Material Issue Sub-Module (材料領用)

領料申請與領料記錄功能。

### 3️⃣ Inventory Sub-Module (出入庫)

入庫管理、出庫管理與庫存追蹤功能。

### 4️⃣ Equipment/Asset Sub-Module (器具資產)

設備管理與資產追蹤功能。

### 5️⃣ Consumption Record Sub-Module (損耗記錄)

材料損耗記錄與損耗分析功能。

## 📚 References

- [Blueprint Container 架構](../../README.md)
- [Event Bus 整合指南](../../../../../docs/blueprint-event-bus-integration.md)
- [next.md - Domain 架構說明](../../../../../../next.md)

## 📄 License

MIT License - 請參考專案根目錄的 LICENSE 檔案

---

**Maintained by**: GigHub Development Team  
**Last Updated**: 2025-12-13  
**Domain Priority**: P3 (推薦)  
**Contact**: 請透過專案 GitHub Issues 回報問題
