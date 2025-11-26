import type { Task, IAgent, AgentResult } from "@curbonomix/lms";
export declare class ArchitectAgent implements IAgent {
    name: string;
    run(t: Task): AgentResult;
}
