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
});
