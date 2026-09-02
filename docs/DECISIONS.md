# Decisions

## D-001 — Local-only React application

**Status:** Accepted — 2026-09-01

Use React with strict TypeScript and Vite. Keep v1 entirely in the browser with no backend or remote database.

## D-002 — Manual, deterministic workflow

**Status:** Accepted — 2026-09-01

All fixture and evidence material is supplied through manual copy/paste. Analysis must be deterministic, team-level only, and able to produce “No qualifying builder today”. Automated collection and bookmaker/account connections are out of scope.

## D-003 — Prohibited data and advice

**Status:** Accepted — 2026-09-01

Do not use, store, display or infer odds, prices, payouts, implied probability, expected value, value betting, bookmaker links or tipster opinions. Do not provide stake advice or player-specific analysis.

## D-004 — Explicit versioned data contracts

**Status:** Accepted — 2026-09-01

Use strict JSON Schema Draft 2020-12 documents with stable identifiers, major versions in filenames and exact semantic versions in each payload. Reject unknown properties where practical and require explicit synthetic/real status for research and saved runs.

## D-005 — Deterministic local validation

**Status:** Accepted — 2026-09-01

Validation returns structured errors and warnings rather than throwing. It performs relationship, evidence, source, plausibility and prohibited-content checks locally. Research freshness uses an injected import-validation time and a maximum 24-hour source age; sources cannot postdate `ResearchPack.generatedAt`, and `generatedAt` cannot postdate validation time. There is no clock-skew tolerance. Tests inject a fixed time, while the browser supplies the current time at import. Saved historical analysis remains a stored snapshot and is not re-evaluated against the live clock.

## D-006 — Empty FixturePack days are valid

**Status:** Accepted — 2026-09-01

Permit `fixtures: []` while retaining at least one explicitly selected competition. A real selected date can have no qualifying scheduled fixtures, and rejecting that truthful result would encourage invented data. This is a deliberate FixturePack v1 contract correction applied consistently to the schema and runtime validator.

## D-007 — Prompt generation remains domain logic

**Status:** Accepted — 2026-09-01

Build fixture prompts in a pure TypeScript module from explicit date and competition inputs. React manages only transient workflow state and invokes the established parser and validator for imports.

## D-009 — Deterministic manual research

**Status:** Accepted — 2026-09-01

Research is gated on a non-empty, non-synthetic validated FixturePack. Its prompt is a pure function of that pack and explicit freshness settings. Input is validated rather than repaired, and evidence output remains descriptive rather than scored or recommended.

The prompt deliberately contains no fixed freshness-reference timestamp. ChatGPT records the real UTC completion time in `generatedAt` and real UTC retrieval times on sources; import validation, rather than prompt creation, establishes the 24-hour freshness boundary.

## D-010 — Canonical evidence and transparent model scoring

**Status:** Accepted — 2026-09-01

Correct ResearchPack v1's ambiguous free-text market evidence into canonical team-level identifiers and explicit current/recent/venue samples. Use `FormFirst Model v1.0.0`, documented fixed weights, quality gates and whole-percentage evidence scores. These scores are not derived from bookmaker material.

## D-011 — Explicit availability and conservative correlation

**Status:** Accepted — 2026-09-01

Default every market group to unknown, exclude unavailable groups and flag unknown groups for manual checks. Exclude defined near-duplicates, penalize other same-match relationships by 10% and same-family cross-fixture relationships by 2%, then exhaustively select builders using stable tie-breaks.

## D-012 — Model-output-only analysis presentation

**Status:** Accepted — 2026-09-01

Render candidate, confidence, correlation and builder decisions only from the Stage 5 output. Keep manual-entry formatting in a deterministic pure helper, retain unavailable/no-builder outcomes honestly, and invalidate transient results whenever validated inputs or freshness settings change.

## D-013 — Complete snapshots with separate manual outcomes

**Status:** Accepted — 2026-09-01

Store a SavedAnalysisRun v1 only on explicit request, as one complete validated fixture, research, settings and model-output snapshot. Keep manual `pending`, `won`, `lost` and `void` records in a distinct results section and update only that section and its timestamps. Never infer settlement or recompute historical output.

## D-014 — Versioned browser-only history

**Status:** Accepted — 2026-09-01

Use a versioned localStorage collection behind a small adapter. Validate before every write and after every read/import; reject duplicates and unsafe synthetic imports without repair. Do not sync, prune or silently discard records.


## D-015 — Two-competition boundary and self-contained hand-offs

**Status:** Accepted — 2026-09-01

Support exactly Premier League and Championship throughout runtime types, schemas, prompts, validation and persistence. Reject League One and League Two payloads at every manual, import and browser-hydration boundary without repair or deletion. Generated fixture and research hand-offs embed their complete v1 contracts so ChatGPT needs no prior FormFirst context.

## D-016 — Truthful incomplete research evidence

**Status:** Accepted — 2026-09-02

Require `currentSeasonForm`, `marketHitRates` and `optionalMetrics` containers for both teams, while permitting `marketHitRates: []` and `optionalMetrics: {}` for partial or insufficient fixtures. Populated market records remain strictly structured and source-backed. Citation lookup uses every non-empty ID declared by a source object, even if that source has another structural error, so the validator reports the actionable source error without misleading citation cascades.

## ADR: Period-separated early-season evidence

**Decision:** Before five league matches, blend add-one-adjusted current form with the previous season final-ten league baseline using observed sample weights capped at ten; halve historical weight for a sourced material discontinuity. Require final-five and venue records as separate checks, never aggregate overlapping windows. Missing or unassessable history is insufficient. Unknown context and manual market verification do not penalise confidence.

## D-017 — Candidate-scoped context and partial-evidence calibration

**Status:** Accepted — 2026-09-02

ResearchPack v1.2 separates descriptive caveats from direct candidate penalties and requires explicit home/away/both scope. Historical representativeness is the sole historical-weight reduction mechanism; its evidence cannot be reused for a penalty without distinct current evidence. Legacy context is descriptive under model v1.2. `usable_partial` expresses uncertainty, uses normal probability tiers capped at Good, and remains subject to unchanged builder thresholds and correlation rules.

## 2026-09-02 — Current-season benchmark evidence (v1.3)

**Decision:** Replace mandatory previous-season snapshots with sourced current-season competition benchmarks and opponent evidence. Apply the explicit four-fixture empirical-Bayes prior and market-specific weights documented in `SCORING_MODEL.md`; omit unavailable optional components rather than manufacturing neutral values. Preserve v1.0–v1.2 snapshots without recomputation.

## Model v1.4.0 market coverage
ResearchPack v1.4 distinguishes selectable `candidate_market` evidence from `supporting_only` evidence. Every approved team-level market family is processed only by its documented market-specific evidence gate; missing current-season support or a same-key/threshold competition benchmark is reported as unavailable. No specialist statistic is inferred from goals, and prior saved schema versions remain readable without recomputation. See `docs/SCORING_MODEL.md` and `schemas/research-pack.v1.4.schema.json`.

## Decision: AnalysisPack v1 envelope
Use a thin versioned envelope around FixturePack v1.0.0 and ResearchPack v1.4.0. Keep the nested contracts and scoring pipeline unchanged, enforce exact fixture cardinality/identity, and retain legacy imports. v1.4 source identifiers are kebab-case to make generated citations predictable.

## D-013 — One source identity and explicit specialist discovery

Research sources use `sourceId` exclusively, constrained to lowercase kebab-case, with HTTPS, a non-empty title, and a UTC `retrievedAt` ending in `Z`. `id` is rejected with migration guidance. Manual research requests prioritise dedicated current-season specialist threshold records, opponent support, and exact competition benchmarks; unavailable evidence is never inferred. Availability dropdowns remain settlement/availability metadata only.
