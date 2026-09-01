import type { SavedAnalysisRun } from './types'
import { serializeSavedRun, type StorageAdapter } from './savedRuns'

export const generateRunId = (cryptoAdapter: Pick<Crypto, 'randomUUID'> = crypto): string => cryptoAdapter.randomUUID()
export const browserStorage: StorageAdapter = {
  getItem(key) { return window.localStorage.getItem(key) },
  setItem(key, value) { window.localStorage.setItem(key, value) },
}
export function downloadSavedRun(run: SavedAnalysisRun, documentAdapter: Document = document, urlAdapter: Pick<typeof URL, 'createObjectURL' | 'revokeObjectURL'> = URL) {
  const exported = serializeSavedRun(run)
  if (!exported.ok) return exported
  const url = urlAdapter.createObjectURL(new Blob([exported.value.json], { type: 'application/json' }))
  const link = documentAdapter.createElement('a'); link.href = url; link.download = exported.value.filename; link.click(); urlAdapter.revokeObjectURL(url)
  return exported
}
