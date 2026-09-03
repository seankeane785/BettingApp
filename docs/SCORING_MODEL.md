# FormFirst Model v1.4.0

The deterministic model uses completed **current-season league** evidence only. Outputs are model estimates, not empirically calibrated probabilities; no out-of-sample calibration study has been completed.

## Evidence gates and matrix

| Candidate family | Candidate evidence | Required support | Benchmark |
|---|---|---|---|
| Match result, double chance, draw no bet | Current W/D/L record and relevant venue sample | Opponent current W/D/L and venue sample | Same outcome key/threshold |
| BTTS | Both teams' scoring evidence | Both teams' conceding evidence | Same BTTS key/threshold |
| Total goals | Dedicated match-total threshold | None invented; team scored/conceded may be supplied as explicit support | Same total threshold |
| Team goals / team to score | Team scoring threshold | Opponent conceding threshold | Same candidate key/threshold |
| Clean sheet | Team clean-sheet record | Opponent failure-to-score record | Same clean-sheet key/threshold |
| Total/team corners | Dedicated corners threshold | Opponent corners/conceded-corners record | Same corners key/threshold |
| Total/team cards | Dedicated cards threshold | Opponent cards/discipline record | Same cards key/threshold |
| Team shots / shots on target | Dedicated attempts threshold | Opponent allowance record | Same attempts key/threshold |

Only `candidate_market` records are selectable. `supporting_only` records are consumed only by the matching strategy and never emitted. Missing gates produce an unavailable coverage reason, not a candidate. Specialist and outcome evidence is never inferred from goals.

## Formula

Each supplied rate is smoothed once toward the matching current competition benchmark with a four-fixture prior: `(hits + 4 × benchmarkRate) / (sample + 4)`. The score is the available-weight normalized sum of candidate 45%, required support 35%, venue 10%, and benchmark 10%. Total-goals has no invented support component, so its available weights are renormalized. Multiple mandatory BTTS support rates are averaged after each is smoothed once. Venue weight is omitted and weights renormalized only for strategies where venue is optional; result-family venue evidence is a hard gate.

Scoped current candidate penalties remain 10 points for caution and 30 for material evidence. Unknown, descriptive, positive, or wrong-side context has no numerical effect. Samples below eight, partial fixture packs, and early-season team records are `usable_partial`, carry an explicit limitation, and are capped at Good. Strong (72%), Good (62%), High-builder (72% legs/55% combined), and Balanced-builder (62% legs/35% combined) gates are unchanged. Duplicate/near-duplicate legs are rejected; documented correlation adjustments remain 10% same-match and 2% same-family across fixtures. Builders are never forced.

## Evidence coverage and AnalysisPack
AnalysisPack changes acquisition and validation, not scoring. Candidate evidence, required opponent support, mandatory venue evidence, and an exact market-key/threshold benchmark remain gates. Dedicated corner, card, shot, and shot-on-target evidence is never inferred from goal evidence. “Unavailable” describes missing evidence rather than a negative forecast.

## Specialist evidence acquisition boundary

Research requests seek dedicated current-season threshold hit rates for total/team corners, total/team cards, team shots, and team shots on target, plus required opponent allowance/support and exact same-key/same-threshold competition benchmarks. The scoring model is unchanged: it does not infer these records from goals, possession, generic averages, xG alone, narrative reporting, fouls, or referee averages. Manual availability cannot create evidence, probabilities, confidence, or candidates.

## v1.4 research-coverage audit

Coverage reporting does not alter scoring. For each enabled family, the model counts supplied candidate and supporting records, benchmarks whose key and threshold match a supplied candidate, and candidates that passed the existing evidence matrix. An unavailable reason identifies the absent dedicated candidate evidence, mandatory opponent support, relevant venue record, or exact current-season benchmark. `supporting_only` inputs remain non-selectable, the early-season partial-data cap is unchanged, and no candidate or builder is forced.

## Source-routing boundary

Source routing changes research instructions, not scoring. SoccerStats-supported evidence and exact specialist match-centre evidence enter the same v1.4 gates and formulas. An average in `optionalMetrics` is not a threshold record and cannot create a candidate. Missing candidate evidence, mandatory opponent support, required venue evidence, or an exact matching competition benchmark continues to produce no candidate. Coverage reasons now distinguish missing SoccerStats thresholds, missing direct specialist values, missing opponent support, and missing benchmarks.

## Acquisition does not change scoring

The expanded 14-family research checklist changes only how a manual ChatGPT Search session attempts to acquire eligible evidence. Every candidate still needs exact candidate evidence, matrix-required opponent support, venue evidence where required, and a same-key/same-threshold benchmark. No checked source creates points, no average or proxy creates a record, and all weights, thresholds, quality caps, correlations, builder rules, and “No qualifying builder today” behaviour remain unchanged.

## Goal-family acquisition boundaries

Prompt acquisition now states the existing goal evidence identities explicitly. `team_to_score` is only team 1+ at threshold `0.5`. `team_goals` is team over 1.5 at `1.5`, optionally over 2.5 at `2.5` when exact observations exist. `total_goals` is the dedicated match total at those same two thresholds. Each candidate needs its own exact record, family-matching opponent support, any matrix-required venue sample, and a same-family/key/threshold benchmark. No family can supply another family's candidate or support, and team-to-score cannot create BTTS evidence. Scoring and builder thresholds are unchanged.

### v1.4 contract preflight
The canonical market-contract preflight is a gate before the unchanged v1.4 scoring calculation. A candidate reaches scoring only with its exact key, group, side and threshold; every defined reciprocal support record; required venue sample; and exact current-season competition benchmark. No weights, priors, confidence thresholds, builder rules, or correlation rules changed.
