# Testing

## Stage 2 validation coverage

Vitest tests cover valid synthetic fixture, research and saved-run samples; duplicate fixtures; unsupported competitions; fixture/research mismatches; missing or invalid sources; prohibited content; synthetic-data warnings; and freshness checks using an injected import-validation time. Focused cases cover sources retrieved after prompt creation, the 24-hour boundary, source times after pack completion, future pack completion times and strict ISO UTC timestamps.

Stage 3 tests additionally cover byte-identical prompt output, explicit criteria, FixturePack contract instructions, prohibited categories, empty competition rejection, valid and invalid pasted JSON, Markdown-fence rejection and valid empty fixture days.

Run:

```sh
npm run lint
npm test
npm run test:watch
npm run build
```

## Latest verification

- `npm install` — blocked on 2026-09-01 by `403 Forbidden` for `https://registry.npmjs.org/@eslint%2fjs` under the environment registry policy.
- `npm run lint` — blocked because `@eslint/js` is unavailable after the failed install.
- `npm test` — blocked because the `vitest` executable is unavailable after the failed install.
- `npm run build` — blocked because React, Vitest and Node packages/types are unavailable after the failed install.

### Stage 3 verification — 2026-09-01

- `python3 -m json.tool` for every JSON file under `schemas/` and `samples/` — passed for all six files.
- `git diff --check` — passed.
- `npm install` — blocked by `403 Forbidden` for `https://registry.npmjs.org/@eslint%2fjs`.
- `npm run lint` — blocked because `@eslint/js` could not be resolved after installation failed.
- `npm test` — blocked because the `vitest` executable was unavailable after installation failed.
- `npm run build` — blocked because React, Vitest and Node dependencies/types were unavailable after installation failed.

## Stage 4 verification (2026-09-01)

Focused tests cover research gating, deterministic exact-fixture prompts, required and prohibited instructions, strict JSON import, cross-pack validation and future timestamps. `npm test -- --run` was blocked because `vitest` was absent. The required single `npm install` attempt failed with HTTP 403 for `https://registry.npmjs.org/vitest`; unit tests and production build therefore could not be completed; lint passed in this environment. JSON contracts are checked with `python3 -m json.tool` and patch hygiene with `git diff --check`.

## Stage 5 coverage

`src/domain/analysisModel.test.ts` covers byte-identical determinism, version propagation, whole-number scores and confidence boundaries, quality gates, availability, duplicate/near-duplicate controls, same-match penalties, correlation-caused failure, both builder rule sets and structured no-builder output. Validation tests continue to cover all Stage 2–4 contracts/workflows.

## Stage 5 verification (2026-09-01)

- `git diff --check` — passed.
- `python3 -m json.tool` for every JSON schema and sample — passed for all six files.
- `npm run lint` — passed.
- `npm test` — passed: 4 test files and 27 tests.
- `npm run build` — passed with Vite 8.2.2 (20 modules transformed).
- Dependencies were present; the conditional install step was not needed. npm printed a non-failing warning about the environment's unknown `http-proxy` config; the earlier HTTP 403 did not recur because no install was necessary.

## Stage 6 coverage

`src/domain/analysisPresentation.test.ts` covers stable fixture grouping, deterministic manual-entry formatting and allowed fields, exact no-builder display data, excluded Moderate/Avoid candidates, explicit stale-result invalidation and unavailable-market omission. Existing model and workflow suites remain unchanged.

## Stage 6 verification (2026-09-01)

- `python3 -m json.tool` for every JSON schema and sample — passed for all six files.
- `git diff --check` — passed.
- `npm run lint` — passed.
- `npm test -- --run` — passed: 5 test files and 33 tests.
- `npm run build` — passed with Vite production output.
- Dependencies were already installed; no install was run. npm emitted only the existing non-failing `http-proxy` environment warning.

## Stage 7 coverage

Focused Vitest coverage now exercises complete snapshot creation, validation at persistence boundaries, in-memory save/list/load, malformed storage retention, duplicate rejection, deterministic complete export, strict import rejection, immutable manual outcome updates and JSON export/import round trips. Manual browser review should additionally confirm keyboard-accessible save/history/import/export/result controls and that opening history leaves unsaved current inputs intact.

Stage 7 automated verification passed on 2026-09-01: `npm run lint`, `npm test -- --run` (6 files, 42 tests), and `npm run build`. All schemas and samples passed `python3 -m json.tool`; `git diff --check` passed.


## Supported competitions and self-contained prompts (2026-09-01)

Focused coverage verifies Premier League and Championship acceptance; League One and League Two rejection in FixturePack, standalone ResearchPack, saved-run import validation and untouched browser restoration; and complete deterministic fixture/research prompt contracts, criteria, fixture identities, evidence tasks, sourcing/freshness rules and prohibited-content instructions.

`npm test -- --run` passed (6 files, 52 tests) and `npm run build` passed (Vite production bundle, 25 modules transformed).

## Research freshness correction (2026-09-02)

Focused prompt tests assert that no fixed retrieval upper bound is embedded and that actual UTC completion/retrieval instructions remain present. Validation tests inject the import time and cover valid post-prompt retrieval, stale sources, sources after `generatedAt`, future `generatedAt`, UTC formatting and the existing valid sample path.

Verification passed: `npm run lint`; `npm test -- --run` (6 files, 55 tests); `npm run build` (25 modules transformed); `git diff --check`; and `python3 -m json.tool schemas/research-pack.v1.schema.json`.

## ResearchPack import validation regressions (2026-09-02)

Focused cases cover the reported NBC Sports source object, UTC timestamps with and without milliseconds, hyphenated IDs, invalid/stale/future timestamps, truthful empty evidence containers for partial and insufficient fixtures, strict populated market records, malformed declared-source error de-duplication, genuinely undeclared citations and the existing valid sample/import paths.

Verification passed: `npm run lint`; `npm test` (6 files, 67 tests); `npm run build` (25 modules transformed); `python3 -m json.tool schemas/research-pack.v1.schema.json`; and `git diff --check`.

## Early-season regression coverage

Model tests cover two-match rejection without history, conservative blending with complete period-labelled league history, reduced weight after promotion/material change, source-backed context penalties, unknown-context neutrality, verification independence, and unchanged builder/non-early-season rules. Schema validation covers the v1.1 contract while v1.0.0 remains readable.

## Scoped-context scoring correction (2026-09-02)

Focused tests cover home/away material isolation, descriptive squad and manager context, exact 10/30 point policies, reduced historical weighting without double counting, audited 89% and 57% early-season blends, 70% reliability and 76% venue support, partial-evidence Good capping, unchanged builder gates, legacy snapshot compatibility, v1.2 determinism, and path-specific scope/application/penalty validation.

## Model v1.3 focused coverage

Unit coverage checks the exact four-fixture smoothing example, opponent moderation, candidate-scoped context isolation, missing-core insufficiency, early-season confidence/builder restrictions, deterministic output, current-only prompt contract, and legacy suite compatibility. Lint, Vitest, production build, and whitespace checks are delivery gates.

## Model v1.4.0 market coverage
ResearchPack v1.4 distinguishes selectable `candidate_market` evidence from `supporting_only` evidence. Every approved team-level market family is processed only by its documented market-specific evidence gate; missing current-season support or a same-key/threshold competition benchmark is reported as unavailable. No specialist statistic is inferred from goals, and prior saved schema versions remain readable without recomputation. See `docs/SCORING_MODEL.md` and `schemas/research-pack.v1.4.schema.json`.

## AnalysisPack checks
Focused tests cover combined prompt content, successful pipeline hand-off, nested reference/cardinality/duplicate failures, kebab-case source IDs, and non-empty evidence trace labels. Validate all JSON files in `schemas/` in addition to running lint, tests, build, and `git diff --check`.

## Source-contract regression coverage

Validation tests cover canonical standalone and nested sources, multiple kebab-case IDs, `id` migration feedback, underscore rejection at the exact path, and citation lookup against `sourceId`. Workflow tests assert that generated requests state the exact contract and prioritise dedicated corners, cards, shots, and shots-on-target evidence. Existing model tests cover missing specialist gates, forbidden proxy inference, availability isolation, and deterministic saved-run validation/replay.

## Source URL validation regression coverage

Focused validation covers the five reported Sports Mole and FotMob direct HTTPS pages, an HTTPS URL with query and fragment, and a complete AnalysisPack containing all five sources. Negative cases cover HTTP, protocol-relative, relative, malformed, whitespace-only, and non-string values, including exact standalone and nested error paths. All JSON schemas are parsed and compiled locally in addition to the standard lint, unit, build, and whitespace gates.

## Live-browser AnalysisPack URL regression coverage

The public `parseAndValidateAnalysisPack` workflow used by `App.tsx` now verifies that all five reported URLs remain strings with their exact input values after JSON parsing, validates them through the shared `globalThis.URL` helper, and hands the complete pack to the deterministic analysis pipeline. A malformed first source asserts the exact `$.researchPack.sources[0].url` error path. A focused runtime contract test also verifies the browser-standard `globalThis.URL` constructor exposes the required `https:` protocol and hostname behaviour. Production verification includes searching source and generated assets for stale or duplicate URL validators.
