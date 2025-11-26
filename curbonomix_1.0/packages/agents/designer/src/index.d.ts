import type { Task, IAgent, AgentResult } from "@curbonomix/lms";
export declare class DesignerAgent implements IAgent {
    name: string;
    run(t: Task): AgentResult;
}
