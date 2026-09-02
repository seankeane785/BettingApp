import { describe, expect, it } from 'vitest'
import fixtureSample from '../../samples/fixture-pack.v1.sample.json'
import researchSample from '../../samples/research-pack.v1.sample.json'
import savedRunSample from '../../samples/saved-analysis-run.v1.sample.json'
import { validateFixturePack, validateResearchPack, validateSavedAnalysisRun } from './validation'
import type { FixturePack } from './types'

const copy = <T>(value: T): T => structuredClone(value)

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
  it('rejects fixture mismatches', () => { const value = copy(researchSample); value.fixtures[0].homeTeam = 'Wrong Fictional Team'; expect(validateResearchPack(value, fixtures).errors.some(e => e.code === 'fixture_mismatch')).toBe(true) })
  it.each(['League One', 'League Two'])('rejects standalone legacy %s research', (competition) => {
    const value = copy(researchSample) as unknown as Record<string, unknown>
    ;(value.fixtures as Record<string, unknown>[])[0].competition = competition
    expect(validateResearchPack(value).errors.some(e => e.code === 'unsupported_competition')).toBe(true)
  })
  it('rejects missing and invalid sources', () => { const missing = { ...copy(researchSample), sources: [] }; expect(validateResearchPack(missing).errors.some(e => e.code === 'missing_sources')).toBe(true); const invalid = copy(researchSample); invalid.sources[0].url = 'http://example.com'; expect(validateResearchPack(invalid).errors.some(e => e.code === 'invalid_source')).toBe(true) })
  it('rejects prohibited content and names its category', () => { const value = copy(researchSample); value.fixtures[0].reasonsFor = ['Contains expected value']; const result = validateResearchPack(value); expect(result.errors.some(e => e.code === 'prohibited_content' && e.message.includes('expected value'))).toBe(true) })
  it('rejects a source older than 24 hours at the injected validation time', () => { const result = validateResearchPack(researchSample, fixtures, freshness, '2026-09-02T09:30:00.001Z'); expect(result.errors.some(e => e.code === 'stale_source')).toBe(true) })
  it('rejects a source later than ResearchPack generatedAt', () => { const value = copy(researchSample); value.sources[0].retrievedAt = '2026-09-01T10:05:01Z'; expect(validateResearchPack(value, fixtures, freshness, validationTime).errors.some(e => e.code === 'source_after_generated_at')).toBe(true) })
  it('rejects future-dated ResearchPack generation', () => { const value = copy(researchSample); value.generatedAt = '2026-09-01T10:10:00.001Z'; expect(validateResearchPack(value, fixtures, freshness, validationTime).errors.some(e => e.code === 'future_generated_at')).toBe(true) })
  it('requires ISO UTC timestamps for research generation and retrieval', () => { const generated = copy(researchSample); generated.generatedAt = '2026-09-01T10:05:00+01:00'; expect(validateResearchPack(generated, fixtures, freshness, validationTime).errors.some(e => e.path === '$.generatedAt' && e.code === 'invalid_timestamp')).toBe(true); const retrieved = copy(researchSample); retrieved.sources[0].retrievedAt = '2026-09-01T09:30:00+01:00'; expect(validateResearchPack(retrieved, fixtures, freshness, validationTime).errors.some(e => e.code === 'invalid_source')).toBe(true) })
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
