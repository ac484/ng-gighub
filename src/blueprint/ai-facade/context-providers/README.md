# Context Providers

目的
- 提供一組可組合的 context 物件，供 prompts 與 adapters 使用，以便在呼叫 AI 時能完整描述執行環境（workspace、user、consent、quota policy、locale 等）。

核心原則
- Context 應為純資料（POJO），且有明確 schema 與可測試的建構器。
- 敏感資料（PII）應標記並在傳送前由後端進行最終 redaction。

建議型別（範例）
```ts
export interface UserContext { userId: string; roles: string[]; isAdmin?: boolean }
export interface WorkspaceContext { workspaceId: string; plan: 'free'|'pro'|'enterprise'; region?: string }
export interface RequestContext { requestId: string; locale?: string; timestamp: string }

export type AICallContext = UserContext & WorkspaceContext & RequestContext & { consent?: { analytics: boolean } }
```

使用範例
- 提供 `buildContext()` helper 在 service 層組合各種 providers：
```ts
const ctx = buildContext({ user, workspace, req });
adapter.callGenerate({ prompt, modelId, context: ctx });
```

測試提示
- 建立測試用 context factories（例如 `createTestUserContext()`）以便快速產生多種情境。
# context-providers

說明
- 提供在呼叫 AI 時需要的上下文資料（例如使用者身份、地區偏好、功能旗標等）。

用途
- 將上下文組合成單一物件，供 prompts 與 adapters 使用。

實作提示
- 儘量使用小型、可組合的 providers（userContext, tenantContext, costControlContext）。
