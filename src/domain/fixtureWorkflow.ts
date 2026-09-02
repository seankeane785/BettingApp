import {
  SUPPORTED_COMPETITIONS,
  type Competition,
  type FixturePack,
  type ValidationResult,
} from "./types";
import { parseJson, validateFixturePack } from "./validation";

export interface FixtureCriteria {
  date: string;
  competitions: Competition[];
}

const fixturePackContract = `FixturePack v1 contract (every field is required; no additional fields are permitted):
{
  "packName": "FixturePack v1" (exact string),
  "schemaVersion": "1.0.0" (exact string),
  "fixtureDate": string in YYYY-MM-DD format,
  "generatedAt": string containing an ISO 8601 UTC date-time,
  "competitions": non-empty array of unique values chosen only from "Premier League" and "Championship",
  "fixtures": array (which may be empty) of {
    "fixtureId": non-empty stable unique string using only letters, numbers, period, underscore or hyphen,
    "competition": exactly "Premier League" or "Championship" and also present in competitions,
    "homeTeam": non-empty string,
    "awayTeam": non-empty string different from homeTeam,
    "kickOff": {
      "utc": string containing the verified ISO 8601 UTC kick-off date-time,
      "localDate": string in YYYY-MM-DD format equal to fixtureDate,
      "localTime": string in 24-hour HH:mm format,
      "timezone": "Europe/London" (exact string)
    }
  }
}`;

export function buildFixturePrompt({
  date,
  competitions,
}: FixtureCriteria): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
    throw new Error("Select a valid date before generating a prompt.");
  if (competitions.length === 0)
    throw new Error(
      "Select at least one competition before generating a prompt.",
    );
  if (
    new Set(competitions).size !== competitions.length ||
    competitions.some((item) => !SUPPORTED_COMPETITIONS.includes(item))
  )
    throw new Error(
      "Competitions must be unique and supported; FormFirst supports only Premier League and Championship.",
    );

  return `This task is only for Premier League and/or Championship fixtures. Use ChatGPT Search to find and verify all scheduled football fixtures matching the criteria below.

Selected Europe/London date: ${date}
Selected competitions: ${competitions.join(", ")}

Return only one strict JSON object representing FixturePack v1 with schema version 1.0.0. Do not output any other text and do not add fields.

${fixturePackContract}

Include only scheduled fixtures whose Europe/London local date is ${date} and whose competition is one of the selected competitions: ${competitions.join(", ")}. Set fixtureDate and every kickOff.localDate to ${date}. Supply both the UTC kick-off timestamp and its Europe/London local date and time. Copy verified team names accurately. Fixture IDs must be stable across repeated searches, unique within the pack, and composed from durable fixture identity rather than search order. Exclude duplicate fixtures.

Do not invent fixtures or kick-off times. If no matching fixtures are scheduled, return a valid object with "fixtures": [] rather than inventing any. FixturePack fields do not permit null or "unknown".

Output the JSON object only. No prose, Markdown fences, commentary, player data, markets, odds, prices, bookmaker links, or betting advice.`;
}

export function parseAndValidateFixturePack(
  input: string,
): ValidationResult<FixturePack> {
  const parsed = parseJson(input);
  if (!parsed.valid) return parsed as ValidationResult<FixturePack>;
  return validateFixturePack(parsed.data);
}
