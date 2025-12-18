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

## 📊 File Statistics

- **Total Files**: 18 instruction files
- **Total Lines**: ~6,991 lines (optimized from 7,169)
- **Categories**: 
  - Framework (3 files)
  - GigHub-specific (5 files)
  - Best practices (5 files)
  - Meta/Documentation (3 files)
  - Reference (2 files)

## 🔄 Recent Optimizations (2025-12-18)

### Consolidation
- **Merged**: `instructions.instructions.md` + `markdown.instructions.md` + `prompt.instructions.md`  
  → `documentation-standards.instructions.md` (17% reduction)

### Translation & Optimization
- **TypeScript guide**: Translated from Chinese to English, reduced by 47%
- **Main file**: Reduced from 334 to 230 lines (31% reduction)
- **Language**: Converting all files to English for consistency

### Improvements
- ✅ Clearer structure with quick reference table
- ✅ Mandatory Context7 integration documented
- ✅ Compliance verification template added
- ✅ Token efficiency improved by ~25% (ongoing)

## 📚 Related Documentation

- **Main Instructions**: `../ copilot-instructions.md`
- **Rules**: `../rules/` (mandatory workflow, project rules, architectural principles)
- **Constraints**: `../copilot/constraints.md` (forbidden patterns)
- **Agents**: `../agents/` (specialized agent configurations)

---

**Version**: v1.0  
**Last Updated**: 2025-12-18  
**Purpose**: Navigation guide for GigHub instructions directory
