export type Task = { action: string; payload: any };
export type AgentResult = { ok: boolean; data?: any; error?: string };
export interface IAgent {
  name: string;
  run(task: Task): AgentResult;
}

export class LMS {
  record(event: any) {}
}

export class SuperAgent {
  constructor(lms: LMS) {}
  register(agent: any) {}
}
