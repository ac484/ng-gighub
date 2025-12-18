---
description: 'GigHub Memory MCP 工具使用指南 - AI 開發知識圖譜管理'
applyTo: '**/*.ts, **/*.md'
---

# GigHub Memory 使用指南

> **專案專用**: Memory MCP 工具使用規範 - AI 開發知識圖譜 (只讀)

## 🎯 核心理念 (MUST) 🔴

**Memory 是 AI 開發過程中累積的專案知識圖譜**

### 什麼是 Memory?

Memory 是一個知識圖譜系統，記錄 AI 開發過程中發現的專案知識、架構模式、設計決策、開發規範等。

**儲存位置**: `.github/copilot/memory.jsonl`

**格式**: JSON Lines (每行一個 JSON 物件)

### 為什麼需要 Memory?

1. **知識累積** - 記錄開發過程中的專案知識
2. **模式識別** - 識別重複的架構模式與設計決策
3. **經驗傳承** - 保留開發經驗供未來參考
4. **快速查詢** - 快速查找過去的設計決策與實作細節

### 重要說明 ⚠️

**Memory 用於 AI 開發過程記錄，非專案應用使用**

**只讀規範 (MUST) 🔴**:
- ✅ 讀取知識圖譜 (read_graph)
- ✅ 搜尋相關節點 (search_nodes)
- ✅ 查看實體詳情 (open_nodes)
- ❌ **禁止**創建實體 (create_entities)
- ❌ **禁止**創建關係 (create_relations)
- ❌ **禁止**新增觀察 (add_observations)
- ❌ **禁止**直接編輯 `.github/copilot/memory.jsonl`

**更新流程**:
Memory 的更新應由人工審核後進行，確保知識品質與準確性。

## 🔧 Memory MCP API 參考

### 只讀操作 (ALLOWED) ✅

#### 1. read_graph - 讀取知識圖譜

**用途**: 讀取完整的知識圖譜結構

**語法**:
```typescript
memory.read_graph(): Promise<KnowledgeGraph>
```

**返回值**:
```typescript
interface KnowledgeGraph {
  entities: Entity[];
  relations: Relation[];
}

interface Entity {
  name: string;
  entityType: string;
  observations: string[];
}

interface Relation {
  from: string;
  to: string;
  relationType: string;
}
```

**範例**:
```typescript
// 讀取完整知識圖譜
const graph = await memory.read_graph();

console.log("實體總數:", graph.entities.length);
console.log("關係總數:", graph.relations.length);

// 列出所有實體類型
const entityTypes = new Set(graph.entities.map(e => e.entityType));
console.log("實體類型:", Array.from(entityTypes));

// 列出所有關係類型
const relationTypes = new Set(graph.relations.map(r => r.relationType));
console.log("關係類型:", Array.from(relationTypes));
```

#### 2. search_nodes - 搜尋節點

**用途**: 根據查詢字串搜尋相關實體和關係

**語法**:
```typescript
memory.search_nodes(query: string): Promise<SearchResult>
```

**參數**:
- `query`: 搜尋關鍵字 (實體名稱、類型、觀察內容)

**返回值**:
```typescript
interface SearchResult {
  entities: Entity[];
  relations: Relation[];
}
```

**範例**:
```typescript
// 搜尋架構相關知識
const archResult = await memory.search_nodes("architecture");
console.log("找到實體:", archResult.entities.length);
console.log("找到關係:", archResult.relations.length);

// 搜尋特定模式
const repoResult = await memory.search_nodes("repository pattern");

// 搜尋安全相關
const securityResult = await memory.search_nodes("security rules");

// 搜尋開發規範
const conventionResult = await memory.search_nodes("naming convention");
```

#### 3. open_nodes - 查看實體詳情

**用途**: 查看特定實體的詳細觀察記錄

**語法**:
```typescript
memory.open_nodes(entityName: string): Promise<Entity>
```

**參數**:
- `entityName`: 實體名稱

**返回值**:
```typescript
interface Entity {
  name: string;
  entityType: string;
  observations: string[];
}
```

**範例**:
```typescript
// 查看 Five Layer Architecture 實體
const entity = await memory.open_nodes("Five Layer Architecture");

console.log("實體名稱:", entity.name);
console.log("實體類型:", entity.entityType);
console.log("觀察記錄:");
entity.observations.forEach((obs, idx) => {
  console.log(`  ${idx + 1}. ${obs}`);
});
```

### 禁止操作 (FORBIDDEN) ❌

以下操作**絕對禁止**使用:

#### create_entities - 創建實體 ❌

```typescript
// ❌ 禁止: 創建實體
await memory.create_entities([
  {
    name: "New Pattern",
    entityType: "Pattern",
    observations: ["Observation 1"]
  }
]);
```

#### create_relations - 創建關係 ❌

```typescript
// ❌ 禁止: 創建關係
await memory.create_relations([
  {
    from: "Entity A",
    to: "Entity B",
    relationType: "uses"
  }
]);
```

#### add_observations - 新增觀察 ❌

```typescript
// ❌ 禁止: 新增觀察
await memory.add_observations([
  {
    entityName: "Existing Entity",
    contents: ["New observation"]
  }
]);
```

#### 直接編輯 memory.jsonl ❌

```bash
# ❌ 禁止: 直接編輯檔案
vim .github/copilot/memory.jsonl
```

## 📊 GigHub Memory 知識結構

### 實體類型 (Entity Types)

根據 `.github/copilot/memory.jsonl` 內容，GigHub Memory 包含以下實體類型:

#### 1. Architecture (架構)

記錄系統架構設計與模式。

**實體範例**:
- `Five Layer Architecture` - 五層架構設計
- `Database Schema` - 資料庫架構
- `Hybrid Architecture Model` - 混合架構模型

**查詢方式**:
```typescript
const archEntities = await memory.search_nodes("architecture");
```

#### 2. Backend (後端)

記錄後端技術與實作細節。

**實體範例**:
- `Firebase` - Firebase 整合
- `Firestore Database` - Firestore 資料庫

**查詢方式**:
```typescript
const backendEntities = await memory.search_nodes("backend");
```

#### 3. Constraint (限制)

記錄開發限制與禁止行為。

**實體範例**:
- `Agent Operation Constraints` - Agent 操作限制
- `Forbidden Practices` - 禁止的實踐

**查詢方式**:
```typescript
const constraints = await memory.search_nodes("constraint");
```

#### 4. Convention (約定)

記錄開發約定與命名規範。

**實體範例**:
- `Component Export Naming` - 元件匯出命名規範

**查詢方式**:
```typescript
const conventions = await memory.search_nodes("convention");
```

#### 5. DevOps

記錄 DevOps 相關流程與標準。

**實體範例**:
- `Backup & Recovery` - 備份與恢復
- `Git Workflow` - Git 工作流程
- `Logging Standards` - 日誌標準
- `Migration Standards` - 遷移標準
- `Monitoring & Analytics` - 監控與分析

**查詢方式**:
```typescript
const devopsEntities = await memory.search_nodes("devops");
```

#### 6. Development Practice (開發實踐)

記錄開發實踐與層級開發指引。

**實體範例**:
- `Facades Layer Development` - Facades 層開發
- `Models Layer Development` - Models 層開發

**查詢方式**:
```typescript
const practices = await memory.search_nodes("development practice");
```

#### 7. Accessibility (無障礙)

記錄無障礙相關設計。

**實體範例**:
- `Keyboard Shortcuts` - 鍵盤快捷鍵

**查詢方式**:
```typescript
const a11yEntities = await memory.search_nodes("accessibility");
```

### 關係類型 (Relation Types)

記錄實體之間的關係。

**常見關係**:
- `uses` - 使用關係
- `implements` - 實作關係
- `extends` - 擴展關係
- `contains` - 包含關係
- `depends_on` - 依賴關係

## 📝 使用場景

### 場景 1: 查詢架構設計

```typescript
// 搜尋架構相關知識
const result = await memory.search_nodes("five layer architecture");

// 查看詳細設計
if (result.entities.length > 0) {
  const entity = await memory.open_nodes("Five Layer Architecture");
  
  console.log("架構設計:");
  entity.observations.forEach(obs => {
    console.log(`- ${obs}`);
  });
}
```

### 場景 2: 查詢開發規範

```typescript
// 搜尋命名規範
const result = await memory.search_nodes("naming convention");

// 查看所有相關實體
for (const entity of result.entities) {
  const details = await memory.open_nodes(entity.name);
  console.log(`\n${entity.name}:`);
  details.observations.forEach(obs => {
    console.log(`  - ${obs}`);
  });
}
```

### 場景 3: 查詢禁止模式

```typescript
// 搜尋禁止行為
const result = await memory.search_nodes("forbidden");

// 列出所有禁止模式
for (const entity of result.entities) {
  const details = await memory.open_nodes(entity.name);
  console.log(`\n${entity.name}:`);
  details.observations.forEach(obs => {
    console.log(`  ❌ ${obs}`);
  });
}
```

### 場景 4: 查詢技術實作細節

```typescript
// 搜尋 Firebase 相關知識
const firebaseResult = await memory.search_nodes("firebase");

// 搜尋 Firestore 相關知識
const firestoreResult = await memory.search_nodes("firestore");

// 查看詳細實作
for (const entity of firebaseResult.entities) {
  const details = await memory.open_nodes(entity.name);
  console.log(`\n${entity.name}:`);
  details.observations.forEach(obs => {
    console.log(`  - ${obs}`);
  });
}
```

### 場景 5: 查詢 DevOps 流程

```typescript
// 搜尋 Git 工作流程
const gitResult = await memory.search_nodes("git workflow");

// 搜尋日誌標準
const loggingResult = await memory.search_nodes("logging standards");

// 搜尋監控標準
const monitoringResult = await memory.search_nodes("monitoring");
```

## ✅ Memory 使用檢查清單

### 使用前檢查 (MUST) 🔴

- [ ] 我只需要讀取知識嗎? (不需要修改)
- [ ] 我使用的是只讀 API 嗎?
- [ ] 我沒有嘗試創建/修改實體嗎?
- [ ] 我沒有嘗試直接編輯 memory.jsonl 嗎?

### 查詢品質檢查 (SHOULD) ⚠️

- [ ] 使用適當的搜尋關鍵字
- [ ] 搜尋結果相關性高
- [ ] 查看完整的觀察記錄
- [ ] 理解實體之間的關係

### 知識應用檢查 (SHOULD) ⚠️

- [ ] 知識應用於當前任務
- [ ] 遵循記錄的設計決策
- [ ] 避免違反記錄的限制
- [ ] 參考記錄的最佳實踐

## 🚫 常見錯誤模式

### ❌ 錯誤: 嘗試創建實體

```typescript
// ❌ 禁止: 創建實體
await memory.create_entities([
  { name: "New Pattern", entityType: "Pattern", observations: [] }
]);

// ✅ 正確: 只讀取
const result = await memory.search_nodes("pattern");
```

### ❌ 錯誤: 嘗試修改觀察

```typescript
// ❌ 禁止: 新增觀察
await memory.add_observations([
  { entityName: "Five Layer Architecture", contents: ["New observation"] }
]);

// ✅ 正確: 只讀取
const entity = await memory.open_nodes("Five Layer Architecture");
console.log("現有觀察:", entity.observations);
```

### ❌ 錯誤: 直接編輯檔案

```bash
# ❌ 禁止: 直接編輯
vim .github/copilot/memory.jsonl

# ✅ 正確: 使用只讀 API
# 在程式碼中使用 memory.read_graph()
```

### ❌ 錯誤: 搜尋關鍵字過於籠統

```typescript
// ❌ 錯誤: 關鍵字太籠統
const result = await memory.search_nodes("system");
// 返回太多不相關結果

// ✅ 正確: 使用具體關鍵字
const result = await memory.search_nodes("five layer architecture");
```

## 🎯 決策樹

### 何時查詢 Memory?

```
需要了解專案知識嗎?
├─ 架構設計 → 搜尋 "architecture"
├─ 開發規範 → 搜尋 "convention"
├─ 禁止模式 → 搜尋 "forbidden" 或 "constraint"
├─ 技術實作 → 搜尋具體技術名稱
├─ DevOps 流程 → 搜尋 "workflow" 或 "standards"
└─ 不確定 → 先 read_graph 了解整體結構
```

### 如何有效搜尋?

```
搜尋策略?
├─ 具體實體 → 使用完整名稱 (open_nodes)
├─ 相關主題 → 使用主題關鍵字 (search_nodes)
├─ 實體類型 → 使用類型名稱 (search_nodes)
└─ 全面了解 → 讀取完整圖譜 (read_graph)
```

## 📊 Memory 更新流程 (僅供參考)

**注意**: 以下流程僅供參考，AI 不應執行更新操作。

### 人工審核流程

1. **收集知識**: 在開發過程中識別有價值的知識
2. **整理格式**: 整理為結構化的實體與關係
3. **審核品質**: 確保知識準確且有價值
4. **手動更新**: 人工編輯 `.github/copilot/memory.jsonl`
5. **版本控制**: 提交並記錄變更

### 知識品質標準

- **準確性**: 知識必須準確無誤
- **有價值**: 知識對未來開發有參考價值
- **結構化**: 實體與關係定義清晰
- **可維護**: 易於理解與更新

## 📚 參考資源

- Memory 檔案位置: `.github/copilot/memory.jsonl`
- GigHub Redis 使用: `.github/instructions/ng-gighub-redis.instructions.md`

---

**版本**: v1.0  
**最後更新**: 2025-12-18  
**維護者**: GigHub 開發團隊
