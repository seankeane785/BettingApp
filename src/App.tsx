import { useState } from 'react'
import { analyse, defaultModelSettings } from './domain/analysisModel'
import { CONFIDENCE_ORDER, formatManualEntryList, groupCandidatesByFixture, invalidateAnalysis, isExcludedFromBuilders, noBuilderDisplay, SETTLEMENT_STATEMENT } from './domain/analysisPresentation'
import { buildFixturePrompt, parseAndValidateFixturePack } from './domain/fixtureWorkflow'
import { buildResearchPrompt, evidenceCategories, getResearchGate, parseAndValidateResearchPack, validateFreshnessSettings } from './domain/researchWorkflow'
import { MARKET_GROUPS, SUPPORTED_COMPETITIONS, type AnalysisOutput, type BuilderOutcome, type Competition, type FixturePack, type MarketAvailability, type MarketGroup, type ResearchPack, type ValidationResult } from './domain/types'

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' })

function App() {
  const [date, setDate] = useState(today)
  const [competitions, setCompetitions] = useState<Competition[]>([...SUPPORTED_COMPETITIONS])
  const [prompt, setPrompt] = useState('')
  const [criteriaError, setCriteriaError] = useState('')
  const [copyStatus, setCopyStatus] = useState('')
  const [pastedJson, setPastedJson] = useState('')
  const [validation, setValidation] = useState<ValidationResult<FixturePack> | null>(null)
  const [referenceTimestamp, setReferenceTimestamp] = useState(new Date().toISOString())
  const [maximumAgeHours, setMaximumAgeHours] = useState(24)
  const [researchPrompt, setResearchPrompt] = useState('')
  const [researchJson, setResearchJson] = useState('')
  const [researchValidation, setResearchValidation] = useState<ValidationResult<ResearchPack> | null>(null)
  const [researchFeedback, setResearchFeedback] = useState('')
  const [marketAvailability, setMarketAvailability] = useState(defaultModelSettings('', 0).marketAvailability)
  const [analysis, setAnalysis] = useState<AnalysisOutput | null>(null)
  const [analysisCopyStatus, setAnalysisCopyStatus] = useState<Record<string, string>>({})

  const toggleCompetition = (competition: Competition) => setCompetitions((current) => current.includes(competition) ? current.filter((item) => item !== competition) : [...current, competition])
  const generate = () => { try { setPrompt(buildFixturePrompt({ date, competitions })); setCriteriaError(''); setCopyStatus('') } catch (error) { setCriteriaError(error instanceof Error ? error.message : 'Unable to generate prompt.'); setPrompt('') } }
  const copy = async () => { try { if (!navigator.clipboard) throw new Error(); await navigator.clipboard.writeText(prompt); setCopyStatus('Prompt copied to clipboard.') } catch { setCopyStatus('Copy failed. Select the prompt text and copy it manually.') } }
  const validate = () => { setValidation(parseAndValidateFixturePack(pastedJson)); setAnalysis(invalidateAnalysis(analysis)) }
  const clear = () => { setPrompt(''); setCriteriaError(''); setCopyStatus(''); setPastedJson(''); setValidation(null); setAnalysis(invalidateAnalysis(analysis)) }
  const fixturePack = validation?.valid ? validation.data : undefined
  const researchGate = getResearchGate(fixturePack)
  const freshness = { referenceTimestamp, maximumAgeHours }
  const generateResearch = () => { try { if (!fixturePack) throw new Error('Validate a FixturePack first.'); setResearchPrompt(buildResearchPrompt(fixturePack, freshness)); setResearchFeedback('Research prompt generated from the validated fixtures.') } catch (error) { setResearchPrompt(''); setResearchFeedback(error instanceof Error ? error.message : 'Unable to generate research prompt.') } }
  const validateResearch = () => { setAnalysis(invalidateAnalysis(analysis)); if (!fixturePack) return; const error = validateFreshnessSettings(freshness); if (error) { setResearchValidation({ valid: false, errors: [{ code: 'invalid_freshness_settings', path: '$', message: error }], warnings: [] }); return } setResearchValidation(parseAndValidateResearchPack(researchJson, fixturePack, freshness)) }
  const clearResearch = () => { setResearchPrompt(''); setResearchJson(''); setResearchValidation(null); setResearchFeedback(''); setAnalysis(invalidateAnalysis(analysis)) }

  const readyResearch = researchValidation?.valid && researchValidation.data?.dataStatus === 'real' ? researchValidation.data : undefined
  const canAnalyse = researchGate === 'ready' && Boolean(fixturePack && readyResearch)
  const generateAnalysis = () => { if (fixturePack && readyResearch) setAnalysis(analyse(fixturePack, readyResearch, { referenceTimestamp, maximumSourceAgeHours: maximumAgeHours, marketAvailability })) }
  const changeAvailability = (group: MarketGroup, value: MarketAvailability) => { const next = { ...marketAvailability, [group]: value }; setMarketAvailability(next); if (fixturePack && readyResearch) setAnalysis(analyse(fixturePack, readyResearch, { referenceTimestamp, maximumSourceAgeHours: maximumAgeHours, marketAvailability: next })) }
  const copyEntryList = async (key: string, text: string) => { try { if (!navigator.clipboard) throw new Error(); await navigator.clipboard.writeText(text); setAnalysisCopyStatus(current => ({ ...current, [key]: 'Manual entry list copied.' })) } catch { setAnalysisCopyStatus(current => ({ ...current, [key]: 'Copy unavailable. Select the list and copy it manually.' })) } }
  const sourceFor = (id: string) => readyResearch?.sources.find(source => source.sourceId === id)
  const renderBuilder = (title: string, outcome: BuilderOutcome) => { const empty = noBuilderDisplay(outcome); if (outcome.status === 'no_qualifying_builder') return <article className="builder-card"><h3>{title}</h3><strong>{empty!.title}</strong><p>{empty!.reason}</p>{outcome.principalRisks.map(risk => <p key={risk}>Principal risk: {risk}</p>)}</article>; const entry = formatManualEntryList(outcome, fixturePack!); return <article className="builder-card"><h3>{title}</h3><dl className="summary"><div><dt>Correlation-adjusted combined probability</dt><dd>{outcome.estimatedCombinedProbability}%</dd></div><div><dt>Overall confidence</dt><dd>{outcome.overallConfidence}</dd></div><div><dt>Legs</dt><dd>{outcome.selectedLegs.length}</dd></div></dl>{outcome.fixtureGroups.map(group => { const legs = group.candidateIds.map(id => outcome.selectedLegs.find(leg => leg.id === id)).filter(Boolean); const first = legs[0]; return first && <section key={group.fixtureId}><h4>{first.homeTeam} v {first.awayTeam}</h4><ul>{legs.map(leg => leg && <li key={leg.id}>{leg.selectionLabel}</li>)}</ul></section> })}<h4>Supporting sources</h4><ul>{outcome.sourceIds.map(id => { const source = sourceFor(id); return <li key={id}>{source ? <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a> : id}</li> })}</ul><h4>Principal risks</h4><ul>{outcome.principalRisks.length ? outcome.principalRisks.map(risk => <li key={risk}>{risk}</li>) : <li>No additional risk note was generated.</li>}</ul><h4>Correlation notes</h4><ul>{outcome.correlationNotes.length ? outcome.correlationNotes.map(note => <li key={note}>{note}</li>) : <li>No same-match or cross-fixture adjustment applied.</li>}</ul><p><strong>{SETTLEMENT_STATEMENT}</strong></p><div className="manual-list"><h4>Manual Paddy Power entry list</h4><p><strong>Manual verification required</strong></p><pre tabIndex={0}>{entry}</pre><button type="button" onClick={() => copyEntryList(outcome.kind, entry)}>Copy entry list</button><p role="status" aria-live="polite">{analysisCopyStatus[outcome.kind]}</p></div></article> }

  return <main>
    <section className="hero" aria-labelledby="page-title">
      <p className="eyebrow">Local-first · Manual analysis</p><h1 id="page-title">FormFirst</h1>
      <p className="intro">A focused workspace for consistent, team-level football analysis—kept entirely in your browser.</p>
      <ul className="league-list" aria-label="Supported competitions">{SUPPORTED_COMPETITIONS.map((league) => <li key={league}>{league}</li>)}</ul>
    </section>

    <section className="workflow" aria-labelledby="workflow-title">
      <p className="stage-number">Stage 03 · Fixture workflow</p><h2 id="workflow-title">Choose fixtures to find</h2>
      <p>Set explicit criteria, copy the deterministic prompt into ChatGPT Search manually, then paste its complete JSON response below.</p>
      <div className="criteria">
        <label>Analysis date <input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
        <fieldset><legend>Competitions (select one or more)</legend>{SUPPORTED_COMPETITIONS.map((league) => <label className="check" key={league}><input type="checkbox" checked={competitions.includes(league)} onChange={() => toggleCompetition(league)} /> {league}</label>)}</fieldset>
      </div>
      <button type="button" onClick={generate}>Generate fixture prompt</button>
      {criteriaError && <p className="feedback error" role="alert">{criteriaError}</p>}
      {prompt && <div className="prompt-panel"><div className="panel-heading"><h3>Prompt</h3><button type="button" onClick={copy}>Copy prompt</button></div><pre tabIndex={0}>{prompt}</pre><p className="feedback" role="status">{copyStatus}</p></div>}

      <div className="import-panel">
        <h2>Validate FixturePack v1</h2>
        <label htmlFor="fixture-json">Complete FixturePack v1 JSON response</label>
        <textarea id="fixture-json" rows={12} value={pastedJson} onChange={(event) => { setPastedJson(event.target.value); setValidation(null); setAnalysis(invalidateAnalysis(analysis)) }} placeholder='Paste the single JSON object here. Prose and Markdown fences are rejected.' />
        <div className="actions"><button type="button" onClick={validate}>Validate pasted JSON</button><button type="button" className="secondary" onClick={clear}>Clear current workflow</button></div>
      </div>

      {validation && <section className="results" aria-live="polite" aria-labelledby="results-title"><h2 id="results-title">Validation results</h2>
        <p className={validation.valid ? 'success' : 'error'}>{validation.valid ? 'FixturePack is valid.' : 'FixturePack is not valid.'}</p>
        {[...validation.errors, ...validation.warnings].length > 0 && <ul className="issues">{validation.errors.map((item) => <li key={`${item.path}-${item.code}`}><strong>Error · {item.code}</strong><code>{item.path}</code>{item.message}</li>)}{validation.warnings.map((item) => <li key={`${item.path}-${item.code}`}><strong>Warning · {item.code}</strong><code>{item.path}</code>{item.message}</li>)}</ul>}
        {validation.valid && validation.data && <><dl className="summary"><div><dt>Pack version</dt><dd>{validation.data.schemaVersion}</dd></div><div><dt>Fixture count</dt><dd>{validation.data.fixtures.length}</dd></div><div><dt>Analysis date</dt><dd>{validation.data.fixtureDate}</dd></div></dl>
          {validation.data.fixtures.length === 0 ? <p>No scheduled fixtures were supplied for this day.</p> : <div className="table-wrap"><table><caption>Validated fixture preview</caption><thead><tr><th>Competition</th><th>Local kick-off</th><th>Home team</th><th>Away team</th></tr></thead><tbody>{validation.data.fixtures.map((fixture) => <tr key={fixture.fixtureId}><td>{fixture.competition}</td><td>{fixture.kickOff.localDate} {fixture.kickOff.localTime}</td><td>{fixture.homeTeam}</td><td>{fixture.awayTeam}</td></tr>)}</tbody></table></div>}</>}
      </section>}
      <section className="research" aria-labelledby="research-title">
        <p className="stage-number">Stage 04 · Research workflow</p><h2 id="research-title">Build and validate team research</h2>
        {researchGate === 'missing' && <p>Research is unavailable until a valid FixturePack v1 containing fixtures is accepted.</p>}
        {researchGate === 'empty' && <p className="success">No research pack is required because there are no qualifying fixtures.</p>}
        {researchGate === 'synthetic' && <p className="warning" role="alert"><strong>Test-data warning:</strong> This synthetic FixturePack cannot be used for a real research workflow.</p>}
        {researchGate === 'ready' && <><p>Set explicit freshness rules, generate a prompt for ChatGPT Search, then paste the complete strict JSON response. Nothing is fetched or stored.</p>
          <div className="freshness"><label>ISO reference timestamp<input type="text" value={referenceTimestamp} onChange={event => { setReferenceTimestamp(event.target.value); setResearchValidation(null); setAnalysis(invalidateAnalysis(analysis)) }} /></label><label>Maximum source age (hours)<input type="number" min="0" step="1" value={maximumAgeHours} onChange={event => { setMaximumAgeHours(Number(event.target.value)); setResearchValidation(null); setAnalysis(invalidateAnalysis(analysis)) }} /></label></div>
          <button type="button" onClick={generateResearch}>Generate research prompt</button><p className="feedback" role="status">{researchFeedback}</p>
          {researchPrompt && <div className="prompt-panel"><div className="panel-heading"><h3>Research prompt</h3><button type="button" onClick={() => navigator.clipboard?.writeText(researchPrompt).then(() => setResearchFeedback('Research prompt copied.')).catch(() => setResearchFeedback('Copy failed. Select and copy the prompt manually.'))}>Copy prompt</button></div><pre tabIndex={0}>{researchPrompt}</pre></div>}
          <div className="import-panel"><h3>Validate ResearchPack v1</h3><label htmlFor="research-json">Complete ResearchPack v1 JSON response</label><textarea id="research-json" rows={14} value={researchJson} onChange={event => { setResearchJson(event.target.value); setResearchValidation(null); setAnalysis(invalidateAnalysis(analysis)) }} placeholder="Paste only one strict JSON object. Prose and Markdown fences are rejected." /><div className="actions"><button type="button" onClick={validateResearch}>Validate research JSON</button><button type="button" className="secondary" onClick={clearResearch}>Clear research only</button></div></div>
          {researchValidation && <div className="results" aria-live="polite"><h3>Research validation results</h3><p className={researchValidation.valid ? 'success' : 'error'}>{researchValidation.valid ? 'ResearchPack is valid.' : 'ResearchPack is not valid.'}</p>{[...researchValidation.errors, ...researchValidation.warnings].length > 0 && <ul className="issues">{researchValidation.errors.map(item => <li key={`e-${item.path}-${item.code}`}><strong>Error · {item.code}</strong><code>{item.path}</code>{item.message}</li>)}{researchValidation.warnings.map(item => <li key={`w-${item.path}-${item.code}`}><strong>Warning · {item.code}</strong><code>{item.path}</code>{item.message}</li>)}</ul>}
            {researchValidation.valid && <p className="success" role="status">Analysis inputs are ready for deliberate generation below.</p>}
            {researchValidation.valid && researchValidation.data && researchValidation.data.fixtures.map(fixture => { const categories = evidenceCategories(fixture); const cited = new Set<string>(); JSON.stringify(fixture, (key, value) => { if (key === 'sourceIds' && Array.isArray(value)) value.forEach(id => cited.add(String(id))); return value }); const usedSources = researchValidation.data!.sources.filter(source => cited.has(source.sourceId)); const times = usedSources.map(source => source.retrievedAt).sort(); return <article className="evidence-card" key={fixture.fixtureId}><h3>{fixture.homeTeam} v {fixture.awayTeam}</h3><dl className="summary"><div><dt>Data quality</dt><dd>{fixture.dataQuality}</dd></div><div><dt>Source count</dt><dd>{usedSources.length}</dd></div><div><dt>Retrieval range</dt><dd>{times.length ? `${times[0]} — ${times[times.length - 1]}` : 'None'}</dd></div></dl><p><strong>Populated evidence:</strong> {categories.populated.join(', ') || 'None'}</p><p><strong>Missing evidence:</strong> {categories.missing.join(', ') || 'None'}</p><ul>{usedSources.map(source => <li key={source.sourceId}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a> <small>({source.retrievedAt})</small></li>)}</ul></article> })}</div>}
        </>}
        <div className="research-guardrails"><p>Verify market availability and settlement rules in Paddy Power before placing.</p><p>18+; analysis only; only stake what you can afford to lose.</p></div>
      </section>
      <section className="analysis" aria-labelledby="analysis-title"><p className="stage-number">Stage 06 · Analysis results</p><h2 id="analysis-title">Generate deterministic analysis</h2><p>Availability defaults to unknown. Unknown does not confirm availability; every selection still requires manual Paddy Power verification.</p><div className="market-grid">{MARKET_GROUPS.map(group => <label key={group}>{group.replaceAll('_', ' ')}<select value={marketAvailability[group]} onChange={event => changeAvailability(group, event.target.value as MarketAvailability)}><option value="unknown">Unknown</option><option value="available">Available</option><option value="unavailable">Unavailable</option></select></label>)}</div><button type="button" disabled={!canAnalyse} onClick={generateAnalysis}>Generate analysis</button>{!canAnalyse && <p>Validate matching, non-synthetic fixture and research packs to enable analysis.</p>}
        {!analysis && <div className="empty-state"><h3>No analysis generated</h3><p>Results appear only after you deliberately generate analysis.</p></div>}
        {analysis && <div className="analysis-results"><section><h3>Results overview</h3><dl className="summary"><div><dt>Model</dt><dd>{analysis.modelVersion}</dd></div><div><dt>Fixture schema</dt><dd>{fixturePack?.schemaVersion}</dd></div><div><dt>Research schema</dt><dd>{readyResearch?.schemaVersion}</dd></div><div><dt>Fixture count</dt><dd>{fixturePack?.fixtures.length}</dd></div><div><dt>Data quality</dt><dd>{analysis.candidates.filter(candidate => candidate.dataQuality === 'qualifying').length} qualifying / {analysis.candidates.length} total</dd></div></dl><p>Estimated probabilities are evidence-model outputs, not bookmaker prices or implied probabilities.</p><p>{SETTLEMENT_STATEMENT}</p><p>18+; analysis only; only stake what you can afford to lose.</p><p>The tool does not place bets, connect to Paddy Power, access accounts or advise stakes.</p></section>
          <section><h3>Candidate selections</h3>{analysis.candidates.length === 0 && <p>No candidates qualify under the configured market availability.</p>}{groupCandidatesByFixture(analysis.candidates).map(group => <article className="candidate-fixture" key={group.fixtureId}><h4>{group.homeTeam} v {group.awayTeam}</h4>{CONFIDENCE_ORDER.map(confidence => { const candidates = group.candidates.filter(candidate => candidate.confidence === confidence); return <section className={`confidence-group confidence-${confidence.toLowerCase()}`} key={confidence}><h5>{confidence}</h5>{candidates.length === 0 ? <p>No {confidence} candidates.</p> : candidates.map(candidate => <article className="candidate-card" key={candidate.id}><h6>{candidate.selectionLabel}</h6><p><strong>{candidate.estimatedProbability}% estimated probability · {candidate.confidence}</strong></p><p>Data quality: {candidate.dataQuality}</p><p>Manual market verification: {candidate.manualMarketVerificationRequired ? `Required — ${candidate.manualMarketVerificationReason}` : 'Still required before placing.'}</p>{isExcludedFromBuilders(candidate) && <p className="excluded"><strong>Excluded from builders:</strong> confidence does not meet builder eligibility.</p>}<div className="reason-grid"><div><strong>Reasons for</strong><ul>{candidate.reasonsFor.map(reason => <li key={reason}>{reason}</li>)}</ul></div><div><strong>Reasons against</strong><ul>{candidate.reasonsAgainst.length ? candidate.reasonsAgainst.map(reason => <li key={reason}>{reason}</li>) : <li>No additional reason supplied.</li>}</ul></div></div><p>Model: {candidate.modelVersion} · Fixture schema: {candidate.fixtureSchemaVersion} · Research schema: {candidate.researchSchemaVersion}</p><p>Correlation family: {candidate.correlation.family}{candidate.correlation.relationships.length ? ` — ${candidate.correlation.relationships.join('; ')}` : ' — no candidate-level relationship noted.'}</p><ul>{candidate.supportingEvidence.sourceIds.map(id => { const source = sourceFor(id); return <li key={id}>{source ? <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a> : id}</li>})}</ul></article>)}</section>})}</article>)}</section>
          <section className="builders"><h3>Builders</h3>{renderBuilder('High-probability acca', analysis.builders.highProbability)}{renderBuilder('Balanced acca', analysis.builders.balanced)}</section></div>}
      </section>
    </section>
    <aside className="guardrails" aria-label="Product guardrails"><strong>Local manual analysis only.</strong><p>Verify market availability and settlement rules in Paddy Power before placing.</p><p>18+; analysis only; only stake what you can afford to lose.</p></aside>
    <footer><p>Manual analysis only. Your workflow stays under your control. No automated actions, account access or stake advice.</p></footer>
  </main>
}
export default App
