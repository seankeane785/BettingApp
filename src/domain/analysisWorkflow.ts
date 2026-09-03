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
  return `Use ChatGPT Search to discover fixtures and research them. Return one strict JSON object only: AnalysisPack v1 schemaVersion "1.0.0", with an actual UTC generatedAt, a complete FixturePack v1 schemaVersion "1.0.0", and a complete ResearchPack v1 schemaVersion "1.4.0". No prose, Markdown, or additional fields.

FIXTURE DISCOVERY: Interpret ${date} in Europe/London. Include only verified scheduled fixtures in: ${competitions.join(', ')}. Return an empty fixtures array when none match. Use stable durable unique fixture IDs and verified UTC plus Europe/London kick-off values. The ResearchPack fixturePackRef must exactly match fixture schemaVersion and fixtureDate. Include exactly one matching research fixture for every discovered fixture, including insufficient fixtures; match fixtureId, competition, homeTeam and awayTeam exactly.

${RESEARCH_ACQUISITION_POLICY}

Research every family individually; never invent evidence or claim coverage merely to increase candidates. This is manual research only, with no automated collection. A SoccerStats average or other generic average is not a threshold hit rate. Populate a threshold record only when the source explicitly supplies its percentage/count or a direct completed-match table permits an exact manual count of verified observations. Create candidate_market records only when exact candidate evidence, mandatory supporting_only opponent evidence, required venue evidence, and an exact same-key/same-threshold current-season competition benchmark all exist. For cards, shots, and shots on target, inspect direct completed-match pages and create records only from explicit numeric statistics. Missing metrics leave the family unavailable: never create neutral defaults, proxies, inferred values, or synthetic hit rates. Set dataStatus to real. Use actual UTC generatedAt and retrievedAt timestamps and sources no older than 24 hours. Every source object must have exactly this contract and no other properties: { "sourceId": "non-empty kebab-case string", "url": "absolute HTTPS URL with a hostname", "title": "non-empty string", "retrievedAt": "ISO 8601 UTC timestamp ending in Z" }. In emitted JSON encode every slash in every source URL with JSON Unicode escapes, for example "url":"https:\\u002F\\u002Fwww.soccerstats.com\\u002Ftable.asp?league=england". Never emit a Markdown-link source value. The parser decodes \\u002F to /. Direct source-page paths, query strings, fragments, hyphens, and standard public domains are valid; do not use a domain allowlist. sourceId is the only ID field; never use id or include both id and sourceId. Every sourceId must match ^[a-z0-9]+(?:-[a-z0-9]+)*$; examples: "src-ch-results" and "official-match-centre". Every populated evidence record and benchmark must cite declared sourceId values. Use completed current-season league data only; never prior seasons, cups, friendlies, odds, prices, bookmaker content, player data, predictions, selections, or stakes. Mark dataQuality insufficient where required evidence cannot be credibly sourced. Do not insert neutral defaults.

MARKET COVERAGE — create candidate_market evidence only when the exact evidence exists, with an exact matching competition benchmark marketKey and threshold; label opponent/conceding/allowance/discipline evidence supporting_only and never use it as a candidate:
- Match result, double chance, draw-no-bet: candidate current W/D/L for the relevant outcome, relevant current home/away W/D/L sample, required opponent outcome support, and same-key/threshold current-season competition benchmark.
- BTTS: both teams' scoring and conceding support, dedicated BTTS candidate record, matching benchmark.
- Total goals: dedicated current match-total threshold hit rates (at least over 1.5 and over 2.5 where sourced) and an exact benchmark; never infer match totals solely from team goals.
- Team goals and team to score: candidate-team current scoring-threshold hit rates, opponent explicit conceding-threshold support, exact-threshold benchmark.
- Clean sheets: candidate clean-sheet evidence, opponent failure-to-score support, matching benchmark.
- Total and team corners: dedicated current-season threshold hit rates for plausible supported thresholds such as match total corners over 8.5 or 9.5 and team corners over 3.5 or 4.5. Candidate team or match threshold evidence must be candidate_market; relevant opponent corners-for or corners-conceded threshold evidence must be supporting_only. Each candidate requires an exact same-key, same-threshold current-season competition benchmark. Never infer corner evidence from goals, possession, shots, or generic averages.
- Total and team cards: dedicated current-season threshold hit rates for plausible supported thresholds such as match total cards over 2.5 or 3.5 and team cards over 0.5 or 1.5. Candidate evidence must be candidate_market; relevant opponent discipline or card threshold evidence must be supporting_only. Each candidate requires an exact same-key, same-threshold current-season competition benchmark. Never infer card evidence from referee averages, fouls, goals, or generic averages alone.
- Team shots: dedicated current-season team shots threshold hit rates such as 8+ or 10+ shots where sourced, explicit opponent shots-allowed threshold evidence as supporting_only, and an exact same-key, same-threshold current-season competition benchmark. Never derive shot evidence from goals, xG alone, possession, or narrative reporting.
- Team shots on target: dedicated current-season team shots-on-target threshold hit rates such as 3+ or 4+ where sourced, explicit opponent shots-on-target-allowed threshold evidence as supporting_only, and an exact same-key, same-threshold current-season competition benchmark. Never derive shots-on-target evidence from goals, shots, xG alone, possession, or narrative reporting.

For every candidate_market returned, create its matching current-season competition benchmark and every mandatory supporting_only opponent record in this matrix. Omit the candidate_market if any candidate evidence, support evidence, required venue evidence, or exact benchmark cannot be sourced. Never infer BTTS, match totals, clean sheets, results, corners, cards, shots, or shots on target from goals, narrative reports, generic averages, possession, xG, referee trends, or bookmaker material.

SPECIALIST AVAILABILITY: Include a candidate_market record only where its exact supporting evidence exists. A market must remain unavailable when exact candidate evidence, required supporting_only evidence, or the matching benchmark cannot be sourced. Absence of specialist evidence must leave the market unavailable: proxy, inferred, generic-average, or neutral-default evidence is forbidden. Manual market-availability dropdowns control availability and settlement verification only; they are not evidence, must not fill missing research data, and do not affect probability, confidence, evidence quality, or candidate creation.

CONTEXT: teamNews, fixtureCongestion and managerialContext require scope and application. candidate_penalty is valid only for known, current, sourced, team-level, candidate-relevant caution or material disruption scoped home, away or both. Generic, non-directional, unknown, neutral, positive, manager-change, transfer and squad-turnover context is descriptive_only with zero direct penalty. opponentStrength is descriptive_only.

The nested objects must conform exactly to schemas/fixture-pack.v1.schema.json and schemas/research-pack.v1.4.schema.json. Output the AnalysisPack JSON object only.`
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
