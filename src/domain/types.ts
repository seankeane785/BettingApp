export const SUPPORTED_COMPETITIONS = ['Premier League', 'Championship'] as const
export type Competition = (typeof SUPPORTED_COMPETITIONS)[number]
export interface KickOff { utc: string; localDate: string; localTime: string; timezone: 'Europe/London' }
export interface Fixture { fixtureId: string; competition: Competition; homeTeam: string; awayTeam: string; kickOff: KickOff }
export interface FixturePack { packName: 'FixturePack v1'; schemaVersion: '1.0.0'; fixtureDate: string; generatedAt: string; competitions: Competition[]; fixtures: Fixture[] }
export interface SourceReference { sourceId: string; url: string; title: string; retrievedAt: string }
export const MARKET_GROUPS = ['match_result', 'double_chance', 'draw_no_bet', 'both_teams_to_score', 'total_goals', 'team_goals', 'team_to_score', 'clean_sheet', 'total_corners', 'team_corners', 'total_cards', 'team_cards', 'team_shots', 'team_shots_on_target'] as const
export type MarketGroup = (typeof MARKET_GROUPS)[number]
export type MarketAvailability = 'unknown' | 'available' | 'unavailable'
export type TeamSide = 'home' | 'away' | 'both' | 'match'
export interface MarketEvidence { marketKey: string; marketGroup: MarketGroup; selectionLabel: string; teamSide: TeamSide; threshold: number | null; sampleSize: number; hits: number; recentSampleSize: number; recentHits: number; venueSampleSize: number | null; venueHits: number | null; underlyingSupportPercent: number | null; sourceIds: string[] }
export interface TeamEvidence { currentSeasonForm: { summary: string; lastFive: string | null; lastTen: string | null; homeOrAway: string | null; goalsScored: number | null; goalsConceded: number | null; sourceIds: string[] }; marketHitRates: MarketEvidence[]; optionalMetrics: Record<string, { value: number | null; sourceIds: string[] } | null> }
export interface ContextEvidence { status: 'known' | 'unknown'; impact: 'positive' | 'neutral' | 'caution' | 'material' | 'unknown'; detail: string | null; sourceIds: string[] }
export interface ResearchFixture { fixtureId: string; competition: Competition; homeTeam: string; awayTeam: string; homeEvidence: TeamEvidence; awayEvidence: TeamEvidence; opponentStrength: ContextEvidence; teamNews: ContextEvidence; fixtureCongestion: ContextEvidence; managerialContext: ContextEvidence; reasonsFor: string[]; reasonsAgainst: string[]; dataQuality: 'complete' | 'partial' | 'insufficient' }
export interface ResearchPack { packName: 'ResearchPack v1'; schemaVersion: '1.0.0'; fixturePackRef: { schemaVersion: '1.0.0'; fixtureDate: string }; generatedAt: string; dataStatus: 'synthetic' | 'real'; sources: SourceReference[]; fixtures: ResearchFixture[] }
export type ManualOutcome = 'pending' | 'won' | 'lost' | 'void'
export interface RecordedOutcome { outcome: ManualOutcome; updatedAt: string | null }
export interface SavedAnalysisRun {
  packName: 'SavedAnalysisRun v1'; schemaVersion: '1.0.0'; runId: string; createdAt: string; generatedAt: string
  dataStatus: 'synthetic' | 'real'; fixturePackRef: { packName: 'FixturePack v1'; schemaVersion: '1.0.0'; fixtureDate: string }
  researchPackRef: { packName: 'ResearchPack v1'; schemaVersion: '1.0.0'; fixtureDate: string }
  modelVersion: string; settings: ModelSettings & { deterministic: true }
  analysisInputs: { fixturePack: FixturePack; researchPack: ResearchPack }
  validation: { valid: true; errors: ValidationIssue[]; warnings: ValidationIssue[] }
  candidates: CandidateSelection[]; builders: { highProbability: BuilderOutcome; balanced: BuilderOutcome }
  results: { builders: Record<BuilderKind, RecordedOutcome>; legs: Record<string, RecordedOutcome>; updatedAt: string | null }
}
export interface ValidationIssue { code: string; path: string; message: string }
export interface ValidationResult<T> { valid: boolean; data?: T; errors: ValidationIssue[]; warnings: ValidationIssue[] }
export interface FreshnessOptions { referenceTimestamp: string; maximumAgeHours: number }

export interface ModelSettings { referenceTimestamp: string; maximumSourceAgeHours: number; marketAvailability: Record<MarketGroup, MarketAvailability> }
export type Confidence = 'Strong' | 'Good' | 'Moderate' | 'Avoid'
export type CandidateDataQuality = 'qualifying' | 'usable_partial' | 'stale' | 'contradictory' | 'insufficient' | 'unsourced'
export interface CandidateEvidence { sourceIds: string[]; hitRatePercent: number; sampleSize: number; componentScores: { hitRate: number; reliability: number; recentForm: number; venue: number; underlying: number; opponentContext: number; cautionPenalty: number } }
export interface CorrelationMetadata { fixtureId: string; teamSide: TeamSide; family: string; relationships: string[] }
export interface CandidateSelection { id: string; fixtureId: string; competition: Competition; homeTeam: string; awayTeam: string; marketKey: string; marketGroup: MarketGroup; selectionLabel: string; estimatedProbability: number; confidence: Confidence; dataQuality: CandidateDataQuality; supportingEvidence: CandidateEvidence; reasonsFor: string[]; reasonsAgainst: string[]; modelVersion: string; fixtureSchemaVersion: string; researchSchemaVersion: string; manualMarketVerificationRequired: boolean; manualMarketVerificationReason: string | null; correlation: CorrelationMetadata }
export interface RejectedCombination { candidateIds: string[]; reason: string; principalRisk: string }
export type BuilderKind = 'high_probability' | 'balanced'
export interface BuilderSuccess { status: 'builder'; kind: BuilderKind; selectedLegs: CandidateSelection[]; fixtureGroups: { fixtureId: string; candidateIds: string[] }[]; estimatedCombinedProbability: number; overallConfidence: Confidence; sourceIds: string[]; principalRisks: string[]; correlationNotes: string[]; rejectedCombinations: RejectedCombination[]; modelVersion: string; schemaVersions: { fixture: string; research: string } }
export interface NoQualifyingBuilder { status: 'no_qualifying_builder'; kind: BuilderKind; reason: string; principalRisks: string[]; rejectedCombinations: RejectedCombination[]; modelVersion: string; schemaVersions: { fixture: string; research: string } }
export type BuilderOutcome = BuilderSuccess | NoQualifyingBuilder
export interface AnalysisOutput { modelVersion: string; settings: ModelSettings; candidates: CandidateSelection[]; builders: { highProbability: BuilderOutcome; balanced: BuilderOutcome } }
