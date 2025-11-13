export type Brand = "Trane" | "Carrier" | "Lennox" | "York" | string;

export interface FootprintFamily {
  id: string;
  topOpen: { w: number; h: number };
  supply: { x: number; y: number; w: number; h: number };
  ret: { x: number; y: number; w: number; h: number };
  boltPattern?: { rows: number; cols: number; pitchX: number; pitchY: number; offsetX: number; offsetY: number };
  defaults: { topBase: number; flange: number; height: number; supportBar: number };
}

export interface ModelMapping {
  brand: Brand;
  model: string;
  familyId: string;
  overrides?: Partial<FootprintFamily["defaults"]>;
  source: string;
}
