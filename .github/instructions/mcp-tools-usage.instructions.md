---
description: 'Comprehensive guide for using MCP tools (Context7, Sequential Thinking, Planning Tool, Memory, Redis) in GigHub project'
applyTo: '**/*.ts, **/*.md'
---

# MCP Tools Usage Guide for GigHub

> Comprehensive guide for all Model Context Protocol (MCP) tools used in the GigHub construction site progress tracking system.

## Overview

GigHub project uses 5 MCP tools for AI-assisted development:

| Tool | Purpose | When to Use |
|------|---------|-------------|
| **Context7** | Query official library documentation | All external library/framework questions |
| **Sequential Thinking** | Structured problem-solving | Complex architecture decisions, multi-step reasoning |
| **Planning Tool** | Task decomposition & tracking | New feature development (5+ tasks) |
| **Memory** | Knowledge graph (read-only) | Query accumulated project knowledge |
| **Redis** | AI development data storage | Store temporary development state |

---

## 1. Context7 - Documentation Query Tool

**Core Principle**: Context7 is the ONLY correct way to query official documentation.

### Why Use Context7?

1. **Accuracy**: Avoid API hallucinations, use official latest docs
2. **Version-Specific**: Get correct syntax for current project versions
3. **Real-time Updates**: Query latest API changes and best practices
4. **Error Prevention**: Avoid deprecated or non-existent APIs

### Applicable Scope

Context7 **MUST be used** for all external library/framework questions:

- ✅ Angular 20.x (Signals, Standalone Components, Router, Forms)
- ✅ ng-alain 20.x (@delon/abc, @delon/form, @delon/auth, @delon/acl)
- ✅ ng-zorro-antd 20.x (Table, Form, Modal, Layout, Drawer)
- ✅ Firebase 20.x (Authentication, Firestore, Storage)
- ✅ RxJS 7.8.x (Operators, Observables, Subjects)
- ✅ TypeScript 5.9.x (Type System, Decorators, Utility Types)

### API Reference

#### resolve-library-id
Resolve library name to Context7-compatible ID.

```typescript
resolve-library-id({ libraryName: string })
```

**Selection Criteria**:
1. Exact name match
2. High/Medium source reputation
3. Higher benchmark score (max 100)
4. More code snippets

**Example**:
```typescript
resolve-library-id({ libraryName: "angular" })
// Returns: { id: "/angular/angular", name: "Angular", ... }
```

#### get-library-docs
Fetch library documentation and code examples.

```typescript
get-library-docs({
  context7CompatibleLibraryID: string,
  topic?: string,
  mode?: "code" | "info",
  page?: number
})
```

**Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `context7CompatibleLibraryID` | string | ✅ | - | ID from resolve-library-id |
| `topic` | string | ❌ | - | Query topic (concise keywords) |
| `mode` | "code" \| "info" | ❌ | "code" | code: API reference, info: concepts |
| `page` | number | ❌ | 1 | Pagination (1-10) |

**Mode Selection**:
- `mode: "code"` - API signatures, code examples, syntax validation
- `mode: "info"` - Conceptual explanations, architecture guidelines

### Standard Workflow (MANDATORY)

```
1. Identify library → 2. resolve-library-id → 3. get-library-docs → 
4. Read package.json → 5. Compare versions → 6. Answer
```

**Common Topics**:
- **Angular**: signals, standalone-components, dependency-injection, routing
- **ng-alain**: st, form, abc, auth, acl
- **ng-zorro-antd**: table, form, layout, modal, drawer
- **Firebase**: auth, security-rules, realtime, storage
- **RxJS**: operators, observables, subjects

### Token Budget Optimization

| Query Type | Est. Tokens | Use Case |
|------------|-------------|----------|
| Simple | 2,000-3,000 | Single API method |
| Standard | 5,000 | Component/service guide |
| Complex | 7,000-10,000 | Full feature implementation |
| Multi-page | +3,000-5,000/page | Deep topic exploration |

---

## 2. Sequential Thinking - Structured Problem Solving

**Core Principle**: Sequential Thinking is a structured tool for solving complex problems.

### Why Use Sequential Thinking?

1. **Structured Reasoning**: Break complex problems into manageable steps
2. **Transparent Thinking**: Show complete reasoning process for review
3. **Avoid Omissions**: Systematic thinking ensures all factors considered
4. **Decision Traceability**: Record decision process for future reference

### When to Use (MANDATORY)

Sequential Thinking **MUST be used** for:
- ✅ Architecture design decisions (choosing tech stack, design patterns)
- ✅ Technical trade-off analysis (comparing multiple approaches)
- ✅ Complex business logic analysis (multi-step process design)
- ✅ Cross-module integration planning (multiple module coordination)
- ✅ Performance optimization strategy (identify bottlenecks, solutions)
- ✅ Security risk assessment (identify threats, mitigation)

**NOT needed for**:
- ❌ Simple API queries (use Context7)
- ❌ Single file modifications (direct implementation)
- ❌ Clear requirements (direct coding)
- ❌ Documentation updates (direct edits)

### Three-Phase Model

```
1. Observe (Discover) → 2. Analyze (Understand) → 3. Propose (Solve)
```

#### Phase 1: Observe
**Goal**: Fully understand problem context

**Checklist**:
- [ ] Problem clearly described?
- [ ] Which modules/components involved?
- [ ] Current implementation status?
- [ ] What constraints exist?
- [ ] Expected goals?

**Output**: Complete problem description and context analysis

#### Phase 2: Analyze
**Goal**: Deep analysis of problem essence and possible solutions

**Checklist**:
- [ ] Root cause identified?
- [ ] What feasible solutions exist?
- [ ] Pros/cons of each solution?
- [ ] Implementation complexity?
- [ ] Impact on existing system?
- [ ] Aligned with architecture principles?

**Output**: Detailed analysis and comparison of multiple solutions

#### Phase 3: Propose
**Goal**: Recommend solution and implementation plan

**Checklist**:
- [ ] Recommended solution?
- [ ] Why this solution?
- [ ] Implementation steps?
- [ ] Required resources?
- [ ] Risks and mitigation?
- [ ] Acceptance criteria?

**Output**: Concrete executable solution and implementation plan

### Template Structure

```markdown
## Sequential Thinking: [Problem Title]

### Phase 1: Observe
**Problem Description**: [Clear description]
**Current Status**: [Implementation state]
**Constraints**: [Limitations]
**Expected Goals**: [Objectives]

### Phase 2: Analyze
**Root Cause**: [Analysis]
**Solution A**: [Description, Pros, Cons, Complexity]
**Solution B**: [Description, Pros, Cons, Complexity]
**Comparison Table**: [Decision matrix]

### Phase 3: Propose
**Recommended**: [Solution choice]
**Reasoning**: [Why]
**Implementation Plan**: [Phases with tasks]
**Risks**: [Mitigation table]
**Acceptance Criteria**: [Checklist]
```

---

## 3. Software Planning Tool - Task Management

**Core Principle**: Software Planning Tool is essential for new feature development.

### Why Use Planning Tool?

1. **Structured Planning**: Break large features into manageable tasks
2. **Progress Tracking**: Real-time task status updates
3. **Task Priority**: Clear complexity and execution order
4. **Team Collaboration**: Clear task list for team division
5. **Risk Management**: Early identification of complex tasks and risks

### When to Use (MANDATORY)

**MUST be used** for:
- ✅ New feature development (5+ tasks)
- ✅ Architecture refactoring (multiple modules)
- ✅ Complex integration (cross-system)
- ✅ Large bug fixes (multi-step process)

**NOT needed for**:
- ❌ Simple bug fixes (1-2 steps)
- ❌ Documentation updates
- ❌ Configuration adjustments
- ❌ Code formatting

### API Reference

```typescript
// Initialize planning
start_planning(goal: string): Promise<void>

// Save plan
save_plan(plan: string): Promise<void>

// Add task
add_todo(task: string, complexity?: number): Promise<string>

// Update status
update_todo_status(
  id: string, 
  status: "pending" | "in-progress" | "completed"
): Promise<void>

// Get tasks
get_todos(): Promise<Todo[]>

// Remove task
remove_todo(id: string): Promise<void>
```

### Complexity Scale

| Score | Level | Time Estimate |
|-------|-------|---------------|
| 0-2 | Simple | < 1 hour |
| 3-5 | Medium | 1-4 hours |
| 6-8 | Complex | 4-8 hours |
| 9-10 | Very Complex | > 8 hours |

### Standard Workflow

```
1. start_planning → 2. save_plan → 3. add_todo (batch) → 
4. Execute & update status → 5. Validation
```

**Example**:
```typescript
// 1. Start planning
await start_planning("Implement GigHub Task Management Module (CRUD + Realtime + Security Rules)");

// 2. Add tasks
await add_todo("Define Task TypeScript interfaces", 2);
await add_todo("Implement TaskRepository (CRUD)", 5);
await add_todo("Implement Firestore Security Rules", 7);
await add_todo("Implement TaskService (business logic)", 6);

// 3. Execute and update
await update_todo_status(taskId, "in-progress");
// ... implementation ...
await update_todo_status(taskId, "completed");
```

---

## 4. Memory - Knowledge Graph (Read-Only)

**Core Principle**: Memory is an AI development knowledge graph for accumulated project knowledge.

### Purpose

Record project knowledge, architecture patterns, design decisions, and development standards discovered during AI development (**NOT for application use**).

**Storage Location**: `.github/copilot/memory.jsonl`

### When to Use

Query accumulated project knowledge and experience from development process.

### Read-Only APIs (ALLOWED)

```typescript
// Read complete knowledge graph
read_graph(): Promise<KnowledgeGraph>

// Search related nodes
search_nodes(query: string): Promise<SearchResult>

// View entity details
open_nodes(entityName: string): Promise<Entity>
```

### FORBIDDEN Operations

- ❌ `create_entities()` - Do NOT create entities
- ❌ `create_relations()` - Do NOT create relations
- ❌ `add_observations()` - Do NOT add observations
- ❌ Direct edit of `.github/copilot/memory.jsonl`

**Note**: Memory updates should be reviewed and performed manually.

### Knowledge Categories

| Category | Examples |
|----------|----------|
| Architecture | Five Layer Architecture, Database Schema |
| Backend | Firebase, Firestore Database |
| Constraint | Agent Operation Constraints, Forbidden Practices |
| Convention | Component Export Naming |
| DevOps | Backup & Recovery, Git Workflow, Logging Standards |
| Development Practice | Facades Layer Development, Models Layer Development |
| Accessibility | Keyboard Shortcuts |

### Query Examples

```typescript
// Search architecture
const result = await search_nodes("five layer architecture");

// View entity details
const entity = await open_nodes("Five Layer Architecture");

// Search conventions
const conventions = await search_nodes("naming convention");
```

---

## 5. Redis - AI Development Data Storage

**Core Principle**: Redis stores temporary data during AI development process (**NOT for application use**).

### Purpose

Record temporary data and state during AI development process:
- Development process temporary data
- AI work state recording
- Development session data caching
- Cross-step data transfer

### When to Use

When AI development process needs to temporarily store data or state.

### API Reference

```typescript
// Set key-value
redis.set(key: string, value: string, options?: { ttl: number })

// Get value
redis.get(key: string): Promise<string | null>

// Delete key
redis.delete(key: string): Promise<void>

// List keys
redis.keys(pattern: string): Promise<string[]>
```

### Naming Conventions

```
{namespace}:{category}:{identifier}:{field}
```

**Examples**:
```
dev:task:task-1:status
dev:phase:implementation:progress
dev:analysis:complexity:result
dev:session:session-123:info
```

### Recommended Namespaces

| Namespace | Purpose | Example |
|-----------|---------|---------|
| `dev:task:*` | Task-related | `dev:task:task-1:status` |
| `dev:phase:*` | Development phase | `dev:phase:implementation:progress` |
| `dev:analysis:*` | Analysis results | `dev:analysis:complexity:result` |
| `dev:session:*` | Session info | `dev:session:session-123:info` |
| `dev:temp:*` | Temporary data | `dev:temp:cache:data` |
| `dev:context:*` | Development context | `dev:context:current:blueprint` |

### TTL Strategy

| Duration | TTL | Use Case |
|----------|-----|----------|
| Short (< 1h) | 3600 | Immediate use |
| Medium (1-24h) | 86400 | Within session |
| Long (> 24h) | Consider other storage | - |
| Permanent | ❌ Should NOT use Redis | - |

### Best Practices

**DO** ✅:
- Use for AI development process recording
- Set reasonable TTL
- Follow naming conventions
- Handle null returns
- Have fallback plans

**DON'T** ❌:
- Use for project application
- Store user data
- Store business data
- Store sensitive information
- Use in production environment

---

## Decision Tree: When to Use Which Tool?

```
Question Type?
├─ External library/framework API?
│   └─ Use Context7 🔴
│       ├─ resolve-library-id
│       └─ get-library-docs
│
├─ Complex problem (multi-step reasoning)?
│   └─ Use Sequential Thinking 🔴
│       ├─ Observe
│       ├─ Analyze
│       └─ Propose
│
├─ New feature (5+ tasks)?
│   └─ Use Planning Tool 🔴
│       ├─ start_planning
│       ├─ add_todo
│       └─ update_todo_status
│
├─ Query project knowledge?
│   └─ Use Memory (read-only) ⚠️
│       ├─ read_graph
│       ├─ search_nodes
│       └─ open_nodes
│
└─ Store temporary dev data?
    └─ Use Redis ⚠️
        ├─ redis.set
        ├─ redis.get
        └─ redis.delete
```

---

## Usage Checklist

### Before Starting Any Task

- [ ] Does it involve external libraries? → Use Context7
- [ ] Is it a complex problem? → Use Sequential Thinking
- [ ] Is it a new feature (5+ tasks)? → Use Planning Tool
- [ ] Need project knowledge? → Query Memory
- [ ] Need temporary storage? → Use Redis

### Quality Standards

- [ ] All tool usage documented
- [ ] Proper workflow followed
- [ ] Results validated
- [ ] Cross-references updated
- [ ] Best practices applied

---

## References

- Context7: https://context7.com/docs
- GigHub package.json: Check project root for versions
- Memory file: `.github/copilot/memory.jsonl`

---

**Version**: v1.0  
**Last Updated**: 2025-12-18  
**Maintainer**: GigHub Development Team
