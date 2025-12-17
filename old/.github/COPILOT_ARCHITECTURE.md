# GitHub Copilot Architecture for GigHub

This document visualizes how GitHub Copilot Coding Agent integrates with the GigHub repository using the custom environment setup.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      GitHub Copilot Coding Agent                     │
│                     (Ephemeral Actions Runner)                       │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │ Reads & Executes
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│           .github/workflows/copilot-setup-steps.yml                  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Job: copilot-setup-steps (MUST be this exact name)           │  │
│  │                                                                │  │
│  │ Steps:                                                         │  │
│  │ 1. ✅ Checkout repository                                     │  │
│  │ 2. ✅ Setup Node.js 20.19.0                                   │  │
│  │ 3. ✅ Enable Corepack (Yarn)                                  │  │
│  │ 4. ✅ Install dependencies (yarn install)                     │  │
│  │ 5. ✅ Verify installation                                     │  │
│  │                                                                │  │
│  │ Environment Variables:                                         │  │
│  │ - NODE_ENV: development                                        │  │
│  │ - COPILOT_MCP_CONTEXT7: ${{ secrets.COPILOT_MCP_CONTEXT7 }}  │  │
│  │ - SUPABASE_PROJECT_REF: ${{ secrets.SUPABASE_PROJECT_REF }}  │  │
│  │ - SUPABASE_MCP_TOKEN: ${{ secrets.SUPABASE_MCP_TOKEN }}      │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │ Makes Available
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Repository Secrets                                │
│  (Settings → Secrets and variables → Actions)                        │
│                                                                       │
│  🔐 COPILOT_MCP_CONTEXT7  ──────────┐                               │
│  🔐 SUPABASE_PROJECT_REF  ──────┐   │                               │
│  🔐 SUPABASE_MCP_TOKEN    ────┐ │   │                               │
│  🔐 CI_TOKEN               ──┐ │ │   │                               │
│  🔐 SURGE_LOGIN           ──┐│ │ │   │                               │
│  🔐 SURGE_TOKEN           ──┐││ │ │   │                               │
└──────────────────────────┬┬┬┬┬┬┘                                    │
                           │││││└─────────────────────┐                 │
                           ││││└──────────────────┐   │                 │
                           │││└───────────────┐   │   │                 │
                           ││└────────────┐   │   │   │                 │
                           │└─────────┐   │   │   │   │                 │
                           └──────┐   │   │   │   │   │                 │
                                  ▼   ▼   ▼   ▼   ▼   ▼                 │
┌─────────────────────────────────────────────────────────────────────┐
│              .github/copilot/mcp-servers.yml                         │
│                                                                       │
│  mcp-servers:                                                         │
│    context7:                                                          │
│      type: http                                                       │
│      url: https://mcp.context7.com/mcp                               │
│      headers:                                                         │
│        CONTEXT7_API_KEY: ${{ secrets.COPILOT_MCP_CONTEXT7 }}        │
│      tools: [get-library-docs, resolve-library-id]                   │
│                                                                       │
│    firebase:                                                          │
│      type: http                                                       │
│      url: https://mcp.firebase.com/mcp?project_ref=...              │
│      headers:                                                         │
│        Authorization: Bearer ${{ secrets.SUPABASE_MCP_TOKEN }}      │
│      tools: [*]                                                       │
│                                                                       │
│    sequential-thinking: (local MCP server)                           │
│    software-planning-tool: (local MCP server)                        │
│    filesystem: (local MCP server)                                    │
│    ... (other local tools)                                            │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │ Provides Tools To
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  GitHub Copilot Coding Agent                         │
│                      (Active Session)                                │
│                                                                       │
│  Available MCP Tools:                                                 │
│  ├─ 📚 context7                                                      │
│  │   ├─ resolve-library-id (find library documentation)             │
│  │   └─ get-library-docs (fetch API docs)                           │
│  │                                                                    │
│  ├─ 🗄️  firebase                                                     │
│  │   ├─ list_tables                                                  │
│  │   ├─ execute_sql                                                  │
│  │   ├─ apply_migration                                              │
│  │   └─ ... (all Firebase/Firestore MCP tools)                                │
│  │                                                                    │
│  ├─ 🧠 sequential-thinking (reasoning)                               │
│  ├─ 📋 software-planning-tool (planning)                             │
│  ├─ 📁 filesystem (file operations)                                  │
│  ├─ 🌐 fetch (HTTP requests)                                         │
│  ├─ ⏰ time (time operations)                                         │
│  └─ ... (other local tools)                                          │
│                                                                       │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │ Uses Instructions From
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│              .github/copilot-instructions.md                         │
│  (Main instructions file - mandatory tool usage policy)              │
│                                                                       │
│  Requires:                                                            │
│  - context7 for any library/framework question                       │
│  - sequential-thinking for complex problems                          │
│  - software-planning-tool for new features                           │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │ References
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                .github/instructions/*.instructions.md                │
│                                                                       │
│  ├─ angular.instructions.md (Angular 20 best practices)             │
│  ├─ angular-modern-features.instructions.md (Signals, etc.)         │
│  ├─ enterprise-angular-architecture.instructions.md                 │
│  ├─ ng-alain-delon.instructions.md (ng-alain framework)             │
│  ├─ ng-zorro-antd.instructions.md (Ant Design components)           │
│  ├─ typescript-5-es2022.instructions.md                             │
│  ├─ sql-sp-generation.instructions.md                               │
│  └─ memory-bank.instructions.md                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Setup Phase (When Copilot Starts)

```
GitHub Copilot Agent → Reads copilot-setup-steps.yml
                     → Executes setup job
                     → Loads secrets from repository
                     → Sets up Node.js environment
                     → Installs dependencies
                     → Makes environment ready
```

### 2. Tool Configuration Phase

```
Copilot Agent → Reads mcp-servers.yml
              → Configures MCP servers with secrets
              → Establishes connections
              ├─ Context7: COPILOT_MCP_CONTEXT7
              └─ Firebase/Firestore: SUPABASE_PROJECT_REF + SUPABASE_MCP_TOKEN
```

### 3. Development Phase (During Coding)

```
User Question → Copilot Agent
             ├─ Reads copilot-instructions.md
             ├─ Checks applicable *.instructions.md files
             └─ Uses MCP Tools
                ├─ context7: Get latest library docs
                ├─ sequential-thinking: Analyze complex problems
                ├─ firebase: Query database
                └─ filesystem: Read/write code
```

## Example Workflow

### Scenario: User asks about Angular Signals

```
1. User: "How do I use Angular Signals for state management?"
   
2. Copilot reads copilot-instructions.md
   ├─ Sees MANDATORY context7 usage policy
   └─ Must verify Angular API before answering
   
3. Copilot calls MCP tool: context7
   ├─ resolve-library-id({ libraryName: "angular" })
   │  → Returns: "/angular/angular"
   │
   └─ get-library-docs({ 
       context7CompatibleLibraryID: "/angular/angular",
       topic: "signals"
     })
     → Returns: Latest Angular 20 Signals documentation
   
4. Copilot reads angular-modern-features.instructions.md
   └─ Gets project-specific patterns and best practices
   
5. Copilot generates response
   ├─ Uses accurate, up-to-date API signatures from context7
   ├─ Follows project conventions from instructions
   └─ Provides working code example
```

## Security Model

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Security Layers                                │
│                                                                       │
│  Layer 1: GitHub Secrets                                             │
│  ├─ Encrypted at rest                                                │
│  ├─ Only accessible to authorized workflows                          │
│  └─ Never exposed in logs                                            │
│                                                                       │
│  Layer 2: Workflow Permissions                                       │
│  ├─ Minimal permissions (contents: read)                             │
│  ├─ No write access to repository                                    │
│  └─ Isolated execution environment                                   │
│                                                                       │
│  Layer 3: MCP Server Authentication                                  │
│  ├─ Context7: API key authentication                                 │
│  ├─ Firebase/Firestore: Bearer token authentication                            │
│  └─ Secrets passed securely to MCP servers                           │
│                                                                       │
│  Layer 4: Environment Isolation                                      │
│  ├─ Ephemeral runner (destroyed after use)                           │
│  ├─ No persistence of secrets                                        │
│  └─ Clean slate for each Copilot session                             │
└─────────────────────────────────────────────────────────────────────┘
```

## Configuration Files Structure

```
.github/
├── copilot-instructions.md           # Main instructions (MANDATORY reading)
│
├── instructions/                      # Modular instruction files
│   ├── angular.instructions.md
│   ├── angular-modern-features.instructions.md
│   ├── enterprise-angular-architecture.instructions.md
│   ├── ng-alain-delon.instructions.md
│   ├── ng-zorro-antd.instructions.md
│   ├── typescript-5-es2022.instructions.md
│   ├── sql-sp-generation.instructions.md
│   └── memory-bank.instructions.md
│
├── copilot/                           # Copilot configuration
│   ├── mcp-servers.yml                # MCP server definitions
│   ├── security-rules.yml             # Security policies
│   └── agents/                        # Custom agent configs
│       ├── config.yml
│       └── auto-triggers.yml
│
├── workflows/                         # GitHub Actions
│   ├── copilot-setup-steps.yml        # ⭐ Copilot environment setup
│   ├── ci.yml                         # CI/CD pipeline
│   ├── deploy-site.yml                # Deployment workflow
│   └── README.md                      # Workflows documentation
│
├── COPILOT_SETUP.md                   # Main setup guide
├── COPILOT_SECRETS_SETUP.md          # ⭐ Secrets configuration guide
├── COPILOT_SETUP_NEXT_STEPS.md       # ⭐ Action items for user
└── COPILOT_ARCHITECTURE.md            # ⭐ This file
```

## Benefits Summary

### For Developers
- ✅ **Up-to-date Documentation**: Context7 provides latest API docs
- ✅ **Project-Specific Guidance**: Custom instructions enforce standards
- ✅ **Enhanced Intelligence**: MCP tools extend Copilot capabilities
- ✅ **Consistent Environment**: Same setup for all Copilot sessions

### For Project Quality
- ✅ **Enforced Best Practices**: Instructions mandate tool usage
- ✅ **Type Safety**: TypeScript strict mode enforced
- ✅ **Security**: No hardcoded secrets, minimal permissions
- ✅ **Maintainability**: Clear architecture and documentation

### For Team Collaboration
- ✅ **Shared Knowledge**: Instructions capture team practices
- ✅ **Onboarding**: New team members get instant guidance
- ✅ **Consistency**: All Copilot responses follow same patterns
- ✅ **Transparency**: Clear documentation of setup and tools

## Maintenance

### Regular Tasks
1. **Update secrets** when tokens expire or rotate
2. **Review MCP server configs** when adding new tools
3. **Update instructions** when framework versions change
4. **Test workflow** after any configuration changes

### When to Update

| Trigger | Files to Update |
|---------|----------------|
| Framework version bump | `*.instructions.md` files |
| New MCP tool added | `mcp-servers.yml`, `agents/config.yml` |
| Secret rotation | Repository secrets (no file changes) |
| Node.js version change | `.nvmrc`, `copilot-setup-steps.yml` |
| New best practice | Relevant `*.instructions.md` |

## Troubleshooting Quick Reference

| Issue | Check | Solution |
|-------|-------|----------|
| Copilot can't access docs | Context7 secret | Verify `COPILOT_MCP_CONTEXT7` |
| Firebase/Firestore queries fail | Firebase/Firestore secrets | Check `SUPABASE_PROJECT_REF` and `SUPABASE_MCP_TOKEN` |
| Workflow doesn't run | Job name | Must be exactly `copilot-setup-steps` |
| Dependencies fail | Node version | Verify `.nvmrc` matches workflow |
| MCP tools not available | MCP config | Check `mcp-servers.yml` syntax |

## References

- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [Customizing Agent Environment](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/customize-the-agent-environment)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Context7 Documentation](https://context7.com/docs)
- [Firebase/Firestore MCP](https://firebase.com/docs/guides/mcp)

---

**Last Updated:** 2025-12-12  
**Version:** 1.0  
**Maintained By:** GigHub Development Team
