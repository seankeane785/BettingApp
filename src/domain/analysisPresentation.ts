import type { AnalysisOutput, BuilderOutcome, BuilderSuccess, CandidateSelection, Confidence, EvidenceUseTrace, FixturePack, MarketCoverage } from './types'

export const SETTLEMENT_STATEMENT = 'Verify market availability and settlement rules in Paddy Power before placing.'
export const NO_BUILDER_STATEMENT = 'No qualifying builder today'
export const CONFIDENCE_ORDER: Confidence[] = ['Strong', 'Good', 'Moderate', 'Avoid']

export interface CandidateFixtureGroup { fixtureId: string; homeTeam: string; awayTeam: string; candidates: CandidateSelection[] }

export function groupCandidatesByFixture(candidates: CandidateSelection[]): CandidateFixtureGroup[] {
  const groups = new Map<string, CandidateFixtureGroup>()
  for (const candidate of candidates) {
    const group = groups.get(candidate.fixtureId) ?? { fixtureId: candidate.fixtureId, homeTeam: candidate.homeTeam, awayTeam: candidate.awayTeam, candidates: [] }
    group.candidates.push(candidate)
    groups.set(candidate.fixtureId, group)
  }
  return [...groups.values()].map(group => ({ ...group, candidates: [...group.candidates].sort((a, b) => a.id.localeCompare(b.id)) }))
}

export function formatManualEntryList(builder: BuilderSuccess, fixturePack: FixturePack): string {
  const fixtures = new Map(fixturePack.fixtures.map(fixture => [fixture.fixtureId, fixture]))
  const lines = ['Manual Paddy Power entry list', 'Manual verification required', SETTLEMENT_STATEMENT, '']
  for (const group of builder.fixtureGroups) {
    const fixture = fixtures.get(group.fixtureId)
    if (!fixture) continue
    lines.push(`${fixture.competition} | ${fixture.kickOff.localDate} ${fixture.kickOff.localTime} ${fixture.kickOff.timezone}`)
    lines.push(`${fixture.homeTeam} v ${fixture.awayTeam}`)
    const selections = group.candidateIds.map(id => builder.selectedLegs.find(leg => leg.id === id)).filter((leg): leg is CandidateSelection => Boolean(leg))
    for (const selection of selections) lines.push(`- ${selection.selectionLabel}`)
    lines.push('')
  }
  return lines.join('\n').trimEnd()
}

export function noBuilderDisplay(outcome: BuilderOutcome): { title: string; reason: string } | null {
  return outcome.status === 'no_qualifying_builder' ? { title: NO_BUILDER_STATEMENT, reason: outcome.reason } : null
}

export const isExcludedFromBuilders = (candidate: CandidateSelection) => candidate.confidence === 'Moderate' || candidate.confidence === 'Avoid'

export function invalidateAnalysis(current: AnalysisOutput | null): null { void current; return null }

export function evidenceTraceLabels(trace?: EvidenceUseTrace): string[] {
  if (!trace) return []
  const values: [string, string | null][] = [['Candidate record', trace.candidate], ['Opponent support', trace.opponent], ['Competition benchmark', trace.benchmark], ['Relevant venue record', trace.venue], ['Scoped context penalty', trace.context]]
  return values.filter(([, value]) => typeof value === 'string' && value.trim().length > 0).map(([label, value]) => `${label}: ${value!.trim()}`)
}

/** Presentation-only wording: counts and availability decisions are model output. */
export const marketCoverageLabel = (coverage: MarketCoverage): string =>
  coverage.status === 'analysed' ? 'Available for analysis.' : coverage.unavailableReason ?? 'Unavailable: required evidence was not supplied.'
