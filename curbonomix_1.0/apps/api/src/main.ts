import Fastify from "fastify";
import { LMS, SuperAgent } from "@curbonomix/lms";
import { ArchitectAgent } from "@curbonomix/agents-architect";
import { EngineerAgent } from "@curbonomix/agents-engineer";
import { DesignerAgent } from "@curbonomix/agents-designer";
import { AIGovernor, loadDefaultPolicy } from "@curbonomix/ai-governor";
"dev:api": "npm run dev --workspace=@curbonomix/api"

import { RTUSpec, resolveModel, sizePlenum, buildAdapter, toDXF, toGCode, toSubmittal } from "../../../packages/rtu-core/src";

const server=Fastify(); const lms=new LMS(); const sa=new SuperAgent(lms);
sa.register(new ArchitectAgent()); sa.register(new EngineerAgent()); sa.register(new DesignerAgent());

type Body=Partial<RTUSpec>&{ existing_model?:string; new_model?:string; manual_existing?:boolean; manual_new?:boolean };

function resolvePair(b:Body):RTUSpec{
  const ex = (!b.manual_existing && b.existing_model) ? resolveModel(b.existing_model) : undefined;
  const nw = (!b.manual_new && b.new_model) ? resolveModel(b.new_model) : undefined;
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
    cfm_supply:b.cfm_supply, cfm_return:b.cfm_return
  };
  const req=["new_L","new_W","height","flange_h","supply_x","supply_y","return_x","steel_gauge","sst","brake_lim"] as const;
  for(const k of req) if(base[k]===undefined) throw new Error("MISSING_FIELDS");
  return base as RTUSpec;
}

server.get("/", async ()=> "CURBONOMIX API`n/health`n/rtu/preview (POST)`n/rtu/design (POST)`n/rtu/dxf (POST)`n/rtu/gcode (POST)`n/rtu/submittal (POST)");
server.get("/health", async()=>({status:"up"}));

server.post<{Body:Body}>("/rtu/preview", async(req)=>{ const spec=resolvePair(req.body);
  lms.record({actor:"api",verb:"preview",object:"rtu",ts:Date.now(),meta:{existing:req.body.existing_model,new:req.body.new_model}});
  return { perf:sizePlenum(spec), geo:buildAdapter(spec) };
});
server.post<{Body:Body}>("/rtu/design", async(req)=>{ const spec=resolvePair(req.body);
  lms.record({actor:"api",verb:"design",object:"rtu",ts:Date.now(),meta:{existing:req.body.existing_model,new:req.body.new_model}});
  const perf=sizePlenum(spec), geo=buildAdapter(spec);
  return { ok:true, data:{ perf, geo } };
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