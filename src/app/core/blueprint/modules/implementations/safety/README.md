# Safety Domain (安全域)

> **Domain ID**: `safety`  
> **Version**: 1.0.0  
> **Status**: Ready for Implementation  
> **Architecture**: Blueprint Container Module  
> **Priority**: P4 (可選)

## 📋 Overview

安全域負責工地安全管理，提供安全巡檢、風險評估、事故通報及安全教育訓練等功能。本模組遵循 Blueprint Container 架構設計，實現零耦合、可擴展的模組化設計。

### 業務範圍

工地安全管理，包括：
- 安全巡檢與安全檢查
- 風險評估與危害辨識
- 事故通報與事故調查
- 安全教育訓練記錄

### 核心特性

- ✅ **安全巡檢**: 定期安全檢查與記錄
- ✅ **風險管理**: 風險評估與控制措施
- ✅ **事故管理**: 事故通報與調查流程
- ✅ **教育訓練**: 安全教育訓練記錄管理
- ✅ **零耦合設計**: 透過 Event Bus 與其他模組通訊
- ✅ **完整生命週期管理**: 實作 IBlueprintModule 介面

## 🏗️ Architecture

### Domain 結構

```
safety/
├── safety.module.ts                  # Domain 主模塊 (實作 IBlueprintModule)
├── module.metadata.ts                # Domain 元資料
├── safety.repository.ts              # 共用資料存取層
├── safety.routes.ts                  # Domain 路由配置
├── services/                         # Sub-Module Services
│   ├── safety-inspection.service.ts  # Sub-Module: Safety Inspection
│   ├── risk-assessment.service.ts    # Sub-Module: Risk Assessment
│   ├── incident-report.service.ts    # Sub-Module: Incident Report
│   └── training.service.ts           # Sub-Module: Safety Training
├── models/                           # Domain 模型
│   ├── safety-inspection.model.ts
│   ├── risk-assessment.model.ts
│   ├── incident.model.ts
│   └── training.model.ts
├── views/                            # Domain UI 元件
│   ├── inspection/
│   ├── incident/
│   └── training/
├── config/
│   └── safety.config.ts              # 模組配置
├── exports/
│   └── safety-api.exports.ts         # 公開 API
├── index.ts                          # 統一匯出
└── README.md                         # 本文件
```

## 📦 Sub-Modules (子模塊)

### 1️⃣ Safety Inspection Sub-Module (安全巡檢)

定期安全檢查與記錄功能。

### 2️⃣ Risk Assessment Sub-Module (風險評估)

風險評估與危害辨識功能。

### 3️⃣ Incident Report Sub-Module (事故通報)

事故通報與事故調查功能。

### 4️⃣ Safety Training Sub-Module (安全教育訓練)

安全教育訓練記錄功能。

## 📚 References

- [Blueprint Container 架構](../../README.md)
- [Event Bus 整合指南](../../../../../docs/blueprint-event-bus-integration.md)
- [next.md - Domain 架構說明](../../../../../../next.md)

## 📄 License

MIT License - 請參考專案根目錄的 LICENSE 檔案

---

**Maintained by**: GigHub Development Team  
**Last Updated**: 2025-12-13  
**Domain Priority**: P4 (可選)  
**Contact**: 請透過專案 GitHub Issues 回報問題
