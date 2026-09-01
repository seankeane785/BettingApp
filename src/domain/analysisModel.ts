import { MARKET_GROUPS, type AnalysisOutput, type BuilderKind, type BuilderOutcome, type BuilderSuccess, type CandidateDataQuality, type CandidateSelection, type Confidence, type FixturePack, type MarketEvidence, type MarketGroup, type ModelSettings, type RejectedCombination, type ResearchFixture, type ResearchPack } from './types'

export const MODEL_VERSION = 'FormFirst Model v1.0.0' as const
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
const cautionPenalty = (fixture: ResearchFixture) => [fixture.teamNews, fixture.fixtureCongestion, fixture.managerialContext].reduce((sum, item) => sum + (item.impact === 'material' ? 30 : item.impact === 'caution' ? 10 : item.impact === 'unknown' ? 4 : 0), 0)
const sourceQuality = (market: MarketEvidence, fixture: ResearchFixture, research: ResearchPack, settings: ModelSettings): CandidateDataQuality => {
  if (!market.sourceIds.length || market.sourceIds.some(id => !research.sources.some(source => source.sourceId === id))) return 'unsourced'
  if (market.hits > market.sampleSize || market.recentHits > market.recentSampleSize || (market.venueHits ?? 0) > (market.venueSampleSize ?? 0)) return 'contradictory'
  if (market.sampleSize < 3 || fixture.dataQuality === 'insufficient') return 'insufficient'
  const stale = market.sourceIds.some(id => { const source = research.sources.find(item => item.sourceId === id); return !source || Date.parse(settings.referenceTimestamp) - Date.parse(source.retrievedAt) > settings.maximumSourceAgeHours * 3_600_000 })
  if (stale) return 'stale'
  if (fixture.dataQuality === 'partial' || market.sampleSize < 8 || market.venueSampleSize === null || market.underlyingSupportPercent === null) return 'usable_partial'
  return 'qualifying'
}
const confidenceFor = (probability: number, quality: CandidateDataQuality, material: boolean): Confidence => {
  if (material || ['stale', 'contradictory', 'insufficient', 'unsourced'].includes(quality) || probability < 50) return 'Avoid'
  if (quality !== 'qualifying') return 'Moderate'
  if (probability >= 72) return 'Strong'
  if (probability >= 62) return 'Good'
  return 'Moderate'
}

function scoreCandidate(fixture: ResearchFixture, market: MarketEvidence, research: ResearchPack, fixturePack: FixturePack, settings: ModelSettings): CandidateSelection {
  const hitRate = market.hits / market.sampleSize * 100
  const reliability = Math.min(market.sampleSize / 10, 1) * 100
  const recent = market.recentHits / market.recentSampleSize * 100
  const venue = market.venueSampleSize ? (market.venueHits ?? 0) / market.venueSampleSize * 100 : 50
  const underlying = market.underlyingSupportPercent ?? 50
  const opponent = contextScore(fixture)
  const penalty = cautionPenalty(fixture)
  const probability = round(clamp(hitRate * .55 + reliability * .10 + recent * .10 + venue * .10 + underlying * .10 + opponent * .05 - penalty))
  const quality = sourceQuality(market, fixture, research, settings)
  const material = [fixture.teamNews, fixture.managerialContext].some(item => item.impact === 'material')
  const availability = settings.marketAvailability[market.marketGroup]
  const manual = availability === 'unknown'
  return {
    id: `${fixture.fixtureId}:${market.marketKey}:${market.teamSide}`,
    fixtureId: fixture.fixtureId, competition: fixture.competition, homeTeam: fixture.homeTeam, awayTeam: fixture.awayTeam,
    marketKey: market.marketKey, marketGroup: market.marketGroup, selectionLabel: market.selectionLabel,
    estimatedProbability: probability, confidence: confidenceFor(probability, quality, material), dataQuality: quality,
    supportingEvidence: { sourceIds: [...market.sourceIds].sort(), hitRatePercent: round(hitRate), sampleSize: market.sampleSize, componentScores: { hitRate: round(hitRate), reliability: round(reliability), recentForm: round(recent), venue: round(venue), underlying: round(underlying), opponentContext: opponent, cautionPenalty: penalty } },
    reasonsFor: [`Current-season hit rate: ${market.hits}/${market.sampleSize}.`, `Recent hit rate: ${market.recentHits}/${market.recentSampleSize}.`, ...fixture.reasonsFor].sort(),
    reasonsAgainst: [...fixture.reasonsAgainst, ...(penalty ? [`Context caution penalty: ${penalty} points.`] : []), ...(manual ? ['Market availability and settlement rules require manual checking.'] : [])].sort(),
    modelVersion: MODEL_VERSION, fixtureSchemaVersion: fixturePack.schemaVersion, researchSchemaVersion: research.schemaVersion,
    manualMarketVerificationRequired: manual, manualMarketVerificationReason: manual ? 'Availability and settlement rules are unknown and require manual checking.' : null,
    correlation: { fixtureId: fixture.fixtureId, teamSide: market.teamSide, family: family(market), relationships: [] },
  }
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
  if (!valid.length) return { status: 'no_qualifying_builder', kind, reason: 'No candidate combination met every eligibility, duplication, correlation and combined-score rule.', principalRisks: ['Evidence or adjusted combined score did not qualify.'], rejectedCombinations: rejected, modelVersion: MODEL_VERSION, schemaVersions: { fixture: fixtureVersion, research: researchVersion } }
  const winner = valid[0]
  const result: BuilderSuccess = { status: 'builder', kind, selectedLegs: winner.legs, fixtureGroups: [...new Set(winner.legs.map(x => x.fixtureId))].sort().map(fixtureId => ({ fixtureId, candidateIds: winner.legs.filter(x => x.fixtureId === fixtureId).map(x => x.id) })), estimatedCombinedProbability: winner.probability, overallConfidence: high ? 'Strong' : winner.legs.every(x => x.confidence === 'Strong') ? 'Strong' : 'Good', sourceIds: [...new Set(winner.legs.flatMap(x => x.supportingEvidence.sourceIds))].sort(), principalRisks: winner.legs.flatMap(x => x.reasonsAgainst).filter((x, i, all) => all.indexOf(x) === i).sort(), correlationNotes: winner.notes, rejectedCombinations: rejected, modelVersion: MODEL_VERSION, schemaVersions: { fixture: fixtureVersion, research: researchVersion } }
  return result
}

export function analyse(fixturePack: FixturePack, research: ResearchPack, settings: ModelSettings): AnalysisOutput {
  const candidates = research.fixtures.flatMap(fixture => ([...fixture.homeEvidence.marketHitRates, ...fixture.awayEvidence.marketHitRates]).filter(market => settings.marketAvailability[market.marketGroup] !== 'unavailable').map(market => scoreCandidate(fixture, market, research, fixturePack, settings))).sort((a, b) => a.id.localeCompare(b.id))
  return { modelVersion: MODEL_VERSION, settings: { ...settings, marketAvailability: { ...settings.marketAvailability } }, candidates, builders: { highProbability: build('high_probability', candidates, fixturePack.schemaVersion, research.schemaVersion), balanced: build('balanced', candidates, fixturePack.schemaVersion, research.schemaVersion) } }
}
