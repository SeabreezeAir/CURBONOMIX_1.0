const catalog = {
    "TRANE-TTA090": { new_L: 90, new_W: 50, height: 18, flange_h: 3, supply_x: 20, supply_y: 10, return_x: 60, return_y: 10, steel_gauge: 18, sst: 4, brake_lim: 80 },
    "LENNOX-LGA120": { new_L: 96, new_W: 55, height: 20, flange_h: 3, supply_x: 22, supply_y: 12, return_x: 62, return_y: 12, steel_gauge: 18, sst: 4, brake_lim: 80 },
    "CARRIER-50TC-12": { new_L: 100, new_W: 58, height: 22, flange_h: 3, supply_x: 24, supply_y: 12, return_x: 66, return_y: 12, steel_gauge: 18, sst: 4, brake_lim: 80 }
};
export function resolveModel(model) { const k = model.trim().toUpperCase(); const hit = catalog[k]; return hit ? { model: k, ...hit } : undefined; }
export function sizePlenum(spec) {
    const A_ft2 = Math.max(0.5, (spec.new_L * spec.new_W) / (144 * 6));
    const v_sup = 1200, v_ret = 900;
    const cfm_s = spec.cfm_supply ?? Math.round(A_ft2 * v_sup);
    const cfm_r = spec.cfm_return ?? Math.round(A_ft2 * v_ret);
    const dp_inwc = +(0.08 * (cfm_s / 1000) ** 2).toFixed(3);
    return { cfm_s, cfm_r, dp_inwc, vel_sup_fpm: v_sup, vel_ret_fpm: v_ret };
}
export function buildAdapter(spec) {
    // BOTTOM (z=0): Existing RTU curb dimensions (wider)
    // TOP (z=height): New RTU curb dimensions
    // 4-sided downflow transition box
    const L1 = spec.new_L, W1 = spec.new_W, L2 = spec.new_L2 ?? spec.new_L, W2 = spec.new_W2 ?? spec.new_W, H = spec.height;
    // Vertices: bottom 4 corners at z=0, top 4 corners at z=H
    // Bottom corners (existing curb) - origin at (0,0)
    const v = [
        [0, 0, 0], // 0: bottom front-left
        [L1, 0, 0], // 1: bottom front-right
        [L1, W1, 0], // 2: bottom back-right
        [0, W1, 0], // 3: bottom back-left
        // Top corners (new unit) - centered above bottom
        [(L1 - L2) / 2, (W1 - W2) / 2, H], // 4: top front-left
        [(L1 + L2) / 2, (W1 - W2) / 2, H], // 5: top front-right
        [(L1 + L2) / 2, (W1 + W2) / 2, H], // 6: top back-right
        [(L1 - L2) / 2, (W1 + W2) / 2, H] // 7: top back-left
    ];
    // Faces: 4 sides + bottom + top (all as triangles)
    const f = [
        // Bottom (existing curb opening)
        [0, 1, 2], [0, 2, 3],
        // Top (new unit opening)
        [4, 5, 6], [4, 6, 7],
        // Front side (y=0 to y=(W1-W2)/2)
        [0, 1, 5], [0, 5, 4],
        // Right side (x=L1 to x=(L1+L2)/2)
        [1, 2, 6], [1, 6, 5],
        // Back side
        [2, 3, 7], [2, 7, 6],
        // Left side
        [3, 0, 4], [3, 4, 7]
    ];
    return { vertices: v, faces: f };
}
export function toDXF(mesh) {
    const vb = (p) => `${p[0]},${p[1]},${p[2]}`;
    let out = `0
SECTION
2
ENTITIES
`;
    for (const tri of mesh.faces) {
        out += `0
3DFACE
8
CURB
10
${vb(mesh.vertices[tri[0]])}
11
${vb(mesh.vertices[tri[1]])}
12
${vb(mesh.vertices[tri[2]])}
13
${vb(mesh.vertices[tri[2]])}
`;
    }
    out += `0
ENDSEC
0
EOF
`;
    return out;
}
export function toGCode(mesh) {
    const loop = [0, 1, 2, 3, 0].map(i => mesh.vertices[i]);
    let g = "(CURBONOMIX RTU ADAPTER)`nG21`nG90`nG17`nM3 S8000`nG0 Z5`n";
    g += `G0 X${loop[0][0].toFixed(3)} Y${loop[0][1].toFixed(3)}\nG1 Z0 F400\n`;
    for (let i = 1; i < loop.length; i++) {
        g += `G1 X${loop[i][0].toFixed(3)} Y${loop[i][1].toFixed(3)} F800\n`;
    }
    return g + `G0 Z5\nM5\nM30\n`;
}
export function toSubmittal(spec, perf) {
    return `CURBONOMIX SUBMITTAL
Model: ${spec.model ?? "N/A"}
Plan: ${spec.new_L} x ${spec.new_W} in, Height ${spec.height} in, Flange ${spec.flange_h} in
Steel: GA ${spec.steel_gauge}, Fasteners @ ${spec.sst} in, Brake limit ${spec.brake_lim} deg
Airflow: Supply ${perf.cfm_s} cfm @ ${perf.vel_sup_fpm} fpm, Return ${perf.cfm_r} cfm @ ${perf.vel_ret_fpm} fpm
Est. ΔP: ${perf.dp_inwc} in.wc`;
}
export { buildAdvancedAdapter, validateGeometry } from "./advanced-geometry.js";
