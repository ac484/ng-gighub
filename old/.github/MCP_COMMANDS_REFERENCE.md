# MCP 伺服器完整指令參考手冊

> **GigHub 專案 MCP 工具完整指南**  
> 本文檔記錄所有 16 個 MCP 伺服器的可用工具與指令

## 📋 目錄

- [HTTP MCP 伺服器 (3 個)](#http-mcp-伺服器)
  - [Context7](#1-context7-http)
  - [GitHub](#2-github-http)
  - [Firebase/Firestore](#3-firebase-http)
- [本地 MCP 伺服器 (13 個)](#本地-mcp-伺服器)
  - [Postgres](#4-postgres-local)
  - [Redis](#5-redis-local)
  - [Git](#6-git-local)
  - [Playwright](#7-playwright-local)
  - [Puppeteer](#8-puppeteer-local)
  - [Memory](#9-memory-local)
  - [Sequential-Thinking](#10-sequential-thinking-local)
  - [Software-Planning-Tool](#11-software-planning-tool-local)
  - [Everything](#12-everything-local)
  - [Filesystem](#13-filesystem-local)
  - [Time](#14-time-local)
  - [Fetch](#15-fetch-local)
  - [其他工具](#16-其他本地-mcp-工具)

---

## HTTP MCP 伺服器

### 1. Context7 (HTTP)

**用途**: 取得最新的程式庫文檔與 API 參考

**配置**:
```json
{
  "type": "http",
  "url": "https://mcp.context7.com/mcp",
  "headers": {
    "CONTEXT7_API_KEY": "${COPILOT_MCP_CONTEXT7}"
  }
}
```

#### 可用工具

##### `resolve-library-id`
搜尋並解析程式庫 ID

**參數**:
- `libraryName` (string, required): 要搜尋的程式庫名稱

**範例**:
```typescript
{
  "libraryName": "angular"
}
```

**回應**:
```json
{
  "libraries": [
    {
      "libraryID": "/angular/angular",
      "name": "Angular",
      "description": "Platform for building mobile and desktop web applications",
      "codeSnippets": 332,
      "sourceReputation": "High",
      "benchmarkScore": 80.3
    }
  ]
}
```

##### `get-library-docs`
取得程式庫的文檔與程式碼範例

**參數**:
- `context7CompatibleLibraryID` (string, required): 從 resolve-library-id 取得的 ID
- `topic` (string, optional): 特定主題 (例如 "signals", "routing")
- `mode` (string, optional): "code" 或 "info" (預設: "code")
- `page` (integer, optional): 分頁編號 (預設: 1, 範圍: 1-10)

**範例**:
```typescript
{
  "context7CompatibleLibraryID": "/angular/angular",
  "topic": "signals",
  "mode": "code",
  "page": 1
}
```

**回應**:
```json
{
  "examples": [
    {
      "title": "Basic Signal Usage",
      "code": "const count = signal(0);\nconst doubled = computed(() => count() * 2);",
      "explanation": "Creating signals and computed values"
    }
  ]
}
```

**支援的程式庫**:
- Angular 20
- ng-alain 20
- ng-zorro-antd 20
- Firebase/Firestore 2.86
- TypeScript 5.x
- RxJS 7.8

---

### 2. GitHub (HTTP)

**用途**: 與 GitHub API 互動，管理儲存庫、Issues、PR 等

**配置**:
```json
{
  "type": "http",
  "url": "https://api.githubcopilot.com/mcp/",
  "headers": {
    "Authorization": "Bearer ${GITHUB_TOKEN}"
  }
}
```

#### 可用工具

##### GitHub Actions 工具組
- `list_workflows`: 列出儲存庫的 workflows
- `get_workflow`: 取得特定 workflow 詳情
- `list_workflow_runs`: 列出 workflow 執行紀錄
- `get_workflow_run`: 取得特定執行詳情
- `list_workflow_jobs`: 列出 workflow 的 jobs
- `get_workflow_job`: 取得特定 job 詳情
- `get_job_logs`: 取得 job 日誌
- `download_workflow_run_artifact`: 下載工件
- `rerun_workflow_run`: 重新執行 workflow

**範例 - 列出 workflows**:
```typescript
{
  "owner": "7Spade",
  "repo": "GigHub"
}
```

##### Issues & PRs 工具組
- `list_issues`: 列出 issues
- `get_issue`: 取得特定 issue
- `get_issue_comments`: 取得 issue 評論
- `create_issue`: 建立新 issue
- `update_issue`: 更新 issue
- `add_issue_comment`: 新增評論
- `list_pull_requests`: 列出 PRs
- `pull_request_read`: 讀取 PR 詳情
- `search_issues`: 搜尋 issues
- `search_pull_requests`: 搜尋 PRs

**範例 - 建立 issue**:
```typescript
{
  "owner": "7Spade",
  "repo": "GigHub",
  "title": "Feature: Add user authentication",
  "body": "Implement JWT authentication for API endpoints",
  "labels": ["enhancement", "authentication"]
}
```

##### Repository 工具組
- `search_repositories`: 搜尋儲存庫
- `create_repository`: 建立儲存庫
- `fork_repository`: Fork 儲存庫
- `get_file_contents`: 取得檔案內容
- `create_or_update_file`: 建立/更新檔案
- `push_files`: 推送多個檔案
- `create_branch`: 建立分支
- `list_branches`: 列出分支
- `list_commits`: 列出提交
- `get_commit`: 取得提交詳情

**範例 - 取得檔案內容**:
```typescript
{
  "owner": "7Spade",
  "repo": "GigHub",
  "path": "src/app/app.component.ts"
}
```

##### Code Search 工具組
- `search_code`: 搜尋程式碼
- `search_users`: 搜尋使用者

**範例 - 搜尋程式碼**:
```typescript
{
  "query": "signal computed language:typescript org:angular"
}
```

##### Security 工具組
- `list_code_scanning_alerts`: 列出程式碼掃描警報
- `get_code_scanning_alert`: 取得特定警報
- `list_secret_scanning_alerts`: 列出祕密掃描警報
- `get_secret_scanning_alert`: 取得特定警報

##### Releases 工具組
- `list_releases`: 列出版本
- `get_latest_release`: 取得最新版本
- `get_release_by_tag`: 依標籤取得版本

---

### 3. Firebase/Firestore (HTTP)

**用途**: 與 Firebase/Firestore 資料庫互動，執行查詢、管理 schema

**配置**:
```json
{
  "type": "http",
  "url": "https://mcp.firebase.com/mcp?project_ref=${SUPABASE_PROJECT_REF}",
  "headers": {
    "Authorization": "Bearer ${SUPABASE_MCP_TOKEN}"
  }
}
```

#### 可用工具

##### Database 工具組
- `list_tables`: 列出資料表
- `list_extensions`: 列出擴充功能
- `list_migrations`: 列出遷移
- `apply_migration`: 應用遷移
- `execute_sql`: 執行 SQL 查詢

**範例 - 列出資料表**:
```typescript
{
  "schemas": ["public"]
}
```

**範例 - 執行 SQL**:
```typescript
{
  "query": "SELECT * FROM users WHERE status = 'active' LIMIT 10"
}
```

##### Schema 工具組
- `get_advisors`: 取得安全/效能建議
- `generate_typescript_types`: 產生 TypeScript 型別

**範例 - 取得建議**:
```typescript
{
  "type": "security"  // 或 "performance"
}
```

##### Edge Functions 工具組
- `list_edge_functions`: 列出 Edge Functions
- `get_edge_function`: 取得 Edge Function
- `deploy_edge_function`: 部署 Edge Function

**範例 - 部署 Edge Function**:
```typescript
{
  "name": "hello-world",
  "files": [
    {
      "name": "index.ts",
      "content": "Deno.serve((req) => new Response('Hello World!'))"
    }
  ],
  "entrypoint_path": "index.ts"
}
```

##### Branching 工具組
- `list_branches`: 列出開發分支
- `create_branch`: 建立開發分支
- `merge_branch`: 合併分支
- `reset_branch`: 重設分支
- `rebase_branch`: Rebase 分支
- `delete_branch`: 刪除分支

##### Logs & Monitoring 工具組
- `get_logs`: 取得服務日誌
- `get_project_url`: 取得專案 URL
- `get_publishable_keys`: 取得 API 金鑰

**範例 - 取得日誌**:
```typescript
{
  "service": "api"  // 或 "postgres", "auth", "storage", "realtime"
}
```

---

## 本地 MCP 伺服器

### 4. Postgres (Local)

**用途**: 直接存取 PostgreSQL 資料庫

**配置**:
```json
{
  "type": "local",
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-postgres",
    "${POSTGRES_CONNECTION_STRING}"
  ]
}
```

#### 可用工具

##### `query`
執行唯讀 SQL 查詢

**參數**:
- `sql` (string, required): SQL 查詢語句

**範例**:
```typescript
{
  "sql": "SELECT id, name, email FROM users WHERE created_at > NOW() - INTERVAL '7 days'"
}
```

**回應**:
```json
{
  "rows": [
    {"id": 1, "name": "John Doe", "email": "john@example.com"},
    {"id": 2, "name": "Jane Smith", "email": "jane@example.com"}
  ],
  "rowCount": 2
}
```

**限制**:
- 僅支援 SELECT 查詢 (唯讀)
- 不支援 INSERT, UPDATE, DELETE
- 用於資料查詢與分析

---

### 5. Redis (Local)

**用途**: Redis 快取操作

**配置**:
```json
{
  "type": "local",
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-redis",
    "${REDIS_CONNECTION_STRING}"
  ]
}
```

#### 可用工具

##### `set`
設定 key-value 並可設定過期時間

**參數**:
- `key` (string, required): Redis 鍵
- `value` (string, required): 要儲存的值
- `expireSeconds` (number, optional): 過期時間(秒)

**範例**:
```typescript
{
  "key": "session:user123",
  "value": "{\"userId\":123,\"role\":\"admin\"}",
  "expireSeconds": 3600
}
```

##### `get`
取得 key 的值

**參數**:
- `key` (string, required): Redis 鍵

**範例**:
```typescript
{
  "key": "session:user123"
}
```

##### `delete`
刪除一個或多個 keys

**參數**:
- `key` (string | string[], required): 要刪除的鍵

**範例**:
```typescript
{
  "key": ["session:user123", "cache:data456"]
}
```

##### `list`
列出符合模式的 keys

**參數**:
- `pattern` (string, optional): 匹配模式 (預設: "*")

**範例**:
```typescript
{
  "pattern": "session:*"
}
```

---

### 6. Git (Local)

**用途**: Git 儲存庫操作

**配置**:
```json
{
  "type": "local",
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-git",
    "--repository",
    "./"
  ]
}
```

#### 可用工具

##### Repository 資訊
- `git_status`: 取得儲存庫狀態
- `git_diff`: 顯示差異
- `git_log`: 顯示提交歷史
- `git_show`: 顯示提交詳情

**範例 - Git Status**:
```typescript
{}  // 無參數
```

**範例 - Git Log**:
```typescript
{
  "maxCount": 10,
  "skip": 0
}
```

##### Branch 操作
- `git_branch`: 列出或建立分支
- `git_checkout`: 切換分支
- `git_merge`: 合併分支

**範例 - 建立分支**:
```typescript
{
  "branchName": "feature/new-component",
  "create": true
}
```

##### Commit 操作
- `git_commit`: 提交變更
- `git_add`: 加入變更到暫存區
- `git_reset`: 重設變更

**範例 - Commit**:
```typescript
{
  "message": "feat: Add user authentication module"
}
```

##### Remote 操作
- `git_push`: 推送到遠端
- `git_pull`: 從遠端拉取
- `git_fetch`: 擷取遠端變更
- `git_remote`: 管理遠端儲存庫

---

### 7. Playwright (Local)

**用途**: 瀏覽器自動化測試

**配置**:
```json
{
  "type": "local",
  "command": "npx",
  "args": [
    "-y",
    "@executeautomation/playwright-mcp-server"
  ]
}
```

#### 可用工具

##### Navigation
- `playwright_navigate`: 導航到 URL
- `playwright_go_back`: 返回上一頁
- `playwright_go_forward`: 前進下一頁

**範例 - Navigate**:
```typescript
{
  "url": "https://example.com",
  "browserType": "chromium",
  "headless": true,
  "width": 1280,
  "height": 720
}
```

##### Page Interaction
- `playwright_click`: 點擊元素
- `playwright_fill`: 填寫輸入框
- `playwright_select`: 選擇下拉選項
- `playwright_hover`: 懸停元素
- `playwright_upload_file`: 上傳檔案
- `playwright_press_key`: 按下按鍵
- `playwright_drag`: 拖曳元素

**範例 - Click**:
```typescript
{
  "selector": "button#submit"
}
```

**範例 - Fill**:
```typescript
{
  "selector": "input[name='email']",
  "value": "user@example.com"
}
```

##### Iframe 操作
- `playwright_iframe_click`: 在 iframe 中點擊
- `playwright_iframe_fill`: 在 iframe 中填寫

**範例 - Iframe Click**:
```typescript
{
  "iframeSelector": "iframe#payment-form",
  "selector": "button.pay-now"
}
```

##### Screenshot & Content
- `playwright_screenshot`: 截圖
- `playwright_get_visible_text`: 取得可見文字
- `playwright_get_visible_html`: 取得可見 HTML
- `playwright_save_as_pdf`: 儲存為 PDF

**範例 - Screenshot**:
```typescript
{
  "name": "homepage-screenshot",
  "fullPage": true,
  "savePng": true,
  "downloadsDir": "./screenshots"
}
```

##### JavaScript Execution
- `playwright_evaluate`: 執行 JavaScript

**範例 - Evaluate**:
```typescript
{
  "script": "document.querySelectorAll('a').length"
}
```

##### Console & Logs
- `playwright_console_logs`: 取得 console 日誌

**範例 - Get Logs**:
```typescript
{
  "type": "error",
  "limit": 50,
  "search": "failed to load",
  "clear": false
}
```

##### Device Emulation
- `playwright_resize`: 調整視窗大小或模擬裝置

**範例 - Resize**:
```typescript
{
  "width": 375,
  "height": 667
}
```

**範例 - Emulate Device**:
```typescript
{
  "device": "iPhone 13",
  "orientation": "portrait"
}
```

##### HTTP Requests
- `playwright_get`: 執行 GET 請求
- `playwright_post`: 執行 POST 請求
- `playwright_put`: 執行 PUT 請求
- `playwright_patch`: 執行 PATCH 請求
- `playwright_delete`: 執行 DELETE 請求

**範例 - POST Request**:
```typescript
{
  "url": "https://api.example.com/users",
  "value": "{\"name\":\"John\",\"email\":\"john@example.com\"}",
  "token": "Bearer eyJhbGc...",
  "headers": {
    "Content-Type": "application/json"
  }
}
```

##### Response Validation
- `playwright_expect_response`: 等待 HTTP 回應
- `playwright_assert_response`: 驗證 HTTP 回應

**範例 - Expect Response**:
```typescript
{
  "id": "api-call-1",
  "url": "https://api.example.com/data"
}
```

##### Tab Management
- `playwright_click_and_switch_tab`: 點擊並切換分頁

##### Browser Control
- `playwright_close`: 關閉瀏覽器
- `playwright_custom_user_agent`: 設定 User Agent

##### Code Generation
- `start_codegen_session`: 開始錄製
- `end_codegen_session`: 結束錄製並產生測試程式碼
- `get_codegen_session`: 取得錄製狀態
- `clear_codegen_session`: 清除錄製

**範例 - Start Recording**:
```typescript
{
  "options": {
    "outputPath": "/tests",
    "testNamePrefix": "AutoGenerated",
    "includeComments": true
  }
}
```

---

### 8. Puppeteer (Local)

**用途**: 瀏覽器自動化 (Chrome/Chromium)

**配置**:
```json
{
  "type": "local",
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-puppeteer"
  ]
}
```

#### 可用工具

##### Navigation
- `puppeteer_navigate`: 導航到 URL

**範例**:
```typescript
{
  "url": "https://example.com",
  "allowDangerous": false,
  "launchOptions": {
    "headless": true,
    "args": ["--no-sandbox"]
  }
}
```

##### Page Interaction
- `puppeteer_click`: 點擊元素
- `puppeteer_fill`: 填寫輸入框
- `puppeteer_select`: 選擇下拉選項
- `puppeteer_hover`: 懸停元素

**範例 - Click**:
```typescript
{
  "selector": "button.submit"
}
```

##### Screenshot
- `puppeteer_screenshot`: 截圖

**範例**:
```typescript
{
  "name": "screenshot",
  "width": 1280,
  "height": 720,
  "encoded": false,
  "selector": ".main-content"
}
```

##### JavaScript Execution
- `puppeteer_evaluate`: 執行 JavaScript

**範例**:
```typescript
{
  "script": "document.title"
}
```

---

### 9. Memory (Local)

**用途**: 持久化知識圖譜儲存

**配置**:
```json
{
  "type": "local",
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-memory"
  ],
  "env": {
    "MEMORY_FILE_PATH": "${MCP_MEMORY_FILE_PATH}"
  }
}
```

#### 可用工具

##### Entity 管理
- `create_entities`: 建立實體
- `delete_entities`: 刪除實體
- `open_nodes`: 開啟特定實體

**範例 - Create Entities**:
```typescript
{
  "entities": [
    {
      "name": "John_Smith",
      "entityType": "person",
      "observations": [
        "Speaks fluent Spanish",
        "Prefers morning meetings"
      ]
    },
    {
      "name": "Anthropic",
      "entityType": "organization",
      "observations": ["AI research company"]
    }
  ]
}
```

##### Relation 管理
- `create_relations`: 建立關係
- `delete_relations`: 刪除關係

**範例 - Create Relations**:
```typescript
{
  "relations": [
    {
      "from": "John_Smith",
      "to": "Anthropic",
      "relationType": "works_at"
    }
  ]
}
```

##### Observation 管理
- `add_observations`: 新增觀察
- `delete_observations`: 刪除觀察

**範例 - Add Observations**:
```typescript
{
  "observations": [
    {
      "entityName": "John_Smith",
      "contents": [
        "Graduated in 2019",
        "Expertise in TypeScript"
      ]
    }
  ]
}
```

##### Graph 操作
- `read_graph`: 讀取整個知識圖譜
- `search_nodes`: 搜尋節點

**範例 - Search Nodes**:
```typescript
{
  "query": "John"
}
```

**回應**:
```json
{
  "matchingEntities": [
    {
      "name": "John_Smith",
      "entityType": "person",
      "observations": ["Speaks fluent Spanish", "Graduated in 2019"]
    }
  ],
  "matchingRelations": [
    {
      "from": "John_Smith",
      "to": "Anthropic",
      "relationType": "works_at"
    }
  ]
}
```

---

### 10. Sequential-Thinking (Local)

**用途**: 多步驟推理與思考追蹤

**配置**:
```json
{
  "type": "local",
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-sequential-thinking"
  ]
}
```

#### 可用工具

##### `sequentialthinking`
結構化多步驟思考與推理

**參數**:
- `thought` (string, required): 當前思考步驟
- `nextThoughtNeeded` (boolean, required): 是否需要下一個思考
- `thoughtNumber` (integer, required): 當前思考編號
- `totalThoughts` (integer, required): 預估總思考數
- `isRevision` (boolean, optional): 是否為修正
- `revisesThought` (integer, optional): 修正哪個思考
- `branchFromThought` (integer, optional): 分支起點
- `branchId` (string, optional): 分支識別碼
- `needsMoreThoughts` (boolean, optional): 是否需要更多思考

**範例 - 第一個思考**:
```typescript
{
  "thought": "首先，我需要分析問題的核心需求",
  "nextThoughtNeeded": true,
  "thoughtNumber": 1,
  "totalThoughts": 5,
  "isRevision": false
}
```

**範例 - 中間思考**:
```typescript
{
  "thought": "基於前面的分析，我發現需要使用 Angular Signals",
  "nextThoughtNeeded": true,
  "thoughtNumber": 2,
  "totalThoughts": 5,
  "isRevision": false
}
```

**範例 - 修正思考**:
```typescript
{
  "thought": "等等，我需要重新考慮第一步的方法",
  "nextThoughtNeeded": true,
  "thoughtNumber": 3,
  "totalThoughts": 6,
  "isRevision": true,
  "revisesThought": 1
}
```

**範例 - 最終思考**:
```typescript
{
  "thought": "綜合以上分析，最佳解決方案是...",
  "nextThoughtNeeded": false,
  "thoughtNumber": 5,
  "totalThoughts": 5,
  "isRevision": false
}
```

**使用場景**:
- 複雜問題分析
- 架構設計決策
- 多步驟實作規劃
- 錯誤診斷與除錯

---

### 11. Software-Planning-Tool (Local)

**用途**: 軟體開發規劃與任務管理

**配置**:
```json
{
  "type": "local",
  "command": "npx",
  "args": [
    "-y",
    "github:NightTrek/Software-planning-mcp"
  ]
}
```

#### 可用工具

##### `start_planning`
開始新的規劃會話

**參數**:
- `goal` (string, required): 開發目標描述

**範例**:
```typescript
{
  "goal": "實作使用者認證功能，包含 JWT、RLS 政策與 Angular Guards"
}
```

##### `save_plan`
儲存實作計劃

**參數**:
- `plan` (string, required): 計劃內容

**範例**:
```typescript
{
  "plan": `
# 使用者認證實作計劃

## 階段 1: 後端設定
- 建立 auth schema
- 實作 JWT 驗證
- 配置 RLS policies

## 階段 2: 前端整合
- 建立 AuthService
- 實作 Login/Signup components
- 建立 Auth Guards

## 階段 3: 測試
- 單元測試
- E2E 測試
  `
}
```

##### `add_todo`
新增待辦事項

**參數**:
- `title` (string, required): 待辦標題
- `description` (string, required): 詳細描述
- `complexity` (number, required): 複雜度分數 (0-10)
- `codeExample` (string, optional): 程式碼範例

**範例**:
```typescript
{
  "title": "實作 JWT 驗證",
  "description": "在 Firebase/Firestore 中配置 JWT 驗證，包含 refresh token 機制",
  "complexity": 7,
  "codeExample": `
export class AuthService {
  private firebase = inject(Firebase/FirestoreService);
  
  async signIn(email: string, password: string) {
    const { data, error } = await this.firebase.client.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  }
}
  `
}
```

##### `remove_todo`
移除待辦事項

**參數**:
- `todoId` (string, required): 待辦 ID

**範例**:
```typescript
{
  "todoId": "todo-1234"
}
```

##### `get_todos`
取得所有待辦事項

**參數**: 無

**範例**:
```typescript
{}
```

##### `update_todo_status`
更新待辦狀態

**參數**:
- `todoId` (string, required): 待辦 ID
- `isComplete` (boolean, required): 是否完成

**範例**:
```typescript
{
  "todoId": "todo-1234",
  "isComplete": true
}
```

---

### 12. Everything (Local)

**用途**: 多用途工具集合

**配置**:
```json
{
  "type": "local",
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-everything"
  ]
}
```

#### 可用工具

##### Basic 工具
- `echo`: 回傳輸入
- `add`: 兩數相加

**範例 - Echo**:
```typescript
{
  "message": "Hello, World!"
}
```

**範例 - Add**:
```typescript
{
  "a": 10,
  "b": 20
}
```

##### Development 工具
- `longRunningOperation`: 展示長時間執行操作
- `printEnv`: 列印環境變數
- `sampleLLM`: LLM 取樣示範

**範例 - Long Running Operation**:
```typescript
{
  "duration": 10,
  "steps": 5
}
```

##### Image & Resources
- `getTinyImage`: 取得範例圖片
- `getResourceReference`: 取得資源參照
- `getResourceLinks`: 取得多個資源連結

##### Advanced 工具
- `annotatedMessage`: 展示註解訊息
- `structuredContent`: 結構化內容
- `zip`: 壓縮檔案

**範例 - Structured Content**:
```typescript
{
  "location": "Taipei"
}
```

---

### 13. Filesystem (Local)

**用途**: 檔案系統操作

**配置**:
```json
{
  "type": "local",
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-filesystem",
    "./"
  ]
}
```

#### 可用工具

##### 讀取操作
- `read_text_file`: 讀取文字檔
- `read_media_file`: 讀取媒體檔 (圖片/音訊)
- `read_multiple_files`: 讀取多個檔案

**範例 - Read Text File**:
```typescript
{
  "path": "/home/runner/work/GigHub/GigHub/src/app/app.component.ts",
  "head": 50  // 僅讀取前 50 行
}
```

**範例 - Read Multiple Files**:
```typescript
{
  "paths": [
    "/src/app/app.component.ts",
    "/src/app/app.component.html",
    "/src/app/app.component.scss"
  ]
}
```

##### 寫入操作
- `write_file`: 寫入檔案
- `edit_file`: 編輯檔案

**範例 - Write File**:
```typescript
{
  "path": "/src/app/new-component.ts",
  "content": "import { Component } from '@angular/core';\n\n@Component({...})"
}
```

**範例 - Edit File**:
```typescript
{
  "path": "/src/app/app.component.ts",
  "edits": [
    {
      "oldText": "title = 'app';",
      "newText": "title = 'GigHub';"
    }
  ],
  "dryRun": false
}
```

##### 目錄操作
- `create_directory`: 建立目錄
- `list_directory`: 列出目錄內容
- `list_directory_with_sizes`: 列出目錄 (含大小)
- `directory_tree`: 顯示目錄樹

**範例 - List Directory**:
```typescript
{
  "path": "/src/app"
}
```

**範例 - Directory Tree**:
```typescript
{
  "path": "/src/app",
  "excludePatterns": ["node_modules/**", "dist/**"]
}
```

##### 搜尋操作
- `search_files`: 搜尋檔案

**範例 - Search Files**:
```typescript
{
  "path": "/src",
  "pattern": "**/*.component.ts",
  "excludePatterns": ["**/*.spec.ts", "**/node_modules/**"]
}
```

##### 其他操作
- `move_file`: 移動/重新命名檔案
- `get_file_info`: 取得檔案資訊
- `list_allowed_directories`: 列出允許存取的目錄

**範例 - Move File**:
```typescript
{
  "source": "/src/app/old-name.ts",
  "destination": "/src/app/new-name.ts"
}
```

---

### 14. Time (Local)

**用途**: 時間相關操作

**配置**:
```json
{
  "type": "local",
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-time"
  ]
}
```

#### 可用工具

##### `get_current_time`
取得當前時間

**參數**:
- `timezone` (string, required): 時區 (例如 "Asia/Taipei")

**範例**:
```typescript
{
  "timezone": "Asia/Taipei"
}
```

**回應**:
```json
{
  "timezone": "Asia/Taipei",
  "datetime": "2025-12-12T17:46:00+08:00",
  "is_dst": false
}
```

##### `convert_time`
轉換時區

**參數**:
- `source_timezone` (string, required): 來源時區
- `time` (string, required): 時間 (HH:mm)
- `target_timezone` (string, required): 目標時區

**範例**:
```typescript
{
  "source_timezone": "Asia/Taipei",
  "time": "14:30",
  "target_timezone": "America/New_York"
}
```

**回應**:
```json
{
  "source": {
    "timezone": "Asia/Taipei",
    "datetime": "2025-12-12T14:30:00+08:00"
  },
  "target": {
    "timezone": "America/New_York",
    "datetime": "2025-12-12T01:30:00-05:00"
  },
  "time_difference": "-13.0h"
}
```

---

### 15. Fetch (Local)

**用途**: HTTP 請求與網頁內容擷取

**配置**:
```json
{
  "type": "local",
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-fetch"
  ]
}
```

#### 可用工具

##### `fetch`
擷取網頁內容

**參數**:
- `url` (string, required): 目標 URL
- `max_length` (number, optional): 最大長度
- `start_index` (number, optional): 起始索引
- `raw` (boolean, optional): 是否回傳原始 HTML (預設: false, 轉為 Markdown)

**範例 - Markdown 轉換**:
```typescript
{
  "url": "https://angular.dev/guide/signals",
  "max_length": 5000,
  "start_index": 0
}
```

**範例 - Raw HTML**:
```typescript
{
  "url": "https://api.github.com/repos/angular/angular",
  "raw": true
}
```

**回應**:
```json
{
  "content": "# Angular Signals\n\nSignals are a reactive state management primitive..."
}
```

**使用場景**:
- 擷取文檔內容
- API 資料取得
- 網頁內容分析
- 研究與參考資料收集

---

### 16. 其他本地 MCP 工具

根據 `.github/copilot/mcp-servers.yml` 配置，您的專案還支援以下本地 MCP 工具。這些工具使用標準 npx 命令執行，無需額外配置：

#### 可用的其他工具
- **bash**: 執行 Bash 指令
- **postgres**: PostgreSQL 資料庫操作 (已在上方詳述)
- **memory**: 知識圖譜儲存 (已在上方詳述)
- **sequential-thinking**: 多步驟推理 (已在上方詳述)
- **software-planning-tool**: 開發規劃 (已在上方詳述)
- **everything**: 多用途工具 (已在上方詳述)
- **filesystem**: 檔案系統操作 (已在上方詳述)
- **time**: 時間工具 (已在上方詳述)
- **fetch**: HTTP 請求 (已在上方詳述)

---

## 📚 使用指南

### 基本使用流程

1. **確認 MCP 工具可用**
   ```typescript
   // 在 Copilot 中，工具會自動載入
   // 可以直接使用工具名稱呼叫
   ```

2. **呼叫工具**
   ```typescript
   // 範例：使用 Context7 取得 Angular 文檔
   {
     "tool": "resolve-library-id",
     "parameters": {
       "libraryName": "angular"
     }
   }
   
   {
     "tool": "get-library-docs",
     "parameters": {
       "context7CompatibleLibraryID": "/angular/angular",
       "topic": "signals"
     }
   }
   ```

3. **處理回應**
   ```typescript
   // 所有工具回應格式一致
   {
     "success": true,
     "data": { /* 工具特定資料 */ },
     "error": null
   }
   ```

### 常見使用模式

#### Pattern 1: 文檔查詢流程
```typescript
// Step 1: 解析程式庫 ID
resolve-library-id({ libraryName: "ng-alain" })

// Step 2: 取得文檔
get-library-docs({
  context7CompatibleLibraryID: "/ng-alain/ng-alain",
  topic: "st table"
})

// Step 3: 應用到程式碼
// 使用取得的範例程式碼實作功能
```

#### Pattern 2: 資料庫查詢與分析
```typescript
// Step 1: 列出資料表
list_tables({ schemas: ["public"] })

// Step 2: 執行查詢
execute_sql({
  query: "SELECT * FROM users WHERE role = 'admin'"
})

// Step 3: 取得效能建議
get_advisors({ type: "performance" })
```

#### Pattern 3: 瀏覽器自動化測試
```typescript
// Step 1: 導航到頁面
playwright_navigate({
  url: "https://example.com",
  browserType: "chromium"
})

// Step 2: 互動操作
playwright_fill({
  selector: "input[name='email']",
  value: "test@example.com"
})

playwright_click({
  selector: "button[type='submit']"
})

// Step 3: 驗證結果
playwright_screenshot({
  name: "test-result",
  fullPage: true
})
```

#### Pattern 4: 開發規劃
```typescript
// Step 1: 開始規劃
start_planning({
  goal: "實作使用者認證模組"
})

// Step 2: 分解任務
add_todo({
  title: "建立 Auth Service",
  description: "實作 JWT 認證邏輯",
  complexity: 7
})

add_todo({
  title: "建立 Login Component",
  description: "實作登入 UI 與表單驗證",
  complexity: 5
})

// Step 3: 追蹤進度
get_todos({})
```

---

## 🔧 疑難排解

### 常見問題

#### 1. MCP 工具無法使用
**症狀**: 呼叫工具時回傳錯誤或無回應

**解決方案**:
- 確認 `.github/workflows/copilot-setup-steps.yml` 已正確配置
- 檢查所有必要的 secrets 是否已設定
- 確認 workflow 至少成功執行一次
- 查看 GitHub Actions 日誌確認環境配置

#### 2. Context7 回傳空結果
**症狀**: `get-library-docs` 回傳空陣列或無資料

**解決方案**:
- 確認 `COPILOT_MCP_CONTEXT7` secret 已正確設定
- 檢查程式庫 ID 是否正確 (使用 `resolve-library-id` 確認)
- 嘗試不同的 topic 或使用更通用的搜尋詞
- 檢查是否有 API 配額限制

#### 3. Firebase/Firestore 連接失敗
**症狀**: 資料庫查詢工具回傳連接錯誤

**解決方案**:
- 確認 `SUPABASE_PROJECT_REF` 和 `SUPABASE_MCP_TOKEN` 正確
- 檢查 Firebase/Firestore 專案是否啟用
- 確認使用 service_role key (不是 anon key)
- 檢查網路連線與防火牆設定

#### 4. Playwright/Puppeteer 逾時
**症狀**: 瀏覽器操作逾時或卡住

**解決方案**:
- 增加 `initial_wait` 參數值
- 確認 selector 正確 (使用瀏覽器開發工具確認)
- 使用 `playwright_console_logs` 檢查錯誤
- 考慮使用 `wait` 或 `delay` 參數

#### 5. Memory 工具無法寫入
**症狀**: `create_entities` 或其他寫入操作失敗

**解決方案**:
- 確認 `MCP_MEMORY_FILE_PATH` 路徑存在且可寫入
- 檢查檔案權限
- 確認實體名稱唯一且符合格式
- 查看是否有磁碟空間不足問題

---

## 📖 參考資源

### 官方文檔
- [Model Context Protocol 官網](https://modelcontextprotocol.io/)
- [MCP Servers Repository](https://github.com/modelcontextprotocol/servers)
- [GitHub MCP Server](https://github.com/github/github-mcp-server)
- [Context7 Documentation](https://context7.com)

### GigHub 專案文檔
- **快速開始**: `.github/QUICK_START_COPILOT.md`
- **Secrets 配置**: `.github/COPILOT_SECRETS_SETUP.md`
- **下一步指南**: `.github/COPILOT_SETUP_NEXT_STEPS.md`
- **架構說明**: `.github/COPILOT_ARCHITECTURE.md`
- **Workflow 文檔**: `.github/workflows/README.md`
- **主要設定**: `.github/COPILOT_SETUP.md`

### 相關連結
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Firebase/Firestore Documentation](https://firebase.com/docs)
- [Playwright Documentation](https://playwright.dev/)
- [Angular Documentation](https://angular.dev/)
- [ng-alain Documentation](https://ng-alain.com/)

---

## 📝 更新日誌

### 2025-12-12
- ✅ 建立完整的 MCP 指令參考文檔
- ✅ 記錄所有 16 個 MCP 伺服器的工具與指令
- ✅ 新增使用範例與參數說明
- ✅ 包含常見使用模式與疑難排解指南
- ✅ 整合專案特定配置與參考資源

---

**版本**: 1.0.0  
**最後更新**: 2025-12-12  
**維護者**: @copilot  
**專案**: GigHub 工地施工進度追蹤管理系統
