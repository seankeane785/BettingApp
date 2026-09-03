import { describe, expect, it } from "vitest";
import fixtureSample from "../../samples/fixture-pack.v1.sample.json";
import type { FixturePack } from "./types";
import { MARKET_GROUPS } from "./types";
import { buildAnalysisPackPrompt } from "./analysisWorkflow";
import { CANONICAL_MARKET_MATRIX } from "./researchPromptPolicy";
import { MARKET_CONTRACT } from "./marketContract";
import { buildResearchPrompt } from "./researchWorkflow";

const fixture = structuredClone(fixtureSample) as unknown as FixturePack;
fixture.fixtures[0].fixtureId = "real-fixture";
fixture.fixtures[0].homeTeam = "Home FC";
fixture.fixtures[0].awayTeam = "Away FC";
const prompts = () => [
  buildAnalysisPackPrompt("2026-09-03", ["Premier League"]),
  buildResearchPrompt(fixture, {
    referenceTimestamp: "2026-09-03T08:00:00Z",
    maximumAgeHours: 24,
  }),
];
const occurrences = (text: string, needle: string) => text.split(needle).length - 1;

describe("v1.5 canonical research prompt policy", () => {
  it("defines all 14 displayed families once in one shared typed matrix", () => {
    expect(CANONICAL_MARKET_MATRIX.map(({ marketGroup }) => marketGroup)).toEqual(MARKET_GROUPS);
    for (const prompt of prompts()) {
      expect(occurrences(prompt, "CANONICAL MARKET MATRIX")).toBe(1);
      for (const { marketGroup, label } of CANONICAL_MARKET_MATRIX) {
        expect(occurrences(prompt, `[${marketGroup}]`)).toBe(1);
        expect(prompt).toContain(label);
      }
      expect(occurrences(prompt, "selectionLabel is contract data, not prose.")).toBe(1);
      for (const variant of MARKET_CONTRACT) {
        expect(occurrences(prompt, `${variant.marketKey}: threshold ${variant.threshold ?? "null"}; selectionLabel \`${variant.selectionLabel.template}\``)).toBe(1);
        for (const support of variant.support)
          expect(prompt).toContain(`${support.marketKey} (${support.marketGroup}, threshold ${support.threshold ?? "null"}, selectionLabel \`${support.selectionLabel.template}\`)`);
      }
      for (const heading of ["FIXTURE DISCOVERY:", "SOURCE HIERARCHY", "NO DOUBLE HANDLING:", "PRIVATE RESEARCH WORKFLOW", "OUTPUT INTEGRITY AND SOURCE CONTRACT:", "SCOPED CONTEXT:"])
        expect(occurrences(prompt, heading)).toBe(1);
    }
  });

  it("keeps goal families distinct and non-substitutable", () => {
    for (const prompt of prompts()) {
      const teamToScore = CANONICAL_MARKET_MATRIX.findIndex(({ marketGroup }) => marketGroup === "team_to_score");
      const rows = prompt.split("\n").filter((line) => /^\d+\./.test(line));
      const ttsRow = rows.find((line) => line.includes("[team_to_score]"))!;
      const teamGoalsRow = rows.find((line) => line.includes("[team_goals]"))!;
      const totalGoalsRow = rows.find((line) => line.includes("[total_goals]"))!;
      expect(teamToScore).toBeGreaterThan(-1);
      expect(ttsRow).toContain("threshold 0.5");
      expect(ttsRow).toContain("BTTS");
      expect(ttsRow).not.toMatch(/1\.5|2\.5/);
      expect(teamGoalsRow).toContain("threshold 1.5");
      expect(teamGoalsRow).toContain("threshold 2.5");
      expect(teamGoalsRow).toContain("never 0.5");
      expect(teamGoalsRow).toContain("team_to_score substitution");
      expect(totalGoalsRow).toContain("threshold 1.5");
      expect(totalGoalsRow).toContain("threshold 2.5");
      expect(totalGoalsRow).toContain("team-goal substitution");
      expect(rows.find((line) => line.includes("[both_teams_to_score]"))).toContain("team_to_score record");
    }
  });

  it("retains hierarchy, component ownership, gates, conflicts, and diagnostics", () => {
    for (const prompt of prompts()) {
      for (const source of ["Official Premier League / EFL", "FootyStats", "SoccerStats", "StatBunker", "FotMob", "WhoScored", "WinDrawWin", "Flashscore"])
        expect(prompt).toContain(source);
      for (const gate of ["exact candidate evidence", "mandatory supporting_only opponent evidence", "required venue evidence", "exact same-marketKey/same-threshold competition benchmark"])
        expect(prompt).toContain(gate);
      for (const diagnostic of ["missing candidate evidence", "missing supporting-only evidence", "missing required venue evidence", "missing matching benchmark", "source conflict", "no exact source-backed threshold observations"])
        expect(prompt).toContain(diagnostic);
      expect(prompt).toContain("never combine, average, merge, or double-count");
      expect(prompt).toContain("omit only the affected candidate");
      expect(prompt).toContain("attempt every row independently");
    }
  });

  it("renders import-safe v1.5 audit, derived-input, and empty-result contracts", () => {
    const auditFields = ['"marketGroup"', '"attempted"', '"routesAttempted"', '"candidateEvidenceFound"', '"supportEvidenceFound"', '"benchmarkFound"', '"status"', '"firstBlockingReason"', '"sourceIds"'];
    const marketGroups = ["match_result", "double_chance", "draw_no_bet", "both_teams_to_score", "total_goals", "team_goals", "team_to_score", "clean_sheet", "total_corners", "team_corners", "total_cards", "team_cards", "team_shots", "team_shots_on_target"];
    const routes = ["official_fixture", "footystats", "soccerstats", "fotmob", "sofascore", "official_match_centre", "statbunker", "whoscored"];
    const blockers = ["missing_candidate_observation", "missing_support_observation", "missing_venue_observation", "missing_benchmark", "source_conflict", "no_exact_threshold_observation"];
    const derivedShape = '{ "strategy": "derived_1x2_from_goals", "home": { "matchesPlayed": 2, "goalsScored": 0, "goalsConceded": 0, "sourceIds": ["declared-source-id"] }, "away": { "matchesPlayed": 2, "goalsScored": 0, "goalsConceded": 0, "sourceIds": ["declared-source-id"] }, "competitionCompletedFixtures": 1, "competitionPerTeamGoals": 1, "competitionSourceIds": ["declared-source-id"], "sourceConflict": false }';
    for (const prompt of prompts()) {
      expect(prompt).toContain("ResearchPack.marketResearchAudit (JSON path $.researchPack.marketResearchAudit inside AnalysisPack, or $.marketResearchAudit for a standalone ResearchPack)");
      for (const value of [...marketGroups, ...routes, ...blockers, "available", "unavailable"]) expect(prompt).toContain(value);
      for (const field of auditFields) expect(prompt).toContain(field);
      expect(prompt).toContain("one and only one entry for each of the 14 marketGroup enum values");
      expect(prompt).toContain("sourceIds is a non-empty array of unique, non-empty IDs declared in ResearchPack.sources");
      expect(prompt).toContain("additional properties are forbidden");
      expect(prompt).toContain("ResearchPack.fixtures[].derived1x2FromGoals (JSON path $.researchPack.fixtures[].derived1x2FromGoals inside AnalysisPack)");
      expect(prompt).toContain(derivedShape);
      expect(prompt).toContain('{ "matchesPlayed": 1, "goalsScored": 0, "goalsConceded": 0, "sourceIds": ["declared-source-id"] }');
      expect(prompt).toContain("FormFirst—not ChatGPT Search—calculates the seven Poisson-derived result outputs");
      expect(prompt).toContain("FixturePack.fixtures: [], ResearchPack.fixtures: [], ResearchPack.competitionBenchmarks: [], and ResearchPack.marketResearchAudit: []");
      expect(prompt).toContain("No scheduled fixtures for the selected date and competitions");
      expect(prompt).not.toMatch(/"(?:field|property|value|key)(?:Name)?"/i);
      expect(prompt).not.toContain("...");
    }
  });
});
