import { describe, expect, it } from 'vitest'
import fixtureSample from '../../samples/fixture-pack.v1.sample.json'
import type { FixturePack } from './types'
import { buildAnalysisPackPrompt } from './analysisWorkflow'
import { buildResearchPrompt } from './researchWorkflow'

const fixture = structuredClone(fixtureSample) as unknown as FixturePack
fixture.fixtures[0].fixtureId = 'real-fixture'
fixture.fixtures[0].homeTeam = 'Home FC'
fixture.fixtures[0].awayTeam = 'Away FC'
const prompts = () => [buildAnalysisPackPrompt('2026-09-03', ['Premier League']), buildResearchPrompt(fixture, { referenceTimestamp: '2026-09-03T08:00:00Z', maximumAgeHours: 24 })]

describe('v1.4 research acquisition policy', () => {
  it('embeds the complete ordered hierarchy and all 14 independently attempted families in both prompts', () => {
    for (const prompt of prompts()) {
      const hierarchy = ['1. Official Premier League / EFL fixture pages', '2. FootyStats', '3. SoccerStats', '4. StatBunker', '5. Direct completed-match pages', '6. WhoScored', '7. PROHIBITED']
      hierarchy.forEach((entry, index) => { expect(prompt).toContain(entry); if (index) expect(prompt.indexOf(entry)).toBeGreaterThan(prompt.indexOf(hierarchy[index - 1])) })
      for (const family of ['Match result', 'Double chance', 'Draw no bet', 'Both teams to score (BTTS)', 'Total goals', 'Team goals', 'Team to score', 'Clean sheets', 'Total corners', 'Team corners', 'Total cards', 'Team cards', 'Team shots', 'Team shots on target']) expect(prompt).toMatch(new RegExp(`\\d+\\. ${family.replace(/[()]/g, '\\$&')} — attempt`))
      expect(prompt).toContain('Attempt each market family independently')
    }
  })

  it('makes component ownership and fallback selection deterministic without duplicate handling', () => {
    for (const prompt of prompts()) {
      expect(prompt).toContain('preferred aggregate source')
      expect(prompt).toContain('fallback aggregate source only when FootyStats does not expose the exact required component')
      expect(prompt).toContain("Once a source supplies a valid component, retain that source's value and do not collect a fallback duplicate")
      expect(prompt).toContain('Never combine, average, merge or double-count')
      expect(prompt).toContain('conflicting values for the exact same current-season metric and scope')
      expect(prompt).toContain('treat only that market component as unreliable')
    }
  })

  it('restricts specialist sources and disallows averages, proxies, and player aggregation', () => {
    for (const prompt of prompts()) {
      expect(prompt).toContain('targeted fallback only for team discipline and team-card evidence')
      expect(prompt).toContain('never aggregate or sum player statistics into team evidence')
      expect(prompt).toContain('FotMob; then SofaScore; then official Premier League or EFL completed-match centre')
      expect(prompt).toContain('An average alone is never sufficient')
      expect(prompt).toContain('merely an average/proxy, omit that candidate market')
      expect(prompt).toContain('WhoScored — Premier League-only fallback')
    }
  })

  it('retains every mandatory candidate gate and defines unavailable as researched', () => {
    for (const prompt of prompts()) {
      for (const gate of ['exact candidate current-season threshold evidence', 'mandatory supporting_only opponent evidence', 'required current home/away venue evidence', 'exact same-marketKey, same-threshold competition benchmark', 'declared source citations for every populated component']) expect(prompt).toContain(gate)
      expect(prompt).toContain('it must never mean “not researched.”')
      expect(prompt).toContain('Include every discovered fixture even where all families are insufficient')
      expect(prompt).toContain('no exact current-season team-card threshold observations found after StatBunker, FotMob, SofaScore and official match-centre checks')
    }
  })
})
