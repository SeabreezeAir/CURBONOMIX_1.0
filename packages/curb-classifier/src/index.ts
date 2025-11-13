import type { FootprintFamily, ModelMapping } from "./types";
export type { FootprintFamily, ModelMapping } from "./types";

const families: FootprintFamily[] = [
  {
    id: "FAM-RTU-90x50-A",
    topOpen: { w: 90, h: 50 },
    supply: { x: 22, y: -15, w: 24, h: 12 },
    ret: { x: -22, y: 15, w: 24, h: 12 },
    defaults: { topBase: 2.5, flange: 4, height: 14, supportBar: 3 }
  },
  {
    id: "FAM-RTU-96x55-A",
    topOpen: { w: 96, h: 55 },
    supply: { x: 24, y: -16, w: 26, h: 12 },
    ret: { x: -24, y: 16, w: 26, h: 12 },
    defaults: { topBase: 2.5, flange: 4, height: 14, supportBar: 3 }
  },
  {
    id: "FAM-RTU-100x58-A",
    topOpen: { w: 100, h: 58 },
    supply: { x: 25, y: -18, w: 28, h: 12 },
    ret: { x: -25, y: 18, w: 28, h: 12 },
    defaults: { topBase: 2.5, flange: 4, height: 14, supportBar: 3 }
  }
];

const mappings: ModelMapping[] = [
  { brand: "Trane", model: "TTA090", familyId: "FAM-RTU-90x50-A", source: "seed" },
  { brand: "Carrier", model: "50TC-12", familyId: "FAM-RTU-100x58-A", source: "seed" },
  { brand: "Lennox", model: "LGA120", familyId: "FAM-RTU-96x55-A", source: "seed" },
  { brand: "York", model: "ZJ120", familyId: "FAM-RTU-96x55-A", source: "seed" },
  { brand: "Daikin", model: "RPS120", familyId: "FAM-RTU-96x55-A", source: "seed" }
];

function normalize(text: string): string {
  return text.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function findFamily(familyId: string): FootprintFamily | undefined {
  return families.find((fam) => fam.id === familyId);
}

export async function classify(brand: string, model: string): Promise<{ family: FootprintFamily; source: string; overrides?: ModelMapping["overrides"] }> {
  const normalizedBrand = normalize(brand);
  const normalizedModel = normalize(model);
  const hit = mappings.find((mapping) => normalize(mapping.brand) === normalizedBrand && normalize(mapping.model) === normalizedModel);
  if (!hit) {
    throw new Error(`MODEL_NOT_FOUND: ${brand} ${model}`);
  }
  const family = findFamily(hit.familyId);
  if (!family) {
    throw new Error(`FAMILY_NOT_DEFINED: ${hit.familyId}`);
  }
  return { family, source: hit.source, overrides: hit.overrides };
}
