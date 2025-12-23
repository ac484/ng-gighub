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

## 4️⃣ 權限矩陣設計

| 帳號類型       | 建立藍圖 | 查看藍圖 | 編輯藍圖 | 刪除藍圖 |
|----------------|----------|----------|----------|----------|
| 個人帳號       | ✅       | ✅       | ✅       | ✅       |
| 組織核心成員   | ✅       | ✅       | ✅       | ✅       |
| 組織夥伴       | ❌       | ✅       | ❌       | ❌       |
| 普通用戶       | ❌       | ❌       | ❌       | ❌       |

> 建議在 Guard / Policy 中檢查矩陣，禁止 UI 硬編碼權限。

## 5️⃣ 技術棧建議

- 前端：Angular 20、ng-zorro-antd、@angular/fire、RxJS、NgRx（或 Signals + Store）。
- 認證：Firebase Auth（Email / Google / Anonymous）。
- 資料：Firestore（存 Blueprint / Workspace / Permission Matrix）。
- 後端：Firebase Functions（必要時補後端邏輯），Firebase Hosting / CDN。
- AI / 自動化（可選）：Google Vertex AI / @google/genai。
