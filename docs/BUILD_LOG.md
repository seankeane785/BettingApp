# Build log

This file is append-only. Add a dated entry after each material change; do not rewrite earlier entries.

## 2026-09-01 — Stage 1 application baseline

- Established a React, TypeScript and Vite application shell.
- Added project governance, scope, architecture, decision, testing and known-issue documentation.
- Added a non-functional placeholder for Stage 2 versioned schemas.
- Verification attempted with Node.js v20.20.2 and npm 11.4.2. `npm install` was blocked by the environment's package-registry policy (HTTP 403). `npm run lint` and `npm run build` were then invoked as required; both failed because the unavailable dependencies could not be resolved. The source and configuration remain ready for verification when registry access is available.
