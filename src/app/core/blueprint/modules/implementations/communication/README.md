# Communication / Message Domain (訊息域)

> **Domain ID**: `communication`  
> **Version**: 1.0.0  
> **Status**: Ready for Implementation  
> **Architecture**: Blueprint Container Module  
> **Priority**: P4 (可選)

## 📋 Overview

訊息域負責系統通訊與通知，提供系統通知、群組訊息、任務提醒及推播通知等功能。本模組遵循 Blueprint Container 架構設計，實現零耦合、可擴展的模組化設計。

### 業務範圍

系統通訊與通知，包括：
- 系統通知與通知管理
- 群組訊息與即時通訊
- 任務提醒與排程通知
- 推播通知與多通道通知

### 核心特性

- ✅ **多通道通知**: 支援 Email、SMS、Push、站內信
- ✅ **即時通訊**: 群組訊息與即時對話
- ✅ **智能提醒**: 任務提醒與排程通知
- ✅ **通知管理**: 通知偏好設定與歷史記錄
- ✅ **零耦合設計**: 透過 Event Bus 與其他模組通訊
- ✅ **完整生命週期管理**: 實作 IBlueprintModule 介面

## 🏗️ Architecture

### Domain 結構

```
communication/
├── communication.module.ts           # Domain 主模塊 (實作 IBlueprintModule)
├── module.metadata.ts                # Domain 元資料
├── communication.repository.ts       # 共用資料存取層
├── communication.routes.ts           # Domain 路由配置
├── services/                         # Sub-Module Services
│   ├── notification.service.ts       # Sub-Module: System Notification
│   ├── message.service.ts            # Sub-Module: Group Message
│   ├── reminder.service.ts           # Sub-Module: Task Reminder
│   └── push.service.ts               # Sub-Module: Push Notification
├── models/                           # Domain 模型
│   ├── notification.model.ts
│   ├── message.model.ts
│   ├── reminder.model.ts
│   └── push.model.ts
├── views/                            # Domain UI 元件
│   ├── notification/
│   └── message/
├── config/
│   └── communication.config.ts       # 模組配置
├── exports/
│   └── communication-api.exports.ts  # 公開 API
├── index.ts                          # 統一匯出
└── README.md                         # 本文件
```

## 📦 Sub-Modules (子模塊)

### 1️⃣ System Notification Sub-Module (系統通知)

系統通知與通知管理功能。

### 2️⃣ Group Message Sub-Module (群組訊息)

群組訊息與即時通訊功能。

### 3️⃣ Task Reminder Sub-Module (任務提醒)

任務提醒與排程通知功能。

### 4️⃣ Push Notification Sub-Module (推播通知)

推播通知與多通道通知功能。

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
