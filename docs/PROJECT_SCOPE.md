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
