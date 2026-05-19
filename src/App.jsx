import './styles.css'

export default function App() {
  return (
    <div className="page">
      <nav className="nav">
        <div className="brand">
          <div className="logoMark">EZ</div>
          <div>
            EZCurbs™
            <small>Powered by Curbonomix AI</small>
          </div>
        </div>

        <div className="navLinks">
          <a href="#platform">Platform</a>
          <a href="#workflow">Workflow</a>
          <a href="#contact">Contact</a>
          <a className="btn btnPrimary" href="/dashboard/new">
            Launch Curbulator
          </a>
        </div>
      </nav>

      <section className="hero">
        <div>
          <div className="badge">
            AI-Powered RTU Curb Adapter Platform
          </div>

          <h1>
            Roof curb design,
            fabrication,
            and DXF generation.
          </h1>

          <p className="lead">
            EZCurbs combines intelligent RTU matching, automated geometry,
            fabrication-ready exports, and real-time adapter previews through
            Curbulator™ powered by Curbonomix AI.
          </p>

          <div className="actions">
            <a className="btn btnPrimary" href="/dashboard/new">
              Start New Adapter
            </a>

            <a className="btn btnGhost" href="#platform">
              View Platform
            </a>
          </div>

          <div className="trustRow">
            <div className="trustItem">
              <strong>DXF Ready</strong>
              <span>CAMduct compatible fabrication exports</span>
            </div>

            <div className="trustItem">
              <strong>AI Assisted</strong>
              <span>Smart RTU matching and geometry generation</span>
            </div>

            <div className="trustItem">
              <strong>Production Focused</strong>
              <span>Built for commercial HVAC fabrication workflows</span>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panelTop">
            <strong>Curbulator™ Dashboard</strong>

            <div className="status">
              <span className="dot"></span>
              System Online
            </div>
          </div>

          <div className="formMock">
            <div className="fieldGrid">
              <div className="field">
                <label>Existing RTU</label>
                <div>Carrier 48TCED14</div>
              </div>

              <div className="field">
                <label>Replacement RTU</label>
                <div>Daikin DPS020</div>
              </div>
            </div>

            <div className="previewBox">
              <div className="previewTitle">
                Live Adapter Geometry Preview
              </div>
            </div>

            <div className="outputList">
              <div className="output">
                <span>DXF Export</span>
                <span>Ready</span>
              </div>

              <div className="output">
                <span>Submittal Package</span>
                <span>Generated</span>
              </div>

              <div className="output">
                <span>Plasma Cutting Output</span>
                <span>Prepared</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="platform">
        <div className="sectionHeader">
          <h2>
            Commercial fabrication workflows built into one platform.
          </h2>

          <p>
            From RTU replacement matching to fabrication exports and
            installation documentation, EZCurbs centralizes the entire curb
            adapter process into a production-ready environment.
          </p>
        </div>

        <div className="cards">
          <div className="card">
            <div className="icon">01</div>
            <h3>RTU Matching</h3>
            <p>
              Match existing and replacement rooftop units with intelligent
              dimension resolution and airflow calculations.
            </p>
          </div>

          <div className="card">
            <div className="icon">02</div>
            <h3>Fabrication Exports</h3>
            <p>
              Generate DXF files, plasma cutting outputs, geometry previews,
              and submittal packages automatically.
            </p>
          </div>

          <div className="card">
            <div className="icon">03</div>
            <h3>Curbulator™ AI</h3>
            <p>
              Powered by Curbonomix AI to streamline geometry generation,
              transition logic, and fabrication workflows.
            </p>
          </div>
        </div>
      </section>

      <section className="section" id="workflow">
        <div className="cta">
          <div>
            <h2>Built for contractors, fabricators, and HVAC teams.</h2>

            <p>
              Designed to reduce manual drafting, improve turnaround speed,
              and standardize production-ready curb adapter workflows.
            </p>
          </div>

          <a className="btn btnPrimary" href="/dashboard/new">
            Open Dashboard
          </a>
        </div>
      </section>

      <footer className="footer" id="contact">
        <div>
          <strong>EZCurbs™</strong>
          <div>AI-Powered Roof Curb Adapter Solutions</div>
        </div>

        <div>
          Featuring Curbulator™ · Powered by Curbonomix AI
        </div>
      </footer>
    </div>
  )
}
