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

## 2026-09-01 — Stage 4 research workflow

- Added deterministic ResearchPack prompt generation, fixture gates, strict paste validation, explicit source freshness, cross-pack checks, evidence-only summaries and research-only reset behavior.
- Added focused workflow tests and extended shared validation for future sources, exact fixture coverage/reference matching and incomplete mandatory team evidence.
- `npm test -- --run`: blocked (`vitest: not found`).
- `npm install`: blocked by `403 Forbidden - GET https://registry.npmjs.org/vitest`.
- Lint passed. Tests and production build remain unverified because the documented registry restriction prevented dependency restoration.

## 2026-09-01 — Stage 5 deterministic analysis model

- Added `FormFirst Model v1.0.0` with canonical team-level evidence scoring, explicit data-quality/confidence gates and structured non-throwing candidate output.
- Added default-unknown market availability, duplicate/near-duplicate exclusions, conservative correlation penalties and exhaustive deterministic High-probability/Balanced builder selection with no-builder outcomes.
- Clarified ResearchPack v1 canonical market evidence/context impact and extended SavedAnalysisRun v1 to retain exact model inputs/settings for future persistence. Added domain tests and model documentation; the UI exposes readiness only.
- Verification passed: `git diff --check`; `python3 -m json.tool` for all six schema/sample JSON files; `npm run lint`; `npm test` (4 files, 27 tests); and `npm run build` (Vite production bundle). Dependencies were already present, so no install was required. npm emitted only its environment warning that `http-proxy` is an unknown config.

## 2026-09-01 — Stage 6 analysis results interface

- Added deliberate analysis generation, explicit availability controls, complete candidate transparency and prominent High-probability/Balanced builder outcomes over the existing deterministic Stage 5 model.
- Added accessible responsible-gambling and manual-verification presentation plus pure, stable, copyable manual-entry list formatting with non-blocking clipboard feedback.
- Added tests for grouping, deterministic formatting, no-builder data, excluded candidates, stale-result invalidation and unavailable markets; documented the in-memory-only Stage 6 boundary.
- Verification passed: `git diff --check`; `python3 -m json.tool` for all six schema/sample JSON files; `npm run lint`; `npm test -- --run` (5 files, 33 tests); and `npm run build`. Dependencies were already installed, so no install was required. npm emitted only its existing non-failing `http-proxy` environment warning.

## 2026-09-01 — Stage 7 local saved-run history

- Added explicit, browser-only SavedAnalysisRun v1 persistence with strict save/load/import validation, complete JSON export, read-only historical review and separate manual builder/leg outcomes.
- Preserved exact model output snapshots and added safe handling for malformed, duplicate, unavailable and quota-limited storage without automatic deletion or repair.
- Added focused persistence/serialization/outcome tests and documented that browser site-data clearing can remove local history.
- Verification passed with dependencies already installed: `git diff --check`; `python3 -m json.tool` for all six schemas/samples; `npm run lint`; `npm test -- --run` (6 files, 42 tests); and `npm run build` (Vite production bundle). npm emitted only its existing non-failing `http-proxy` environment warning.

## 2026-09-01 — Supported competitions and self-contained prompts

- Restricted FormFirst to exactly Premier League and Championship across UI-derived constants, TypeScript contracts, runtime validation, JSON schemas, samples, prompts and persistence boundaries.
- Added explicit incompatibility errors for League One and League Two fixture, research, imported-run and browser-stored data; invalid browser data is retained and cannot be restored, analysed or exported.
- Made both manual ChatGPT Search prompts self-contained with complete versioned output structures, exact selected criteria/fixtures, evidence and source rules, unknown-data handling and prohibited-content boundaries.
- Added focused regression coverage and updated all project-control documentation. Verification passed: `npm test -- --run` (6 files, 52 tests) and `npm run build` (Vite production bundle, 25 modules transformed).

## 2026-09-02 — ResearchPack freshness correction

- Removed the impossible prompt-time upper bound on source retrieval and instructed ChatGPT to record actual UTC retrieval and response-completion times without changing ResearchPack v1.
- Changed import freshness validation to use an injectable validation time, enforce a 24-hour ceiling, reject sources after pack completion and reject future pack completion with no clock-skew tolerance.
- Preserved saved-run determinism by keeping live-clock freshness at the initial ResearchPack import boundary only, and added focused regression tests and documentation.
- Verification passed: `npm run lint`; `npm test -- --run` (6 files, 55 tests); `npm run build` (Vite production bundle, 25 modules transformed); `git diff --check`; and ResearchPack schema JSON parsing.

## 2026-09-02 — ResearchPack import validation regressions

- Corrected source validation to accept standard `Z` UTC timestamps with or without fractional seconds and unrestricted non-empty IDs such as `src-pl-results`, while retaining HTTPS, chronology, future-time and 24-hour freshness checks.
- Prevented malformed declared sources from producing cascading unknown-citation errors, while preserving errors for genuinely undeclared citations.
- Permitted truthful empty market-hit-rate and optional-metric containers for partial or insufficient fixture evidence; populated market records remain strictly validated and source-backed.
- Aligned the ResearchPack schema and generated prompt with these rules and added focused import regression coverage.
- Verification passed: `npm run lint`; `npm test` (6 files, 67 tests); `npm run build` (Vite production bundle, 25 modules transformed); `python3 -m json.tool schemas/research-pack.v1.schema.json`; and `git diff --check`.

## 2026-09-02 — Early-season evidence policy and model v1.1.0

- Added ResearchPack v1.1.0 period-labelled previous-season competitive league evidence while retaining v1.0.0 import support.
- Added conservative early-season blending, representativeness reductions, corrected source-backed context penalties, prompt guidance, validation and focused regression coverage.

## 2026-09-02 — Audited scoped-context scoring correction

- Added ResearchPack v1.2 with explicit context scope/application and strict candidate-penalty validation while retaining v1.0/v1.1 input and snapshot support.
- Released model v1.2.0: legacy/descriptive context has zero penalty, valid caution/material penalties affect only scoped candidates, and historical representativeness is not double counted.
- Reclassified usable partial evidence as uncertainty capped at Good, retaining every 72%, 62%, 55% and 35% builder threshold and valid no-builder outcomes.
- Added focused deterministic, regression, compatibility and path-specific validation coverage.
