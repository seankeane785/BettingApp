export const SUPPORTED_COMPETITIONS = ['Premier League', 'Championship', 'League One', 'League Two'] as const
export type Competition = (typeof SUPPORTED_COMPETITIONS)[number]
export interface KickOff { utc: string; localDate: string; localTime: string; timezone: 'Europe/London' }
export interface Fixture { fixtureId: string; competition: Competition; homeTeam: string; awayTeam: string; kickOff: KickOff }
export interface FixturePack { packName: 'FixturePack v1'; schemaVersion: '1.0.0'; fixtureDate: string; generatedAt: string; competitions: Competition[]; fixtures: Fixture[] }
export interface SourceReference { sourceId: string; url: string; title: string; retrievedAt: string }
export interface ResearchFixture { fixtureId: string; competition: Competition; homeTeam: string; awayTeam: string; homeEvidence?: unknown; awayEvidence?: unknown; opponentStrength?: unknown; teamNews?: unknown; fixtureCongestion?: unknown; managerialContext?: unknown; dataQuality?: 'complete' | 'partial' | 'insufficient'; [key: string]: unknown }
export interface ResearchPack { packName: 'ResearchPack v1'; schemaVersion: '1.0.0'; fixturePackRef: { schemaVersion: '1.0.0'; fixtureDate: string }; generatedAt: string; dataStatus: 'synthetic' | 'real'; sources: SourceReference[]; fixtures: ResearchFixture[] }
export interface SavedAnalysisRun { packName: 'SavedAnalysisRun v1'; schemaVersion: '1.0.0'; runId: string; createdAt: string; dataStatus: 'synthetic' | 'real'; [key: string]: unknown }
export interface ValidationIssue { code: string; path: string; message: string }
export interface ValidationResult<T> { valid: boolean; data?: T; errors: ValidationIssue[]; warnings: ValidationIssue[] }
export interface FreshnessOptions { referenceTimestamp: string; maximumAgeHours: number }
