# GitHub Copilot Configuration

This directory contains the GitHub Copilot configuration for the GigHub project, following [GitHub's best practices for Copilot coding agents](https://gh.io/copilot-coding-agent-tips).

## 📂 Directory Structure

```
.github/
├── copilot-instructions.md          # Main Copilot instructions (ENTRY POINT)
├── instructions/                     # Scoped instruction files
│   ├── quick-reference.instructions.md
│   ├── angular.instructions.md
│   ├── angular-modern-features.instructions.md
│   ├── enterprise-angular-architecture.instructions.md
│   ├── typescript-5-es2022.instructions.md
│   ├── ng-alain-delon.instructions.md
│   ├── ng-zorro-antd.instructions.md
│   ├── sql-sp-generation.instructions.md
│   └── memory-bank.instructions.md
├── copilot/                          # Copilot configuration files
│   ├── README.md                     # This file
│   ├── mcp-servers.yml               # MCP server configuration
│   ├── security-rules.yml            # Security rules
│   ├── constraints.md                # Forbidden patterns and anti-patterns
│   ├── agents/
│   │   └── auto-triggers.yml         # Automatic MCP tool triggers
│   └── shortcuts/
│       └── chat-shortcuts.md         # Copilot Chat shortcuts
└── agents/                           # Custom agent definitions
    ├── GigHub.agent.md
    ├── context7.agent.md
    ├── firebase.agent.md
    └── ...
```

## 🎯 How It Works

### 1. Entry Point: `copilot-instructions.md`

The main Copilot instructions file provides:
- **Project Overview**: Technology stack (Angular 20, ng-alain, ng-zorro-antd, Firebase/Firestore)
- **Mandatory Tool Usage Policy**: Rules for using MCP tools (context7, sequential-thinking, software-planning-tool)
- **Code Standards**: Architecture patterns, naming conventions, integration patterns
- **Quality Standards**: Testing, performance, security requirements
- **Development Commands**: Build, test, lint commands

### 2. Scoped Instructions: `.github/instructions/`

Domain-specific instruction files with `applyTo` directives:

| File | Applies To | Purpose |
|------|-----------|---------|
| `angular.instructions.md` | `**/*.ts, **/*.html, **/*.scss, **/*.css` | Angular development standards |
| `angular-modern-features.instructions.md` | `**/*.ts, **/*.html, **/*.scss, **/*.css` | Angular 19+/20+ modern features (Signals, new control flow) |
| `typescript-5-es2022.instructions.md` | `**/*.ts` | TypeScript 5.x standards targeting ES2022 |
| `ng-alain-delon.instructions.md` | `**/*.ts, **/*.html` | ng-alain framework and Delon components |
| `ng-zorro-antd.instructions.md` | `**/*.ts, **/*.html` | Ant Design for Angular components |
| `sql-sp-generation.instructions.md` | `**/*.sql` | SQL and stored procedure standards |
| `memory-bank.instructions.md` | `**` | Documentation patterns |

### 3. MCP Server Configuration: `mcp-servers.yml`

Defines MCP (Model Context Protocol) servers used by Copilot:

```yaml
mcp-servers:
  context7:
    type: http
    url: 'https://mcp.context7.com/mcp'
    headers: { 'CONTEXT7_API_KEY': '${{ secrets.COPILOT_MCP_CONTEXT7 }}' }
    tools: ['get-library-docs', 'resolve-library-id']
```

**Purpose**: Provides up-to-date documentation for libraries and frameworks.

### 4. Auto-Triggers: `agents/auto-triggers.yml`

Configures automatic MCP tool invocation based on patterns:

**Trigger Scenarios:**
- API parameter uncertainty → Queries context7 for correct signatures
- Version compatibility issues → Checks for breaking changes
- New framework features → Validates Angular 19+/20+ syntax
- Third-party package usage → Verifies ng-zorro-antd, @delon/* APIs
- Error messages → Searches for official solutions
- TypeScript type issues → Queries for correct type definitions

### 5. Constraints: `constraints.md`

Documents forbidden patterns and anti-patterns:
- Angular anti-patterns (decorators vs functions, NgModules vs Standalone)
- State management anti-patterns (direct Signal mutation)
- API call anti-patterns (component → Firebase/Firestore direct calls)
- Database violations (missing RLS policies)
- Security violations (XSS, SQL injection)
- Performance anti-patterns (memory leaks, unnecessary renders)

### 6. Chat Shortcuts: `shortcuts/chat-shortcuts.md`

Predefined shortcuts for common tasks:
- `/gighub-component` - Generate Angular component
- `/gighub-service` - Generate service
- `/gighub-repository` - Generate Firebase/Firestore repository
- `/gighub-store` - Generate Signal-based store
- `/gighub-review` - Review code for compliance
- `/gighub-refactor` - Refactor to modern syntax

## 🚀 Usage

### For Developers

**Start here**: Read `.github/copilot-instructions.md` to understand the project setup.

**When using Copilot:**
1. Copilot automatically reads the main instructions
2. Copilot applies scoped instructions based on file type
3. MCP tools may be automatically triggered based on patterns
4. Use chat shortcuts for common tasks

### For AI Agents

**Mandatory Actions:**
1. ✅ Read `.github/copilot-instructions.md` at the start of EVERY session
2. ✅ Use `context7` for ALL library/framework questions (MANDATORY)
3. ✅ Use `sequential-thinking` for complex problems (MANDATORY)
4. ✅ Use `software-planning-tool` for new features (MANDATORY)
5. ✅ Follow code standards and constraints
6. ✅ Reference scoped instructions for domain-specific guidance

**Compliance Check:**
- Did I check if context7 is needed? ✅
- Did I check if sequential-thinking is needed? ✅
- Did I check if software-planning-tool is needed? ✅
- Did I read the instruction file? ✅

## 📊 Statistics

- **Main Instructions**: 370 lines
- **Scoped Instructions**: 4,674 lines total
- **Total Guidance**: 5,044+ lines
- **Instruction Files**: 9 domain-specific files
- **Custom Agents**: 16+ specialized agents

## 🔧 Maintenance

### Adding New Instructions

1. **General guidance**: Update `.github/copilot-instructions.md`
2. **Domain-specific guidance**: Add new file in `.github/instructions/` with `applyTo` directive
3. **Constraints**: Update `.github/copilot/constraints.md`
4. **Auto-triggers**: Update `.github/copilot/agents/auto-triggers.yml`

### Testing Instructions

1. Ask Copilot to summarize the project setup
2. Request code generation for specific patterns
3. Verify compliance with code standards
4. Check that MCP tools are invoked correctly

## 📚 References

- [GitHub Copilot Best Practices](https://gh.io/copilot-coding-agent-tips)
- [Angular Documentation](https://angular.dev)
- [ng-alain Documentation](https://ng-alain.com)
- [ng-zorro-antd Documentation](https://ng.ant.design)
- [Firebase/Firestore Documentation](https://firebase.com/docs)

## 📝 Version History

- **2025-12-11**: Enhanced instructions with MCP auto-triggers documentation, development commands, and comprehensive setup guide
- **2025-12-10**: Initial comprehensive Copilot configuration setup
- **2025-12-03**: Added constraints and security rules
- **2025-12-02**: Initial instruction files created

---

**Last Updated**: 2025-12-11  
**Maintained By**: GigHub Development Team
