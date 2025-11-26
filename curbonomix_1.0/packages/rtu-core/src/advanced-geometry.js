const DEFAULT_SUPPLY_SIZE = { w: 20, h: 16 };
const DEFAULT_RETURN_SIZE = { w: 24, h: 20 };
const smoothStep = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
function rectVertices(x, y, w, h, z) {
    const hw = w / 2;
    const hh = h / 2;
    return [
        [x - hw, y - hh, z],
        [x + hw, y - hh, z],
        [x + hw, y + hh, z],
        [x - hw, y + hh, z]
    ];
}
function loftQuad(bottom, top, vertices, faces, opts) {
    const rings = [];
    const { segments, curvature, capBottom = true, capTop = true } = opts;
    const segs = Math.max(segments, 1);
    for (let layer = 0; layer <= segs; layer++) {
        const linearT = layer / segs;
        const easedT = smoothStep(Math.pow(linearT, curvature));
        const ring = [];
        for (let i = 0; i < bottom.length; i++) {
            const b = bottom[i];
            const t = top[i];
            const x = lerp(b[0], t[0], easedT);
            const y = lerp(b[1], t[1], easedT);
            const z = lerp(b[2], t[2], linearT);
            vertices.push([x, y, z]);
            ring.push(vertices.length - 1);
        }
        rings.push(ring);
    }
    for (let layer = 0; layer < rings.length - 1; layer++) {
        const lower = rings[layer];
        const upper = rings[layer + 1];
        for (let i = 0; i < lower.length; i++) {
            const next = (i + 1) % lower.length;
            faces.push([lower[i], lower[next], upper[next]]);
            faces.push([lower[i], upper[next], upper[i]]);
        }
    }
    if (capBottom) {
        const base = rings[0];
        faces.push([base[0], base[1], base[2]]);
        faces.push([base[0], base[2], base[3]]);
    }
    if (capTop) {
        const topRing = rings[rings.length - 1];
        faces.push([topRing[0], topRing[2], topRing[1]]);
        faces.push([topRing[0], topRing[3], topRing[2]]);
    }
    return { rings };
}
function clampRect(rect, bounds) {
    return rect.map(([x, y, z]) => [
        Math.min(Math.max(x, 0), bounds.L),
        Math.min(Math.max(y, 0), bounds.W),
        z
    ]);
}
export function buildAdvancedAdapter(existingCurb, newUnit, height, options = {}) {
    const segments = Math.max(options.segments ?? 4, 2);
    const flare = options.flareFactor ?? 1.25;
    const curvature = options.maxSlope ? Math.max(0.6, 45 / options.maxSlope) : 1.0;
    const vertices = [];
    const faces = [];
    const baseOuter = rectVertices(existingCurb.L / 2, existingCurb.W / 2, existingCurb.L, existingCurb.W, 0);
    const topOuter = rectVertices(
    existingCurb.L / 2,
    existingCurb.W / 2,
    Math.min((newUnit === null || newUnit === void 0 ? void 0 : newUnit.L) ?? existingCurb.L * 0.8, existingCurb.L * 0.98),
    Math.min((newUnit === null || newUnit === void 0 ? void 0 : newUnit.W) ?? existingCurb.W * 0.8, existingCurb.W * 0.98),
    height);
    loftQuad(baseOuter, topOuter, vertices, faces, {
        segments,
        curvature,
        capBottom: true,
        capTop: true
    });
    const supplySize = {
        w: (newUnit === null || newUnit === void 0 ? void 0 : newUnit.supply?.w) ?? DEFAULT_SUPPLY_SIZE.w,
        h: (newUnit === null || newUnit === void 0 ? void 0 : newUnit.supply?.h) ?? DEFAULT_SUPPLY_SIZE.h
    };
    const returnSize = {
        w: (newUnit === null || newUnit === void 0 ? void 0 : newUnit.return?.w) ?? DEFAULT_RETURN_SIZE.w,
        h: (newUnit === null || newUnit === void 0 ? void 0 : newUnit.return?.h) ?? DEFAULT_RETURN_SIZE.h
    };
    const bottomSupply = clampRect(rectVertices((newUnit === null || newUnit === void 0 ? void 0 : newUnit.supply?.x) ?? existingCurb.L / 3, (newUnit === null || newUnit === void 0 ? void 0 : newUnit.supply?.y) ?? existingCurb.W / 3, supplySize.w * flare, supplySize.h * flare, 0), existingCurb);
    const topSupply = rectVertices(newUnit.supply.x, newUnit.supply.y, supplySize.w, supplySize.h, height);
    loftQuad(bottomSupply, topSupply, vertices, faces, {
        segments,
        curvature: curvature * 0.9,
        capBottom: false,
        capTop: false
    });
    const bottomReturn = clampRect(rectVertices((newUnit === null || newUnit === void 0 ? void 0 : newUnit.return?.x) ?? (existingCurb.L * 2) / 3, (newUnit === null || newUnit === void 0 ? void 0 : newUnit.return?.y) ?? (existingCurb.W * 2) / 3, returnSize.w * flare, returnSize.h * flare, 0), existingCurb);
    const topReturn = rectVertices(newUnit.return.x, newUnit.return.y, returnSize.w, returnSize.h, height);
    loftQuad(bottomReturn, topReturn, vertices, faces, {
        segments,
        curvature: curvature * 0.9,
        capBottom: false,
        capTop: false
    });
    const spineRings = [];
    for (let layer = 0; layer <= segments; layer++) {
        const t = layer / segments;
        const eased = smoothStep(t);
        const z = height * t;
        const supplyCenter = [
            lerp(existingCurb.L / 2, newUnit.supply.x, eased),
            lerp(existingCurb.W * 0.35, newUnit.supply.y, eased),
            z
        ];
        const returnCenter = [
            lerp(existingCurb.L / 2, newUnit.return.x, eased),
            lerp(existingCurb.W * 0.65, newUnit.return.y, eased),
            z
        ];
        vertices.push(supplyCenter, returnCenter);
        spineRings.push([vertices.length - 2, vertices.length - 1]);
    }
    for (let layer = 0; layer < spineRings.length - 1; layer++) {
        const lower = spineRings[layer];
        const upper = spineRings[layer + 1];
        faces.push([lower[0], upper[0], upper[1]]);
        faces.push([lower[0], upper[1], lower[1]]);
    }
    return { vertices, faces };
}
/**
 * Calculate slope angle between two points
 */
export function calculateSlope(p1, p2) {
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const dz = p2[2] - p1[2];
    const horizontal = Math.sqrt(dx * dx + dy * dy);
    return Math.atan(dz / horizontal) * (180 / Math.PI);
}
/**
 * Validate geometry for fabrication
 */
export function validateGeometry(mesh) {
    const slopes = [];
    const warnings = [];
    for (const face of mesh.faces) {
        for (let i = 0; i < face.length - 1; i++) {
            const p1 = mesh.vertices[face[i]];
            const p2 = mesh.vertices[face[i + 1]];
            const slope = Math.abs(calculateSlope(p1, p2));
            slopes.push(slope);
        }
    }
    const maxSlope = Math.max(...slopes);
    const minSlope = Math.min(...slopes);
    const avgSlope = slopes.reduce((a, b) => a + b, 0) / slopes.length;
    if (maxSlope > 45) {
        warnings.push(`Maximum slope ${maxSlope.toFixed(1)}° exceeds recommended 45° - may be difficult to fabricate`);
    }
    if (maxSlope < 5) {
        warnings.push(`Very shallow slopes detected - may accumulate debris`);
    }
    return { maxSlope, minSlope, avgSlope, warnings };
}
