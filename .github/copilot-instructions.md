# GigHub - GitHub Copilot Instructions

> **🔴 CRITICAL - MANDATORY COMPLIANCE REQUIRED**  
> GitHub Copilot MUST achieve 100% compliance with rules in this file and referenced documents.

## ⚠️ Pre-Task Requirements

**BEFORE responding to ANY request:**

### 1. Read Mandatory Rules (CRITICAL)

**Read in order:**

1. `.github/rules/mandatory-workflow.md` - START HERE
2. `.github/rules/project-rules.md` - Core rules
3. `.github/rules/architectural-principles.md` - Architecture
4. `.github/rules/enforcement-policy.md` - Compliance
5. This file - Overview & tools

### 2. Execute Mandatory Checks

**Verify before responding:**

- [ ] Read all mandatory rule files
- [ ] Context7 for external libraries (if applicable)
- [ ] Sequential Thinking for complex analysis (if applicable)
- [ ] Planning Tool for new features (if applicable)
- [ ] Three-layer architecture followed
- [ ] Repository pattern used (NO direct Firestore)
- [ ] Standalone Components + Signals used
- [ ] Forbidden patterns avoided

**If ANY check fails → STOP and follow mandatory workflow**

## Quick Start

**New to project? Read in order:**
1. `.github/rules/README.md` - Rules overview
2. `.github/rules/mandatory-workflow.md` - Workflow
3. This file - Tool usage
4. `.github/instructions/quick-reference.instructions.md` - Patterns
5. `.github/copilot/constraints.md` - Forbidden practices

## Project Overview

**GigHub** - Enterprise construction site progress tracking system

**Tech Stack:**
| Category | Technology | Version |
|----------|-----------|---------|
| Frontend | Angular | 20.3.x |
| Admin Framework | ng-alain | 20.1.x |
| UI Components | ng-zorro-antd | 20.3.x |
| Backend | Firebase/Firestore | 20.0.x |
| Language | TypeScript | 5.9.x |
| Reactive | RxJS | 7.8.x |
| Package Manager | Yarn | 4.9.2 |

**Modern Angular (v19+):**
- ✅ Signals: `signal()`, `computed()`, `effect()`
- ✅ Control Flow: `@if`, `@for`, `@switch`
- ✅ Modern I/O: `input()`, `output()`, `model()`
- ✅ Functional Guards: `inject()`

**Commands:**
```bash
yarn start          # Dev server (localhost:4200)
yarn build          # Production build
yarn lint           # Run linters
yarn test           # Unit tests
yarn e2e            # E2E tests
```

## MANDATORY Tool Usage

### Required MCP Tools

| Tool | When to Use | Required For |
|------|-------------|--------------|
| **Context7** | External library questions | ALL library/framework APIs |
| **Sequential Thinking** | Complex problems | Architecture, multi-step analysis |
| **Planning Tool** | New features (5+ tasks) | Task decomposition & tracking |

**Detailed Guide:** `.github/instructions/mcp-tools-usage.instructions.md`

### Context7 (MANDATORY)

**MUST use BEFORE:**
- Writing code with external libraries
- Answering framework API questions
- Implementing third-party features
- Verifying syntax/signatures

**Workflow:**
```
1. resolve-library-id({ libraryName })
2. get-library-docs({ context7CompatibleLibraryID, topic })
3. Read package.json (verify version)
4. Use documentation
```

**Examples:**
- Angular Signals → Context7 REQUIRED
- ng-alain ST table → Context7 REQUIRED
- Firebase auth → Context7 REQUIRED
- RxJS operators → Context7 REQUIRED

### Sequential Thinking (MANDATORY)

**MUST use WHEN:**
- Architecture design
- Complex bug analysis
- Technical trade-offs
- Task breakdown
- Refactoring plans

**Workflow:**
```
1. Identify complexity (>2 steps)
2. Analyze (Observe → Analyze → Propose)
3. Document reasoning
4. Present solution
```

#### 3. software-planning-tool (MANDATORY for new features)

**YOU MUST USE software-planning-tool WHEN:**
- User requests new feature development
- Planning major refactoring work
- Designing integration patterns
- Creating implementation roadmaps

**Required Workflow:**
```
1. start_planning({ goal: "feature description" })
2. add_todo for each subtask
3. Document the plan
4. Track progress with update_todo_status
```

### Quick Reference

| Scenario | Required Tool | Why |
|----------|--------------|-----|
| Angular/ng-alain/Firebase code | context7 | Ensure accurate, up-to-date syntax |
| Complex architectural decision | sequential-thinking | Structured reasoning |
| New feature request | software-planning-tool | Organized implementation plan |
| Bug analysis (>2 causes) | sequential-thinking | Systematic problem solving |
| API usage question | context7 | Verify current documentation |

### Planning Tool (MANDATORY)

**MUST use WHEN:**
- New features (5+ tasks)
- Architecture refactoring
- Complex integrations
- Large bug fixes

**Workflow:**
```
1. start_planning({ goal })
2. add_todo(task, complexity)
3. update_todo_status(id, status)
4. Track progress
```

## Development Guidelines

### Architecture

**Three-Layer Pattern:**
```
UI (Components) → Business (Services) → Data (Repositories) → Firestore
```

**Key Principles:**
- Standalone Components only
- Signals for state management
- Repository pattern for data access
- Security Rules at database level

### Code Standards

| Aspect | Requirement |
|--------|-------------|
| Components | Standalone, Signals, OnPush |
| DI | `inject()` function only |
| I/O | `input()`, `output()`, `model()` |
| Control Flow | `@if`, `@for`, `@switch` |
| Types | No `any`, use explicit types |
| Testing | 80%+ services, 60%+ components |

### Naming Conventions

```
feature-name.component.ts
feature-name.service.ts
feature-name.repository.ts
feature-name.guard.ts
```

## Documentation Structure

### Core Instructions (`.github/instructions/`)

**Framework:**
- `angular.instructions.md` - Angular 20 guide
- `ng-alain-delon.instructions.md` - Admin framework
- `typescript-5-es2022.instructions.md` - TypeScript standards

**GigHub-Specific:**
- `ng-gighub-architecture.instructions.md` - Architecture patterns
- `ng-gighub-development-workflow.instructions.md` - Development process
- `ng-gighub-firestore-repository.instructions.md` - Data access patterns
- `ng-gighub-security-rules.instructions.md` - Security implementation
- `mcp-tools-usage.instructions.md` - MCP tools comprehensive guide
- `quick-reference.instructions.md` - Quick patterns lookup

**Best Practices:**
- `a11y.instructions.md` - Accessibility
- `security-and-owasp.instructions.md` - Security guidelines
- `performance-optimization.instructions.md` - Performance tips
- `code-review-generic.instructions.md` - Review standards

### Rules (`.github/rules/`)

- `mandatory-workflow.md` - Required workflow
- `project-rules.md` - Project-specific rules
- `architectural-principles.md` - Architecture standards
- `enforcement-policy.md` - Compliance enforcement

## Compliance Verification

**Before ANY response, verify:**

| Check | Requirement |
|-------|-------------|
| Tool Usage | Context7/Sequential Thinking/Planning Tool used if needed |
| Architecture | Three-layer pattern followed |
| Data Access | Repository pattern used (no direct Firestore) |
| Components | Standalone + Signals |
| Patterns | No forbidden patterns |

**Enforcement:**
- ✅ **COMPLIANT**: All checks pass → Proceed
- ⚠️ **WARNINGS**: SHOULD rules → Proceed with note
- ❌ **VIOLATIONS**: MUST rules → STOP and correct

## Success Criteria

**Response considered successful ONLY IF:**
1. ✅ All mandatory rules followed
2. ✅ Required tools used appropriately
3. ✅ Architecture rules strictly followed
4. ✅ All forbidden patterns avoided
5. ✅ Verification completed
6. ✅ Solution meets requirements
7. ✅ Code quality standards met
8. ✅ Security requirements satisfied

**Less than 100% compliance = FAILURE**

## Core Requirements

**YOU MUST:**

1. **Read ALL Mandatory Files**
   - `.github/rules/mandatory-workflow.md`
   - `.github/rules/project-rules.md`
   - `.github/rules/architectural-principles.md`
   - `.github/rules/enforcement-policy.md`
   - This file

2. **Use Required Tools**
   - Context7 for ALL external library/framework questions
   - Sequential Thinking for ALL complex analysis
   - Planning Tool for ALL new feature development

3. **Follow Architecture Rules**
   - Three-layer architecture (UI → Service → Repository)
   - Repository pattern (NO direct Firestore)
   - Firestore Security Rules (MANDATORY for collections)
   - Standalone Components + Signals (NO NgModules)

4. **Avoid Forbidden Patterns**
   - NO direct Firestore operations
   - NO NgModule usage
   - NO constructor injection
   - NO any types
   - NO business logic in constructors
   - NO manual subscription management

5. **Provide Verification**
   - Include complete verification checklist
   - Mark all compliance checks
   - Note warnings or violations
   - State overall compliance status

## Success Criteria

**Response considered successful ONLY IF:**
1. ✅ All mandatory rule files read and followed
2. ✅ Required tools used appropriately
3. ✅ Architecture rules strictly followed
4. ✅ All forbidden patterns avoided
5. ✅ Verification statement included and accurate
6. ✅ Solution meets functional requirements
7. ✅ Code quality standards met
8. ✅ Security requirements satisfied

**Less than 100% compliance = FAILURE**

---

**Version**: v3.0 (Optimized)  
**Last Updated**: 2025-12-18  
**Compliance Level**: MANDATORY - 100% Required

**Note**: This repository requires absolute adherence to all rules and standards. The mandatory tool usage policy ensures accurate, up-to-date, secure, and architecturally sound solutions.

---

**Version**: v3.1 (Optimized)  
**Last Updated**: 2025-12-18  
**Compliance Level**: MANDATORY - 100% Required

**Note**: This repository requires absolute adherence to all rules and standards. The mandatory tool usage policy ensures accurate, up-to-date, secure, and architecturally sound solutions.

**For detailed guidance, refer to:**
- MCP Tools: `.github/instructions/mcp-tools-usage.instructions.md`
- Quick Reference: `.github/instructions/quick-reference.instructions.md`
- Architecture: `.github/instructions/ng-gighub-architecture.instructions.md`
- Workflow: `.github/instructions/ng-gighub-development-workflow.instructions.md`
