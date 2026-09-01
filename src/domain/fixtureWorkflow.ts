import { SUPPORTED_COMPETITIONS, type Competition, type FixturePack, type ValidationResult } from './types'
import { parseJson, validateFixturePack } from './validation'

export interface FixtureCriteria { date: string; competitions: Competition[] }

const jsonShape = `{
  "packName": "FixturePack v1",
  "schemaVersion": "1.0.0",
  "fixtureDate": "YYYY-MM-DD",
  "generatedAt": "ISO 8601 UTC date-time",
  "competitions": ["Premier League"],
  "fixtures": [{
    "fixtureId": "stable-id",
    "competition": "Premier League",
    "homeTeam": "Home team",
    "awayTeam": "Away team",
    "kickOff": {"utc": "ISO 8601 UTC date-time", "localDate": "YYYY-MM-DD", "localTime": "HH:mm", "timezone": "Europe/London"}
  }]
}`

export function buildFixturePrompt({ date, competitions }: FixtureCriteria): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Select a valid date before generating a prompt.')
  if (competitions.length === 0) throw new Error('Select at least one competition before generating a prompt.')
  if (new Set(competitions).size !== competitions.length || competitions.some((item) => !SUPPORTED_COMPETITIONS.includes(item))) throw new Error('Competitions must be unique and supported.')

  return `Use ChatGPT Search manually to find scheduled football fixtures.

Selected Europe/London date: ${date}
Selected competitions: ${competitions.join(', ')}

Return only one strict JSON object. Do not include explanation, prose, commentary, or Markdown fences. The object must conform exactly to FixturePack v1 schema version 1.0.0 using this field structure and no additional fields:
${jsonShape}

Include only scheduled fixtures whose Europe/London local date is ${date} and whose competition is one of: ${competitions.join(', ')}. Set fixtureDate and every kickOff.localDate to ${date}. Include both the Europe/London local time and the UTC kick-off timestamp. Use the exact competition names shown above. Home and away teams must be distinct. Use a stable, unique fixtureId and do not duplicate fixtures.

Do not invent fixtures or kick-off times. Verify them using current reliable sources. If no qualifying fixtures exist, return the same object with an empty fixtures array. Do not use null or "unknown" because FixturePack v1 permits neither.

Do not include player data, markets, odds, prices, implied probability, payouts, bookmaker links, tipster content, stakes, or betting recommendations.`
}

export function parseAndValidateFixturePack(input: string): ValidationResult<FixturePack> {
  const parsed = parseJson(input)
  if (!parsed.valid) return parsed as ValidationResult<FixturePack>
  return validateFixturePack(parsed.data)
}
