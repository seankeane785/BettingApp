import { describe, expect, it } from 'vitest'
import fixtureSample from '../../samples/fixture-pack.v1.sample.json'
import researchSample from '../../samples/research-pack.v1.sample.json'
import savedRunSample from '../../samples/saved-analysis-run.v1.sample.json'
import { validateFixturePack, validateResearchPack, validateSavedAnalysisRun } from './validation'
import type { FixturePack } from './types'

const copy = <T>(value: T): T => structuredClone(value)

describe('FixturePack validation', () => {
  it('accepts the synthetic sample', () => expect(validateFixturePack(fixtureSample).valid).toBe(true))
  it('rejects duplicate fixtures', () => { const value = copy(fixtureSample); value.fixtures.push(copy(value.fixtures[0])); expect(validateFixturePack(value).errors.some(e => e.code === 'duplicate_id')).toBe(true) })
  it('rejects unsupported competitions', () => { const value: unknown = { ...copy(fixtureSample), competitions: ['Fantasy League'] }; expect(validateFixturePack(value).errors.some(e => e.code === 'unsupported_competition')).toBe(true) })
  it('accepts an empty fixture day', () => { const value = { ...copy(fixtureSample), fixtures: [] }; expect(validateFixturePack(value).valid).toBe(true) })
})

describe('ResearchPack validation', () => {
  const fixtures = fixtureSample as unknown as FixturePack
  it('accepts the source-backed synthetic sample with a warning', () => { const result = validateResearchPack(researchSample, fixtures, { referenceTimestamp: '2026-09-01T10:00:00Z', maximumAgeHours: 24 }); expect(result.valid).toBe(true); expect(result.warnings.some(w => w.code === 'synthetic_data')).toBe(true) })
  it('rejects fixture mismatches', () => { const value = copy(researchSample); value.fixtures[0].homeTeam = 'Wrong Fictional Team'; expect(validateResearchPack(value, fixtures).errors.some(e => e.code === 'fixture_mismatch')).toBe(true) })
  it('rejects missing and invalid sources', () => { const missing = { ...copy(researchSample), sources: [] }; expect(validateResearchPack(missing).errors.some(e => e.code === 'missing_sources')).toBe(true); const invalid = copy(researchSample); invalid.sources[0].url = 'http://example.com'; expect(validateResearchPack(invalid).errors.some(e => e.code === 'invalid_source')).toBe(true) })
  it('rejects prohibited content and names its category', () => { const value = copy(researchSample); value.fixtures[0].reasonsFor = ['Contains expected value']; const result = validateResearchPack(value); expect(result.errors.some(e => e.code === 'prohibited_content' && e.message.includes('expected value'))).toBe(true) })
  it('uses the explicit timestamp for deterministic stale-source checks', () => { const result = validateResearchPack(researchSample, fixtures, { referenceTimestamp: '2026-09-03T10:00:00Z', maximumAgeHours: 24 }); expect(result.errors.some(e => e.code === 'stale_source')).toBe(true) })
})

describe('SavedAnalysisRun validation', () => { it('accepts the synthetic sample', () => expect(validateSavedAnalysisRun(savedRunSample).valid).toBe(true)) })
