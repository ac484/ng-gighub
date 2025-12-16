# GitHub Copilot Instructions - Validation Guide

This document helps you verify that GitHub Copilot is correctly reading and applying the instructions configured for the GigHub project.

## What to Validate

### 1. Main Instructions File

**Location**: `.github/copilot-instructions.md`

**Check**:
- ✅ File exists and is readable
- ✅ Contains project overview and guidelines
- ✅ References instruction files correctly
- ✅ Includes mandatory tool usage policy
- ✅ Lists development commands and project structure

**How to Verify**:
```bash
# Check file exists
ls -la .github/copilot-instructions.md

# Verify content
head -50 .github/copilot-instructions.md
```

### 2. Instruction Files

**Location**: `.github/instructions/*.instructions.md`

**Required Files**:
1. ✅ `quick-reference.instructions.md` - Quick reference patterns
2. ✅ `angular-modern-features.instructions.md` - Angular 19+/20+ features
3. ✅ `enterprise-angular-architecture.instructions.md` - Architecture patterns
4. ✅ `typescript-5-es2022.instructions.md` - TypeScript standards
5. ✅ `ng-alain-delon.instructions.md` - ng-alain framework guide
6. ✅ `ng-zorro-antd.instructions.md` - Ant Design components
7. ✅ `sql-sp-generation.instructions.md` - SQL guidelines
8. ✅ `memory-bank.instructions.md` - Documentation patterns

**How to Verify**:
```bash
# List all instruction files
ls -lh .github/instructions/*.instructions.md

# Count instruction files (should be 8)
ls .github/instructions/*.instructions.md | wc -l

# Check each file has YAML frontmatter
for file in .github/instructions/*.instructions.md; do
  echo "=== $file ==="
  head -5 "$file"
  echo ""
done
```

**Each File Should Have**:
```markdown
```instructions
---
description: 'Clear description of what this instruction covers'
applyTo: '**/*.ts, **/*.html, **/*.css'
---

# Main Content...
```
```

### 3. Custom Agent

**Location**: `.github/agents/ng-gighub.agent.md`

**Check**:
- ✅ File exists
- ✅ Contains YAML frontmatter with name, description, and tools
- ✅ MCP servers configured (context7)
- ✅ Tool list includes required tools

**How to Verify**:
```bash
# Check file exists
ls -la .github/agents/ng-gighub.agent.md

# Verify frontmatter
head -20 .github/agents/ng-gighub.agent.md
```

### 4. MCP Servers Configuration

**Location**: `.github/copilot/mcp-servers.yml`

**Check**:
- ✅ context7 server configured
- ✅ API key reference (secrets.COPILOT_MCP_CONTEXT7)
- ✅ Server URL and tools list

**How to Verify**:
```bash
# Check file exists
ls -la .github/copilot/mcp-servers.yml

# Verify configuration
cat .github/copilot/mcp-servers.yml
```

### 5. Copilot Setup Steps Workflow

**Location**: `.github/workflows/copilot-setup-steps.yml`

**Check**:
- ✅ Job name is exactly `copilot-setup-steps`
- ✅ Node.js version matches `.nvmrc`
- ✅ Yarn is properly configured
- ✅ Dependencies are installed
- ✅ Secrets are properly referenced

**How to Verify**:
```bash
# Check file exists
ls -la .github/workflows/copilot-setup-steps.yml

# Verify job name
grep "copilot-setup-steps:" .github/workflows/copilot-setup-steps.yml

# Check Node.js version reference
grep "node-version-file" .github/workflows/copilot-setup-steps.yml
```

## Testing Copilot Instructions

### Method 1: Ask Copilot About Project Standards

Try these prompts in GitHub Copilot Chat:

1. **Test Framework Knowledge**:
   ```
   @workspace How should I create a new Angular component in this project?
   ```
   
   **Expected Response Should Include**:
   - Standalone component
   - Use `inject()` for DI
   - Use `input()`/`output()` functions
   - OnPush change detection
   - Signals for state management
   - New control flow syntax (@if, @for, @switch)

2. **Test Library Integration**:
   ```
   @workspace How do I create a simple table using ng-alain?
   ```
   
   **Expected Response Should Include**:
   - Use ST (Simple Table) component
   - Import from @delon/abc/st
   - STColumn interface usage
   - Example code with Signals

3. **Test Architecture Knowledge**:
   ```
   @workspace What is the three-layer architecture used in this project?
   ```
   
   **Expected Response Should Include**:
   - Foundation Layer (Account, Auth, Organization)
   - Container Layer (Blueprint, Permissions, Events)
   - Business Layer (Tasks, Logs, Quality)

4. **Test Tool Usage**:
   ```
   @workspace When should I use context7 tool?
   ```
   
   **Expected Response Should Include**:
   - For ANY framework/library questions
   - Before writing Angular/ng-alain/Firebase code
   - To verify API signatures
   - Mandatory usage policy

### Method 2: Code Generation Test

Ask Copilot to generate code and verify it follows project standards:

```
@workspace Generate a task list component that displays tasks from Firestore
```

**Verify Generated Code**:
- ✅ Uses standalone component
- ✅ Imports SHARED_IMPORTS
- ✅ Uses inject() for DI
- ✅ Uses Signals (signal, computed)
- ✅ Uses new control flow (@if, @for)
- ✅ Follows Repository pattern for Firestore
- ✅ Includes proper TypeScript types
- ✅ Has OnPush change detection

### Method 3: Check MCP Tool Access

Ask Copilot to use Context7:

```
@workspace Use context7 to show me how to use Angular Signals computed function
```

**Expected Behavior**:
- Copilot should acknowledge using context7
- Should provide up-to-date Angular 20 documentation
- Should show correct API signatures
- Should include version-specific examples

### Method 4: Workflow Verification

Check that the copilot-setup-steps workflow runs successfully:

1. **Navigate to Actions**:
   ```
   https://github.com/7Spade/ng-gighub/actions
   ```

2. **Find "Copilot Setup Steps" workflow**

3. **Verify Latest Run**:
   - ✅ Workflow completed successfully
   - ✅ All steps passed
   - ✅ Dependencies installed
   - ✅ No error messages

4. **Manual Trigger Test**:
   - Go to Actions → Copilot Setup Steps
   - Click "Run workflow"
   - Select branch
   - Verify successful execution

## Common Issues and Solutions

### Issue 1: Copilot Not Reading Instructions

**Symptoms**:
- Copilot generates code that doesn't follow project standards
- No mention of project-specific guidelines

**Solutions**:
1. Verify `.github/copilot-instructions.md` exists
2. Check file is not empty or corrupted
3. Ensure YAML frontmatter is properly formatted in instruction files
4. Restart Copilot or reload VS Code window

### Issue 2: MCP Tools Not Working

**Symptoms**:
- Copilot says "I don't have access to context7"
- Cannot query library documentation

**Solutions**:
1. Verify `COPILOT_MCP_CONTEXT7` secret is set in repository settings
2. Check `.github/copilot/mcp-servers.yml` configuration
3. Ensure copilot-setup-steps workflow ran successfully
4. Verify API key is valid and not expired

### Issue 3: Instruction Files Not Applied

**Symptoms**:
- Copilot ignores specific file type instructions
- Generated code doesn't match `applyTo` patterns

**Solutions**:
1. Check YAML frontmatter format:
   ```yaml
   ---
   description: 'Description here'
   applyTo: '**/*.ts, **/*.html'
   ---
   ```
2. Verify file extension matches pattern
3. Ensure instruction blocks start with ` ```instructions`
4. Check for syntax errors in markdown

### Issue 4: Custom Agent Not Working

**Symptoms**:
- Cannot reference custom agent
- Agent tools not available

**Solutions**:
1. Verify `.github/agents/ng-gighub.agent.md` exists
2. Check YAML frontmatter is valid
3. Ensure tools list includes required tools
4. Verify MCP server configuration

### Issue 5: Workflow Not Running

**Symptoms**:
- copilot-setup-steps workflow doesn't trigger
- Environment not properly configured

**Solutions**:
1. Check job name is exactly `copilot-setup-steps`
2. Verify workflow file is in `.github/workflows/`
3. Ensure workflow triggers are correct
4. Check repository permissions

## Validation Checklist

Use this checklist to verify complete setup:

### Files and Structure
- [ ] `.github/copilot-instructions.md` exists and is complete
- [ ] All 8 instruction files exist in `.github/instructions/`
- [ ] Each instruction file has proper YAML frontmatter
- [ ] Custom agent file exists at `.github/agents/ng-gighub.agent.md`
- [ ] MCP servers config exists at `.github/copilot/mcp-servers.yml`
- [ ] Workflow file exists at `.github/workflows/copilot-setup-steps.yml`

### Content Validation
- [ ] Main instructions file references all instruction files
- [ ] Tool usage policy is clearly stated
- [ ] Project overview is accurate and up-to-date
- [ ] Development commands are listed
- [ ] Architecture patterns are documented

### Functional Testing
- [ ] Copilot recognizes project standards when asked
- [ ] Generated code follows project conventions
- [ ] MCP tools (context7) are accessible
- [ ] Workflow runs successfully
- [ ] Secrets are properly configured

### Integration Testing
- [ ] Copilot generates Angular 20 code with Signals
- [ ] Uses new control flow syntax (@if, @for, @switch)
- [ ] Follows ng-alain patterns for business components
- [ ] Uses inject() for dependency injection
- [ ] Generates proper TypeScript types

## Getting Help

If validation fails or issues persist:

1. **Review Documentation**:
   - [Copilot Setup Guide](.github/COPILOT_SETUP.md)
   - [Secrets Setup](.github/COPILOT_SECRETS_SETUP.md)
   - [GitHub Docs](https://docs.github.com/en/copilot)

2. **Check GitHub Status**:
   - Visit https://www.githubstatus.com/
   - Verify Copilot service is operational

3. **Contact Support**:
   - GitHub Copilot Support
   - Repository maintainers

4. **Debug Logs**:
   - Check workflow logs in Actions tab
   - Review Copilot extension logs in VS Code
   - Check browser console for errors

## Best Practices

1. **Keep Instructions Updated**:
   - Review and update instructions when project standards change
   - Update version numbers in instruction files
   - Document new patterns and practices

2. **Test After Changes**:
   - Run validation after modifying instruction files
   - Test with sample code generation
   - Verify MCP tools still work

3. **Monitor Workflow**:
   - Check copilot-setup-steps workflow runs regularly
   - Set up notifications for workflow failures
   - Review logs for warnings

4. **Share Knowledge**:
   - Document any custom configurations
   - Share successful patterns with team
   - Report issues and solutions

---

**Last Updated**: 2025-12-16  
**Next Review**: Quarterly or when major changes occur
