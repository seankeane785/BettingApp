# Testing

## Stage 2 validation coverage

Vitest tests cover valid synthetic fixture, research and saved-run samples; duplicate fixtures; unsupported competitions; fixture/research mismatches; missing or invalid sources; prohibited content; synthetic-data warnings; and deterministic stale-source checks using an explicit reference timestamp.

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
