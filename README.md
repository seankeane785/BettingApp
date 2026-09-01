# FormFirst

FormFirst is a local-first browser tool for structured, deterministic team-level analysis of fixtures in the Premier League, Championship, League One and League Two. It supports a manual ChatGPT copy/paste workflow for people who may later place selections manually with Paddy Power. FormFirst never connects to Paddy Power or any betting account.

## Version 1 guardrails

- Manual analysis only: fixture and evidence text will be copied in by the user. There are no APIs, scraping, automatic data collection or bookmaker integrations.
- Team-level markets only. Player-specific markets are excluded.
- The app never uses, stores, displays or infers odds, prices, payouts, implied probability, expected value, value betting, bookmaker links or tipster opinions.
- FormFirst gives no stake advice and must allow the outcome **“No qualifying builder today”** when evidence does not meet the deterministic rules.
- Future analysis outputs must include **“Verify market availability and settlement rules in Paddy Power before placing.”** and **“18+; analysis only; only stake what you can afford to lose.”**
- Version 1 has no backend, accounts, remote database or automated workflow.

## Local development

### Prerequisites

- Node.js 20.19 or newer
- npm 10 or newer

### Commands

```sh
npm install
npm run dev
npm run lint
npm run build
```

`npm run dev` starts Vite's local development server. `npm run build` type-checks the application and creates a production bundle in `dist/`.

See [`docs/PROJECT_SCOPE.md`](docs/PROJECT_SCOPE.md) for the full scope and product guardrails.

## Stage 2 data contracts

Three Draft 2020-12 contracts define the manual, local-only data boundary: `FixturePack v1` for scheduled fixtures, `ResearchPack v1` for cited team evidence, and `SavedAnalysisRun v1` for future deterministic local exports. Reusable TypeScript validators return structured errors and warnings without throwing on malformed content. The JSON files under `samples/` use fictional teams, are explicitly marked as synthetic test data, and are not live research, decisions or advice.

## Stage 3 fixture workflow

Choose an explicit date and one or more supported competitions, generate a deterministic prompt, and use it in ChatGPT Search manually. Paste the single JSON object returned into FormFirst to validate and preview FixturePack v1 fixtures. Nothing is fetched or persisted by the app, and empty scheduled-fixture days are valid.

## Stage 4 research workflow

After accepting a non-empty, non-synthetic FixturePack, FormFirst can generate a deterministic manual ChatGPT Search prompt from those exact fixtures and explicit freshness settings. A pasted ResearchPack v1 is validated without repair, cross-checked against the fixture pack, and summarized as source-backed evidence only. All research state remains in memory.

## Stage 5 analysis model

`FormFirst Model v1.0.0` adds a deterministic, current-season-first domain engine for transparent team-level candidate scoring, confidence and data-quality grading, explicit market availability, duplicate/correlation controls and exhaustive High-probability/Balanced builder search. Results remain domain data only until Stage 6; the UI displays only an analysis-ready status. See [`docs/SCORING_MODEL.md`](docs/SCORING_MODEL.md).

## Stage 6 analysis results

Validated, non-synthetic inputs can now be deliberately analysed with explicit per-market availability settings. The in-memory results interface presents every model candidate by fixture and confidence, both builder outcomes, evidence and risk context, and deterministic copyable manual-entry lists. Unavailable markets are omitted and a builder is never padded when thresholds fail. All availability and settlement checks remain manual, and refresh/reset discards results.
