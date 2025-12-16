# 架構決策記錄 (Architecture Decision Records)

本目錄包含 GigHub 專案的重要架構決策記錄。

## 什麼是 ADR？

Architecture Decision Record (ADR) 是一種記錄重要架構決策的文檔格式，包含：
- **情境 (Context)**: 為什麼需要做這個決策？
- **決策 (Decision)**: 我們決定做什麼？
- **理由 (Rationale)**: 為什麼這樣決定？
- **後果 (Consequences)**: 決策的影響是什麼？

## ADR 清單

| ID | 標題 | 狀態 | 日期 |
|----|------|------|------|
| [0001](./0001-blueprint-modular-system.md) | 採用 Blueprint 模組化系統架構 | ✅ Accepted | 2025-12-14 |
| [0002](./0002-hybrid-repository-strategy.md) | 混合 Repository 策略 | ✅ Accepted | 2025-12-14 |
| [0003](./0003-merge-features-into-routes.md) | 合併 features/ 到 routes/ | ✅ Accepted | 2025-12-14 |

## ADR 狀態

- ✅ **Accepted** (已採納) - 決策已被採納並實施
- 🔄 **Proposed** (提議中) - 決策尚在討論中
- ❌ **Rejected** (已拒絕) - 決策被拒絕
- 🗑️ **Deprecated** (已棄用) - 決策已被新決策取代
- ⏸️ **Superseded** (已取代) - 被另一個 ADR 取代

## 快速摘要

### ADR-0001: Blueprint 模組化系統 ✅

**核心概念**: 採用插件化架構，支援模組動態載入、事件驅動通訊、依賴注入容器。

**關鍵決策**:
- 模組獨立開發與測試
- 事件匯流排進行模組間通訊
- 整合 Angular DI 系統

**影響**: 
- ✅ 提升模組獨立性和可維護性
- ⚠️ 增加初期架構複雜度

---

### ADR-0002: 混合 Repository 策略 ✅

**核心概念**: 在集中式和分散式 Repository 之間取得平衡。

**關鍵決策**:
- 共享 repositories → `core/data-access/shared/`
- 模組 repositories → `blueprint/modules/[module]/repositories/`
- 基礎設施 repositories → `core/infrastructure/`

**影響**:
- ✅ 平衡一致性與模組獨立性
- ⚠️ 需要清晰的決策準則

---

### ADR-0003: 合併 features/ 到 routes/ ✅

**核心概念**: 消除 features/ 和 routes/ 的冗餘，統一使用 routes/。

**關鍵決策**:
- 所有功能模組放在 `routes/` 目錄
- Smart Components 在 `pages/` 子目錄
- Dumb Components 在 `components/` 子目錄
- Facade Services 在 `services/` 子目錄（可選）

**影響**:
- ✅ 符合 ng-alain 慣例
- ✅ 簡化結構和決策
- ⚠️ 需要遷移現有程式碼

---

## 如何使用這些 ADRs

### 開發新功能時

1. **查閱相關 ADRs**: 了解既有架構決策
2. **遵循決策**: 按照 ADR 的指引進行開發
3. **提出新 ADR**: 如果需要做出新的架構決策

### 重構現有程式碼時

1. **檢查 ADRs**: 確保重構符合架構決策
2. **更新 ADRs**: 如果決策需要調整，更新相關 ADR
3. **標記舊 ADR**: 如果決策被取代，標記為 Superseded

### 新成員加入時

1. **閱讀所有 ADRs**: 理解專案的架構演進
2. **詢問不清楚的部分**: 與團隊討論 ADR 的細節
3. **貢獻新 ADRs**: 提出改進建議

## ADR 模板

創建新 ADR 時，使用以下模板：

```markdown
# ADR-XXXX: [決策標題]

## 狀態
🔄 **提議中** (Proposed)

## 情境 (Context)
[描述需要做出決策的背景和問題]

## 決策 (Decision)
[描述做出的決策]

## 理由 (Rationale)
[解釋為什麼做出這個決策]

## 後果 (Consequences)
[描述決策的正面和負面影響]

### 正面影響
- ✅ ...

### 負面影響與緩解
- ⚠️ ...

---

**作者**: [Your Name]  
**建立日期**: YYYY-MM-DD  
**最後更新**: YYYY-MM-DD  
**狀態**: 🔄 Proposed
```

## 參考資料

- [ADR GitHub](https://adr.github.io/)
- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [Architecture Decision Records](https://github.com/joelparkerhenderson/architecture-decision-record)

---

**維護者**: Architecture Team  
**最後更新**: 2025-12-14
