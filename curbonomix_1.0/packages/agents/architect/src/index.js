"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArchitectAgent = void 0;
const src_1 = require("../../../rtu-core/src");
class ArchitectAgent {
    constructor() {
        this.name = "architect";
    }
    run(t) {
        if (t.action !== "architect.run")
            return { ok: false, error: "action mismatch" };
        const spec = t.payload;
        const perf = (0, src_1.sizePlenum)(spec);
        const geo = (0, src_1.buildAdapter)(spec);
        return { ok: true, data: { plan: ["capture-spec", "size-plenum", "generate-geometry", "exports"], perf, geo } };
    }
}
exports.ArchitectAgent = ArchitectAgent;
