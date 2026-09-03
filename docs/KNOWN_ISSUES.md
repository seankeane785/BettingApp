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

The recommended AnalysisPack import does not repair or migrate input. It parses the current textarea contents once and validates that exact object; after pulling a workflow fix, restart Vite and hard-refresh as documented in `README.md`. The footer marker can be used to distinguish the current import-integrity build from a stale browser client.

## Specialist source availability

Dedicated current-season threshold statistics for corners, cards, team shots, and team shots on target may still be unavailable from credible manually researched sources. The generated request now makes this search a priority, but FormFirst intentionally leaves the market unavailable if exact candidate evidence, required opponent support, or a same-key/same-threshold benchmark cannot be sourced. Availability dropdowns cannot repair these evidence gaps.

## Manual specialist research remains source-dependent

The enhanced prompt makes a structured attempt across every supported family, but credible current-season match statistics and exact competition benchmarks may not exist or may not be accessible for every fixture. Such families deliberately remain unavailable with a specific model diagnostic; the application does not collect data automatically, substitute proxies, or increase candidate counts artificially.

## Research source availability (2026-09-03)

- Source pages can change layout or omit exact current-season thresholds. The workflow deliberately leaves affected families unavailable rather than deriving rates from averages.
- Cards, shots, and shots-on-target coverage depends on visible numeric values in completed-match pages and may require manual counting across many matches.
- The application does not fetch, scrape, or verify sources; users remain responsible for running the generated prompt in ChatGPT Search and importing its strict JSON response.

## Research-source limitations

Public statistics pages may omit threshold counts, opponent-allowed splits, venue records, benchmarks, or numeric completed-match statistics, and providers may disagree. After the full specified route is attempted, affected families remain unavailable; the application does not scrape, automate, repair, reconcile, or fabricate missing evidence. A conflict in an exact duplicate component suppresses only candidates dependent on that component.

- Exact current-season threshold observations may remain unavailable after every routed source is checked, particularly for specialist statistics and the optional 2.5 goal thresholds. The prompt must report the first missing component and omit the affected candidate; it must not infer a rate or substitute another goal family.

- Exact current-season threshold evidence may not be exposed by an eligible source, especially for cards, shots, and shots on target. In that case the contract reports the first missing requirement and the family remains unavailable; it never falls back to averages, proxy statistics, player totals, or a nearby threshold.

## Canonical selection-label input

ResearchPack v1.4 labels are intentionally strict input contract data. Manually authored or generated packs using a synonym, extra team prefix/suffix on a static label, a different threshold, or a team name inconsistent with `teamSide` are rejected; import does not normalize or repair them. Users must regenerate or correct the source JSON to the exact label displayed in the generated matrix.

## ResearchPack v1.5 limitations

- Research remains manual; an audit demonstrates the requested route was attempted, not that a provider will always expose a usable value.
- Venue evidence can be sparse early in a season and is omitted when below the two-match minimum.
- The 0–10 Poisson grid is deliberately finite and its result outcomes are normalised after aggregation.
- Generated prompts now spell out the strict v1.5 nested contracts, but ChatGPT Search can still return malformed JSON; FormFirst remains the authoritative import validator and never repairs invented fields.
- Generated prompts now state the five-field AnalysisPack envelope and nine-field ResearchPack contract explicitly; malformed or unnested manual responses remain subject to the existing strict import validation.
