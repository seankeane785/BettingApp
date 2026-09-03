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
  it('builds deterministic current-only v1.4 prompts', () => { const one = buildResearchPrompt(real, settings); expect(buildResearchPrompt(real, settings)).toBe(one); for (const text of ['"fixtureId": "championship-001"', 'schemaVersion "1.4.0"', 'competitionBenchmarks', 'candidate_penalty', 'descriptive_only', 'currentSeasonLeagueMatches', 'shotsOnTarget', 'current-season league fixtures', 'Every populated item requires declared sourceIds', 'Do not include historicalMarketHitRates', 'match result; double chance; draw no bet; both teams to score; total goals; team goals; team to score; clean sheet; total corners; team corners; total cards; team cards; team shots; team shots on target', 'every completed league match', 'official competition match centres', 'mandatory relevant supporting_only', 'required candidate evidence, support evidence, venue evidence, or benchmark', 'total/team corners', 'total/team cards', 'team shots on target', 'player markets', '"url":"https:\\u002F\\u002Fwww.example.com\\u002Fpath"', 'Never emit a Markdown-link source value']) expect(one).toContain(text); expect(one).not.toContain(settings.referenceTimestamp) })
  it('accepts valid cross-referenced real research retrieved after prompt generation', () => { const value = structuredClone(researchSample); value.dataStatus = 'real'; value.generatedAt = '2026-09-01T10:05:00Z'; value.sources[0].retrievedAt = '2026-09-01T10:03:00Z'; value.fixtures[0].fixtureId = real.fixtures[0].fixtureId; value.fixtures[0].homeTeam = real.fixtures[0].homeTeam; value.fixtures[0].awayTeam = real.fixtures[0].awayTeam; expect(parseAndValidateResearchPack(JSON.stringify(value), real, settings, validationTime).valid).toBe(true) })
  it('rejects wrappers', () => { expect(parseAndValidateResearchPack('```json\n{}\n```', real, settings, validationTime).errors[0].code).toBe('wrapped_json') })
})
