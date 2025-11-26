import React, { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type Mesh = { vertices: number[][]; faces: number[][] };
type Perf = { cfm_s: number; cfm_r: number; dp_inwc: number; vel_sup_fpm: number; vel_ret_fpm: number };
type AdapterSpec = {
  model?: string;
  new_L: number;
  new_W: number;
  height: number;
  flange_h: number;
  supply_x: number;
  supply_y: number;
  return_x: number;
  return_y?: number;
  steel_gauge: number;
  sst: number;
  brake_lim: number;
  new_L2?: number;
  new_W2?: number;
  cfm_supply?: number;
  cfm_return?: number;
};

const API = "/api";
const request = async <T extends unknown>(url: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
};

export default function App() {
  const [existing, setExisting] = useState("TRANE-TTA090");
  const [next, setNext] = useState("LENNOX-LGA120");
  const [manual, setManual] = useState(false);
  const [manualSpec, setSpec] = useState<Partial<AdapterSpec>>({});
  const [perf, setPerf] = useState<Perf | null>(null);
  const [specData, setSpecData] = useState<AdapterSpec | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const mount = useRef<HTMLDivElement | null>(null);
  const ctx = useRef<any>(null);

  const buildBody = () =>
    manual
      ? { manual_existing: true, manual_new: true, ...manualSpec }
      : { existing_model: existing, new_model: next };

  const handleManualInput = (key: keyof AdapterSpec) => (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    const nextValue = raw === "" ? undefined : Number(raw);
    setSpec((prev) => {
      if (nextValue === undefined) {
        const clone = { ...prev };
        delete clone[key];
        return clone;
      }
      return { ...prev, [key]: nextValue };
    });
  };

  async function preview() {
    try {
      setErr(null);
      const result = await request<{ perf: Perf; geo: Mesh; spec: AdapterSpec }>(`${API}/rtu/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody()),
      });
      setPerf(result.perf);
      setSpecData(result.spec);
      draw(result.geo);
    } catch (e: any) {
      setErr(e.message);
    }
  }

  async function design() {
    try {
      setErr(null);
      const result = await request<{ ok: boolean; data: { perf: Perf; geo: Mesh; spec: AdapterSpec } }>(`${API}/rtu/design`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody()),
      });
      if (result.ok) {
        setPerf(result.data.perf);
        setSpecData(result.data.spec);
        draw(result.data.geo);
      }
    } catch (e: any) {
      setErr(e.message);
    }
  }

  const fire = (path: string) => {
    const body = buildBody();
    fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      })
      .catch((e) => setErr(e.message));
  };

  const exportDXF = () => fire("/rtu/dxf");
  const exportG = () => fire("/rtu/gcode");
  const submittal = () => fire("/rtu/submittal");

  function disposeObject(object: THREE.Object3D) {
    object.traverse((child: THREE.Object3D) => {
      const anyChild = child as any;
      if (anyChild.geometry) {
        anyChild.geometry.dispose();
      }
      const material = anyChild.material;
      if (material) {
        if (Array.isArray(material)) {
          material.forEach((mat) => mat?.dispose?.());
        } else {
          material.dispose?.();
        }
      }
    });
  }

  function draw(meshData: Mesh) {
    if (!ctx.current) return;
    const { scene, renderer, camera, controls } = ctx.current;

    if (ctx.current.mesh) {
      scene.remove(ctx.current.mesh);
      disposeObject(ctx.current.mesh);
      ctx.current.mesh = null;
    }

    const positions: number[] = [];
    for (const face of meshData.faces) {
      for (const index of face) {
        const vertex = meshData.vertices[index];
        positions.push(vertex[0], vertex[1], vertex[2]);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeVertexNormals();

    const body = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: 0x1a8fff,
        emissive: 0x003d5c,
        emissiveIntensity: 0.18,
        metalness: 0.35,
        roughness: 0.25,
        transparent: true,
        opacity: 0.32,
        side: THREE.DoubleSide,
        flatShading: true,
      })
    );

  const edgeGeometry = new THREE.EdgesGeometry(geometry);
  const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xf4f7fb });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    body.add(edges);

    scene.add(body);
    ctx.current.mesh = body;

    const bounds = new THREE.Box3().setFromObject(body);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bounds.getSize(size);
    bounds.getCenter(center);
      const seamPositions: number[] = [];
      const { min, max } = bounds;
      const corners: Array<[number, number]> = [
        [min.x, min.z],
        [max.x, min.z],
        [max.x, max.z],
        [min.x, max.z],
      ];
    const segments = 12;
    const span = max.y - min.y;
    const fullStep = span / segments;
      const beadRatio = 0.82;
      corners.forEach(([cornerX, cornerZ]) => {
        for (let index = 0; index < segments; index += 1) {
          const baseY = min.y + fullStep * index;
          const tipY = baseY + fullStep * beadRatio;
          seamPositions.push(cornerX, baseY, cornerZ, cornerX, tipY, cornerZ);
        }
      });
      if (seamPositions.length > 0) {
        const weldGeometry = new THREE.BufferGeometry();
        weldGeometry.setAttribute("position", new THREE.Float32BufferAttribute(seamPositions, 3));
        const weldMaterial = new THREE.LineBasicMaterial({ color: 0xff6b00 });
        const weldLines = new THREE.LineSegments(weldGeometry, weldMaterial);
        body.add(weldLines);
      }
      const distance = Math.max(size.x, size.y, size.z) * 1.6;
    camera.position.set(center.x + distance, center.y + distance, center.z + distance);
    camera.lookAt(center);
    controls.target.copy(center);
    controls.update();
    renderer.render(scene, camera);
  }

  useEffect(() => {
    if (!mount.current) return;
    const container = mount.current;
    const width = container.clientWidth || 720;
    const height = 520;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050b16);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100000);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    scene.add(new THREE.AmbientLight(0x1a8fff, 0.35));
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.85);
    keyLight.position.set(180, 320, 260);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xff6b00, 0.7, 1400, 2.6);
    rimLight.position.set(-240, 180, -160);
    scene.add(rimLight);

    const grid = new THREE.GridHelper(1600, 32, 0x1a2d44, 0x0d1522);
    grid.position.y = -1;
    scene.add(grid);

    ctx.current = { scene, renderer, camera, controls, mesh: null };

    let raf = 0;
    const tick = () => {
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();
    preview();

    return () => {
      cancelAnimationFrame(raf);
      if (ctx.current?.mesh) {
        disposeObject(ctx.current.mesh);
        ctx.current.mesh = null;
      }
      controls.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
      ctx.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const liveSpec = manual ? { ...(specData ?? {}), ...manualSpec } : specData;

  const specOrder: (keyof AdapterSpec)[] = [
    "model",
    "new_L",
    "new_W",
    "height",
    "flange_h",
    "supply_x",
    "supply_y",
    "return_x",
    "return_y",
    "new_L2",
    "new_W2",
    "steel_gauge",
    "sst",
    "brake_lim",
    "cfm_supply",
    "cfm_return",
  ];

  const orderedSpecEntries = liveSpec
    ? [
        ...specOrder
          .filter((key) => Object.prototype.hasOwnProperty.call(liveSpec, key))
          .map((key) => [key, liveSpec[key]] as const),
        ...Object.entries(liveSpec as Record<string, unknown>).filter(
          ([key]) => !specOrder.includes(key as keyof AdapterSpec)
        ),
      ]
    : [];

  const renderSpecValue = (value: unknown) => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "number") {
      if (Number.isNaN(value)) return "—";
      return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2);
    }
    return String(value);
  };

  return (
    <div className="shell">
      <header className="top-bar">
        <div className="brand">
          <img src="/logo.svg" alt="Curbonomix" className="brand-mark" />
          <div>
            <div className="brand-name">CURBONOMIX</div>
            <div className="brand-tagline">Alien Tech — AI Curb Generator</div>
          </div>
        </div>
        <a className="brand-link" href="https://www.curbonomix.com" target="_blank" rel="noreferrer">
          www.curbonomix.com
        </a>
      </header>
      <main className="workspace">
        <section className="panel controls">
          <div className="section">
            <label className="field-label">Existing Model</label>
            <input
              className="field-input"
              value={existing}
              onChange={(e) => setExisting(e.target.value)}
              placeholder="Select model"
            />
          </div>
          <div className="section">
            <label className="field-label">New Model</label>
            <input
              className="field-input"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder="Enter model number"
            />
          </div>

          <label className="manual-toggle">
            <input type="checkbox" checked={manual} onChange={(e) => setManual(e.target.checked)} />
            <span>No library match? Open Curb Form</span>
          </label>

          {manual && (
            <div className="manual-grid">
              <div>
                <label className="field-label">base L (in)</label>
                <input type="number" className="field-input" value={manualSpec.new_L ?? ""} onChange={handleManualInput("new_L")} />
              </div>
              <div>
                <label className="field-label">base W (in)</label>
                <input type="number" className="field-input" value={manualSpec.new_W ?? ""} onChange={handleManualInput("new_W")} />
              </div>
              <div>
                <label className="field-label">height (in)</label>
                <input type="number" className="field-input" value={manualSpec.height ?? ""} onChange={handleManualInput("height")} />
              </div>
              <div>
                <label className="field-label">flange_h</label>
                <input type="number" className="field-input" value={manualSpec.flange_h ?? ""} onChange={handleManualInput("flange_h")} />
              </div>
              <div>
                <label className="field-label">supply_x</label>
                <input type="number" className="field-input" value={manualSpec.supply_x ?? ""} onChange={handleManualInput("supply_x")} />
              </div>
              <div>
                <label className="field-label">supply_y</label>
                <input type="number" className="field-input" value={manualSpec.supply_y ?? ""} onChange={handleManualInput("supply_y")} />
              </div>
              <div>
                <label className="field-label">return_x</label>
                <input type="number" className="field-input" value={manualSpec.return_x ?? ""} onChange={handleManualInput("return_x")} />
              </div>
              <div>
                <label className="field-label">return_y</label>
                <input type="number" className="field-input" value={manualSpec.return_y ?? ""} onChange={handleManualInput("return_y")} />
              </div>
              <div>
                <label className="field-label">steel_gauge</label>
                <input type="number" className="field-input" value={manualSpec.steel_gauge ?? ""} onChange={handleManualInput("steel_gauge")} />
              </div>
              <div>
                <label className="field-label">sst</label>
                <input type="number" className="field-input" value={manualSpec.sst ?? ""} onChange={handleManualInput("sst")} />
              </div>
              <div>
                <label className="field-label">brake_lim</label>
                <input type="number" className="field-input" value={manualSpec.brake_lim ?? ""} onChange={handleManualInput("brake_lim")} />
              </div>
              <div>
                <label className="field-label">top L2 (in)</label>
                <input type="number" className="field-input" value={manualSpec.new_L2 ?? ""} onChange={handleManualInput("new_L2")} />
              </div>
              <div>
                <label className="field-label">top W2 (in)</label>
                <input type="number" className="field-input" value={manualSpec.new_W2 ?? ""} onChange={handleManualInput("new_W2")} />
              </div>
            </div>
          )}

          <div className="action-row">
            <button onClick={preview}>Preview</button>
            <button className="primary" onClick={design}>Confirm &amp; Save</button>
          </div>
          <div className="secondary-row">
            <button onClick={submittal}>Technical PDF</button>
            <button onClick={exportDXF}>DXF</button>
            <button onClick={exportG}>G-Code TXT</button>
          </div>

          {perf && (
            <div className="performance">
              <span>{perf.cfm_s} cfm supply</span>
              <span>{perf.cfm_r} cfm return</span>
              <span>ΔP {perf.dp_inwc} in.wc</span>
            </div>
          )}

          {orderedSpecEntries.length > 0 && (
            <div className="spec-panel">
              <div className="spec-title">Preview Dimensions</div>
              <div className="spec-grid">
                {orderedSpecEntries.map(([key, value]) => (
                  <div key={key} className="spec-item">
                    <span className="spec-key">{key}</span>
                    <span className="spec-value">{renderSpecValue(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {err && <div className="alert">{err}</div>}
        </section>

        <section className="panel viewport">
          <div ref={mount} className="canvas" />
          <div className="viewport-overlay">Drag to orbit • Scroll to zoom • Right-drag to pan</div>
        </section>
      </main>
      <footer className="shell-footer">Powered by Curbonomix</footer>
    </div>
  );
}
