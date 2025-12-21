# Routes 模組 Agent 指南

Scope: 本文件位於 src/app/routes，針對 Routes（路由）模組的 Agent 使用者說明。此處定義 Agents 在路由層的職責與允許的內容範圍 —— 你現在位於路由層（Layer: Routes / Routing）。

## Purpose / Responsibility

本模組負責：
- 管理應用程式的主要路由配置（主路由、認證路由、異常路由）
- 定義與註冊懶載入的功能模組路由
- 提供模組等級的守衛（guards）與路由相關共通服務
- 維護 routing 相關的 AGENTS 文件與範式，確保所有 feature module 遵循標準路由模式

## Hard Rules / Constraints

必須非常嚴格遵守以下紅線：
- NO UI components: 本文件與此目錄不得包含 UI 元件或呈現邏輯
- NO feature-specific logic: 不得放入功能專屬商業邏輯（例如任務、日誌、品質等）
- NO direct Firebase access outside adapters: 禁止在此層直接呼叫 Firestore / Firebase；只有經由 repository/adapters 例外

其他強制性限制：
- 使用 Three-Layer Architecture（UI → Service → Repository）；Routes 只管理路由與跨模組守衛/服務
- 不得建立 FirebaseService wrapper
- 依賴注入必須使用 inject()（不要用 constructor injection）
- 所有非同步錯誤處理使用 Result Pattern
- 前端不得直接呼叫 Vertex AI；AI 呼叫僅透過 functions-ai

## Allowed / Expected Content

可接受放置於此模組目錄的內容：
- 路由配置檔（routes.ts）與懶載入模組參考
- Singleton services 關於路由/導航的共通服務（例如 Breadcrumb 計算、導航助手）
- Guards（authGuard、permissionGuard、moduleEnabledGuard）及其 AGENTS 註解
- Global interceptors 或 Router 相關的 cross-cutting concerns（例如導覽載入指示器）
- 模組層級的 AGENTS.md 與路由設計範例

不允許但可參考的內容：
- feature components、頁面呈現、直接的資料存取或複雜業務邏輯

## Structure / Organization

建議目錄結構（此結構為推薦且在本模組中維護）：
- routes.ts                          # 主路由配置（必須存在）
- services/                          # routing helpers、breadcrumb、navigation services
- guards/                            # authGuard、permissionGuard、moduleEnabledGuard
- interceptors/                      # optional: routing-related interceptors
- blueprint/                          # 範例子模組目錄（每個複雜模組應有自己的 AGENTS.md）
- AGENTS.md                          # 本檔案

範例規範（摘要）：
- 主路由必須使用 LayoutBasicComponent 並以 authGuard 保護
- 登入路由使用 LayoutPassportComponent
- 異常路由（/exception/*）不需認證
- 所有 feature module 必須懶載入且在 routes.ts 中註冊
- 路由資料（data）必須包含 title，並可選 breadcrumb、permission、module、showInMenu、icon、order

## Integration / Dependencies

允許與此模組互動的技術/相依：
- Angular DI（僅使用 inject()）
- 使用 @angular/fire 官方 adapter 與 repository pattern（不得直接呼叫 Firestore）
- Guards 與 services 可以依賴 Core services（透過明確介面）
- 前端不得包含任何 API key 或直接呼叫雲端 AI；AI 與 OCR 相關工作必須透過 functions-ai 或 functions-ai-document
- 模組間不得有 feature-to-feature 的循環匯入；僅透過公開介面或事件通訊

## Best Practices / Guidelines

品質指引（非強制，但強烈建議）：
- 優先使用組合（composition）而非繼承
- 使 services 保持無狀態（stateless）以利重用與測試
- 守衛順序應為：驗證 (auth) → 權限 (permission) → 模組啟用 (module enabled)
- 使用 signals + standalone components（專案慣例）在路由相關元件中保存狀態
- 對於需重複的權限檢查，請實作快取以降低 Firestore 查詢頻率
- 所有路由變更都應處理導航錯誤並提供回饋（例如 redirect 或顯示錯誤頁面）

## Related Docs / References

- ../shared/AGENTS.md
- ../environments/AGENTS.md
- ./blueprint/AGENTS.md (Blueprint 模組專用說明)
- ../../AGENTS.md (專案總覽)
- docs/architecture/ (路由與模組設計參考)

## Metadata

Version: 1.1.0
Status: Active
Audience: AI Coding Agents

<!-- 保留原始主要路由要點作為快速參考（摘要，不取代完整文件） -->

簡要快速參考：
- 主路由檔案：src/app/routes/routes.ts
- 路由模式：列表 ''、詳情 ':id'、編輯 ':id/edit'
- 守衛範例：authGuard、permissionGuard、moduleEnabledGuard，並允許守衛組合
- 導覽範例：router.navigate(['/blueprint', blueprintId])；相對導航建議使用 relativeTo
- 麵包屑：使用 computed() 計算，並由 PageHeaderComponent 顯示

更多詳細路由設計與範例請參考同目錄下各模組的 AGENTS.md（如 blueprint）。
