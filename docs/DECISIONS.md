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
