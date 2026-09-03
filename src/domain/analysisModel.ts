import { MARKET_GROUPS, type AnalysisOutput, type BuilderKind, type BuilderOutcome, type BuilderSuccess, type CandidateDataQuality, type CandidateSelection, type Confidence, type FixturePack, type MarketEvidence, type MarketGroup, type ModelSettings, type RejectedCombination, type ResearchFixture, type ResearchPack, type TeamEvidence } from './types'

export const MODEL_VERSION = 'FormFirst Model v1.4.0' as const
export const defaultModelSettings = (referenceTimestamp: string, maximumSourceAgeHours: number): ModelSettings => ({ referenceTimestamp, maximumSourceAgeHours, marketAvailability: Object.fromEntries(MARKET_GROUPS.map(group => [group, 'unknown'])) as Record<MarketGroup, 'unknown'> })

const clamp = (value: number) => Math.max(0, Math.min(100, value))
const round = (value: number) => Math.round(value)
const contextScore = (fixture: ResearchFixture) => fixture.opponentStrength.impact === 'positive' ? 100 : fixture.opponentStrength.impact === 'material' ? 0 : fixture.opponentStrength.impact === 'caution' ? 25 : 50
const family = (market: MarketEvidence) => {
  if (['match_result', 'double_chance', 'draw_no_bet'].includes(market.marketGroup)) return `result:${market.teamSide}`
  if (['team_to_score', 'team_goals'].includes(market.marketGroup) && (market.threshold === null || market.threshold <= .5)) return `score:${market.teamSide}`
  if (['both_teams_to_score', 'total_goals'].includes(market.marketGroup)) return 'match-goals'
  if (['team_shots', 'team_shots_on_target'].includes(market.marketGroup)) return `attempts:${market.teamSide}`
  return `${market.marketGroup}:${market.teamSide}`
}
export const directContextPenalty = (fixture: ResearchFixture, candidateSide: MarketEvidence['teamSide'], schemaVersion: ResearchPack['schemaVersion']) => {
  if (!['1.2.0', '1.3.0', '1.4.0'].includes(schemaVersion) || !['home', 'away'].includes(candidateSide)) return { points: 0, material: false }
  const applicable = [fixture.teamNews, fixture.fixtureCongestion, fixture.managerialContext].filter(item => item.application === 'candidate_penalty' && (item.scope === candidateSide || item.scope === 'both'))
  return { points: applicable.reduce((sum, item) => sum + (item.impact === 'material' ? 30 : item.impact === 'caution' ? 10 : 0), 0), material: applicable.some(item => item.impact === 'material') }
}
export const earlySeasonScore = (market: MarketEvidence, team: TeamEvidence) => {
  const played = team.currentSeasonLeagueMatches
  if (played === undefined || played >= 5) return null
  const matching = (period: string) => team.historicalMarketHitRates?.find(item => item.evidencePeriod === period && item.marketKey === market.marketKey && item.marketGroup === market.marketGroup && item.teamSide === market.teamSide && item.threshold === market.threshold)
  const finalFive = matching('previous_season_final_5_league'), baseline = matching('previous_season_final_10_league'), venue = matching('previous_season_venue_league')
  const representation = team.historicalRepresentativeness
  if (!finalFive || !baseline || !venue || !representation || representation.status === 'unassessable') return { valid: false as const }
  const factor = representation.status === 'reduced' ? .5 : 1
  const historicalWeight = Math.min(baseline.sampleSize, 10) * factor
  const currentRate = (market.hits + 1) / (market.sampleSize + 2) * 100
  const historicalRate = (baseline.hits + 1) / (baseline.sampleSize + 2) * 100
  return { valid: true as const, hitRate: (currentRate * market.sampleSize + historicalRate * historicalWeight) / (market.sampleSize + historicalWeight), reliability: Math.min((market.sampleSize + historicalWeight) / 10, 1) * 100, venue: (venue.hits + 1) / (venue.sampleSize + 2) * 100, sourceIds: [...new Set([...market.sourceIds, ...finalFive.sourceIds, ...baseline.sourceIds, ...venue.sourceIds, ...representation.sourceIds])] }
}
export const evidenceQuality = (market: MarketEvidence, team: TeamEvidence, fixture: ResearchFixture, research: ResearchPack, settings: ModelSettings): CandidateDataQuality => {
  const early = earlySeasonScore(market, team)
  const citedIds = early?.valid ? early.sourceIds : market.sourceIds
  if (!citedIds.length || citedIds.some(id => !research.sources.some(source => source.sourceId === id))) return 'unsourced'
  if (market.hits > market.sampleSize || market.recentHits > market.recentSampleSize || (market.venueHits ?? 0) > (market.venueSampleSize ?? 0)) return 'contradictory'
  if ((early && !early.valid) || (!early && market.sampleSize < 3) || fixture.dataQuality === 'insufficient') return 'insufficient'
  const stale = citedIds.some(id => { const source = research.sources.find(item => item.sourceId === id); return !source || Date.parse(settings.referenceTimestamp) - Date.parse(source.retrievedAt) > settings.maximumSourceAgeHours * 3_600_000 })
  if (stale) return 'stale'
  if (fixture.dataQuality === 'partial' || market.sampleSize < 8 || market.venueSampleSize === null || market.underlyingSupportPercent === null) return 'usable_partial'
  return 'qualifying'
}
export const candidateTier = (probability: number, quality: CandidateDataQuality, material: boolean): Confidence => {
  if (material || ['stale', 'contradictory', 'insufficient', 'unsourced'].includes(quality) || probability < 50) return 'Avoid'
  if (quality !== 'qualifying' && quality !== 'usable_partial') return 'Moderate'
  if (quality === 'usable_partial' && probability >= 62) return 'Good'
  if (probability >= 72) return 'Strong'
  if (probability >= 62) return 'Good'
  return 'Moderate'
}

function legacyScoreCandidate(fixture: ResearchFixture, team: TeamEvidence, candidateSide: 'home' | 'away', market: MarketEvidence, research: ResearchPack, fixturePack: FixturePack, settings: ModelSettings): CandidateSelection {
  const early = earlySeasonScore(market, team)
  const hitRate = early?.valid ? early.hitRate : market.hits / market.sampleSize * 100
  const reliability = early?.valid ? early.reliability : Math.min(market.sampleSize / 10, 1) * 100
  const recent = market.recentHits / market.recentSampleSize * 100
  const venue = early?.valid ? early.venue : market.venueSampleSize ? (market.venueHits ?? 0) / market.venueSampleSize * 100 : 50
  const underlying = market.underlyingSupportPercent ?? 50
  const opponent = contextScore(fixture)
  const context = directContextPenalty(fixture, candidateSide, research.schemaVersion)
  const penalty = context.points
  const probability = round(clamp(hitRate * .55 + reliability * .10 + recent * .10 + venue * .10 + underlying * .10 + opponent * .05 - penalty))
  const quality = evidenceQuality(market, team, fixture, research, settings)
  const availability = settings.marketAvailability[market.marketGroup]
  const manual = availability === 'unknown'
  return {
    id: `${fixture.fixtureId}:${market.marketKey}:${market.teamSide}`,
    fixtureId: fixture.fixtureId, competition: fixture.competition, homeTeam: fixture.homeTeam, awayTeam: fixture.awayTeam,
    marketKey: market.marketKey, marketGroup: market.marketGroup, selectionLabel: market.selectionLabel,
    estimatedProbability: probability, confidence: candidateTier(probability, quality, context.material), dataQuality: quality,
    supportingEvidence: { sourceIds: [...(early?.valid ? early.sourceIds : market.sourceIds)].sort(), hitRatePercent: round(hitRate), sampleSize: market.sampleSize, componentScores: { hitRate: round(hitRate), reliability: round(reliability), recentForm: round(recent), venue: round(venue), underlying: round(underlying), opponentContext: opponent, cautionPenalty: penalty } },
    reasonsFor: [`Current-season hit rate: ${market.hits}/${market.sampleSize}.`, ...(early?.valid ? [`Early-season blended hit rate: ${round(hitRate)}%.`] : []), `Recent hit rate: ${market.recentHits}/${market.recentSampleSize}.`, ...fixture.reasonsFor].sort(),
    reasonsAgainst: [...fixture.reasonsAgainst, ...(penalty ? [`Context caution penalty: ${penalty} points.`] : []), ...(manual ? ['Market availability and settlement rules require manual checking.'] : [])].sort(),
    modelVersion: MODEL_VERSION, fixtureSchemaVersion: fixturePack.schemaVersion, researchSchemaVersion: research.schemaVersion,
    manualMarketVerificationRequired: manual, manualMarketVerificationReason: manual ? 'Availability and settlement rules are unknown and require manual checking.' : null,
    correlation: { fixtureId: fixture.fixtureId, teamSide: market.teamSide, family: family(market), relationships: [] },
  }
}

/** Explicit v1.3 constants. Rates use an empirical-Bayes prior of four league-benchmark fixtures. */
export const V13_SCORING = { priorFixtures: 4, candidateWeight: .45, opponentWeight: .35, venueWeight: .10, benchmarkWeight: .10, cautionPenalty: 10, materialPenalty: 30 } as const
export const smoothRate = (hits: number, sample: number, benchmarkPercent: number) => (hits + V13_SCORING.priorFixtures * benchmarkPercent / 100) / (sample + V13_SCORING.priorFixtures) * 100
const v13Context = (fixture: ResearchFixture, side: 'home' | 'away') => {
  const applicable = [fixture.teamNews, fixture.fixtureCongestion, fixture.managerialContext].filter(item => item.status === 'known' && item.application === 'candidate_penalty' && (item.scope === side || item.scope === 'both') && ['caution', 'material'].includes(item.impact))
  return { points: applicable.reduce((sum, item) => sum + (item.impact === 'material' ? V13_SCORING.materialPenalty : V13_SCORING.cautionPenalty), 0), material: applicable.some(item => item.impact === 'material'), sourceIds: applicable.flatMap(item => item.sourceIds) }
}
const opponentEvidence = (market: MarketEvidence, opponent: TeamEvidence) => opponent.marketHitRates.find(item => item.marketGroup === market.marketGroup && item.threshold === market.threshold && item.marketKey === market.marketKey && item.teamSide !== market.teamSide)
const benchmarkEvidence = (market: MarketEvidence, fixture: ResearchFixture, research: ResearchPack) => research.competitionBenchmarks?.find(item => item.competition === fixture.competition)?.marketBenchmarks.find(item => item.marketKey === market.marketKey && item.marketGroup === market.marketGroup)
const dedicated = new Set<MarketGroup>(['total_corners','team_corners','total_cards','team_cards','team_shots','team_shots_on_target'])
function scoreV13Candidate(fixture: ResearchFixture, team: TeamEvidence, side: 'home' | 'away', market: MarketEvidence, research: ResearchPack, fixturePack: FixturePack, settings: ModelSettings): CandidateSelection {
  const opponentTeam = side === 'home' ? fixture.awayEvidence : fixture.homeEvidence
  const opponent = opponentEvidence(market, opponentTeam)
  const benchmark = benchmarkEvidence(market, fixture, research)
  const missing: string[] = []
  if (!market.sourceIds.length || !market.sampleSize) missing.push('candidate current market evidence')
  if (!opponent?.sourceIds.length || !opponent.sampleSize) missing.push('opponent current market evidence')
  if (!benchmark?.sourceIds.length || !benchmark.sampleSize || benchmark.supportPercent === null) missing.push('current-season competition benchmark')
  const allCoreIds = [...market.sourceIds, ...(opponent?.sourceIds ?? []), ...(benchmark?.sourceIds ?? [])]
  if (allCoreIds.some(id => !research.sources.some(source => source.sourceId === id))) missing.push('valid source references')
  const contradiction = market.hits > market.sampleSize || !!opponent && opponent.hits > opponent.sampleSize || !!benchmark && benchmark.hits > benchmark.sampleSize
  if (contradiction) missing.push('uncontradicted core evidence')
  const context = v13Context(fixture, side)
  const venueAvailable = market.venueSampleSize !== null && market.venueHits !== null && market.venueSampleSize > 0
  let probability: number | null = null
  let candidateRate: number | null = null, opponentRate: number | null = null, venueRate: number | null = null
  if (!missing.length && opponent && benchmark?.supportPercent !== null && benchmark) {
    candidateRate = smoothRate(market.hits, market.sampleSize, benchmark.supportPercent)
    opponentRate = smoothRate(opponent.hits, opponent.sampleSize, benchmark.supportPercent)
    venueRate = venueAvailable ? smoothRate(market.venueHits!, market.venueSampleSize!, benchmark.supportPercent) : null
    const availableWeight = V13_SCORING.candidateWeight + V13_SCORING.opponentWeight + V13_SCORING.benchmarkWeight + (venueRate === null ? 0 : V13_SCORING.venueWeight)
    probability = round(clamp((candidateRate * V13_SCORING.candidateWeight + opponentRate * V13_SCORING.opponentWeight + benchmark.supportPercent * V13_SCORING.benchmarkWeight + (venueRate ?? 0) * V13_SCORING.venueWeight) / availableWeight - context.points))
  }
  const early = (team.currentSeasonLeagueMatches ?? market.sampleSize) < 5
  const quality: CandidateDataQuality = missing.length ? 'insufficient' : early || fixture.dataQuality === 'partial' ? 'usable_partial' : 'qualifying'
  const sourceIds = [...new Set([...allCoreIds, ...(venueAvailable ? market.sourceIds : []), ...context.sourceIds])].sort()
  const manual = settings.marketAvailability[market.marketGroup] === 'unknown'
  return { id: `${fixture.fixtureId}:${market.marketKey}:${market.teamSide}`, fixtureId: fixture.fixtureId, competition: fixture.competition, homeTeam: fixture.homeTeam, awayTeam: fixture.awayTeam, marketKey: market.marketKey, marketGroup: market.marketGroup, selectionLabel: market.selectionLabel,
    estimatedProbability: probability ?? 0, confidence: probability === null ? 'Avoid' : candidateTier(probability, quality, context.material), dataQuality: quality, missingCoreEvidence: missing,
    supportingEvidence: { sourceIds, hitRatePercent: candidateRate === null ? null : round(candidateRate), sampleSize: market.sampleSize, componentScores: { hitRate: round(candidateRate ?? 0), reliability: Math.min(market.sampleSize / 10, 1) * 100, recentForm: 0, venue: round(venueRate ?? 0), underlying: 0, opponentContext: round(opponentRate ?? 0), cautionPenalty: context.points }, evidenceUseTrace: { candidate: candidateRate === null ? null : `${market.hits}/${market.sampleSize}, smoothed once`, opponent: opponentRate === null ? null : `${opponent!.hits}/${opponent!.sampleSize}, smoothed once`, benchmark: benchmark?.supportPercent === null || !benchmark ? null : `${benchmark.supportPercent}% (${benchmark.hits}/${benchmark.sampleSize})`, venue: venueRate === null ? null : `${market.venueHits}/${market.venueSampleSize}, smoothed once`, context: context.points ? `-${context.points} points` : null, sourceIds } },
    reasonsFor: probability === null ? [] : [`Candidate current evidence: ${market.hits}/${market.sampleSize}.`, `Opponent current evidence: ${opponent!.hits}/${opponent!.sampleSize}.`, `Competition benchmark: ${benchmark!.supportPercent}%.`], reasonsAgainst: [...(missing.length ? [`Evidence insufficient: ${missing.join(', ')}.`] : []), ...(context.points ? [`Scoped context penalty: ${context.points} points.`] : [])], modelVersion: MODEL_VERSION, fixtureSchemaVersion: fixturePack.schemaVersion, researchSchemaVersion: research.schemaVersion, manualMarketVerificationRequired: manual, manualMarketVerificationReason: manual ? 'Availability and settlement rules are unknown and require manual checking.' : null, correlation: { fixtureId: fixture.fixtureId, teamSide: market.teamSide, family: family(market), relationships: dedicated.has(market.marketGroup) ? ['Dedicated same-market evidence only.'] : [] } }
}

export const V14_SCORING = { priorFixtures: 4, candidateWeight: .45, supportWeight: .35, venueWeight: .10, benchmarkWeight: .10 } as const
const textMatch = (e: MarketEvidence, words: string[]) => words.some(word => e.marketKey.includes(word))
function v14Requirements(market: MarketEvidence, own: TeamEvidence, opponent: TeamEvidence) {
  const support = (team: TeamEvidence, predicate: (e: MarketEvidence) => boolean) => team.marketHitRates.find(e => e.evidenceRole === 'supporting_only' && predicate(e))
  const same = (e: MarketEvidence) => e.marketGroup === market.marketGroup && e.threshold === market.threshold
  const result = ['match_result','double_chance','draw_no_bet'].includes(market.marketGroup)
  if (result) return { support: support(opponent, same), missing: [...(market.venueSampleSize ? [] : ['candidate relevant venue record']), ...(support(opponent, same)?.venueSampleSize ? [] : ['opponent win/draw/loss and relevant venue record'])] }
  if (market.marketGroup === 'both_teams_to_score') {
    const records = [support(own, e => textMatch(e, ['score'])), support(own, e => textMatch(e, ['concede'])), support(opponent, e => textMatch(e, ['score'])), support(opponent, e => textMatch(e, ['concede']))]
    return { support: records[0], supports: records, missing: records.map((x, i) => x ? '' : ['home scoring','home conceding','away scoring','away conceding'][i]).filter(Boolean) }
  }
  if (['team_goals','team_to_score'].includes(market.marketGroup)) return { support: support(opponent, e => e.threshold === market.threshold && textMatch(e, ['concede'])), missing: [] }
  if (market.marketGroup === 'clean_sheet') return { support: support(opponent, e => textMatch(e, ['fail_to_score','failed_to_score'])), missing: [] }
  if (market.marketGroup === 'total_goals') return { support: undefined, missing: [] }
  return { support: support(opponent, same), missing: [] }
}
function scoreV14Candidate(fixture: ResearchFixture, team: TeamEvidence, side: 'home' | 'away', market: MarketEvidence, research: ResearchPack, fixturePack: FixturePack, settings: ModelSettings): { candidate?: CandidateSelection; missing: string[] } {
  const opponentTeam = side === 'home' ? fixture.awayEvidence : fixture.homeEvidence
  const req = v14Requirements(market, team, opponentTeam)
  const supports: MarketEvidence[] = (req.supports ?? (req.support ? [req.support] : [])).filter((item): item is MarketEvidence => Boolean(item))
  const benchmark = benchmarkEvidence(market, fixture, research)
  const missing = [...req.missing]
  if (!market.sourceIds.length || !market.sampleSize) missing.push('candidate current-season evidence')
  if (!benchmark || benchmark.threshold !== market.threshold || benchmark.supportPercent === null || !benchmark.sourceIds.length) missing.push(`competition benchmark for ${market.marketKey} at threshold ${market.threshold ?? 'none'}`)
  if (market.marketGroup !== 'total_goals' && !supports.length) missing.push('matching opponent/support evidence')
  if (missing.length || !benchmark || benchmark.supportPercent === null) return { missing: [...new Set(missing)] }
  const candidateRate = smoothRate(market.hits, market.sampleSize, benchmark.supportPercent)
  const supportRates = supports.map(e => smoothRate(e.hits, e.sampleSize, benchmark.supportPercent!))
  const supportRate = supportRates.length ? supportRates.reduce((a,b) => a+b, 0) / supportRates.length : benchmark.supportPercent
  const venueRate = market.venueSampleSize && market.venueHits !== null ? smoothRate(market.venueHits, market.venueSampleSize, benchmark.supportPercent) : null
  const context = v13Context(fixture, side)
  const supportWeight = supports.length ? V14_SCORING.supportWeight : 0
  const weight = V14_SCORING.candidateWeight + supportWeight + V14_SCORING.benchmarkWeight + (venueRate === null ? 0 : V14_SCORING.venueWeight)
  const probability = round(clamp((candidateRate * V14_SCORING.candidateWeight + supportRate * supportWeight + benchmark.supportPercent * V14_SCORING.benchmarkWeight + (venueRate ?? 0) * V14_SCORING.venueWeight) / weight - context.points))
  const partial = fixture.dataQuality === 'partial' || (team.currentSeasonLeagueMatches ?? market.sampleSize) < 8 || market.sampleSize < 8
  const quality: CandidateDataQuality = partial ? 'usable_partial' : 'qualifying'
  const limitation = 'Early-season/small-sample evidence limits confidence; this candidate is capped at Good.'
  const sourceIds = [...new Set([...market.sourceIds, ...supports.flatMap(x => x.sourceIds), ...benchmark.sourceIds, ...context.sourceIds])].sort()
  const manual = settings.marketAvailability[market.marketGroup] === 'unknown'
  const candidate: CandidateSelection = { id:`${fixture.fixtureId}:${market.marketKey}:${market.teamSide}`, fixtureId:fixture.fixtureId, competition:fixture.competition, homeTeam:fixture.homeTeam, awayTeam:fixture.awayTeam, marketKey:market.marketKey, marketGroup:market.marketGroup, selectionLabel:market.selectionLabel, estimatedProbability:probability, confidence:candidateTier(probability, quality, context.material), dataQuality:quality,
    supportingEvidence:{sourceIds,hitRatePercent:round(candidateRate),sampleSize:market.sampleSize,componentScores:{hitRate:round(candidateRate),reliability:Math.min(market.sampleSize/10,1)*100,recentForm:0,venue:round(venueRate ?? 0),underlying:0,opponentContext:round(supportRate),cautionPenalty:context.points},evidenceUseTrace:{candidate:`${market.selectionLabel}: ${market.hits}/${market.sampleSize}, benchmark-smoothed once.`,opponent:supports.length ? supports.map(e => `${e.selectionLabel}: ${e.hits}/${e.sampleSize}, benchmark-smoothed once.`).join(' ') : 'No opponent component is required by this strategy.',benchmark:`${benchmark.selectionLabel}: ${benchmark.supportPercent}% (${benchmark.hits}/${benchmark.sampleSize}).`,venue:venueRate === null ? 'Venue component omitted because no venue sample was supplied.' : `Venue: ${market.venueHits}/${market.venueSampleSize}, benchmark-smoothed once.`,context:context.points ? `Scoped current context penalty: -${context.points} points.` : 'No qualifying scoped context penalty.',sourceIds}},
    reasonsFor:[`Current candidate evidence: ${market.hits}/${market.sampleSize}.`,...(supports.map(e=>`Required support evidence: ${e.hits}/${e.sampleSize}.`)),`Current competition benchmark: ${benchmark.supportPercent}%.`],reasonsAgainst:[...(partial?[limitation]:[]),...(context.points?[`Scoped context penalty: ${context.points} points.`]:[])],modelVersion:MODEL_VERSION,fixtureSchemaVersion:fixturePack.schemaVersion,researchSchemaVersion:research.schemaVersion,manualMarketVerificationRequired:manual,manualMarketVerificationReason:manual?'Availability and settlement rules are unknown and require manual checking.':null,correlation:{fixtureId:fixture.fixtureId,teamSide:market.teamSide,family:family(market),relationships:dedicated.has(market.marketGroup)?['Dedicated same-market evidence only.']:[]}}
  return { candidate, missing: [] }
}

export const relationship = (a: CandidateSelection, b: CandidateSelection): { excluded: boolean; penalty: number; explanation: string } => {
  if (a.id === b.id) return { excluded: true, penalty: 1, explanation: 'Exact duplicate candidate.' }
  if (a.fixtureId === b.fixtureId && a.correlation.family === b.correlation.family) return { excluded: true, penalty: 1, explanation: `Near-duplicate ${a.correlation.family} selections share the same evidence.` }
  if (a.fixtureId === b.fixtureId) return { excluded: false, penalty: .90, explanation: 'Same-match legs receive a conservative 10% correlation penalty.' }
  if (a.correlation.family === b.correlation.family) return { excluded: false, penalty: .98, explanation: 'Same evidence family across fixtures receives a 2% systemic-context penalty.' }
  return { excluded: false, penalty: 1, explanation: 'No documented relationship; no correlation adjustment applied.' }
}

const combinations = <T>(items: T[], min: number, max: number) => { const output: T[][] = []; const visit = (start: number, chosen: T[]) => { if (chosen.length >= min) output.push([...chosen]); if (chosen.length === max) return; for (let i = start; i < items.length; i++) visit(i + 1, [...chosen, items[i]]) }; visit(0, []); return output }
const build = (kind: BuilderKind, candidates: CandidateSelection[], fixtureVersion: string, researchVersion: string): BuilderOutcome => {
  const high = kind === 'high_probability', minProbability = high ? 72 : 62, minimumCombined = high ? 55 : 35, max = high ? 4 : 6
  const eligible = candidates.filter(item => item.estimatedProbability >= minProbability && (high ? item.confidence === 'Strong' : ['Strong', 'Good'].includes(item.confidence))).sort((a, b) => a.id.localeCompare(b.id))
  const rejected: RejectedCombination[] = [], valid: { legs: CandidateSelection[]; probability: number; notes: string[]; quality: number }[] = []
  for (const legs of combinations(eligible, 2, max)) {
    let probability = legs.reduce((value, leg) => value * leg.estimatedProbability / 100, 1), excluded = false; const notes: string[] = []
    for (let i = 0; i < legs.length; i++) for (let j = i + 1; j < legs.length; j++) { const relation = relationship(legs[i], legs[j]); if (relation.excluded) excluded = true; probability *= relation.penalty; if (relation.penalty !== 1 || relation.excluded) notes.push(relation.explanation) }
    const adjusted = round(probability * 100)
    if (excluded || adjusted < minimumCombined) rejected.push({ candidateIds: legs.map(x => x.id), reason: excluded ? 'Duplicate or near-duplicate relationship.' : `Adjusted probability ${adjusted}% is below ${minimumCombined}%.`, principalRisk: notes[0] ?? 'Combined evidence score falls below the builder threshold.' })
    else valid.push({ legs, probability: adjusted, notes: [...new Set(notes)].sort(), quality: legs.reduce((sum, leg) => sum + (leg.dataQuality === 'qualifying' ? 2 : 1), 0) })
  }
  valid.sort((a, b) => b.probability - a.probability || a.legs.length - b.legs.length || b.quality - a.quality || a.legs.map(x => x.id).join('|').localeCompare(b.legs.map(x => x.id).join('|')))
  if (!valid.length) return { status: 'no_qualifying_builder', kind, reason: 'No candidate combination met every eligibility, duplication, correlation and combined-score rule.', principalRisks: candidates.some(c => c.dataQuality === 'usable_partial') ? ['Early-season/small-sample candidate evidence is capped at Good and did not satisfy every builder rule.'] : ['No eligible set met the stated confidence, combined-score, duplication, and correlation gates.'], rejectedCombinations: rejected, modelVersion: MODEL_VERSION, schemaVersions: { fixture: fixtureVersion, research: researchVersion } }
  const winner = valid[0]
  const result: BuilderSuccess = { status: 'builder', kind, selectedLegs: winner.legs, fixtureGroups: [...new Set(winner.legs.map(x => x.fixtureId))].sort().map(fixtureId => ({ fixtureId, candidateIds: winner.legs.filter(x => x.fixtureId === fixtureId).map(x => x.id) })), estimatedCombinedProbability: winner.probability, overallConfidence: high ? 'Strong' : winner.legs.every(x => x.confidence === 'Strong') ? 'Strong' : 'Good', sourceIds: [...new Set(winner.legs.flatMap(x => x.supportingEvidence.sourceIds))].sort(), principalRisks: (winner.legs.flatMap(x => x.reasonsAgainst).filter((x, i, all) => all.indexOf(x) === i).sort().length ? winner.legs.flatMap(x => x.reasonsAgainst).filter((x, i, all) => all.indexOf(x) === i).sort() : ['Combined selections remain subject to their documented evidence samples and correlation adjustment.']), correlationNotes: winner.notes, rejectedCombinations: rejected, modelVersion: MODEL_VERSION, schemaVersions: { fixture: fixtureVersion, research: researchVersion } }
  return result
}

export function analyse(fixturePack: FixturePack, research: ResearchPack, settings: ModelSettings): AnalysisOutput {
  const missing = new Map<MarketGroup, Set<string>>(MARKET_GROUPS.map(group => [group, new Set<string>()]))
  const candidates = research.fixtures.flatMap(fixture => ([['home', fixture.homeEvidence], ['away', fixture.awayEvidence]] as const).flatMap(([side, team]) => team.marketHitRates.filter(market => settings.marketAvailability[market.marketGroup] !== 'unavailable').flatMap(market => {
    if (research.schemaVersion !== '1.4.0') return [research.schemaVersion === '1.3.0' ? scoreV13Candidate(fixture, team, side, market, research, fixturePack, settings) : legacyScoreCandidate(fixture, team, side, market, research, fixturePack, settings)]
    if (market.evidenceRole !== 'candidate_market') return []
    const result = scoreV14Candidate(fixture, team, side, market, research, fixturePack, settings)
    result.missing.forEach(item => missing.get(market.marketGroup)!.add(item))
    return result.candidate ? [result.candidate] : []
  }))).sort((a, b) => a.id.localeCompare(b.id))
  const marketCoverage = MARKET_GROUPS.map(marketGroup => {
    const records = research.fixtures.flatMap(f => [f.homeEvidence, f.awayEvidence]).flatMap(t => t.marketHitRates).filter(e => e.marketGroup === marketGroup)
    const candidateRecords = records.filter(e => e.evidenceRole === 'candidate_market')
    const supportingRecords = records.filter(e => e.evidenceRole === 'supporting_only')
    const benchmarkRecords = (research.competitionBenchmarks ?? []).flatMap(b => b.marketBenchmarks).filter(b => b.marketGroup === marketGroup && candidateRecords.some(c => c.marketKey === b.marketKey && c.threshold === b.threshold))
    const candidateCount = candidates.filter(c => c.marketGroup === marketGroup).length
    const missingEvidence = candidateCount ? [] : [...missing.get(marketGroup)!, ...(candidateRecords.length ? [] : ['candidate-market evidence not supplied'])].sort()
    const family = ({ both_teams_to_score: 'BTTS', match_result: 'Match result', double_chance: 'Double chance', draw_no_bet: 'Draw no bet', total_goals: 'Total goals', team_goals: 'Team goals', team_to_score: 'Team to score', clean_sheet: 'Clean sheet', total_corners: 'Total corners', team_corners: 'Team corners', total_cards: 'Total cards', team_cards: 'Team cards', team_shots: 'Team shots', team_shots_on_target: 'Team shots on target' } as Record<MarketGroup, string>)[marketGroup]
    let unavailableReason: string | null = null
    if (!candidateCount) {
      if (!candidateRecords.length) {
        const firstMissing: Partial<Record<MarketGroup, string>> = {
          both_teams_to_score: 'dedicated BTTS candidate evidence missing; team-to-score evidence is not a substitute',
          team_cards: 'no exact current-season team-card threshold observations found after StatBunker, FotMob, SofaScore and official match-centre checks',
          total_cards: 'no exact current-season total-card threshold observations found after FootyStats, SoccerStats, StatBunker, FotMob, SofaScore and official match-centre checks',
          team_shots: 'no exact current-season team-shot threshold observations found after FootyStats, SoccerStats, FotMob, SofaScore, official match-centre and eligible WhoScored checks',
          team_shots_on_target: 'no exact current-season shots-on-target threshold observations found after FootyStats, SoccerStats, FotMob, SofaScore, official match-centre and eligible WhoScored checks',
          match_result: 'exact current-season candidate W/D/L evidence missing',
        }
        unavailableReason = `${family} unavailable: ${firstMissing[marketGroup] ?? 'exact current-season candidate threshold evidence missing after the specified source route was attempted'}.`
      }
      else if (!supportingRecords.length && marketGroup !== 'total_goals') {
        const missingSupport: Partial<Record<MarketGroup, string>> = {
          team_corners: 'opponent corners-conceded support missing',
          team_shots: 'explicit opponent shots-allowed threshold support missing',
          team_shots_on_target: 'explicit opponent shots-on-target-allowed threshold support missing',
          match_result: 'relevant venue W/D/L evidence or opponent support missing',
        }
        unavailableReason = `${family} unavailable: ${missingSupport[marketGroup] ?? 'mandatory opponent support missing'}.`
      }
      else if (!benchmarkRecords.length || missingEvidence.some(reason => reason.startsWith('competition benchmark'))) unavailableReason = `${family} unavailable: Matching competition benchmark not supplied.`
      else unavailableReason = `${family} unavailable: ${missingEvidence.join('; ')}.`
    }
    return { marketGroup, status: candidateCount ? 'analysed' as const : 'unavailable' as const, candidateMarketRecordsSupplied: candidateRecords.length, supportingOnlyRecordsSupplied: supportingRecords.length, matchingBenchmarksSupplied: benchmarkRecords.length, candidateCount, missingEvidence, unavailableReason }
  })
  return { modelVersion: MODEL_VERSION, settings: { ...settings, marketAvailability: { ...settings.marketAvailability } }, candidates, marketCoverage, builders: { highProbability: build('high_probability', candidates, fixturePack.schemaVersion, research.schemaVersion), balanced: build('balanced', candidates, fixturePack.schemaVersion, research.schemaVersion) } }
}
