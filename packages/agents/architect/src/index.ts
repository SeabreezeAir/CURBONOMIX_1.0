import type { AgentResult, IAgent, Task } from "@curbonomix/lms";

export interface PlanJobInput {
  brand: string;
  model: string;
  options?: Record<string, unknown>;
}

export interface JobPlan {
  steps: string[];
  constraints: {
    topBase: number;
    flange: number;
    supportBar: number;
    height: number;
  };
  notes: string[];
}

export async function planJob(input: PlanJobInput): Promise<JobPlan> {
  return {
    steps: ["classify", "design", "engineer", "export"],
    constraints: {
      topBase: 2.5,
      flange: 4,
      supportBar: 3,
      height: 14
    },
    notes: [
      `Planning curb adapter for ${input.brand} ${input.model}`,
      "Ensure catalog lookup succeeds before production",
      "Log job manifest for downstream agents"
    ]
  };
}

export class ArchitectAgent implements IAgent {
  name = "architect";

  async run(task: Task): Promise<AgentResult> {
    if (task.action !== "architect.plan") {
      return { ok: false, error: "ARCHITECT_UNHANDLED_ACTION" };
    }

    const input = task.payload as PlanJobInput;
    const plan = await planJob(input);
    return { ok: true, data: plan };
  }
}

export default ArchitectAgent;