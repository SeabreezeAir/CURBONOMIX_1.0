export type CurbSpec = {
    L: number;
    W: number;
    H: number;
};
export type CurbCompatibility = {
    curb: CurbSpec;
    models: string[];
    manufacturers: Set<string>;
};
export declare function buildCurbCompatibilityMap(): Map<string, CurbCompatibility>;
export declare function findCompatibleCurbs(modelNumber: string): string[];
export declare function areCurbCompatible(model1: string, model2: string): boolean;
export declare function getCurbCompatibilitySummary(): CurbCompatibility[];
