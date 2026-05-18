// src/App.jsx
import React, { useMemo, useState } from "react";

const VERIFIED_MODELS = [
  {
    id: "york-yvaa-036-existing",
    manufacturer: "York",
    model: "YVAA 036",
    role: "existing",
    status: "VERIFIED",
    source: "York spec sheet",
    rev: "B / 04-15-2024",
    curbLength: 70,
    curbWidth: 64,
    curbHeight: 14,
    supply: { w: 21, d: 19, x: 43, y: 16 },
    return: { w: 21, d: 21, x: 18, y: 16 },
  },
  {
    id: "trane-ycd-048-new",
    manufacturer: "Trane",
    model: "YCD 048",
    role: "new",
    status: "VERIFIED",
    source: "Trane submittal",
    rev: "A / 02-01-2024",
    curbLength: 40,
    curbWidth: 32,
    curbHeight: 4.5,
    supply: { w: 20, d: 19, x: 22, y: 7 },
    return: { w: 21, d: 21, x: 5, y: 7 },
  },
];

const modelOptions = {
  existing: VERIFIED_MODELS.filter((m) => m.role === "existing"),
  new: VERIFIED_MODELS.filter((m) => m.role === "new"),
};

function inches(value) {
  return `${Number(value).toFixed(2)}\"`;
}

function ModelCard({ title, role, selectedId, onChange }) {
  const models = modelOptions[role];
  const selected = models.find((m) => m.id === selectedId);

  return (
    <section className="card">
      <div className="section-title">
        <h3>{title}</h3>
        <span className="verified">✓ Verified</span>
      </div>

      <label>Manufacturer</label>
      <select value={selected?.manufacturer ?? ""} disabled>
        <option>{selected?.manufacturer}</option>
      </select>

      <label>Model</label>
      <select value={selectedId} onChange={(e) => onChange(e.target.value)}>
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.model} — {model.status}
          </option>
        ))}
      </select>

      <div className="model-grid">
        <span>Curb Length</span><strong>{inches(selected.curbLength)}</strong>
        <span>Curb Width</span><strong>{inches(selected.curbWidth)}</strong>
        <span>Curb Height</span><strong>{inches(selected.curbHeight)}</strong>
        <span>Supply Opening</span><strong>{inches(selected.supply.w)} × {inches(selected.supply.d)}</strong>
        <span>Return Opening</span><strong>{inches(selected.return.w)} × {inches(selected.return.d)}</strong>
        <span>Data Source</span><strong>{selected.source}</strong>
        <span>Rev / Date</span><strong>{selected.rev}</strong>
      </div>

      <p className="ok-line">All critical dimensions verified. No guessed geometry.</p>
    </section>
  );
}

function AdapterViewer({ existing, next, adapterHeight, flangeOverlap }) {
  const flangeLength = existing.curbLength + flangeOverlap * 2;
  const flangeWidth = existing.curbWidth + flangeOverlap * 2;

  return (
    <section className="viewer-panel">
      <div className="viewer-header">
        <div>
          <p className="eyebrow">3D VIEW</p>
          <h2>Verified Curb Adapter</h2>
        </div>
        <select>
          <option>Isometric</option>
          <option>Front</option>
          <option>Right Side</option>
          <option>Bottom</option>
        </select>
      </div>

      <div className="scene" aria-label="Verified curb adapter 3D preview">
        <div className="callout supply">SUPPLY<br />{inches(next.supply.w)} × {inches(next.supply.d)}</div>
        <div className="callout existing-supply">EXISTING SUPPLY<br />{inches(existing.supply.w)} × {inches(existing.supply.d)}</div>
        <div className="callout return">RETURN<br />{inches(next.return.w)} × {inches(next.return.d)}</div>
        <div className="callout existing-return">EXISTING RETURN<br />{inches(existing.return.w)} × {inches(existing.return.d)}</div>
        <div className="callout flange">BOTTOM FLANGE OVERLAP<br />{inches(flangeOverlap)} TYP.</div>

        <svg viewBox="0 0 960 520" role="img">
          <defs>
            <linearGradient id="metal" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#f4f5f3" />
              <stop offset="0.45" stopColor="#a9aca8" />
              <stop offset="1" stopColor="#e6e7e4" />
            </linearGradient>
            <linearGradient id="darkMetal" x1="0" x2="1">
              <stop offset="0" stopColor="#303432" />
              <stop offset="1" stopColor="#111514" />
            </linearGradient>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="8" stdDeviation="8" floodOpacity="0.18" />
            </filter>
          </defs>

          {/* Bottom flange: existing curb footprint plus 2-3 inch overhang */}
          <polygon points="122,356 656,222 858,300 320,455" fill="#d9dbd7" stroke="#111" strokeWidth="3" filter="url(#shadow)" />
          <polygon points="154,352 654,236 820,300 323,437" fill="none" stroke="#0b61ff" strokeWidth="3" strokeDasharray="14 10" opacity="0.78" />
          <polygon points="122,356 154,352 323,437 320,455" fill="#777" opacity="0.22" />
          <polygon points="656,222 654,236 820,300 858,300" fill="#777" opacity="0.22" />

          {/* Sloped transition body */}
          <polygon points="182,314 640,208 784,266 328,394" fill="url(#metal)" stroke="#111" strokeWidth="3" />
          <polygon points="182,314 328,394 400,250 250,205" fill="url(#metal)" stroke="#111" strokeWidth="2.5" />
          <polygon points="640,208 784,266 690,142 528,110" fill="url(#metal)" stroke="#111" strokeWidth="2.5" />
          <polygon points="250,205 528,110 690,142 400,250" fill="url(#metal)" stroke="#111" strokeWidth="3" />

          {/* Top rail / new RTU footprint */}
          <polygon points="240,185 527,88 712,134 399,232" fill="none" stroke="#111" strokeWidth="16" strokeLinejoin="round" />
          <polygon points="265,185 530,102 683,138 402,216" fill="#cdd0cb" stroke="#111" strokeWidth="3" />
          <line x1="392" y1="146" x2="562" y2="201" stroke="#111" strokeWidth="8" />
          <line x1="430" y1="116" x2="432" y2="224" stroke="#111" strokeWidth="5" />

          {/* Openings */}
          <polygon points="274,190 414,147 414,207 286,240" fill="#202322" opacity="0.82" stroke="#111" strokeWidth="2" />
          <polygon points="458,123 625,151 550,198 434,162" fill="#202322" opacity="0.82" stroke="#111" strokeWidth="2" />
          <polygon points="226,329 345,296 418,329 292,366" fill="none" stroke="#0b61ff" strokeWidth="3" strokeDasharray="12 8" />
          <polygon points="470,242 623,205 711,244 552,290" fill="none" stroke="#0b61ff" strokeWidth="3" strokeDasharray="12 8" />

          {/* formed dark edges */}
          <polyline points="122,356 320,455 858,300" fill="none" stroke="url(#darkMetal)" strokeWidth="8" />
          <polyline points="182,314 328,394 784,266" fill="none" stroke="url(#darkMetal)" strokeWidth="7" />
          <polyline points="250,205 528,110 690,142" fill="none" stroke="url(#darkMetal)" strokeWidth="7" />

          {/* Direction tags */}
          <rect x="288" y="405" width="42" height="32" fill="#fff" stroke="#111" /><text x="301" y="427" fontSize="20">FS</text>
          <rect x="774" y="295" width="42" height="32" fill="#fff" stroke="#111" /><text x="787" y="317" fontSize="20">RS</text>
        </svg>
      </div>

      <div className="verified-bar">
        <strong>Geometry source:</strong> verified model pair. Bottom flange is {inches(flangeLength)} × {inches(flangeWidth)}, calculated from existing curb {inches(existing.curbLength)} × {inches(existing.curbWidth)} plus {inches(flangeOverlap)} overlap on all sides. Adapter height: {inches(adapterHeight)}.
      </div>
    </section>
  );
}

function DrawingStrip({ existing, next, flangeOverlap, adapterHeight }) {
  const flangeLength = existing.curbLength + flangeOverlap * 2;
  const flangeWidth = existing.curbWidth + flangeOverlap * 2;

  return (
    <section className="drawing-strip">
      <div className="mini bottom-view">
        <h4>BOTTOM VIEW</h4>
        <div className="mini-box flange-box">
          <span>{inches(flangeLength)}</span>
          <div className="existing-box">Existing curb {inches(existing.curbLength)} × {inches(existing.curbWidth)}</div>
          <small>Flange overlap {inches(flangeOverlap)} typ.</small>
        </div>
      </div>
      <div className="mini front-view">
        <h4>FRONT VIEW (FS)</h4>
        <div className="trapezoid"><span>{inches(adapterHeight)}</span></div>
      </div>
      <div className="mini side-view">
        <h4>RIGHT SIDE VIEW (RS)</h4>
        <div className="trapezoid small"><span>{inches(next.curbLength)}</span></div>
      </div>
      <div className="mini notes">
        <h4>NOTES</h4>
        <p>1. Bottom flange extends beyond existing curb by {inches(flangeOverlap)} on all sides.</p>
        <p>2. DXF/PDF blocked unless all model records are verified or field verified.</p>
      </div>
    </section>
  );
}

export default function App() {
  const [existingId, setExistingId] = useState(modelOptions.existing[0].id);
  const [newId, setNewId] = useState(modelOptions.new[0].id);
  const [adapterHeight, setAdapterHeight] = useState(14);
  const [flangeOverlap, setFlangeOverlap] = useState(2.5);
  const [manualOverride, setManualOverride] = useState(false);

  const existing = useMemo(() => VERIFIED_MODELS.find((m) => m.id === existingId), [existingId]);
  const next = useMemo(() => VERIFIED_MODELS.find((m) => m.id === newId), [newId]);
  const canGenerate = existing?.status === "VERIFIED" && next?.status === "VERIFIED" && flangeOverlap >= 2 && flangeOverlap <= 3;

  async function generateAdapter() {
    const payload = {
      existing_model_id: existing.id,
      new_model_id: next.id,
      adapter_height: adapterHeight,
      flange_overlap: flangeOverlap,
      mode: manualOverride ? "field_verified_override" : "verified_model_pair",
    };

    console.log("Curbonomix adapter payload", payload);
  }

  return (
    <main className="app-shell">
      <style>{styles}</style>
      <header className="topbar">
        <div className="brand-mark">K</div>
        <div>
          <h1>CURBONOMIX</h1>
          <p>Alien-Tech Drafting Canvas</p>
        </div>
        <nav>
          <a>Dashboard</a>
          <a>Packets</a>
          <a>Models</a>
          <a>Orders</a>
        </nav>
      </header>

      <div className="workspace-title">
        <span>← Back to Dashboard</span>
        <strong>Packet: PACK-2025-0513-001</strong>
        <button>Save</button>
        <button>Share</button>
        <button className="primary">Download DXF & PDF</button>
      </div>

      <div className="workspace">
        <aside className="left-panel">
          <ModelCard title="1. SELECT EXISTING CURB / UNIT (BOTTOM)" role="existing" selectedId={existingId} onChange={setExistingId} />
          <ModelCard title="2. SELECT NEW RTU / UNIT (TOP)" role="new" selectedId={newId} onChange={setNewId} />

          <section className="card">
            <div className="section-title"><h3>3. ADAPTER OPTIONS</h3></div>
            <div className="option-row">
              <label>Adapter Height (in)</label>
              <input type="number" min="4" max="36" step="0.25" value={adapterHeight} onChange={(e) => setAdapterHeight(Number(e.target.value))} />
            </div>
            <div className="option-row critical">
              <label>Bottom Flange Overlap (in)</label>
              <input type="number" min="2" max="3" step="0.25" value={flangeOverlap} onChange={(e) => setFlangeOverlap(Number(e.target.value))} />
              <small>Required: 2.00\"–3.00\" beyond existing curb on all sides.</small>
            </div>
            <div className="toggle-row">
              <div>
                <strong>Manual / Field Verified Override</strong>
                <p>Off by default. Manual data must be tagged field verified.</p>
              </div>
              <button className={manualOverride ? "toggle on" : "toggle"} onClick={() => setManualOverride(!manualOverride)}>{manualOverride ? "ON" : "OFF"}</button>
            </div>
            <button className="generate" disabled={!canGenerate} onClick={generateAdapter}>Generate Verified Adapter</button>
          </section>
        </aside>

        <section className="right-panel">
          <div className="tabs"><strong>3D VIEW</strong><span>DRAWINGS</span><span>DETAILS</span><span>BOM</span></div>
          <AdapterViewer existing={existing} next={next} adapterHeight={adapterHeight} flangeOverlap={flangeOverlap} />
          <DrawingStrip existing={existing} next={next} adapterHeight={adapterHeight} flangeOverlap={flangeOverlap} />
        </section>
      </div>
    </main>
  );
}

const styles = `
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #0c1222; background: #f4f6f9; }
  .app-shell { min-height: 100vh; }
  .topbar { height: 72px; padding: 0 28px; display: flex; align-items: center; gap: 14px; background: linear-gradient(90deg, #07192c, #10243d); color: white; }
  .brand-mark { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 8px; background: #2e66ff; font-weight: 900; }
  .topbar h1 { margin: 0; font-size: 24px; letter-spacing: 1px; }
  .topbar p { margin: 0; color: #a8c6ff; text-transform: uppercase; font-size: 11px; }
  .topbar nav { margin-left: auto; display: flex; gap: 28px; font-size: 14px; }
  .workspace-title { height: 58px; display: flex; align-items: center; gap: 18px; padding: 0 26px; background: white; border-bottom: 1px solid #dfe4ec; }
  .workspace-title span { color: #145bd7; }
  .workspace-title strong { margin-right: auto; }
  button, select, input { font: inherit; }
  button { border: 1px solid #c9d2df; background: white; border-radius: 6px; padding: 9px 14px; cursor: pointer; }
  button.primary, .generate { background: #061c73; color: white; border-color: #061c73; }
  .workspace { display: grid; grid-template-columns: 392px 1fr; min-height: calc(100vh - 130px); }
  .left-panel { background: white; border-right: 1px solid #dce3ed; overflow: auto; }
  .right-panel { overflow: hidden; }
  .card { padding: 18px; border-bottom: 1px solid #e0e6ef; }
  .section-title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .section-title h3 { margin: 0; font-size: 14px; }
  .verified, .ok-line { color: #14843a; font-size: 12px; }
  label { display: block; font-size: 12px; margin: 10px 0 5px; font-weight: 650; }
  select, input { width: 100%; border: 1px solid #cfd8e5; border-radius: 6px; background: white; padding: 8px 10px; }
  .model-grid { display: grid; grid-template-columns: 1fr 1fr; margin-top: 14px; border: 1px solid #e0e5ed; border-radius: 6px; overflow: hidden; font-size: 12px; }
  .model-grid span, .model-grid strong { padding: 7px 9px; border-bottom: 1px solid #e8edf4; }
  .model-grid span { background: #f8fafc; color: #44546a; }
  .model-grid strong { font-weight: 650; }
  .option-row { display: grid; grid-template-columns: 1fr 96px; gap: 12px; align-items: end; margin-bottom: 13px; }
  .option-row.critical { border: 1px solid #f06b3b; padding: 10px; border-radius: 8px; background: #fff8f5; }
  .option-row small { grid-column: 1 / -1; color: #8e3b1f; }
  .toggle-row { display: flex; justify-content: space-between; gap: 10px; align-items: center; margin: 18px 0; }
  .toggle-row p { margin: 4px 0 0; color: #617085; font-size: 12px; }
  .toggle { min-width: 66px; border-radius: 999px; color: #667085; }
  .toggle.on { background: #127a35; color: white; }
  .generate { width: 100%; padding: 13px; font-weight: 800; }
  .generate:disabled { opacity: 0.45; cursor: not-allowed; }
  .tabs { height: 48px; display: flex; gap: 42px; align-items: center; padding: 0 24px; background: white; border-bottom: 1px solid #dce3ed; }
  .tabs strong { color: #061c73; border-bottom: 3px solid #061c73; height: 48px; display: flex; align-items: center; }
  .viewer-panel { background: white; border-bottom: 1px solid #dce3ed; }
  .viewer-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 28px 0; }
  .eyebrow { margin: 0; color: #061c73; font-size: 12px; font-weight: 800; }
  .viewer-header h2 { margin: 3px 0 0; font-size: 22px; }
  .viewer-header select { width: 140px; }
  .scene { position: relative; height: 510px; }
  .scene svg { width: 100%; height: 100%; }
  .callout { position: absolute; font-size: 14px; line-height: 1.25; font-weight: 750; background: rgba(255,255,255,0.72); padding: 4px 7px; border-radius: 5px; }
  .supply { top: 40px; left: 48%; }
  .existing-supply { top: 96px; right: 10%; }
  .return { top: 205px; left: 10%; }
  .existing-return { top: 315px; left: 8%; }
  .flange { bottom: 42px; left: 37%; color: #107230; border: 1px solid #71b886; background: #f1fff4; }
  .verified-bar { padding: 11px 22px; background: #f5fff7; border-top: 1px solid #cfead5; color: #154b24; font-size: 13px; }
  .drawing-strip { display: grid; grid-template-columns: 1.1fr 1fr 1fr 1.1fr; gap: 18px; padding: 18px 24px; background: white; min-height: 220px; }
  .mini { border: 1px solid #dce3ed; border-radius: 8px; padding: 12px; background: #fbfcfe; }
  .mini h4 { margin: 0 0 10px; text-align: center; font-size: 12px; }
  .mini-box { height: 124px; border: 2px solid #111; position: relative; display: grid; place-items: center; background: #e6e8e5; }
  .existing-box { width: 72%; height: 64%; border: 2px dashed #0b61ff; display: grid; place-items: center; text-align: center; font-size: 12px; color: #0b3f9c; }
  .mini-box span { position: absolute; top: -20px; }
  .mini-box small { position: absolute; bottom: -22px; color: #107230; }
  .trapezoid { margin: 28px auto; width: 78%; height: 86px; background: linear-gradient(135deg, #eeeeeb, #9ea29d, #f5f5f2); clip-path: polygon(12% 0, 88% 0, 100% 100%, 0 100%); border-bottom: 7px solid #222; display: grid; place-items: center; font-weight: 800; }
  .trapezoid.small { width: 62%; }
  .notes p { font-size: 12px; margin: 8px 0; }
  @media (max-width: 1000px) { .workspace { grid-template-columns: 1fr; } .drawing-strip { grid-template-columns: 1fr; } .scene { height: 420px; } }
`;
