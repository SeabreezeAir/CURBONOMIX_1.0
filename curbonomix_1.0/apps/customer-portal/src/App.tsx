import React,{useEffect,useRef,useState} from "react";
import * as THREE from "three"; import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
type Mesh={vertices:number[][];faces:number[][]};
type Perf={cfm_s:number;cfm_r:number;dp_inwc:number;vel_sup_fpm:number;vel_ret_fpm:number};
const API="/api"; const J=async<T>(u:string,o?:RequestInit)=>{const r=await fetch(u,o); if(!r.ok) throw new Error(await r.text()); return r.json() as Promise<T>}

export default function App(){
  const [existing,setExisting]=useState("TRANE-TTA090");
  const [next,setNext]=useState("LENNOX-LGA120");
  const [manual,setManual]=useState(false);
  const [manualSpec,setSpec]=useState<any>({});
  const [perf,setPerf]=useState<Perf|null>(null); const [err,setErr]=useState<string|null>(null);
  const mount=useRef<HTMLDivElement|null>(null); const ref=useRef<any>();

  const body=()=> manual ? { manual_existing:true, manual_new:true, ...manualSpec } : { existing_model:existing, new_model:next };

  async function preview(){ try{
    setErr(null);
    const r=await J<{perf:Perf;geo:Mesh}>(`${API}/rtu/preview`,{method:"POST",headers:{'Content-Type':'application/json'},body:JSON.stringify(body())});
    setPerf(r.perf); draw(r.geo);
  }catch(e:any){ setErr(e.message) } }
  async function design(){ try{
    setErr(null);
    const r=await J<{ok:boolean;data:{perf:Perf;geo:Mesh}}>(`${API}/rtu/design`,{method:"POST",headers:{'Content-Type':'application/json'},body:JSON.stringify(body())});
    if(r.ok){ setPerf(r.data.perf); draw(r.data.geo) }
  }catch(e:any){ setErr(e.message) } }

  function fire(path:string){
    const b=body();
    fetch(`${API}${path}`,{method:"POST",headers:{'Content-Type':'application/json'},body:JSON.stringify(b)})
      .then(async res=>{ const blob=await res.blob(); const url=URL.createObjectURL(blob); window.open(url,"_blank"); });
  }
  const exportDXF=()=>fire("/rtu/dxf"); const exportG=()=>fire("/rtu/gcode"); const submittal=()=>fire("/rtu/submittal");

  function draw(g:any){ if(!ref.current) return; const {scene,renderer,camera,controls}=ref.current;
    if(ref.current.mesh){ scene.remove(ref.current.mesh); ref.current.mesh.geometry.dispose() }
    const pos:number[]=[]; for(const f of g.faces) for(const i of f){ const v=g.vertices[i]; pos.push(v[0],v[1],v[2])}
    const geom=new THREE.BufferGeometry(); geom.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); geom.computeVertexNormals();
    const mesh=new THREE.Mesh(geom,new THREE.MeshStandardMaterial({metalness:0.2,roughness:0.6}));
    mesh.castShadow=true; mesh.receiveShadow=true; scene.add(mesh); ref.current.mesh=mesh;
    const box=new THREE.Box3().setFromObject(mesh), size=new THREE.Vector3(), c=new THREE.Vector3(); box.getSize(size); box.getCenter(c);
    const d=Math.max(size.x,size.y,size.z)*1.8; camera.position.set(c.x+d,c.y+d,c.z+d); camera.lookAt(c); controls.target.copy(c); controls.update(); renderer.render(scene,camera);
  }

  useEffect(()=>{ if(!mount.current) return;
    const w=mount.current.clientWidth||720, h=520;
    const scene=new THREE.Scene(); scene.background=new THREE.Color(0x0b1220);
    const camera=new THREE.PerspectiveCamera(45,w/h,0.1,100000);
    const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setSize(w,h); renderer.shadowMap.enabled=true; mount.current.appendChild(renderer.domElement);
    const controls=new OrbitControls(camera,renderer.domElement);
    scene.add(new THREE.AmbientLight(0x88ccff,0.6)); const dir=new THREE.DirectionalLight(0x99ddff,0.8); dir.position.set(200,260,300); dir.castShadow=true; scene.add(dir);
    const grid=new THREE.GridHelper(2000,40,0x193047,0x122136); grid.position.y=-1; scene.add(grid);
    ref.current={scene,camera,renderer,controls}; let raf=0; const tick=()=>{renderer.render(scene,camera); raf=requestAnimationFrame(tick)}; tick();
    preview(); return()=>{cancelAnimationFrame(raf); renderer.dispose()}
  },[]);

  return (<div className="app">
    <div className="card">
      <h1>CURBONOMIX — RTU Adapter</h1>
      <label>Existing model</label><input value={existing} onChange={e=>setExisting(e.target.value)} placeholder="e.g., TRANE-TTA090"/>
      <label>New model</label><input value={next} onChange={e=>setNext(e.target.value)} placeholder="e.g., LENNOX-LGA120"/>
      <label style={{display:"flex",gap:8,alignItems:"center",marginTop:12}}>
        <input type="checkbox" checked={manual} onChange={e=>setManual(e.target.checked)}/><span>Model not available → manual entry</span>
      </label>
      {manual && (<div className="grid">
        <div><label>base L (in)</label><input type="number" onChange={e=>setSpec((s:any)=>({...s,new_L:+e.target.value}))}/></div>
        <div><label>base W (in)</label><input type="number" onChange={e=>setSpec((s:any)=>({...s,new_W:+e.target.value}))}/></div>
        <div><label>height (in)</label><input type="number" onChange={e=>setSpec((s:any)=>({...s,height:+e.target.value}))}/></div>
        <div><label>flange_h</label><input type="number" onChange={e=>setSpec((s:any)=>({...s,flange_h:+e.target.value}))}/></div>
        <div><label>supply_x</label><input type="number" onChange={e=>setSpec((s:any)=>({...s,supply_x:+e.target.value}))}/></div>
        <div><label>supply_y</label><input type="number" onChange={e=>setSpec((s:any)=>({...s,supply_y:+e.target.value}))}/></div>
        <div><label>return_x</label><input type="number" onChange={e=>setSpec((s:any)=>({...s,return_x:+e.target.value}))}/></div>
        <div><label>steel_gauge</label><input type="number" onChange={e=>setSpec((s:any)=>({...s,steel_gauge:+e.target.value}))}/></div>
        <div><label>sst</label><input type="number" onChange={e=>setSpec((s:any)=>({...s,sst:+e.target.value}))}/></div>
        <div><label>brake_lim</label><input type="number" onChange={e=>setSpec((s:any)=>({...s,brake_lim:+e.target.value}))}/></div>
        <div><label>top L2 (in)</label><input type="number" onChange={e=>setSpec((s:any)=>({...s,new_L2:+e.target.value}))}/></div>
        <div><label>top W2 (in)</label><input type="number" onChange={e=>setSpec((s:any)=>({...s,new_W2:+e.target.value}))}/></div>
      </div>)}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginTop:12}}>
        <button onClick={preview}>Preview</button><button className="primary" onClick={design}>Confirm</button><button onClick={submittal}>Submittal</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:10}}>
        <button onClick={exportDXF}>DXF</button><button onClick={exportG}>GCODE .TXT</button>
      </div>
      {perf && <p className="small" style={{marginTop:8}}>Supply {perf.cfm_s} cfm · Return {perf.cfm_r} cfm · ΔP {perf.dp_inwc} in.wc</p>}
      {err && <p style={{color:"#ff6b6b"}}>{err}</p>}
      <div className="small" style={{marginTop:8}}>Drag to orbit · Scroll to zoom · Right-drag to pan</div>
    </div>
    <div className="card"><div ref={mount} className="canvas"/></div>
  </div>);
}