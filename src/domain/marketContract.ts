import type { CompetitionMarketBenchmark, MarketEvidence, MarketGroup, ResearchFixture, ResearchPack, TeamSide, ValidationIssue } from './types'

export type SourceRoute = 'aggregate_results_goals' | 'aggregate_corners' | 'discipline' | 'direct_specialist_match_statistics'
export type EvidenceLocation = 'candidate' | 'opponent' | 'both' | 'match'

export interface MarketSupportRule {
  marketKey: string
  marketGroup: MarketGroup
  threshold: number | null
  location: EvidenceLocation
}

export interface MarketVariantContract {
  label: string
  marketGroup: MarketGroup
  marketKey: string
  selectionLabelPattern: string
  threshold: number | null
  candidateTeamSide: readonly TeamSide[]
  support: readonly MarketSupportRule[]
  reciprocalOpponentEvidence: boolean
  venueRequired: boolean
  benchmark: { marketKey: string; marketGroup: MarketGroup; threshold: number | null }
  sourceRoute: SourceRoute
  prohibitedSubstitutions: readonly string[]
}

const common = ['proxies', 'inferred values', 'averages-only evidence', 'neutral defaults'] as const
const variant = (
  label: string, marketGroup: MarketGroup, marketKey: string, threshold: number | null,
  support: readonly MarketSupportRule[], sourceRoute: SourceRoute,
  options: Partial<Pick<MarketVariantContract, 'candidateTeamSide' | 'venueRequired' | 'selectionLabelPattern' | 'prohibitedSubstitutions'>> = {},
): MarketVariantContract => ({
  label, marketGroup, marketKey, threshold, support, sourceRoute,
  candidateTeamSide: options.candidateTeamSide ?? ['home', 'away'],
  venueRequired: options.venueRequired ?? false,
  selectionLabelPattern: options.selectionLabelPattern ?? '.+',
  reciprocalOpponentEvidence: support.some(rule => rule.location === 'opponent' || rule.location === 'both'),
  benchmark: { marketKey, marketGroup, threshold },
  prohibitedSubstitutions: options.prohibitedSubstitutions ?? common,
})
const s = (marketKey: string, marketGroup: MarketGroup, threshold: number | null, location: EvidenceLocation = 'opponent'): MarketSupportRule => ({ marketKey, marketGroup, threshold, location })

/** Sole executable ResearchPack v1.4 contract for candidate, support, venue and benchmark gates. */
export const MARKET_CONTRACT: readonly MarketVariantContract[] = [
  variant('Match result', 'match_result', 'match_result_home_win', null, [s('opponent_loses', 'match_result', null)], 'aggregate_results_goals', { candidateTeamSide: ['home'], venueRequired: true, selectionLabelPattern: '^Home win$' }),
  variant('Match result', 'match_result', 'match_result_away_win', null, [s('opponent_loses', 'match_result', null)], 'aggregate_results_goals', { candidateTeamSide: ['away'], venueRequired: true, selectionLabelPattern: '^Away win$' }),
  variant('Match result', 'match_result', 'match_result_draw', null, [s('opponent_draws', 'match_result', null)], 'aggregate_results_goals', { venueRequired: true, selectionLabelPattern: '^Draw$' }),
  variant('Double chance', 'double_chance', 'double_chance_home_or_draw', null, [s('opponent_not_win', 'double_chance', null)], 'aggregate_results_goals', { candidateTeamSide: ['home'], venueRequired: true }),
  variant('Double chance', 'double_chance', 'double_chance_away_or_draw', null, [s('opponent_not_win', 'double_chance', null)], 'aggregate_results_goals', { candidateTeamSide: ['away'], venueRequired: true }),
  variant('Draw no bet', 'draw_no_bet', 'draw_no_bet_home', null, [s('opponent_not_win_excluding_draws', 'draw_no_bet', null)], 'aggregate_results_goals', { candidateTeamSide: ['home'], venueRequired: true }),
  variant('Draw no bet', 'draw_no_bet', 'draw_no_bet_away', null, [s('opponent_not_win_excluding_draws', 'draw_no_bet', null)], 'aggregate_results_goals', { candidateTeamSide: ['away'], venueRequired: true }),
  variant('Both teams to score', 'both_teams_to_score', 'both_teams_to_score_yes', null, [s('team_scores_1_plus', 'both_teams_to_score', .5, 'candidate'), s('opponent_concedes_1_plus', 'both_teams_to_score', .5, 'candidate'), s('team_scores_1_plus', 'both_teams_to_score', .5), s('opponent_concedes_1_plus', 'both_teams_to_score', .5)], 'aggregate_results_goals', { candidateTeamSide: ['match'], prohibitedSubstitutions: [...common, 'team_to_score record'] }),
  ...[1.5, 2.5].map(threshold => variant('Total goals', 'total_goals', `total_goals_over_${String(threshold).replace('.', '_')}`, threshold, [s(`total_goals_over_${String(threshold).replace('.', '_')}_support`, 'total_goals', threshold)], 'aggregate_results_goals', { candidateTeamSide: ['match'], prohibitedSubstitutions: [...common, 'team-goal substitution', 'goals-for averages'] })),
  ...[1.5, 2.5].map(threshold => variant('Team goals', 'team_goals', `team_goals_over_${String(threshold).replace('.', '_')}`, threshold, [s(`opponent_concedes_over_${String(threshold).replace('.', '_')}`, 'team_goals', threshold)], 'aggregate_results_goals', { prohibitedSubstitutions: [...common, 'team_to_score substitution', 'never 0.5'] })),
  variant('Team to score', 'team_to_score', 'team_to_score_1_plus', .5, [s('opponent_concedes_1_plus', 'team_to_score', .5)], 'aggregate_results_goals', { prohibitedSubstitutions: [...common, 'team goals', 'BTTS'] }),
  variant('Clean sheet', 'clean_sheet', 'clean_sheet_yes', null, [s('opponent_failure_to_score', 'clean_sheet', null)], 'aggregate_results_goals'),
  ...[8.5, 9.5].map(threshold => variant('Total corners', 'total_corners', `total_corners_over_${String(threshold).replace('.', '_')}`, threshold, [s(`total_corners_over_${String(threshold).replace('.', '_')}_support`, 'total_corners', threshold)], 'aggregate_corners', { candidateTeamSide: ['match'], prohibitedSubstitutions: [...common, 'goals', 'possession', 'shots'] })),
  ...[3.5, 4.5].map(threshold => variant('Team corners', 'team_corners', `team_corners_over_${String(threshold).replace('.', '_')}`, threshold, [s(`opponent_corners_conceded_over_${String(threshold).replace('.', '_')}`, 'team_corners', threshold)], 'aggregate_corners')),
  ...[2.5, 3.5].map(threshold => variant('Total cards', 'total_cards', `total_cards_over_${String(threshold).replace('.', '_')}`, threshold, [s(`total_cards_over_${String(threshold).replace('.', '_')}_support`, 'total_cards', threshold)], 'discipline', { candidateTeamSide: ['match'], prohibitedSubstitutions: [...common, 'player-card totals', 'fouls', 'referee history'] })),
  ...[.5, 1.5].map(threshold => variant('Team cards', 'team_cards', `team_cards_over_${String(threshold).replace('.', '_')}`, threshold, [s(`opponent_cards_drawn_over_${String(threshold).replace('.', '_')}`, 'team_cards', threshold)], 'discipline', { prohibitedSubstitutions: [...common, 'player-card totals', 'fouls', 'referee history'] })),
  ...[8, 10].map(threshold => variant('Team shots', 'team_shots', `team_shots_${threshold}_plus`, threshold, [s(`opponent_shots_allowed_${threshold}_plus`, 'team_shots', threshold)], 'direct_specialist_match_statistics', { prohibitedSubstitutions: [...common, 'player totals', 'goals', 'xG', 'possession', 'narrative'] })),
  ...[3, 4].map(threshold => variant('Team shots on target', 'team_shots_on_target', `team_shots_on_target_${threshold}_plus`, threshold, [s(`opponent_shots_on_target_allowed_${threshold}_plus`, 'team_shots_on_target', threshold)], 'direct_specialist_match_statistics', { prohibitedSubstitutions: [...common, 'player totals', 'shots', 'goals', 'xG', 'possession', 'narrative'] })),
] as const

export const MARKET_FAMILY_CONTRACT = Object.freeze([...new Map(MARKET_CONTRACT.map(item => [item.marketGroup, { marketGroup: item.marketGroup, label: item.label }])).values()])
export const marketFamilyLabel = (group: MarketGroup) => MARKET_FAMILY_CONTRACT.find(item => item.marketGroup === group)!.label
export const contractForCandidate = (market: MarketEvidence) => MARKET_CONTRACT.find(item => item.marketKey === market.marketKey && item.marketGroup === market.marketGroup && item.threshold === market.threshold && item.candidateTeamSide.includes(market.teamSide))

export interface CandidatePreflightResult { path: string; contract?: MarketVariantContract; support: MarketEvidence[]; benchmark?: CompetitionMarketBenchmark; issues: ValidationIssue[] }
const requirementMessage = (market: MarketEvidence, rule: MarketSupportRule, side: string) => `Candidate ${market.marketKey}${market.threshold === null ? '' : ` at ${market.threshold}`} requires ${side} ${rule.marketKey} supporting_only evidence${rule.threshold === null ? '' : ` at ${rule.threshold}`}.`

/** Pure audit; it reports problems but never mutates or removes imported records. */
export function preflightCandidate(pack: ResearchPack, fixture: ResearchFixture, candidateArray: 'homeEvidence' | 'awayEvidence', candidateIndex: number): CandidatePreflightResult {
  const market = fixture[candidateArray].marketHitRates[candidateIndex]
  const path = `$.fixtures[${pack.fixtures.indexOf(fixture)}].${candidateArray}.marketHitRates[${candidateIndex}]`
  const issues: ValidationIssue[] = []
  const contract = contractForCandidate(market)
  if (!contract) return { path, support: [], issues: [{ code: 'unsupported_candidate_contract', path, message: `Candidate ${market.marketKey} has no exact canonical contract for group ${market.marketGroup}, side ${market.teamSide}, and threshold ${market.threshold ?? 'none'}.` }] }
  if (!new RegExp(contract.selectionLabelPattern).test(market.selectionLabel)) issues.push({ code: 'invalid_selection_label', path: `${path}.selectionLabel`, message: `Candidate ${market.marketKey} selection label does not match ${contract.selectionLabelPattern}.` })
  const own = fixture[candidateArray]
  const opponentName = candidateArray === 'homeEvidence' ? 'awayEvidence' : 'homeEvidence'
  const opponent = fixture[opponentName]
  const supports: MarketEvidence[] = []
  for (const rule of contract.support) {
    const pools = rule.location === 'candidate' ? [[candidateArray, own] as const] : rule.location === 'opponent' ? [[opponentName, opponent] as const] : [[candidateArray, own] as const, [opponentName, opponent] as const]
    const matches = pools.flatMap(([name, team]) => team.marketHitRates.filter(e => e.evidenceRole === 'supporting_only' && e.marketKey === rule.marketKey && e.marketGroup === rule.marketGroup && e.threshold === rule.threshold).map(e => ({ name, e })))
    if (rule.location === 'both' ? new Set(matches.map(x => x.name)).size < 2 : matches.length === 0) issues.push({ code: 'missing_required_support', path, message: requirementMessage(market, rule, rule.location === 'candidate' ? candidateArray.replace('Evidence', '') : rule.location === 'opponent' ? opponentName.replace('Evidence', '') : 'both teams') })
    supports.push(...matches.map(x => x.e))
  }
  if (contract.venueRequired && (!market.venueSampleSize || market.venueHits === null)) issues.push({ code: 'missing_venue_requirement', path, message: `Candidate ${market.marketKey} requires a relevant ${candidateArray === 'homeEvidence' ? 'home' : 'away'} venue record.` })
  const benchmark = pack.competitionBenchmarks?.find(item => item.competition === fixture.competition)?.marketBenchmarks.find(item => item.marketKey === contract.benchmark.marketKey && item.marketGroup === contract.benchmark.marketGroup && item.threshold === contract.benchmark.threshold)
  if (!benchmark) issues.push({ code: 'missing_matching_benchmark', path, message: `Candidate ${market.marketKey} requires competition benchmark ${contract.benchmark.marketKey} in ${contract.benchmark.marketGroup} at threshold ${contract.benchmark.threshold ?? 'none'}.` })
  const conflicting = [...own.marketHitRates, ...opponent.marketHitRates].some(e => e !== market && e.marketKey === market.marketKey && (e.marketGroup !== market.marketGroup || e.threshold !== market.threshold))
  if (conflicting) issues.push({ code: 'source_conflict', path, message: `Candidate ${market.marketKey} conflicts with another record's market group or threshold.` })
  return { path, contract, support: [...new Set(supports)], benchmark, issues }
}
