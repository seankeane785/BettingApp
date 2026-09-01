import type { AnalysisOutput, BuilderKind, FixturePack, ManualOutcome, ResearchPack, SavedAnalysisRun, ValidationIssue } from './types'
import { parseJson, validateSavedAnalysisRun } from './validation'

export const SAVED_RUNS_STORAGE_KEY = 'formfirst.saved-analysis-runs.v1'
export interface StorageAdapter { getItem(key: string): string | null; setItem(key: string, value: string): void }
type FailureCategory = 'invalid' | 'duplicate' | 'storage_unavailable' | 'quota'
export type RepositoryResult<T> = { ok: true; value: T } | { ok: false; category: FailureCategory; issues: ValidationIssue[] }
const failure = (category: FailureCategory, code: string, path: string, message: string): RepositoryResult<never> => ({ ok: false, category, issues: [{ code, path, message }] })
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

export function createSavedRun(fixturePack: FixturePack, researchPack: ResearchPack, analysis: AnalysisOutput, runId: string, createdAt: string): RepositoryResult<SavedAnalysisRun> {
  const legs = [...new Set([analysis.builders.highProbability, analysis.builders.balanced].flatMap(builder => builder.status === 'builder' ? builder.selectedLegs.map(leg => leg.id) : []))]
  const run: SavedAnalysisRun = {
    packName: 'SavedAnalysisRun v1', schemaVersion: '1.0.0', runId, createdAt, generatedAt: createdAt, dataStatus: researchPack.dataStatus,
    fixturePackRef: { packName: fixturePack.packName, schemaVersion: fixturePack.schemaVersion, fixtureDate: fixturePack.fixtureDate },
    researchPackRef: { packName: researchPack.packName, schemaVersion: researchPack.schemaVersion, fixtureDate: fixturePack.fixtureDate },
    modelVersion: analysis.modelVersion, settings: { ...clone(analysis.settings), deterministic: true }, analysisInputs: { fixturePack: clone(fixturePack), researchPack: clone(researchPack) },
    validation: { valid: true, errors: [], warnings: [] }, candidates: clone(analysis.candidates), builders: clone(analysis.builders),
    results: { builders: { high_probability: { outcome: 'pending', updatedAt: null }, balanced: { outcome: 'pending', updatedAt: null } }, legs: Object.fromEntries(legs.map(id => [id, { outcome: 'pending', updatedAt: null }])), updatedAt: null },
  }
  const checked = validateSavedAnalysisRun(run)
  return checked.valid ? { ok: true, value: clone(run) } : { ok: false, category: 'invalid', issues: checked.errors }
}

function decodeCollection(raw: string | null): RepositoryResult<SavedAnalysisRun[]> {
  if (raw === null) return { ok: true, value: [] }
  const parsed = parseJson(raw)
  if (!parsed.valid || !Array.isArray(parsed.data)) return failure('invalid', 'malformed_storage', '$', 'Saved history is malformed. No records were changed.')
  const runs: SavedAnalysisRun[] = []
  for (let index = 0; index < parsed.data.length; index++) { const checked = validateSavedAnalysisRun(parsed.data[index]); if (!checked.valid) return { ok: false, category: 'invalid', issues: checked.errors.map(item => ({ ...item, path: `$[${index}]${item.path.slice(1)}` })) }; runs.push(checked.data!) }
  return { ok: true, value: runs }
}

export class SavedRunRepository {
  constructor(private readonly storage: StorageAdapter) {}
  list(): RepositoryResult<SavedAnalysisRun[]> { try { const result = decodeCollection(this.storage.getItem(SAVED_RUNS_STORAGE_KEY)); return result.ok ? { ok: true, value: clone(result.value).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) } : result } catch { return failure('storage_unavailable', 'storage_unavailable', '$', 'Local browser storage is unavailable.') } }
  load(runId: string): RepositoryResult<SavedAnalysisRun> { const listed = this.list(); if (!listed.ok) return listed; const run = listed.value.find(item => item.runId === runId); return run ? { ok: true, value: clone(run) } : failure('invalid', 'not_found', '$.runId', 'The saved run was not found.') }
  save(run: SavedAnalysisRun): RepositoryResult<SavedAnalysisRun> { const checked = validateSavedAnalysisRun(run); if (!checked.valid) return { ok: false, category: 'invalid', issues: checked.errors }; const listed = this.list(); if (!listed.ok) return listed; if (listed.value.some(item => item.runId === run.runId)) return failure('duplicate', 'duplicate_run_id', '$.runId', `Run ID ${run.runId} already exists.`); return this.write([...listed.value, clone(run)], run) }
  update(run: SavedAnalysisRun): RepositoryResult<SavedAnalysisRun> { const checked = validateSavedAnalysisRun(run); if (!checked.valid) return { ok: false, category: 'invalid', issues: checked.errors }; const listed = this.list(); if (!listed.ok) return listed; const index = listed.value.findIndex(item => item.runId === run.runId); if (index < 0) return failure('invalid', 'not_found', '$.runId', 'The saved run was not found.'); listed.value[index] = clone(run); return this.write(listed.value, run) }
  private write(runs: SavedAnalysisRun[], run: SavedAnalysisRun): RepositoryResult<SavedAnalysisRun> { try { this.storage.setItem(SAVED_RUNS_STORAGE_KEY, JSON.stringify(runs)); return { ok: true, value: clone(run) } } catch (error) { const quota = error instanceof DOMException && error.name === 'QuotaExceededError'; return failure(quota ? 'quota' : 'storage_unavailable', quota ? 'storage_quota' : 'storage_unavailable', '$', quota ? 'Browser storage is full. No saved history was removed.' : 'Local browser storage is unavailable.') } }
}

export function importSavedRun(text: string, repository: SavedRunRepository): RepositoryResult<SavedAnalysisRun> { const parsed = parseJson(text); if (!parsed.valid) return { ok: false, category: 'invalid', issues: parsed.errors }; const checked = validateSavedAnalysisRun(parsed.data); if (!checked.valid) return { ok: false, category: 'invalid', issues: checked.errors }; if (checked.data!.dataStatus !== 'real') return failure('invalid', 'unsafe_synthetic_import', '$.dataStatus', 'Synthetic saved runs cannot be imported into history.'); return repository.save(checked.data!) }
export function serializeSavedRun(run: SavedAnalysisRun): RepositoryResult<{ json: string; filename: string }> { const checked = validateSavedAnalysisRun(run); if (!checked.valid) return { ok: false, category: 'invalid', issues: checked.errors }; return { ok: true, value: { json: `${JSON.stringify(run, null, 2)}\n`, filename: `formfirst-${run.analysisInputs.fixturePack.fixtureDate}-${run.runId}.json` } } }
export function recordOutcome(run: SavedAnalysisRun, target: { type: 'builder'; id: BuilderKind } | { type: 'leg'; id: string }, outcome: ManualOutcome, updatedAt: string): RepositoryResult<SavedAnalysisRun> { const checked = validateSavedAnalysisRun(run); if (!checked.valid) return { ok: false, category: 'invalid', issues: checked.errors }; if (!['pending','won','lost','void'].includes(outcome) || !Number.isFinite(Date.parse(updatedAt))) return failure('invalid', 'invalid_outcome', '$.results', 'Outcome and update timestamp are invalid.'); const next = clone(run); if (target.type === 'builder') next.results.builders[target.id] = { outcome, updatedAt }; else if (target.id in next.results.legs) next.results.legs[target.id] = { outcome, updatedAt }; else return failure('invalid', 'unknown_result_target', '$.results.legs', 'The saved leg does not exist.'); next.results.updatedAt = updatedAt; return validateSavedAnalysisRun(next).valid ? { ok: true, value: next } : failure('invalid', 'invalid_update', '$.results', 'The outcome update is invalid.') }
