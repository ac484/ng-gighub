# Layout Module Agent Guide — Scope

Scope: 這個文件針對位於應用程式層（Layout 模組）的 Agent。你現在所在的層級：UI 佈局與跨切面佈局協調（非業務邏輯）。

## Purpose / Responsibility

Purpose: 定義 Layout 模組的責任範圍與預期行為。

Responsibilities:
- 提供三種主要佈局：Basic（已認證主界面）、Blank（最小容器）、Passport（認證流程）。
- 管理跨切面的 UI 結構與響應式行為（邊欄折疊、標題、通知中心）。
- 提供與授權、通知、主題等核心服務的整合點，但不實作業務邏輯。
- 定義與維護模組公開的檔案結構與介面契約，供上層路由配置使用。

## Hard Rules / Constraints

Hard Rules:
- NO UI components: 這個 AGENTS 文件不應包含或定義具體 UI 元件實作（只描述行為/契約）。
- NO feature-specific logic: 不在此放置特定功能的業務邏輯或資料處理流程。
- NO direct Firebase access outside adapters: 只有 adapter/repository 可以直接存取 Firestore/Auth，其他層級禁止直接呼叫 Firebase SDK。

額外約束：
- 嚴格三層架構（UI → Service → Repository），Repository 為唯一可存取 Firestore 的層。
- 不可新增非現有基礎架構（例如 REST API、外部後端）。
- 所有非同步錯誤處理應使用 Result Pattern。

## Allowed / Expected Content

Allowed:
- Singleton services（跨元件共享、無狀態或經過明確設計的狀態管理）。
- Global interceptors（網路攔截、權限檢查、錯誤轉換等跨切面功能）。
- Cross-cutting concerns（主題服務、布局狀態管理、Breakpoint 監控、事件匯流）。
- Public interfaces、types 與範本（介面、DTO、事件名單）。

Not allowed (quick reference):
- 直接組件模板或樣式實作於此文件中。
- 在此加入存取 Firestore 的程式碼範例（請放入 repository/adapters）。

## Structure / Organization

建議檔案/資料夾結構（依業務能力劃分）：
- services/           # Layout 相關 singleton services（BreakpointService、ThemeService）
- guards/             # authGuard 等與路由保護相關的守衛
- interceptors/       # 全域攔截器（如果需要）
- adapters/           # 與 Firebase 互動的 Repository / Adapter（唯一可直接呼叫 Firestore 的位置）
- docs/               # 與此模組相關的設計與使用說明

實作備註：
- Repository/Adapter 為唯一直接存取 Firebase 的位置；UI 或服務層不得直接用 @angular/fire 呼叫資料庫。

## Integration / Dependencies

Integration rules:
- Angular DI only: 僅使用 Angular DI（inject()）注入依賴；避免 constructor 注入。
- Uses @angular/fire adapters: 與 Firebase 的交互應透過 repository/adapters，使用現有 @angular/fire 套件。
- No feature-to-feature imports: 模組之間僅透過公開介面或事件通訊，避免跨功能檔案直接引用。

Runtime dependencies (guidance):
- BreakpointObserver（用於偵測行動/平板/桌面斷點）。
- ng-zorro-antd（僅在 UI 實作層使用的元件庫，AGENTS 文件不包含元件實作）。
- Firebase Auth / Firestore：僅由 repository 與後端 functions 使用，前端透過 adapters 與 services 取得封裝結果。

## Best Practices / Guidelines

Guidelines (非強制但推薦）：
- Prefer composition over inheritance：以組合取代繼承以提升可測試性。
- Keep services stateless where possible：若需狀態，使用 signals 並在需要時持久化到 localStorage 或 repository。
- Use signals for UI state：邊欄折疊、isMobile/isTablet、通知計數等應使用 signals 管理。
- Use takeUntilDestroyed() for subscriptions：所有訂閱使用 takeUntilDestroyed() 管理生命週期。
- Result Pattern for async：所有跨層非同步回傳應使用 Result Pattern 包裝成功/錯誤。
- Minimize surface area：只暴露必要的 public API，避免不必要的跨模組依賴。

## Related Docs / References

- ../shared/AGENTS.md
- ../environments/AGENTS.md
- ../core/AGENTS.md
- docs/architecture/

## Metadata

Version: 1.1.0
Status: Active
Audience: AI Coding Agents
