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
