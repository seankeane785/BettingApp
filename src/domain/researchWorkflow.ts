import type { FixturePack, FreshnessOptions, ResearchFixture, ResearchPack, ValidationResult } from './types'
import { parseJson, validateResearchPack } from './validation'

export type ResearchGate = 'missing' | 'empty' | 'synthetic' | 'ready'

export function isSyntheticFixturePack(pack: FixturePack): boolean {
  return /synthetic|fictional/i.test(JSON.stringify(pack))
}

export function getResearchGate(pack?: FixturePack): ResearchGate {
  if (!pack) return 'missing'
  if (pack.fixtures.length === 0) return 'empty'
  return isSyntheticFixturePack(pack) ? 'synthetic' : 'ready'
}

export function validateFreshnessSettings(settings: FreshnessOptions): string | null {
  if (!/T/.test(settings.referenceTimestamp) || !Number.isFinite(Date.parse(settings.referenceTimestamp))) return 'Enter a valid ISO reference timestamp.'
  if (!Number.isFinite(settings.maximumAgeHours) || settings.maximumAgeHours < 0) return 'Maximum source age must be zero or more hours.'
  return null
}

export function buildResearchPrompt(pack: FixturePack, settings: FreshnessOptions): string {
  if (getResearchGate(pack) !== 'ready') throw new Error('Research requires a valid, non-synthetic FixturePack containing at least one fixture.')
  const settingsError = validateFreshnessSettings(settings)
  if (settingsError) throw new Error(settingsError)
  const fixtures = pack.fixtures.map(({ fixtureId, competition, homeTeam, awayTeam, kickOff }) => ({ fixtureId, competition, homeTeam, awayTeam, kickOff }))
  return `Use ChatGPT Search manually to research the fixtures below. Do not automate this search.

Return only one strict JSON object: no explanation, prose, commentary, or Markdown fences. It must conform exactly to the existing ResearchPack v1 schema version 1.0.0, with no additional fields. Set fixturePackRef.schemaVersion to ${pack.schemaVersion}, fixturePackRef.fixtureDate to ${pack.fixtureDate}, dataStatus to "real", and include exactly one fixtures entry for every listed fixture.

Deterministic freshness reference timestamp: ${settings.referenceTimestamp}
Maximum source age: ${settings.maximumAgeHours} hours

Selected fixtures (copy identity fields exactly):
${JSON.stringify(fixtures, null, 2)}

For both teams, obtain current-season, team-level evidence where available: last five and last ten form; home or away record; goals scored and conceded; and relevant canonical market hit rates. Each marketHitRates entry must identify marketKey, marketGroup, selectionLabel, teamSide, threshold, full/current sample hits, recent sample hits, applicable venue sample hits, underlyingSupportPercent and sourceIds. Use only these market groups: match_result, double_chance, draw_no_bet, both_teams_to_score, total_goals, team_goals, team_to_score, clean_sheet, total_corners, team_corners, total_cards, team_cards, team_shots, team_shots_on_target. The key and label must describe exactly the cited team-level statistic; do not derive a threshold or selection from prose. Also obtain shots, shots on target, corners, cards and xG only where sourced. Research opponent-strength context, credible team news, fixture congestion, and managerial changes, assigning each context an explicit impact of positive, neutral, caution, material or unknown. Populate every mandatory ResearchPack v1 evidence object and field. Use null for unavailable numeric or optional evidence, and use status "unknown", impact "unknown" and null detail for unavailable or conflicting context. Never invent numbers or claims. Do not let historical data override material current squad or manager changes.

Every source must have a unique sourceId, an HTTPS source URL, a non-empty source title, and an ISO retrieval timestamp. Every populated evidence area must cite one or more valid sourceIds. Retrieval timestamps must not be later than the reference timestamp or older than the maximum source age. Prefer credible primary and official sources, and cross-check conflicts.

Do not include player data or player-specific markets. Do not include odds, prices, implied probability, payouts, expected value, value betting, bookmaker links, tipster views, stakes, or betting recommendations. Do not make selections, predictions, probability estimates, confidence grades, or accumulator suggestions.`
}

export function parseAndValidateResearchPack(input: string, fixtures: FixturePack, settings: FreshnessOptions): ValidationResult<ResearchPack> {
  if (/^\s*```/.test(input) || !/^\s*\{[\s\S]*\}\s*$/.test(input)) return { valid: false, errors: [{ code: 'wrapped_json', path: '$', message: 'Paste only the JSON object; prose and Markdown fences are not accepted.' }], warnings: [] }
  const parsed = parseJson(input)
  if (!parsed.valid) return parsed as ValidationResult<ResearchPack>
  return validateResearchPack(parsed.data, fixtures, settings)
}

export const evidenceCategories = (fixture: ResearchFixture): { populated: string[]; missing: string[] } => {
  const entries: [string, unknown][] = [['home team', fixture.homeEvidence], ['away team', fixture.awayEvidence], ['opponent strength', fixture.opponentStrength], ['team news', fixture.teamNews], ['fixture congestion', fixture.fixtureCongestion], ['managerial context', fixture.managerialContext]]
  return { populated: entries.filter(([, value]) => value != null).map(([name]) => name), missing: entries.filter(([, value]) => value == null).map(([name]) => name) }
}
