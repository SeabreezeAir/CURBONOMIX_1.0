import type { MeshData } from "./index.js";
/**
 * Advanced Geometry Builder
 * Creates adapter by connecting existing curb corners to new unit supply/return openings
 * Uses sharp slopes when needed for optimal airflow
 */
export type CurbCorners = {
    c0: [number, number, number];
    c1: [number, number, number];
    c2: [number, number, number];
    c3: [number, number, number];
};
export type Opening = {
    x: number;
    y: number;
    w: number;
    h: number;
    z: number;
};
/**
 * Connect curb corners to unit openings with optimized transitions
 *
 * Strategy:
 * 1. Base (z=0): existing curb 4 corners
 * 2. Mid-level: transition points that fan out from corners
 * 3. Top (z=height): supply and return rectangular openings
 * 4. Use sharp slopes (up to 45°) where needed for structural strength
 * 5. Smooth transitions between sections for airflow
 */
export declare function buildAdvancedAdapter(existingCurb: {
    L: number;
    W: number;
}, // existing curb dimensions
newUnit: {
    supply: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    return: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
}, height: number, options?: {
    maxSlope?: number;
    segments?: number;
}): MeshData;
/**
 * Calculate slope angle between two points
 */
export declare function calculateSlope(p1: number[], p2: number[]): number;
/**
 * Validate geometry for fabrication
 */
export declare function validateGeometry(mesh: MeshData): {
    maxSlope: number;
    minSlope: number;
    avgSlope: number;
    warnings: string[];
};
