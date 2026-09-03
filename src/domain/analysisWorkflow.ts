import { SUPPORTED_COMPETITIONS, type AnalysisPack, type Competition, type FreshnessOptions, type ValidationResult } from './types'
import { validateAnalysisPack } from './validation'
import { RESEARCH_ACQUISITION_POLICY } from './researchPromptPolicy'

type AnalysisPackValidator = typeof validateAnalysisPack

export interface AnalysisPackImport {
  validation: ValidationResult<AnalysisPack>
  fixturePack?: AnalysisPack['fixturePack']
  researchPack?: AnalysisPack['researchPack']
}

export function buildAnalysisPackPrompt(date: string, competitions: Competition[]): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Select a valid date before generating a prompt.')
  if (!competitions.length || new Set(competitions).size !== competitions.length || competitions.some(c => !SUPPORTED_COMPETITIONS.includes(c))) throw new Error('Select at least one unique supported competition.')
  return `Use ChatGPT Search to discover fixtures and research them. Return one strict JSON object only: AnalysisPack v1 schemaVersion "1.0.0", with an actual UTC generatedAt, a complete FixturePack v1 schemaVersion "1.0.0", and a complete ResearchPack v1 schemaVersion "1.5.0". No prose, Markdown, or additional fields.

FIXTURE DISCOVERY: Interpret ${date} in Europe/London. Include only verified scheduled fixtures in: ${competitions.join(', ')}. Return an empty fixtures array when none match. Use stable durable unique fixture IDs and verified UTC plus Europe/London kick-off values. The ResearchPack fixturePackRef must exactly match fixture schemaVersion and fixtureDate. Include exactly one matching research fixture for every discovered fixture, including insufficient fixtures; match fixtureId, competition, homeTeam and awayTeam exactly.

${RESEARCH_ACQUISITION_POLICY}

The nested objects must conform exactly to schemas/fixture-pack.v1.schema.json and schemas/research-pack.v1.5.schema.json. Output the AnalysisPack JSON object only.`
}

const receivedValueDetail = (value: unknown): string => {
  const serialized = JSON.stringify(value) ?? String(value)
  const type = typeof value
  if (type !== 'string') return `Received value: ${serialized} | type: ${type} | length: n/a`
  const text = value as string
  const codePoints = Array.from(text, character => `U+${character.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}`).join(' ')
  return `Received value: ${serialized} | type: string | length: ${text.length} | code points: ${codePoints}`
}

const valueAtPath = (value: unknown, path: string): unknown => {
  let current = value
  for (const match of path.matchAll(/\.([^.[\]]+)|\[(\d+)\]/g)) {
    if (typeof current !== 'object' || current === null) return undefined
    current = (current as Record<string, unknown>)[match[1] ?? match[2]]
  }
  return current
}

export function importAnalysisPack(input: string, freshness: FreshnessOptions, validationTime: string = new Date().toISOString(), validator: AnalysisPackValidator = validateAnalysisPack): AnalysisPackImport {
  const rawJson = input.trim()
  if (/^```/.test(rawJson) || !/^\{[\s\S]*\}$/.test(rawJson)) return { validation: { valid: false, errors: [{ code: 'wrapped_json', path: '$', message: 'Paste only the JSON object; prose and Markdown fences are not accepted.' }], warnings: [] } }
  let parsedValue: unknown
  try {
    parsedValue = JSON.parse(rawJson)
  } catch {
    return { validation: { valid: false, errors: [{ code: 'invalid_json', path: '$', message: 'Input is not valid JSON.' }], warnings: [] } }
  }

  const validation = validator(parsedValue, freshness, validationTime)
  if (!validation.valid) {
    validation.errors = validation.errors.map(error => error.code === 'invalid_source_url'
      ? { ...error, message: `${error.message} ${receivedValueDetail(valueAtPath(parsedValue, error.path))}` }
      : error)
  }
  if (!validation.valid || !validation.data) return { validation }
  return { validation, fixturePack: validation.data.fixturePack, researchPack: validation.data.researchPack }
}

export function parseAndValidateAnalysisPack(input: string, freshness: FreshnessOptions, validationTime: string = new Date().toISOString()): ValidationResult<AnalysisPack> {
  return importAnalysisPack(input, freshness, validationTime).validation
}
