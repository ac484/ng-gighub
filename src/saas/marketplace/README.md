# Marketplace — README

This folder contains marketplace related features (plugins, registry, sandbox, permissions).

Usage
- Use `marketplace.facade.ts` for small read-only integration points from the UI.
- Plugin installation and execution should be implemented server-side (Cloud Functions) or within sandboxed environments.

Notes
- Treat marketplace outputs as untrusted input and validate thoroughly before using.
