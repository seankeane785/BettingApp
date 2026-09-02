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
