---
description: 'GigHub Context7 MCP 工具使用指南 - 查詢最新官方文檔'
applyTo: '**/*.ts, **/*.md'
---

# GigHub Context7 使用指南

> **專案專用**: Context7 MCP 工具使用規範與最佳實踐

## 🎯 核心理念 (MUST) 🔴

**Context7 是查詢官方文檔的唯一正確方式**

### 為什麼必須使用 Context7?

1. **確保準確性** - 避免 API 幻覺，使用官方最新文檔
2. **版本特定** - 獲取專案當前使用版本的正確語法
3. **即時更新** - 隨時查詢最新的 API 變更與最佳實踐
4. **減少錯誤** - 避免使用已棄用或不存在的 API

### 適用範圍

Context7 **必須用於**所有外部庫/框架問題：

- ✅ Angular 20.x (Signals, Standalone Components, Router, Forms)
- ✅ ng-alain 20.x (@delon/abc, @delon/form, @delon/auth, @delon/acl)
- ✅ ng-zorro-antd 20.x (Table, Form, Modal, Layout, Drawer)
- ✅ Firebase 20.x (Authentication, Firestore, Storage)
- ✅ RxJS 7.8.x (Operators, Observables, Subjects)
- ✅ TypeScript 5.9.x (Type System, Decorators, Utility Types)

## 🔧 Context7 API 參考

### 1. resolve-library-id - 解析庫 ID

**用途**: 從庫名稱解析為 Context7 相容的庫 ID

**語法**:
```typescript
resolve-library-id({ libraryName: string })
```

**範例**:
```typescript
// 查詢 Angular
resolve-library-id({ libraryName: "angular" })
// 返回: { id: "/angular/angular", name: "Angular", ... }

// 查詢 ng-alain
resolve-library-id({ libraryName: "ng-alain" })
// 返回: { id: "/ng-alain/ng-alain", name: "ng-alain", ... }

// 查詢 Firebase
resolve-library-id({ libraryName: "@angular/fire" })
// 返回: { id: "/angular/fire", name: "@angular/fire", ... }
```

**選擇標準**:
1. **完全匹配**: 優先選擇與查詢名稱完全匹配的庫
2. **高聲譽**: 選擇 Source Reputation 為 High 或 Medium 的庫
3. **高基準分數**: 選擇 Benchmark Score 較高的庫 (滿分 100)
4. **豐富文檔**: 選擇 Code Snippet Count 較多的庫

### 2. get-library-docs - 獲取庫文檔

**用途**: 獲取特定庫的文檔與程式碼範例

**語法**:
```typescript
get-library-docs({
  context7CompatibleLibraryID: string,
  topic?: string,
  mode?: "code" | "info",
  page?: number
})
```

**參數說明**:

| 參數 | 類型 | 必填 | 預設值 | 說明 |
|------|------|------|--------|------|
| `context7CompatibleLibraryID` | string | ✅ | - | 從 resolve-library-id 獲取的庫 ID |
| `topic` | string | ❌ | - | 查詢主題 (使用簡潔關鍵字) |
| `mode` | "code" \| "info" | ❌ | "code" | code: API 參考與範例，info: 概念指南 |
| `page` | number | ❌ | 1 | 分頁 (1-10)，首次查詢不足時使用 |

**mode 選擇指南**:

- **`mode: "code"`** (預設) - 適用於:
  - API 方法簽名查詢
  - 程式碼範例與用法
  - 具體實作指引
  - 語法驗證

- **`mode: "info"`** - 適用於:
  - 概念性說明
  - 架構設計指引
  - 最佳實踐討論
  - 原理與理論

**範例**:

#### Angular Signals 查詢
```typescript
// 步驟 1: 解析 Angular 庫 ID
resolve-library-id({ libraryName: "angular" })

// 步驟 2: 查詢 Signals API 文檔
get-library-docs({
  context7CompatibleLibraryID: "/angular/angular",
  topic: "signals",
  mode: "code",
  page: 1
})
```

#### ng-zorro-antd Table 查詢
```typescript
// 步驟 1: 解析 ng-zorro-antd 庫 ID
resolve-library-id({ libraryName: "ng-zorro-antd" })

// 步驟 2: 查詢 Table 元件文檔
get-library-docs({
  context7CompatibleLibraryID: "/ng-zorro/ng-zorro-antd",
  topic: "table",
  mode: "code",
  page: 1
})
```

#### Firebase Security Rules 查詢
```typescript
// 步驟 1: 解析 Firebase 庫 ID
resolve-library-id({ libraryName: "firebase" })

// 步驟 2: 查詢 Security Rules 概念
get-library-docs({
  context7CompatibleLibraryID: "/firebase/firebase",
  topic: "security-rules",
  mode: "info",  // 使用 info 模式獲取概念指南
  page: 1
})
```

## 📝 常用主題關鍵字

### Angular 主題

| 主題 | 關鍵字 | 說明 |
|------|--------|------|
| Signals | `signals` | signal(), computed(), effect() API |
| Standalone Components | `standalone-components` | 獨立元件語法與配置 |
| Dependency Injection | `dependency-injection` | inject() 函數與 DI 系統 |
| Routing | `routing` | Router API 與路由配置 |
| Forms | `forms` | Reactive Forms 與 Template Forms |
| Change Detection | `change-detection` | OnPush 策略與效能優化 |
| Control Flow | `control-flow` | @if, @for, @switch 新語法 |

### ng-alain 主題

| 主題 | 關鍵字 | 說明 |
|------|--------|------|
| ST Table | `st` | Simple Table 元件 API |
| Dynamic Form | `form` | SF 動態表單元件 |
| ABC Components | `abc` | 業務元件庫 |
| Authentication | `auth` | 認證服務與 Token 管理 |
| ACL | `acl` | 權限控制服務 |

### ng-zorro-antd 主題

| 主題 | 關鍵字 | 說明 |
|------|--------|------|
| Table | `table` | nz-table 元件 |
| Form | `form` | nz-form 元件 |
| Modal | `modal` | nz-modal 元件 |
| Layout | `layout` | nz-layout 元件 |
| Drawer | `drawer` | nz-drawer 元件 |

### Firebase/Firestore 主題

| 主題 | 關鍵字 | 說明 |
|------|--------|------|
| Authentication | `auth` | Firebase Authentication API |
| Security Rules | `security-rules` | Firestore Security Rules 語法 |
| Realtime | `realtime` | onSnapshot 即時訂閱 |
| Storage | `storage` | Firebase Storage API |
| Queries | `queries` | Firestore 查詢語法 |

### RxJS 主題

| 主題 | 關鍵字 | 說明 |
|------|--------|------|
| Operators | `operators` | map, filter, switchMap 等 |
| Observables | `observables` | Observable 建立與訂閱 |
| Subjects | `subjects` | Subject, BehaviorSubject |
| Error Handling | `error-handling` | catchError, retry 等 |

## 🔄 完整工作流程

### 標準查詢流程 (MUST) 🔴

**所有外部庫/框架問題都必須遵循此流程**:

```
1. 識別庫名 → 2. resolve-library-id → 3. get-library-docs → 4. 讀取 package.json → 5. 比較版本 → 6. 回答
```

**詳細步驟**:

#### 步驟 1: 識別庫名
從用戶問題中提取庫名稱：
- "Angular Signals 怎麼用?" → Angular
- "ng-alain ST 表格配置" → ng-alain
- "Firestore Security Rules" → Firebase

#### 步驟 2: 解析庫 ID
```typescript
resolve-library-id({ libraryName: "angular" })
```

**選擇標準**:
- 優先選擇完全匹配的庫
- 選擇高聲譽 (High/Medium)
- 選擇高基準分數
- 選擇文檔豐富的庫

#### 步驟 3: 獲取文檔
```typescript
get-library-docs({
  context7CompatibleLibraryID: "/angular/angular",
  topic: "signals",
  mode: "code"
})
```

**主題選擇**:
- 使用簡潔關鍵字 (避免完整問句)
- 優先使用 `mode: "code"` 獲取 API 範例
- 若需概念說明，使用 `mode: "info"`

#### 步驟 4: 讀取 package.json
```typescript
view({ path: "/home/runner/work/ng-gighub/ng-gighub/package.json" })
```

**提取版本**:
```json
{
  "dependencies": {
    "@angular/core": "^20.3.0",
    "ng-alain": "^20.1.0",
    "@angular/fire": "^20.0.1"
  }
}
```

#### 步驟 5: 比較版本
- 將 Context7 文檔版本與 package.json 版本比較
- 若版本不同，說明潛在的 API 差異
- 若有新版本，建議升級並說明破壞性變更

#### 步驟 6: 提供回答
- 使用文檔中的 API 簽名
- 提供官方程式碼範例
- 結合專案架構模式
- 標註版本特定語法

### 多頁查詢策略

**當首次查詢結果不足時**:

```typescript
// 首次查詢
get-library-docs({
  context7CompatibleLibraryID: "/angular/angular",
  topic: "signals",
  mode: "code",
  page: 1
})

// 若資訊不足，查詢第 2 頁
get-library-docs({
  context7CompatibleLibraryID: "/angular/angular",
  topic: "signals",
  mode: "code",
  page: 2
})

// 可繼續查詢至 page: 10
```

### 混合模式查詢

**先查 API，再查概念**:

```typescript
// 1. 先獲取 API 參考 (code 模式)
get-library-docs({
  context7CompatibleLibraryID: "/angular/angular",
  topic: "signals",
  mode: "code"
})

// 2. 若需深入理解，再獲取概念指南 (info 模式)
get-library-docs({
  context7CompatibleLibraryID: "/angular/angular",
  topic: "signals",
  mode: "info"
})
```

## 💰 Token 預算管理

### 查詢複雜度估算

| 查詢類型 | 預估 Token | 適用場景 |
|---------|-----------|---------|
| 簡單查詢 | 2,000-3,000 | 單一 API 方法查詢 |
| 標準查詢 | 5,000 | 元件/服務使用指南 |
| 複雜查詢 | 7,000-10,000 | 完整功能實作範例 |
| 多頁查詢 | 每頁 +3,000-5,000 | 深入主題探索 |

### 優化策略

1. **精確主題**: 使用精確關鍵字減少無關內容
   - ❌ 錯誤: `"how to use angular signals in components"`
   - ✅ 正確: `"signals"`

2. **分階段查詢**: 先 code 模式，必要時再 info 模式
   ```typescript
   // 階段 1: 獲取 API (較少 token)
   get-library-docs({ ..., mode: "code" })
   
   // 階段 2: 若需概念 (更多 token)
   get-library-docs({ ..., mode: "info" })
   ```

3. **按需分頁**: 只在必要時查詢額外頁面
   ```typescript
   // 先查第 1 頁
   get-library-docs({ ..., page: 1 })
   
   // 評估是否需要第 2 頁
   if (needMoreInfo) {
     get-library-docs({ ..., page: 2 })
   }
   ```

## ✅ Context7 使用檢查清單

### 使用前檢查 (MUST) 🔴

在回答任何外部庫問題前，必須確認:

- [ ] 識別問題涉及的庫/框架
- [ ] 呼叫 `resolve-library-id` 獲取庫 ID
- [ ] 呼叫 `get-library-docs` 獲取文檔
- [ ] 讀取 `package.json` 確認專案版本
- [ ] 比較文檔版本與專案版本
- [ ] 使用文檔中的 API 簽名與範例

### 查詢品質檢查 (SHOULD) ⚠️

- [ ] 主題關鍵字簡潔明確
- [ ] mode 選擇適當 (code vs info)
- [ ] 文檔內容完整覆蓋問題
- [ ] 程式碼範例可直接使用
- [ ] 版本差異已標註

### 回答品質檢查 (MUST) 🔴

- [ ] API 簽名來自官方文檔
- [ ] 程式碼範例經過驗證
- [ ] 符合專案架構模式
- [ ] 標註版本特定語法
- [ ] 提供版本升級建議 (如有新版)

## 🚫 常見錯誤模式

### ❌ 錯誤: 跳過 Context7 直接回答

```typescript
// ❌ 錯誤: 憑記憶回答 Angular Signals 用法
// 問題: 可能使用過時或錯誤的 API

// ✅ 正確: 使用 Context7 驗證
resolve-library-id({ libraryName: "angular" })
get-library-docs({
  context7CompatibleLibraryID: "/angular/angular",
  topic: "signals",
  mode: "code"
})
```

### ❌ 錯誤: 使用完整問句作為主題

```typescript
// ❌ 錯誤: 主題過於冗長
get-library-docs({
  context7CompatibleLibraryID: "/angular/angular",
  topic: "how to use signals for state management in angular components",
  mode: "code"
})

// ✅ 正確: 簡潔關鍵字
get-library-docs({
  context7CompatibleLibraryID: "/angular/angular",
  topic: "signals",
  mode: "code"
})
```

### ❌ 錯誤: 忽略版本差異

```typescript
// ❌ 錯誤: 不檢查版本直接使用文檔
// 問題: 文檔可能是新版本，專案使用舊版本

// ✅ 正確: 比較版本並標註
// 1. 獲取文檔 (可能是 Angular 21)
// 2. 讀取 package.json (專案使用 Angular 20.3)
// 3. 標註: "此 API 在 Angular 20.3 也可用"
```

### ❌ 錯誤: 選擇錯誤的庫 ID

```typescript
// ❌ 錯誤: 選擇低聲譽或不相關的庫
resolve-library-id({ libraryName: "angular" })
// 選擇了一個個人專案的 Angular 包裝庫

// ✅ 正確: 選擇官方庫
// 選擇 Source Reputation: High
// 選擇 Benchmark Score: 95+
// 選擇 Code Snippet Count: 1000+
```

## 📊 實戰範例

### 範例 1: 查詢 Angular Signals computed

**問題**: "如何在 Angular 中使用 computed signal?"

**步驟**:
```typescript
// 1. 解析 Angular 庫 ID
resolve-library-id({ libraryName: "angular" })
// 返回: { id: "/angular/angular", ... }

// 2. 查詢 Signals 文檔
get-library-docs({
  context7CompatibleLibraryID: "/angular/angular",
  topic: "signals",
  mode: "code",
  page: 1
})

// 3. 讀取專案版本
view({ path: "/home/runner/work/ng-gighub/ng-gighub/package.json" })
// "@angular/core": "^20.3.0"

// 4. 提供回答 (基於文檔 + 專案架構)
```

**回答**:
```typescript
import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-task-list',
  standalone: true,
  template: `
    <p>總任務數: {{ totalTasks() }}</p>
    <p>完成任務數: {{ completedTasks() }}</p>
  `
})
export class TaskListComponent {
  // 可寫 signal
  tasks = signal<Task[]>([]);
  
  // 計算 signal (衍生狀態)
  totalTasks = computed(() => this.tasks().length);
  completedTasks = computed(() => 
    this.tasks().filter(t => t.status === 'completed').length
  );
}
```

**說明**: 此範例使用 Angular 20.3 的 Signals API，`computed()` 自動追蹤依賴並在 `tasks` 變更時重新計算。

### 範例 2: 查詢 ng-zorro-antd Table 配置

**問題**: "如何配置 nz-table 的排序和篩選?"

**步驟**:
```typescript
// 1. 解析 ng-zorro-antd 庫 ID
resolve-library-id({ libraryName: "ng-zorro-antd" })
// 返回: { id: "/ng-zorro/ng-zorro-antd", ... }

// 2. 查詢 Table 文檔
get-library-docs({
  context7CompatibleLibraryID: "/ng-zorro/ng-zorro-antd",
  topic: "table",
  mode: "code",
  page: 1
})

// 3. 若資訊不足，查詢第 2 頁
get-library-docs({
  context7CompatibleLibraryID: "/ng-zorro/ng-zorro-antd",
  topic: "table",
  mode: "code",
  page: 2
})
```

### 範例 3: 查詢 Firebase Security Rules 語法

**問題**: "如何在 Firestore Security Rules 中檢查使用者權限?"

**步驟**:
```typescript
// 1. 解析 Firebase 庫 ID
resolve-library-id({ libraryName: "firebase" })
// 返回: { id: "/firebase/firebase", ... }

// 2. 先查詢 API 範例 (code 模式)
get-library-docs({
  context7CompatibleLibraryID: "/firebase/firebase",
  topic: "security-rules",
  mode: "code",
  page: 1
})

// 3. 若需深入理解，再查詢概念 (info 模式)
get-library-docs({
  context7CompatibleLibraryID: "/firebase/firebase",
  topic: "security-rules",
  mode: "info",
  page: 1
})
```

## 🎯 決策樹

### 何時使用 Context7?

```
是否涉及外部庫/框架 API?
├─ 是 → 必須使用 Context7 🔴
│   └─ 有絕對把握嗎?
│       ├─ 是 → 仍應使用 Context7 驗證
│       └─ 否 → 必須使用 Context7 🔴
└─ 否 → 可直接回答
    └─ 範例: 通用 JavaScript、專案內部程式碼
```

### mode 選擇決策

```
需要什麼類型的資訊?
├─ API 方法簽名 → mode: "code"
├─ 程式碼範例 → mode: "code"
├─ 實作指引 → mode: "code"
├─ 概念說明 → mode: "info"
├─ 架構設計 → mode: "info"
└─ 不確定 → 先 "code"，若不足再 "info"
```

### 分頁策略決策

```
首次查詢結果是否充足?
├─ 是 → 直接使用
└─ 否 → 查詢下一頁
    └─ 最多查詢至 page: 10
```

## 📚 參考資源

- Context7 文檔: https://context7.com/docs
- GigHub package.json: `/home/runner/work/ng-gighub/ng-gighub/package.json`

---

**版本**: v1.0  
**最後更新**: 2025-12-18  
**維護者**: GigHub 開發團隊
