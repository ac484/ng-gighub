# Core Services Agent Guide

## Title + Scope
Scope: Core application-wide singleton services under src/app/core/services.

## Purpose / Responsibility
Clarify which services belong in Core vs Shared, and guide implementation of infrastructure-level services like authentication, logging, and telemetry.

## Hard Rules / Constraints
- NO UI components.
- NO feature-specific logic.
- NO direct Firebase access outside adapters/repositories; core services must delegate to repositories when needed.
- Distinguish infrastructure (core/services) from business (shared/services).

## Allowed / Expected Content
- Authentication, logging, telemetry, and other infrastructure singleton services.
- Service interfaces shared across modules.
- Documentation and tests for these services.

## Structure / Organization
- firebase-auth.service.ts
- logger/
- supabase.service.ts
- Additional infrastructure service folders as documented below.

## Integration / Dependencies
- Angular DI via inject(); use @angular/fire adapters where applicable.
- No feature-to-feature imports; expose public interfaces only.
- Supabase usage limited to read-only statistics.

## Best Practices / Guidelines
- Keep services stateless where possible; use signals only when needed.
- Use Result pattern for async work and avoid logging sensitive data.
- Enforce single responsibility and environment-aware configurations.

## Related Docs / References
- ../AGENTS.md (Core overview)
- ../../shared/services/AGENTS.md (Shared services)
- ../../routes/AGENTS.md (Routes)

## Metadata
Version: 1.1.0
Status: Active
Audience: AI Coding Agents

---

# Core Services Agent Guide

The Core Services module contains essential singleton services used across the entire GigHub application.

## ⚠️ Important: Core Services vs Shared Services

**規則**:
- **`src/app/core/services/`**（本目錄）：核心基礎設施服務，提供應用程式級別的功能（認證、日誌、統計查詢）
- **`src/app/shared/services/`**（不同目錄）：共享業務服務，提供業務邏輯功能（Blueprint、Account、Organization、Team、Validation 等）
- **區別**：
  - Core Services：基礎設施層，與業務邏輯無關，提供技術性功能
  - Shared Services：業務邏輯層，包含領域特定的服務，可在多個功能模組間共享
- **選擇原則**：
  - 技術性、基礎設施功能 → 放在 `core/services/`
  - 業務邏輯、領域功能 → 放在 `shared/services/`
- **禁止混淆**：不要將業務服務放在 `core/services/`，不要將基礎設施服務放在 `shared/services/`

## Module Purpose

**規則**:
- Core Services 模組提供核心基礎設施服務
- 提供 Firebase Authentication Service（Firebase Auth 整合）
- 提供 Logger Service（結構化日誌記錄，含嚴重性等級）
- 提供 Supabase Service（統計查詢，唯讀）

## Module Structure

**規則**:
- `src/app/core/services/AGENTS.md` - 本文件
- `firebase-auth.service.ts` - Firebase 認證
- `logger/` - Logger 服務實作
- `supabase.service.ts` - Supabase 客戶端（僅用於統計）

## Key Services

### FirebaseAuthService

**規則**:
- 必須使用 `@angular/fire/auth` 的 `Auth` 服務
- 必須提供 `user$` Observable 監聽認證狀態
- 必須提供 `currentUser` getter 取得當前用戶
- 必須實作 `signIn()`、`signUp()`、`signOut()` 方法
- 必須實作社交登入方法（Google、GitHub）
- 必須實作郵件驗證和密碼重置方法
- 必須使用 `providedIn: 'root'` 作為單例服務
- 必須使用 `inject()` 注入依賴

### LoggerService

**規則**:
- 必須提供結構化日誌記錄功能
- 必須支援多個日誌等級（Debug、Info、Warn、Error、Critical）
- 必須根據環境設定最小日誌等級
- 必須包含時間戳記和上下文資訊
- 必須在生產環境中發送 Critical 錯誤到監控服務
- 必須避免記錄敏感資料
- 必須使用 `providedIn: 'root'` 作為單例服務

### SupabaseService

**規則**:
- ⚠️ **僅用於統計查詢**，不能用於主要應用程式資料
- 必須使用 Supabase 客戶端進行唯讀查詢
- 必須僅查詢統計資料表
- 所有主要應用程式資料（blueprints、tasks 等）必須使用 Firebase/Firestore
- 必須使用 `providedIn: 'root'` 作為單例服務
- 必須在文件註明僅用於統計查詢

## Service Lifecycle

**規則**:
- 所有服務必須使用 `providedIn: 'root'` 作為單例
- 服務生命週期與應用程式相同
- 狀態在路由變更之間保持
- 不需要實作 `ngOnDestroy`

## Best Practices

**規則**:
1. 必須保持服務專注和單一職責
2. 必須使用依賴注入提高可測試性
3. 必須為公開 API 提供 JSDoc 註解
4. 必須實作適當的錯誤處理
5. 必須避免在服務中執行副作用（除非必要）
6. 必須使用 TypeScript 嚴格類型
7. 必須提供清晰的服務介面

## Related Documentation

**規則**:
- 必須參考 Core Module AGENTS.md 獲取核心基礎設施總覽
- 必須參考 Passport Module AGENTS.md 獲取認證流程
- 必須參考 Shared Services AGENTS.md 了解業務服務（不要混淆）

---

**Module Version**: 1.1.0  
**Last Updated**: 2025-12-09  
**Status**: Production Ready
