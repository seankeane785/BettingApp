# FormFirst Model v1.0.0

## Contract and inputs

The Stage 5 engine is a pure TypeScript function of a valid FixturePack v1, ResearchPack v1, explicit settings and the fixed model version. It sorts every generated collection and uses no clock, network or random input, so identical inputs serialize byte-for-byte identically. Its whole-number estimated probability is a transparent evidence score, not a guarantee and never a bookmaker-derived or implied probability.

Research market entries are canonical, source-backed records: market key/group, exact team-level label and side, optional threshold, full/current-season hits, recent hits, applicable venue hits and underlying support. Free text never creates a market or threshold. Historic-season evidence is not an input.

## Candidate score

Before quality gates, the score is clamped to 0–100 and rounded once to a whole percentage:

- 55% current-season relevant market hit rate;
- 10% reliability (`min(sample size / 10, 1)`);
- 10% recent market hit rate;
- 10% home/away market hit rate, or a conservative 50 when not applicable/available;
- 10% source-backed underlying support percentage, or 50 when unavailable;
- 5% opponent context (positive 100, neutral/unknown 50, caution 25, material 0);
- minus 10 points for each caution and 30 for each material team-news, congestion or manager context; unknown context subtracts 4.

The component values and penalty are returned on every candidate. Reasons include cited sample counts, imported reasons and availability/context cautions.

## Quality gates and confidence

Missing citations, contradictions, fewer than three observations, stale cited sources, `insufficient` fixture data, or material team-news/manager change makes a candidate **Avoid**. Partial data, fewer than eight observations, or missing venue/underlying support is `usable_partial` and caps confidence at **Moderate**. No absence is silently neutral: missing scoring components use the documented conservative midpoint and lower quality.

With qualifying quality and no unresolved material caution: **Strong** is 72%+, **Good** is 62–71%, **Moderate** is 50–61%, and **Avoid** is below 50%. Only Strong/Good can enter builders.

## Availability

Settings explicitly list every supported market group as `unknown`, `available` or `unavailable`; defaults are all `unknown`. Unavailable groups are excluded. Unknown groups may qualify from evidence but are marked for manual availability and settlement-rule verification. Availability is never inferred.

## Duplication and correlation

Exact duplicates and these same-fixture evidence families are mutually exclusive: win/double-chance/draw-no-bet for the same side; team-to-score/equivalent team-goals at 0.5 or lower; BTTS/total-goals; shots/shots-on-target for the same side; and identical team market families (including goals, corners and cards). Other same-match pairs receive a 10% multiplicative penalty. The same evidence family across fixtures receives a conservative 2% systemic-context penalty. Every rejection/adjustment retains an explanation and principal risk.

Combined scores multiply leg scores, then multiply every applicable correlation factor. They remain model evidence scores, not guarantees.

## Builder search

All feasible combinations are evaluated. High-probability uses 2–4 Strong legs, each 72%+, and requires 55% adjusted combined score. Balanced uses 2–6 Strong/Good legs, each 62%+, and requires 35%. Invalid, Moderate, Avoid, duplicate and near-duplicate legs are never padding.

Valid combinations sort by highest adjusted combined score, fewer legs, higher aggregate data quality, then joined stable candidate IDs. Same-fixture legs are grouped for Stage 6. If none qualify, the structured result is `no_qualifying_builder`.

## Limitations

The model is only as complete and current as manually imported sources. It does not fetch, predict from player evidence, use historical seasons, inspect market catalogues, determine settlement rules, use prohibited financial/price content or advise stakes. Correlation factors are deliberately conservative fixed rules rather than learned causal estimates.
