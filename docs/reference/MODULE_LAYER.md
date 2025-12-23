# 模組層架構設計文檔 (Module Layer)

> 文件版本: 3.23.0  
> 更新日期: 2025-12-16  
> 文件性質: 模組定義與標準規範

---

## 目錄

1. [整體設計原則](#一整體設計原則)
2. [模組定義與規範](#二模組定義與規範)
3. [模組標準骨架](#三模組標準骨架)

---

## 一、整體設計原則

注意：本文件的目錄與結構部分已統一採用 [docs/reference/Skeleton.md](docs/reference/Skeleton.md) 作為權威來源，請以該文件為主要參照。

### 核心理念

**最重要的一條鐵律：**
> Blueprint Layer 永遠不應該知道「資料長什麼樣子」，只知道「事件、規則與流程」。

**模組與 Blueprint 的分工：**
> 模組負責「把一件事做好」，Blueprint 負責「把事情串起來」。

### 系統特性

- 系統採 **事件驅動（Event-Driven）流程**
- 模組彼此解耦，透過事件與 Facade 溝通
- 所有狀態變更皆可被稽核（Audit Log）
- 核心實體（Contract / Task / Issue / Acceptance / Finance）皆具備獨立生命週期
- 自動節點不包含 UI 行為，僅負責狀態推進與資料產生

### 模組互動原則

**每個模組只做兩件事：**
1. 發事件（我完成了什麼）
2. 訂閱事件（我對哪些事有反應）

---

## 二、模組定義與規範

### 2.1 模組的定義

**一句話定義：**
> 模組是「擁有明確業務語意與完整生命週期的 Domain 邊界」

**模組必須具備的條件（缺一不可）：**

| 條件 | 說明 |
|------|------|
| 業務語意 | 能回答「我在管什麼」 |
| 核心實體 | 至少一個 Aggregate Root |
| 生命週期 | 明確狀態流轉 |
| 邊界 | 不被其他模組直接操作資料 |
| 對外介面 | 只能透過 Facade / Events |

### 2.2 模組的責任範圍

**模組「可以」負責：**
- Domain Entity / Value Object
- 狀態轉換（State Machine）
- Domain Service
- Domain Event（發佈）
- Repository Interface
- Facade（對外 API）

**模組「不能」負責：**
- ❌ 跨模組流程協調
- ❌ 全系統規則（Policy）
- ❌ Queue / Retry / Orchestration
- ❌ UI 權限決策（只能回傳結果）
- ❌ 其他模組的資料修改

### 2.3 標準模組目錄結構（強制）

```
/src/app/core/blueprint/modules/implementations/<module-name>/
├─ models/              # Entity / Value Object
├─ states/              # 狀態定義與轉移
├─ services/            # Domain Services
├─ repositories/        # Repository Interface + Impl
├─ events/              # Domain Event 定義
├─ policies/            # 模組內規則（非系統級）
├─ facade/              # 對外操作入口（唯一）
├─ config/              # 模組設定
├─ module.metadata.ts   # 模組描述（名稱、事件、能力）
├─ <module>.module.ts   # DI / Module 定義
└─ README.md            # 模組說明
```

> ❗ 任何跨模組呼叫，只能透過 `facade/`

### 2.4 各資料夾責任說明

#### `/models`

**用途：**
- 定義 Domain Entity
- 定義 Value Object
- 定義 Aggregate Root

**禁止事項：**
- ❌ 不包含 CRUD
- ❌ 不包含 API / UI 邏輯
- ❌ 不存取 Repository

#### `/states`

**用途：**
- 狀態 enum
- 狀態轉移表
- State Machine

```typescript
TaskState: CREATED → IN_PROGRESS → COMPLETED
```

**禁止事項：**
- ❌ 不直接改資料
- ❌ 不呼叫其他模組

#### `/services`

**用途：**
- 實作業務行為
- 執行狀態轉換
- 發佈 Domain Event

**允許：**
- 呼叫本模組 Repository
- 呼叫 Blueprint EventBus
- 使用本模組 Policy

#### `/repositories`

**用途：**
- 資料存取抽象
- Infrastructure 與 Domain 的隔離層

**規範：**
- Interface + Implementation 分離
- Domain 不知道資料來源

#### `/events`

**用途：**
- 定義模組可發佈的 Domain Event
- 定義 Event Payload Schema

**規範：**
- 事件命名必須以模組為前綴

```typescript
task.created
task.completed
```

#### `/policies`（模組內）

**用途：**
- 僅限本模組的業務規則
- 不跨模組

**範例：**
- 任務完成條件
- 狀態合法性檢查

#### `/facade`

> ⚠️ **最重要的一層** - Facade 是模組對外的唯一入口

**責任：**
- 接收外部請求
- 驗證 Policy
- 呼叫 Domain Service
- 回傳結果
- 發佈事件（或由 Service 發）

**禁止：**
- ❌ 不直接操作 DB
- ❌ 不寫跨模組流程
- ❌ 不寫 UI 邏輯

#### `/module.metadata.ts`

**用途：**
- 描述模組能力
- 宣告事件清單
- 宣告對外 API

**範例：**
```typescript
export const TaskModuleMetadata = {
  name: 'task',
  events: ['task.created', 'task.completed'],
  capabilities: ['assign', 'complete', 'schedule']
};
```

### 2.5 模組與模組之間的互動規則（鐵律）

**只允許三種互動方式：**

| 方式 | 說明 |
|------|------|
| Event | 非同步反應 |
| Facade | 明確指令 |
| Query | Read-only |

**❌ 禁止行為：**
- 直接存取別的 Repository
- 直接 new 別的 Service
- 改寫別的模組狀態

### 2.6 模組事件規範（強制）

**事件必須是「事實」：**
- ✅ `task.completed`
- ❌ `completeTask`

**Payload 原則：**
- 不包含 Domain Entity
- 只包含識別資訊

### 2.7 模組成熟度檢查表

- [ ] 是否只有 Facade 對外？
- [ ] 是否沒有直接依賴其他模組？
- [ ] 是否所有狀態轉移集中管理？
- [ ] 是否所有跨模組行為都是事件？
- [ ] 是否無 Blueprint 反向依賴？

---

## 三、模組標準骨架

### 3.1 模組資料夾骨架（標準）

```
/src/app/core/blueprint/modules/implementations/<module-name>/
├─ models/
│  └─ index.ts
│
├─ states/
│  └─ <module>.states.ts
│
├─ services/
│  ├─ <module>.service.ts
│  └─ index.ts
│
├─ repositories/
│  ├─ <module>.repository.ts        # Interface
│  ├─ <module>.repository.impl.ts   # Implementation
│  └─ index.ts
│
├─ events/
│  ├─ <module>.events.ts
│  └─ index.ts
│
├─ policies/
│  ├─ <module>.policies.ts
│  └─ index.ts
│
├─ facade/
│  ├─ <module>.facade.ts
│  └─ index.ts
│
├─ config/
│  └─ <module>.config.ts
│
├─ module.metadata.ts
├─ <module>.module.ts
└─ README.md
```

> `<module-name>` 例如：task、issue、contract（UI 對應的畫面則放在 `/src/app/routes/<module-name>/`）

### 3.2 每個檔案的最小骨架內容

> 以下內容不是示例，是標準起手式。

#### `/models/index.ts`

```typescript
export * from './<module>.entity';
export * from './<module>.value-object';
```

> ❗ models 只放純 Domain 結構

#### `/states/<module>.states.ts`

```typescript
export enum <Module>State {
  CREATED = 'CREATED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export const <Module>StateTransitions = {
  CREATED: ['IN_PROGRESS'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: [],
};
```

> ❗ 所有狀態轉移必須集中在這裡

#### `/services/<module>.service.ts`

```typescript
export class <Module>Service {
  constructor(
    private readonly repository: <Module>Repository,
  ) {}

  executeAction(params: any) {
    // 1. 驗證 policy
    // 2. 狀態轉移
    // 3. 儲存資料
    // 4. 發佈事件
  }
}
```

#### `/services/index.ts`

```typescript
export * from './<module>.service';
```

#### `/repositories/<module>.repository.ts`

```typescript
import { <Module> } from '../models';

export interface <Module>Repository {
  findById(id: string): Promise<<Module> | null>;
  save(entity: <Module>): Promise<void>;
}
```

#### `/repositories/<module>.repository.impl.ts`

```typescript
import { <Module>Repository } from './<module>.repository';

export class <Module>RepositoryImpl implements <Module>Repository {
  async findById(id: string) {
    // Infrastructure implementation
    return null;
  }

  async save(entity: any) {
    // Infrastructure implementation
  }
}
```

#### `/events/<module>.events.ts`

```typescript
export const <Module>Events = {
  CREATED: '<module>.created',
  UPDATED: '<module>.updated',
  COMPLETED: '<module>.completed',
} as const;
```

> ❗ 事件命名一定要：`<module>.<fact>`

#### `/events/index.ts`

```typescript
export * from './<module>.events';
```

#### `/policies/<module>.policies.ts`

```typescript
export class <Module>Policies {
  static canExecute(currentState: string): boolean {
    return currentState !== 'COMPLETED';
  }
}
```

> ❗ Policy 只回傳 boolean 或錯誤原因

#### `/policies/index.ts`

```typescript
export * from './<module>.policies';
```

#### `/facade/<module>.facade.ts`

```typescript
export class <Module>Facade {
  constructor(
    private readonly service: <Module>Service,
  ) {}

  async executeCommand(command: any) {
    // 1. 驗證輸入
    // 2. 呼叫 service
    return this.service.executeAction(command);
  }
}
```

> ⚠️ 外部只能呼叫 Facade

#### `/facade/index.ts`

```typescript
export * from './<module>.facade';
```

#### `/config/<module>.config.ts`

```typescript
export const <Module>Config = {
  enableEvents: true,
};
```

#### `/module.metadata.ts`

```typescript
export const <Module>ModuleMetadata = {
  name: '<module>',
  description: '<module> domain module',
  events: [
    '<module>.created',
    '<module>.updated',
  ],
  capabilities: [
    'create',
    'update',
    'complete',
  ],
};
```

#### `/<module>.module.ts`

```typescript
import { Module } from '@angular/core';

@Module({
  providers: [
    // RepositoryImpl
    // Service
    // Facade
  ],
})
export class <Module>Module {}
```

#### `/README.md`

```markdown
# <Module> Module

## Purpose
本模組負責：

- XXX
- XXX

## Aggregate Root
- <Module>

## Events
- <module>.created
- <module>.updated

## Facade API
- executeCommand()

## Notes
- 本模組不得直接依賴其他模組
```

### 3.3 使用規範（請貼在 README 或 Blueprint）

**新增模組流程（強制）：**

1. 建立資料夾
2. 補齊 `README.md`
3. 定義 `module.metadata.ts`
4. 只開放 Facade
5. 事件一律從 Service 發出

---

## 結語

### 本文件定義的是：

- **模組內部結構**
- **模組責任邊界**
- **模組互動規則**
- **模組標準骨架**

### 不描述：

- Blueprint Layer 流程協調
- 跨模組工作流程
- 系統級策略與審計

### 此文件可作為：

- 模組設計規範
- 新模組建立指南
- 模組程式碼審查基準
- 模組架構驗收標準

---

## 最重要的提醒

> **如果你不知道某段程式該放哪裡，那代表這段設計本身有問題。**

---
