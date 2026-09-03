import { describe, expect, it } from 'vitest'
import { derive1x2 } from './analysisModel'
import type { ResearchFixture } from './types'

const fixture = (matches = 5): ResearchFixture => ({
  fixtureId: 'f', competition: 'Premier League', homeTeam: 'Home', awayTeam: 'Away',
  homeEvidence: { currentSeasonLeagueMatches: matches, currentSeasonForm: { summary: 'rolling', lastFive: null, lastTen: null, homeOrAway: null, goalsScored: 8, goalsConceded: 4, sourceIds: ['team'] }, marketHitRates: [], optionalMetrics: {} },
  awayEvidence: { currentSeasonLeagueMatches: matches, currentSeasonForm: { summary: 'rolling', lastFive: null, lastTen: null, homeOrAway: null, goalsScored: 5, goalsConceded: 7, sourceIds: ['team'] }, marketHitRates: [], optionalMetrics: {} },
  opponentStrength: { status: 'unknown', impact: 'unknown', detail: null, sourceIds: ['team'] }, teamNews: { status: 'unknown', impact: 'unknown', scope: 'both', application: 'descriptive_only', detail: null, sourceIds: ['team'] }, fixtureCongestion: { status: 'unknown', impact: 'unknown', scope: 'both', application: 'descriptive_only', detail: null, sourceIds: ['team'] }, managerialContext: { status: 'unknown', impact: 'unknown', scope: 'both', application: 'descriptive_only', detail: null, sourceIds: ['team'] }, reasonsFor: [], reasonsAgainst: [], dataQuality: matches < 5 ? 'partial' : 'complete',
  derived1x2FromGoals: { strategy: 'derived_1x2_from_goals', home: { matchesPlayed: matches, goalsScored: 8, goalsConceded: 4, sourceIds: ['team'] }, away: { matchesPlayed: matches, goalsScored: 5, goalsConceded: 7, sourceIds: ['team'] }, competitionCompletedFixtures: 30, competitionPerTeamGoals: 1.4, competitionSourceIds: ['competition'], sourceConflict: false },
})

describe('derived current-season 1X2 model', () => {
  it('normalises the 0–10 score grid and derives double chance and draw-no-bet', () => { const value = derive1x2(fixture())!; expect(value.homeWin + value.draw + value.awayWin).toBeCloseTo(1, 12); expect(value.homeOrDraw).toBeCloseTo(value.homeWin + value.draw, 12); expect(value.awayOrDraw).toBeCloseTo(value.awayWin + value.draw, 12); expect(value.homeDrawNoBet).toBeCloseTo(value.homeWin / (value.homeWin + value.awayWin), 12); expect(value.awayDrawNoBet).toBeCloseTo(value.awayWin / (value.awayWin + value.homeWin), 12) })
  it('rejects missing and conflicting inputs', () => { const missing = fixture(); delete missing.derived1x2FromGoals; expect(derive1x2(missing)).toBeNull(); const conflict = fixture(); conflict.derived1x2FromGoals!.sourceConflict = true; expect(derive1x2(conflict)).toBeNull() })
  it('accepts a sourced two-match rolling input without fabricating venue evidence', () => { const value = derive1x2(fixture(2)); expect(value).not.toBeNull(); expect(value!.expectedGoals.home).toBeGreaterThanOrEqual(.2); expect(value!.expectedGoals.home).toBeLessThanOrEqual(3.5) })
})
