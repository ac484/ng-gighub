# Workflow / Process Domain (流程域)

> **Domain ID**: `workflow`  
> **Version**: 1.0.0  
> **Status**: Ready for Implementation  
> **Architecture**: Blueprint Container Module  
> **Priority**: P1 (必要)

## 📋 Overview

流程域負責所有可組態的流程管理，提供自訂流程建立器、狀態機配置、自動化觸發器、流程模板及審批流程等功能。本模組遵循 Blueprint Container 架構設計，實現零耦合、可擴展的模組化設計。

### 業務範圍

所有可組態的流程管理，包括：
- 自訂工作流程建立與執行
- 狀態機自定義配置
- 自動化規則與觸發器
- 流程範本管理
- 審批流程定義與執行

### 核心特性

- ✅ **視覺化流程建立器**: 拖拉式流程設計工具
- ✅ **彈性狀態機**: 自定義狀態圖與轉換規則
- ✅ **自動化引擎**: 事件驅動的自動化觸發器
- ✅ **流程範本庫**: 預設與自訂流程範本
- ✅ **多層級審批**: 支援複雜審批流程
- ✅ **流程監控**: 即時流程執行狀態追蹤
- ✅ **零耦合設計**: 透過 Event Bus 與其他模組通訊
- ✅ **完整生命週期管理**: 實作 IBlueprintModule 介面

### 設計原則

1. **流程引擎**: 提供統一的流程執行引擎
2. **可組態性**: 所有流程都可透過 UI 配置
3. **Event-Driven**: 基於事件驅動的自動化
4. **多域支援**: 讓所有 Domain 都能使用流程功能

## 🏗️ Architecture

### Domain 結構

```
workflow/
├── workflow.module.ts                # Domain 主模塊 (實作 IBlueprintModule)
├── module.metadata.ts                # Domain 元資料
├── workflow.repository.ts            # 共用資料存取層
├── workflow.routes.ts                # Domain 路由配置
├── services/                         # Sub-Module Services
│   ├── custom-workflow.service.ts    # Sub-Module: Custom Workflow
│   ├── state-machine.service.ts      # Sub-Module: State Machine Configuration
│   ├── automation.service.ts         # Sub-Module: Automation Trigger
│   ├── template.service.ts           # Sub-Module: Workflow Template
│   └── approval.service.ts           # Sub-Module: Approval Process
├── models/                           # Domain 模型
│   ├── workflow.model.ts
│   ├── state-machine.model.ts
│   ├── automation-rule.model.ts
│   ├── workflow-template.model.ts
│   └── approval-process.model.ts
├── engines/                          # 流程執行引擎
│   ├── workflow-engine.ts
│   └── automation-engine.ts
├── views/                            # Domain UI 元件
│   ├── workflow-designer/
│   ├── state-machine-editor/
│   └── approval-flow/
├── config/
│   └── workflow.config.ts            # 模組配置
├── exports/
│   └── workflow-api.exports.ts       # 公開 API
├── index.ts                          # 統一匯出
└── README.md                         # 本文件
```

## 📦 Sub-Modules (子模塊)

### 1️⃣ Custom Workflow Sub-Module (自訂流程)

**職責**: 流程建立器與流程執行引擎

**核心功能**:
- 視覺化流程設計器
- 流程節點與連接器定義
- 流程執行與監控
- 流程版本管理
- 流程執行歷史

**資料模型**:
```typescript
interface CustomWorkflow {
  id: string;
  blueprintId: string;
  name: string;
  description?: string;
  category: WorkflowCategory; // 'task' | 'approval' | 'automation' | 'notification'
  trigger: WorkflowTrigger;   // 觸發條件
  nodes: WorkflowNode[];       // 流程節點
  edges: WorkflowEdge[];       // 節點連接
  variables: WorkflowVariable[];
  version: number;
  status: WorkflowStatus;      // 'draft' | 'active' | 'inactive' | 'archived'
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkflowNode {
  id: string;
  type: NodeType; // 'start' | 'action' | 'condition' | 'approval' | 'end'
  label: string;
  position: { x: number; y: number };
  config: Record<string, any>;
  nextNodes?: string[];
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
  label?: string;
}
```

### 2️⃣ State Machine Configuration Sub-Module (狀態機配置)

**職責**: 自定義狀態圖與狀態轉換規則

**核心功能**:
- 狀態定義與管理
- 轉換規則設定
- 轉換權限控制
- 狀態驗證規則
- 狀態機視覺化編輯

**資料模型**:
```typescript
interface StateMachineConfig {
  id: string;
  blueprintId: string;
  name: string;
  resourceType: string;        // 'task' | 'qa_check' | 'invoice' 等
  states: StateDefinition[];
  transitions: StateTransition[];
  initialState: string;
  finalStates: string[];
  version: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface StateDefinition {
  id: string;
  name: string;
  displayName: string;
  color: string;
  icon?: string;
  isInitial: boolean;
  isFinal: boolean;
  validations?: StateValidation[];
  actions?: StateAction[];      // 進入/離開狀態時的動作
}

interface StateTransition {
  id: string;
  from: string;
  to: string;
  event: string;
  label: string;
  conditions?: TransitionCondition[];
  permissions?: string[];       // 需要的權限
  approvalRequired?: boolean;
}
```

### 3️⃣ Automation Trigger Sub-Module (自動化觸發器)

**職責**: 自動化規則設定與觸發條件管理

**核心功能**:
- 事件觸發規則
- 排程觸發
- 條件表達式評估
- 自動化動作執行
- 觸發歷史記錄

**資料模型**:
```typescript
interface AutomationRule {
  id: string;
  blueprintId: string;
  name: string;
  description?: string;
  triggerType: TriggerType;    // 'event' | 'schedule' | 'webhook' | 'condition'
  triggerConfig: TriggerConfig;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  isEnabled: boolean;
  priority: number;
  executionCount: number;
  lastExecutedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TriggerConfig {
  // Event Trigger
  eventType?: string;
  eventSource?: string;
  
  // Schedule Trigger
  schedule?: {
    type: 'cron' | 'interval';
    expression: string;
    timezone?: string;
  };
  
  // Condition Trigger
  watchedFields?: string[];
  evaluationInterval?: number;
}

interface AutomationCondition {
  field: string;
  operator: ConditionOperator; // 'equals' | 'contains' | 'greaterThan' 等
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

interface AutomationAction {
  type: ActionType; // 'update_field' | 'send_notification' | 'create_task' 等
  config: Record<string, any>;
  order: number;
}
```

### 4️⃣ Workflow Template Sub-Module (流程模板)

**職責**: 流程範本管理與範本套用

**核心功能**:
- 預設流程範本庫
- 自訂範本建立
- 範本套用與實例化
- 範本分享與匯入
- 範本版本管理

**資料模型**:
```typescript
interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  category: TemplateCategory; // 'construction' | 'approval' | 'qa' | 'finance'
  icon?: string;
  thumbnail?: string;
  tags: string[];
  workflow: CustomWorkflow;    // 範本流程定義
  variables: TemplateVariable[];
  isPublic: boolean;
  isBuiltIn: boolean;
  usageCount: number;
  rating?: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TemplateVariable {
  name: string;
  displayName: string;
  type: VariableType; // 'string' | 'number' | 'date' | 'user' | 'enum'
  defaultValue?: any;
  required: boolean;
  description?: string;
  options?: any[];     // for enum type
}
```

### 5️⃣ Approval Process Sub-Module (審批流程)

**職責**: 審批流程定義與審批記錄管理

**核心功能**:
- 多層級審批流程
- 審批人員指定
- 審批意見記錄
- 審批歷史追蹤
- 審批通知

**資料模型**:
```typescript
interface ApprovalProcess {
  id: string;
  blueprintId: string;
  name: string;
  resourceType: string;
  resourceId: string;
  steps: ApprovalStep[];
  currentStep: number;
  status: ApprovalStatus; // 'pending' | 'approved' | 'rejected' | 'cancelled'
  requestedBy: string;
  requestedAt: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

interface ApprovalStep {
  id: string;
  order: number;
  name: string;
  approverType: ApproverType; // 'user' | 'role' | 'any' | 'all'
  approvers: string[];         // User IDs or Role IDs
  minApprovals: number;        // 最少需要幾個人核准
  dueDate?: Date;
  status: StepStatus;          // 'pending' | 'approved' | 'rejected' | 'skipped'
  approvals: ApprovalRecord[];
}

interface ApprovalRecord {
  id: string;
  stepId: string;
  approver: string;
  decision: 'approved' | 'rejected';
  comment?: string;
  approvedAt: Date;
  signature?: string;
}
```

## 🚀 Quick Start

### 1. 載入模組到 Blueprint Container

```typescript
import { BlueprintContainer } from '@core/blueprint/container/blueprint-container';
import { WorkflowModule } from '@core/blueprint/modules/implementations/workflow';

// 初始化容器
const container = new BlueprintContainer(config);
await container.initialize();

// 載入流程模組
const workflowModule = new WorkflowModule();
await container.loadModule(workflowModule);

// 啟動容器
await container.start();
```

### 2. 建立自訂流程

```typescript
import { IWorkflowModuleApi } from '@core/blueprint/modules/implementations/workflow';

// 取得流程模組 API
const workflowApi = context.resources.getModule('workflow')?.exports as IWorkflowModuleApi;

// 建立流程
const workflow = await workflowApi.customWorkflow.createWorkflow({
  blueprintId: 'blueprint-123',
  name: 'Task Review Workflow',
  category: 'task',
  trigger: {
    type: 'event',
    eventType: 'task.created'
  },
  nodes: [
    { id: 'start', type: 'start', label: 'Start', position: { x: 100, y: 100 } },
    { id: 'review', type: 'approval', label: 'Review', position: { x: 300, y: 100 } },
    { id: 'end', type: 'end', label: 'End', position: { x: 500, y: 100 } }
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'review' },
    { id: 'e2', source: 'review', target: 'end' }
  ]
});
```

### 3. 配置狀態機

```typescript
// 為任務資源建立狀態機
const stateMachine = await workflowApi.stateMachine.createStateMachine({
  blueprintId: 'blueprint-123',
  name: 'Task Status Machine',
  resourceType: 'task',
  states: [
    { id: 'draft', name: 'draft', displayName: '草稿', color: '#gray', isInitial: true },
    { id: 'in_progress', name: 'in_progress', displayName: '進行中', color: '#blue' },
    { id: 'review', name: 'review', displayName: '審核中', color: '#orange' },
    { id: 'completed', name: 'completed', displayName: '已完成', color: '#green', isFinal: true }
  ],
  transitions: [
    { id: 't1', from: 'draft', to: 'in_progress', event: 'start', label: '開始' },
    { id: 't2', from: 'in_progress', to: 'review', event: 'submit_for_review', label: '提交審核' },
    { id: 't3', from: 'review', to: 'completed', event: 'approve', label: '核准' },
    { id: 't4', from: 'review', to: 'in_progress', event: 'reject', label: '退回' }
  ],
  initialState: 'draft'
});
```

### 4. 建立自動化規則

```typescript
// 建立自動化規則: 當任務逾期時自動發送通知
const automation = await workflowApi.automation.createRule({
  blueprintId: 'blueprint-123',
  name: 'Overdue Task Notification',
  triggerType: 'schedule',
  triggerConfig: {
    schedule: {
      type: 'cron',
      expression: '0 9 * * *', // 每天早上 9 點
      timezone: 'Asia/Taipei'
    }
  },
  conditions: [
    { field: 'dueDate', operator: 'lessThan', value: 'now' },
    { field: 'status', operator: 'notEquals', value: 'completed' }
  ],
  actions: [
    {
      type: 'send_notification',
      config: {
        recipientType: 'assignee',
        template: 'task_overdue',
        channel: 'email'
      },
      order: 1
    }
  ],
  isEnabled: true,
  priority: 1
});
```

## 📖 API Reference

### Custom Workflow API

```typescript
interface ICustomWorkflowApi {
  // 建立流程
  createWorkflow(data: CreateWorkflowData): Promise<CustomWorkflow>;
  
  // 更新流程
  updateWorkflow(workflowId: string, data: Partial<CustomWorkflow>): Promise<CustomWorkflow>;
  
  // 執行流程
  executeWorkflow(workflowId: string, context: WorkflowContext): Promise<WorkflowExecution>;
  
  // 取得流程執行狀態
  getExecutionStatus(executionId: string): Observable<WorkflowExecution>;
  
  // 取消流程執行
  cancelExecution(executionId: string): Promise<void>;
}
```

### State Machine API

```typescript
interface IStateMachineApi {
  // 建立狀態機
  createStateMachine(data: CreateStateMachineData): Promise<StateMachineConfig>;
  
  // 更新狀態機
  updateStateMachine(id: string, data: Partial<StateMachineConfig>): Promise<StateMachineConfig>;
  
  // 執行狀態轉換
  transition(
    resourceType: string,
    resourceId: string,
    event: string,
    context?: TransitionContext
  ): Promise<TransitionResult>;
  
  // 取得可用的轉換
  getAvailableTransitions(
    resourceType: string,
    resourceId: string,
    currentState: string
  ): Promise<StateTransition[]>;
  
  // 驗證狀態轉換
  validateTransition(
    resourceType: string,
    currentState: string,
    targetState: string
  ): Promise<ValidationResult>;
}
```

### Automation API

```typescript
interface IAutomationApi {
  // 建立自動化規則
  createRule(data: CreateAutomationRuleData): Promise<AutomationRule>;
  
  // 更新規則
  updateRule(ruleId: string, data: Partial<AutomationRule>): Promise<AutomationRule>;
  
  // 啟用/停用規則
  toggleRule(ruleId: string, isEnabled: boolean): Promise<void>;
  
  // 手動觸發規則
  triggerRule(ruleId: string, context?: any): Promise<AutomationExecution>;
  
  // 取得規則執行歷史
  getRuleExecutions(ruleId: string, limit?: number): Observable<AutomationExecution[]>;
}
```

### Template API

```typescript
interface ITemplateApi {
  // 取得範本列表
  getTemplates(category?: TemplateCategory): Observable<WorkflowTemplate[]>;
  
  // 建立範本
  createTemplate(data: CreateTemplateData): Promise<WorkflowTemplate>;
  
  // 從範本建立流程實例
  instantiateTemplate(
    templateId: string,
    variables: Record<string, any>
  ): Promise<CustomWorkflow>;
  
  // 匯出範本
  exportTemplate(templateId: string): Promise<string>; // JSON string
  
  // 匯入範本
  importTemplate(templateData: string): Promise<WorkflowTemplate>;
}
```

### Approval API

```typescript
interface IApprovalApi {
  // 建立審批流程
  createApprovalProcess(data: CreateApprovalProcessData): Promise<ApprovalProcess>;
  
  // 提交審批
  submitApproval(
    processId: string,
    stepId: string,
    decision: 'approved' | 'rejected',
    comment?: string
  ): Promise<ApprovalRecord>;
  
  // 取得待審批項目
  getPendingApprovals(userId: string): Observable<ApprovalProcess[]>;
  
  // 取得審批歷史
  getApprovalHistory(
    resourceType: string,
    resourceId: string
  ): Observable<ApprovalProcess[]>;
  
  // 取消審批流程
  cancelApprovalProcess(processId: string): Promise<void>;
}
```

## 🔧 Configuration

### Module Configuration

```typescript
import { IWorkflowConfig, DEFAULT_WORKFLOW_CONFIG } from '@core/blueprint/modules/implementations/workflow';

const customConfig: IWorkflowConfig = {
  ...DEFAULT_WORKFLOW_CONFIG,
  features: {
    enableCustomWorkflow: true,
    enableStateMachine: true,
    enableAutomation: true,
    enableTemplate: true,
    enableApproval: true,
    enableWorkflowDesigner: true
  },
  settings: {
    maxWorkflowNodes: 50,
    maxAutomationRules: 100,
    automationExecutionTimeout: 300000, // 5 minutes
    approvalReminderInterval: 86400000, // 24 hours
    enableWorkflowVersioning: true
  }
};
```

## 📊 Data Storage

### Supabase Tables

```sql
-- Workflows
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  trigger JSONB NOT NULL,
  nodes JSONB NOT NULL,
  edges JSONB NOT NULL,
  variables JSONB,
  version INT DEFAULT 1,
  status TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- State Machines
CREATE TABLE state_machines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id),
  name TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  states JSONB NOT NULL,
  transitions JSONB NOT NULL,
  initial_state TEXT NOT NULL,
  final_states TEXT[],
  version INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation Rules
CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB NOT NULL,
  conditions JSONB,
  actions JSONB NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  priority INT DEFAULT 0,
  execution_count INT DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Templates
CREATE TABLE workflow_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  icon TEXT,
  thumbnail TEXT,
  tags TEXT[],
  workflow JSONB NOT NULL,
  variables JSONB,
  is_public BOOLEAN DEFAULT FALSE,
  is_built_in BOOLEAN DEFAULT FALSE,
  usage_count INT DEFAULT 0,
  rating DECIMAL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approval Processes
CREATE TABLE approval_processes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id),
  name TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  steps JSONB NOT NULL,
  current_step INT DEFAULT 0,
  status TEXT NOT NULL,
  requested_by UUID NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB
);
```

## 🎯 Event Bus Integration

### Emitted Events

```typescript
const WORKFLOW_EVENTS = {
  WORKFLOW_CREATED: 'WORKFLOW_CREATED',
  WORKFLOW_STARTED: 'WORKFLOW_STARTED',
  WORKFLOW_COMPLETED: 'WORKFLOW_COMPLETED',
  WORKFLOW_FAILED: 'WORKFLOW_FAILED',
  STATE_TRANSITIONED: 'WORKFLOW_STATE_TRANSITIONED',
  AUTOMATION_TRIGGERED: 'WORKFLOW_AUTOMATION_TRIGGERED',
  APPROVAL_SUBMITTED: 'WORKFLOW_APPROVAL_SUBMITTED',
  APPROVAL_COMPLETED: 'WORKFLOW_APPROVAL_COMPLETED'
};
```

### Event Handling Example

```typescript
// 監聽任務建立事件並啟動流程
context.eventBus.on('TASK_CREATED', async (data: any) => {
  // 查找相關的流程
  const workflows = await workflowApi.customWorkflow.findByTrigger({
    type: 'event',
    eventType: 'task.created'
  });
  
  // 執行流程
  for (const workflow of workflows) {
    await workflowApi.customWorkflow.executeWorkflow(workflow.id, {
      taskId: data.taskId,
      blueprintId: data.blueprintId
    });
  }
});
```

## 📝 Best Practices

### 1. 流程設計原則

```typescript
// ✅ 好的做法: 簡潔明確的流程
const workflow = {
  name: 'Task Review Workflow',
  nodes: [
    { type: 'start', label: 'Start' },
    { type: 'action', label: 'Assign Reviewer' },
    { type: 'approval', label: 'Review' },
    { type: 'condition', label: 'Approved?' },
    { type: 'end', label: 'End' }
  ]
};

// ❌ 避免: 過於複雜的流程
// 超過 30 個節點的流程應該拆分
```

### 2. 狀態機設計

```typescript
// ✅ 好的做法: 清晰的狀態轉換
const stateMachine = {
  states: ['draft', 'in_progress', 'review', 'completed'],
  transitions: [
    { from: 'draft', to: 'in_progress', event: 'start' },
    { from: 'in_progress', to: 'review', event: 'submit' },
    { from: 'review', to: 'completed', event: 'approve' },
    { from: 'review', to: 'in_progress', event: 'reject' }
  ]
};
```

### 3. 自動化規則

```typescript
// ✅ 好的做法: 具體且可測試的條件
const automation = {
  conditions: [
    { field: 'status', operator: 'equals', value: 'overdue' },
    { field: 'priority', operator: 'greaterThan', value: 3 }
  ],
  actions: [
    { type: 'send_notification', config: { template: 'task_urgent' } },
    { type: 'update_field', config: { field: 'flagged', value: true } }
  ]
};
```

### 4. 審批流程

```typescript
// ✅ 好的做法: 明確的審批層級
const approval = {
  steps: [
    { name: 'Team Lead Review', approvers: ['team-lead'], minApprovals: 1 },
    { name: 'Manager Approval', approvers: ['manager'], minApprovals: 1 },
    { name: 'Director Sign-off', approvers: ['director'], minApprovals: 1 }
  ]
};
```

## 🔗 Domain 依賴關係

### 被依賴關係

Workflow Domain 被以下 Domains 依賴：
- **Task Domain**: 任務狀態流轉
- **Finance Domain**: 審批流程
- **QA Domain**: 檢查流程
- **Acceptance Domain**: 驗收流程
- **所有 Domains**: 通用流程與自動化需求

### 依賴關係

Workflow Domain 依賴：
- **Platform Layer**: Event Bus, Context
- **Log Domain**: 記錄流程執行歷史
- **Supabase**: 資料儲存與查詢

## 🔒 Security Considerations

### 1. 流程執行權限

```typescript
// 確保使用者有權限執行流程
const canExecute = await aclService.can(userId, 'workflow.execute', workflowId);
if (!canExecute) {
  throw new Error('Permission denied');
}
```

### 2. 審批權限驗證

```typescript
// 驗證審批者身份
const isApprover = approvalStep.approvers.includes(userId);
if (!isApprover) {
  throw new Error('You are not authorized to approve this step');
}
```

### 3. 自動化規則安全

```typescript
// 限制自動化規則的動作範圍
const allowedActions = ['send_notification', 'update_field', 'create_log'];
if (!allowedActions.includes(action.type)) {
  throw new Error('Action type not allowed');
}
```

## 📚 References

- [Blueprint Container 架構](../../README.md)
- [Event Bus 整合指南](../../../../../docs/blueprint-event-bus-integration.md)
- [State Machine Pattern](https://en.wikipedia.org/wiki/Finite-state_machine)
- [BPMN 2.0 Specification](https://www.omg.org/spec/BPMN/2.0/)
- [next.md - Domain 架構說明](../../../../../../next.md)

## 🤝 Contributing

在實作流程模組前，請確保：

1. 理解 Blueprint Container 架構
2. 遵循 IBlueprintModule 介面規範
3. 維持零耦合設計原則
4. 正確使用 Event Bus 通訊
5. 添加適當的測試
6. 更新相關文檔

## 📄 License

MIT License - 請參考專案根目錄的 LICENSE 檔案

---

**Maintained by**: GigHub Development Team  
**Last Updated**: 2025-12-13  
**Domain Priority**: P1 (必要)  
**Contact**: 請透過專案 GitHub Issues 回報問題
