# Known issues

## Stage 2 limitations

- JSON Schema documents are contracts for interoperable tooling, while the dependency-light runtime validators implement the focused import checks needed in Stage 2 rather than a general-purpose JSON Schema engine.
- Optional evidence may remain `null`, and unknown contextual evidence is represented explicitly; later scoring and UI stages are intentionally not implemented.
- Samples are synthetic contract fixtures only and cannot be used for real analysis.

## Stage 3 limitations

- Fixture discovery happens only when the user manually uses the generated prompt in ChatGPT Search; FormFirst neither searches nor verifies sources itself.
- Fixture workflow state is intentionally in memory only and is lost on refresh. Persistence is deferred to Stage 7.
- Clipboard access depends on browser support and secure-context permissions; the prompt remains selectable for manual copying if access fails.

## Environment limitation

- On 2026-09-01, Stage 1 dependency installation was blocked by the environment's package-registry policy (`npm install` received HTTP 403 from the npm registry). The Stage 2 `npm install` attempt was likewise blocked with `403 Forbidden` for `https://registry.npmjs.org/@eslint%2fjs`; dependencies remain unavailable, so lint, tests and build cannot execute until registry access is restored.
- The Stage 3 `npm install` attempt on 2026-09-01 was also blocked with `403 Forbidden` for `https://registry.npmjs.org/@eslint%2fjs`. Lint, tests, production build and the runnable UI screenshot remain blocked until dependencies can be installed.

## Stage 4 environment limitation

The local dependency tree does not contain the `vitest` executable. On 2026-09-01, `npm install` remained blocked by `403 Forbidden - GET https://registry.npmjs.org/vitest`, so Stage 4 tests and build require verification; lint passed once registry access is restored.

## Stage 5 limitations

- Fixed scoring and correlation factors are transparent conservative rules, not learned causal estimates. Missing venue or underlying evidence lowers quality and uses a documented midpoint.
- Market availability defaults to unknown and always requires manual verification; the app does not inspect any external market catalogue or settlement rules.
- Candidate/builder presentation is intentionally deferred to Stage 6 and SavedAnalysisRun persistence to Stage 7.

## Stage 5 verification note

Dependencies were present for Stage 5 and lint, tests and build passed. npm still emits a non-failing warning that the environment's `http-proxy` configuration will be unsupported in its next major version.

## Stage 6 limitations

- Analysis results and copy feedback are intentionally in memory only and are lost on refresh; saved-run history and persistence remain deferred to Stage 7.
- Clipboard copying depends on browser secure-context support and permissions. A copy failure is non-blocking because the formatted list remains visible and selectable.
- Market availability is manually configured and never externally confirmed. Even an `available` setting does not determine settlement rules, so every displayed selection still requires manual verification.

## Stage 7 limitations

- Saved history exists only in the current browser and can be lost if site data is cleared. There is no remote backup, sync, account or automatic pruning.
- Browser privacy settings, unavailable localStorage and storage quota limits can prevent saves or updates; the UI reports these conditions without deleting existing valid history.
- Results are manual records only. Builder outcomes are not derived from leg outcomes because external settlement rules may differ.


## Supported-competition compatibility

- FormFirst now supports exactly Premier League and Championship. Previously stored or exported League One/League Two runs are incompatible and cannot be opened, analysed, re-exported or imported. The application reports the validation error and deliberately leaves browser storage untouched; users must retain or remove that data themselves.
- Generated prompts remain a manual ChatGPT Search hand-off. FormFirst does not verify whether ChatGPT followed the embedded contract until the returned JSON is pasted and validated.
