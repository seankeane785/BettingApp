import { describe, expect, it } from 'vitest'
import fixtureSample from '../../samples/fixture-pack.v1.sample.json'
import { buildFixturePrompt, parseAndValidateFixturePack } from './fixtureWorkflow'

const criteria = { date: '2026-09-05', competitions: ['Premier League', 'League Two'] as const }

describe('fixture prompt builder', () => {
  it('is deterministic and includes explicit criteria', () => {
    const first = buildFixturePrompt({ date: criteria.date, competitions: [...criteria.competitions] })
    expect(buildFixturePrompt({ date: criteria.date, competitions: [...criteria.competitions] })).toBe(first)
    expect(first).toContain('2026-09-05')
    expect(first).toContain('Premier League, League Two')
  })
  it('includes the contract, manual Search instruction, empty-day rule, and prohibitions', () => {
    const prompt = buildFixturePrompt({ date: criteria.date, competitions: [...criteria.competitions] })
    for (const text of ['Use ChatGPT Search manually', 'FixturePack v1', 'Return only one strict JSON object', 'Europe/London', 'UTC kick-off', 'empty fixtures array', 'player data', 'odds', 'stakes', 'betting recommendations']) expect(prompt).toContain(text)
  })
  it('rejects an empty competition selection', () => expect(() => buildFixturePrompt({ date: criteria.date, competitions: [] })).toThrow('at least one'))
})

describe('pasted fixture JSON workflow', () => {
  it('accepts a valid pack and a valid empty fixture day', () => {
    expect(parseAndValidateFixturePack(JSON.stringify(fixtureSample)).valid).toBe(true)
    expect(parseAndValidateFixturePack(JSON.stringify({ ...fixtureSample, fixtures: [] })).valid).toBe(true)
  })
  it('rejects malformed JSON, Markdown fences, and invalid packs', () => {
    expect(parseAndValidateFixturePack('```json\n{}\n```').errors[0].code).toBe('invalid_json')
    expect(parseAndValidateFixturePack('{').valid).toBe(false)
    expect(parseAndValidateFixturePack(JSON.stringify({ ...fixtureSample, fixtureDate: 'wrong' })).valid).toBe(false)
  })
})
