import { describe, expect, it } from 'vitest'
import { analyse, defaultModelSettings } from './analysisModel'
import rawImportFixture from '../fixtures/analysis-pack-import-regression.json?raw'
import { buildAnalysisPackPrompt, importAnalysisPack, parseAndValidateAnalysisPack } from './analysisWorkflow'
import type { AnalysisPack } from './types'
import { validateAnalysisPack } from './validation'

const pack = (): AnalysisPack => {
  const sourceIds = ['league-source']
  const form = { summary: 'Current', lastFive: null, lastTen: null, homeOrAway: '1/1', goalsScored: 1, goalsConceded: 0, sourceIds }
  const context = { status: 'unknown' as const, impact: 'unknown' as const, scope: 'both' as const, application: 'descriptive_only' as const, detail: null, sourceIds }
  return { packName: 'AnalysisPack v1', schemaVersion: '1.0.0', generatedAt: '2026-09-02T10:00:00Z', fixturePack: { packName: 'FixturePack v1', schemaVersion: '1.0.0', fixtureDate: '2026-09-03', generatedAt: '2026-09-02T10:00:00Z', competitions: ['Premier League'], fixtures: [{ fixtureId: 'fixture-1', competition: 'Premier League', homeTeam: 'Home', awayTeam: 'Away', kickOff: { utc: '2026-09-03T14:00:00Z', localDate: '2026-09-03', localTime: '15:00', timezone: 'Europe/London' } }] }, researchPack: { packName: 'ResearchPack v1', schemaVersion: '1.4.0', fixturePackRef: { schemaVersion: '1.0.0', fixtureDate: '2026-09-03' }, generatedAt: '2026-09-02T10:00:00Z', dataStatus: 'real', sources: [{ sourceId: 'league-source', url: 'https://example.com/source', title: 'League source', retrievedAt: '2026-09-02T09:00:00Z' }], competitionBenchmarks: [{ competition: 'Premier League', currentSeasonCompletedFixtures: 10, marketBenchmarks: [{ marketKey: 'result-home', marketGroup: 'match_result', selectionLabel: 'Home', threshold: null, sampleSize: 10, hits: 6, supportPercent: 60, sourceIds }], optionalMetrics: {} }], fixtures: [{ fixtureId: 'fixture-1', competition: 'Premier League', homeTeam: 'Home', awayTeam: 'Away', homeEvidence: { currentSeasonLeagueMatches: 1, currentSeasonForm: form, marketHitRates: [], optionalMetrics: {} }, awayEvidence: { currentSeasonLeagueMatches: 1, currentSeasonForm: form, marketHitRates: [], optionalMetrics: {} }, opponentStrength: context, teamNews: context, fixtureCongestion: context, managerialContext: context, reasonsFor: [], reasonsAgainst: [], dataQuality: 'insufficient' }] } }
}
const freshness = { referenceTimestamp: '2026-09-02T10:00:00Z', maximumAgeHours: 24 }
const sourceUrls = [
  'https://www.sportsmole.co.uk/football/championship/results.html',
  'https://www.sportsmole.co.uk/football/premier-league/results.html',
  'https://www.fotmob.com/matches/wolverhampton-wanderers-vs-birmingham-city/2goyts',
  'https://www.fotmob.com/matches/everton-vs-man-united/2ynv4k',
  'https://www.fotmob.com/matches/chelsea-vs-arsenal/2rhhrp',
]
describe('AnalysisPack workflow', () => {
  it('validates one import and feeds the existing pipeline', () => { const result = parseAndValidateAnalysisPack(JSON.stringify(pack()), freshness, freshness.referenceTimestamp); expect(result.valid).toBe(true); expect(analyse(result.data!.fixturePack, result.data!.researchPack, defaultModelSettings(freshness.referenceTimestamp, 24))).toBeDefined() })
  it('imports multiple canonical sourceId objects and resolves citations against them', () => { const p = pack(); p.researchPack.sources.push({ sourceId: 'official-match-centre', url: 'https://example.com/match-centre', title: 'Official match centre', retrievedAt: '2026-09-02T09:30:00Z' }); p.researchPack.fixtures[0].homeEvidence.currentSeasonForm.sourceIds = ['official-match-centre']; expect(parseAndValidateAnalysisPack(JSON.stringify(p), freshness, freshness.referenceTimestamp).valid).toBe(true) })
  it('imports all reported source URLs unchanged through the App workflow and reaches analysis', () => { const p = pack(); p.researchPack.sources = sourceUrls.map((url, index) => ({ sourceId: `source-${index + 1}`, url, title: `Source ${index + 1}`, retrievedAt: '2026-09-02T09:00:00Z' })); const sourceIds = p.researchPack.sources.map(source => source.sourceId); p.researchPack.fixtures[0].homeEvidence.currentSeasonForm.sourceIds = sourceIds; p.researchPack.fixtures[0].awayEvidence.currentSeasonForm.sourceIds = sourceIds; p.researchPack.fixtures[0].opponentStrength.sourceIds = sourceIds; p.researchPack.fixtures[0].teamNews.sourceIds = sourceIds; p.researchPack.fixtures[0].fixtureCongestion.sourceIds = sourceIds; p.researchPack.fixtures[0].managerialContext.sourceIds = sourceIds; p.researchPack.competitionBenchmarks![0].marketBenchmarks[0].sourceIds = sourceIds; const result = parseAndValidateAnalysisPack(JSON.stringify(p), freshness, freshness.referenceTimestamp); expect(result.valid).toBe(true); expect(result.data!.researchPack.sources.map(source => typeof source.url)).toEqual(sourceUrls.map(() => 'string')); expect(result.data!.researchPack.sources.map(source => source.url)).toEqual(sourceUrls); expect(analyse(result.data!.fixturePack, result.data!.researchPack, defaultModelSettings(freshness.referenceTimestamp, 24))).toBeDefined() })
  it('rejects a malformed first source at the App workflow nested path', () => { const p = pack(); p.researchPack.sources[0].url = 'not-a-url'; expect(parseAndValidateAnalysisPack(JSON.stringify(p), freshness, freshness.referenceTimestamp).errors.filter(error => error.code === 'invalid_source_url')).toEqual([expect.objectContaining({ path: '$.researchPack.sources[0].url' })]) })
  it.each([
    ['reference', (p: AnalysisPack) => { p.researchPack.fixturePackRef.fixtureDate = '2026-09-04' }, 'fixture_pack_ref_mismatch'],
    ['missing', (p: AnalysisPack) => { p.researchPack.fixtures = [] }, 'missing_fixture'],
    ['unexpected', (p: AnalysisPack) => { p.researchPack.fixtures.push({ ...p.researchPack.fixtures[0], fixtureId: 'extra' }) }, 'unexpected_fixture'],
    ['duplicate', (p: AnalysisPack) => { p.fixturePack.fixtures.push(structuredClone(p.fixturePack.fixtures[0])) }, 'duplicate_id'],
  ])('rejects %s fixture integrity errors', (_, mutate, code) => { const p = pack(); mutate(p); const result = parseAndValidateAnalysisPack(JSON.stringify(p), freshness, freshness.referenceTimestamp); expect(result.errors.some(e => e.code === code && e.path.startsWith('$.'))).toBe(true) })
  it('requires kebab-case source IDs with a nested path', () => { const p = pack(); p.researchPack.sources[0].sourceId = 'league_source'; const result = parseAndValidateAnalysisPack(JSON.stringify(p), freshness, freshness.referenceTimestamp); expect(result.errors).toContainEqual(expect.objectContaining({ code: 'invalid_source_id', path: '$.researchPack.sources[0].sourceId' })) })
  it('requests the exact source contract and prioritises every specialist evidence family', () => { const prompt = buildAnalysisPackPrompt('2026-09-03', ['Premier League']); for (const phrase of ['FIXTURE DISCOVERY', '"sourceId": "non-empty kebab-case string"', '"url": "absolute HTTPS URL with a hostname"', 'do not use a domain allowlist', '"retrievedAt": "ISO 8601 UTC timestamp ending in Z"', 'src-ch-results', 'Match result', 'double chance', 'draw-no-bet', 'BTTS', 'Total goals', 'Team goals', 'Clean sheets', 'Total and team corners', 'Total and team cards', 'Team shots:', 'Team shots on target:', 'supporting_only', 'candidate_market', 'official competition match centres', 'Manual market-availability dropdowns']) expect(prompt).toContain(phrase) })
})

describe('raw AnalysisPack browser import regression', () => {
  const expectedUrls = sourceUrls
  const expectedIds = ['src-championship-results', 'src-premier-league-results', 'src-wolves-birmingham-fixture', 'src-everton-united-fixture', 'src-chelsea-arsenal-fixture']

  it('uses the browser import handler without changing any parsed value before validation', () => {
    const expected = JSON.parse(rawImportFixture)
    const imported = importAnalysisPack(rawImportFixture, freshness, freshness.referenceTimestamp)

    expect(imported.validation.valid).toBe(true)
    expect(imported.validation.data).toEqual(expected)
    expect(JSON.stringify(imported.validation.data)).toBe(JSON.stringify(expected))
    expect(imported.researchPack?.sources.map(source => source.url)).toEqual(expectedUrls)
    expect(imported.researchPack?.sources.map(source => source.sourceId)).toEqual(expectedIds)
    expect(imported.researchPack?.fixtures[0].homeEvidence.currentSeasonForm.sourceIds).toContain('src-everton-united-fixture')
    expect(JSON.stringify(imported.validation.data)).not.toContain('src-everton-un-everton-united-fixture')
  })

  it('passes a complex source URL to the URL helper byte-for-byte unchanged', () => {
    const originalUrl = 'https://scores.example-domain.test/team-path/match-centre?tab=team-form&round=4#match-details'
    const value = pack()
    value.researchPack.sources[0].url = originalUrl
    let receivedUrl: unknown
    const observingValidator: typeof validateAnalysisPack = (parsed, options, validationTime) => {
      receivedUrl = (parsed as AnalysisPack).researchPack.sources[0].url
      expect(receivedUrl).toBe(originalUrl)
      return validateAnalysisPack(parsed, options, validationTime)
    }

    const imported = importAnalysisPack(`\n${JSON.stringify(value)}\n`, freshness, freshness.referenceTimestamp, observingValidator)

    expect(imported.validation.valid).toBe(true)
    expect(receivedUrl).toBe(originalUrl)
  })

  it('preserves the reported literal source immediately before validation in the App handler', () => {
    const literalSource = {
      sourceId: 'src-everton-united-fixture',
      url: 'https://www.fotmob.com/matches/everton-vs-man-united/2ynv4k',
      title: 'Everton vs Manchester United',
      retrievedAt: '2026-09-02T20:15:00Z',
    }
    const value = pack()
    value.generatedAt = '2026-09-02T20:15:00Z'
    value.fixturePack.generatedAt = '2026-09-02T20:15:00Z'
    value.researchPack.generatedAt = '2026-09-02T20:15:00Z'
    value.researchPack.sources[0] = literalSource
    const raw = JSON.stringify(value)
    let receivedSource: unknown
    const observingValidator: typeof validateAnalysisPack = (parsed, options, validationTime) => {
      receivedSource = (parsed as AnalysisPack).researchPack.sources[0]
      expect((receivedSource as typeof literalSource).sourceId).toBe(literalSource.sourceId)
      expect((receivedSource as typeof literalSource).url).toBe(literalSource.url)
      return validateAnalysisPack(parsed, options, validationTime)
    }

    importAnalysisPack(raw, freshness, '2026-09-02T20:15:00Z', observingValidator)

    expect(receivedSource).toEqual(literalSource)
  })

  it('hands the validated raw fixture to the existing analysis pipeline', () => {
    const imported = importAnalysisPack(rawImportFixture, freshness, freshness.referenceTimestamp)
    expect(imported.fixturePack).toBe(imported.validation.data?.fixturePack)
    expect(imported.researchPack).toBe(imported.validation.data?.researchPack)
    expect(analyse(imported.fixturePack!, imported.researchPack!, defaultModelSettings(freshness.referenceTimestamp, 24))).toBeDefined()
  })

  it('reports a malformed raw source URL at its exact nested path', () => {
    const malformed = rawImportFixture.replace(expectedUrls[0], 'not-a-url')
    const result = importAnalysisPack(malformed, freshness, freshness.referenceTimestamp).validation
    expect(result.errors.filter(error => error.code === 'invalid_source_url')).toEqual([expect.objectContaining({
      path: '$.researchPack.sources[0].url',
      message: expect.stringContaining('Received value: "not-a-url" | type: string | length: 9 | code points: U+006E U+006F U+0074 U+002D U+0061 U+002D U+0075 U+0072 U+006C'),
    })])
  })

  it('reports an unknown citation only when that exact unknown value is in the raw JSON', () => {
    const unknownId = 'src-genuinely-unknown-citation'
    const changed = rawImportFixture.replace('"sourceIds": [\n              "src-championship-results"', `"sourceIds": [\n              "${unknownId}"`)
    expect(changed).toContain(unknownId)
    const result = importAnalysisPack(changed, freshness, freshness.referenceTimestamp).validation
    expect(result.errors.filter(error => error.code === 'unknown_source_citation')).toEqual([
      expect.objectContaining({ message: `Unknown source ID: ${unknownId}.` }),
    ])
    expect(importAnalysisPack(rawImportFixture, freshness, freshness.referenceTimestamp).validation.errors.some(error => error.code === 'unknown_source_citation')).toBe(false)
  })
})
