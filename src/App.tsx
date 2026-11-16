export default function App() {
  return (
    <main>
      <header>
        <p className="eyebrow">Proof of concept</p>
        <h1>ECHO</h1>
        <p>Your music. Another world.</p>
      </header>
      <section aria-labelledby="diagnostics-heading">
        <h2 id="diagnostics-heading">Audio diagnostics</h2>
        <dl>
          <div><dt>Source</dt><dd>None selected</dd></div>
          <div><dt>Connection</dt><dd>Disconnected</dd></div>
          <div><dt>Analysis</dt><dd>Not active</dd></div>
        </dl>
        <p>Audio input controls will be added in the next phase.</p>
      </section>
    </main>
  )
}
