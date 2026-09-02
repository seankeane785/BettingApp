import { describe, expect, it } from 'vitest'
import fixtureSample from '../../samples/fixture-pack.v1.sample.json'
import researchSample from '../../samples/research-pack.v1.sample.json'
import savedRunSample from '../../samples/saved-analysis-run.v1.sample.json'
import { isAbsoluteHttpsUrl, validateFixturePack, validateResearchPack, validateSavedAnalysisRun } from './validation'
import type { FixturePack, ResearchPack } from './types'

const copy = <T>(value: T): T => structuredClone(value)
const validSourceUrls = [
  'https://www.sportsmole.co.uk/football/championship/results.html',
  'https://www.sportsmole.co.uk/football/premier-league/results.html',
  'https://www.fotmob.com/matches/wolverhampton-wanderers-vs-birmingham-city/2goyts',
  'https://www.fotmob.com/matches/everton-vs-man-united/2ynv4k',
  'https://www.fotmob.com/matches/chelsea-vs-arsenal/2rhhrp',
]

describe('browser URL runtime contract', () => {
  it('uses the browser-standard globalThis.URL constructor required by source validation', () => {
    expect(typeof globalThis.URL).toBe('function')
    const parsed = new globalThis.URL(validSourceUrls[0])
    expect(parsed.protocol).toBe('https:')
    expect(parsed.hostname).toBe('www.sportsmole.co.uk')
    expect(isAbsoluteHttpsUrl(validSourceUrls[0])).toBe(true)
  })
})

describe('FixturePack validation', () => {
  it('accepts the synthetic sample', () => expect(validateFixturePack(fixtureSample).valid).toBe(true))
  it.each(['Premier League', 'Championship'])('accepts the supported %s competition', (competition) => {
    const value = copy(fixtureSample) as unknown as Record<string, unknown>
    value.competitions = [competition]
    ;(value.fixtures as Record<string, unknown>[])[0].competition = competition
    expect(validateFixturePack(value).valid).toBe(true)
  })
  it('rejects duplicate fixtures', () => { const value = copy(fixtureSample); value.fixtures.push(copy(value.fixtures[0])); expect(validateFixturePack(value).errors.some(e => e.code === 'duplicate_id')).toBe(true) })
  it('rejects unsupported competitions', () => { const value: unknown = { ...copy(fixtureSample), competitions: ['Fantasy League'] }; expect(validateFixturePack(value).errors.some(e => e.code === 'unsupported_competition')).toBe(true) })
  it.each(['League One', 'League Two'])('rejects legacy %s fixtures with a clear compatibility error', (competition) => {
    const value = copy(fixtureSample) as unknown as Record<string, unknown>
    value.competitions = [competition]
    ;(value.fixtures as Record<string, unknown>[])[0].competition = competition
    const result = validateFixturePack(value)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.code === 'unsupported_competition' && e.message.includes('supports only Premier League and Championship'))).toBe(true)
  })
  it('accepts an empty fixture day', () => { const value = { ...copy(fixtureSample), fixtures: [] }; expect(validateFixturePack(value).valid).toBe(true) })
})

describe('ResearchPack validation', () => {
  const fixtures = fixtureSample as unknown as FixturePack
  const freshness = { referenceTimestamp: '2026-09-01T10:00:00Z', maximumAgeHours: 24 }
  const validationTime = '2026-09-01T10:10:00Z'
  it('accepts the source-backed synthetic sample with a warning', () => { const result = validateResearchPack(researchSample, fixtures, freshness, validationTime); expect(result.valid).toBe(true); expect(result.warnings.some(w => w.code === 'synthetic_data')).toBe(true) })
  it('accepts the imported NBC Sports source object while it is fresh', () => {
    const value = JSON.parse(JSON.stringify(researchSample).replaceAll('synthetic-source-1', 'src-pl-results'))
    value.generatedAt = '2026-09-02T16:38:00Z'
    value.sources[0] = {
      sourceId: 'src-pl-results',
      url: 'https://www.nbcsports.com/soccer/news/premier-league-schedule-for-2026-27-season-released',
      title: 'Premier League 2026-27 schedule and results',
      retrievedAt: '2026-09-02T16:37:20Z',
    }
    expect(validateResearchPack(value, undefined, freshness, '2026-09-02T16:40:00Z').valid).toBe(true)
  })
  it.each(['2026-09-01T09:30:00Z', '2026-09-01T09:30:00.000Z'])('accepts ISO UTC source timestamps in the %s form', (retrievedAt) => {
    const value = copy(researchSample); value.sources[0].retrievedAt = retrievedAt
    expect(validateResearchPack(value, fixtures, freshness, validationTime).valid).toBe(true)
  })
  it('accepts hyphenated source IDs', () => { const value = copy(researchSample); expect(value.sources[0].sourceId).toContain('-'); expect(validateResearchPack(value, fixtures, freshness, validationTime).valid).toBe(true) })
  it('rejects fixture mismatches', () => { const value = copy(researchSample); value.fixtures[0].homeTeam = 'Wrong Fictional Team'; expect(validateResearchPack(value, fixtures).errors.some(e => e.code === 'fixture_mismatch')).toBe(true) })
  it.each(['League One', 'League Two'])('rejects standalone legacy %s research', (competition) => {
    const value = copy(researchSample) as unknown as Record<string, unknown>
    ;(value.fixtures as Record<string, unknown>[])[0].competition = competition
    expect(validateResearchPack(value).errors.some(e => e.code === 'unsupported_competition')).toBe(true)
  })
  it('rejects missing and invalid sources with field-specific errors', () => { const missing = { ...copy(researchSample), sources: [] }; expect(validateResearchPack(missing).errors.some(e => e.code === 'missing_sources')).toBe(true); const invalid = copy(researchSample); invalid.sources[0].url = 'http://example.com'; expect(validateResearchPack(invalid).errors).toContainEqual(expect.objectContaining({ code: 'invalid_source_url', path: '$.sources[0].url' })) })
  it.each(validSourceUrls)('accepts the absolute HTTPS source URL %s', (url) => { const value = copy(researchSample); value.sources[0].url = url; expect(validateResearchPack(value).errors.filter(error => error.code === 'invalid_source_url')).toEqual([]) })
  it.each(['http://example.com', '//example.com/path', '/relative/path', 'not-a-url', '   '])('rejects the invalid source URL %s at its exact path', (url) => { const value = copy(researchSample); value.sources[0].url = url; expect(validateResearchPack(value).errors.filter(error => error.code === 'invalid_source_url')).toEqual([expect.objectContaining({ path: '$.sources[0].url' })]) })
  it('accepts an HTTPS source URL with a query and fragment', () => { const value = copy(researchSample); value.sources[0].url = 'https://stats.example.com/match-centre?id=123&view=form#results'; expect(validateResearchPack(value).errors.some(error => error.code === 'invalid_source_url')).toBe(false) })
  it('rejects a non-string source URL only at that source URL path', () => { const value = copy(researchSample) as unknown as { sources: Array<{ url: unknown }> }; value.sources[0].url = 42; expect(validateResearchPack(value).errors.filter(error => error.code === 'invalid_source_url')).toEqual([expect.objectContaining({ path: '$.sources[0].url' })]) })
  it('accepts the canonical Championship results source object', () => { const value = JSON.parse(JSON.stringify(researchSample).replaceAll('synthetic-source-1', 'src-ch-results')); value.sources[0] = { sourceId: 'src-ch-results', url: 'https://www.sportsmole.co.uk/football/championship/results.html', title: 'Championship 2026-27 Results', retrievedAt: '2026-09-02T19:20:00Z' }; value.generatedAt = '2026-09-02T19:20:00Z'; expect(validateResearchPack(value).valid).toBe(true) })
  it('rejects id with the migration message and does not treat it as a citation ID', () => { const value = copy(researchSample) as unknown as Record<string, unknown>; const sources = value.sources as Record<string, unknown>[]; sources[0].id = sources[0].sourceId; delete sources[0].sourceId; const result = validateResearchPack(value); expect(result.errors).toContainEqual(expect.objectContaining({ path: '$.sources[0].id', message: 'Source must use sourceId; id is not supported.' })); expect(result.errors.some(e => e.code === 'unknown_source_citation')).toBe(true) })
  it('rejects underscore source IDs at the exact sourceId path', () => { const value = copy(researchSample); value.sources[0].sourceId = 'src_ch_results'; expect(validateResearchPack(value).errors).toContainEqual(expect.objectContaining({ code: 'invalid_source_id', path: '$.sources[0].sourceId', message: expect.stringContaining('^[a-z0-9]+') })) })
  it('rejects prohibited content and names its category', () => { const value = copy(researchSample); value.fixtures[0].reasonsFor = ['Contains expected value']; const result = validateResearchPack(value); expect(result.errors.some(e => e.code === 'prohibited_content' && e.message.includes('expected value'))).toBe(true) })
  it('rejects a source older than 24 hours at the injected validation time', () => { const result = validateResearchPack(researchSample, fixtures, freshness, '2026-09-02T09:30:00.001Z'); expect(result.errors.some(e => e.code === 'stale_source')).toBe(true) })
  it('rejects a source later than ResearchPack generatedAt', () => { const value = copy(researchSample); value.sources[0].retrievedAt = '2026-09-01T10:05:01Z'; expect(validateResearchPack(value, fixtures, freshness, validationTime).errors.some(e => e.code === 'source_after_generated_at')).toBe(true) })
  it.each(['2026-09-01T09:30:00', '2026-02-30T09:30:00Z'])('rejects the invalid source timestamp %s', (retrievedAt) => { const value = copy(researchSample); value.sources[0].retrievedAt = retrievedAt; expect(validateResearchPack(value, fixtures, freshness, validationTime).errors.some(e => e.code === 'invalid_source_timestamp')).toBe(true) })
  it('rejects a source timestamp after the import validation time', () => { const value = copy(researchSample); value.generatedAt = '2026-09-01T10:11:00Z'; value.sources[0].retrievedAt = '2026-09-01T10:10:01Z'; expect(validateResearchPack(value, fixtures, freshness, validationTime).errors.some(e => e.code === 'future_source')).toBe(true) })
  it('rejects future-dated ResearchPack generation', () => { const value = copy(researchSample); value.generatedAt = '2026-09-01T10:10:00.001Z'; expect(validateResearchPack(value, fixtures, freshness, validationTime).errors.some(e => e.code === 'future_generated_at')).toBe(true) })
  it('requires ISO UTC timestamps for research generation and retrieval', () => { const generated = copy(researchSample); generated.generatedAt = '2026-09-01T10:05:00+01:00'; expect(validateResearchPack(generated, fixtures, freshness, validationTime).errors.some(e => e.path === '$.generatedAt' && e.code === 'invalid_timestamp')).toBe(true); const retrieved = copy(researchSample); retrieved.sources[0].retrievedAt = '2026-09-01T09:30:00+01:00'; expect(validateResearchPack(retrieved, fixtures, freshness, validationTime).errors.some(e => e.code === 'invalid_source_timestamp')).toBe(true) })
  it.each(['partial', 'insufficient'] as const)('accepts empty unavailable evidence for %s fixtures', (dataQuality) => { const value = copy(researchSample); value.fixtures[0].dataQuality = dataQuality; for (const team of [value.fixtures[0].homeEvidence, value.fixtures[0].awayEvidence]) { team.marketHitRates = []; team.optionalMetrics = {} as typeof team.optionalMetrics } expect(validateResearchPack(value, fixtures, freshness, validationTime).valid).toBe(true) })
  it('rejects invalid populated market hit-rate records', () => { const value = copy(researchSample); value.fixtures[0].homeEvidence.marketHitRates[0].sampleSize = 1.5; expect(validateResearchPack(value, fixtures, freshness, validationTime).errors.some(e => e.code === 'invalid_market_evidence')).toBe(true) })
  it('does not cascade an invalid declared source into unknown citation errors', () => { const value = copy(researchSample); value.sources[0].url = 'http://example.com'; const result = validateResearchPack(value, fixtures, freshness, validationTime); expect(result.errors.some(e => e.code === 'invalid_source_url')).toBe(true); expect(result.errors.some(e => e.code === 'unknown_source_citation')).toBe(false) })
  it('still rejects genuinely undeclared source citations', () => { const value = copy(researchSample); value.fixtures[0].homeEvidence.currentSeasonForm.sourceIds = ['not-declared']; expect(validateResearchPack(value, fixtures, freshness, validationTime).errors.some(e => e.code === 'unknown_source_citation')).toBe(true) })
})

describe('SavedAnalysisRun validation', () => {
  it('accepts the synthetic sample', () => expect(validateSavedAnalysisRun(savedRunSample).valid).toBe(true))
  it.each(['League One', 'League Two'])('rejects imported legacy %s saved-run data', (competition) => {
    const value = copy(savedRunSample) as unknown as Record<string, unknown>
    const inputs = value.analysisInputs as Record<string, Record<string, unknown>>
    inputs.fixturePack.competitions = [competition]
    ;(inputs.fixturePack.fixtures as Record<string, unknown>[])[0].competition = competition
    ;(inputs.researchPack.fixtures as Record<string, unknown>[])[0].competition = competition
    expect(validateSavedAnalysisRun(value).errors.some(e => e.code === 'unsupported_competition')).toBe(true)
  })
})

describe('ResearchPack v1.2 scoped context validation', () => {
  const pack = () => { const value = structuredClone(researchSample) as unknown as ResearchPack; value.schemaVersion = '1.2.0'; for (const key of ['teamNews','fixtureCongestion','managerialContext'] as const) Object.assign(value.fixtures[0][key], { scope: 'home', application: 'descriptive_only' }); for (const team of [value.fixtures[0].homeEvidence, value.fixtures[0].awayEvidence]) { team.currentSeasonLeagueMatches = 6; team.historicalMarketHitRates = []; team.historicalRepresentativeness = { status: 'representative', reason: 'none', sourceIds: ['synthetic-source-1'] } } return value }
  it.each([['scope', undefined, 'invalid_context_scope'], ['scope', 'match', 'invalid_context_scope'], ['application', undefined, 'invalid_context_application'], ['application', 'generic', 'invalid_context_application']] as const)('rejects invalid %s with a path-specific error', (field, invalid, code) => { const value = pack(); Object.assign(value.fixtures[0].teamNews, { [field]: invalid }); const result = validateResearchPack(value); expect(result.errors.some(e => e.code === code && e.path === `$.fixtures[0].teamNews.${field}`)).toBe(true) })
  it('rejects invalid candidate-penalty combinations and reused representativeness sources', () => { const value = pack(); Object.assign(value.fixtures[0].managerialContext, { application: 'candidate_penalty', status: 'unknown', impact: 'neutral', detail: null }); let result = validateResearchPack(value); expect(result.errors.some(e => e.code === 'invalid_candidate_penalty' && e.path === '$.fixtures[0].managerialContext')).toBe(true); Object.assign(value.fixtures[0].managerialContext, { status: 'known', impact: 'material', detail: 'Current candidate-specific impact.' }); result = validateResearchPack(value); expect(result.errors.some(e => e.code === 'reused_representativeness_evidence' && e.path.endsWith('.sourceIds'))).toBe(true) })
})
