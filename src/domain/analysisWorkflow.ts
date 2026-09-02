import { SUPPORTED_COMPETITIONS, type AnalysisPack, type Competition, type FreshnessOptions, type ValidationResult } from './types'
import { parseJson, validateAnalysisPack } from './validation'

export function buildAnalysisPackPrompt(date: string, competitions: Competition[]): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Select a valid date before generating a prompt.')
  if (!competitions.length || new Set(competitions).size !== competitions.length || competitions.some(c => !SUPPORTED_COMPETITIONS.includes(c))) throw new Error('Select at least one unique supported competition.')
  return `Use ChatGPT Search to discover fixtures and research them. Return one strict JSON object only: AnalysisPack v1 schemaVersion "1.0.0", with an actual UTC generatedAt, a complete FixturePack v1 schemaVersion "1.0.0", and a complete ResearchPack v1 schemaVersion "1.4.0". No prose, Markdown, or additional fields.

FIXTURE DISCOVERY: Interpret ${date} in Europe/London. Include only verified scheduled fixtures in: ${competitions.join(', ')}. Return an empty fixtures array when none match. Use stable durable unique fixture IDs and verified UTC plus Europe/London kick-off values. The ResearchPack fixturePackRef must exactly match fixture schemaVersion and fixtureDate. Include exactly one matching research fixture for every discovered fixture, including insufficient fixtures; match fixtureId, competition, homeTeam and awayTeam exactly.

RESEARCH RULES: Set dataStatus to real. Use actual UTC generatedAt and retrievedAt timestamps, sources no older than 24 hours, and unique kebab-case source IDs matching ^[a-z0-9]+(?:-[a-z0-9]+)*$. Cite every populated item. Use current-season league data only: never prior seasons, cups, or friendlies. Use team-level evidence only. Never include odds, prices, bookmaker links, implied probability, value claims, payouts, stakes, tips, predictions, selections, or player markets. Never infer corners, cards, shots, or shots-on-target from goals or results. Mark dataQuality insufficient where required evidence cannot be credibly sourced. Do not insert neutral defaults.

MARKET COVERAGE — create candidate_market evidence only when the exact evidence exists, with an exact matching competition benchmark marketKey and threshold; label opponent/conceding/allowance/discipline evidence supporting_only and never use it as a candidate:
- Match result, double chance, draw-no-bet: candidate current W/D/L for the relevant outcome, relevant current home/away W/D/L sample, required opponent outcome support, and same-key/threshold current-season competition benchmark.
- BTTS: both teams' scoring and conceding support, dedicated BTTS candidate record, matching benchmark.
- Total goals: dedicated current match-total threshold hit rates (at least over 1.5 and over 2.5 where sourced) and an exact benchmark; never infer match totals solely from team goals.
- Team goals and team to score: candidate-team current scoring-threshold hit rates, opponent explicit conceding-threshold support, exact-threshold benchmark.
- Clean sheets: candidate clean-sheet evidence, opponent failure-to-score support, matching benchmark.
- Corners: dedicated team or match corner threshold hit rates, relevant opponent corners-for/corners-conceded support, exact-threshold benchmark; no candidate without dedicated evidence.
- Cards: dedicated team or match card threshold hit rates, relevant opponent discipline support, exact-threshold benchmark.
- Shots and shots on target: dedicated team threshold hit rates, explicit opponent allowance support, exact-threshold benchmark.

CONTEXT: teamNews, fixtureCongestion and managerialContext require scope and application. candidate_penalty is valid only for known, current, sourced, team-level, candidate-relevant caution or material disruption scoped home, away or both. Generic, non-directional, unknown, neutral, positive, manager-change, transfer and squad-turnover context is descriptive_only with zero direct penalty. opponentStrength is descriptive_only.

The nested objects must conform exactly to schemas/fixture-pack.v1.schema.json and schemas/research-pack.v1.4.schema.json. Output the AnalysisPack JSON object only.`
}

export function parseAndValidateAnalysisPack(input: string, freshness: FreshnessOptions, validationTime: string = new Date().toISOString()): ValidationResult<AnalysisPack> {
  if (/^\s*```/.test(input) || !/^\s*\{[\s\S]*\}\s*$/.test(input)) return { valid: false, errors: [{ code: 'wrapped_json', path: '$', message: 'Paste only the JSON object; prose and Markdown fences are not accepted.' }], warnings: [] }
  const parsed = parseJson(input)
  return parsed.valid ? validateAnalysisPack(parsed.data, freshness, validationTime) : parsed as ValidationResult<AnalysisPack>
}
