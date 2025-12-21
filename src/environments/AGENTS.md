---

# Environments – AGENTS.md

This document defines **rules and boundaries** for environment configuration in GigHub.

It governs **what may exist in `src/environments/` and how it is used at build time**.

---

## 1. Purpose

The `environments/` directory contains **build-time configuration only**.

It defines:
- Deployment-specific settings
- API endpoints
- Feature flags
- Providers and interceptors selection

It must **not** contain runtime logic or secrets.

---

## 2. Directory Structure

src/environments/ ├── AGENTS.md ├── environment.ts        # Development └── environment.prod.ts   # Production

---

## 3. Environment Files

### environment.ts (Development)

**Rules**
- MUST set `production: false`
- MAY enable:
  - verbose logging
  - mock providers
  - mock interceptors
- MUST use non-production API endpoints
- MAY include development-only feature flags

---

### environment.prod.ts (Production)

**Rules**
- MUST set `production: true`
- MUST use production API endpoints
- MUST disable:
  - mock providers
  - mock interceptors
  - debug logging
- MUST include production-optimized settings

---

## 4. Environment Interface

**Rules**
- MUST conform to the `Environment` interface (`@delon/theme`)
- MUST include:
  - `production: boolean`
  - `api` configuration
  - `useHash` routing flag
  - `providers` array
  - `interceptorFns` array
- MUST remain structurally consistent across environments

---

## 5. Configuration Rules

### API

- `baseUrl` defines the API root
- Token refresh behavior MUST be explicit
- API shape MUST be identical in all environments

---

### Providers & Interceptors

**Rules**
- Mock providers/interceptors:
  - allowed in development
  - forbidden in production
- Interceptor order MUST be deterministic
- No environment may introduce hidden side effects

---

## 6. Security Constraints

**Forbidden**
- Secrets (API keys, private tokens)
- Credentials or passwords
- Environment-specific business logic

**Required**
- Sensitive values MUST be injected at build or runtime
- Configuration MUST be type-safe

---

## 7. Build Integration

**Rules**
- `angular.json` MUST define `fileReplacements`
- Production builds MUST replace `environment.ts`
- Environment files MUST be complete and self-contained

---

## 8. Related Documentation

- **Application Root**: `src/app/AGENTS.md`
- **Core Services**: `src/app/core/AGENTS.md`

---

**Version**: 1.1.0  
**Last Updated**: 2025-12-21  
**Scope**: `src/environments/`  
**Audience**: GitHub Copilot Agent / AI Coding Agents


---

