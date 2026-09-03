import type {
  FixturePack,
  FreshnessOptions,
  ResearchFixture,
  ResearchPack,
  ValidationResult,
} from "./types";
import { parseJson, validateResearchPack } from "./validation";
import { RESEARCH_ACQUISITION_POLICY } from "./researchPromptPolicy";

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
  return `Research every supplied Premier League and Championship fixture and return only strict ResearchPack v1 JSON with schemaVersion "1.5.0".

FixturePack reference: schema ${pack.schemaVersion}, date ${pack.fixtureDate}. Maximum source age: ${maximumSourceAgeHours} hours.
Fixtures: ${JSON.stringify(fixtures, null, 2)}

FIXTURE DISCOVERY: The supplied FixturePack is authoritative; do not discover replacements or omit fixtures. Verify each fixture with the official competition source and return exactly one matching research fixture for every supplied fixture, including insufficient fixtures.

${RESEARCH_ACQUISITION_POLICY}

For each team retain currentSeasonLeagueMatches, currentSeasonForm, marketHitRates with evidenceRole, and credibly sourced optionalMetrics. Do not include historicalMarketHitRates or historicalRepresentativeness. Mark dataQuality insufficient when core evidence is absent. Output JSON only without Markdown.`
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
