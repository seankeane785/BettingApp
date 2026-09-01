# Build log

This file is append-only. Add a dated entry after each material change; do not rewrite earlier entries.

## 2026-09-01 — Stage 1 application baseline

- Established a React, TypeScript and Vite application shell.
- Added project governance, scope, architecture, decision, testing and known-issue documentation.
- Added a non-functional placeholder for Stage 2 versioned schemas.
- Verification attempted with Node.js v20.20.2 and npm 11.4.2. `npm install` was blocked by the environment's package-registry policy (HTTP 403). `npm run lint` and `npm run build` were then invoked as required; both failed because the unavailable dependencies could not be resolved. The source and configuration remain ready for verification when registry access is available.

## 2026-09-01 — Stage 2 schemas and validation

- Added strict FixturePack, ResearchPack and SavedAnalysisRun v1 Draft 2020-12 schemas and consistently cross-referenced fictional samples.
- Added reusable TypeScript domain types, non-throwing deterministic validators and focused Vitest coverage.
- Added prohibited-content, source freshness, evidence plausibility and fixture relationship checks without adding any network or persistence behavior.
- `npm install` was attempted once and blocked by the environment registry policy with `403 Forbidden` for `https://registry.npmjs.org/@eslint%2fjs`. Subsequent lint, test and build outcomes are recorded in `docs/TESTING.md`.

## 2026-09-01 — Stage 3 fixture workflow

- Added explicit fixture date and competition selection, deterministic manual ChatGPT Search prompt generation, clipboard feedback and in-memory FixturePack paste validation.
- Added accessible validation results and a fixture-only preview without research, scoring, recommendations, persistence, automated collection or prohibited data.
- Corrected FixturePack v1 to permit an empty fixture array for truthful no-fixture days, with matching validator, schema documentation and tests.
- Verified all six JSON schemas and samples with `python3 -m json.tool`; `git diff --check` passed.
- `npm install` was attempted once and blocked by `403 Forbidden` for `https://registry.npmjs.org/@eslint%2fjs`. Consequently, `npm run lint` failed because `@eslint/js` was unavailable, `npm test` failed because `vitest` was unavailable, and `npm run build` failed because React, Vitest and Node packages/types were unavailable. A runnable screenshot could not be captured for the same dependency limitation.
