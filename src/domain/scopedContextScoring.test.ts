import { describe, expect, it } from 'vitest'
import fixtureSample from '../../samples/fixture-pack.v1.sample.json'
import researchSample from '../../samples/research-pack.v1.sample.json'
import { analyse, candidateTier, defaultModelSettings, directContextPenalty, earlySeasonScore } from './analysisModel'
import type { FixturePack, ResearchPack } from './types'

const packs = () => {
  const fixture = structuredClone(fixtureSample) as unknown as FixturePack
  const research = structuredClone(researchSample) as unknown as ResearchPack
  research.schemaVersion = '1.2.0'
  const context = { status: 'known' as const, impact: 'neutral' as const, scope: 'both' as const, application: 'descriptive_only' as const, detail: 'General caveat.', sourceIds: ['synthetic-source-1'] }
  Object.assign(research.fixtures[0], { teamNews: structuredClone(context), fixtureCongestion: structuredClone(context), managerialContext: structuredClone(context) })
  return { fixture, research }
}
const settings = () => defaultModelSettings('2026-09-01T10:00:00Z', 24)

function early(team: ResearchPack['fixtures'][number]['homeEvidence'], hits: [number, number, number], reduced = false) {
  const market = team.marketHitRates[0]
  Object.assign(market, { sampleSize: 2, hits: 2, recentSampleSize: 2, recentHits: 2, underlyingSupportPercent: 100 })
  team.currentSeasonLeagueMatches = 2
  team.historicalMarketHitRates = [
    ['previous_season_final_5_league', 5, hits[0], 'all'],
    ['previous_season_final_10_league', 10, hits[1], 'all'],
    ['previous_season_venue_league', 19, hits[2], 'home'],
  ].map(([evidencePeriod, sampleSize, historicalHits, venueRelevance]) => ({ marketKey: market.marketKey, marketGroup: market.marketGroup, selectionLabel: market.selectionLabel, teamSide: market.teamSide, threshold: market.threshold, evidencePeriod, competitionScope: 'Championship', sampleSize, hits: historicalHits, venueRelevance, sourceIds: [...market.sourceIds] })) as typeof team.historicalMarketHitRates
  team.historicalRepresentativeness = { status: reduced ? 'reduced' : 'representative', reason: reduced ? 'material_manager_change' : 'none', sourceIds: [...market.sourceIds] }
}

describe('v1.2 scoped context scoring', () => {
  it.each(['home', 'away'] as const)('deducts exactly 30 only from a %s candidate', scope => {
    const { fixture, research } = packs(); const rf = research.fixtures[0]
    rf.managerialContext = { status: 'known', impact: 'material', scope, application: 'candidate_penalty', detail: 'Current evidence directly reduces this team scoring candidate.', sourceIds: ['synthetic-source-1'] }
    expect(directContextPenalty(rf, scope, research.schemaVersion)).toEqual({ points: 30, material: true })
    expect(directContextPenalty(rf, scope === 'home' ? 'away' : 'home', research.schemaVersion)).toEqual({ points: 0, material: false })
    const output = analyse(fixture, research, settings())
    const home = output.candidates.find(candidate => candidate.marketGroup === 'both_teams_to_score')!
    const away = output.candidates.find(candidate => candidate.marketGroup === 'team_to_score')!
    expect(scope === 'home' ? home.supportingEvidence.componentScores.cautionPenalty : away.supportingEvidence.componentScores.cautionPenalty).toBe(30)
    expect(scope === 'home' ? away.supportingEvidence.componentScores.cautionPenalty : home.supportingEvidence.componentScores.cautionPenalty).toBe(0)
    expect(scope === 'home' ? home.confidence : away.confidence).toBe('Avoid')
    expect(scope === 'home' ? away.confidence : home.confidence).not.toBe('Avoid')
  })
  it('keeps generic availability and a Chelsea-only manager caveat descriptive for both candidates', () => {
    const { fixture, research } = packs(); const rf = research.fixtures[0]
    rf.teamNews = { status: 'known', impact: 'caution', scope: 'both', application: 'descriptive_only', detail: 'Generic squad availability wording.', sourceIds: ['synthetic-source-1'] }
    rf.managerialContext = { status: 'known', impact: 'material', scope: 'away', application: 'descriptive_only', detail: 'Chelsea manager changed.', sourceIds: ['synthetic-source-1'] }
    const before = analyse(fixture, { ...research, schemaVersion: '1.1.0' }, settings())
    const after = analyse(fixture, research, settings())
    expect(after.candidates.map(x => [x.estimatedProbability, x.confidence, x.supportingEvidence.componentScores.cautionPenalty])).toEqual(before.candidates.map(x => [x.estimatedProbability, x.confidence, 0]))
  })
  it('uses reduced history once and reproduces audited blended components', () => {
    const { fixture, research } = packs(); const [rf] = research.fixtures
    early(rf.homeEvidence, [5, 10, 18]); early(rf.awayEvidence, [4, 5, 15], true)
    rf.dataQuality = 'partial'; rf.managerialContext = { status: 'known', impact: 'material', scope: 'away', application: 'descriptive_only', detail: 'Manager change already represented in historical weighting.', sourceIds: ['synthetic-source-1'] }
    const arsenal = earlySeasonScore(rf.homeEvidence.marketHitRates[0], rf.homeEvidence)!
    const chelsea = earlySeasonScore(rf.awayEvidence.marketHitRates[0], rf.awayEvidence)!
    expect(arsenal.valid && Math.round(arsenal.hitRate)).toBe(89)
    expect(chelsea.valid && [Math.round(chelsea.hitRate), Math.round(chelsea.reliability), Math.round(chelsea.venue)]).toEqual([57, 70, 76])
    const away = analyse(fixture, research, settings()).candidates.find(x => x.marketGroup === 'team_to_score')!
    expect(away.supportingEvidence.componentScores.cautionPenalty).toBe(0); expect(away.confidence).not.toBe('Avoid')
  })
  it('caps usable partial at Good while preserving eligibility boundaries', () => {
    expect(candidateTier(71, 'usable_partial', false)).toBe('Good'); expect(candidateTier(72, 'usable_partial', false)).toBe('Good')
    expect(candidateTier(61, 'usable_partial', false)).toBe('Moderate'); expect(candidateTier(90, 'insufficient', false)).toBe('Avoid')
    const { fixture, research } = packs(); research.fixtures[0].dataQuality = 'partial'; const output = analyse(fixture, research, settings())
    expect(output.candidates.every(candidate => candidate.dataQuality === 'usable_partial' && candidate.confidence === 'Good')).toBe(true)
    expect(output.builders.balanced.status).toBe('builder'); expect(output.builders.highProbability.status).toBe('no_qualifying_builder')
  })
  it.each(['previous_season_final_5_league', 'previous_season_final_10_league', 'previous_season_venue_league', 'representativeness'] as const)('keeps missing %s evidence insufficient and ineligible', missing => {
    const { fixture, research } = packs(); const team = research.fixtures[0].homeEvidence; early(team, [5, 10, 18]); research.fixtures[0].dataQuality = 'partial'
    if (missing === 'representativeness') delete team.historicalRepresentativeness
    else team.historicalMarketHitRates = team.historicalMarketHitRates?.filter(item => item.evidencePeriod !== missing)
    const output = analyse(fixture, research, settings()); const candidate = output.candidates.find(x => x.marketGroup === 'both_teams_to_score')!
    expect(candidate.dataQuality).toBe('insufficient'); expect(candidate.confidence).toBe('Avoid'); expect(output.builders.highProbability.status).toBe('no_qualifying_builder')
  })
})
