# Project scope

## Purpose

FormFirst is a local-first browser tool for deterministic, team-level analysis across the Premier League and Championship. Users manually copy fixture and evidence material between FormFirst and ChatGPT. There are no APIs, scraping or automatic collection.

The tool is intended only to support analysis before a user manually places anything with Paddy Power. It must never connect to Paddy Power, a bookmaker integration or a betting account.

## Product guardrails

- Team-level analysis only; player-specific markets are excluded.
- Never use, store, display or infer odds, prices, payouts, implied probability, expected value, value betting, bookmaker links or tipster opinions.
- Never provide stake advice.
- Analysis is deterministic and may conclude **“No qualifying builder today”** when evidence does not meet the rules.
- Every future output must state **“Verify market availability and settlement rules in Paddy Power before placing.”**
- Every future output must include **“18+; analysis only; only stake what you can afford to lose.”**

## Stage 1

Stage 1 delivers governance documentation and an accessible React, TypeScript and Vite application shell. It deliberately excludes fixture import, research import, validation, scoring, accumulator logic, persistence, functional schemas, integrations, accounts, backend services, remote databases and hosting.

## Early-season scope

Early-season analysis uses team-level competitive league evidence only: current-season league form plus separate previous-season final-five, final-ten and relevant venue windows. Friendlies, cups, player markets and automated collection remain excluded.

## v1.2 calibration boundary

Context may alter a team-to-score candidate only when ResearchPack v1.2 marks current, sourced, team-level evidence as `candidate_penalty` and scopes it to that candidate. Generic and descriptive context remains visible without changing probability. Partial evidence is uncertainty rather than missing required evidence; it is capped at Good and must still satisfy every unchanged Balanced builder rule. Builders are never forced.

## v1.3 evidence boundary

New analysis uses current-season league team, opponent, competition-benchmark, small shrunk venue, and candidate-relevant scoped context evidence only. Previous-season results and historic representativeness are outside the v1.3 scoring boundary. No backend, collection automation, non-team market, or forced builder is introduced.

## Model v1.4.0 market coverage
ResearchPack v1.4 distinguishes selectable `candidate_market` evidence from `supporting_only` evidence. Every approved team-level market family is processed only by its documented market-specific evidence gate; missing current-season support or a same-key/threshold competition benchmark is reported as unavailable. No specialist statistic is inferred from goals, and prior saved schema versions remain readable without recomputation. See `docs/SCORING_MODEL.md` and `schemas/research-pack.v1.4.schema.json`.

## AnalysisPack workflow
The local-only scope includes a manual one-prompt, one-import AnalysisPack workflow for fixture discovery and team-level research. It adds no backend or automated collection. Legacy separate pack imports remain supported. Missing specialist evidence produces unavailable coverage and may validly produce “No qualifying builder today”.
