import type { Task,IAgent,AgentResult } from "../../../lms/src";
import { sizePlenum, buildAdapter } from "../../../rtu-core/src";
export class ArchitectAgent implements IAgent{
  name="architect";
  run(t:Task):AgentResult{
    if(t.action!=="architect.run") return {ok:false,error:"action mismatch"};
    const spec=t.payload; const perf=sizePlenum(spec); const geo=buildAdapter(spec);
    return {ok:true,data:{plan:["capture","size","geometry","exports"],perf,geo}};
  }
}