# 新模組開發工作流程

> PRD → Blueprint → Feature → API → UI 完整開發流程

---

## 🎯 概述

新模組開發遵循「由上而下」的設計原則：

1. **需求分析** - 理解 PRD 需求
2. **架構設計** - 確定層級與資料模型
3. **資料層** - 建立資料表與 Security Rules
4. **存取層** - 實作 Repository 與 Store
5. **展示層** - 實作 UI 元件
6. **測試驗證** - 單元測試與整合測試

---

## 📋 工作流程

### 階段 1：需求分析 (1-2 小時)

#### 1.1 閱讀 PRD

```
□ 閱讀 docs/prd/construction-site-management.md
□ 識別相關功能章節
□ 列出功能需求清單
□ 識別前置依賴
```

#### 1.2 使用 Agent 分析

```
@agent PRD 分析

請分析 PRD 中的 [模組名稱] 功能：
1. 列出已完成與待實現功能
2. 識別前置依賴
3. 提取相關使用者故事
4. 列出技術約束
```

#### 1.3 確認架構層級

```
@agent 架構決策

功能名稱：[模組名稱]
功能描述：[描述]

請確認：
1. 屬於哪個架構層級？
2. 程式碼應該放在哪裡？
3. 相關資料表設計
```

---

### 階段 2：資料模型設計 (2-4 小時)

#### 2.1 設計資料表

使用 `blueprints/firebase-table.blueprint.md` 模板：

```sql
-- 建立資料表
CREATE TABLE {table_name} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 業務欄位
  -- 關聯欄位
  -- 時間戳記
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
```

#### 2.2 設計 Security Rules 政策

```
@agent Security Rules 政策

表名：{table_name}
表結構：[欄位定義]

權限需求：
- SELECT: [誰可以查看]
- INSERT: [誰可以新增]
- UPDATE: [誰可以更新]
- DELETE: [誰可以刪除]
```

#### 2.3 執行 Migration

```bash
# 建立 migration 檔案
firebase migration new create_{table_name}

# 執行 migration
firebase db push
```

---

### 階段 3：Domain 層實作 (1-2 小時)

#### 3.1 建立 Enums

```typescript
// domain/enums/{feature}-status.enum.ts
export enum FeatureStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}
```

#### 3.2 建立 Interfaces

```typescript
// domain/interfaces/{feature}.interface.ts
export interface Feature {
  id: string;
  // ...
}

export interface CreateFeatureDto {
  // ...
}

export interface UpdateFeatureDto {
  // ...
}
```

---

### 階段 4：Data Access 層實作 (2-4 小時)

#### 4.1 建立 Repository

使用 `prompts/create-store.prompt.md` 生成：

```
請為以下功能生成 Repository：

## 功能名稱
[功能名稱]

## 資料表名稱
[表名]

## Repository 需求
- findAll
- findById
- create
- update
- delete
```

#### 4.2 建立 Store

```
請為以下功能生成 Store：

## 功能名稱
[功能名稱]

## Store 需求
- 狀態：items, selectedItem, loading, error
- 計算屬性：itemCount, filteredItems
- 操作：loadItems, createItem, updateItem, deleteItem
```

#### 4.3 撰寫測試

```typescript
// data-access/stores/{feature}.store.spec.ts
describe('FeatureStore', () => {
  it('loadItems_whenBlueprintIdValid_shouldSetItems', async () => {
    // ...
  });
});
```

---

### 階段 5：UI 層實作 (4-8 小時)

#### 5.1 建立 Shell Component

使用 `blueprints/angular-feature.blueprint.md` 模板建立路由配置與 Shell。

#### 5.2 建立 UI Components

使用 `prompts/generate-component.prompt.md` 生成元件：

```
請生成一個 Standalone Component：

## 元件名稱
{feature}-list

## 元件類型
[x] 容器元件 (Container/Smart)

## 功能描述
[描述]
```

#### 5.3 整合測試

```typescript
// ui/{feature}-list/{feature}-list.component.spec.ts
describe('FeatureListComponent', () => {
  it('should render list when data loaded', () => {
    // ...
  });
});
```

---

### 階段 6：整合與驗證 (1-2 小時)

#### 6.1 Code Review

```
@agent Code Review

請審查 [功能名稱] 模組的程式碼：
- Repository
- Store
- UI Components

審查重點：
1. Angular 規範符合性
2. 狀態管理正確性
3. Security Rules 政策正確性
```

#### 6.2 執行測試

```bash
# 單元測試
yarn test --include='**/feature-name/**'

# E2E 測試
yarn e2e
```

#### 6.3 更新文檔

```
□ 更新 README（如需要）
□ 更新 CHANGELOG
□ 更新 API 文檔（如有）
```

---

## 📊 工時估算範本

| 階段 | 小型功能 | 中型功能 | 大型功能 |
|------|----------|----------|----------|
| 需求分析 | 1h | 2h | 4h |
| 資料模型 | 2h | 4h | 8h |
| Domain 層 | 1h | 2h | 4h |
| Data Access | 2h | 4h | 8h |
| UI 層 | 4h | 8h | 16h |
| 整合驗證 | 2h | 4h | 8h |
| **總計** | **12h** | **24h** | **48h** |

---

## ✅ 完成檢查清單

### 資料層

```
□ 資料表已建立
□ Security Rules 政策已設置
□ 索引已建立
□ Migration 已執行
```

### Domain 層

```
□ Enums 已定義
□ Interfaces 已定義
□ Types 已導出
```

### Data Access 層

```
□ Repository 已實作
□ Store 已實作
□ 單元測試已撰寫
□ 測試覆蓋率 > 80%
```

### UI 層

```
□ Shell Component 已建立
□ Routes 已配置
□ UI Components 已實作
□ 樣式符合規範
□ 響應式設計
```

### 品質

```
□ Code Review 通過
□ ESLint 無錯誤
□ 測試全部通過
□ 效能符合基準
```

---

## 📚 參考資源

- [PRD 文件](../../../docs/prd/construction-site-management.md)
- [系統架構](../../../docs/architecture/system-architecture.md)
- [Feature Blueprint](../blueprints/angular-feature.blueprint.md)
- [程式風格指南](../styleguide.md)

---

**最後更新**: 2025-11-27
