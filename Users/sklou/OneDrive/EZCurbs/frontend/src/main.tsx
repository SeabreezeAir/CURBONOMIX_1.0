import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { Edges, OrbitControls } from "@react-three/drei";
import {
  Box,
  Database,
  Download,
  FileText,
  Home,
  Lock,
  Maximize2,
  Move3D,
  Package,
  RotateCcw,
  Search,
  Settings,
  Shield,
  UserCheck,
  Wrench
} from "lucide-react";
import "./styles.css";

const API = import.meta.env.VITE_API_URL || "";

type Me = {
  id: number;
  email: string;
  full_name: string;
  role: string;
  status: string;
  permissions: Record<string, boolean>;
};

type RTUModel = {
  id: number;
  manufacturer: string;
  model_number: string;
  description?: string;
  length_x: number;
  width_y: number;
  height_z: number;
  supply_x: number;
  supply_y: number;
  return_x: number;
  return_y: number;
  weight_lbs?: number;
  is_active: boolean;
};

type AdapterData = {
  projectName: string;
  existingModel: string;
  newModel: string;
  lengthX: number;
  widthY: number;
  heightZ: number;
  curbLeg: number;
  curbWidth: number;
  flangeWidth: number;
  supplyX: number;
  supplyY: number;
  returnX: number;
  returnY: number;
  brakeLimit: number;
  material: string;
  gauge: string;
};

const defaultAdapter: AdapterData = {
  projectName: "RTU Curb Adapter",
  existingModel: "",
  newModel: "",
  lengthX: 207,
  widthY: 96,
  heightZ: 46.6,
  curbLeg: 80,
  curbWidth: 6,
  flangeWidth: 29,
  supplyX: 22,
  supplyY: 18,
  returnX: 28,
  returnY: 22,
  brakeLimit: 29,
  material: "Galvanized Steel",
  gauge: "14 GA"
};

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers || {})
    }
  });
  if (!res.ok) throw new Error(await res.text());
  return res;
}

function AuthModal({ onDone, onClose }: { onDone: () => void; onClose: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({
    email: "admin@curbonomix.com",
    password: "ChangeMe123!",
    full_name: "",
    company: ""
  });
  const [message, setMessage] = useState("");

  async function submit() {
    setMessage("");
    try {
      if (mode === "login") {
        const res = await api("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email: form.email, password: form.password })
        });
        const data = await res.json();
        localStorage.setItem("token", data.access_token);
        onDone();
      } else {
        const res = await api("/api/auth/register", {
          method: "POST",
          body: JSON.stringify(form)
        });
        const data = await res.json();
        setMessage(data.message);
      }
    } catch (e: any) {
      setMessage(e.message);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="auth-card">
        <button className="modal-close" onClick={onClose}>Ã—</button>
        <h1><span>EZ</span>CURBS</h1>
        <p>Login is required only for downloads and protected features.</p>
        <div className="tabs">
          <button onClick={() => setMode("login")} className={mode === "login" ? "active" : ""}>Login</button>
          <button onClick={() => setMode("register")} className={mode === "register" ? "active" : ""}>Request Access</button>
        </div>
        {mode === "register" && (
          <>
            <input placeholder="Full name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
            <input placeholder="Company" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
          </>
        )}
        <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        <button className="primary" onClick={submit}>{mode === "login" ? "Login" : "Submit Access Request"}</button>
        {message && <div className="message">{message}</div>}
      </div>
    </div>
  );
}

function AdapterScene({ data, view, exploded }: { data: AdapterData; view: string; exploded: boolean }) {
  const { camera } = useThree();
  const controls = useRef<any>(null);
  const [hovered, setHovered] = useState(false);

  const sx = Math.max(data.lengthX / 45, 2.5);
  const sy = Math.max(data.heightZ / 20, 1.2);
  const sz = Math.max(data.widthY / 35, 2.2);
  const wall = 0.08;

  useEffect(() => {
    const distance = 9;
    const positions: Record<string, [number, number, number]> = {
      iso: [distance, distance * 0.62, distance],
      top: [0, distance + 3, 0.001],
      front: [0, 1.8, distance + 2],
      right: [distance + 2, 1.8, 0],
      left: [-(distance + 2), 1.8, 0]
    };
    const p = positions[view] || positions.iso;
    camera.position.set(p[0], p[1], p[2]);
    camera.lookAt(0, 0, 0);
    controls.current?.update();
  }, [view, camera]);

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 7, 5]} intensity={1.8} />
      <gridHelper args={[18, 36, "#12476a", "#08263f"]} />

      <group rotation={[0, 0, 0]}>
        <mesh
          position={[0, exploded ? 0.12 : 0, 0]}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <boxGeometry args={[sx, sy, sz]} />
          <meshStandardMaterial color={hovered ? "#0ea5e9" : "#082033"} transparent opacity={0.42} metalness={0.35} roughness={0.28} />
          <Edges color="#2dd4bf" />
        </mesh>

        <mesh position={[0, exploded ? 0.52 : 0.03, 0]}>
          <boxGeometry args={[sx - wall * 7, sy + 0.05, sz - wall * 7]} />
          <meshStandardMaterial color="#020b16" transparent opacity={0.22} />
          <Edges color="#38bdf8" />
        </mesh>

        <mesh position={[-sx * 0.16, sy * 0.53 + (exploded ? 0.42 : 0), -sz * 0.18]}>
          <boxGeometry args={[Math.max(data.supplyX / 38, 0.7), 0.05, Math.max(data.supplyY / 26, 0.7)]} />
          <meshStandardMaterial color="#111827" />
          <Edges color="#facc15" />
        </mesh>

        <mesh position={[sx * 0.2, sy * 0.53 + (exploded ? 0.42 : 0), sz * 0.18]}>
          <boxGeometry args={[Math.max(data.returnX / 38, 0.8), 0.05, Math.max(data.returnY / 26, 0.8)]} />
          <meshStandardMaterial color="#111827" />
          <Edges color="#fb7185" />
        </mesh>

        <lineSegments position={[0, -sy * 0.6, 0]}>
          <edgesGeometry args={[new THREE.BoxGeometry(sx * 1.08, 0.08, sz * 1.08)]} />
          <lineBasicMaterial color="#60a5fa" />
        </lineSegments>
      </group>

      <OrbitControls
        ref={controls}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.85}
        panSpeed={0.85}
        zoomSpeed={0.85}
        makeDefault
      />
    </>
  );
}

function ThreePreview({
  data,
  view,
  setView,
  exploded,
  setExploded
}: {
  data: AdapterData;
  view: string;
  setView: (v: string) => void;
  exploded: boolean;
  setExploded: (v: boolean) => void;
}) {
  return (
    <div className="viewer">
      <div className="viewer-toolbar">
        <button onClick={() => setView("iso")}><Move3D size={15} /> Orbit</button>
        <button onClick={() => setView("top")}>Top</button>
        <button onClick={() => setView("front")}>Front</button>
        <button onClick={() => setView("right")}>Right</button>
        <button onClick={() => setView("left")}>Left</button>
        <button onClick={() => setExploded(!exploded)}><Maximize2 size={15} /> {exploded ? "Assembled" : "Explode"}</button>
        <button onClick={() => { setView("iso"); setExploded(false); }}><RotateCcw size={15} /> Reset</button>
        <select defaultValue="in">
          <option value="in">Units: Inches</option>
        </select>
      </div>

      <Canvas camera={{ position: [8, 5, 8], fov: 45 }}>
        <AdapterScene data={data} view={view} exploded={exploded} />
      </Canvas>

      <div className="dim dim-x">{data.lengthX}"</div>
      <div className="dim dim-y">{data.widthY}"</div>
      <div className="dim dim-z">{data.heightZ}"</div>
      <div className="viewer-help">Left drag: orbit â€¢ Right drag: pan â€¢ Scroll: zoom â€¢ Hover: highlight</div>
    </div>
  );
}

function AdminPanel({ me }: { me: Me }) {
  const [users, setUsers] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    const res = await api("/api/admin/users");
    setUsers(await res.json());
  }

  useEffect(() => {
    if (me.role === "admin") load();
  }, [me.role]);

  async function saveUser(u: any) {
    await api(`/api/admin/users/${u.id}/access`, {
      method: "PATCH",
      body: JSON.stringify({ role: u.role, status: u.status, permissions: u.permissions })
    });
    setMessage("Access updated");
    load();
  }

  if (me.role !== "admin") return null;

  return (
    <div className="admin-panel">
      <h3><Shield size={18} /> Admin Access Control</h3>
      {message && <p className="message">{message}</p>}
      {users.map(u => (
        <div className="user-row" key={u.id}>
          <div><strong>{u.full_name}</strong><span>{u.email}</span></div>
          <select value={u.role} onChange={e => { u.role = e.target.value; setUsers([...users]); }}>
            <option value="user">User</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
          <select value={u.status} onChange={e => { u.status = e.target.value; setUsers([...users]); }}>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="disabled">Disabled</option>
          </select>
          {["pdf", "bom", "dxf", "gcode", "pricing", "models"].map(p => (
            <label key={p}>
              <input type="checkbox" checked={!!u.permissions[p]} onChange={e => { u.permissions[p] = e.target.checked; setUsers([...users]); }} />
              {p.toUpperCase()}
            </label>
          ))}
          <button onClick={() => saveUser(u)}>Save</button>
        </div>
      ))}
    </div>
  );
}

function ModelDatabase({ models }: { models: RTUModel[] }) {
  const [q, setQ] = useState("");
  const filtered = models.filter(m =>
    `${m.manufacturer} ${m.model_number} ${m.description || ""}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <section className="database-panel">
      <div className="panel-title">
        <div><Database size={19} /> RTU Model Number Database</div>
        <div className="searchbox"><Search size={16} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search model number or manufacturer" /></div>
      </div>
      <div className="model-table">
        <div className="model-head">
          <span>Manufacturer</span><span>Model Number</span><span>Description</span><span>L Ã— W Ã— H</span><span>Supply</span><span>Return</span>
        </div>
        {filtered.map(m => (
          <div className="model-row" key={m.id}>
            <span>{m.manufacturer}</span>
            <strong>{m.model_number}</strong>
            <span>{m.description}</span>
            <span>{m.length_x}" Ã— {m.width_y}" Ã— {m.height_z}"</span>
            <span>{m.supply_x}" Ã— {m.supply_y}"</span>
            <span>{m.return_x}" Ã— {m.return_y}"</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function App() {
  const [me, setMe] = useState<Me | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [activeNav, setActiveNav] = useState("adapter");
  const [step, setStep] = useState(1);
  const [models, setModels] = useState<RTUModel[]>([]);
  const [data, setData] = useState<AdapterData>(defaultAdapter);
  const [view, setView] = useState("iso");
  const [exploded, setExploded] = useState(false);
  const [error, setError] = useState("");

  async function loadMe() {
    try {
      const res = await api("/api/me");
      setMe(await res.json());
    } catch {
      setMe(null);
    }
  }

  async function loadModels() {
    const res = await fetch(`${API}/api/rtu-models`);
    setModels(await res.json());
  }

  useEffect(() => {
    loadMe();
    loadModels();
  }, []);

  const selectedExisting = useMemo(() => models.find(m => m.model_number === data.existingModel), [models, data.existingModel]);
  const selectedNew = useMemo(() => models.find(m => m.model_number === data.newModel), [models, data.newModel]);

  function applyExisting(modelNumber: string) {
    const m = models.find(x => x.model_number === modelNumber);
    setData(prev => ({
      ...prev,
      existingModel: modelNumber,
      lengthX: m ? Math.round(Math.max(prev.lengthX, m.length_x + 18)) : prev.lengthX,
      widthY: m ? Math.round(Math.max(prev.widthY, m.width_y + 18)) : prev.widthY,
      supplyX: m?.supply_x || prev.supplyX,
      supplyY: m?.supply_y || prev.supplyY,
      returnX: m?.return_x || prev.returnX,
      returnY: m?.return_y || prev.returnY
    }));
  }

  function applyNew(modelNumber: string) {
    const m = models.find(x => x.model_number === modelNumber);
    setData(prev => ({
      ...prev,
      newModel: modelNumber,
      lengthX: m ? Math.round(Math.max(prev.lengthX, m.length_x + 24)) : prev.lengthX,
      widthY: m ? Math.round(Math.max(prev.widthY, m.width_y + 24)) : prev.widthY
    }));
  }

  async function saveProject() {
    setError("");
    if (!me) {
      setShowLogin(true);
      return;
    }
    try {
      await api("/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: data.projectName, data })
      });
      setError("Project saved.");
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function exportPdf() {
    setError("");
    if (!me) {
      setShowLogin(true);
      return;
    }
    try {
      const res = await fetch(`${API}/api/exports/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ data })
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ezcurbs-adapter.pdf";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message);
    }
  }

  const canPdf = me ? me.role === "admin" || me.permissions.pdf : false;
  const canAdmin = me?.role === "admin";

  const navItems = [
    ["dashboard", "Dashboard", Home],
    ["adapter", "New Adapter", Box],
    ["models", "RTU Database", Database],
    ["downloads", "Downloads", Download],
    ["admin", "Admin", Settings]
  ] as const;

  return (
    <div className="app">
      {showLogin && <AuthModal onDone={() => { setShowLogin(false); loadMe(); }} onClose={() => setShowLogin(false)} />}

      <aside className="sidebar">
        <div className="brand"><span>EZ</span>CURBS</div>
        <p>AI Curb Adapter Generator</p>

        <nav>
          {navItems.map(([key, label, Icon]) => (
            <button key={key} className={activeNav === key ? "active" : ""} onClick={() => setActiveNav(key)}>
              <Icon size={18} /> {label}
              {key === "admin" && !canAdmin && <Lock size={13} className="nav-lock" />}
            </button>
          ))}
        </nav>

        <div className="steps">
          {[
            ["1", "Existing Model", "Select existing RTU"],
            ["2", "New Model", "Select new RTU"],
            ["3", "Openings", "Confirm & adjust"],
            ["4", "Preview", "Review adapter"],
            ["5", "Export", "PDF download"]
          ].map((s, i) => (
            <button className={step === i + 1 ? "step active" : "step"} key={s[0]} onClick={() => { setActiveNav("adapter"); setStep(i + 1); }}>
              <b>{s[0]}</b>
              <div>{s[1]}<span>{s[2]}</span></div>
            </button>
          ))}
        </div>
      </aside>

      <main>
        <header>
          <div>
            <h2>{activeNav === "adapter" ? "New Adapter" : activeNav === "models" ? "RTU Model Database" : activeNav === "admin" ? "Admin" : "Dashboard"}</h2>
            <span>{me ? `${me.full_name} Â· ${me.status}` : "Guest Mode Â· Login only required for download"}</span>
          </div>
          <div className="header-actions">
            <button onClick={saveProject}>Save Project</button>
            {me ? (
              <button onClick={() => { localStorage.removeItem("token"); setMe(null); }}>Logout</button>
            ) : (
              <button onClick={() => setShowLogin(true)}>Login</button>
            )}
          </div>
        </header>

        {activeNav === "dashboard" && (
          <section className="dashboard-grid">
            <div className="metric"><Box /><span>RTU Models</span><b>{models.length}</b></div>
            <div className="metric"><FileText /><span>PDF Access</span><b>{!me ? "Login" : canPdf ? "Ready" : "Locked"}</b></div>
            <div className="metric"><UserCheck /><span>User Status</span><b>{me?.status || "Guest"}</b></div>
            <div className="metric"><Package /><span>Fabrication</span><b>Admin Controlled</b></div>
          </section>
        )}

        {activeNav === "models" && <ModelDatabase models={models} />}

        {activeNav === "downloads" && (
          <section className="database-panel">
            <div className="panel-title"><div><Download size={19} /> Downloads</div></div>
            <div className="download-grid">
              <button onClick={exportPdf}><FileText /> PDF Submittal</button>
              <button disabled><Lock /> BOM Locked</button>
              <button disabled><Lock /> DXF Locked</button>
              <button disabled><Lock /> G-code Locked</button>
            </div>
          </section>
        )}

        {activeNav === "admin" && (
          <>
            {!canAdmin && <div className="locked"><Lock size={22} /> Admin access required.</div>}
            {me && <AdminPanel me={me} />}
          </>
        )}

        {activeNav === "adapter" && (
          <>
            <section className="workspace">
              <div className="form-panel">
                <h3>Project</h3>
                <label>Project Name</label>
                <input value={data.projectName} onChange={e => setData({ ...data, projectName: e.target.value })} />

                <h3 className={step === 1 ? "focus-title" : ""}>Existing Model</h3>
                <label>Select Existing RTU Model</label>
                <select value={data.existingModel} onChange={e => applyExisting(e.target.value)}>
                  <option value="">Search or select model...</option>
                  {models.map(m => <option key={m.id} value={m.model_number}>{m.manufacturer} â€” {m.model_number}</option>)}
                </select>
                {selectedExisting && <p className="hint">{selectedExisting.description} Â· {selectedExisting.length_x}" Ã— {selectedExisting.width_y}" Ã— {selectedExisting.height_z}"</p>}

                <h3 className={step === 2 ? "focus-title" : ""}>New RTU Model</h3>
                <label>Select New RTU Model</label>
                <select value={data.newModel} onChange={e => applyNew(e.target.value)}>
                  <option value="">Search or select model...</option>
                  {models.map(m => <option key={m.id} value={m.model_number}>{m.manufacturer} â€” {m.model_number}</option>)}
                </select>
                {selectedNew && <p className="hint">{selectedNew.description} Â· {selectedNew.length_x}" Ã— {selectedNew.width_y}" Ã— {selectedNew.height_z}"</p>}

                <h3 className={step === 3 ? "focus-title" : ""}>New Curb Adapter Dimensions</h3>
                <div className="grid">
                  {[
                    ["lengthX", "Length X"],
                    ["widthY", "Width Y"],
                    ["heightZ", "Height Z"],
                    ["curbLeg", "New Curb Leg"],
                    ["curbWidth", "New Curb Width"],
                    ["flangeWidth", "Flange Width"],
                    ["supplyX", "Supply X"],
                    ["supplyY", "Supply Y"],
                    ["returnX", "Return X"],
                    ["returnY", "Return Y"],
                    ["brakeLimit", "Brake Limit"]
                  ].map(([key, label]) => (
                    <div key={key}>
                      <label>{label}</label>
                      <input type="number" value={(data as any)[key]} onChange={e => setData({ ...data, [key]: Number(e.target.value) })} />
                    </div>
                  ))}
                </div>

                <h3>Material</h3>
                <div className="grid two">
                  <div>
                    <label>Material Type</label>
                    <select value={data.material} onChange={e => setData({ ...data, material: e.target.value })}>
                      <option>Galvanized Steel</option>
                      <option>Stainless Steel</option>
                      <option>Aluminum</option>
                    </select>
                  </div>
                  <div>
                    <label>Gauge</label>
                    <select value={data.gauge} onChange={e => setData({ ...data, gauge: e.target.value })}>
                      <option>18 GA</option>
                      <option>16 GA</option>
                      <option>14 GA</option>
                      <option>12 GA</option>
                    </select>
                  </div>
                </div>
              </div>

              <ThreePreview data={data} view={view} setView={setView} exploded={exploded} setExploded={setExploded} />
            </section>

            <section className="summary">
              <div><Box /> <span>Existing Model</span><b>{data.existingModel || "Not Selected"}</b></div>
              <div><Box /> <span>New RTU</span><b>{data.newModel || "Not Selected"}</b></div>
              <div><Wrench /> <span>Adapter Size</span><b>{data.lengthX}" L Ã— {data.widthY}" W Ã— {data.heightZ}" H</b></div>
              <div><FileText /> <span>PDF Export</span><b>{!me ? "Login Required" : canPdf ? "Available" : "Locked"}</b></div>
              <button className="generate" disabled={!!me && !canPdf} onClick={exportPdf}>
                <Download size={18} /> {!me ? "Login to Download PDF" : "Generate PDF"}
              </button>
            </section>

            <section className="locked-features">
              {["BOM", "DXF", "G-code", "Pricing", "Model Admin"].map(f => (
                <div key={f}><Lock size={15} /> {f} controlled by admin permissions</div>
              ))}
            </section>
          </>
        )}

        {error && <pre className={error.includes("saved") ? "success" : "error"}>{error}</pre>}
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
