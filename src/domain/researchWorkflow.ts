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
  return `Research every supplied Premier League and Championship fixture and return only strict ResearchPack v1 JSON with schemaVersion "1.4.0".

FixturePack reference: schema ${pack.schemaVersion}, date ${pack.fixtureDate}. Maximum source age: ${maximumSourceAgeHours} hours.
Fixtures: ${JSON.stringify(fixtures, null, 2)}

Require top-level packName, schemaVersion, fixturePackRef, generatedAt, dataStatus, sources, competitionBenchmarks, and fixtures. Every source object must contain exactly { "sourceId": "non-empty kebab-case string", "url": "HTTPS URL", "title": "non-empty string", "retrievedAt": "ISO 8601 UTC timestamp ending in Z" } and no other properties. sourceId is the only source ID field: never use id or both fields. It must match ^[a-z0-9]+(?:-[a-z0-9]+)*$; examples include "src-ch-results" and "official-match-centre". For each competition, competitionBenchmarks must contain currentSeasonCompletedFixtures, marketBenchmarks, and optionalMetrics. Each market benchmark requires marketKey, matching threshold, supported team-level marketGroup, selectionLabel, sampleSize, hits, supportPercent (number or null), and sourceIds. Use only completed current-season league fixtures; never mix cups, friendlies, prior seasons, or unsourced averages.

For both teams retain currentSeasonLeagueMatches; currentSeasonForm with summary, lastFive, lastTen, current home/away record, goalsScored, goalsConceded, and sourceIds; current-season marketHitRates with evidenceRole candidate_market or supporting_only; and sourced optionalMetrics (xG, shots, shotsOnTarget, corners, cards). Request all supported candidate-market statistics and every matrix-required opponent/support statistic. supporting_only evidence supports its matching candidate and is never itself a candidate market. Request current team-level xG, shots, shots on target, corners, and cards only where credibly sourced. Every candidate_market requires the same market key and threshold current-season competition benchmark. Every populated item requires declared sourceIds. Unknown or unavailable evidence stays absent, null, or unknown as permitted; never insert a neutral default. Do not include historicalMarketHitRates, historicalRepresentativeness, prior-season results, historic venue records, or historic market rates.

Retain v1.2 context objects. teamNews, fixtureCongestion, and managerialContext require scope (home/away/both) and application (descriptive_only/candidate_penalty). Only known, current, sourced, candidate-relevant caution/material disruption may be candidate_penalty. Generic, unknown, neutral, positive, descriptive, non-directional, transfers, manager changes, or squad turnover without current candidate-relevant disruption are descriptive_only and have no numerical effect. opponentStrength is descriptive context.

Research all supported team-level market families, but never invent evidence. Before declaring specialist markets unavailable, manually search credible sources such as official competition match centres or established statistics providers for dedicated current-season statistics; do not use automated collection.

For total/team corners require dedicated threshold hit rates (for example match over 8.5/9.5 or team over 3.5/4.5), candidate_market candidate records, supporting_only opponent corners-for/corners-conceded threshold records, and exact same-key/same-threshold current-season benchmarks. Never infer these from goals, possession, shots, or generic averages. For total/team cards require dedicated threshold hit rates (for example match over 2.5/3.5 or team over 0.5/1.5), candidate_market candidate records, supporting_only opponent discipline/card threshold records, and exact matching benchmarks. Never infer these from referee averages, fouls, goals, or generic averages alone. For team shots require dedicated thresholds such as 8+ or 10+, supporting_only opponent shots-allowed threshold evidence, and an exact matching benchmark; never derive them from goals, xG alone, possession, or narrative reporting. For team shots on target require dedicated thresholds such as 3+ or 4+, supporting_only opponent shots-on-target-allowed threshold evidence, and an exact matching benchmark; never derive them from goals, shots, xG alone, possession, or narrative reporting.

For result, double chance, and draw-no-bet retain candidate_market current W/D/L outcome evidence, relevant home/away sample, required opponent outcome support, and an exact matching current-season benchmark; generic form summaries are not substitute candidate evidence. Include candidate_market only when exact candidate evidence exists. Missing exact candidate evidence, required support, or matching benchmark leaves the market unavailable; proxies, inferred evidence, and neutral defaults are forbidden. Manual market-availability dropdowns are availability/settlement metadata only: they are not evidence, cannot fill research gaps, and do not affect probability, confidence, evidence quality, or candidate creation.

Use team-level evidence only. Exclude player markets, automated collection, prior-season data, predictions, selections, prices, bookmaker content, tipster content, implied probability, expected value, payouts, links, and stake advice. Prefer primary sources, cross-check contradictions, and mark fixture dataQuality insufficient when core evidence is absent. Set actual UTC generatedAt/retrievedAt values and output JSON only without Markdown.`
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
