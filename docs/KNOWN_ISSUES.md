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

The former fixed prompt-time freshness cutoff has been removed. Freshness is now checked once at ResearchPack import using the captured validation time; previously accepted and saved runs are intentionally not aged against the live clock, preserving reproducible historical analysis.

ResearchPack partial and insufficient evidence may truthfully contain an empty `marketHitRates` array and empty `optionalMetrics` object. This is intentional, not a missing-data validator defect; populated market records still require complete source-backed structure. A complete-quality fixture still requires market hit-rate evidence.

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

- Historical representativeness is a manual, source-backed assessment; when it cannot be assessed the deterministic model deliberately returns insufficient evidence and may produce no builder.

## Model v1.2 limitations

- Existing ResearchPack v1.0/v1.1 context has no candidate scope, so model v1.2 deliberately treats it as descriptive and applies no direct context penalty. A fresh v1.2 import is required for a current candidate-specific penalty.
- Scope and application validation can enforce structure, sourcing, freshness and separation from representativeness citations; the manual research workflow remains responsible for ensuring prose is genuinely team-level and candidate-relevant.
- Partial evidence can qualify only for Balanced and only when all unchanged probability, combination and correlation rules pass. It never qualifies for High-probability, and no qualifying builder remains a valid output.

## Model v1.3 calibration

The deterministic weighting and smoothing policy has not undergone a documented out-of-sample calibration study. Estimates must not be described as empirically calibrated until that validation exists. Canonical market identity currently depends on manually prepared, consistently named candidate/opponent/benchmark records; a mismatch correctly produces insufficient evidence rather than a fallback estimate.

## Model v1.4 calibration
- Percentages use documented conservative benchmark smoothing and fixed deterministic weights. They are not claimed to be empirically calibrated because no out-of-sample calibration study is available.
- Coverage depends on manually researched, source-backed current-season statistics; a market remains unavailable when any mandatory component is absent.

## AnalysisPack v1 limitations
The combined prompt still depends on manual ChatGPT Search execution and credible current-season sources. Some specialist statistics may be unavailable; FormFirst deliberately reports that evidence gap and does not synthesize a candidate. The legacy workflow remains more verbose but compatible.

## Specialist source availability

Dedicated current-season threshold statistics for corners, cards, team shots, and team shots on target may still be unavailable from credible manually researched sources. The generated request now makes this search a priority, but FormFirst intentionally leaves the market unavailable if exact candidate evidence, required opponent support, or a same-key/same-threshold benchmark cannot be sourced. Availability dropdowns cannot repair these evidence gaps.
