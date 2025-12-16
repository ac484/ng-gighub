# GitHub Copilot Instructions Setup

This document describes the GitHub Copilot instructions and agent configurations for the GigHub project.

## Quick Links

- **[Secrets Setup Guide](COPILOT_SECRETS_SETUP.md)** - How to configure repository secrets for MCP servers
- **[Copilot Setup Steps Workflow](.github/workflows/copilot-setup-steps.yml)** - Development environment configuration

## Overview

The repository is configured with comprehensive instructions for AI-assisted development using GitHub Copilot and custom agents with MCP (Model Context Protocol) tools.

## Directory Structure

```
.github/
├── copilot-instructions.md          # Main instructions file
├── instructions/                     # Modular instruction files
│   ├── angular.instructions.md                           # 11K - Angular 20 best practices
│   ├── angular-fire.instructions.md                      # 20K - AngularFire integration
│   ├── enterprise-angular-architecture.instructions.md   # 18K - Enterprise patterns
│   ├── memory-bank.instructions.md                       # 19K - Documentation patterns
│   ├── ng-alain-delon.instructions.md                    # 15K - ng-alain framework
│   ├── ng-zorro-antd.instructions.md                     # 16K - Ant Design for Angular
│   ├── sql-sp-generation.instructions.md                 # 5.8K - SQL guidelines
│   └── typescript-5-es2022.instructions.md               # 9.9K - TypeScript standards
└── agents/                           # Custom agent definitions
    ├── GigHub.agent.md               # Main project agent
    ├── context7+.agent.md            # Context7 integration (basic)
    ├── context7++.agent.md           # Context7 integration (advanced)
    └── firebase.agent.md             # Firebase/Firestore specialist
```

**Total Documentation**: ~115 KB across 8 instruction files

## MCP Tools Configuration

### Autonomous Tools

Three MCP tools are configured for autonomous use:

#### 1. context7
**Purpose**: Access up-to-date library documentation

**When to use**:
- Working with Angular, ng-alain, ng-zorro-antd, Firebase/Firestore
- Unsure about API signatures or best practices
- Need to verify framework-specific patterns
- Working with version-specific features

**Configuration**: `.github/agents/GigHub.agent.md`
- `resolve-library-id`: Resolves library names to Context7 IDs
- `get-library-docs`: Fetches documentation for specific topics

#### 2. sequential-thinking
**Purpose**: Multi-step reasoning for complex problems

**When to use**:
- Analyzing complex bugs
- Designing system architecture
- Making technical trade-off decisions
- Multi-step problem solving

**Configuration**: Enabled in agent tools list

#### 3. software-planning-tool
**Purpose**: Structured planning for features

**When to use**:
- Planning new features
- Refactoring large modules
- Designing integration patterns
- Creating implementation roadmaps

**Configuration**: Enabled in agent tools list

## Instruction Files

### Core Framework Instructions

#### angular.instructions.md
- Angular 20 Standalone Components
- Signals for state management
- OnPush change detection strategy
- Dependency injection with `inject()`
- Reactive forms and routing
- Testing with Jasmine + Karma

#### typescript-5-es2022.instructions.md
- TypeScript 5.x / ES2022 best practices
- Type safety and strict mode
- Async/await error handling
- Security practices
- Performance optimization

### UI Framework Instructions

#### ng-alain-delon.instructions.md
Comprehensive @delon/* framework suite:
- **@delon/abc**: ST table, business components
- **@delon/form**: Dynamic forms with JSON schema
- **@delon/auth**: Authentication and token management
- **@delon/acl**: Role-based access control
- **@delon/cache**: Caching strategies
- **@delon/chart**: Chart components (G2, Chart.js)
- **@delon/theme**: Theming and layout system
- **@delon/util**: Utility functions
- **@delon/mock**: Mock data for development

#### ng-zorro-antd.instructions.md
Ant Design for Angular component library:
- Forms with reactive forms integration
- Advanced data tables
- Modal dialogs and drawers
- Messages and notifications
- File upload with progress
- Date pickers and selects
- Tree components
- Grid system and layouts
- Theming and customization

### Integration Instructions

#### angular-fire.instructions.md
Firebase integration with AngularFire:
- **Authentication**: Email/password, Google Sign-In, guards
- **Firestore**: CRUD operations, queries, real-time listeners
- **Storage**: File upload with progress tracking
- **Security Rules**: Best practices for Firestore and Storage
- **Error Handling**: Firebase error codes
- **Testing**: Unit and integration testing
- **Single Backend**: Firebase/Firestore for authentication and database

### Architecture Instructions

#### enterprise-angular-architecture.instructions.md
Enterprise-level patterns and practices:
- **Separation of Concerns**: 4-layer architecture
- **Dependency Injection**: Best practices
- **State Management**: Signal-based and service patterns
- **Design Patterns**: Facade, Repository, Strategy, Observer
- **Modular Architecture**: Feature modules, lazy loading
- **Error Handling**: Global handler, HTTP interceptors
- **Performance**: Virtual scrolling, memoization, trackBy
- **Testing Strategies**: Unit, integration, E2E
- **Security**: Input sanitization, XSS prevention
- **Documentation**: JSDoc standards

### Database Instructions

#### sql-sp-generation.instructions.md
- SQL coding style
- Query structure and optimization
- Stored procedure conventions
- Parameter handling
- Transaction management
- Security best practices

### Documentation Instructions

#### memory-bank.instructions.md
- Documentation patterns
- Knowledge organization
- Task management
- Progress tracking

## Key Technology Stack

### Frontend
- **Angular**: 20.3.x (Standalone Components, Signals)
- **ng-alain**: 20.1.x (Admin framework)
- **ng-zorro-antd**: 20.3.x (UI component library)
- **TypeScript**: 5.9.x (Strict mode)
- **RxJS**: 7.8.x (Reactive programming)

### Backend
- **Firebase**: 20.0.x (Authentication & Firestore database)
- **Firebase**: Optional integration via AngularFire 20.0.1

### Build Tools
- **Angular CLI**: 20.3.x
- **Yarn**: 4.9.2 (Package manager)

## Architectural Patterns

### Three-Layer Architecture
1. **Foundation Layer**: Account, Auth, Organization
2. **Container Layer**: Blueprint, Permissions, Events
3. **Business Layer**: Tasks, Logs, Quality

### Directory Structure
```
src/app/
├── core/           # Core services and infrastructure
│   ├── facades/    # Facade pattern (business logic)
│   ├── infra/      # Repository pattern (data access)
│   └── net/        # HTTP interceptors
├── routes/         # Feature modules
├── shared/         # Shared components and utilities
└── layout/         # Layout components
```

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

## Usage Examples

### Using context7 for Library Questions

```typescript
// Copilot will automatically:
// 1. Call resolve-library-id({ libraryName: "ng-alain" })
// 2. Call get-library-docs({ context7CompatibleLibraryID: "/ng-alain/ng-alain", topic: "st" })
// 3. Provide version-specific, documented guidance

// User: "How do I use ng-alain ST table?"
// Copilot: [Fetches latest ng-alain documentation]
//          [Provides code example with best practices]
//          [Includes version compatibility notes]
```

### Using sequential-thinking for Architecture

```typescript
// User: "How should I architect the real-time notification system?"
// Copilot: [Uses sequential-thinking]
//          [Analyzes requirements step by step]
//          [Considers multiple approaches]
//          [Evaluates trade-offs]
//          [Provides structured recommendation]
```

### Using software-planning-tool for Features

```typescript
// User: "Plan the implementation of the dashboard module"
// Copilot: [Uses software-planning-tool]
//          [Creates implementation plan]
//          [Breaks into subtasks]
//          [Estimates complexity]
//          [Provides step-by-step roadmap]
```

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
- Parameterized SQL queries
- HTTPS only for API calls
- Secrets in secure storage

## Custom Agents

### GigHub.agent.md
Main project agent with full MCP tool access:
- context7 for documentation
- sequential-thinking for reasoning
- software-planning-tool for planning
- Memory and Redis for state management
- Playwright for E2E testing
- Firebase/Firestore integration

### context7+.agent.md / context7++.agent.md
Specialized Context7 agents with different capability levels for library documentation queries.

### firebase.agent.md

Firebase/Firestore specialist agent for database design, Security Rules, and backend integration.

**Expertise**:
- Firestore data modeling
- Security Rules configuration
- Firebase Authentication
- Real-time updates
- Query optimization

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

## Troubleshooting

### Copilot Not Following Instructions
- Verify instructions are in `.github/` directory
- Check file naming follows pattern: `*.instructions.md`
- Ensure frontmatter is correctly formatted with `applyTo` and `description`

### MCP Tools Not Working
- Verify agent configuration in `.github/agents/`
- Check tool names match exactly
- Ensure MCP servers are configured in GitHub settings
- **Check repository secrets are properly configured** - See [COPILOT_SECRETS_SETUP.md](COPILOT_SECRETS_SETUP.md)

### Version Mismatches
- Use context7 to fetch current version documentation
- Update `package.json` to match project requirements
- Run `yarn install` to update dependencies

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

## Contributing

When contributing to instruction files:

1. Follow existing file structure
2. Include practical examples
3. Document version compatibility
4. Add JSDoc-style comments
5. Test instructions with Copilot
6. Update this README if needed

## License

Same as the main repository license.
