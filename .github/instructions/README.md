# GigHub Instructions Directory

Detailed implementation guides for GitHub Copilot. These files are loaded on-demand based on file patterns.

## 📋 Quick Navigation

### Essential Guides
| File | Purpose | When to Read |
|------|---------|--------------|
| `quick-reference.instructions.md` | Quick pattern lookup | Need fast code examples |
| `mcp-tools-usage.instructions.md` | MCP tool usage guide | Using Context7, Sequential Thinking, Planning Tool |
| `task-implementation.instructions.md` | Task implementation workflow | Starting new tasks |

### Framework & Language
| File | Purpose | Applies To |
|------|---------|-----------|
| `angular.instructions.md` | Angular 20+ guidelines | `**/*.ts, **/*.html` |
| `ng-alain-delon.instructions.md` | ng-alain framework guide | `**/*.ts, **/*.html` |
| `typescript-5-es2022.instructions.md` | TypeScript standards | `**/*.ts` |

### GigHub Architecture (Project-Specific)
| File | Purpose | Key Topics |
|------|---------|-----------|
| `ng-gighub-architecture.instructions.md` | Three-layer architecture | UI → Service → Repository |
| `ng-gighub-development-workflow.instructions.md` | Development process | Workflow, tools, phases |
| `ng-gighub-firestore-repository.instructions.md` | Repository pattern | Data access, Firestore |
| `ng-gighub-security-rules.instructions.md` | Firestore Security Rules | Multi-tenancy, permissions |
| `ng-gighub-signals-state.instructions.md` | State management | Signals, stores, facades |

### Best Practices
| File | Purpose | Focus Area |
|------|---------|------------|
| `a11y.instructions.md` | Accessibility | WCAG 2.2, ARIA, keyboard nav |
| `security-and-owasp.instructions.md` | Security | OWASP Top 10, secure coding |
| `performance-optimization.instructions.md` | Performance | Frontend, backend, database |
| `code-review-generic.instructions.md` | Code review | Review standards, checklist |
| `self-explanatory-code-commenting.instructions.md` | Code comments | When/how to comment |

### Documentation & Meta
| File | Purpose | For |
|------|---------|-----|
| `documentation-standards.instructions.md` | Documentation standards | Creating docs, instructions, prompts |
| `ai-prompt-engineering-safety-best-practices.instructions.md` | AI prompts | Prompt engineering, safety |

## 🧭 Baseline & Precedence

- `.github/copilot-instructions.md` is the master ruleset (UI → Service → Repository, Firestore only in repositories, inject() DI, Result Pattern, no extra infra).
- Keep kebab-case `.instructions.md` names and scope `applyTo` narrowly to avoid overlap.
- Prefer reusing canonical files below instead of adding new guidance.

## 🗂️ Scope & Deduplication

| Topic | Canonical File | Notes |
|-------|----------------|-------|
| Architecture & layering | `ng-gighub-architecture.instructions.md` | Three-layer boundaries per copilot baseline. |
| Firestore data access | `ng-gighub-firestore-repository.instructions.md` | Firestore only via repositories; pair with security rules for permissions. |
| Signals & state | `ng-gighub-signals-state.instructions.md` | Preferred signal patterns. |
| Security | `security-and-owasp.instructions.md` | General secure coding; pair with security rules for enforcement. |
| Accessibility | `a11y.instructions.md` | WCAG 2.2 guidance for all UI. |
| Performance | `performance-optimization.instructions.md` | Frontend/backend/database tuning. |
| AI prompts | `ai-prompt-engineering-safety-best-practices.instructions.md` | Pair with `mcp-tools-usage.instructions.md` for tool workflows. |
| Documentation | `documentation-standards.instructions.md` | Docs, instructions, prompts. |


## 🎯 How to Use

### For GitHub Copilot
1. **Start with** `../copilot-instructions.md` for overview and mandatory checks
2. **Use Context7** for any external library questions
3. **Load specific guides** based on your task:
   - Writing components → `angular.instructions.md`
   - Data access → `ng-gighub-firestore-repository.instructions.md`
   - State management → `ng-gighub-signals-state.instructions.md`
   - Security Rules → `ng-gighub-security-rules.instructions.md`

### For Developers
1. **Quick patterns**: Use `quick-reference.instructions.md` for fast lookup
2. **New features**: Follow `task-implementation.instructions.md` workflow
3. **Architecture decisions**: Consult `ng-gighub-architecture.instructions.md`
4. **Tool usage**: Reference `mcp-tools-usage.instructions.md`

## 🏷️ Naming & Alignment

- Use kebab-case for instruction files and keep default GitHub template naming (e.g., `pull_request_template.md`) to preserve template behavior.
- Avoid duplicating guidance already covered in `.github/rules/` or `.github/PULL_REQUEST_TEMPLATE/`; reference them instead.

## 📚 Related Documentation

- **Main Instructions**: `../copilot-instructions.md`
- **Rules**: `../rules/` (mandatory workflow, project rules, architectural principles)
- **Constraints**: `../copilot/constraints.md` (forbidden patterns)
- **Agents**: `../agents/` (specialized agent configurations)

---

**Version**: v1.0  
**Last Updated**: 2025-12-20  
**Purpose**: Navigation guide for GigHub instructions directory
