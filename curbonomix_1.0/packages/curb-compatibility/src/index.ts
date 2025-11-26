// Curb Compatibility Database
// Groups RTU models that share the same curb dimensions

import { lookupRTU, type RTURecord } from 'rtu-library';

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

// Build curb-to-models mapping
export function buildCurbCompatibilityMap(): Map<string, CurbCompatibility> {
  const map = new Map<string, CurbCompatibility>();
  
  // Get all RTU models from library (manually list for now - could query database)
  const models = [
    "CARRIER-48FC04", "CARRIER-48FC06", "CARRIER-48FC08", "CARRIER-48FC12",
    "TRANE-ECC090", "TRANE-GCC090", "TRANE-ECC120",
    "TRANE-YSC090", "TRANE-YSC120",
    "LENNOX-LGM090", "LENNOX-LGM120",
    "YORK-ZJ090", "YORK-ZJ120",
    "DAIKIN-DCC096", "DAIKIN-DCC120"
  ];
  
  for (const model of models) {
    const rtu = lookupRTU(model);
    if (!rtu || !rtu.curb_L || !rtu.curb_W || !rtu.curb_H) continue;
    
    const curbKey = `${rtu.curb_L}x${rtu.curb_W}x${rtu.curb_H}`;
    
    if (!map.has(curbKey)) {
      map.set(curbKey, {
        curb: { L: rtu.curb_L, W: rtu.curb_W, H: rtu.curb_H },
        models: [],
        manufacturers: new Set()
      });
    }
    
    const compat = map.get(curbKey)!;
    compat.models.push(model);
    compat.manufacturers.add(rtu.manufacturer);
  }
  
  return map;
}

// Find compatible curbs for a given model
export function findCompatibleCurbs(modelNumber: string): string[] {
  const rtu = lookupRTU(modelNumber);
  if (!rtu || !rtu.curb_L || !rtu.curb_W || !rtu.curb_H) return [];
  
  const curbKey = `${rtu.curb_L}x${rtu.curb_W}x${rtu.curb_H}`;
  const map = buildCurbCompatibilityMap();
  const compat = map.get(curbKey);
  
  return compat ? compat.models.filter(m => m !== modelNumber) : [];
}

// Check if two models are curb-compatible
export function areCurbCompatible(model1: string, model2: string): boolean {
  const rtu1 = lookupRTU(model1);
  const rtu2 = lookupRTU(model2);
  
  if (!rtu1 || !rtu2) return false;
  
  return (
    rtu1.curb_L === rtu2.curb_L &&
    rtu1.curb_W === rtu2.curb_W &&
    rtu1.curb_H === rtu2.curb_H
  );
}

// Get curb compatibility summary
export function getCurbCompatibilitySummary(): CurbCompatibility[] {
  const map = buildCurbCompatibilityMap();
  return Array.from(map.values()).sort((a, b) => b.models.length - a.models.length);
}
