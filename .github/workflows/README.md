# GitHub Workflows

This directory contains GitHub Actions workflows for the GigHub project.

## Workflows

### CI Workflow (`ci.yml`)
Continuous Integration workflow that runs on pull requests and pushes to main/master branches.

**Jobs:**
- `build` - Build the project with release version of @delon
- `build-day` - Build the project with day release version of @delon
- `lint` - Run code linting
- `test` - Run unit tests with code coverage

**Secrets Required:**
- `CI_TOKEN` - GitHub token for commenting on PRs
- `SURGE_LOGIN` - Surge.sh login for preview deployments
- `SURGE_TOKEN` - Surge.sh token for preview deployments

### Deploy Site Workflow (`deploy-site.yml`)
Deploys the production site to hosting services.

**Secrets Required:**
- `SURGE_LOGIN` - Surge.sh login
- `SURGE_TOKEN` - Surge.sh token
- `PERSONAL_TOKEN` - GitHub personal access token for deployment

### Copilot Setup Steps Workflow (`copilot-setup-steps.yml`)
**Special workflow for GitHub Copilot Coding Agent environment configuration.**

This workflow customizes the development environment for GitHub Copilot Coding Agent, providing:
- Node.js environment setup (version from `.nvmrc`)
- Project dependencies installation
- Access to repository secrets for MCP servers
- Environment variables for development tools

**Job Name:** `copilot-setup-steps` (MUST be this exact name for Copilot to recognize it)

**Secrets Required:**
- `COPILOT_MCP_CONTEXT7` - Context7 API key for documentation access
- `SUPABASE_PROJECT_REF` - Firebase/Firestore project reference ID
- `SUPABASE_MCP_TOKEN` - Firebase/Firestore MCP authentication token
- `CI_TOKEN` - GitHub token for CI operations
- `SURGE_LOGIN` - Surge.sh login
- `SURGE_TOKEN` - Surge.sh token

**Triggers:**
- Manual trigger via workflow_dispatch
- Push to workflow file or copilot configuration files
- Pull request changes to workflow file or copilot configuration files

**Documentation:**
- [Setup Guide](../COPILOT_SECRETS_SETUP.md) - Detailed guide for configuring secrets
- [GitHub Docs](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/customize-the-agent-environment)

## Adding Secrets

To add or update secrets:

1. Go to Repository Settings: `https://github.com/7Spade/GigHub/settings/secrets/actions`
2. Click "New repository secret"
3. Add the secret name and value
4. Save

**Important:** Secret names are case-sensitive and must match exactly as referenced in the workflow files.

## Testing Workflows

### Locally with act
```bash
# Install act (https://github.com/nektos/act)
brew install act  # macOS
# or
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run workflows locally
act -l  # List available workflows
act -j build  # Run specific job
```

### On GitHub
1. Push changes to a branch
2. Create a pull request
3. Check the "Actions" tab to see workflow runs
4. Review logs for any errors

## Workflow Best Practices

1. **Security:**
   - Never commit secrets to the repository
   - Use GitHub Secrets for sensitive data
   - Set minimal permissions for each workflow
   - Review secret access regularly

2. **Efficiency:**
   - Cache dependencies when possible
   - Run jobs in parallel when independent
   - Use matrix builds for multiple configurations
   - Skip unnecessary jobs with path filters

3. **Maintainability:**
   - Document workflow purpose and requirements
   - Use descriptive job and step names
   - Add comments for complex logic
   - Keep workflows DRY (Don't Repeat Yourself)

## Troubleshooting

### Workflow Not Running
- Check workflow triggers (on: push, pull_request, etc.)
- Verify branch names match workflow configuration
- Ensure workflow file has correct YAML syntax
- Check if workflow is disabled in repository settings

### Secret Not Available
- Verify secret is added in repository settings
- Check secret name matches exactly (case-sensitive)
- Ensure workflow has necessary permissions
- For Copilot workflows, verify job name is `copilot-setup-steps`

### Build Failures
- Check Node.js version matches `.nvmrc`
- Verify dependencies are up to date
- Review error logs in Actions tab
- Test build locally before pushing

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Using Secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
- [GitHub Copilot Coding Agent](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent)
