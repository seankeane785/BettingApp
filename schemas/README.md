# Versioned schemas

FormFirst uses strict JSON Schema Draft 2020-12 contracts:

- `fixture-pack.v1.schema.json` describes manually supplied scheduled fixtures.
- `research-pack.v1.schema.json` describes source-backed team evidence and explicitly labels synthetic data.
- `saved-analysis-run.v1.schema.json` describes a future local export, including deterministic settings and manually recorded outcomes.

Contract filenames and stable `$id` values carry the major version; `schemaVersion` carries the exact semantic version. Breaking changes require a new major-version file. Additive compatible changes require a minor version, while clarifications use a patch version. Version 1 documents `1.0.0` exactly. Unknown properties are rejected where practical. Samples in `samples/` are fictional test fixtures only and must never be used as real research or advice.

FixturePack v1 deliberately permits an empty `fixtures` array so a selected date with no qualifying scheduled fixtures can be represented truthfully. Its `competitions` array remains non-empty to record the explicit search scope.

Stage 5 clarifies ResearchPack v1 market evidence with canonical market groups, exact team-level selection identity, current/recent/venue hit samples, underlying support and explicit context impact. SavedAnalysisRun v1 now retains the exact input packs and all market-availability settings required to reproduce model output; persistence remains deferred.

ResearchPack v1's schema contract and version remain unchanged. At the manual import boundary, runtime validation interprets `generatedAt` as the actual UTC response-completion time and each `retrievedAt` as the actual UTC source-retrieval time. Sources must not postdate `generatedAt`, must be no more than 24 hours old at validation, and `generatedAt` must not be in the future; no prompt-generation timestamp is stored in the pack.

## Stage 7 SavedAnalysisRun v1

SavedAnalysisRun v1 is the sole persistence/export format. It contains complete immutable FixturePack and ResearchPack inputs, explicit deterministic settings, validation summary, exact candidates and both builder outcomes. Its separate `results` object contains only manually recorded builder/leg states and timestamps. Runtime validation additionally cross-validates embedded packs, exact selected-leg result coverage and safe run IDs. Synthetic samples remain contract fixtures and are rejected by the history import workflow.

## ResearchPack v1.1.0

`research-pack.v1.1.schema.json` adds `currentSeasonLeagueMatches`, separate period-labelled `historicalMarketHitRates`, and `historicalRepresentativeness`. Every historical statistic declares its league competition, period, sample, hits, venue relevance and sources. The runtime reader continues to accept valid v1.0.0 packs for deterministic saved-run replay.

## ResearchPack v1.2.0

`research-pack.v1.2.schema.json` requires `scope` and `application` on team news, fixture congestion and managerial context. Candidate penalties must be known, caution/material, non-empty and sourced; unknown, neutral and positive evidence is descriptive-only. Runtime validation also rejects reuse of an affected team's historical-representativeness citations as the sole direct-penalty evidence. Valid v1.0/v1.1 inputs remain readable, with unspecific legacy context treated as descriptive by model v1.2.

## ResearchPack v1.3.0

`research-pack.v1.3.schema.json` requires `competitionBenchmarks` built only from completed current-season league fixtures. It retains current-season team market/form/venue/optional metrics and v1.2 scoped context, and removes historical market records and representativeness from the new contract. v1.0, v1.1, and v1.2 schema files remain unchanged and readable for immutable saved-run replay.

## Model v1.4.0 market coverage
ResearchPack v1.4 distinguishes selectable `candidate_market` evidence from `supporting_only` evidence. Every approved team-level market family is processed only by its documented market-specific evidence gate; missing current-season support or a same-key/threshold competition benchmark is reported as unavailable. No specialist statistic is inferred from goals, and prior saved schema versions remain readable without recomputation. See `docs/SCORING_MODEL.md` and `schemas/research-pack.v1.4.schema.json`.

## AnalysisPack v1
`analysis-pack.v1.schema.json` is the one-import envelope. It contains exactly FixturePack v1.0.0 and ResearchPack v1.4.0. Runtime validation additionally enforces exact reference date/version, one-to-one fixture identity, source freshness (maximum 24 hours), citation validity, and kebab-case v1.4 source IDs matching `^[a-z0-9]+(?:-[a-z0-9]+)*$`. Older standalone ResearchPack schemas remain supported for saved-run and legacy import compatibility.

## Canonical source object

ResearchPack v1.4, whether imported separately or nested in AnalysisPack v1, declares every source as exactly `{ "sourceId": "non-empty kebab-case string", "url": "absolute HTTPS URL with a hostname", "title": "non-empty string", "retrievedAt": "ISO 8601 UTC timestamp ending in Z" }`. URLs may contain normal paths, query strings, fragments, and hyphens, and no source-domain allowlist is applied. HTTP, protocol-relative, relative, malformed, empty, and non-string URL values are rejected. `sourceId` matches `^[a-z0-9]+(?:-[a-z0-9]+)*$`; `id` and additional source properties are not accepted. Evidence citations contain declared `sourceId` values only.

## ResearchPack v1.4 research-coverage acquisition

The v1.4 schema continues to keep `candidate_market` and `supporting_only` records distinct. Generated prompts require an individual current-season league-only search for every supported team-level family and an exact same-key/same-threshold competition benchmark plus matrix-required support for each candidate. Missing evidence is omitted rather than defaulted. Prompts request URL slashes as JSON Unicode escapes (for example `https:\u002F\u002Fexample.com\u002Fmatch`); JSON decoding restores the ordinary HTTPS URL before the unchanged runtime validation runs.

## v1.4 acquisition policy (contract unchanged)

The generated prompts share a component-level hierarchy and independently attempt all 14 existing market groups. FootyStats is preferred for exact aggregate components, with exact-component-only fallbacks and no merging or double counting. Missing, proxy, player-derived, or conflicting evidence is omitted. No fields, enum values, schema versions, source-validation rules, or saved-pack compatibility changed.

## Canonical v1.4 prompt matrix

The schemas are unchanged. Both prompt builders now render one typed 14-family acquisition matrix. It distinguishes `team_to_score` threshold `0.5`, `team_goals` thresholds `1.5`/optional exact `2.5`, and dedicated `total_goals` thresholds `1.5`/optional exact `2.5`; records and benchmarks cannot substitute across those groups or BTTS. Existing candidate/support/venue/benchmark validation remains unchanged.

### ResearchPack v1.4 contract compatibility
No schema bump is required for the canonical market contract. The v1.4 evidence and benchmark objects already carry the exact market key/group/threshold, candidate versus `supporting_only` role, team side, venue sample, and source references needed by runtime preflight. Runtime validation supplies the cross-record relationship rules that JSON Schema cannot express cleanly; v1.0–v1.4 saved-run reading remains unchanged.

## ResearchPack v1.5

`research-pack.v1.5.schema.json` adds required `marketResearchAudit` and optional per-fixture `derived1x2FromGoals`. `analysis-pack.v1.schema.json` accepts nested v1.4 or v1.5 packs. Older ResearchPack schemas remain available for standalone imports and saved replay.
