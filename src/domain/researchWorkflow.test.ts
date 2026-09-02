import { describe, expect, it } from 'vitest'
import fixtureSample from '../../samples/fixture-pack.v1.sample.json'
import researchSample from '../../samples/research-pack.v1.sample.json'
import type { FixturePack } from './types'
import { buildResearchPrompt, getResearchGate, parseAndValidateResearchPack } from './researchWorkflow'

const synthetic = fixtureSample as unknown as FixturePack
const real = structuredClone(synthetic)
real.fixtures[0].fixtureId = 'championship-001'; real.fixtures[0].homeTeam = 'Northbridge Rovers'; real.fixtures[0].awayTeam = 'Eastmere Athletic'
const settings = { referenceTimestamp: '2026-09-01T10:00:00Z', maximumAgeHours: 24 }
const validationTime = '2026-09-01T10:10:00Z'

describe('research workflow', () => {
  it('gates missing, empty, and synthetic fixture packs', () => { expect(getResearchGate()).toBe('missing'); expect(getResearchGate({ ...real, fixtures: [] })).toBe('empty'); expect(getResearchGate(synthetic)).toBe('synthetic'); expect(getResearchGate(real)).toBe('ready') })
  it('builds deterministic, self-contained prompts containing exact fixtures and the full research contract', () => { const one = buildResearchPrompt(real, settings); expect(buildResearchPrompt(real, settings)).toBe(one); for (const text of ['"fixtureId": "championship-001"', '"kickOff"', 'ResearchPack v1 complete output contract', '"schemaVersion": "1.0.0"', 'TEAM_EVIDENCE', 'CONTEXT_EVIDENCE', 'last 5 and last 10', 'home/away records', 'goals scored and conceded', 'market hit rates', 'shots on target', 'corners and cards', 'opponent strength', 'credible team news', 'fixture congestion', 'managerial changes', 'sourced xG', 'HTTPS source URL', 'ending in Z, with optional fractional seconds', 'marketHitRates may be []', 'optionalMetrics may be {}', 'actual UTC time', 'no later than ResearchPack.generatedAt', 'within 24 hours of import/validation', 'Current-season evidence takes priority', 'Never invent, estimate', 'Include every supplied fixture', 'odds; bookmaker prices; implied probability', 'player-specific markets', 'tipster opinions', 'no prose, commentary, or Markdown fences']) expect(one).toContain(text); expect(one).not.toContain(settings.referenceTimestamp); expect(one).not.toContain('Deterministic freshness reference timestamp') })
  it('accepts valid cross-referenced real research retrieved after prompt generation', () => { const value = structuredClone(researchSample); value.dataStatus = 'real'; value.generatedAt = '2026-09-01T10:05:00Z'; value.sources[0].retrievedAt = '2026-09-01T10:03:00Z'; value.fixtures[0].fixtureId = real.fixtures[0].fixtureId; value.fixtures[0].homeTeam = real.fixtures[0].homeTeam; value.fixtures[0].awayTeam = real.fixtures[0].awayTeam; expect(parseAndValidateResearchPack(JSON.stringify(value), real, settings, validationTime).valid).toBe(true) })
  it('rejects wrappers', () => { expect(parseAndValidateResearchPack('```json\n{}\n```', real, settings, validationTime).errors[0].code).toBe('wrapped_json') })
})
