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

Manual JSON crosses the application boundary through versioned Draft 2020-12 contracts in `schemas/`. Domain types and dependency-light validators in `src/domain/` first verify identity and structure, then enforce fixture relationships, evidence sources, explicit synthetic status, prohibited-content controls and deterministic freshness. Validation is local and performs no fetches. A caller supplies the reference timestamp and maximum source age, so identical inputs and settings produce identical outcomes. Validated packs remain separate from future presentation, scoring and persistence layers.

## Stage 3 fixture workflow

`src/domain/fixtureWorkflow.ts` owns deterministic prompt construction and composes the Stage 2 JSON parser and FixturePack validator. `src/App.tsx` holds criteria, prompt, pasted text and results in React memory only. It does not repair input, perform network requests or persist data. The UI renders only fixture identity and scheduling fields from validated packs.

## Stage 4 research workflow

`src/domain/researchWorkflow.ts` sits between the accepted FixturePack and the shared ResearchPack validator. It owns deterministic prompt generation, workflow gating, strict paste parsing and evidence-summary helpers. React supplies explicit freshness settings; all state remains in memory.

## Stage 5 analysis domain

`src/domain/analysisModel.ts` is a pure layer over validated FixturePack/ResearchPack inputs and explicit settings. It generates stable candidates, evaluates correlation-aware combinations and returns builders or a structured no-builder result. Canonical market evidence lives in ResearchPack v1 rather than a parallel format. SavedAnalysisRun v1 now reserves the exact input packs, settings and generated result arrays for future Stage 7 persistence; Stage 5 itself performs no storage. React exposes readiness only.

## Stage 6 presentation

`src/domain/analysisPresentation.ts` contains pure grouping, exclusion-state, no-builder and manual-entry formatting helpers. `src/App.tsx` invokes the existing model only after an explicit generation or availability change, then renders model output without reconstructing selections or scoring. Analysis and clipboard feedback are transient React state; input edits and clear actions invalidate results.
