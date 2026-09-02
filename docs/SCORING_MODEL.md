# FormFirst Model v1.3.0

Model v1.3.0 is deterministic and evidence-led. It is not claimed to be empirically calibrated; documented out-of-sample calibration remains required.

## Current-season-only early-season policy

No prior-season results, historic market rates, historic venue records, or historical representativeness enter v1.3 scoring. Every candidate requires current-season candidate evidence, matching current-season opponent evidence, a sourced current-season competition benchmark, fresh source references, and no material contradiction. Missing core evidence yields `insufficient`, `Avoid`, no numerical presentation, and builder exclusion.

For each source-backed observed rate `(hits, n)` and league benchmark `b` (as a proportion), empirical-Bayes smoothing uses a fixed prior strength of four fixtures:

`smoothedPercent = 100 × (hits + 4 × b) / (n + 4)`

For a team-to-score candidate the unrounded score is:

`(0.45 × candidateSmoothed + 0.35 × opponentConcedingSmoothed + 0.10 × benchmarkPercent + 0.10 × venueSmoothed) / availableWeight − contextPenalty`

`availableWeight` is the sum of included weights. Venue is omitted, rather than defaulted, when unavailable, making the denominator `0.90`. The result is clamped to 0–100 and rounded once to a whole percent. Candidate, opponent, benchmark, venue, and context data are each applied once. Source-ID deduplication affects trace output only and cannot alter the score.

Constants in `V13_SCORING` are: prior fixtures `4`; candidate `0.45`; opponent `0.35`; benchmark `0.10`; venue `0.10`; scoped caution penalty `10` points; scoped material penalty `30` points.

Equivalent market-specific records are required for BTTS, totals, result families, corners, cards, shots, and shots on target. Dedicated non-goal markets are never inferred from goal evidence. Source-backed, consistently defined xG may support goal totals only; missing optional metrics receive no neutral value.

## Quality and builders

Before five current league matches, complete core evidence is `usable_partial`, capped at `Good`; `qualifying` and `Strong` are unavailable. Balanced candidates still require at least 62%, and every combination must meet existing duplication, correlation, and 35% combined-score rules. High-probability candidates require `Strong` at 72% and a 55% combined score, so early-season partial evidence is excluded. “No qualifying builder today” remains a valid output.

Scoped v1.2 context rules continue: unknown, generic, legacy, descriptive-only, neutral, positive, or non-directional context has zero direct effect. Only known, sourced, current, candidate-scoped caution or material disruption receives the explicit penalty.

Legacy v1.0–v1.2 saved runs are immutable stored outputs and are displayed without recomputation.
