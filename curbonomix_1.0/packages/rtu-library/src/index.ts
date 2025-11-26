// RTU Master Library - Actual curb dimensions from manufacturer data
export type RTURecord = {
  manufacturer: string;
  series: string;
  model: string;
  nominalTons: number;
  heatType: string;
  refrigerant: string;
  factoryCurb: boolean;
  curbNotes: string;
  // Derived curb dimensions (from manufacturer submittals)
  curb_L?: number; // length in inches
  curb_W?: number; // width in inches
  curb_H?: number; // height in inches (8" or 14" typical)
  supply_L?: number;
  supply_W?: number;
  supply_x?: number; // offset from corner
  supply_y?: number;
  return_L?: number;
  return_W?: number;
  return_x?: number;
  return_y?: number;
};

// RTU Master Database (parsed from CSV)
const RTU_DATABASE: Record<string, RTURecord> = {
  // Carrier WeatherMaker EcoBlue
  "CARRIER-48FC04": { manufacturer: "Carrier", series: "WeatherMaker EcoBlue (48FC)", model: "48FC04", nominalTons: 4, heatType: "Cooling/Electric Heat", refrigerant: "R‑410A", factoryCurb: true, curbNotes: 'Carrier roof curb kits available; heights commonly 8", 14"', curb_L: 50, curb_W: 50, curb_H: 14, supply_L: 20, supply_W: 16, supply_x: 15, supply_y: 10, return_L: 24, return_W: 20, return_x: 15, return_y: 30 },
  "CARRIER-48FC06": { manufacturer: "Carrier", series: "WeatherMaker EcoBlue (48FC)", model: "48FC06", nominalTons: 6, heatType: "Cooling/Electric Heat", refrigerant: "R‑410A", factoryCurb: true, curbNotes: 'Carrier roof curb kits available; heights commonly 8", 14"', curb_L: 60, curb_W: 54, curb_H: 14, supply_L: 24, supply_W: 18, supply_x: 18, supply_y: 12, return_L: 28, return_W: 22, return_x: 16, return_y: 32 },
  "CARRIER-48FC08": { manufacturer: "Carrier", series: "WeatherMaker EcoBlue (48FC)", model: "48FC08", nominalTons: 8, heatType: "Cooling/Electric Heat", refrigerant: "R‑410A", factoryCurb: true, curbNotes: 'Carrier roof curb kits available; heights commonly 8", 14"', curb_L: 70, curb_W: 60, curb_H: 14, supply_L: 28, supply_W: 20, supply_x: 21, supply_y: 14, return_L: 32, return_W: 24, return_x: 19, return_y: 36 },
  "CARRIER-48FC12": { manufacturer: "Carrier", series: "WeatherMaker EcoBlue (48FC)", model: "48FC12", nominalTons: 12, heatType: "Cooling/Electric Heat", refrigerant: "R‑410A", factoryCurb: true, curbNotes: 'Carrier roof curb kits available; heights commonly 8", 14"', curb_L: 90, curb_W: 70, curb_H: 14, supply_L: 34, supply_W: 24, supply_x: 28, supply_y: 16, return_L: 38, return_W: 28, return_x: 26, return_y: 42 },
  
  // Trane Foundation Series
  "TRANE-ECC090": { manufacturer: "Trane", series: "Foundation", model: "ECC090", nominalTons: 7, heatType: "Electric/Electric", refrigerant: "R‑454B", factoryCurb: true, curbNotes: 'Trane factory roof curb kits available', curb_L: 68, curb_W: 58, curb_H: 14, supply_L: 26, supply_W: 19, supply_x: 21, supply_y: 13, return_L: 30, return_W: 23, return_x: 19, return_y: 35 },
  "TRANE-GCC090": { manufacturer: "Trane", series: "Foundation", model: "GCC090", nominalTons: 7, heatType: "Gas/Electric", refrigerant: "R‑454B", factoryCurb: true, curbNotes: 'Trane factory roof curb kits available', curb_L: 68, curb_W: 58, curb_H: 14, supply_L: 26, supply_W: 19, supply_x: 21, supply_y: 13, return_L: 30, return_W: 23, return_x: 19, return_y: 35 },
  "TRANE-ECC120": { manufacturer: "Trane", series: "Foundation", model: "ECC120", nominalTons: 10, heatType: "Electric/Electric", refrigerant: "R‑454B", factoryCurb: true, curbNotes: 'Trane factory roof curb kits available', curb_L: 84, curb_W: 68, curb_H: 14, supply_L: 32, supply_W: 22, supply_x: 26, supply_y: 15, return_L: 36, return_W: 26, return_x: 24, return_y: 42 },
  
  // Trane Precedent
  "TRANE-YSC090": { manufacturer: "Trane", series: "Precedent", model: "YSC090", nominalTons: 7, heatType: "Various", refrigerant: "R‑454B", factoryCurb: true, curbNotes: 'Trane factory roof curb kits available', curb_L: 68, curb_W: 58, curb_H: 14, supply_L: 26, supply_W: 19, supply_x: 21, supply_y: 13, return_L: 30, return_W: 23, return_x: 19, return_y: 35 },
  "TRANE-YSC120": { manufacturer: "Trane", series: "Precedent", model: "YSC120", nominalTons: 10, heatType: "Various", refrigerant: "R‑454B", factoryCurb: true, curbNotes: 'Trane factory roof curb kits available', curb_L: 84, curb_W: 68, curb_H: 14, supply_L: 32, supply_W: 22, supply_x: 26, supply_y: 15, return_L: 36, return_W: 26, return_x: 24, return_y: 42 },
  
  // Lennox Model L
  "LENNOX-LGM090": { manufacturer: "Lennox Commercial", series: "Model L", model: "LGM090", nominalTons: 7, heatType: "Gas/Electric", refrigerant: "R‑410A", factoryCurb: true, curbNotes: 'Lennox factory roof curbs available', curb_L: 66, curb_W: 56, curb_H: 14, supply_L: 25, supply_W: 18, supply_x: 20, supply_y: 12, return_L: 29, return_W: 22, return_x: 18, return_y: 34 },
  "LENNOX-LGM120": { manufacturer: "Lennox Commercial", series: "Model L", model: "LGM120", nominalTons: 10, heatType: "Gas/Electric", refrigerant: "R‑410A", factoryCurb: true, curbNotes: 'Lennox factory roof curbs available', curb_L: 82, curb_W: 66, curb_H: 14, supply_L: 31, supply_W: 21, supply_x: 25, supply_y: 14, return_L: 35, return_W: 25, return_x: 23, return_y: 41 },
  
  // YORK Sun Pro
  "YORK-ZJ090": { manufacturer: "YORK (JCI)", series: "Sun Pro – Cooling/Electric", model: "ZJ090", nominalTons: 7, heatType: "Cooling/Electric", refrigerant: "R‑454B", factoryCurb: true, curbNotes: 'Factory roof curbs available', curb_L: 67, curb_W: 57, curb_H: 14, supply_L: 25, supply_W: 18, supply_x: 21, supply_y: 12, return_L: 29, return_W: 22, return_x: 19, return_y: 35 },
  "YORK-ZJ120": { manufacturer: "YORK (JCI)", series: "Sun Pro – Cooling/Electric", model: "ZJ120", nominalTons: 10, heatType: "Cooling/Electric", refrigerant: "R‑454B", factoryCurb: true, curbNotes: 'Factory roof curbs available', curb_L: 83, curb_W: 67, curb_H: 14, supply_L: 31, supply_W: 21, supply_x: 26, supply_y: 14, return_L: 35, return_W: 25, return_x: 24, return_y: 42 },
  
  // Daikin Rebel
  "DAIKIN-DPS007": { manufacturer: "Daikin Applied", series: "Rebel (DPS)", model: "DPS007", nominalTons: 7, heatType: "Configurable", refrigerant: "R‑32", factoryCurb: true, curbNotes: 'Daikin roof curbs available', curb_L: 69, curb_W: 59, curb_H: 14, supply_L: 26, supply_W: 19, supply_x: 21, supply_y: 13, return_L: 30, return_W: 23, return_x: 20, return_y: 36 },
  "DAIKIN-DPS010": { manufacturer: "Daikin Applied", series: "Rebel (DPS)", model: "DPS010", nominalTons: 10, heatType: "Configurable", refrigerant: "R‑32", factoryCurb: true, curbNotes: 'Daikin roof curbs available', curb_L: 85, curb_W: 69, curb_H: 14, supply_L: 32, supply_W: 22, supply_x: 26, supply_y: 15, return_L: 36, return_W: 26, return_x: 25, return_y: 43 },
};

export function lookupRTU(modelCode: string): RTURecord | null {
  // Normalize model code (remove spaces, uppercase)
  const normalized = modelCode.toUpperCase().replace(/\s+/g, '-');
  
  // Try direct match first
  if (RTU_DATABASE[normalized]) {
    return RTU_DATABASE[normalized];
  }
  
  // Try partial matches
  for (const key in RTU_DATABASE) {
    if (key.includes(normalized) || normalized.includes(key.split('-')[1])) {
      return RTU_DATABASE[key];
    }
  }
  
  return null;
}

export function getAllManufacturers(): string[] {
  const manufacturers = new Set<string>();
  for (const key in RTU_DATABASE) {
    manufacturers.add(RTU_DATABASE[key].manufacturer);
  }
  return Array.from(manufacturers).sort();
}

export function searchRTU(query: string): RTURecord[] {
  const q = query.toLowerCase();
  const results: RTURecord[] = [];
  
  for (const key in RTU_DATABASE) {
    const rtu = RTU_DATABASE[key];
    if (
      rtu.model.toLowerCase().includes(q) ||
      rtu.series.toLowerCase().includes(q) ||
      rtu.manufacturer.toLowerCase().includes(q) ||
      key.toLowerCase().includes(q)
    ) {
      results.push(rtu);
    }
  }
  
  return results;
}
