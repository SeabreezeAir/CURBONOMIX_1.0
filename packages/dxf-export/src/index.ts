import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export type Vector2 = [number, number];

export interface DxfBend {
  p1: Vector2;
  p2: Vector2;
  angle: number;
}

export interface DxfLabel {
  at: Vector2;
  text: string;
}

export interface DxfPart {
  name: string;
  outline: Vector2[];
  holes?: Vector2[][];
  bends?: DxfBend[];
  labels?: DxfLabel[];
}

const LAYER_CUT = "CUT";
const LAYER_BEND = "BEND";
const LAYER_ETCH = "ETCH";

function serializePolyline(points: Vector2[], layer: string): string {
  if (points.length === 0) return "";
  const closed = points[0][0] === points[points.length - 1][0] && points[0][1] === points[points.length - 1][1]
    ? points
    : [...points, points[0]];

  let out = `0\nLWPOLYLINE\n8\n${layer}\n90\n${closed.length}\n70\n1\n`;
  for (const [x, y] of closed) {
    out += `10\n${x.toFixed(4)}\n20\n${y.toFixed(4)}\n`;
  }
  return out;
}

function serializeLine([x1, y1]: Vector2, [x2, y2]: Vector2, layer: string): string {
  return `0\nLINE\n8\n${layer}\n10\n${x1.toFixed(4)}\n20\n${y1.toFixed(4)}\n11\n${x2.toFixed(4)}\n21\n${y2.toFixed(4)}\n`;
}

function serializeText([x, y]: Vector2, text: string, layer: string): string {
  const safe = text.replace(/\s+/g, " ");
  return `0\nTEXT\n8\n${layer}\n10\n${x.toFixed(4)}\n20\n${y.toFixed(4)}\n40\n0.25\n1\n${safe}\n`;
}

function wrapBody(body: string): string {
  return `0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n1\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n${body}0\nENDSEC\n0\nEOF\n`;
}

function buildPart(part: DxfPart): string {
  let entities = serializePolyline(part.outline, LAYER_CUT);

  for (const hole of part.holes ?? []) {
    entities += serializePolyline(hole, LAYER_CUT);
  }

  for (const bend of part.bends ?? []) {
    entities += serializeLine(bend.p1, bend.p2, LAYER_BEND);
    const mid: Vector2 = [
      (bend.p1[0] + bend.p2[0]) / 2,
      (bend.p1[1] + bend.p2[1]) / 2
    ];
    entities += serializeText(mid, `${bend.angle.toFixed(0)} deg`, LAYER_ETCH);
  }

  for (const label of part.labels ?? []) {
    entities += serializeText(label.at, label.text, LAYER_ETCH);
  }

  return wrapBody(entities);
}

async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

export async function writeDXF(parts: DxfPart[], outDir: string): Promise<void> {
  await ensureDir(outDir);
  const tasks = parts.map(async (part) => {
    const filePath = join(outDir, `${part.name}.dxf`);
    await ensureDir(dirname(filePath));
    const content = buildPart(part);
    await writeFile(filePath, content, "utf8");
  });
  await Promise.all(tasks);
}
