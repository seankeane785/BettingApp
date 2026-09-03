# Architecture

FormFirst v1 is a client-only React and TypeScript single-page application built with Vite. It runs locally in the browser and has no backend, remote database, account system or network-based data collection.

## Stage 1 structure

- `index.html` provides the Vite entry document.
- `src/main.tsx` mounts the React application.
- `src/App.tsx` contains the accessible application shell.
- `src/index.css` provides the baseline responsive presentation.
- `schemas/` reserves a documented location for versioned Stage 2 schemas.

Later stages should keep input explicit and manual, validation deterministic, and domain logic separate from presentation. No future layer may introduce APIs, scraping, bookmaker/account connectivity or prohibited odds-related data.

## Stage 2 contracts and validation

Manual JSON crosses the application boundary through versioned Draft 2020-12 contracts in `schemas/`. Domain types and dependency-light validators in `src/domain/` first verify identity and structure, then enforce the Premier League/Championship competition boundary, fixture relationships, evidence sources, explicit synthetic status, prohibited-content controls and freshness. Validation is local and performs no fetches. Research import injects its validation time, enforces the 24-hour source-age ceiling, accepts standard UTC timestamps ending in `Z` with or without fractional seconds, and checks source retrieval against both the pack's completion time and import time. Declared source IDs remain available to citation validation even when another field in their source object is malformed, so one structural root cause does not cascade into false unknown-citation errors. The injected time makes boundary tests deterministic; accepted packs and saved analysis snapshots are subsequently evaluated from their stored inputs rather than the live clock.

## Stage 3 fixture workflow

`src/domain/fixtureWorkflow.ts` owns deterministic prompt construction and composes the Stage 2 JSON parser and FixturePack validator. `src/App.tsx` holds criteria, prompt, pasted text and results in React memory only. Prompts embed their complete versioned contracts and permitted competition values. It does not repair input, perform network requests or persist data. The UI renders only fixture identity and scheduling fields from validated packs.

## Stage 4 research workflow

`src/domain/researchWorkflow.ts` sits between the accepted FixturePack and the shared ResearchPack validator. It owns deterministic prompt generation, workflow gating, strict paste parsing and evidence-summary helpers. The prompt contains no precomputed retrieval cutoff: it asks ChatGPT to record actual UTC retrieval and completion times. It also permits empty market-hit-rate and optional-metric containers for partial or insufficient evidence rather than encouraging fabricated records. React supplies explicit freshness settings and the validator captures the current time only at import; all transient workflow state remains in memory.

## Stage 5 analysis domain

`src/domain/analysisModel.ts` is a pure layer over validated FixturePack/ResearchPack inputs and explicit settings. It generates stable candidates, evaluates correlation-aware combinations and returns builders or a structured no-builder result. Canonical market evidence lives in ResearchPack v1 rather than a parallel format. SavedAnalysisRun v1 now reserves the exact input packs, settings and generated result arrays for future Stage 7 persistence; Stage 5 itself performs no storage. React exposes readiness only.

## Stage 6 presentation

`src/domain/analysisPresentation.ts` contains pure grouping, exclusion-state, no-builder and manual-entry formatting helpers. `src/App.tsx` invokes the existing model only after an explicit generation or availability change, then renders model output without reconstructing selections or scoring. Analysis and clipboard feedback are transient React state; input edits and clear actions invalidate results.

## Stage 7 local persistence

`src/domain/savedRuns.ts` owns snapshot creation, strict hydration, versioned collection storage, deterministic serialization/import and immutable outcome updates. It depends on a minimal `StorageAdapter`, enabling in-memory tests. `src/domain/savedRunBrowser.ts` contains the small UUID/download browser adapters. React explicitly invokes these services; it never recomputes a historical run or replaces current unsaved workflow state when a snapshot is opened. The only persistent key is `formfirst.saved-analysis-runs.v1`; malformed or competition-incompatible collections are reported and retained rather than repaired, restored or pruned. Import and export use the same strict validation boundary.

## ResearchPack v1.1 and early-season scoring

The import boundary reads both v1.0.0 and v1.1.0. Version 1.1 adds period-labelled league market observations and a sourced historical-representativeness assessment. The pure model selects the final-ten baseline, uses the venue record only for its venue component, and reduces historical weight for material discontinuity.

## ResearchPack v1.2 and model v1.2

The import boundary accepts v1.0, v1.1 and v1.2. Legacy unspecific context is adapted by model semantics to descriptive-only (zero penalty), preserving immutable saved snapshots without recomputation. Pure helpers independently calculate early-season history, candidate-scoped direct penalties, evidence quality and tiers. Only valid v1.2 `candidate_penalty` context matching the candidate's home/away side (or `both`) can deduct points or force Avoid.

## ResearchPack and model v1.3

The v1.3 import boundary adds top-level current-season competition benchmarks while retaining current team evidence and scoped v1.2 context. The pure domain model joins candidate, opponent, and benchmark records by canonical market identity, produces an evidence-use trace, and marks missing joins insufficient. React renders that output and does not recreate calculations. Older schemas remain readable snapshot inputs.

## Model v1.4.0 market coverage
ResearchPack v1.4 distinguishes selectable `candidate_market` evidence from `supporting_only` evidence. Every approved team-level market family is processed only by its documented market-specific evidence gate; missing current-season support or a same-key/threshold competition benchmark is reported as unavailable. No specialist statistic is inferred from goals, and prior saved schema versions remain readable without recomputation. See `docs/SCORING_MODEL.md` and `schemas/research-pack.v1.4.schema.json`.

## AnalysisPack boundary
`analysisWorkflow.ts` generates the combined manual-search request and validates `AnalysisPack v1`. Validation delegates to the existing FixturePack and ResearchPack validators, then the UI passes those validated nested objects to the unchanged `analyse` pipeline. Nested validation issues are prefixed with `$.fixturePack` or `$.researchPack`.

## Source boundary and specialist research

The ResearchPack validator is the canonical source boundary for both standalone v1.4 imports and nested AnalysisPack imports. It accepts only `sourceId`, `url`, `title`, and `retrievedAt`, and citation traversal resolves solely through declared kebab-case `sourceId` values. Generated prompts request specialist evidence explicitly, while the unchanged deterministic model continues to enforce candidate, support, and benchmark gates independently of manual availability metadata.

## Research coverage diagnostics

`analysisModel.ts` now emits the complete per-family coverage audit alongside candidates: supplied `candidate_market` and `supporting_only` counts, candidate-matching benchmark count, produced candidate count, and a deterministic unavailable reason. `App.tsx` and `analysisPresentation.ts` only format those model fields; they do not reconstruct evidence gates or scores. Acquisition remains a manually copied prompt and locally imported JSON.

## Research source routing

Prompt generation owns a deterministic source hierarchy without fetching data: official fixture verification, SoccerStats current-season aggregates, then FotMob, SofaScore, and official completed-match centres for explicit specialist values. Imported JSON still passes through the unchanged v1.4 schema and validation boundary. Analysis and presentation do not identify sources or derive records; the model consumes only supplied evidence and the coverage view renders model-owned diagnostics.
