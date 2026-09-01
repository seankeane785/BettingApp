const leagues = ['Premier League', 'Championship', 'League One', 'League Two']

function App() {
  return (
    <main>
      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">Local-first · Manual analysis</p>
        <h1 id="page-title">FormFirst</h1>
        <p className="intro">
          A focused workspace for consistent, team-level football analysis—kept entirely in your browser.
        </p>
        <ul className="league-list" aria-label="Supported competitions">
          {leagues.map((league) => (
            <li key={league}>{league}</li>
          ))}
        </ul>
      </section>

      <section className="next-stage" aria-labelledby="next-stage-title">
        <span className="stage-number" aria-hidden="true">01</span>
        <div>
          <h2 id="next-stage-title">The foundation is ready</h2>
          <p>
            Fixture and evidence workflows will be added in later stages. This release contains only the
            accessible application shell—no selections or recommendations.
          </p>
        </div>
      </section>

      <footer>
        <p>Manual analysis only. Your workflow stays under your control.</p>
      </footer>
    </main>
  )
}

export default App
