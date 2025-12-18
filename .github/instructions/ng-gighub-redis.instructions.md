---
description: 'GigHub Redis MCP 工具使用指南 - AI 開發過程資料暫存'
applyTo: '**/*.ts, **/*.md'
---

# GigHub Redis 使用指南

> **專案專用**: Redis MCP 工具使用規範 - AI 開發過程資料暫存

## 🎯 核心理念 (MUST) 🔴

**Redis 是 AI 開發過程中的臨時資料儲存工具**

### 為什麼需要 Redis?

1. **暫存開發狀態** - 記錄 AI 開發過程中的臨時資料
2. **跨步驟資料傳遞** - 在多個步驟間共享中間結果
3. **會話資料管理** - 儲存開發會話的上下文資訊
4. **快速讀寫** - 高效能的鍵值儲存

### 重要說明 ⚠️

**Redis 用於 AI 開發過程記錄，非專案應用使用**

- ✅ 記錄 AI 工作狀態
- ✅ 儲存開發過程中間結果
- ✅ 暫存分析資料
- ❌ **不用於專案應用程式**
- ❌ **不用於使用者資料儲存**
- ❌ **不用於生產環境**

## 🔧 Redis MCP API 參考

### 基本操作

#### 1. set - 設定鍵值

**用途**: 儲存資料到 Redis

**語法**:
```typescript
redis.set(key: string, value: string, options?: SetOptions)
```

**參數**:
- `key`: 鍵名稱
- `value`: 值 (字串)
- `options.ttl`: 過期時間 (秒，可選)

**範例**:
```typescript
// 儲存開發狀態
await redis.set("dev:current-task", "實作 TaskRepository");

// 儲存帶過期時間的資料 (1 小時)
await redis.set("dev:temp-analysis", JSON.stringify(analysisResult), {
  ttl: 3600
});

// 儲存複雜物件
const context = {
  blueprintId: "blueprint-1",
  phase: "implementation",
  completedTasks: ["task-1", "task-2"]
};
await redis.set("dev:context", JSON.stringify(context));
```

#### 2. get - 讀取鍵值

**用途**: 從 Redis 讀取資料

**語法**:
```typescript
redis.get(key: string): Promise<string | null>
```

**參數**:
- `key`: 鍵名稱

**返回值**:
- 值 (字串) 或 null (不存在)

**範例**:
```typescript
// 讀取開發狀態
const currentTask = await redis.get("dev:current-task");
console.log("當前任務:", currentTask);

// 讀取並解析 JSON
const contextStr = await redis.get("dev:context");
if (contextStr) {
  const context = JSON.parse(contextStr);
  console.log("開發上下文:", context);
}

// 處理不存在的鍵
const data = await redis.get("dev:non-existent");
if (data === null) {
  console.log("資料不存在");
}
```

#### 3. delete - 刪除鍵值

**用途**: 從 Redis 刪除資料

**語法**:
```typescript
redis.delete(key: string): Promise<void>
```

**參數**:
- `key`: 鍵名稱

**範例**:
```typescript
// 刪除臨時資料
await redis.delete("dev:temp-analysis");

// 清理完成的任務狀態
await redis.delete("dev:current-task");
```

#### 4. keys - 列出鍵

**用途**: 查詢符合模式的所有鍵

**語法**:
```typescript
redis.keys(pattern: string): Promise<string[]>
```

**參數**:
- `pattern`: 鍵名稱模式 (支援 glob 模式)

**返回值**:
- 鍵名稱陣列

**範例**:
```typescript
// 列出所有開發相關鍵
const devKeys = await redis.keys("dev:*");
console.log("開發鍵:", devKeys);

// 列出特定任務的鍵
const taskKeys = await redis.keys("dev:task:*");
console.log("任務鍵:", taskKeys);

// 列出所有鍵 (謹慎使用)
const allKeys = await redis.keys("*");
console.log("所有鍵:", allKeys);
```

## 📝 使用場景

### 場景 1: 記錄開發階段

```typescript
// 開始新階段
await redis.set("dev:phase", "implementation");
await redis.set("dev:phase-start", new Date().toISOString());

// 記錄階段任務
await redis.set("dev:phase:tasks", JSON.stringify([
  "實作 Repository",
  "實作 Service",
  "實作 Component"
]));

// 更新進度
await redis.set("dev:phase:completed", "1");

// 階段完成
await redis.set("dev:phase", "testing");
await redis.delete("dev:phase:tasks");
```

### 場景 2: 暫存分析結果

```typescript
// 分析程式碼複雜度
const complexityAnalysis = {
  files: [
    { path: "task.repository.ts", complexity: 5 },
    { path: "task.service.ts", complexity: 7 },
  ],
  totalComplexity: 12,
  timestamp: new Date().toISOString()
};

// 儲存分析結果 (1 小時過期)
await redis.set(
  "dev:analysis:complexity",
  JSON.stringify(complexityAnalysis),
  { ttl: 3600 }
);

// 稍後讀取
const analysisStr = await redis.get("dev:analysis:complexity");
if (analysisStr) {
  const analysis = JSON.parse(analysisStr);
  console.log("總複雜度:", analysis.totalComplexity);
}
```

### 場景 3: 跨步驟資料傳遞

```typescript
// 步驟 1: 收集需求
const requirements = {
  feature: "Task Management",
  modules: ["Repository", "Service", "Component"],
  priority: "high"
};
await redis.set("dev:requirements", JSON.stringify(requirements));

// 步驟 2: 設計架構 (使用步驟 1 資料)
const reqStr = await redis.get("dev:requirements");
if (reqStr) {
  const req = JSON.parse(reqStr);
  const architecture = designArchitecture(req);
  await redis.set("dev:architecture", JSON.stringify(architecture));
}

// 步驟 3: 實作 (使用步驟 2 資料)
const archStr = await redis.get("dev:architecture");
if (archStr) {
  const arch = JSON.parse(archStr);
  await implementArchitecture(arch);
}

// 清理
await redis.delete("dev:requirements");
await redis.delete("dev:architecture");
```

### 場景 4: 開發會話管理

```typescript
// 開始新會話
const sessionId = `session-${Date.now()}`;
await redis.set("dev:current-session", sessionId);

// 記錄會話資訊
const sessionInfo = {
  id: sessionId,
  startTime: new Date().toISOString(),
  goal: "實作任務管理模組",
  completedTasks: []
};
await redis.set(`dev:session:${sessionId}`, JSON.stringify(sessionInfo));

// 更新會話進度
const sessionStr = await redis.get(`dev:session:${sessionId}`);
if (sessionStr) {
  const session = JSON.parse(sessionStr);
  session.completedTasks.push("task-1");
  await redis.set(`dev:session:${sessionId}`, JSON.stringify(session));
}

// 結束會話
await redis.set(`dev:session:${sessionId}:end`, new Date().toISOString());
```

## 🗂️ 命名規範

### 鍵命名結構

```
{namespace}:{category}:{identifier}:{field}
```

**範例**:
```
dev:task:task-1:status
dev:phase:implementation:progress
dev:analysis:complexity:result
dev:session:session-123:info
```

### 推薦命名空間

| 命名空間 | 用途 | 範例 |
|---------|------|------|
| `dev:task:*` | 任務相關 | `dev:task:task-1:status` |
| `dev:phase:*` | 開發階段 | `dev:phase:implementation:progress` |
| `dev:analysis:*` | 分析結果 | `dev:analysis:complexity:result` |
| `dev:session:*` | 會話資訊 | `dev:session:session-123:info` |
| `dev:temp:*` | 臨時資料 | `dev:temp:cache:data` |
| `dev:context:*` | 開發上下文 | `dev:context:current:blueprint` |

## ✅ Redis 使用檢查清單

### 使用前檢查 (MUST) 🔴

- [ ] 資料是臨時性的嗎?
- [ ] 資料是 AI 開發過程相關的嗎?
- [ ] 不是專案應用程式資料?
- [ ] 不是使用者資料?

### 資料管理檢查 (SHOULD) ⚠️

- [ ] 鍵名稱遵循命名規範
- [ ] 設定合理的過期時間 (TTL)
- [ ] 使用 JSON 儲存複雜物件
- [ ] 及時清理不再需要的資料
- [ ] 避免儲存敏感資訊

### 錯誤處理檢查 (SHOULD) ⚠️

- [ ] 處理 get 返回 null 的情況
- [ ] 處理 JSON.parse 錯誤
- [ ] 考慮網路錯誤的情況
- [ ] 有備用方案 (Redis 不可用時)

## 🚫 常見錯誤模式

### ❌ 錯誤: 儲存專案應用資料

```typescript
// ❌ 錯誤: Redis 不應用於專案應用
await redis.set("app:user:123", JSON.stringify(userData));

// ✅ 正確: 使用 Firestore
await userRepository.create(userData);
```

### ❌ 錯誤: 鍵名稱不規範

```typescript
// ❌ 錯誤: 命名不清晰
await redis.set("data", "value");
await redis.set("temp", "value");

// ✅ 正確: 遵循命名規範
await redis.set("dev:analysis:complexity", "value");
await redis.set("dev:temp:cache", "value");
```

### ❌ 錯誤: 未設定過期時間

```typescript
// ❌ 錯誤: 臨時資料永久儲存
await redis.set("dev:temp:data", "value");

// ✅ 正確: 設定過期時間
await redis.set("dev:temp:data", "value", { ttl: 3600 });
```

### ❌ 錯誤: 未處理 null 返回

```typescript
// ❌ 錯誤: 未檢查 null
const data = await redis.get("dev:data");
const parsed = JSON.parse(data); // 可能拋出錯誤

// ✅ 正確: 檢查 null
const data = await redis.get("dev:data");
if (data !== null) {
  try {
    const parsed = JSON.parse(data);
    // 使用 parsed
  } catch (error) {
    console.error("JSON 解析錯誤:", error);
  }
}
```

## 🎯 決策樹

### 是否使用 Redis?

```
資料類型?
├─ AI 開發過程資料 → 使用 Redis ✅
│   ├─ 開發狀態
│   ├─ 分析結果
│   ├─ 會話資訊
│   └─ 臨時快取
└─ 專案應用資料 → 使用 Firestore ❌
    ├─ 使用者資料
    ├─ 業務資料
    └─ 持久化資料
```

### TTL 設定策略

```
資料保留時間?
├─ 短期 (< 1 小時) → TTL: 3600
├─ 中期 (1-24 小時) → TTL: 86400
├─ 長期 (> 24 小時) → 考慮使用其他儲存
└─ 永久 → 不應使用 Redis
```

## 📊 最佳實踐總結

### DO ✅

1. **用於 AI 開發過程記錄**
   - 開發狀態追蹤
   - 分析結果暫存
   - 會話資訊管理

2. **設定合理的 TTL**
   - 短期資料: 1-6 小時
   - 中期資料: 6-24 小時
   - 及時清理不需要的資料

3. **遵循命名規範**
   - 使用命名空間: `dev:*`
   - 結構化鍵名稱
   - 易於查詢與管理

4. **錯誤處理**
   - 檢查 null 返回
   - 處理 JSON 解析錯誤
   - 有備用方案

### DON'T ❌

1. **不用於專案應用**
   - 不儲存使用者資料
   - 不儲存業務資料
   - 不用於生產環境

2. **不儲存敏感資訊**
   - 不儲存密碼
   - 不儲存 Token
   - 不儲存個人資料

3. **不濫用**
   - 不儲存大量資料
   - 不作為主要儲存
   - 不長期保留資料

## 📚 參考資源

- Redis 官方文檔: https://redis.io/docs/
- GigHub Memory 使用: `.github/instructions/ng-gighub-memory.instructions.md`

---

**版本**: v1.0  
**最後更新**: 2025-12-18  
**維護者**: GigHub 開發團隊
