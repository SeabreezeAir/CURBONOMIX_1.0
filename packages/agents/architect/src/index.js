export async function planJob(input) {
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
export class ArchitectAgent {
    name = "architect";
    async run(task) {
        if (task.action !== "architect.plan") {
            return { ok: false, error: "ARCHITECT_UNHANDLED_ACTION" };
        }
        const input = task.payload;
        const plan = await planJob(input);
        return { ok: true, data: plan };
    }
}
export default ArchitectAgent;
