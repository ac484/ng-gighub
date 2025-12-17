# GigHub Blueprint System V2.0 - Complete Specification
# 藍圖系統 2.0 完整規範

> **Version**: 2.0.0 (Breaking Changes)  
> **Status**: Planning Phase  
> **Tech Stack**: Angular 20 + @angular/fire 20.0.1 + Firestore  
> **Last Updated**: 2025-01-09

---

## 📋 Executive Summary (執行摘要)

本文檔基於 `setc.md` (Expandable Container Layer Specification)，針對 GigHub 專案重新設計藍圖系統，實現：

1. **無限模組擴展**：動態載入/卸載，零耦合設計
2. **取代現有設計**：不向後兼容，清除技術債務
3. **Firebase 整合**：使用 @angular/fire (非 Firebase)
4. **現代化架構**：Angular 20 Signals + Standalone Components

---

## 1. 系統架構總覽

### 1.1 核心元件

\`\`\`
Blueprint Container (藍圖容器)
├── Module Registry      # 模組註冊與管理
├── Lifecycle Manager    # 生命週期協調
├── Event Bus           # 模組間通訊
├── Shared Context      # 共享上下文
├── Resource Provider   # 依賴注入
└── Config Manager      # 配置管理
\`\`\`

### 1.2 設計原則

| 原則 | 說明 | 實作方式 |
|------|------|---------|
| **零耦合** | 模組間無直接依賴 | Event Bus 通訊 |
| **隔離性** | 模組錯誤不影響系統 | Try-Catch + 沙箱 |
| **可擴展** | 無限新增模組 | 動態載入機制 |
| **租戶隔離** | 多租戶資料分離 | Firestore RLS |
| **審計追蹤** | 完整操作記錄 | Event Sourcing |

---

## 2. 模組規範 (Module Specification)

### 2.1 模組介面

\`\`\`typescript
/**
 * 藍圖模組介面 - 所有模組必須實作
 */
export interface IBlueprintModule {
  // 識別資訊
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly dependencies: string[];
  
  // 狀態管理 (使用 Signal)
  readonly status: Signal<ModuleStatus>;
  
  // 生命週期方法
  init(context: IExecutionContext): Promise<void>;
  start(): Promise<void>;
  ready(): Promise<void>;
  stop(): Promise<void>;
  dispose(): Promise<void>;
  
  // 匯出 API (可選)
  exports?: Record<string, any>;
}

export enum ModuleStatus {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  READY = 'ready',
  RUNNING = 'running',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  ERROR = 'error'
}
\`\`\`

### 2.2 模組實作範例

\`\`\`typescript
import { Injectable, signal } from '@angular/core';

@Injectable()
export class TasksModule implements IBlueprintModule {
  readonly id = 'tasks';
  readonly name = '任務管理';
  readonly version = '1.0.0';
  readonly dependencies = ['context', 'logger'];
  readonly status = signal<ModuleStatus>(ModuleStatus.UNINITIALIZED);
  
  private context?: IExecutionContext;
  
  async init(context: IExecutionContext): Promise<void> {
    this.status.set(ModuleStatus.INITIALIZING);
    this.context = context;
    
    // 訂閱事件
    context.eventBus.on('TASK_CREATED', this.onTaskCreated.bind(this));
    
    this.status.set(ModuleStatus.READY);
  }
  
  async start(): Promise<void> {
    this.status.set(ModuleStatus.RUNNING);
  }
  
  async ready(): Promise<void> {
    console.log('[TasksModule] Ready');
  }
  
  async stop(): Promise<void> {
    this.status.set(ModuleStatus.STOPPED);
  }
  
  async dispose(): Promise<void> {
    this.context?.eventBus.off('TASK_CREATED', this.onTaskCreated.bind(this));
  }
  
  private onTaskCreated(event: any): void {
    // 處理事件
  }
  
  exports = {
    createTask: (data: any) => {
      return this.context?.eventBus.emit('TASK_CREATE', data, 'tasks');
    }
  };
}
\`\`\`

---

## 3. 事件總線 (Event Bus)

### 3.1 事件介面

\`\`\`typescript
export interface IBlueprintEvent<T = any> {
  type: string;              // 事件類型
  payload: T;               // 事件資料
  timestamp: number;        // 時間戳記
  source: string;           // 來源模組
  id: string;               // 事件 ID
  context: {                // 執行上下文
    blueprintId: string;
    userId: string;
  };
}

export interface IEventBus {
  emit<T>(type: string, payload: T, source: string): void;
  on<T>(type: string, handler: EventHandler<T>): () => void;
  off<T>(type: string, handler: EventHandler<T>): void;
  once<T>(type: string, handler: EventHandler<T>): () => void;
  getHistory(type?: string, limit?: number): IBlueprintEvent[];
}
\`\`\`

### 3.2 標準事件類型

\`\`\`typescript
export enum BlueprintEventType {
  // 容器生命週期
  CONTAINER_INITIALIZED = 'CONTAINER_INITIALIZED',
  CONTAINER_STARTED = 'CONTAINER_STARTED',
  CONTAINER_STOPPED = 'CONTAINER_STOPPED',
  
  // 模組生命週期
  MODULE_REGISTERED = 'MODULE_REGISTERED',
  MODULE_LOADED = 'MODULE_LOADED',
  MODULE_UNLOADED = 'MODULE_UNLOADED',
  MODULE_ERROR = 'MODULE_ERROR',
  
  // 藍圖操作
  BLUEPRINT_CREATED = 'BLUEPRINT_CREATED',
  BLUEPRINT_UPDATED = 'BLUEPRINT_UPDATED',
  BLUEPRINT_DELETED = 'BLUEPRINT_DELETED',
  
  // 業務事件
  TASK_CREATED = 'TASK_CREATED',
  TASK_UPDATED = 'TASK_UPDATED',
  LOG_CREATED = 'LOG_CREATED',
  QUALITY_CHECK_REQUESTED = 'QUALITY_CHECK_REQUESTED'
}
\`\`\`

---

## 4. 共享上下文 (Shared Context)

### 4.1 執行上下文

\`\`\`typescript
export interface IExecutionContext {
  blueprintId: string;
  tenant: TenantInfo;
  eventBus: IEventBus;
  resources: IResourceProvider;
  config: IBlueprintConfig;
  logger: LoggerService;
  use<T>(resourceName: string): T;
}

export interface TenantInfo {
  organizationId: string;
  teamId?: string;
  userId: string;
  contextType: 'organization' | 'team' | 'user';
}
\`\`\`

---

## 5. 資源提供者 (Resource Provider)

### 5.1 資源管理

\`\`\`typescript
@Injectable({ providedIn: 'root' })
export class ResourceProvider implements IResourceProvider {
  private resources = new Map<string, any>();
  
  constructor(
    private injector: Injector,
    private logger: LoggerService
  ) {
    this.registerDefaultResources();
  }
  
  register<T>(name: string, factory: () => T): void {
    this.resources.set(name, factory);
  }
  
  get<T>(name: string): T {
    const factory = this.resources.get(name);
    if (!factory) throw new Error(\`Resource '\${name}' not found\`);
    
    // 懶載入：第一次取得時才建立實例
    if (typeof factory === 'function') {
      const instance = factory();
      this.resources.set(name, instance);
      return instance;
    }
    return factory;
  }
  
  private registerDefaultResources(): void {
    // Firebase/Firestore
    this.register('firestore', () => this.injector.get(Firestore));
    this.register('auth', () => this.injector.get(Auth));
    this.register('logger', () => this.injector.get(LoggerService));
  }
}
\`\`\`

---

## 6. 生命週期管理 (Lifecycle Manager)

### 6.1 生命週期流程

\`\`\`
初始化階段
1. Validate Blueprint Config
2. Resolve Module Dependencies
3. Create Container
4. Initialize Context
5. Register Modules
6. Start Modules

執行階段
module.init() → module.start() → module.ready() 
→ [Running...] → module.stop() → module.dispose()

錯誤處理
- init() 失敗 → 阻止載入
- start() 失敗 → 回滾容器
- runtime 錯誤 → 隔離模組
\`\`\`

### 6.2 實作

\`\`\`typescript
@Injectable()
export class LifecycleManager {
  private modules = new Map<string, IBlueprintModule>();
  private loadedModules = signal<string[]>([]);
  
  async loadModule(
    module: IBlueprintModule, 
    context: IExecutionContext
  ): Promise<void> {
    try {
      // 1. 檢查依賴
      await this.checkDependencies(module);
      
      // 2. 初始化模組
      await module.init(context);
      
      // 3. 註冊模組
      this.modules.set(module.id, module);
      this.loadedModules.update(m => [...m, module.id]);
      
      // 4. 發布事件
      context.eventBus.emit(
        BlueprintEventType.MODULE_LOADED,
        { moduleId: module.id },
        'lifecycle-manager'
      );
    } catch (error) {
      context.logger.error('Failed to load module', error);
      throw error;
    }
  }
  
  async startModule(moduleId: string): Promise<void> {
    const module = this.modules.get(moduleId);
    if (!module) throw new Error(\`Module '\${moduleId}' not found\`);
    
    try {
      await module.start();
      await module.ready();
    } catch (error) {
      await this.stopModule(moduleId); // 回滾
      throw error;
    }
  }
  
  async stopModule(moduleId: string): Promise<void> {
    const module = this.modules.get(moduleId);
    if (module) await module.stop();
  }
  
  async unloadModule(moduleId: string): Promise<void> {
    const module = this.modules.get(moduleId);
    if (!module) return;
    
    await this.stopModule(moduleId);
    await module.dispose();
    this.modules.delete(moduleId);
    this.loadedModules.update(m => m.filter(id => id !== moduleId));
  }
  
  private async checkDependencies(module: IBlueprintModule): Promise<void> {
    for (const dep of module.dependencies) {
      if (!this.modules.has(dep)) {
        throw new Error(\`Missing dependency: \${dep}\`);
      }
    }
  }
}
\`\`\`

---

## 7. Firestore 資料模型

### 7.1 Collection 結構

\`\`\`
/blueprints/{blueprintId}
  - id: string
  - name: string
  - slug: string
  - description: string
  - ownerId: string
  - ownerType: 'organization' | 'team' | 'user'
  - status: 'draft' | 'active' | 'archived'
  - config: BlueprintConfig
  - enabledModules: string[]
  - createdBy: string
  - createdAt: Timestamp
  - updatedAt: Timestamp
  - deletedAt: Timestamp | null
  
  /modules/{moduleId}
    - id: string
    - name: string
    - version: string
    - enabled: boolean
    - config: Record<string, any>
    - installedAt: Timestamp
  
  /members/{userId}
    - userId: string
    - role: 'owner' | 'admin' | 'member'
    - joinedAt: Timestamp
  
  /audit-logs/{logId}
    - action: string
    - userId: string
    - timestamp: Timestamp
    - changes: Record<string, any>
\`\`\`

### 7.2 Security Rules

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /blueprints/{blueprintId} {
      // 讀取：成員可讀
      allow read: if isAuthenticated() && 
        isBlueprintMember(blueprintId);
      
      // 建立：已認證用戶
      allow create: if isAuthenticated();
      
      // 更新：管理員
      allow update: if isAuthenticated() && 
        isBlueprintAdmin(blueprintId);
      
      // 刪除：擁有者
      allow delete: if isAuthenticated() && 
        isBlueprintOwner(blueprintId);
      
      // 模組子集合
      match /modules/{moduleId} {
        allow read: if isBlueprintMember(blueprintId);
        allow write: if isBlueprintAdmin(blueprintId);
      }
      
      // 成員子集合
      match /members/{userId} {
        allow read: if isBlueprintMember(blueprintId);
        allow write: if isBlueprintAdmin(blueprintId);
      }
      
      // 審計日誌
      match /audit-logs/{logId} {
        allow read: if isBlueprintMember(blueprintId);
        allow create: if isAuthenticated();
        allow update, delete: if false;
      }
    }
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isBlueprintMember(blueprintId) {
      return exists(/databases/$(database)/documents/blueprints/$(blueprintId)/members/$(request.auth.uid));
    }
    
    function isBlueprintAdmin(blueprintId) {
      let member = get(/databases/$(database)/documents/blueprints/$(blueprintId)/members/$(request.auth.uid));
      return member.data.role in ['admin', 'owner'];
    }
    
    function isBlueprintOwner(blueprintId) {
      let member = get(/databases/$(database)/documents/blueprints/$(blueprintId)/members/$(request.auth.uid));
      return member.data.role == 'owner';
    }
  }
}
\`\`\`

---

## 8. 目錄結構

\`\`\`
src/app/
├── core/
│   └── blueprint/
│       ├── container/
│       │   ├── blueprint-container.ts
│       │   ├── module-registry.ts
│       │   ├── lifecycle-manager.ts
│       │   └── resource-provider.ts
│       ├── context/
│       │   ├── shared-context.ts
│       │   ├── execution-context.interface.ts
│       │   └── workspace-context.ts
│       ├── events/
│       │   ├── event-bus.ts
│       │   ├── event-bus.interface.ts
│       │   └── event-types.ts
│       ├── modules/
│       │   ├── module.interface.ts
│       │   ├── module-metadata.ts
│       │   └── module-loader.ts
│       └── config/
│           ├── blueprint-config.interface.ts
│           └── module-config.interface.ts
├── routes/
│   └── blueprint/
│       ├── blueprint-list.component.ts
│       ├── blueprint-detail.component.ts
│       ├── blueprint-designer.component.ts  # 新增
│       └── modules/
│           ├── tasks/
│           │   ├── tasks.module.ts
│           │   ├── tasks.component.ts
│           │   └── tasks.service.ts
│           ├── logs/
│           └── quality/
└── shared/
    ├── services/
    │   └── blueprint/
    │       ├── blueprint.repository.ts
    │       ├── blueprint.service.ts
    │       └── blueprint-module.repository.ts
    └── models/
        └── blueprint.model.ts
\`\`\`

---

## 9. 藍圖配置範例

### 9.1 YAML 配置

\`\`\`yaml
blueprint:
  name: "工地管理標準版"
  version: "2.0.0"
  description: "包含任務、日誌、品質驗收的完整方案"

modules:
  - id: "tasks"
    enabled: true
    order: 1
    config:
      maxTasksPerDay: 50
      autoAssignment: true
  
  - id: "logs"
    enabled: true
    order: 2
    config:
      retentionDays: 90
  
  - id: "quality"
    enabled: true
    order: 3
    config:
      checklistRequired: true

config:
  featureFlags:
    enableRealtime: true
    enableNotifications: true
  
  theme:
    primaryColor: "#1890ff"
    layout: "side"

permissions:
  roles:
    admin: ["*"]
    manager: ["blueprint.read", "blueprint.update"]
    member: ["blueprint.read", "module.tasks.read"]
\`\`\`

### 9.2 TypeScript 配置

\`\`\`typescript
export interface BlueprintConfig {
  name: string;
  version: string;
  description: string;
  modules: ModuleConfig[];
  config: {
    featureFlags: Record<string, boolean>;
    theme?: {
      primaryColor: string;
      layout: string;
    };
  };
  permissions: {
    roles: Record<string, string[]>;
  };
}

export interface ModuleConfig {
  id: string;
  enabled: boolean;
  order?: number;
  config?: Record<string, any>;
}
\`\`\`

---

## 10. 實作計畫

### Phase 1: 核心架構 (Week 1-2)
- [ ] Blueprint Container
- [ ] Module Registry
- [ ] Lifecycle Manager
- [ ] Event Bus
- [ ] Shared Context
- [ ] Resource Provider

### Phase 2: Firestore 整合 (Week 3)
- [ ] 設計資料模型
- [ ] Blueprint Repository
- [ ] Module Repository
- [ ] Security Rules
- [ ] 審計日誌系統

### Phase 3: UI 元件 (Week 4-5)
- [ ] 重構 Blueprint List
- [ ] 重構 Blueprint Detail
- [ ] Blueprint Designer (視覺化設計器)
- [ ] Module Manager UI

### Phase 4: 模組遷移 (Week 6-7)
- [ ] Tasks 模組
- [ ] Logs 模組
- [ ] Quality 模組
- [ ] 模組開發文檔

### Phase 5: 測試與優化 (Week 8)
- [ ] 單元測試
- [ ] 整合測試
- [ ] 效能優化
- [ ] 部署上線

---

## 11. 模組開發指南

### 11.1 建立新模組

**步驟 1：建立目錄結構**
\`\`\`bash
src/app/routes/blueprint/modules/my-module/
├── my-module.module.ts       # 模組實作
├── my-module.component.ts    # UI 元件
├── my-module.service.ts      # 業務邏輯
└── module.metadata.ts        # 元資料
\`\`\`

**步驟 2：實作模組介面**
\`\`\`typescript
@Injectable()
export class MyModule implements IBlueprintModule {
  readonly id = 'my-module';
  readonly name = '我的模組';
  readonly version = '1.0.0';
  readonly dependencies = ['context'];
  readonly status = signal<ModuleStatus>(ModuleStatus.UNINITIALIZED);
  
  async init(context: IExecutionContext): Promise<void> {
    // 初始化邏輯
  }
  
  async start(): Promise<void> {
    // 啟動邏輯
  }
  
  // ... 其他生命週期方法
}
\`\`\`

**步驟 3：註冊模組**
\`\`\`typescript
// 在 module-registry.ts
registry.register({
  id: 'my-module',
  factory: () => new MyModule()
});
\`\`\`

**步驟 4：在藍圖配置中啟用**
\`\`\`yaml
modules:
  - id: "my-module"
    enabled: true
    order: 10
\`\`\`

### 11.2 模組通訊範例

\`\`\`typescript
// 模組 A：發送事件
export class ModuleA implements IBlueprintModule {
  async doSomething(): Promise<void> {
    this.context?.eventBus.emit(
      'MODULE_A_COMPLETED',
      { data: 'result' },
      this.id
    );
  }
}

// 模組 B：接收事件
export class ModuleB implements IBlueprintModule {
  async init(context: IExecutionContext): Promise<void> {
    context.eventBus.on('MODULE_A_COMPLETED', (event) => {
      console.log('Received:', event.payload);
    });
  }
}
\`\`\`

---

## 12. 測試策略

### 12.1 單元測試

\`\`\`typescript
describe('EventBus', () => {
  let eventBus: EventBus;
  
  beforeEach(() => {
    eventBus = new EventBus();
  });
  
  it('should emit and receive events', (done) => {
    const payload = { data: 'test' };
    
    eventBus.on('TEST_EVENT', (event) => {
      expect(event.payload).toEqual(payload);
      done();
    });
    
    eventBus.emit('TEST_EVENT', payload, 'test');
  });
});
\`\`\`

### 12.2 整合測試

\`\`\`typescript
describe('Blueprint Container', () => {
  it('should load modules in dependency order', async () => {
    const container = new BlueprintContainer();
    const module1 = new TestModule('m1', []);
    const module2 = new TestModule('m2', ['m1']);
    
    await container.loadModule(module1);
    await container.loadModule(module2);
    await container.start();
    
    expect(module1.status()).toBe(ModuleStatus.RUNNING);
    expect(module2.status()).toBe(ModuleStatus.RUNNING);
  });
});
\`\`\`

---

## 13. 效能優化

### 13.1 懶載入

\`\`\`typescript
// 模組懶載入
const loadModule = async (id: string): Promise<IBlueprintModule> => {
  switch (id) {
    case 'tasks':
      return (await import('./modules/tasks/tasks.module')).TasksModule;
    case 'logs':
      return (await import('./modules/logs/logs.module')).LogsModule;
    default:
      throw new Error(\`Unknown module: \${id}\`);
  }
};
\`\`\`

### 13.2 快取策略

\`\`\`typescript
@Injectable()
export class BlueprintCacheService {
  private cache = new Map<string, Blueprint>();
  private readonly TTL = 5 * 60 * 1000; // 5 分鐘
  
  get(id: string): Blueprint | null {
    const cached = this.cache.get(id);
    if (cached && this.isValid(cached)) {
      return cached;
    }
    return null;
  }
  
  set(id: string, blueprint: Blueprint): void {
    this.cache.set(id, blueprint);
  }
}
\`\`\`

---

## 14. 安全性考量

### 14.1 模組沙箱
- ✅ 模組無法直接存取 Firestore
- ✅ 模組間零耦合
- ✅ 所有通訊透過 Event Bus
- ✅ 模組錯誤不影響系統

### 14.2 權限控制
\`\`\`typescript
@Injectable()
export class PermissionService {
  checkModulePermission(
    userId: string, 
    moduleId: string, 
    action: string
  ): boolean {
    // 實作權限檢查邏輯
    return true;
  }
}
\`\`\`

### 14.3 資料隔離
- ✅ 組織級別隔離
- ✅ 團隊級別隔離
- ✅ 用戶級別隔離
- ✅ Firestore Rules 強制執行

---

## 15. 遷移指南

### 15.1 不相容變更

**移除**：
- ❌ 舊的 Blueprint 資料結構
- ❌ 直接的模組相依
- ❌ 同步載入方式

**新增**：
- ✅ 事件驅動架構
- ✅ 動態模組載入
- ✅ 統一生命週期管理

### 15.2 遷移步驟

1. **備份資料**
   \`\`\`bash
   gcloud firestore export gs://[BUCKET]/backup
   \`\`\`

2. **執行資料遷移腳本**
   \`\`\`typescript
   async function migrateBluept(): Promise<void> {
     // 轉換資料格式
   }
   \`\`\`

3. **更新前端程式碼**
   - 使用新的 Blueprint Service
   - 移除舊的模組相依
   - 採用新的事件系統

4. **測試與驗證**
   - 完整測試套件
   - 手動測試關鍵流程

---

## 16. FAQ

**Q: 如何新增自訂模組？**  
A: 參考§11模組開發指南

**Q: 模組如何通訊？**  
A: 透過 Event Bus 發布/訂閱事件

**Q: 如何確保安全性？**  
A: Firestore Security Rules + 模組沙箱

**Q: 如何處理模組失敗？**  
A: Lifecycle Manager 捕獲錯誤並隔離模組

**Q: 支援熱更新嗎？**  
A: 是的，透過 unloadModule 和 loadModule

---

## 17. 參考資料

### 官方文檔
- [Angular 20](https://angular.dev/docs/v20)
- [AngularFire](https://github.com/angular/angularfire)
- [Firebase](https://firebase.google.com/docs)
- [ng-alain](https://ng-alain.com)

### 設計模式
- Domain-Driven Design (DDD)
- Event-Driven Architecture (EDA)
- Dependency Injection Pattern
- Repository Pattern

---

**文檔版本**: 2.0.0  
**維護者**: GigHub Development Team  
**最後更新**: 2025-01-09

