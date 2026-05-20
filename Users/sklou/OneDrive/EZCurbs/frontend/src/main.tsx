import React from "react";
import ReactDOM from "react-dom/client";
import "./style.css";

function App() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="logo">
            <span>EZ</span>CURBS
          </div>
          <div className="tagline">AI Curb Adapter Generator</div>
        </div>

        <nav className="nav">
          <button>⌂ Dashboard</button>
          <button className="active">↳ New Adapter</button>
          <button>⬡ Models</button>
          <button>▣ Projects</button>
          <button>⇩ Downloads</button>
        </nav>

        <div className="powered">
          <div className="mark">◒</div>
          <div>
            <small>Powered by</small>
            <strong>CURBONOMIX AI</strong>
          </div>
        </div>

        <div className="user">
          <div className="avatar">K</div>
          <div>
            <strong>Kareem Louk</strong>
            <small>Seabreeze AC/R</small>
          </div>
        </div>
      </header>

      <main className="layout">
        <aside className="steps">
          <Step number="1" title="EXISTING MODEL" subtitle="Select existing RTU" active />
          <Step number="2" title="NEW MODEL" subtitle="Select new RTU" />
          <Step number="3" title="OPENINGS" subtitle="Confirm & adjust" />
          <Step number="4" title="PREVIEW" subtitle="Review adapter" />
          <Step number="5" title="EXPORT" subtitle="DXF, G-Code, PDF" />

          <div className="help">
            <strong>Need Help?</strong>
            <p>Contact our team for same-day support.</p>
            <button>Contact Support</button>
          </div>
        </aside>

        <section className="panel">
          <h2>EXISTING MODEL</h2>

          <label>Select Existing RTU Model</label>
          <select>
            <option>Search or select model...</option>
          </select>

          <h3>NEW CURB (ADAPTER) DIMENSIONS</h3>

          <div className="grid three">
            <Field label="Length (X)" value="207" />
            <Field label="Width (Y)" value="10.0" />
            <Field label="Height (Z)" value="46.6" />
          </div>

          <div className="grid four">
            <Field label="New Curb Leg (L)" value="80" />
            <Field label="New Curb Width (W)" value="6" />
            <Field label="Curb Height" value="9" />
            <Field label="Flange Width" value="29" />
          </div>

          <div className="grid four">
            <Field label="Supply X" value="2" />
            <Field label="Supply Y" value="4" />
            <Field label="Return X" value="80" />
            <Field label="Brake Limit" value="29" />
          </div>

          <div className="grid three">
            <Field label="Break EI (A)" value="2" />
            <Field label="SST" value="4" />
            <div>
              <label>Steel Gauge</label>
              <select>
                <option>14 GA</option>
                <option>16 GA</option>
                <option>18 GA</option>
              </select>
            </div>
          </div>

          <h3>MATERIAL</h3>

          <div className="grid two">
            <div>
              <label>Material Type</label>
              <select>
                <option>Galvanized Steel</option>
                <option>Aluminum</option>
                <option>Stainless Steel</option>
              </select>
            </div>
            <div>
              <label>Gauge</label>
              <select>
                <option>14 GA</option>
                <option>16 GA</option>
                <option>18 GA</option>
              </select>
            </div>
          </div>

          <div className="actions-row">
            <button className="primary">Preview Adapter</button>
            <button className="secondary">Save & Continue</button>
          </div>
        </section>

        <section className="viewer">
          <div className="viewer-toolbar">
            <button className="tool active">◎<span>Orbit</span></button>
            <button className="tool">✣<span>Pan</span></button>
            <button className="tool">⌕<span>Zoom</span></button>
            <button className="tool">≋<span>Top</span></button>
            <button className="tool">▭<span>Front</span></button>
            <button className="tool">▱<span>Right</span></button>
            <button className="tool">⬡<span>Isometric</span></button>
            <button className="tool">↻<span>Reset</span></button>

            <div className="toolbar-spacer" />

            <select className="units">
              <option>Units: Inches</option>
            </select>

            <button className="secondary small">⋮ Actions</button>
          </div>

          <div className="cad-space">
            <div className="dimension height">46.6"</div>
            <div className="dimension length">207"</div>
            <div className="dimension width">10.0"</div>

            <div className="adapter-shape">
              <div className="top-face"></div>
              <div className="front-face"></div>
              <div className="side-face"></div>
              <div className="inner-line one"></div>
              <div className="inner-line two"></div>
            </div>

            <div className="axis">
              <span className="z">Z</span>
              <span className="y">Y</span>
              <span className="x">X</span>
            </div>

            <div className="viewer-hint">
              Drag to orbit • Scroll to zoom • Right-drag to pan
            </div>
          </div>
        </section>

        <footer className="summary">
          <h3>ADAPTER SUMMARY</h3>

          <div className="summary-grid">
            <SummaryItem title="Existing Model" value="Not Selected" />
            <SummaryItem title="New Curb Size" value='207" L x 10.0" W x 46.6" H' />
            <SummaryItem title="Flange Height" value='85"' />
            <SummaryItem title="Material" value="Galvanized Steel 14 GA" />
            <SummaryItem title="Est. Weight" value="--" />
            <SummaryItem title="Est. Price" value="--" />
          </div>

          <button className="generate">⇩ Generate DXF</button>
        </footer>
      </main>
    </div>
  );
}

function Step(props: { number: string; title: string; subtitle: string; active?: boolean }) {
  return (
    <div className={props.active ? "step active" : "step"}>
      <div className="step-number">{props.number}</div>
      <div>
        <strong>{props.title}</strong>
        <small>{props.subtitle}</small>
      </div>
    </div>
  );
}

function Field(props: { label: string; value: string }) {
  return (
    <div>
      <label>{props.label}</label>
      <div className="input-unit">
        <input defaultValue={props.value} />
        <span>in</span>
      </div>
    </div>
  );
}

function SummaryItem(props: { title: string; value: string }) {
  return (
    <div className="summary-item">
      <strong>{props.title}</strong>
      <span>{props.value}</span>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
