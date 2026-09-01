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

Validation returns structured errors and warnings rather than throwing. It performs relationship, evidence, source, plausibility and prohibited-content checks locally. Freshness uses a caller-provided reference timestamp and maximum age; validators never read uncontrolled current time or contact external services.

## D-006 — Empty FixturePack days are valid

**Status:** Accepted — 2026-09-01

Permit `fixtures: []` while retaining at least one explicitly selected competition. A real selected date can have no qualifying scheduled fixtures, and rejecting that truthful result would encourage invented data. This is a deliberate FixturePack v1 contract correction applied consistently to the schema and runtime validator.

## D-007 — Prompt generation remains domain logic

**Status:** Accepted — 2026-09-01

Build fixture prompts in a pure TypeScript module from explicit date and competition inputs. React manages only transient workflow state and invokes the established parser and validator for imports.

## D-009 — Deterministic manual research

**Status:** Accepted — 2026-09-01

Research is gated on a non-empty, non-synthetic validated FixturePack. Its prompt is a pure function of that pack and explicit freshness settings. Input is validated rather than repaired, and evidence output remains descriptive rather than scored or recommended.

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
