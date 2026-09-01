import { describe, expect, it } from 'vitest'
import fixtureSample from '../../samples/fixture-pack.v1.sample.json'
import researchSample from '../../samples/research-pack.v1.sample.json'
import type { FixturePack } from './types'
import { buildResearchPrompt, getResearchGate, parseAndValidateResearchPack } from './researchWorkflow'

const synthetic = fixtureSample as unknown as FixturePack
const real = structuredClone(synthetic)
real.fixtures[0].fixtureId = 'league-one-001'; real.fixtures[0].homeTeam = 'Northbridge Rovers'; real.fixtures[0].awayTeam = 'Eastmere Athletic'
const settings = { referenceTimestamp: '2026-09-01T10:00:00Z', maximumAgeHours: 24 }

describe('research workflow', () => {
  it('gates missing, empty, and synthetic fixture packs', () => { expect(getResearchGate()).toBe('missing'); expect(getResearchGate({ ...real, fixtures: [] })).toBe('empty'); expect(getResearchGate(synthetic)).toBe('synthetic'); expect(getResearchGate(real)).toBe('ready') })
  it('builds deterministic prompts containing exact fixtures and instructions', () => { const one = buildResearchPrompt(real, settings); expect(buildResearchPrompt(real, settings)).toBe(one); expect(one).toContain('"fixtureId": "league-one-001"'); expect(one).toContain('"kickOff"'); expect(one).toContain('HTTPS source URL'); expect(one).toContain('last five and last ten'); expect(one).toContain('Do not include odds, prices, implied probability') })
  it('accepts valid cross-referenced real research', () => { const value = structuredClone(researchSample); value.dataStatus = 'real'; value.fixtures[0].fixtureId = real.fixtures[0].fixtureId; value.fixtures[0].homeTeam = real.fixtures[0].homeTeam; value.fixtures[0].awayTeam = real.fixtures[0].awayTeam; expect(parseAndValidateResearchPack(JSON.stringify(value), real, settings).valid).toBe(true) })
  it('rejects wrappers and future sources', () => { expect(parseAndValidateResearchPack('```json\n{}\n```', real, settings).errors[0].code).toBe('wrapped_json'); const value = structuredClone(researchSample); value.sources[0].retrievedAt = '2026-09-01T11:00:00Z'; expect(parseAndValidateResearchPack(JSON.stringify(value), synthetic, settings).errors.some(e => e.code === 'future_source')).toBe(true) })
})
