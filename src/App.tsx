import { useState } from 'react'
import { buildFixturePrompt, parseAndValidateFixturePack } from './domain/fixtureWorkflow'
import { SUPPORTED_COMPETITIONS, type Competition, type FixturePack, type ValidationResult } from './domain/types'

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' })

function App() {
  const [date, setDate] = useState(today)
  const [competitions, setCompetitions] = useState<Competition[]>([...SUPPORTED_COMPETITIONS])
  const [prompt, setPrompt] = useState('')
  const [criteriaError, setCriteriaError] = useState('')
  const [copyStatus, setCopyStatus] = useState('')
  const [pastedJson, setPastedJson] = useState('')
  const [validation, setValidation] = useState<ValidationResult<FixturePack> | null>(null)

  const toggleCompetition = (competition: Competition) => setCompetitions((current) => current.includes(competition) ? current.filter((item) => item !== competition) : [...current, competition])
  const generate = () => { try { setPrompt(buildFixturePrompt({ date, competitions })); setCriteriaError(''); setCopyStatus('') } catch (error) { setCriteriaError(error instanceof Error ? error.message : 'Unable to generate prompt.'); setPrompt('') } }
  const copy = async () => { try { if (!navigator.clipboard) throw new Error(); await navigator.clipboard.writeText(prompt); setCopyStatus('Prompt copied to clipboard.') } catch { setCopyStatus('Copy failed. Select the prompt text and copy it manually.') } }
  const validate = () => setValidation(parseAndValidateFixturePack(pastedJson))
  const clear = () => { setPrompt(''); setCriteriaError(''); setCopyStatus(''); setPastedJson(''); setValidation(null) }

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
    </section>
    <aside className="guardrails" aria-label="Product guardrails"><strong>Local manual analysis only.</strong><p>Verify market availability and settlement rules in Paddy Power before placing.</p><p>18+; analysis only; only stake what you can afford to lose.</p></aside>
    <footer><p>Manual analysis only. Your workflow stays under your control. No selections or recommendations are generated.</p></footer>
  </main>
}
export default App
