"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineerAgent = void 0;
class EngineerAgent {
    constructor() {
        this.name = "engineer";
    }
    run(t) {
        const s = t.payload || {};
        const bom = [{ item: "Galv. sheet", ga: s.steel_gauge || 18, area_ft2: ((s.new_L || 60) * (s.new_W || 40)) / 144 },
            { item: "Angles", qty: 4 }, { item: "Fasteners", spacing_in: s.sst || 4 }];
        const checks = { allowable_bend_deg: s.brake_lim || 90, seam: "Pittsburgh" };
        return { ok: true, data: { bom, checks } };
    }
}
exports.EngineerAgent = EngineerAgent;
