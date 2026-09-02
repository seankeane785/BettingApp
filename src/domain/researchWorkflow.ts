import type {
  FixturePack,
  FreshnessOptions,
  ResearchFixture,
  ResearchPack,
  ValidationResult,
} from "./types";
import { parseJson, validateResearchPack } from "./validation";

export type ResearchGate = "missing" | "empty" | "synthetic" | "ready";

export function isSyntheticFixturePack(pack: FixturePack): boolean {
  return /synthetic|fictional/i.test(JSON.stringify(pack));
}

export function getResearchGate(pack?: FixturePack): ResearchGate {
  if (!pack) return "missing";
  if (pack.fixtures.length === 0) return "empty";
  return isSyntheticFixturePack(pack) ? "synthetic" : "ready";
}

export function validateFreshnessSettings(
  settings: FreshnessOptions,
): string | null {
  if (
    !/T/.test(settings.referenceTimestamp) ||
    !Number.isFinite(Date.parse(settings.referenceTimestamp))
  )
    return "Enter a valid ISO reference timestamp.";
  if (
    !Number.isFinite(settings.maximumAgeHours) ||
    settings.maximumAgeHours < 0
  )
    return "Maximum source age must be zero or more hours.";
  return null;
}

export function buildResearchPrompt(
  pack: FixturePack,
  settings: FreshnessOptions,
): string {
  if (getResearchGate(pack) !== "ready")
    throw new Error(
      "Research requires a valid, non-synthetic FixturePack containing at least one fixture.",
    );
  const settingsError = validateFreshnessSettings(settings);
  if (settingsError) throw new Error(settingsError);
  const maximumSourceAgeHours = Math.min(settings.maximumAgeHours, 24);
  const fixtures = pack.fixtures.map(
    ({ fixtureId, competition, homeTeam, awayTeam, kickOff }) => ({
      fixtureId,
      competition,
      homeTeam,
      awayTeam,
      kickOff,
    }),
  );
  return `This research task is only for Premier League and/or Championship fixtures. Use ChatGPT Search to research every fixture and both teams listed below.

Return only one strict JSON object representing ResearchPack v1 with schema version 1.0.0. Include every supplied fixture even when its dataQuality is "insufficient" or evidence is unknown. Do not add fields.

Maximum source age: ${maximumSourceAgeHours} hours
Set fixturePackRef.schemaVersion to "${pack.schemaVersion}", fixturePackRef.fixtureDate to "${pack.fixtureDate}", and dataStatus to "real".

Fixtures to research (copy all identity and kick-off fields accurately; ResearchPack fixture entries copy fixtureId, competition, homeTeam and awayTeam):
${JSON.stringify(fixtures, null, 2)}

ResearchPack v1 complete output contract (all shown fields are required; no additional fields):
{
  "packName": "ResearchPack v1",
  "schemaVersion": "1.0.0",
  "fixturePackRef": {"schemaVersion": "1.0.0", "fixtureDate": "YYYY-MM-DD"},
  "generatedAt": "ISO 8601 date-time",
  "dataStatus": "real",
  "sources": [{"sourceId": "unique non-empty string", "url": "HTTPS URL", "title": "non-empty string", "retrievedAt": "ISO 8601 date-time"}],
  "fixtures": [{
    "fixtureId": "copied fixture ID",
    "competition": "Premier League" or "Championship",
    "homeTeam": "copied home team",
    "awayTeam": "copied away team",
    "homeEvidence": TEAM_EVIDENCE,
    "awayEvidence": TEAM_EVIDENCE,
    "opponentStrength": CONTEXT_EVIDENCE,
    "teamNews": CONTEXT_EVIDENCE,
    "fixtureCongestion": CONTEXT_EVIDENCE,
    "managerialContext": CONTEXT_EVIDENCE,
    "reasonsFor": [strings],
    "reasonsAgainst": [strings],
    "dataQuality": "complete" or "partial" or "insufficient"
  }]
}

TEAM_EVIDENCE is exactly:
{
  "currentSeasonForm": {
    "summary": "non-empty sourced string, or unknown",
    "lastFive": string or null,
    "lastTen": string or null,
    "homeOrAway": string or null,
    "goalsScored": non-negative number or null,
    "goalsConceded": non-negative number or null,
    "sourceIds": [one or more source IDs]
  },
  "marketHitRates": [{
    "marketKey": "lowercase canonical key using letters, numbers and underscores",
    "marketGroup": one of "match_result", "double_chance", "draw_no_bet", "both_teams_to_score", "total_goals", "team_goals", "team_to_score", "clean_sheet", "total_corners", "team_corners", "total_cards", "team_cards", "team_shots", "team_shots_on_target",
    "selectionLabel": "non-empty team-level statistic label",
    "teamSide": "home" or "away" or "both" or "match",
    "threshold": non-negative number or null,
    "sampleSize": non-negative integer,
    "hits": non-negative integer no greater than sampleSize,
    "recentSampleSize": non-negative integer,
    "recentHits": non-negative integer no greater than recentSampleSize,
    "venueSampleSize": non-negative integer or null,
    "venueHits": non-negative integer or null and no greater than venueSampleSize,
    "underlyingSupportPercent": number from 0 to 100 or null,
    "sourceIds": [one or more source IDs]
  }],
  "optionalMetrics": {"metric_name": {"value": non-negative number or null, "sourceIds": [one or more source IDs]} or null}
}

CONTEXT_EVIDENCE is exactly:
{
  "status": "known" or "unknown",
  "impact": "positive" or "neutral" or "caution" or "material" or "unknown",
  "detail": string or null,
  "sourceIds": [one or more source IDs]
}
Use status "unknown", impact "unknown", null detail, and valid supporting source IDs when a source establishes that the information is unavailable or conflicting.

For every fixture and team, research: current-season form; last 5 and last 10; relevant home/away records; goals scored and conceded; supported team-level market hit rates where evidence exists; shots, shots on target, corners and cards where available; opponent strength; credible team news; fixture congestion; managerial changes; and sourced xG where available. Record shots, shots on target, corners, cards and xG in optionalMetrics. Use team-level evidence only.

Set ResearchPack.generatedAt to the actual UTC time at which you complete the research response. Set each source retrievedAt to its actual UTC retrieval time. Every source retrievedAt must be no later than ResearchPack.generatedAt and must be within ${maximumSourceAgeHours} hours of import/validation.

Every evidence claim or populated evidence area must reference sourceIds declared in sources. Each source needs a unique ID, a direct HTTPS source URL, a non-empty title, and an ISO UTC retrieval timestamp. Prefer credible primary or official sources and cross-check conflicts.

Current-season evidence takes priority. Older seasons are secondary context only and must never override material squad or manager changes. Wherever evidence is unavailable, conflicting, or cannot be sourced, use null or the schema's "unknown" value as applicable. Never invent, estimate, infer, or backfill statistics; mark dataQuality "insufficient" where warranted. Do not omit a supplied fixture.

Prohibited content: odds; bookmaker prices; implied probability; payouts; bookmaker or tipster links; value claims; stake advice; player-specific markets; tipster opinions; predictions; selections; confidence grades; and accumulator suggestions. Include no player-specific evidence and no betting advice. Output only the JSON object, with no prose, commentary, or Markdown fences outside it.`;
}
export function parseAndValidateResearchPack(
  input: string,
  fixtures: FixturePack,
  settings: FreshnessOptions,
  validationTime: string = new Date().toISOString(),
): ValidationResult<ResearchPack> {
  if (/^\s*```/.test(input) || !/^\s*\{[\s\S]*\}\s*$/.test(input))
    return {
      valid: false,
      errors: [
        {
          code: "wrapped_json",
          path: "$",
          message:
            "Paste only the JSON object; prose and Markdown fences are not accepted.",
        },
      ],
      warnings: [],
    };
  const parsed = parseJson(input);
  if (!parsed.valid) return parsed as ValidationResult<ResearchPack>;
  return validateResearchPack(parsed.data, fixtures, settings, validationTime);
}

export const evidenceCategories = (
  fixture: ResearchFixture,
): { populated: string[]; missing: string[] } => {
  const entries: [string, unknown][] = [
    ["home team", fixture.homeEvidence],
    ["away team", fixture.awayEvidence],
    ["opponent strength", fixture.opponentStrength],
    ["team news", fixture.teamNews],
    ["fixture congestion", fixture.fixtureCongestion],
    ["managerial context", fixture.managerialContext],
  ];
  return {
    populated: entries
      .filter(([, value]) => value != null)
      .map(([name]) => name),
    missing: entries.filter(([, value]) => value == null).map(([name]) => name),
  };
};
