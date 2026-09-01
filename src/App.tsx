import { useState } from 'react'
import { buildFixturePrompt, parseAndValidateFixturePack } from './domain/fixtureWorkflow'
import { buildResearchPrompt, evidenceCategories, getResearchGate, parseAndValidateResearchPack, validateFreshnessSettings } from './domain/researchWorkflow'
import { SUPPORTED_COMPETITIONS, type Competition, type FixturePack, type ResearchPack, type ValidationResult } from './domain/types'

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

  const toggleCompetition = (competition: Competition) => setCompetitions((current) => current.includes(competition) ? current.filter((item) => item !== competition) : [...current, competition])
  const generate = () => { try { setPrompt(buildFixturePrompt({ date, competitions })); setCriteriaError(''); setCopyStatus('') } catch (error) { setCriteriaError(error instanceof Error ? error.message : 'Unable to generate prompt.'); setPrompt('') } }
  const copy = async () => { try { if (!navigator.clipboard) throw new Error(); await navigator.clipboard.writeText(prompt); setCopyStatus('Prompt copied to clipboard.') } catch { setCopyStatus('Copy failed. Select the prompt text and copy it manually.') } }
  const validate = () => setValidation(parseAndValidateFixturePack(pastedJson))
  const clear = () => { setPrompt(''); setCriteriaError(''); setCopyStatus(''); setPastedJson(''); setValidation(null) }
  const fixturePack = validation?.valid ? validation.data : undefined
  const researchGate = getResearchGate(fixturePack)
  const freshness = { referenceTimestamp, maximumAgeHours }
  const generateResearch = () => { try { if (!fixturePack) throw new Error('Validate a FixturePack first.'); setResearchPrompt(buildResearchPrompt(fixturePack, freshness)); setResearchFeedback('Research prompt generated from the validated fixtures.') } catch (error) { setResearchPrompt(''); setResearchFeedback(error instanceof Error ? error.message : 'Unable to generate research prompt.') } }
  const validateResearch = () => { if (!fixturePack) return; const error = validateFreshnessSettings(freshness); if (error) { setResearchValidation({ valid: false, errors: [{ code: 'invalid_freshness_settings', path: '$', message: error }], warnings: [] }); return } setResearchValidation(parseAndValidateResearchPack(researchJson, fixturePack, freshness)) }
  const clearResearch = () => { setResearchPrompt(''); setResearchJson(''); setResearchValidation(null); setResearchFeedback('') }

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
        <textarea id="fixture-json" rows={12} value={pastedJson} onChange={(event) => { setPastedJson(event.target.value); setValidation(null) }} placeholder='Paste the single JSON object here. Prose and Markdown fences are rejected.' />
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
          <div className="freshness"><label>ISO reference timestamp<input type="text" value={referenceTimestamp} onChange={event => { setReferenceTimestamp(event.target.value); setResearchValidation(null) }} /></label><label>Maximum source age (hours)<input type="number" min="0" step="1" value={maximumAgeHours} onChange={event => { setMaximumAgeHours(Number(event.target.value)); setResearchValidation(null) }} /></label></div>
          <button type="button" onClick={generateResearch}>Generate research prompt</button><p className="feedback" role="status">{researchFeedback}</p>
          {researchPrompt && <div className="prompt-panel"><div className="panel-heading"><h3>Research prompt</h3><button type="button" onClick={() => navigator.clipboard?.writeText(researchPrompt).then(() => setResearchFeedback('Research prompt copied.')).catch(() => setResearchFeedback('Copy failed. Select and copy the prompt manually.'))}>Copy prompt</button></div><pre tabIndex={0}>{researchPrompt}</pre></div>}
          <div className="import-panel"><h3>Validate ResearchPack v1</h3><label htmlFor="research-json">Complete ResearchPack v1 JSON response</label><textarea id="research-json" rows={14} value={researchJson} onChange={event => { setResearchJson(event.target.value); setResearchValidation(null) }} placeholder="Paste only one strict JSON object. Prose and Markdown fences are rejected." /><div className="actions"><button type="button" onClick={validateResearch}>Validate research JSON</button><button type="button" className="secondary" onClick={clearResearch}>Clear research only</button></div></div>
          {researchValidation && <div className="results" aria-live="polite"><h3>Research validation results</h3><p className={researchValidation.valid ? 'success' : 'error'}>{researchValidation.valid ? 'ResearchPack is valid.' : 'ResearchPack is not valid.'}</p>{[...researchValidation.errors, ...researchValidation.warnings].length > 0 && <ul className="issues">{researchValidation.errors.map(item => <li key={`e-${item.path}-${item.code}`}><strong>Error · {item.code}</strong><code>{item.path}</code>{item.message}</li>)}{researchValidation.warnings.map(item => <li key={`w-${item.path}-${item.code}`}><strong>Warning · {item.code}</strong><code>{item.path}</code>{item.message}</li>)}</ul>}
            {researchValidation.valid && researchValidation.data && researchValidation.data.fixtures.map(fixture => { const categories = evidenceCategories(fixture); const cited = new Set<string>(); JSON.stringify(fixture, (key, value) => { if (key === 'sourceIds' && Array.isArray(value)) value.forEach(id => cited.add(String(id))); return value }); const usedSources = researchValidation.data!.sources.filter(source => cited.has(source.sourceId)); const times = usedSources.map(source => source.retrievedAt).sort(); return <article className="evidence-card" key={fixture.fixtureId}><h3>{fixture.homeTeam} v {fixture.awayTeam}</h3><dl className="summary"><div><dt>Data quality</dt><dd>{fixture.dataQuality}</dd></div><div><dt>Source count</dt><dd>{usedSources.length}</dd></div><div><dt>Retrieval range</dt><dd>{times.length ? `${times[0]} — ${times[times.length - 1]}` : 'None'}</dd></div></dl><p><strong>Populated evidence:</strong> {categories.populated.join(', ') || 'None'}</p><p><strong>Missing evidence:</strong> {categories.missing.join(', ') || 'None'}</p><ul>{usedSources.map(source => <li key={source.sourceId}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a> <small>({source.retrievedAt})</small></li>)}</ul></article> })}</div>}
        </>}
        <div className="research-guardrails"><p>Verify market availability and settlement rules in Paddy Power before placing.</p><p>18+; analysis only; only stake what you can afford to lose.</p></div>
      </section>
    </section>
    <aside className="guardrails" aria-label="Product guardrails"><strong>Local manual analysis only.</strong><p>Verify market availability and settlement rules in Paddy Power before placing.</p><p>18+; analysis only; only stake what you can afford to lose.</p></aside>
    <footer><p>Manual analysis only. Your workflow stays under your control. No selections or recommendations are generated.</p></footer>
  </main>
}
export default App
