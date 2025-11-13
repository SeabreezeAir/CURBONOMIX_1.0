// packages/agents/architect/src/index.d.ts
// packages/agents/architect/src/index.ts
import type { Task, IAgent, AgentResult } from "../../../lms/src";
// …rest stays the same


export declare class ArchitectAgent implements IAgent {
  name: string;
  run(t: Task): AgentResult | Promise<AgentResult>;
  // add more methods or fields if needed
}

export default ArchitectAgent;
