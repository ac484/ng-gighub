# GigHub - GitHub Copilot Instructions

> **🔴 CRITICAL - MANDATORY COMPLIANCE REQUIRED**  
> GitHub Copilot MUST achieve 100% passive compliance with ALL rules in this file and referenced documents.

## ⚠️ PRE-TASK REQUIREMENTS

**BEFORE responding to ANY request, you MUST:**

### 1. Read ALL Mandatory Rules (CRITICAL)

**Read these files IN ORDER:**

1. **`.github/rules/mandatory-workflow.md`** - START HERE
   - Mandatory workflow for every task
   - Required tool usage (Context7, Sequential Thinking, Planning Tool)
   - Quality gates and verification statements

2. **`.github/rules/project-rules.md`** - Core development rules
   - Task definition format
   - Development checklist
   - Forbidden behaviors

3. **`.github/rules/architectural-principles.md`** - Architecture standards
   - Design principles
   - Technical implementation standards
   - Security and performance requirements

4. **`.github/rules/enforcement-policy.md`** - Compliance enforcement
   - Compliance checking mechanisms
   - Violation handling procedures
   - Exception policies

5. **This file** - Overview and tool usage details

### 2. Execute Mandatory Checks

**Before ANY response, verify:**

- [ ] Read all mandatory rule files
- [ ] Check if Context7 needed for external libraries (if yes, MUST use)
- [ ] Check if Sequential Thinking needed for complex analysis (if yes, MUST use)
- [ ] Check if Planning Tool needed for new features (if yes, MUST use)
- [ ] Verify solution follows three-layer architecture
- [ ] Confirm Repository pattern usage (NO direct Firestore)
- [ ] Verify Standalone Components + Signals usage
- [ ] Confirm all forbidden patterns avoided

**If ANY check fails → STOP and follow mandatory workflow**

## Quick Start Guide

**New to this project?** Read these in order:
1. `.github/rules/README.md` - Rules system overview
2. `.github/rules/mandatory-workflow.md` - Mandatory workflow
3. This file - Tool usage details
4. `.github/instructions/quick-reference.instructions.md` - Common patterns
5. `.github/copilot/constraints.md` - Forbidden practices

## Project Overview

**GigHub** is an enterprise-level construction site progress tracking system built with:
- **Angular 20** - Standalone Components and Signals
- **ng-alain 20** - Admin framework
- **ng-zorro-antd 20** - Ant Design UI components
- **Firebase/Firestore** - Backend services (Auth + Database)
- **TypeScript 5.9** - Strict mode enabled
- **RxJS 7.8** - Reactive programming

### Modern Angular Features (v19+)
- ✅ **Signals** - Reactive state with `signal()`, `computed()`, `effect()`
- ✅ **Control Flow** - `@if`, `@for`, `@switch` syntax
- ✅ **Modern Inputs/Outputs** - `input()`, `output()`, `model()` functions
- ✅ **Functional Guards** - Function-based guards with `inject()`

### Development Commands

**Package Manager**: Yarn 4.9.2

```bash
# Install dependencies
yarn install

# Development server  
yarn start              # http://localhost:4200

# Build
yarn build             # Production build
yarn analyze           # Build with source maps

# Linting
yarn lint              # Run all linters
yarn lint:ts           # TypeScript/Angular
yarn lint:style        # LESS styles

# Testing
yarn test              # Unit tests with watch
yarn test-coverage     # Tests with coverage
yarn e2e               # End-to-end tests
```

## MANDATORY Tool Usage

**CRITICAL**: You MUST use these MCP tools. This is not optional.

### Tool Usage Requirements

#### 1. context7 (MANDATORY for library/framework questions)

**YOU MUST USE context7 BEFORE:**
- Writing ANY code using external libraries
- Answering framework API or best practice questions
- Implementing third-party dependency features
- Verifying syntax or method signatures

**Required Workflow:**
```
1. resolve-library-id({ libraryName: "library-name" })
2. get-library-docs({ context7CompatibleLibraryID: "/lib/lib", topic: "topic" })
3. Read package.json to verify version
4. Use documentation to provide accurate answers
```

**Examples requiring context7:**
- "How to use Angular Signals?" → MUST call context7
- "ng-alain ST table setup?" → MUST call context7  
- "Firebase authentication?" → MUST call context7
- "Firestore queries?" → MUST call context7
- "RxJS operators?" → MUST call context7

**NEVER:**
- Guess or assume API signatures
- Provide outdated syntax
- Skip context7 verification

#### 2. sequential-thinking (MANDATORY for complex tasks)

**YOU MUST USE sequential-thinking WHEN:**
- Designing system architecture or new features
- Analyzing complex bugs with multiple causes
- Making technical trade-off decisions
- Breaking down large tasks into steps
- Planning refactoring strategies

**Required Workflow:**
```
1. Identify problem complexity (if >2 steps, use sequential-thinking)
2. Call sequential-thinking to analyze
3. Document reasoning process
4. Present solution with justification
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

### Compliance Check

**Before providing ANY solution:**
1. ✅ Did I check if context7 is needed?
2. ✅ Did I check if sequential-thinking is needed?
3. ✅ Did I check if software-planning-tool is needed?
4. ✅ Did I read this instruction file?

**If answer to ANY question is NO, STOP and use the required tool(s) first.**

## Repository Guidelines

### Code Standards

**Architecture**: Three-layer architecture
- Foundation Layer: Account, Auth, Organization
- Container Layer: Blueprint, Permissions, Events
- Business Layer: Tasks, Logs, Quality

**Component Standards**:
- Use Standalone Components (no NgModules)
- Use Signals for state (`signal()`, `computed()`, `effect()`)
- Use `inject()` for dependency injection
- Use `input()`, `output()`, `model()` (Angular ≥19)
- Use new control flow (`@if`, `@for`, `@switch`)
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
- Implement Firestore Security Rules

### Review Checklist

**Before PR**:
- [ ] Tests added/updated
- [ ] No TypeScript errors
- [ ] Lint passes
- [ ] Follows project architecture
- [ ] Uses SHARED_IMPORTS
- [ ] Signals for state management
- [ ] Uses new control flow syntax
- [ ] Uses modern input/output functions
- [ ] Uses `inject()` for dependency injection
- [ ] Proper error handling

## Additional Documentation

Key documentation files in `.github/instructions/`:
- `quick-reference.instructions.md` - Common patterns quick reference
- `angular-modern-features.instructions.md` - Angular modern features guide
- `angular.instructions.md` - Angular 20 development guidelines
- `enterprise-angular-architecture.instructions.md` - Enterprise architecture patterns
- `typescript-5-es2022.instructions.md` - TypeScript standards
- `ng-alain-delon.instructions.md` - ng-alain & Delon framework
- `ng-gighub-*.instructions.md` - GigHub-specific guidelines

Additional resources in `.github/copilot/`:
- `shortcuts/chat-shortcuts.md` - Copilot Chat shortcuts
- `constraints.md` - Forbidden patterns
- `agents/auto-triggers.yml` - MCP auto-trigger rules
- `mcp-servers.yml` - MCP server configuration

## Compliance Requirements

### Mandatory Verification

**EVERY response MUST include this verification:**

```markdown
### Compliance Verification

#### Pre-Task Checks
- [x] Read all mandatory rule files
- [x] Identified required tools
- [x] Verified three-layer architecture
- [x] Confirmed Repository pattern usage
- [x] Checked forbidden patterns avoided

#### Tool Usage
- Context7: [✅ Used / ❌ Not Needed / ⚠️ REQUIRED BUT NOT USED]
- Sequential Thinking: [✅ Used / ❌ Not Needed / ⚠️ REQUIRED BUT NOT USED]
- Planning Tool: [✅ Used / ❌ Not Needed / ⚠️ REQUIRED BUT NOT USED]

#### Architecture Compliance
- Three-layer separation: [✅ Yes / ❌ No]
- Repository pattern: [✅ Yes / ❌ No]
- Security Rules: [✅ Implemented / ❌ Not Needed / ⚠️ MISSING]

#### Code Quality
- Standalone Components: [✅ Yes / ❌ No]
- Signals usage: [✅ Yes / ❌ No]
- inject() usage: [✅ Yes / ❌ No]
- New control flow: [✅ Yes / ❌ No]
- No any types: [✅ Yes / ⚠️ Found any types]

#### Forbidden Pattern Check
- No direct Firestore: [✅ Clean]
- No NgModule: [✅ Clean]
- No constructor injection: [✅ Clean]
- No manual subscriptions: [✅ Clean]

**Status**: [✅ COMPLIANT / ⚠️ WARNINGS / ❌ VIOLATIONS]
```

### Enforcement Levels

| Level | Status | Action |
|-------|--------|--------|
| ✅ COMPLIANT | All checks pass | Proceed |
| ⚠️ WARNINGS | SHOULD rules not followed | Proceed with warnings |
| ❌ VIOLATIONS | MUST rules violated | STOP - Follow workflow |

### Violation Response

**If MUST rule violated:**
1. STOP immediately
2. Display violation message
3. Explain correct approach
4. Request user confirmation
5. RESTART with proper workflow

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
