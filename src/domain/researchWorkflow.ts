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
  return `Research every supplied Premier League and Championship fixture and return only strict ResearchPack v1 JSON with schemaVersion "1.3.0".

FixturePack reference: schema ${pack.schemaVersion}, date ${pack.fixtureDate}. Maximum source age: ${maximumSourceAgeHours} hours.
Fixtures: ${JSON.stringify(fixtures, null, 2)}

Require top-level packName, schemaVersion, fixturePackRef, generatedAt, dataStatus, sources, competitionBenchmarks, and fixtures. For each competition, competitionBenchmarks must contain currentSeasonCompletedFixtures, marketBenchmarks, and optionalMetrics. Each market benchmark requires marketKey, supported team-level marketGroup, selectionLabel, sampleSize, hits, supportPercent (number or null), and sourceIds. Use only completed current-season league fixtures; never mix cups, friendlies, prior seasons, or unsourced averages.

For both teams retain currentSeasonLeagueMatches; currentSeasonForm with summary, lastFive, lastTen, current home/away record, goalsScored, goalsConceded, and sourceIds; current-season marketHitRates; and sourced optionalMetrics (xG, shots, shotsOnTarget, corners, cards). Request every supported current-season team-level statistic needed for each populated market and the matching opponent evidence plus competition benchmark. Every populated item requires declared sourceIds. Missing evidence stays null/unknown or omitted where permitted; never insert a neutral default. Do not include historicalMarketHitRates, historicalRepresentativeness, prior-season results, historic venue records, or historic market rates.

Retain v1.2 context objects. teamNews, fixtureCongestion, and managerialContext require scope (home/away/both) and application (descriptive_only/candidate_penalty). Only known, current, sourced, candidate-relevant caution/material disruption may be candidate_penalty. Generic, unknown, neutral, positive, descriptive, non-directional, transfers, manager changes, or squad turnover without current candidate-relevant disruption are descriptive_only and have no numerical effect. opponentStrength is descriptive context.

Use team-level evidence only. Dedicated corners, cards, shots, and shots-on-target market evidence must never be inferred from goals. Exclude player markets, automated collection, predictions, selections, prices, bookmaker content, implied probability, expected value, payouts, links, and stake advice. Prefer primary sources, cross-check contradictions, and mark fixture dataQuality insufficient when core evidence is absent. Set actual UTC generatedAt/retrievedAt values and output JSON only without Markdown.`
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
