# FormFirst

FormFirst is a local-first browser tool for structured, deterministic team-level analysis of fixtures in the Premier League and Championship. It supports a manual ChatGPT copy/paste workflow for people who may later place selections manually with Paddy Power. FormFirst never connects to Paddy Power or any betting account.

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

After pulling an import-pipeline fix, stop and restart the local server exactly as follows:

```bash
Ctrl+C
npm run dev
```

Then use `Cmd + Shift + R` in the browser to hard-refresh the client. The footer build marker identifies the AnalysisPack import workflow currently running.

See [`docs/PROJECT_SCOPE.md`](docs/PROJECT_SCOPE.md) for the full scope and product guardrails.

## Stage 2 data contracts

Three Draft 2020-12 contracts define the manual, local-only data boundary: `FixturePack v1` for scheduled fixtures, `ResearchPack v1` for cited team evidence, and `SavedAnalysisRun v1` for future deterministic local exports. Reusable TypeScript validators return structured errors and warnings without throwing on malformed content. The JSON files under `samples/` use fictional teams, are explicitly marked as synthetic test data, and are not live research, decisions or advice.

## Stage 3 fixture workflow

Choose an explicit date and one or both supported competitions (Premier League and Championship), generate a deterministic prompt, and use it in ChatGPT Search manually. Paste the single JSON object returned into FormFirst to validate and preview FixturePack v1 fixtures. Nothing is fetched or persisted by the app, and empty scheduled-fixture days are valid.

## Stage 4 research workflow

After accepting a non-empty, non-synthetic FixturePack, FormFirst can generate a deterministic manual ChatGPT Search prompt from those exact fixtures and explicit freshness settings. A pasted ResearchPack v1 is validated without repair, cross-checked against the fixture pack, and summarized as source-backed evidence only. All research state remains in memory.

## Stage 5 analysis model

`FormFirst Model v1.3.0` provides a deterministic, current-season-only benchmark domain engine for transparent team-level candidate scoring, confidence and data-quality grading, explicit market availability, duplicate/correlation controls and exhaustive High-probability/Balanced builder search. Tiny samples are conservatively shrunk toward sourced current-season league benchmarks, missing core evidence is not estimated, and the UI renders the model evidence-use trace without recalculation. The estimates are not yet empirically calibrated. See [`docs/SCORING_MODEL.md`](docs/SCORING_MODEL.md).

## Stage 6 analysis results

Validated, non-synthetic inputs can now be deliberately analysed with explicit per-market availability settings. The in-memory results interface presents every model candidate by fixture and confidence, both builder outcomes, evidence and risk context, and deterministic copyable manual-entry lists. Unavailable markets are omitted and a builder is never padded when thresholds fail. All availability and settlement checks remain manual, and refresh/reset discards results.

## Stage 7 local saved history

A generated analysis is stored only after **Save current analysis** is selected. SavedAnalysisRun v1 keeps the complete fixture/research inputs, model settings and output as an immutable snapshot; manual builder and leg outcomes remain separate. History stays in this browser, has no remote sync, and may be lost when browser site data is cleared. Complete validated JSON exports can be downloaded and real-data SavedAnalysisRun v1 exports can be imported back into local history. League One and League Two payloads, including legacy browser records, are rejected as incompatible without deleting stored data.

## Early-season evidence

Before five current-season league matches, ResearchPack v1.2 requires separate current league data and source-backed previous-season final-five, final-ten and venue league baselines. The deterministic model blends them conservatively and permits no qualifying builder when history or material-change assessment is unreliable. Manual market verification remains separate from statistical confidence.

## Scoped context calibration

ResearchPack v1.2 distinguishes visible descriptive caveats from current, sourced, candidate-specific penalties. Legacy v1.0/v1.1 fixture context is descriptive when analysed by model v1.2. Partial evidence represents uncertainty, not insufficiency: it may reach Good and the unchanged Balanced threshold, but is capped below Strong and cannot enter the High-probability builder. Existing thresholds remain unchanged, and “No qualifying builder today” remains valid.

## Model v1.4.0 market coverage
ResearchPack v1.4 distinguishes selectable `candidate_market` evidence from `supporting_only` evidence. Every approved team-level market family is processed only by its documented market-specific evidence gate; missing current-season support or a same-key/threshold competition benchmark is reported as unavailable. No specialist statistic is inferred from goals, and prior saved schema versions remain readable without recomputation. See `docs/SCORING_MODEL.md` and `schemas/research-pack.v1.4.schema.json`.

## One-prompt match research
Select a Europe/London date and supported competitions, choose **Generate match research request**, run the prompt manually in ChatGPT Search, and import its single `AnalysisPack v1` JSON response. FormFirst validates the nested FixturePack v1.0.0 and ResearchPack v1.4.0 before reusing the existing deterministic analysis pipeline. The former separate imports remain under the legacy/advanced workflow. Specialist markets shown as unavailable indicate missing dedicated evidence, not a negative forecast. ResearchPack v1.4 source IDs use kebab-case.

### Canonical research sources and specialist coverage

ResearchPack v1.4 and the nested AnalysisPack ResearchPack use one strict source shape: `{ "sourceId": "non-empty kebab-case string", "url": "HTTPS URL", "title": "non-empty string", "retrievedAt": "ISO 8601 UTC timestamp ending in Z" }`. The legacy `id` field is not supported. Generated requests explicitly prioritise dedicated current-season corners, cards, team shots and team shots-on-target thresholds, opponent support and exact benchmarks. Missing records leave the market unavailable; manual availability controls never create or alter evidence or candidates.

### Research coverage audit (v1.4 enhancement)

Generated AnalysisPack and standalone ResearchPack requests verify fixtures through the official competition source, research every supported family independently through the shared source hierarchy, and use completed-match centres only for exact specialist statistics after aggregate routes fail. Candidate records remain optional and require exact candidate, matrix support, applicable venue, and competition-benchmark evidence. Source URLs are requested with JSON `\u002F` slash escapes so copied JSON is not changed into Markdown links; runtime URL validation is unchanged. Analysis results show model-provided candidate-record, support-record, matching-benchmark, produced-candidate, and unavailability diagnostics for every family.

### Research source routing (ResearchPack v1.4)

Generated combined and standalone research prompts use FootyStats as the preferred current-season aggregate source and SoccerStats only as an exact-component aggregate fallback. Exact specialist match statistics fall back, in order, to FotMob, SofaScore, then official Premier League/EFL completed-match centres. WinDrawWin is prohibited. Averages are not threshold hit rates; missing exact counts, opponent support, venue evidence, or matching benchmarks leave a family unavailable.

## Research source acquisition

Generated AnalysisPack and standalone ResearchPack v1.4 prompts now apply the same component-level hierarchy: official pages verify fixtures; FootyStats is the preferred aggregate statistics source; SoccerStats is an exact-component fallback; StatBunker is a team-discipline fallback; and direct match statistics follow FotMob, SofaScore, then an official completed-match centre, with WhoScored limited to eligible Premier League team-shot evidence. Every one of the 14 supported team-level market families must be attempted independently. Duplicate provider observations are never blended or counted twice, averages and player aggregation cannot create threshold records, and an exact conflict suppresses only the affected candidate. “Unavailable” therefore means the complete specified route was attempted but a mandatory candidate, opponent-support, venue, or benchmark component could not be established.

### Canonical prompt market matrix

Both generated v1.4 research requests render one shared 14-family matrix. Goal records are disjoint: `team_to_score` means 1+ at threshold `0.5`; `team_goals` means over 1.5 at `1.5`, with over 2.5 at `2.5` attempted only with exact evidence; and `total_goals` uses dedicated match-total records at `1.5` and, where exact evidence exists, `2.5`. Candidate, opponent support, required venue, and same-key/same-threshold benchmark evidence remain mandatory and cannot be substituted across families.

### ResearchPack v1.4 market contract
All 14 team-level market families now share one typed, executable contract. Research attempts each family independently, while import validation and analysis require the exact candidate key, reciprocal `supporting_only` evidence, threshold, venue record (where applicable), and competition benchmark. Missing exact evidence leaves that family unavailable and does not manufacture or infer a candidate.
