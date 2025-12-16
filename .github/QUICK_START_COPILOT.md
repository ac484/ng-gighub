# Quick Start: GitHub Copilot Setup

> **TL;DR** - Fast track guide to get GitHub Copilot Coding Agent working with MCP tools

## Status: ✅ Configuration Files Ready

All configuration files have been created. You need to add secrets to complete setup.

## What You Need To Do (3 Steps)

### Step 1: Add Secrets (5 minutes)

Go to: **https://github.com/7Spade/GigHub/settings/secrets/actions**

Click "New repository secret" and add these three secrets:

| Secret Name | Where to Get It | Purpose |
|-------------|----------------|---------|
| `COPILOT_MCP_CONTEXT7` | [Context7.com](https://context7.com) → Sign up → API Keys | Access latest library docs (Angular, ng-alain, etc.) |
| `SUPABASE_PROJECT_REF` | [Firebase/Firestore Dashboard](https://firebase.com/dashboard) → Your Project → Settings → General → Reference ID | Connect to your Firebase/Firestore project |
| `SUPABASE_MCP_TOKEN` | [Firebase/Firestore Dashboard](https://firebase.com/dashboard) → Your Project → Settings → API → service_role key | Authenticate with Firebase/Firestore |

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

## What This Enables

✅ Copilot can access **Context7** for up-to-date documentation  
✅ Copilot can use **Firebase/Firestore MCP** for database operations  
✅ Copilot has pre-installed dependencies (Node.js 20.19.0, Yarn)  
✅ All MCP tools are available: sequential-thinking, software-planning-tool, filesystem, etc.

## Test It Works

After setup, use Copilot Coding Agent with these prompts:

```
"How do I use Angular Signals for state management?"
→ Should access Context7 for latest Angular docs

"Show me how to configure ng-alain ST table"
→ Should use Context7 for ng-alain documentation

"Create a Firebase/Firestore RLS policy for users table"
→ Should use Firebase/Firestore MCP tools
```

## Files Created

| File | Purpose |
|------|---------|
| `.github/workflows/copilot-setup-steps.yml` | Main workflow file (required by Copilot) |
| `.github/COPILOT_SECRETS_SETUP.md` | Detailed secrets configuration guide |
| `.github/COPILOT_SETUP_NEXT_STEPS.md` | Step-by-step setup instructions |
| `.github/COPILOT_ARCHITECTURE.md` | Architecture diagrams and data flow |
| `.github/workflows/README.md` | Workflows documentation |

## Need More Details?

- **Secrets Setup**: [COPILOT_SECRETS_SETUP.md](COPILOT_SECRETS_SETUP.md)
- **Architecture**: [COPILOT_ARCHITECTURE.md](COPILOT_ARCHITECTURE.md)
- **Next Steps**: [COPILOT_SETUP_NEXT_STEPS.md](COPILOT_SETUP_NEXT_STEPS.md)
- **Main Guide**: [COPILOT_SETUP.md](COPILOT_SETUP.md)

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Workflow not running | Check job name is exactly `copilot-setup-steps` |
| Secrets not found | Verify secret names match exactly (case-sensitive) |
| Context7 fails | Check `COPILOT_MCP_CONTEXT7` is valid API key |
| Firebase/Firestore fails | Check both `SUPABASE_PROJECT_REF` and `SUPABASE_MCP_TOKEN` |

## GitHub Documentation

- [Customizing Copilot Agent Environment](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/customize-the-agent-environment)
- [Using Secrets in GitHub Actions](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)

---

**Time to Complete:** ~10 minutes  
**Difficulty:** Easy  
**Status:** Ready for configuration

Need help? Check [COPILOT_SETUP_NEXT_STEPS.md](COPILOT_SETUP_NEXT_STEPS.md) for detailed instructions.
