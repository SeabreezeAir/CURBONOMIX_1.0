import type { Task, IAgent, AgentResult } from "../../../lms/src";
export declare class EngineerAgent implements IAgent {
    name: string;
    run(t: Task): AgentResult;
}
