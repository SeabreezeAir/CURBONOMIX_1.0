import Fastify from "fastify";
import { LMS, SuperAgent } from "@curbonomix/lms";
import { ArchitectAgent } from "@curbonomix/agents-architect";
import { EngineerAgent } from "@curbonomix/agents-engineer";
import { DesignerAgent } from "@curbonomix/agents-designer";
import { loadAdapter, saveAdapter, adapterExists, listAdapters } from "@curbonomix/adapter-database";
import { areCurbCompatible, findCompatibleCurbs } from "@curbonomix/curb-compatibility";
import { lookupRTU } from "rtu-library";
import {
  buildAdvancedAdapter,
  validateGeometry,
  resolveModel,
  sizePlenum,
  buildAdapter,
  toDXF,
  toGCode,
  toSubmittal,
  type RTUSpec
} from "@curbonomix/rtu-core";

const server=Fastify(); const lms=new LMS(); const sa=new SuperAgent(lms);
sa.register(new ArchitectAgent()); sa.register(new EngineerAgent()); sa.register(new DesignerAgent());

export default server;

type Body=Partial<RTUSpec>&{ existing_model?:string; new_model?:string; manual_existing?:boolean; manual_new?:boolean; use_advanced_geometry?:boolean };

function resolvePair(b:Body):RTUSpec{
  let ex = (!b.manual_existing && b.existing_model) ? resolveModel(b.existing_model) : undefined;
  let nw = (!b.manual_new && b.new_model) ? resolveModel(b.new_model) : undefined;
  
  // Try RTU library lookup if not found in basic catalog
  if(!ex && b.existing_model) {
    const rtuData = lookupRTU(b.existing_model);
    if(rtuData && rtuData.curb_L) {
      ex = {
        model: b.existing_model,
        new_L: rtuData.curb_L,
        new_W: rtuData.curb_W || rtuData.curb_L,
        height: rtuData.curb_H || 14,
        flange_h: 3,
        supply_x: rtuData.supply_x || rtuData.curb_L / 3,
        supply_y: rtuData.supply_y || rtuData.curb_W! / 4,
        return_x: rtuData.return_x || (rtuData.curb_L * 2) / 3,
        return_y: rtuData.return_y || rtuData.curb_W! / 4,
        steel_gauge: 18,
        sst: 4,
        brake_lim: 80
      };
    }
  }
  
  if(!nw && b.new_model) {
    const rtuData = lookupRTU(b.new_model);
    if(rtuData && rtuData.curb_L) {
      nw = {
        model: b.new_model,
        new_L: rtuData.curb_L,
        new_W: rtuData.curb_W || rtuData.curb_L,
        height: rtuData.curb_H || 14,
        flange_h: 3,
        supply_x: rtuData.supply_x || rtuData.curb_L / 3,
        supply_y: rtuData.supply_y || rtuData.curb_W! / 4,
        return_x: rtuData.return_x || (rtuData.curb_L * 2) / 3,
        return_y: rtuData.return_y || rtuData.curb_W! / 4,
        steel_gauge: 18,
        sst: 4,
        brake_lim: 80
      };
    }
  }
  
  if(!b.manual_existing && b.existing_model && !ex) throw new Error("EXISTING_MODEL_NOT_FOUND");
  if(!b.manual_new && b.new_model && !nw) throw new Error("NEW_MODEL_NOT_FOUND");
  const base:any={
    model:(nw?.model ?? ex?.model) || b.model,
    new_L: ex?.new_L ?? b.new_L, new_W: ex?.new_W ?? b.new_W, height: ex?.height ?? b.height,
    flange_h: ex?.flange_h ?? b.flange_h,
supply_x: ex?.supply_x ?? b.supply_x,
supply_y: ex?.supply_y ?? b.supply_y,
    return_x: ex?.return_x ?? b.return_x, return_y: ex?.return_y ?? b.return_y,
    steel_gauge: ex?.steel_gauge ?? b.steel_gauge, sst: ex?.sst ?? b.sst, brake_lim: ex?.brake_lim ?? b.brake_lim,
    new_L2: nw?.new_L ?? b.new_L2 ?? ex?.new_L, new_W2: nw?.new_W ?? b.new_W2 ?? ex?.new_W,
    cfm_supply:b.cfm_supply, cfm_return:b.cfm_return,
    // Store original curb data for advanced geometry
    _existing_curb: ex ? { 
      L: ex.new_L, 
      W: ex.new_W,
      supply: { x: ex.supply_x, y: ex.supply_y },
      return: { x: ex.return_x, y: ex.return_y }
    } : undefined,
    _new_unit: nw ? {
      L: nw.new_L,
      W: nw.new_W,
      supply: { x: nw.supply_x, y: nw.supply_y, w: 20, h: 16 },
      return: { x: nw.return_x, y: nw.return_y || nw.supply_y, w: 24, h: 20 }
    } : undefined
  };
  const req=["new_L","new_W","height","flange_h","supply_x","supply_y","return_x","steel_gauge","sst","brake_lim"] as const;
  for(const k of req) if(base[k]===undefined) throw new Error("MISSING_FIELDS");
  return base as RTUSpec;
}

server.get("/", async ()=> "CURBONOMIX API`n/health`n/rtu/preview (POST)`n/rtu/design (POST)`n/rtu/dxf (POST)`n/rtu/gcode (POST)`n/rtu/submittal (POST)");
server.get("/health", async()=>({status:"up"}));

server.post<{Body:Body}>("/rtu/preview", async(req)=>{ 
  // Check if adapter already exists in cache
  if(req.body.existing_model && req.body.new_model) {
    const cached = loadAdapter(req.body.existing_model, req.body.new_model);
    if(cached) {
      return {
        ...cached,
        cached: true,
        reuse_count: cached.reuse_count,
        ai_suggestions: [`♻️ Using cached adapter (reused ${cached.reuse_count} times)`]
      };
    }
  }
  
  const spec:any=resolvePair(req.body);
  lms.record({actor:"api",verb:"preview",object:"rtu",ts:Date.now(),meta:{existing:req.body.existing_model,new:req.body.new_model}});
  
  // Use advanced geometry if curb data available
  let geo;
  let geometry_type = "standard";
  if(spec._existing_curb && spec._new_unit && req.body.use_advanced_geometry !== false) {
    try {
      geo = buildAdvancedAdapter(
        spec._existing_curb,
        spec._new_unit,
        spec.height,
        { maxSlope: 45, segments: 2 }
      );
      const validation = validateGeometry(geo);
      geometry_type = "advanced";
    } catch(e) {
      geo = buildAdapter(spec); // fallback
    }
  } else {
    geo = buildAdapter(spec);
  }
  
  const perf=sizePlenum(spec);
  
  // AI Quick Analysis
  const suggestions = [];
  if(perf.dp_inwc > 0.5) suggestions.push("Consider increasing plenum size to reduce pressure drop");
  if(perf.vel_sup_fpm > 1500) suggestions.push("Supply velocity high - may cause noise");
  if(spec.new_L2 && spec.new_W2) {
    const topArea = spec.new_L2 * spec.new_W2;
    const baseArea = spec.new_L * spec.new_W;
    if(topArea < baseArea * 0.5) suggestions.push("Large taper angle detected - check structural integrity");
  }
  if(geometry_type === "advanced") {
    suggestions.push("Using advanced geometry: corners connected directly to supply/return openings");
  }
  
  // Check curb compatibility
  if(req.body.existing_model && req.body.new_model) {
    if(areCurbCompatible(req.body.existing_model, req.body.new_model)) {
      suggestions.push("✅ Models are curb-compatible - direct replacement possible!");
    }
    const compatible = findCompatibleCurbs(req.body.new_model);
    if(compatible.length > 0) {
      suggestions.push(`ℹ️ ${compatible.length} other models compatible with new curb: ${compatible.slice(0,3).join(', ')}`);
    }
  }
  
  // Return opening data for visualization
  // BOTTOM (z=0): Existing RTU curb openings
  // TOP (z=height): New RTU curb openings
  const openings = {
    existing: {
      supply: spec._existing_curb ? {
        x: spec._existing_curb.supply.x,
        y: spec._existing_curb.supply.y,
        w: 20,
        h: 16,
        z: 0 // at bottom
      } : { x: spec.supply_x, y: spec.supply_y, w: 20, h: 16, z: 0 },
      return: spec._existing_curb ? {
        x: spec._existing_curb.return.x,
        y: spec._existing_curb.return.y,
        w: 24,
        h: 20,
        z: 0 // at bottom
      } : { x: spec.return_x, y: spec.return_y || spec.supply_y, w: 24, h: 20, z: 0 },
      curb_L: spec.new_L,
      curb_W: spec.new_W
    },
    new: {
      supply: spec._new_unit ? {
        x: spec._new_unit.supply.x,
        y: spec._new_unit.supply.y,
        w: spec._new_unit.supply.w,
        h: spec._new_unit.supply.h,
        z: spec.height // at top
      } : { x: spec.supply_x, y: spec.supply_y, w: 20, h: 16, z: spec.height },
      return: spec._new_unit ? {
        x: spec._new_unit.return.x,
        y: spec._new_unit.return.y,
        w: spec._new_unit.return.w,
        h: spec._new_unit.return.h,
        z: spec.height // at top
      } : { x: spec.return_x, y: spec.return_y || spec.supply_y, w: 24, h: 20, z: spec.height },
      curb_L: spec.new_L2 || spec.new_L,
      curb_W: spec.new_W2 || spec.new_W
    },
    adapter_height: spec.height
  };
  
  return { perf, geo, spec, ai_suggestions: suggestions, geometry_type, openings };
});

server.post<{Body:Body}>("/rtu/design", async(req)=>{ 
  // Check cache first
  if(req.body.existing_model && req.body.new_model) {
    const cached = loadAdapter(req.body.existing_model, req.body.new_model);
    if(cached) {
      return {
        ok: true,
        data: { perf: cached.performance, geo: cached.geometry },
        openings: cached.openings,
        cached: true,
        reuse_count: cached.reuse_count,
        ai_analysis: {
          ...cached.ai_analysis,
          recommendations: [`♻️ Using cached adapter design (reused ${cached.reuse_count} times)`]
        }
      };
    }
  }
  
  const spec:any=resolvePair(req.body);
  lms.record({actor:"api",verb:"design",object:"rtu",ts:Date.now(),meta:{existing:req.body.existing_model,new:req.body.new_model}});
  
  // AI Agent Analysis with Physics-Based Logic
  const architectResult = new ArchitectAgent().run({action:"architect.run",payload:spec});
  const engineerResult = new EngineerAgent().run({action:"engineer.run",payload:spec});
  const designerResult = new DesignerAgent().run({action:"designer.run",payload:spec});
  
  // Use advanced geometry if curb data available
  let geo;
  let geometry_type = "standard";
  let geometry_validation;
  if(spec._existing_curb && spec._new_unit && req.body.use_advanced_geometry !== false) {
    try {
      geo = buildAdvancedAdapter(
        spec._existing_curb,
        spec._new_unit,
        spec.height,
        { maxSlope: 45, segments: 2 }
      );
      geometry_validation = validateGeometry(geo);
      geometry_type = "advanced";
    } catch(e) {
      geo = buildAdapter(spec); // fallback
    }
  } else {
    geo = buildAdapter(spec);
  }
  
  const perf=sizePlenum(spec);
  
  // Compile comprehensive recommendations
  const recommendations = [];
  
  // Geometry info
  if(geometry_type === "advanced") {
    recommendations.push(`🎯 GEOMETRY: Advanced adapter - existing curb corners connected to new unit openings`);
    if(geometry_validation && geometry_validation.warnings.length > 0) {
      geometry_validation.warnings.forEach((w:string) => recommendations.push(`   ⚠️  ${w}`));
    }
  }
  
  // Architect recommendations
  if(architectResult.ok && architectResult.data) {
    const arch = architectResult.data;
    recommendations.push(`🏗️ STRUCTURAL: Height ${arch.height}" | COG ${arch.centerOfGravity_in}" | Wind Safety Factor ${arch.windResistance?.safetyFactor} (${arch.windResistance?.rating})`);
    if(arch.recommendations && Array.isArray(arch.recommendations)) {
      arch.recommendations.forEach((r:string) => recommendations.push(`   → ${r}`));
    }
  }
  
  // Engineer recommendations  
  if(engineerResult.ok && engineerResult.data) {
    const eng = engineerResult.data;
    recommendations.push(`⚙️ PERFORMANCE: ${perf.cfm_s} CFM supply | ΔP ${perf.dp_inwc} in.wc | Efficiency ${eng.efficiency_rating}`);
    if(eng.aerodynamics) {
      recommendations.push(`   → Flow: ${eng.aerodynamics.flowRegime} (Re=${eng.aerodynamics.reynoldsNumber})`);
    }
    if(eng.warnings && eng.warnings.length > 0) {
      eng.warnings.forEach((w:string) => recommendations.push(`   ⚠️  ${w}`));
    }
  }
  
  // Designer recommendations
  if(designerResult.ok && designerResult.data) {
    const des = designerResult.data;
    recommendations.push(`🎨 GEOMETRY: ${des.surface_area_sqft} sq ft | Taper ${des.taper?.average_deg}° | Fabrication ${des.fabrication?.complexity}`);
    if(des.optimizations && des.optimizations.length > 0) {
      des.optimizations.slice(0, 2).forEach((o:string) => recommendations.push(`   → ${o}`));
    }
  }
  
  // Save adapter to cache for reuse
  if(req.body.existing_model && req.body.new_model && spec._existing_curb && spec._new_unit) {
    const openings = {
      existing: {
        supply: {
          x: spec._existing_curb.supply.x,
          y: spec._existing_curb.supply.y,
          w: 20,
          h: 16
        },
        return: {
          x: spec._existing_curb.return.x,
          y: spec._existing_curb.return.y,
          w: 24,
          h: 20
        }
      },
      new: {
        supply: {
          x: spec._new_unit.supply.x,
          y: spec._new_unit.supply.y,
          w: spec._new_unit.supply.w,
          h: spec._new_unit.supply.h
        },
        return: {
          x: spec._new_unit.return.x,
          y: spec._new_unit.return.y,
          w: spec._new_unit.return.w,
          h: spec._new_unit.return.h
        }
      }
    };
    
    saveAdapter({
      existing_model: req.body.existing_model,
      new_model: req.body.new_model,
      existing_curb: {
        L: spec._existing_curb.L,
        W: spec._existing_curb.W,
        H: spec.height
      },
      new_curb: {
        L: spec._new_unit.L,
        W: spec._new_unit.W,
        H: spec.height
      },
      adapter_height: spec.height,
      geometry: geo,
      performance: {
        cfm_supply: perf.cfm_s,
        cfm_return: perf.cfm_r,
        dp_inwc: perf.dp_inwc,
        vel_sup_fpm: perf.vel_sup_fpm,
        vel_ret_fpm: perf.vel_ret_fpm
      },
      openings,
      ai_analysis: architectResult.ok && designerResult.ok ? {
        cog_offset: architectResult.data?.centerOfGravity_in || 0,
        wind_safety_factor: architectResult.data?.windResistance?.safetyFactor || 0,
        material_sqft: designerResult.data?.surface_area_sqft || 0,
        fabrication_complexity: designerResult.data?.fabrication?.complexity || "UNKNOWN"
      } : undefined
    });
  }
  
  return { 
    ok:true, 
    data:{ perf, geo, spec },
    ai_analysis: {
      architect: architectResult,
      engineer: engineerResult,
      designer: designerResult,
      recommendations
    }
  };
});
server.post<{Body:Body}>("/rtu/dxf", async(req,reply)=>{ const spec=resolvePair(req.body);
  reply.header("Content-Type","application/dxf").header("Content-Disposition","attachment; filename=curbonomix.dxf").send(toDXF(buildAdapter(spec)));
});
server.post<{Body:Body}>("/rtu/gcode", async(req,reply)=>{ const spec=resolvePair(req.body);
  reply.header("Content-Type","text/plain").header("Content-Disposition","attachment; filename=curbonomix_gmetric.txt").send(toGCode(buildAdapter(spec)));
});
server.post<{Body:Body}>("/rtu/submittal", async(req,reply)=>{ const spec=resolvePair(req.body);
  reply.header("Content-Type","text/plain").header("Content-Disposition","attachment; filename=submittal.txt").send(toSubmittal(spec,sizePlenum(spec)));
});

const host=process.env.HOST||"127.0.0.1"; let port=Number(process.env.PORT||3000);
(async()=>{ for(;;){ try{ await server.listen({host,port}); console.log("API listening:",`http://${host}:${port}`); break; }
catch(e:any){ if(e?.code==="EADDRINUSE"){ port++; continue } console.error(e); process.exit(1) } }})();