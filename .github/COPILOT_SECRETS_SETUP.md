# GitHub Copilot Secrets Setup Guide

This guide explains how to configure repository secrets for GitHub Copilot Coding Agent to access MCP (Model Context Protocol) servers and other services.

## Overview

The GitHub Copilot Coding Agent requires access to repository secrets to:
- Access Context7 for up-to-date library documentation
- Connect to Firebase/Firestore MCP server for database operations
- Use CI/CD services like Surge.sh for preview deployments

These secrets are configured in the `.github/workflows/copilot-setup-steps.yml` workflow file.

## Required Secrets

Navigate to your repository settings to add these secrets:
**Repository → Settings → Secrets and variables → Actions → New repository secret**

Or directly: `https://github.com/7Spade/GigHub/settings/secrets/actions`

### 1. Context7 MCP Server

**Secret Name:** `COPILOT_MCP_CONTEXT7`  
**Description:** API key for Context7 MCP server  
**Purpose:** Provides Copilot with access to up-to-date documentation for Angular, ng-alain, ng-zorro-antd, Firebase/Firestore, and other libraries  
**Usage:** Referenced in `.github/copilot/mcp-servers.yml`

**How to obtain:**
1. Sign up at [Context7](https://context7.com)
2. Generate an API key from your dashboard
3. Add it as a repository secret

### 2. Firebase/Firestore Project Reference

**Secret Name:** `SUPABASE_PROJECT_REF`  
**Description:** Firebase/Firestore project reference ID  
**Purpose:** Identifies your Firebase/Firestore project for MCP server connection  
**Usage:** Referenced in `.github/copilot/mcp-servers.yml`  
**Example Format:** `zecsbstjqjqoytwgjyct`

**How to obtain:**
1. Go to your [Firebase/Firestore Dashboard](https://firebase.com/dashboard)
2. Select your project
3. Navigate to Settings → General
4. Copy the "Reference ID" value

### 3. Firebase/Firestore MCP Token

**Secret Name:** `SUPABASE_MCP_TOKEN`  
**Description:** Firebase/Firestore MCP authentication token  
**Purpose:** Authenticates Copilot Coding Agent with Firebase/Firestore MCP server  
**Usage:** Referenced in `.github/copilot/mcp-servers.yml`

**How to obtain:**
1. Go to your [Firebase/Firestore Dashboard](https://firebase.com/dashboard)
2. Select your project
3. Navigate to Settings → API
4. Copy the "service_role" key (for MCP server access)
   - **Note:** This is a sensitive key with full database access. Use with caution.
   - For production, consider creating a custom role with limited permissions

### 4. CI Token (Optional)

**Secret Name:** `CI_TOKEN`  
**Description:** GitHub Personal Access Token for CI operations  
**Purpose:** Used by CI workflows for commenting on PRs and other GitHub operations  
**Usage:** Referenced in `.github/workflows/ci.yml`

**How to obtain:**
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with scopes: `repo`, `workflow`
3. Add it as a repository secret

### 5. Surge Deployment Credentials (Optional)

**Secret Name:** `SURGE_LOGIN` and `SURGE_TOKEN`  
**Description:** Surge.sh credentials for preview deployments  
**Purpose:** Deploy PR previews to Surge.sh  
**Usage:** Referenced in `.github/workflows/ci.yml`

**How to obtain:**
1. Install Surge CLI: `npm install -g surge`
2. Run `surge token` to get your token
3. Your login is your email address
4. Add both as repository secrets

## Configuration Files

### MCP Servers Configuration

File: `.github/copilot/mcp-servers.yml`

```yaml
mcp-servers:
  context7:
    type: http
    url: 'https://mcp.context7.com/mcp'
    headers: { 'CONTEXT7_API_KEY': '${{ secrets.COPILOT_MCP_CONTEXT7 }}' }
    tools: ['get-library-docs', 'resolve-library-id']

  firebase:
    type: http
    url: 'https://mcp.firebase.com/mcp?project_ref=${{ secrets.SUPABASE_PROJECT_REF }}'
    headers:
      Authorization: 'Bearer ${{ secrets.SUPABASE_MCP_TOKEN }}'
    tools: ['*']
```

### Copilot Setup Steps Workflow

File: `.github/workflows/copilot-setup-steps.yml`

This workflow:
1. Sets up Node.js environment (version from `.nvmrc`)
2. Installs project dependencies with Yarn
3. Makes secrets available to Copilot Coding Agent
4. Verifies the installation

**Important:** The job name MUST be `copilot-setup-steps` for GitHub Copilot to recognize and use it.

## Security Best Practices

### ✅ DO:
- Use repository secrets for all sensitive data
- Limit secret access to necessary workflows only
- Use minimal permissions in workflow definitions
- Rotate secrets regularly
- Use service accounts with limited permissions where possible

### ❌ DON'T:
- Commit secrets to the repository
- Share secrets in issue comments or PR descriptions
- Use production credentials for development/testing
- Grant unnecessary permissions to tokens
- Log secret values in workflow outputs

## Testing the Configuration

### 1. Verify Workflow Syntax

```bash
# Install yamllint (if not already installed)
pip install yamllint

# Validate the workflow file
yamllint .github/workflows/copilot-setup-steps.yml
```

### 2. Test the Workflow

1. Push a change to `.github/workflows/copilot-setup-steps.yml`
2. Go to Actions tab in your repository
3. Check that "Copilot Setup Steps" workflow runs successfully
4. Verify all steps complete without errors

### 3. Test with Copilot Coding Agent

1. Create a new issue or pull request
2. Use GitHub Copilot Coding Agent to work on the code
3. Verify that Copilot can:
   - Access Context7 documentation (ask about Angular or ng-alain APIs)
   - Connect to Firebase/Firestore (if configured)
   - Use the installed dependencies

## Troubleshooting

### Copilot Cannot Access Secrets

**Problem:** Copilot Coding Agent reports missing secrets or authentication errors.

**Solutions:**
1. Verify secrets are added to Repository Settings → Secrets and variables → Actions
2. Check secret names match exactly (case-sensitive)
3. Ensure `.github/workflows/copilot-setup-steps.yml` references the correct secret names
4. Verify the workflow has run successfully at least once

### MCP Server Connection Failures

**Problem:** Copilot cannot connect to Context7 or Firebase/Firestore MCP servers.

**Solutions:**
1. Verify API keys are valid and not expired
2. Check MCP server URLs in `.github/copilot/mcp-servers.yml`
3. Ensure secrets are correctly formatted (no extra spaces or newlines)
4. Test API keys manually using curl or similar tools

### Workflow Fails to Run

**Problem:** "Copilot Setup Steps" workflow doesn't execute.

**Solutions:**
1. Verify job name is exactly `copilot-setup-steps`
2. Check workflow file is in `.github/workflows/` directory
3. Ensure workflow is enabled in repository settings
4. Check for YAML syntax errors

## Environment-Specific Configuration

### Development Environment

For local development, create a `.env` file (git-ignored) with:

```bash
# Context7 API Key
COPILOT_MCP_CONTEXT7=your_context7_api_key

# Firebase/Firestore Configuration
SUPABASE_PROJECT_REF=your_project_ref
SUPABASE_MCP_TOKEN=your_mcp_token
```

### Production Environment

For production deployments, use GitHub Environments:
1. Go to Repository → Settings → Environments
2. Create a "production" environment
3. Add environment-specific secrets
4. Configure deployment protection rules

## References

- [GitHub Docs: Customizing Copilot Coding Agent Environment](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/customize-the-agent-environment)
- [GitHub Docs: Using Secrets in GitHub Actions](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
- [GitHub Docs: Creating Configuration Variables](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-variables#creating-configuration-variables-for-a-repository)
- [Context7 Documentation](https://context7.com/docs)
- [Firebase/Firestore MCP Documentation](https://firebase.com/docs/guides/mcp)

## Support

If you encounter issues:
1. Check the [GitHub Community Discussions](https://github.com/orgs/community/discussions)
2. Review [Stack Overflow: GitHub Copilot](https://stackoverflow.com/questions/tagged/github-copilot)
3. Consult the project's [SUPPORT.md](../SUPPORT.md) file
4. Open an issue in the repository

---

**Last Updated:** 2025-12-12  
**Maintained By:** GigHub Development Team
