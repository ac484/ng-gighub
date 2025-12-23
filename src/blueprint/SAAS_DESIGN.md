## SaaS 設計總覽

本文件描述 SaaS 版 GigHub 的核心概念、資料夾架構與藍圖建立流程，對應 Angular 20 + Firebase 的 Modular DDD 實作。內部服務僅透過 facade / service 暴露功能，嚴禁直接操作資料庫。

## 1️⃣ 核心概念

- **用戶（User）**：登入主體，可為個人或組織成員。
- **個人帳號（Personal Account）**：個人擁有的帳號，可建立與管理 Blueprint。
- **組織帳號（Organization Account）**：代表公司/團隊的帳號，承載核心成員與夥伴。
- **核心成員（Team）**：組織內部成員，享有完整協作權限。
- **外部協作夥伴（Partner）**：受限權限的外部角色，僅能在授權範圍內操作。
- **藍圖（Blueprint）**：
  - 只能由個人或組織建立。
  - 可共享至工作區（Workspace）。
  - 支援多視圖（Gantt、Tree、Kanban 等）。
- **工作區（Workspace）**：
  - 可切換不同 Blueprint / 專案的上下文。
  - 所有操作需攜帶 Workspace Context。
- **權限控制**：
  - 基於角色與組織的權限矩陣。
  - 服務只透過 Facade / Service 釋出，禁止直連資料庫。

## 2️⃣ SaaS 資料夾架構（Angular + Firebase / Modular DDD）

```
/src
├─ app/
│  ├─ core/                         # 核心服務 & 模組（跨模組可用）
│  │  ├─ auth/                      # Firebase Auth：匿名 / Email / Google
│  │  ├─ guards/                    # AuthGuard, PermissionGuard
│  │  ├─ interceptors/              # HTTP 攔截器
│  │  └─ models/                    # 核心 Value Objects / Entity
│  │
│  ├─ layout/                       # 全局 layout、navbar、sidebar、workspace 切換器
│  │
│  ├─ modules/
│  │  ├─ blueprint/                 # Blueprint 模組
│  │  │  ├─ models/                 # blueprint.model.ts / workspace.model.ts / index.ts
│  │  │  ├─ states/                 # 狀態管理（NgRx 或輕量 Service）
│  │  │  ├─ services/               # Domain Services
│  │  │  ├─ repositories/           # Firebase / API 存取層
│  │  │  ├─ facade/                 # 對外操作入口（唯一）
│  │  │  ├─ pages/                  # 視圖層（list/detail/workspace-switcher）
│  │  │  └─ routes/                 # Routing for blueprint
│  │  │
│  │  ├─ organization/              # 組織與成員管理（models/services/repositories/pages）
│  │  └─ user/                      # 個人帳號管理（models/services/repositories/pages）
│  │
│  ├─ shared/                       # 公用組件、指令、Pipe、utils
│  └─ app.module.ts
│
├─ environments/
│  ├─ environment.ts
│  ├─ environment.prod.ts
│  └─ environment.staging.ts
│
└─ assets/
```

> Blueprint 模組遵循 `MODULE_LAYER.md` 的骨架，所有跨模組協作仍走 Blueprint Layer 的 Event/Facade/Policy 原則。

## 3️⃣ Blueprint 建立邏輯（類 GitHub Repo）

1. 登入後判斷當前帳號類型（User / Organization）。若為組織成員，需檢查權限是否允許建立 Blueprint。
2. 流程：
   - `BlueprintFacade.createBlueprint(data)`
   - → `BlueprintService`：檢查建立者類型與權限。
   - → Repository 寫入 Firestore。
   - → 回傳 Blueprint ID / 狀態。
3. 工作區切換器：
   - 綁定當前用戶可訪問的 Blueprint / Workspace。
   - 切換時更新 `ContextService`，所有操作帶上 Workspace Context。

## 4️⃣ 權限與安全設計

### 4.1 角色/帳號矩陣（最低必要）

> **建立藍圖僅限「個人帳號」與「組織核心成員」**（符合 Blueprint/Module 鐵律：Blueprint 只能由個人或組織建立，不接受 Partner/普通用戶建立）。

| 帳號類型       | 建立藍圖 | 查看藍圖 | 編輯藍圖 | 刪除藍圖 | 分享/權限管理 | 停用/封存 |
|----------------|----------|----------|----------|----------|---------------|-----------|
| 個人帳號       | ✅       | ✅       | ✅       | ✅       | ✅             | ✅        |
| 組織核心成員   | ✅       | ✅       | ✅       | ✅       | ✅             | ✅        |
| 組織夥伴       | ❌       | ✅       | ❌       | ❌       | ❌             | ❌        |
| 普通用戶       | ❌       | ❌       | ❌       | ❌       | ❌             | ❌        |

> 建議在 Guard / Policy / Facade 共同檢查，禁止 UI 硬編碼權限。

### 4.2 反濫用與破壞防護

- **雙層檢查**：前端 Guard + 後端（Functions 或 Security Rules）檢查建立/刪除/分享操作。
- **擁有者保護**：刪除/封存 Blueprint 需擁有者或組織管理員，並採兩步確認。
- **審批流程**：高風險操作（刪除、批量分享、權限變更）可加審批/多簽。
- **審計強制**：所有高風險操作寫入 Audit，帶 Correlation ID。
- **速率限制**：對建立/刪除/分享等敏感操作做節流或配合 Functions rate limit。
- **最小存取**：Partner 僅獲得被分享的 Workspace/Blueprint 的讀取或特定操作權限。
- **Context 綁定**：所有指令攜帶 Workspace/Blueprint Context，後端核對當前授權範圍。

## 5️⃣ 技術棧建議

- 前端：Angular 20、ng-zorro-antd、@angular/fire、RxJS、NgRx（或 Signals + Store）。
- 認證：Firebase Auth（Email / Google / Anonymous）。
- 資料：Firestore（存 Blueprint / Workspace / Permission Matrix）。
- 後端：Firebase Functions（必要時補後端邏輯），Firebase Hosting / CDN。
- AI / 自動化（可選）：Google Vertex AI / @google/genai。

## 6️⃣ 一致性/缺口快速檢查

- 建立者限定：僅個人帳號與組織核心成員可建立 Blueprint（與 BLUEPRINT/MODULE Layer 規則一致）。
- 介面分層：UI → Facade → Service → Repository；禁止跨模組直呼 Repository/Service。
- 事件/流程：事件命名 `<module>.<fact>`；Workflow 只協調不改寫 Domain；所有操作帶 Workspace Context。
- 權限/防護：高風險操作雙層檢查 + Audit；Partner 最小權限；分享/刪除/封存需管理員或擁有者。
- 稽核/追蹤：所有手動高風險節點紀錄 Audit，對齊 Correlation ID。
