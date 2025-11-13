// packages/lms/src/index.ts

// Core task passed to agents
export type Task = {
  id: string;
  type: string;                     // e.g. "build", "deploy", "classify"
  action?: string;                  // optional verb describing what the agent should do
  payload: unknown;                 // task-specific data
  meta?: Record<string, unknown>;   // optional context (user, env, etc.)
};

// Standard agent result
export type AgentResult = {
  ok: boolean;
  data?: unknown;                   // success payload
  error?: string;                   // message when ok === false
};

// Agent interface
export interface IAgent {
  name: string;
  run(task: Task): Promise<AgentResult> | AgentResult;
}

// Small helpers
export const success = (data?: unknown): AgentResult => ({ ok: true, data });
export const failure = (error: string, data?: unknown): AgentResult => ({ ok: false, error, data });
