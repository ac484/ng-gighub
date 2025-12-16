# GitHub Copilot Setup Guide

Complete guide for setting up GitHub Copilot Coding Agent with MCP tools for the GigHub project.

## Quick Start (3 Steps, ~10 minutes)

### Step 1: Add Repository Secrets (5 minutes)

Navigate to: **https://github.com/7Spade/GigHub/settings/secrets/actions**

Add these three required secrets:

| Secret Name | Where to Get It | Purpose |
|-------------|----------------|---------|
| `COPILOT_MCP_CONTEXT7` | [Context7.com](https://context7.com) → Sign up → API Keys | Access latest library docs (Angular, ng-alain, etc.) |
| `SUPABASE_PROJECT_REF` | [Firebase Dashboard](https://console.firebase.google.com) → Project → Settings → General → Project ID | Connect to Firebase/Firestore project |
| `SUPABASE_MCP_TOKEN` | [Firebase Dashboard](https://console.firebase.google.com) → Project → Settings → Service Accounts → Generate new private key | Authenticate with Firebase/Firestore |

### Step 2: Test Workflow (2 minutes)

Option A - Automatic:
```bash
git push  # Any push will trigger the workflow
```

Option B - Manual:
1. Go to: https://github.com/7Spade/GigHub/actions
2. Click "Copilot Setup Steps" workflow
3. Click "Run workflow" button

### Step 3: Verify (1 minute)

Check that workflow succeeded:
1. Go to: https://github.com/7Spade/GigHub/actions
2. Look for green checkmark ✅ on "Copilot Setup Steps" run
3. If failed, check error logs and verify secrets are correct

---

## What This Enables

✅ **Context7 Integration** - Access up-to-date documentation for Angular, ng-alain, ng-zorro-antd, Firebase  
✅ **Firebase/Firestore MCP** - Database operations and Security Rules  
✅ **Pre-installed Dependencies** - Node.js 20.19.0, Yarn, project dependencies  
✅ **MCP Tools Suite** - sequential-thinking, software-planning-tool, filesystem, and more

---

## Overview

The repository is configured with comprehensive instructions for AI-assisted development using GitHub Copilot and custom agents with MCP (Model Context Protocol) tools.

### Directory Structure

```
.github/
├── copilot-instructions.md          # Main instructions file
├── instructions/                     # Modular instruction files
│   ├── angular-modern-features.instructions.md
│   ├── enterprise-angular-architecture.instructions.md
│   ├── memory-bank.instructions.md
│   ├── ng-alain-delon.instructions.md
│   ├── ng-zorro-antd.instructions.md
│   ├── quick-reference.instructions.md
│   ├── sql-sp-generation.instructions.md
│   └── typescript-5-es2022.instructions.md
├── agents/                           # Custom agent definitions
│   ├── ng-gighub.agent.md           # Main project agent
│   └── ... (other specialized agents)
└── copilot/                          # Copilot configuration
    ├── mcp-servers.yml               # MCP server configuration
    ├── constraints.md                # Forbidden patterns
    └── shortcuts/                    # Chat shortcuts
```

---

## MCP Tools Configuration

Three autonomous MCP tools are configured:

### 1. context7
**Purpose**: Access up-to-date library documentation

**When to use**:
- Working with Angular, ng-alain, ng-zorro-antd, Firebase/Firestore
- Unsure about API signatures or best practices
- Need to verify framework-specific patterns
- Working with version-specific features

**Configuration**: `.github/copilot/mcp-servers.yml`

### 2. sequential-thinking
**Purpose**: Multi-step reasoning for complex problems

**When to use**:
- Analyzing complex bugs
- Designing system architecture
- Making technical trade-off decisions
- Multi-step problem solving

### 3. software-planning-tool
**Purpose**: Structured planning for features

**When to use**:
- Planning new features
- Refactoring large modules
- Designing integration patterns
- Creating implementation roadmaps

---

## Key Technology Stack

### Frontend
- **Angular**: 20.3.x (Standalone Components, Signals)
- **ng-alain**: 20.1.x (Admin framework)
- **ng-zorro-antd**: 20.3.x (UI component library)
- **TypeScript**: 5.9.x (Strict mode)
- **RxJS**: 7.8.x (Reactive programming)

### Backend
- **Firebase**: 20.0.x (Authentication & Firestore database)
- **AngularFire**: 20.0.1 (Firebase integration)

### Build Tools
- **Angular CLI**: 20.3.x
- **Yarn**: 4.9.2 (Package manager)

---

## Architectural Patterns

### Three-Layer Architecture
1. **Foundation Layer**: Account, Auth, Organization
2. **Container Layer**: Blueprint, Permissions, Events
3. **Business Layer**: Tasks, Logs, Quality

### Component Standards
- Standalone components (no NgModules)
- SHARED_IMPORTS for common modules
- Signals for state management
- OnPush change detection
- `inject()` for dependency injection
- `input()`, `output()` functions (Angular ≥19)

### Naming Conventions
- **Files**: kebab-case (`user-list.component.ts`)
- **Components**: PascalCase (`UserListComponent`)
- **Services**: PascalCase with suffix (`UserService`)
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE

---

## Detailed Secrets Configuration

### Context7 MCP Server

**Secret Name:** `COPILOT_MCP_CONTEXT7`  
**Description:** API key for Context7 MCP server  
**Purpose:** Provides Copilot with access to up-to-date documentation for Angular, ng-alain, ng-zorro-antd, Firebase, and other libraries

**How to obtain:**
1. Sign up at [Context7.com](https://context7.com)
2. Navigate to your dashboard → API Keys
3. Generate a new API key
4. Copy the key and add it as a repository secret

### Firebase/Firestore Project Reference

**Secret Name:** `SUPABASE_PROJECT_REF`  
**Description:** Firebase project ID  
**Purpose:** Identifies your Firebase project for MCP server connection  
**Example Format:** `gighub-project-id`

**How to obtain:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to Project Settings (⚙️) → General
4. Copy the "Project ID" value
5. Add it as a repository secret

### Firebase/Firestore MCP Token

**Secret Name:** `SUPABASE_MCP_TOKEN`  
**Description:** Firebase service account private key  
**Purpose:** Authenticates Copilot Coding Agent with Firebase/Firestore

**How to obtain:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to Project Settings (⚙️) → Service Accounts
4. Click "Generate new private key"
5. Download the JSON file
6. Copy the entire JSON content
7. Add it as a repository secret
   - **Note:** This is a sensitive key with full database access. Store securely.

### Optional: CI Token

**Secret Name:** `CI_TOKEN`  
**Description:** GitHub Personal Access Token for CI operations  
**Purpose:** Used by CI workflows for commenting on PRs and other GitHub operations

**How to obtain:**
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with scopes: `repo`, `workflow`
3. Add it as a repository secret

---

## Testing Your Setup

After completing the setup, test Copilot with these prompts:

```
"How do I use Angular Signals for state management?"
→ Should access Context7 for latest Angular docs

"Show me how to configure ng-alain ST table"
→ Should use Context7 for ng-alain documentation

"Design a Firestore data model for task management"
→ Should use Firebase/Firestore expertise
```

---

## Troubleshooting

### Workflow Not Running
- Check job name is exactly `copilot-setup-steps` in `.github/workflows/copilot-setup-steps.yml`
- Verify workflow file has correct YAML syntax
- Check GitHub Actions is enabled for the repository

### Secrets Not Found
- Verify secret names match exactly (case-sensitive)
- Ensure secrets are added at repository level (not environment)
- Check secrets are not empty or expired

### Context7 Fails
- Verify `COPILOT_MCP_CONTEXT7` contains a valid API key
- Check your Context7 account has active subscription
- Test the API key directly with Context7 API

### Firebase/Firestore Fails
- Verify both `SUPABASE_PROJECT_REF` and `SUPABASE_MCP_TOKEN` are set
- Check project ID matches your Firebase project
- Ensure service account key is valid JSON
- Verify Firebase project has required APIs enabled

---

## Security Best Practices

### Secret Management
- ✅ Never commit secrets to version control
- ✅ Use repository secrets for sensitive data
- ✅ Rotate secrets regularly (every 90 days recommended)
- ✅ Use minimal required permissions for service accounts
- ✅ Monitor secret usage in audit logs

### Firebase Security
- ✅ Use service accounts with least-privilege principle
- ✅ Enable Firebase Security Rules for Firestore collections
- ✅ Implement proper authentication checks
- ✅ Use Firebase App Check for additional security
- ✅ Monitor Firebase usage and set billing alerts

---

## Best Practices

### When Writing Code
1. **Always use SHARED_IMPORTS** for common modules
2. **Use Signals** for component state
3. **Use inject()** for dependency injection
4. **Implement OnPush** change detection
5. **Add JSDoc** comments for public APIs
6. **Write tests** for new functionality
7. **Follow naming conventions** consistently

### When Using External Libraries
1. **Use context7** to verify API usage
2. **Check version compatibility** in package.json
3. **Follow framework patterns** (ng-alain, ng-zorro)
4. **Implement error handling** appropriately
5. **Add tests** for integrations

### When Planning Features
1. **Use software-planning-tool** for complex features
2. **Break down** into small, manageable tasks
3. **Consider architecture** patterns (Facade, Repository)
4. **Document decisions** in code comments
5. **Update instruction files** if new patterns emerge

---

## Quality Standards

### Code Coverage
- Services: 80%+ coverage
- Components: 60%+ coverage
- Utilities: 100% coverage
- Stores: 100% coverage

### Performance Metrics
- FCP (First Contentful Paint): < 1.5s
- LCP (Largest Contentful Paint): < 2.5s
- INP (Interaction to Next Paint): < 200ms

### Security Requirements
- No `any` types (use `unknown` with guards)
- Input sanitization for user content
- Firestore Security Rules for all collections
- Parameterized queries for all database operations
- HTTPS only for API calls
- Secrets in secure storage

---

## Resources

### Documentation
- [Angular Documentation](https://angular.dev)
- [ng-alain Documentation](https://ng-alain.com)
- [ng-zorro-antd Documentation](https://ng.ant.design)
- [Firebase Documentation](https://firebase.google.com/docs)
- [AngularFire Documentation](https://github.com/angular/angularfire)

### GitHub Copilot
- [Copilot Instructions Syntax](https://docs.github.com/en/copilot/customizing-copilot)
- [Customizing Copilot Agent Environment](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/customize-the-agent-environment)
- [Using Secrets in GitHub Actions](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
- [MCP Documentation](https://modelcontextprotocol.io)

---

## Maintenance

### Updating Instructions
When framework versions are updated or new patterns are established:

1. Update relevant instruction files in `.github/instructions/`
2. Update agent configurations in `.github/agents/` if needed
3. Update `package.json` with new versions
4. Run tests to verify compatibility
5. Document changes in commit messages

### Adding New Frameworks
When adding new frameworks to the project:

1. Create new instruction file: `.github/instructions/{framework}.instructions.md`
2. Follow existing file structure and formatting
3. Include comprehensive examples
4. Document integration patterns
5. Update main `copilot-instructions.md` to reference new file

---

**Time to Complete:** ~10 minutes  
**Difficulty:** Easy  
**Status:** Ready for configuration

Need additional help? Check the detailed documentation in `.github/instructions/` directory.
