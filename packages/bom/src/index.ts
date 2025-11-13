import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export type Vector2 = [number, number];

export interface GeometryPart {
  name: string;
  outline: Vector2[];
  holes?: Vector2[][];
  materialGauge?: number;
}

export interface BomItem {
  part: string;
  areaSqIn: number;
  areaSqFt: number;
  weightLb: number;
}

export interface BomSummary {
  items: BomItem[];
  fasteners: number;
  totalWeightLb: number;
}

const SHEET_WEIGHT_LB_PER_FT2 = 2.0; // 18ga galvanized approx, adjustable later
const FASTENER_SPACING_IN = 6;

function polygonArea(points: Vector2[]): number {
  if (points.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

function polygonPerimeter(points: Vector2[]): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    const dx = x2 - x1;
    const dy = y2 - y1;
    total += Math.hypot(dx, dy);
  }
  return total;
}

function partArea(part: GeometryPart): number {
  const outer = polygonArea(part.outline);
  const holes = (part.holes ?? []).reduce((acc, hole) => acc + polygonArea(hole), 0);
  return outer - holes;
}

function estimateWeight(areaSqFt: number, gauge?: number): number {
  const base = SHEET_WEIGHT_LB_PER_FT2;
  if (!gauge) return areaSqFt * base;
  const referenceGauge = 18;
  const factor = referenceGauge / gauge;
  return areaSqFt * base * factor;
}

function formatCsv(summary: BomSummary): string {
  const lines = ["Part,Area (sq in),Area (sq ft),Weight (lb)"];
  for (const item of summary.items) {
    lines.push(
      `${item.part},${item.areaSqIn.toFixed(2)},${item.areaSqFt.toFixed(3)},${item.weightLb.toFixed(2)}`
    );
  }
  lines.push(`Fasteners,${summary.fasteners},,`);
  lines.push(`Total,, ,${summary.totalWeightLb.toFixed(2)}`);
  return lines.join("\n");
}

export async function buildBOM(parts: GeometryPart[], outPath: string): Promise<BomSummary> {
  const items: BomItem[] = [];
  let perimeterTotal = 0;
  let weightTotal = 0;

  for (const part of parts) {
    const areaSqIn = partArea(part);
    const areaSqFt = areaSqIn / 144;
    const weightLb = estimateWeight(areaSqFt, part.materialGauge);
    items.push({ part: part.name, areaSqIn, areaSqFt, weightLb });
    perimeterTotal += polygonPerimeter(part.outline);
    weightTotal += weightLb;
  }

  const fasteners = Math.max(4, Math.ceil(perimeterTotal / FASTENER_SPACING_IN));
  const summary: BomSummary = {
    items,
    fasteners,
    totalWeightLb: weightTotal
  };

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, formatCsv(summary), "utf8");

  return summary;
}
