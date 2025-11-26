import type { Task, IAgent, AgentResult } from "@curbonomix/lms";
export declare class EngineerAgent implements IAgent {
    name: string;
    run(t: Task): AgentResult;
}
