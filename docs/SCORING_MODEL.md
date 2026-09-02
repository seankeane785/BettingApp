# FormFirst Model v1.2.0

## Deterministic evidence model

The engine is a pure function of imported packs and explicit settings. Scores are transparent evidence scores, not guarantees. Probability boundaries remain Strong (72%+), Good (62–71%), Moderate (50–61%) and Avoid below 50 or for invalid evidence.

## Early-season historical weighting

Before five current-season league matches, add-one smoothing is retained: `(hits + 1) / (sample + 2)`. The current rate is weighted by its observed sample and the previous final-ten league rate by `min(sample, 10)`. A sourced `reduced` representativeness assessment halves only that historical weight. Separate final-five and venue league records remain mandatory; missing final-five, final-ten, venue or representativeness data is insufficient and Avoid. The venue record supplies only the venue component.

## Candidate-scoped direct context

Team news, congestion and manager context can alter probability only in a valid ResearchPack v1.2 object with `application: candidate_penalty`, known caution/material impact, a non-empty detail, valid current candidate-relevant sources, and scope matching the candidate's home/away side or `both`. Caution deducts 10 points and material deducts 30; material forces Avoid only for the affected candidate. `descriptive_only`, generic, unknown, neutral, positive, conflicting and non-directional context deducts zero. Legacy v1.0/v1.1 context is always adapted to descriptive-only. Historical-representativeness evidence cannot also create a direct penalty without distinct present-tense evidence.

Outside the penalty correction, scoring remains 55% hit rate, 10% reliability, 10% recent form, 10% venue, 10% underlying support and 5% opponent context.

## Evidence quality and tiers

`qualifying` uses the normal boundaries. `usable_partial` means sufficient but uncertain evidence: it uses the same boundaries while capping the result at Good. It may therefore be Balanced-eligible at 62–71% (or higher while still capped Good), but can never be Strong or High-probability eligible. Insufficient, stale, contradictory and invalid/unsourced evidence is Avoid and builder-ineligible.

## Builders

High-probability builders still require 2–4 Strong legs at 72%+ and at least 55% combined. Balanced builders still require 2–6 Strong/Good legs at 62%+ and at least 35% combined. Existing duplication and correlation rules remain. No builder is manufactured; “No qualifying builder today” remains valid.
