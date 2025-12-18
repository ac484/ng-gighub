# GigHub - Copilot Instructions

> **🔴 CRITICAL - MANDATORY COMPLIANCE REQUIRED 🔴**  
> **GitHub Copilot MUST achieve 100% passive compliance with ALL rules in this file and referenced documents.**

## ⚠️ MANDATORY PRE-TASK REQUIREMENTS

**BEFORE responding to ANY request, Copilot MUST:**

### 1. Read ALL Mandatory Rules (CRITICAL) 🔴

**YOU MUST READ these files IN ORDER:**

1. **`.github/rules/mandatory-workflow.md`** ← **START HERE** 🔴
   - Mandatory workflow for EVERY task
   - Required tool usage (Context7, Sequential Thinking, Planning Tool)
   - Quality gates and verification statements

2. **`.github/rules/project-rules.md`** ← **CORE RULES** 🔴
   - Task definition format
   - Development checklist
   - Forbidden behaviors

3. **`.github/rules/architectural-principles.md`** ← **ARCHITECTURE** 🔴
   - Ten design principles
   - Technical implementation standards
   - Security and performance requirements

4. **`.github/rules/enforcement-policy.md`** ← **ENFORCEMENT** 🔴
   - Compliance checking mechanisms
   - Violation handling procedures
   - Exception policies

5. **This file** (copilot-instructions.md) - Overview & tool usage details

### 2. Execute Mandatory Checks (CRITICAL) 🔴

**Before ANY response, verify:**

- [ ] Have I read all mandatory rule files?
- [ ] Do I need Context7 for external libraries? (If yes, MUST use)
- [ ] Do I need Sequential Thinking for complex analysis? (If yes, MUST use)
- [ ] Do I need Planning Tool for new features? (If yes, MUST use)
- [ ] Does my solution follow three-layer architecture?
- [ ] Does my solution use Repository pattern (NO direct Firestore)?
- [ ] Does my solution use Standalone Components + Signals?
- [ ] Have I avoided ALL forbidden patterns?

**IF ANY CHECK FAILS → STOP and follow mandatory workflow**

## 🎯 Quick Start (READ THIS FIRST)

**New to this project?** Read these in order:
1. **`.github/rules/README.md`** - Rules system overview ⭐
2. **`.github/rules/mandatory-workflow.md`** - Mandatory workflow ⭐🔴
3. This file (copilot-instructions.md) - Detailed tool usage
4. `.github/instructions/quick-reference.instructions.md` - Common patterns
5. `.github/copilot/constraints.md` - Forbidden practices
6. `.github/copilot/shortcuts/chat-shortcuts.md` - Chat shortcuts

---

## Project Overview

**GigHub** is an enterprise-level construction site progress tracking management system built with:
- **Angular 20** with Standalone Components and Signals
- **ng-alain 20** admin framework
- **ng-zorro-antd 20** (Ant Design for Angular)
- **Firebase/Firestore** for backend services (Authentication + Database)
- **TypeScript 5.9** with strict mode
- **RxJS 7.8** for reactive programming

### Modern Angular Features (v19+)
- ✅ **Signals**: Reactive state management with `signal()`, `computed()`, `effect()`
- ✅ **New Control Flow**: `@if`, `@for`, `@switch` syntax (replaces `*ngIf`, `*ngFor`)
- ✅ **Modern Inputs/Outputs**: `input()`, `output()`, `model()` functions
- ✅ **Functional Router Guards**: Function-based guards with `inject()`
- ⚠️ **Zoneless** (optional): Remove Zone.js dependency for better performance
- ⚠️ **SSR + Hydration** (optional): Server-side rendering with client hydration
- ⚠️ **View Transitions** (optional): Built-in page transition animations

### Development Commands

**Package Manager**: Yarn 4.9.2 (Berry)

```bash
# Install dependencies
yarn install

# Development server
yarn start              # Starts dev server at http://localhost:4200

# Build
yarn build             # Production build
yarn analyze           # Build with source maps for analysis

# Linting
yarn lint              # Run all linters
yarn lint:ts           # Lint TypeScript/Angular files
yarn lint:style        # Lint LESS styles

# Testing
yarn test              # Run unit tests with watch
yarn test-coverage     # Run tests with coverage report
yarn e2e               # Run end-to-end tests
```

**Key Configuration Files:**
- `angular.json` - Angular workspace configuration
- `tsconfig.json` - TypeScript compiler options (strict mode enabled)
- `package.json` - Dependencies and scripts
- `eslint.config.mjs` - ESLint configuration
- `stylelint.config.mjs` - Stylelint configuration

## 🚨 MANDATORY Tool Usage Policy

**CRITICAL**: This repository requires Copilot to **ALWAYS** read this instruction file and **MANDATORILY** use the following MCP tools. This is not optional.

### Tool Usage Requirements

#### 1. **context7** (MANDATORY for all library/framework questions) 🔴

**YOU MUST USE context7 BEFORE:**
- Writing ANY code using external libraries (Angular, ng-alain, ng-zorro-antd, Firebase, RxJS)
- Answering questions about framework APIs or best practices
- Implementing features with third-party dependencies
- Verifying syntax or method signatures

**Workflow (REQUIRED):**
```
1. Call resolve-library-id({ libraryName: "library-name" })
2. Call get-library-docs({ context7CompatibleLibraryID: "/lib/lib", topic: "topic" })
3. Read package.json to verify version
4. Use documentation to provide accurate answers
```

**Examples of WHEN YOU MUST USE context7:**
- "How to use Angular Signals?" → MUST call context7 first
- "ng-alain ST table setup?" → MUST call context7 first
- "Firebase authentication?" → MUST call context7 first
- "Firestore queries?" → MUST call context7 first
- "RxJS operators?" → MUST call context7 first

**❌ NEVER:**
- Guess or assume API signatures
- Provide outdated syntax
- Skip context7 verification for framework code

#### 2. **sequential-thinking** (MANDATORY for complex tasks) 🟡

**YOU MUST USE sequential-thinking WHEN:**
- Designing system architecture or new features
- Analyzing complex bugs with multiple potential causes
- Making technical trade-off decisions
- Breaking down large tasks into steps
- Planning refactoring strategies

**Workflow (REQUIRED):**
```
1. Identify the problem complexity (if >2 steps, use sequential-thinking)
2. Call sequential-thinking to analyze
3. Document the reasoning process
4. Present the solution with justification
```

#### 3. **software-planning-tool** (MANDATORY for new features) 🟢

**YOU MUST USE software-planning-tool WHEN:**
- User requests new feature development
- Planning major refactoring work
- Designing integration patterns
- Creating implementation roadmaps

**Workflow (REQUIRED):**
```
1. Call start_planning({ goal: "feature description" })
2. Call add_todo for each subtask
3. Document the plan
4. Track progress with update_todo_status
```

### Quick Reference

**ALWAYS use these tools - this is MANDATORY:**

| Scenario | Required Tool | Why |
|----------|--------------|-----|
| Any Angular/ng-alain/Firebase code | context7 | Ensure accurate, up-to-date syntax |
| Complex architectural decision | sequential-thinking | Structured reasoning process |
| New feature request | software-planning-tool | Organized implementation plan |
| Bug analysis (>2 potential causes) | sequential-thinking | Systematic problem solving |
| API usage question | context7 | Verify current documentation |

### Compliance Check

**Before providing ANY solution, ask yourself:**
1. ✅ Did I check if context7 is needed?
2. ✅ Did I check if sequential-thinking is needed?
3. ✅ Did I check if software-planning-tool is needed?
4. ✅ Did I read this instruction file?

**If answer to ANY question is NO, STOP and use the required tool(s) first.**

### MCP Auto-Triggers

**IMPORTANT**: This repository has configured automatic MCP tool triggers in `.github/copilot/agents/auto-triggers.yml`.

**What this means:**
- The system may automatically invoke MCP tools based on specific patterns or keywords
- Auto-triggers are configured for context7 to verify API signatures, check version compatibility, and validate syntax
- You should still manually invoke tools when needed, but be aware of automatic assistance

**Key Auto-Trigger Scenarios:**
1. **API Parameter Uncertainty** - Automatically queries context7 for correct function signatures
2. **Version Compatibility** - Checks for breaking changes and deprecated APIs
3. **New Framework Features** - Validates Angular 19+/20+ syntax and patterns
4. **Third-Party Packages** - Verifies ng-zorro-antd, @delon/*, and other library APIs
5. **Error Messages** - Automatically searches for official solutions to compilation errors
6. **TypeScript Type Issues** - Queries for correct type definitions

**Configuration Location**: `.github/copilot/agents/auto-triggers.yml`  
**MCP Server Config**: `.github/copilot/mcp-servers.yml`

## Repository Guidelines

### Reference Materials (Read-Only)

- **Reference Paths**: `src` (Read only), `backup-db` (Read only)
- **Purpose**: These directories contain reference implementations and legacy schemas

**Usage Principles**:
- ✅ **Read**: Study architecture, interfaces, and data models
- ✅ **Reference**: Extract design patterns and structure
- ✅ **Summarize**: Document key concepts and approaches
- ❌ **DO NOT**: Copy-paste code directly
- ❌ **DO NOT**: Replicate complex legacy code

**Workflow**:
1. Read relevant files in `src` or `backup-db`
2. Write a 3-6 line summary of design intent
3. Reimplement in new files following project conventions
4. Document referenced files in PR description

### Code Standards

**Architecture**: Three-layer architecture
- Foundation Layer: Account, Auth, Organization
- Container Layer: Blueprint, Permissions, Events
- Business Layer: Tasks, Logs, Quality

**Component Standards**:
- Use Standalone Components (no NgModules)
- Use Signals for state management (`signal()`, `computed()`, `effect()`)
- Use `inject()` for dependency injection
- Use `input()`, `output()`, `model()` instead of decorators (Angular ≥19)
- Use new control flow syntax (`@if`, `@for`, `@switch`) instead of structural directives
- Import from `SHARED_IMPORTS` for common modules

**Naming Conventions**:
- Components: `feature-name.component.ts`
- Services: `feature-name.service.ts`
- Guards: `feature-name.guard.ts`
- Use kebab-case for file names

**State Management**:
- Use Signals for component state
- Use services for shared state
- Use `@delon/cache` for persistent data
- Use RxJS with `takeUntilDestroyed()` for subscriptions

### Integration Patterns

**Angular + ng-alain**:
```typescript
import { Component, signal } from '@angular/core';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    @if (loading()) {
      <nz-spin nzSimple />
    } @else {
      <st [data]="data()" [columns]="columns" />
    }
  `
})
export class ExampleComponent {
  loading = signal(false);
  data = signal<any[]>([]);
  columns: STColumn[] = [...];
}
```

**Angular + Firebase/Firestore**:
```typescript
import { inject, signal } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export class DataService {
  private firestore = inject(Firestore);
  data = signal<any[]>([]);
  
  loadData(): void {
    const itemsCollection = collection(this.firestore, 'items');
    collectionData(itemsCollection, { idField: 'id' }).subscribe(items => {
      this.data.set(items);
    });
  }
}
```

### Quality Standards

**Code Quality**:
- TypeScript strict mode enabled
- No `any` types (use `unknown` with guards)
- Comprehensive JSDoc comments
- Unit tests for services (80%+ coverage)
- Component tests (60%+ coverage)

**Performance**:
- Use `OnPush` change detection
- Implement virtual scrolling for large lists
- Lazy load feature modules
- Optimize bundle size

**Security**:
- Use `@delon/auth` for authentication
- Implement `@delon/acl` for authorization
- Sanitize user inputs
- Follow Angular security best practices
- Implement Firestore Security Rules properly

### Review Checklist

**Before PR**:
- [ ] Referenced files documented in PR description
- [ ] Legacy code rewritten, not copied
- [ ] Tests added/updated
- [ ] No TypeScript errors
- [ ] Lint passes
- [ ] Follows project architecture
- [ ] Uses SHARED_IMPORTS
- [ ] Signals for state management
- [ ] **Uses new control flow syntax** (`@if`, `@for`, `@switch`)
- [ ] **Uses modern input/output functions** (`input()`, `output()`, `model()`)
- [ ] **Uses `inject()` for dependency injection**
- [ ] Proper error handling

## Additional Documentation

See `.github/instructions/` for detailed guidelines:
- `quick-reference.instructions.md` - **快速參考指南** ⭐ (常用模式速查)
- `angular-modern-features.instructions.md` - **Angular 現代化特性指南** ⭐
  - Signals 模式與最佳實踐
  - Standalone Components 完整指南
  - 新控制流語法 (@if, @for, @switch)
  - Zoneless Angular 架構
  - SSR + Hydration 配置
  - 內建 View Transitions
  - Functional Router Guards
  - 遷移工具使用說明
- `angular.instructions.md` - Angular 20 基礎開發指引
- `enterprise-angular-architecture.instructions.md` - 企業級架構模式
- `typescript-5-es2022.instructions.md` - TypeScript 標準
- `ng-alain-delon.instructions.md` - ng-alain & Delon 框架
- `ng-zorro-antd.instructions.md` - Ant Design 元件
- `sql-sp-generation.instructions.md` - 資料庫指引
- `memory-bank.instructions.md` - 文件模式

See `.github/copilot/` for additional resources:
- `shortcuts/chat-shortcuts.md` - **Copilot Chat 快捷指令** ⭐
- `constraints.md` - **禁止模式與約束** 🚫
- `agents/auto-triggers.yml` - **MCP 自動觸發規則** 🤖
- `mcp-servers.yml` - **MCP 伺服器配置** 🔧
- `security-rules.yml` - 安全規則配置

## Getting Help

1. **Start here**: Read this file (copilot-instructions.md)
2. **Quick patterns**: Check quick-reference.instructions.md
3. **Library questions**: Use context7 tool (MANDATORY)
4. **Complex analysis**: Use sequential-thinking tool (MANDATORY)
5. **Feature planning**: Use software-planning-tool (MANDATORY)
6. **Chat shortcuts**: Use shortcuts from chat-shortcuts.md
7. **Check constraints**: Review constraints.md for forbidden patterns
8. **Architecture docs**: Reference docs/ directory
9. **Specialized agents**: Check `.github/agents/` for domain experts

---

## 🔴 100% PASSIVE COMPLIANCE REQUIREMENT

### Mandatory Verification Process

**EVERY response MUST include this verification statement:**

```markdown
### 🔍 強制規則遵守驗證

#### 📋 Pre-Task Checks
- [x] Read all mandatory rule files (.github/rules/*.md)
- [x] Identified required tools (Context7/Sequential Thinking/Planning Tool)
- [x] Verified solution follows three-layer architecture
- [x] Confirmed Repository pattern usage (no direct Firestore)
- [x] Checked all forbidden patterns avoided

#### 🔧 Tool Usage
- Context7: [✅ Used / ❌ Not Needed / ⚠️ REQUIRED BUT NOT USED]
- Sequential Thinking: [✅ Used / ❌ Not Needed / ⚠️ REQUIRED BUT NOT USED]
- Planning Tool: [✅ Used / ❌ Not Needed / ⚠️ REQUIRED BUT NOT USED]

#### 🏗️ Architecture Compliance
- Three-layer separation: [✅ Yes / ❌ No]
- Repository pattern: [✅ Yes / ❌ No]
- Security Rules: [✅ Implemented / ❌ Not Needed / ⚠️ MISSING]

#### 💻 Code Quality
- Standalone Components: [✅ Yes / ❌ No]
- Signals usage: [✅ Yes / ❌ No]
- inject() usage: [✅ Yes / ❌ No]
- New control flow: [✅ Yes / ❌ No]
- No any types: [✅ Yes / ⚠️ Found any types]

#### 🚫 Forbidden Pattern Check
- No direct Firestore: [✅ Clean]
- No NgModule: [✅ Clean]
- No constructor injection: [✅ Clean]
- No manual subscriptions: [✅ Clean]

**Compliance Status**: [✅ 100% COMPLIANT / ⚠️ WARNINGS / ❌ VIOLATIONS]
```

### Enforcement Levels

| Level | Status | Action Required |
|-------|--------|-----------------|
| ✅ **100% COMPLIANT** | All checks pass | Proceed with response |
| ⚠️ **WARNINGS** | SHOULD rules not followed | Proceed with warnings noted |
| ❌ **VIOLATIONS** | MUST/MUST NOT violated | **STOP** - Follow mandatory workflow |

### Violation Response

**IF ANY MUST rule is violated:**

1. **STOP** immediately
2. Display violation message
3. Explain correct approach
4. Request user confirmation
5. **RESTART** with proper workflow

**Example Violation Response:**

```
🚫 MANDATORY RULE VIOLATION DETECTED

Violation: Context7 not used for external library API
Rule Level: MUST 🔴
Rule File: .github/rules/mandatory-workflow.md

Your request involves [Angular Signals API] but Context7 was not used.

Correct Workflow:
1. Call resolve-library-id({ libraryName: "angular" })
2. Call get-library-docs({ context7CompatibleLibraryID: "/angular/angular", topic: "signals" })
3. Provide solution based on official documentation

Would you like me to restart with the correct workflow? [Yes/No]
```

---

## 📢 FINAL REMINDER - 100% COMPLIANCE MANDATORY

**YOU MUST - NO EXCEPTIONS:**

### 1. Read ALL Mandatory Files FIRST 🔴
- `.github/rules/mandatory-workflow.md`
- `.github/rules/project-rules.md`
- `.github/rules/architectural-principles.md`
- `.github/rules/enforcement-policy.md`
- This file (copilot-instructions.md)

### 2. Use Required Tools ALWAYS 🔴
- **Context7** for ALL external library/framework questions (MANDATORY)
- **Sequential Thinking** for ALL complex analysis (MANDATORY)
- **Planning Tool** for ALL new feature development (MANDATORY)

### 3. Follow Architecture Rules STRICTLY 🔴
- Three-layer architecture (UI → Service → Repository)
- Repository pattern (NO direct Firestore access)
- Firestore Security Rules (MANDATORY for all collections)
- Standalone Components + Signals (NO NgModules)

### 4. Avoid ALL Forbidden Patterns 🚫
- NO direct Firestore operations
- NO NgModule usage
- NO constructor injection
- NO any types
- NO business logic in constructors
- NO manual subscription management

### 5. Provide Verification Statement EVERY TIME 📋
- Include complete verification checklist
- Mark all compliance checks
- Note any warnings or violations
- State overall compliance status

---

## 🎯 Success Criteria

**A response is considered successful ONLY IF:**

1. ✅ All mandatory rule files were read and followed
2. ✅ Required tools were used appropriately
3. ✅ Architecture rules were strictly followed
4. ✅ All forbidden patterns were avoided
5. ✅ Verification statement was included and accurate
6. ✅ Solution meets functional requirements
7. ✅ Code quality standards are met
8. ✅ Security requirements are satisfied

**ANYTHING LESS THAN 100% COMPLIANCE IS CONSIDERED FAILURE**

---

## 📚 Quick Reference Summary

**Core Principle**: ALWAYS verify with official documentation (Context7) before providing solutions.

**Architecture**: Three layers (UI → Service → Repository) with strict separation.

**Technology Stack**: Angular 20 + Standalone Components + Signals + Firebase/Firestore.

**Forbidden**: Direct Firestore, NgModule, any types, constructor injection, manual subscriptions.

**Required**: Context7, Sequential Thinking, Planning Tool (when applicable).

**Goal**: 100% passive compliance with ALL rules - no exceptions, no compromises.

---

**Version**: v2.0 (Rules-Enforced)  
**Last Updated**: 2025-12-17  
**Compliance Level**: MANDATORY - 100% Required  
**Enforcement**: Automatic verification in EVERY response

**Note**: This repository requires absolute adherence to all rules and standards. The mandatory tool usage policy and comprehensive rule system ensure you provide accurate, up-to-date, secure, and architecturally sound solutions. Quality, security, and maintainability are non-negotiable.
