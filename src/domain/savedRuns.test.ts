import { describe, expect, it } from 'vitest'
import fixtureJson from '../../samples/fixture-pack.v1.sample.json'
import researchJson from '../../samples/research-pack.v1.sample.json'
import savedJson from '../../samples/saved-analysis-run.v1.sample.json'
import { analyse, defaultModelSettings } from './analysisModel'
import { createSavedRun, importSavedRun, recordOutcome, SavedRunRepository, SAVED_RUNS_STORAGE_KEY, serializeSavedRun, type StorageAdapter } from './savedRuns'
import type { FixturePack, ResearchPack, SavedAnalysisRun } from './types'

class MemoryStorage implements StorageAdapter { values = new Map<string, string>(); getItem(key: string) { return this.values.get(key) ?? null } setItem(key: string, value: string) { this.values.set(key, value) } }
const fixture = fixtureJson as unknown as FixturePack
const research = researchJson as unknown as ResearchPack
const make = () => { const result = createSavedRun(fixture, research, analyse(fixture, research, defaultModelSettings('2026-09-01T10:10:00Z', 48)), 'run-001', '2026-09-01T10:10:00Z'); if (!result.ok) throw new Error('test run invalid'); return result.value }

describe('saved analysis runs', () => {
  it('creates a complete immutable snapshot from analysis', () => { const run = make(); expect(run.analysisInputs.fixturePack).toEqual(fixture); expect(run.candidates).toBeDefined(); expect(run.builders.highProbability.kind).toBe('high_probability'); expect(run.settings.deterministic).toBe(true); expect(run.results.builders.balanced.outcome).toBe('pending') })
  it('validates before save and load', () => { const storage = new MemoryStorage(); const repo = new SavedRunRepository(storage); expect(repo.save({ ...make(), modelVersion: '' }).ok).toBe(false); expect(repo.save(make()).ok).toBe(true); expect(repo.load('run-001')).toEqual(expect.objectContaining({ ok: true })); storage.values.set(SAVED_RUNS_STORAGE_KEY, JSON.stringify([{ ...make(), schemaVersion: '2.0.0' }])); expect(repo.list()).toEqual(expect.objectContaining({ ok: false, category: 'invalid' })) })
  it('supports save, sorted list and load with an in-memory adapter', () => { const repo = new SavedRunRepository(new MemoryStorage()); expect(repo.save(make()).ok).toBe(true); const later = { ...make(), runId: 'run-002', createdAt: '2026-09-02T10:10:00Z' }; expect(repo.save(later).ok).toBe(true); const listed = repo.list(); expect(listed.ok && listed.value.map(run => run.runId)).toEqual(['run-002', 'run-001']); expect(repo.load('run-001').ok).toBe(true) })
  it('reports malformed storage without overwriting it', () => { const storage = new MemoryStorage(); storage.values.set(SAVED_RUNS_STORAGE_KEY, '{bad'); const repo = new SavedRunRepository(storage); expect(repo.list()).toEqual(expect.objectContaining({ ok: false, category: 'invalid' })); expect(storage.values.get(SAVED_RUNS_STORAGE_KEY)).toBe('{bad') })
  it.each(['League One', 'League Two'])('rejects restored legacy %s storage without deleting it', (competition) => {
    const storage = new MemoryStorage(); const legacy = structuredClone(make()) as unknown as Record<string, unknown>; const inputs = legacy.analysisInputs as Record<string, Record<string, unknown>>
    inputs.fixturePack.competitions = [competition]; (inputs.fixturePack.fixtures as Record<string, unknown>[])[0].competition = competition; (inputs.researchPack.fixtures as Record<string, unknown>[])[0].competition = competition
    const original = JSON.stringify([legacy]); storage.values.set(SAVED_RUNS_STORAGE_KEY, original)
    const result = new SavedRunRepository(storage).list()
    expect(result.ok).toBe(false); expect(!result.ok && result.issues.some(issue => issue.code === 'unsupported_competition')).toBe(true); expect(storage.values.get(SAVED_RUNS_STORAGE_KEY)).toBe(original)
    const imported = importSavedRun(JSON.stringify(legacy), new SavedRunRepository(new MemoryStorage()))
    expect(imported.ok).toBe(false); expect(!imported.ok && imported.issues.some(issue => issue.code === 'unsupported_competition')).toBe(true)
  })
  it('rejects duplicate saves and duplicate imports', () => { const repo = new SavedRunRepository(new MemoryStorage()); const real = { ...make(), dataStatus: 'real' as const, analysisInputs: { ...make().analysisInputs, researchPack: { ...research, dataStatus: 'real' as const } } }; expect(repo.save(real).ok).toBe(true); expect(repo.save(real)).toEqual(expect.objectContaining({ ok: false, category: 'duplicate' })); expect(importSavedRun(JSON.stringify(real), repo)).toEqual(expect.objectContaining({ ok: false, category: 'duplicate' })) })
  it('produces a complete deterministic export and stable filename', () => { const run = make(); const first = serializeSavedRun(run); const second = serializeSavedRun(run); expect(first).toEqual(second); expect(first.ok && first.value.filename).toBe('formfirst-2026-09-05-run-001.json'); expect(first.ok && JSON.parse(first.value.json)).toEqual(run) })
  it('rejects malformed, unsupported and synthetic imports', () => { const repo = new SavedRunRepository(new MemoryStorage()); expect(importSavedRun('{', repo).ok).toBe(false); expect(importSavedRun(JSON.stringify({ ...make(), schemaVersion: '2.0.0' }), repo).ok).toBe(false); expect(importSavedRun(JSON.stringify(make()), repo).ok).toBe(false) })
  it('records builder and leg outcomes without mutating model output', () => { const run = make(); const model = JSON.stringify({ candidates: run.candidates, builders: run.builders }); const builder = recordOutcome(run, { type: 'builder', id: 'balanced' }, 'won', '2026-09-02T12:00:00Z'); expect(builder.ok && builder.value.results.builders.balanced.outcome).toBe('won'); expect(JSON.stringify({ candidates: run.candidates, builders: run.builders })).toBe(model); expect(run.results.builders.balanced.outcome).toBe('pending') })
  it('round trips the complete record through export and import', () => { const source = savedJson as unknown as SavedAnalysisRun; const real = { ...source, runId: 'round-trip', dataStatus: 'real' as const, analysisInputs: { ...source.analysisInputs, researchPack: { ...source.analysisInputs.researchPack, dataStatus: 'real' as const } } }; const exported = serializeSavedRun(real); const repo = new SavedRunRepository(new MemoryStorage()); expect(exported.ok).toBe(true); const imported = importSavedRun(exported.ok ? exported.value.json : '', repo); expect(imported.ok && imported.value).toEqual(real) })
})
