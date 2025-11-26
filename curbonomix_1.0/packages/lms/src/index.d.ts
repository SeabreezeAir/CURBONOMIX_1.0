export type Task = {
    action: string;
    payload: any;
};
export type AgentResult = {
    ok: boolean;
    data?: any;
    error?: string;
};
export interface IAgent {
    name: string;
    run(task: Task): AgentResult;
}
export declare class LMS {
    record(event: any): void;
}
export declare class SuperAgent {
    constructor(lms: LMS);
    register(agent: any): void;
}
