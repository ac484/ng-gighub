# GigHub 藍圖遷移分析總結 (繁體中文)

> **快速參考**: 哪些功能應該遷移到藍圖「模組」？

## 📊 一分鐘總結

### 核心結論

**重點**: 專注於**實作缺失的業務域**，而非遷移現有路由功能。

```
✅ 應該做: 實作 5 個缺失的關鍵域 (Log, Workflow, QA, Acceptance, Finance)
❌ 不應做: 將 User/Org/Team 路由遷移到藍圖模組
```

---

## 🎯 快速決策表

| 功能類型 | 是否遷移？ | 原因 |
|---------|-----------|------|
| **業務能力** (如 Task, QA, Finance) | ✅ 是 | 藍圖範圍內的核心域邏輯 |
| **基礎實體** (如 User, Org, Team) | ❌ 否 | 存在於藍圖情境之外 |
| **基礎設施服務** (如 Auth, Monitoring) | ❌ 否 | 系統級別，非藍圖特定 |
| **探索/搜尋** (如 Explore) | ❌ 否 | 跨藍圖搜尋 |
| **藍圖 CRUD** | ❌ 否（路由） | 管理藍圖本身 |

---

## ✅ 應該實作的藍圖域模組

### 必要域 (6個關鍵域)

#### 1️⃣ Log Domain（日誌域）🔴 最優先
**為什麼**: 所有域都需要稽核軌跡

**子模塊**:
- Activity Log（操作紀錄）
- Comment（評論）
- Attachment（附件）
- Change History（變更歷史）

**特殊遷移**: 將 `routes/blueprint/construction-log/` 遷移至此域

---

#### 2️⃣ Workflow Domain（流程域）🔴 關鍵
**為什麼**: Task、QA、Acceptance 域都需要狀態機

**子模塊**:
- State Machine Configuration（狀態機配置）
- Automation Rules（自動化規則）
- Workflow Engine（流程引擎）
- Workflow Template（流程模板）

---

#### 3️⃣ QA Domain（品質控管域）🔴 關鍵
**為什麼**: 工地品質管理核心業務需求

**子模塊**:
- Checklist（檢查表）
- Defect Management（缺失管理）
- Inspection（現場巡檢）
- QA Report（品質報告）

---

#### 4️⃣ Acceptance Domain（驗收域）🔴 關鍵
**為什麼**: 正式驗收流程必需

**子模塊**:
- Acceptance Request（驗收申請）
- Acceptance Review（驗收審核）
- Preliminary Acceptance（初驗）
- Re-inspection（複驗）

---

#### 5️⃣ Finance Domain（財務域）🔴 關鍵
**為什麼**: 成本追蹤與財務管理

**子模塊** (6個):
- Cost Management（成本管理）
- Invoice（請款）
- Payment（付款）
- Budget（預算）
- Ledger（帳務）
- Financial Report（財務報表）

---

#### 6️⃣ Material Domain（材料域）🟡 推薦
**為什麼**: 材料追蹤對工地重要

**子模塊**:
- Material Management（材料管理）
- Inventory（出入庫）
- Material Issue（材料領用）
- Equipment/Asset（器具資產）

---

## ❌ 不應遷移的應用層路由

### 為什麼這些應保持為路由？

#### 1. User Management (`routes/user/`)
- ❌ **不遷移**
- **原因**: 使用者檔案是**全域的**，跨所有藍圖
- **層級**: Foundation Layer（基礎層）

#### 2. Organization Management (`routes/organization/`)
- ❌ **不遷移**
- **原因**: 組織**擁有**藍圖，不被藍圖包含
- **層級**: Foundation Layer（基礎層）

#### 3. Team Management (`routes/team/`)
- ❌ **不遷移**
- **原因**: 團隊可訪問**多個**藍圖
- **層級**: Foundation Layer（基礎層）

#### 4. Explore Search (`routes/explore/`)
- ❌ **不遷移**
- **原因**: **跨**使用者、組織、藍圖的全域搜尋
- **層級**: Application Layer（應用層）

#### 5. Monitoring Dashboard (`routes/monitoring/`)
- ❌ **不遷移**
- **原因**: 監控**整個應用**效能與錯誤
- **層級**: Infrastructure Layer（基礎設施層）

#### 6. Authentication (`routes/passport/`)
- ❌ **不遷移**
- **原因**: 認證發生在選擇藍圖**之前**
- **層級**: Foundation Layer（基礎層）

#### 7. Blueprint CRUD (`routes/blueprint/`)
- ❌ **不遷移**（但位置正確）
- **原因**: 這些管理藍圖**本身**，不是藍圖內的業務邏輯
- **層級**: Container Layer（容器層）

#### 8. Exception Pages (`routes/exception/`)
- ❌ **不遷移**
- **原因**: 錯誤頁面是應用層級的
- **層級**: Application Layer（應用層）

---

## 🟡 特殊情況

### Construction Log - 需要遷移

**當前位置**: `routes/blueprint/construction-log/`

**問題**: 目前在路由中但它是藍圖範圍的

**建議**: ✅ 遷移到 Log Domain 模組

**遷移步驟**:
1. 建立 Log Domain 模組結構
2. 將日誌元件(工地)移至 Log Domain
3. 擴展以支援其他日誌類型（Activity, Comments, Attachments）
4. 更新路由以參照 Log Domain

---

### Audit Logs - 需要整合

**當前位置**: `core/blueprint/modules/implementations/audit-logs/`

**問題**: 獨立模組

**建議**: ✅ 整合到 Log Domain

**原因**: 統一所有日誌功能

---

## 📋 實作時程

### Phase 1: 關鍵域 (16 週)

| 週次 | 域 | 交付 |
|-----|---|------|
| 1 | **準備** | 資料夾結構重構 |
| 2-3 | **Log Domain** | Activity logs, Comments, Attachments |
| 4-5 | **Workflow Domain** | State machine, Automation, Engine |
| 6-7 | **QA Domain** | Checklists, Defects, Inspections |
| 8-9 | **Acceptance Domain** | Requests, Reviews, Inspections |
| 10-13 | **Finance Domain** | Cost, Invoice, Payment, Budget |
| 14-16 | **整合測試** | E2E 測試，效能測試 |

### Phase 2: 推薦域 (4-6 週)

| 週次 | 域 | 交付 |
|-----|---|------|
| 17-20 | **Material Domain** | Material mgmt, Inventory, Assets |
| 21-22 | **測試與優化** | 整合測試，UI 優化 |

---

## 🏗️ 架構層級說明

### 三層架構

```
┌─────────────────────────────────────────────┐
│  Application Layer（應用層）                 │
│  - User/Org/Team Routes                     │
│  - Explore Search                           │
│  - Blueprint CRUD                           │
│  - Exception Pages                          │
├─────────────────────────────────────────────┤
│  Container Layer（容器層）                   │
│  - Blueprint Container                      │
│  - Module Registry                          │
│  - Platform: Context, Event Bus, Container  │
├─────────────────────────────────────────────┤
│  Business Domain Layer（業務域層）           │
│  - Task Domain ✅                            │
│  - Log Domain 🔴                             │
│  - Workflow Domain 🔴                        │
│  - QA Domain 🔴                              │
│  - Acceptance Domain 🔴                      │
│  - Finance Domain 🔴                         │
│  - Material Domain 🟡                        │
└─────────────────────────────────────────────┘
```

---

## 🤔 如何判斷是否應該是藍圖模組？

### 決策樹

```
功能分析
  ↓
是否藍圖範圍？
  ├─ 否 → ❌ 保持為應用路由
  ↓
  是 ↓
  ↓
是否代表業務能力？
  ├─ 否 → 是否跨藍圖？
  │         ├─ 是 → ❌ 保持為應用路由
  │         └─ 否 → 🟡 考慮功能開關
  ↓
  是 ↓
  ↓
需要跨域通訊？
  ├─ 是 → ✅ 建立藍圖域模組
  └─ 否 → 同一藍圖內可能有多個實例？
            ├─ 是 → ✅ 建立藍圖域模組
            └─ 否 → 🟡 考慮功能開關
```

### 簡易檢查表

功能**是**藍圖模組如果:
- ✅ 在單一藍圖情境內操作
- ✅ 代表離散的業務能力
- ✅ 可以按藍圖啟用/停用
- ✅ 可能與其他域透過事件通訊
- ✅ 資料範圍限於一個藍圖

功能**不是**藍圖模組如果:
- ❌ 跨多個藍圖操作
- ❌ 存在於基礎層（User, Org, Team）
- ❌ 提供基礎設施服務
- ❌ 管理藍圖本身
- ❌ 全域搜尋或探索功能

---

## 📁 建議的資料夾結構

### 域模組結構

```
src/app/core/blueprint/modules/implementations/
├── tasks/                    ✅ 已實作（參考）
│   ├── tasks.module.ts
│   ├── tasks.service.ts
│   ├── tasks.repository.ts
│   ├── tasks.component.ts
│   ├── views/
│   └── models/
│
├── log/                      🔴 待實作
│   ├── log.module.ts
│   ├── services/
│   │   ├── activity-log.service.ts
│   │   ├── comment.service.ts
│   │   ├── attachment.service.ts
│   │   └── change-history.service.ts
│   ├── components/
│   │   ├── construction-log.component.ts  ← 從路由遷移
│   │   ├── activity-log.component.ts
│   │   └── comment-thread.component.ts
│   └── models/
│
├── workflow/                 🔴 待實作
├── qa/                       🔴 待實作
├── acceptance/               🔴 待實作
├── finance/                  🔴 待實作
└── material/                 🟡 待實作
```

### 應用路由（無變更）

```
src/app/routes/
├── user/                     ✅ 保持 - 全域使用者管理
├── organization/             ✅ 保持 - 基礎層
├── team/                     ✅ 保持 - 基礎層
├── blueprint/                ✅ 保持 - 藍圖 CRUD
├── explore/                  ✅ 保持 - 全域搜尋
├── monitoring/               ✅ 保持 - 系統監控
├── passport/                 ✅ 保持 - 認證
└── exception/                ✅ 保持 - 錯誤頁面
```

---

## 📊 現狀評估

### 完成度

```
平台層:  ████████████████████ 100% (3/3)
業務域:  ███░░░░░░░░░░░░░░░░░  17% (1/6)
────────────────────────────────────────
總體:    ██████░░░░░░░░░░░░░░  33% (4/9)
```

### 預期完成度（Phase 2 後）

```
平台層:  ████████████████████ 100% (3/3)
業務域:  ████████████████████ 100% (6/6)
────────────────────────────────────────
總體:    ███████████████████░  90% (9/10)
```

---

## ⚠️ 重要提醒

### 什麼不要做

1. ❌ **不要**將 User/Organization/Team 路由遷移到藍圖模組
   - 它們是基礎層實體，不是業務域

2. ❌ **不要**將 Explore Search 變成藍圖模組
   - 這是跨藍圖的全域搜尋功能

3. ❌ **不要**將 Monitoring 變成藍圖模組
   - 這是系統級可觀測性，不是藍圖特定的

4. ❌ **不要**將 Blueprint CRUD 變成域模組
   - 它管理藍圖本身，不是藍圖內的業務邏輯

### 應該做什麼

1. ✅ **實作** Log Domain（最優先 - 所有其他域的基礎）
2. ✅ **實作** Workflow Domain（第二優先 - 狀態機引擎）
3. ✅ **實作** QA, Acceptance, Finance 域（核心業務需求）
4. ✅ **遷移** Construction Log 到 Log Domain
5. ✅ **遵循** Task Domain 作為參考實作模式

---

## 🎯 成功標準

### 架構合規性
- [ ] 資料夾結構符合建議設計
- [ ] 所有 6 個關鍵域已實作
- [ ] Event Bus 用於跨域通訊
- [ ] 所有域表都有適當的 RLS 政策

### 業務能力
- [ ] 完整任務管理工作流程
- [ ] 完整稽核軌跡（透過 Log Domain）
- [ ] 可配置的工作流程
- [ ] 品質檢驗流程
- [ ] 正式驗收流程
- [ ] 財務追蹤與報告

### 程式碼品質
- [ ] 80%+ 測試覆蓋率
- [ ] 一致的域結構
- [ ] 完整 API 文件
- [ ] 符合效能基準

---

## 📚 相關文件

### 主要文件
- **詳細分析**: `GigHub_Blueprint_Migration_Architecture.md` - 完整架構分析（631行）
- **本文件**: `Blueprint_Migration_Summary_ZH-TW.md` - 快速參考總結

### 專案文件
- `next.md` - 藍圖架構原始定義
- `BLUEPRINT_ANALYSIS_README.md` - 藍圖分析總覽

---

## 💡 快速問答

### Q: 為什麼只實作了 1 個業務域？
A: 專案初期聚焦於平台基礎設施建設，Task Domain 作為概念驗證。現在平台層已穩定，應該開始實作其他業務域。

### Q: 必須按照建議的順序實作嗎？
A: **強烈建議**按順序，因為有依賴關係：
- Log Domain 是所有域的基礎
- Workflow Domain 被多個域使用
- 其他域相互依賴（QA → Acceptance → Finance）

### Q: 可以跳過某些域嗎？
A: **不建議**。6 個必要域都是核心業務能力：
- 缺少 Log = 無稽核軌跡
- 缺少 Workflow = 無自動化
- 缺少 QA = 無品質控制
- 缺少 Acceptance = 無正式驗收
- 缺少 Finance = 無財務管理

### Q: 為什麼 User/Org/Team 不應該是藍圖模組？
A: 它們存在於藍圖之外：
- **User**: 一個使用者可以訪問多個藍圖
- **Organization**: 組織擁有藍圖，不被藍圖包含
- **Team**: 團隊可以訪問組織的多個藍圖

這些是**基礎層**實體，而藍圖模組是**業務域層**。

---

**文件版本**: 1.0.0  
**最後更新**: 2025-12-13  
**作者**: Senior Cloud Architect (Copilot)  
**狀態**: ✅ 準備審查
