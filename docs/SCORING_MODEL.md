# FormFirst Model v1.1.0

## Deterministic evidence model

The engine is a pure function of the imported packs and explicit settings. Scores are transparent evidence scores, not guarantees. Existing Strong (72%+), Good (62–71%), Moderate (50–61%) and Avoid gates and builder correlation rules are unchanged.

## Early-season policy

A team is early-season before its fifth current-season league match. ResearchPack v1.1 keeps current league observations separate from the previous season's final-five, final-ten and relevant venue league records. Friendlies and cup matches are outside every league period.

The model uses the final-ten record as the non-overlapping historical baseline; final-five is required as a recency check and the venue record supplies only the venue component, so overlapping windows are never summed. Each hit rate receives a conservative add-one adjustment: `(hits + 1) / (sample + 2)`. The blended hit rate weights current evidence by its observed sample and the final-ten baseline by `min(sample, 10)`. Historical weight is multiplied by 0.5 when promotion/relegation, material manager change or material squad disruption makes it less representative. An unassessable change or absent final-five/final-ten/venue baseline remains insufficient.

Reliable early-season evidence is `usable_partial` when the fixture is labelled partial; it is not rejected merely because the current sample has fewer than three matches. Current form therefore influences but cannot dominate after one or two matches.

Outside early season, the v1.0.0 scoring behaviour remains: 55% hit rate, 10% sample reliability, 10% recent form, 10% venue, 10% underlying support and 5% opponent context.

## Context and availability

Unknown context subtracts nothing. A 10-point caution or 30-point material penalty applies only to a known, non-empty, source-cited team-level concern. A documented material team-news or manager issue also forces Avoid. Ordinary availability information is neutral unless its cited detail explicitly identifies a meaningful concern.

Manual market availability and settlement verification remains visible metadata. It neither changes probability nor confidence and is never statistical evidence.

## Builders

High-probability builders require 2–4 Strong legs at 72%+ and a 55% combined score. Balanced builders require 2–6 Strong/Good legs at 62%+ and a 35% combined score. Duplicate, near-duplicate, correlated, weak and under-threshold combinations retain the existing rejection rules. No qualifying builder is a valid result.
