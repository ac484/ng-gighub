# ⭐️ AI Documentation Hub
# GigHub AI-Powered Development Center

> **Status**: Active  
> **Version**: 1.0.0  
> **Last Updated**: 2025-12-25

---

## 📚 Quick Navigation

This directory contains **AI-specific documentation** for the GigHub construction site progress tracking system. These documents define how AI assistants (like GitHub Copilot) should understand and work with this codebase.

### 🤖 [AI Character Profile](./🤖AI_Character_Profile_Impl.md)
**Who the AI is and how it should behave**

Read this to understand:
- AI's role and expertise areas
- Technical stack mastery requirements
- Problem-solving approach and cognitive style
- Communication standards
- Quality expectations
- Workflow execution patterns

**Use when**: You need to understand the AI's identity, responsibilities, or decision-making framework.

### 🧠 [AI Behavior Guidelines](./🧠AI_Behavior_Guidelines.md)
**Comprehensive rules and patterns for development**

Read this to understand:
- Omniscient architecture overview
- Three-layer architecture rules (UI → Service → Repository)
- Repository pattern implementation
- Angular 20 modern patterns
- Firebase integration guidelines
- Security rules and multi-tenancy
- State management with Signals
- Error handling and validation
- Testing strategies
- Performance optimization
- Common patterns and anti-patterns

**Use when**: You need specific guidance on implementation patterns, architectural decisions, or code generation workflows.

### 📋 [Task Planning Template](./📋Task_Planning_Template.md)
**Systematic task planning and execution framework**

Read this to understand:
- Task structure and metadata
- Implementation phases (Preparation → Data → Business → UI → Testing)
- File tree structure for new features
- Quality standards and acceptance criteria
- Testing strategy and risk assessment

**Use when**: Planning a new feature, module, or significant code change.

### 🌲 [File Tree Planning](./🌲File_Tree_Planning.md)
**Project structure and organization guide**

Read this to understand:
- Complete GigHub project structure
- Module organization principles
- File naming conventions
- Integration points with existing code
- Duplication prevention strategies
- Decision trees for file placement

**Use when**: Deciding where to place new files or how to organize a new module.

---

## 🎯 Quick Start Guide

### For AI Assistants (GitHub Copilot, etc.)

**Step 1: Read Character Profile First**
```
Start with: 🤖AI_Character_Profile_Impl.md
Purpose: Understand your role, expertise, and quality standards
Time: 10-15 minutes
```

**Step 2: Study Behavior Guidelines**
```
Then read: 🧠AI_Behavior_Guidelines.md
Purpose: Learn the architectural rules and patterns
Time: 30-45 minutes
```

**Step 3: Learn Task Planning**
```
Then read: 📋Task_Planning_Template.md
Purpose: Understand how to plan and execute tasks
Time: 15-20 minutes
```

**Step 4: Understand Project Structure**
```
Then read: 🌲File_Tree_Planning.md
Purpose: Learn project organization and avoid duplication
Time: 20-30 minutes
```

**Step 5: Reference During Development**
```
Consult: All documents during code generation
Purpose: Ensure compliance with project standards
Frequency: Before every code change
```

### For Human Developers

**Understanding AI Capabilities**:
1. Read Character Profile to understand what the AI can do
2. Review Behavior Guidelines to see the patterns AI follows
3. Use these as reference when reviewing AI-generated code

**Maintaining Consistency**:
- Update these documents when architectural patterns change
- Keep examples synchronized with actual codebase
- Document new patterns as they emerge

---

## 📖 Document Structure Comparison

| Aspect | Character Profile | Behavior Guidelines | Task Planning | File Tree Planning |
|--------|------------------|---------------------|---------------|-------------------|
| **Focus** | Identity & Personality | Rules & Patterns | Execution Framework | Organization & Structure |
| **Scope** | High-level principles | Detailed implementation | Task methodology | Project layout |
| **Length** | ~15 pages | ~50+ pages | ~15 pages | ~20 pages |
| **Updates** | Quarterly | As needed | As needed | As needed |
| **Audience** | AI understanding itself | AI implementing code | AI planning work | AI organizing files |
| **Style** | Narrative | Reference manual | Template | Directory guide |

---

## 🔗 Related Documentation

### Mandatory Reading (Priority Order)
1. **`.github/copilot-instructions.md`** - Core rules (MUST read first)
2. **`🤖AI_Character_Profile_Impl.md`** - AI identity (this directory)
3. **`🧠AI_Behavior_Guidelines.md`** - Implementation rules (this directory)
4. **`.github/instructions/ng-gighub-architecture.instructions.md`** - Architecture details
5. **`AGENTS.md`** - Agent boundaries

### Supporting Documentation
- `.github/instructions/ng-gighub-firestore-repository.instructions.md` - Repository pattern
- `.github/instructions/ng-gighub-signals-state.instructions.md` - State management
- `.github/instructions/ng-gighub-security-rules.instructions.md` - Security
- `.github/instructions/angular.instructions.md` - Angular best practices
- `docs/architecture(架構)/` - Architecture documentation
- `docs/reference/` - Reference guides

---

## 🎓 Key Concepts at a Glance

### Three-Layer Architecture
```
┌───────────────────────────────────┐
│    UI Components (Presentation)   │
│   src/app/routes/**/*.component   │
└───────────────────────────────────┘
              ↓ inject(Service)
┌───────────────────────────────────┐
│    Services (Business Logic)      │
│   src/app/core/*/services/*       │
└───────────────────────────────────┘
              ↓ inject(Repository)
┌───────────────────────────────────┐
│    Repositories (Data Access)     │
│   src/app/core/*/repositories/*   │
└───────────────────────────────────┘
              ↓ inject(Firestore)
┌───────────────────────────────────┐
│    Firebase/Firestore + Rules     │
└───────────────────────────────────┘
```

### Angular 20 Modern Syntax
- ✅ Standalone Components
- ✅ `inject()` for DI
- ✅ `input()` / `output()` functions
- ✅ `@if` / `@for` / `@switch` control flow
- ✅ Signals for state management
- ✅ `takeUntilDestroyed()` for subscriptions

### Firebase Integration
- ✅ Direct `@angular/fire` injection in Repositories only
- ✅ Firestore Security Rules for all collections
- ✅ AI calls only via `functions-ai`
- ✅ Multi-tenant with Blueprint ownership model

### Code Quality Standards
- ✅ Repository pattern for all Firestore access
- ✅ Business logic in Services
- ✅ UI only handles presentation
- ✅ No `any` types
- ✅ >80% test coverage for critical paths
- ✅ Security-first mindset

---

## 🚀 Common Use Cases

### Use Case 1: Creating a New Feature
**Documents to reference**:
1. Task Planning Template → Complete task planning process
2. File Tree Planning → Determine file locations and prevent duplication
3. Behavior Guidelines → "Code Generation Workflows" → "Workflow 1: New Feature (CRUD)"
4. Character Profile → "Workflow Execution"
5. Repository Pattern → Behavior Guidelines → "Repository Pattern Implementation"

### Use Case 2: Creating a New Module
**Documents to reference**:
1. File Tree Planning → "Template 2: New Module (Complete)"
2. File Tree Planning → "Module Organization Principles"
3. Task Planning Template → Phase-by-phase implementation
4. Behavior Guidelines → Three-layer architecture enforcement
5. Character Profile → Quality standards

### Use Case 3: Fixing a Bug
**Documents to reference**:
1. Behavior Guidelines → "Code Generation Workflows" → "Workflow 3: Bug Fix"
2. Character Profile → "Problem-Solving Approach"
3. File Tree Planning → Locate affected files

### Use Case 4: Reviewing Code
**Documents to reference**:
1. Character Profile → "Quality Standards" → "Code Review Checklist"
2. Behavior Guidelines → "Anti-Patterns to Avoid"
3. Character Profile → "Self-Check Before Submitting"

### Use Case 5: Understanding Architecture
**Documents to reference**:
1. Behavior Guidelines → "Omniscient Architecture Overview"
2. Behavior Guidelines → "Three-Layer Architecture Rules"
3. File Tree Planning → "Project Structure Overview"
4. Character Profile → "Design Philosophy"

### Use Case 6: Implementing Security
**Documents to reference**:
1. Behavior Guidelines → "Firestore Security Rules"
2. Behavior Guidelines → "Security Best Practices"
3. Character Profile → "Security Mindset"

### Use Case 7: Planning File Organization
**Documents to reference**:
1. File Tree Planning → Complete guide
2. File Tree Planning → "Duplication Prevention Checklist"
3. File Tree Planning → "Decision Tree: Where Should My File Go?"
4. Behavior Guidelines → "Repository Pattern Implementation"

---

## 📊 Documentation Metrics

### Character Profile
- **Pages**: ~15
- **Code Examples**: 20+
- **Sections**: 12 major sections
- **Checklists**: 3 comprehensive checklists
- **Focus**: Identity, principles, quality

### Behavior Guidelines
- **Pages**: ~50
- **Code Examples**: 50+
- **Sections**: 15 major sections
- **Patterns**: 15+ documented patterns
- **Anti-Patterns**: 4 major anti-patterns
- **Focus**: Implementation, patterns, workflows

### Task Planning Template
- **Pages**: ~15
- **Code Examples**: 10+
- **Sections**: 12 major sections
- **Templates**: 5 implementation phases
- **Focus**: Task methodology, execution

### File Tree Planning
- **Pages**: ~20
- **Code Examples**: 15+
- **Sections**: 6 major sections
- **Templates**: 4 file tree templates
- **Focus**: Project structure, organization

---

## 🔄 Maintenance Guidelines

### When to Update

**Character Profile**:
- Major architectural philosophy changes
- New quality standards
- Shift in development approach
- Quarterly review recommended

**Behavior Guidelines**:
- New patterns emerge in codebase
- Framework updates (Angular, Firebase)
- Security rule changes
- Anti-patterns discovered
- Monthly review recommended

### How to Update

1. **Identify Change**: Document what needs updating and why
2. **Review Impact**: Check affected sections
3. **Update Content**: Modify text and code examples
4. **Validate Examples**: Ensure code examples still work
5. **Cross-Reference**: Update related documents
6. **Version**: Increment version number and update date
7. **Announce**: Notify team of significant changes

---

## 🎯 Success Criteria

These documents are successful if:
- ✅ AI generates code that follows architectural principles
- ✅ Code reviews find fewer architectural violations
- ✅ New patterns are documented consistently
- ✅ Team members reference these for decisions
- ✅ Onboarding time for new AI agents is reduced
- ✅ Code quality metrics improve over time

---

## 📞 Feedback and Contributions

### Reporting Issues
If you find:
- Outdated patterns
- Incorrect examples
- Missing information
- Ambiguous guidance

Please:
1. Create an issue in GitHub
2. Tag it with `documentation` and `ai-guidelines`
3. Provide specific examples and corrections

### Contributing
To contribute:
1. Fork and create a branch
2. Make changes with clear examples
3. Test examples against actual codebase
4. Submit PR with detailed description
5. Request review from architecture team

---

## 🏆 Best Practices

### For Reading
1. **Read sequentially first time** - Don't skip sections
2. **Use as reference later** - Ctrl+F is your friend
3. **Focus on examples** - Code speaks louder than words
4. **Note anti-patterns** - Learn what NOT to do

### For Applying
1. **Check before coding** - Review relevant sections
2. **Validate after coding** - Use checklists
3. **Ask when uncertain** - Better to clarify than guess
4. **Share learnings** - Document new patterns discovered

### For Maintaining
1. **Keep examples current** - Sync with actual codebase
2. **Update proactively** - Don't wait for issues
3. **Version everything** - Track changes over time
4. **Communicate changes** - Announce updates to team

---

## 📋 Quick Reference Card

### The AI Trinity + Planning Framework
```
1. Copilot Instructions (.github/copilot-instructions.md)
   → Core mandatory rules
   
2. Character Profile (🤖AI_Character_Profile_Impl.md)
   → Who the AI is
   
3. Behavior Guidelines (🧠AI_Behavior_Guidelines.md)
   → What the AI does
   
4. Task Planning Template (📋Task_Planning_Template.md)
   → How the AI plans work
   
5. File Tree Planning (🌲File_Tree_Planning.md)
   → Where the AI places files
```

### Golden Rules (Never Violate)
1. **Three-layer architecture** - UI → Service → Repository
2. **Repository pattern** - Only repositories access Firestore
3. **Standalone components** - No NgModules
4. **inject() for DI** - No constructor injection
5. **Signals for state** - No other state libraries
6. **Security rules first** - Every collection protected

### When in Doubt
1. Check Character Profile for principles
2. Check Behavior Guidelines for patterns
3. Check actual codebase for examples
4. Ask human for clarification

---

**Version**: 1.0.0  
**Last Updated**: 2025-12-25  
**Maintained By**: GigHub Development Team  
**Status**: Active and authoritative

---

**End of README**

Welcome to the AI Documentation Hub. These documents are your guide to building high-quality, maintainable code for the GigHub project. Study them well, reference them often, and contribute to their evolution.
