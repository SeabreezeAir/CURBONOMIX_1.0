export type Vector2 = [number, number];

export interface Opening {
  x: number; // center offset from adapter centroid (inches)
  y: number;
  w: number;
  h: number;
}

export interface AdapterSpec {
  familyId?: string;
  brand?: string;
  model?: string;
  topOpen: { w: number; h: number };
  supply: Opening;
  ret: Opening;
  topBase: number;
  flange: number;
  height: number;
  supportBar: number;
}

export interface BendLine {
  p1: Vector2;
  p2: Vector2;
  angle: number; // degrees; 90 => upwards flange
}

export interface AdapterPart {
  name: string;
  outline: Vector2[];
  holes?: Vector2[][];
  bends?: BendLine[];
  labels?: Array<{ at: Vector2; text: string }>;
  metadata?: Record<string, unknown>;
}

export interface AdapterGeometry {
  parts: AdapterPart[];
  summary: {
    outerWidth: number;
    outerDepth: number;
    seatWidth: number;
    seatDepth: number;
    height: number;
    centerOfGravity: Vector2;
  };
}

const RECT_SEQUENCE: Vector2[] = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1]
];

function scaledRectangle(width: number, height: number, origin: Vector2 = [0, 0]): Vector2[] {
  const [ox, oy] = origin;
  return RECT_SEQUENCE.map(([x, y]) => [ox + x * width, oy + y * height] as Vector2);
}

function translate(points: Vector2[], dx: number, dy: number): Vector2[] {
  return points.map(([x, y]) => [x + dx, y + dy] as Vector2);
}

function openingToHole(opening: Opening, outerWidth: number, outerDepth: number): Vector2[] {
  const centerX = outerWidth / 2 + opening.x;
  const centerY = outerDepth / 2 + opening.y;
  const lowerLeftX = centerX - opening.w / 2;
  const lowerLeftY = centerY - opening.h / 2;
  return scaledRectangle(opening.w, opening.h, [lowerLeftX, lowerLeftY]);
}

function calculateCentroid(outer: { width: number; depth: number }, seat: { width: number; depth: number }, openings: Opening[]): Vector2 {
  const outerArea = outer.width * outer.depth;
  const seatArea = seat.width * seat.depth;

  const centroidAccumulator = {
    x: outerArea * (outer.width / 2),
    y: outerArea * (outer.depth / 2),
    area: outerArea
  };

  // subtract deck seat (void)
  centroidAccumulator.x -= seatArea * (outer.width / 2);
  centroidAccumulator.y -= seatArea * (outer.depth / 2);
  centroidAccumulator.area -= seatArea;

  for (const opening of openings) {
    const area = opening.w * opening.h;
    if (area <= 0) continue;
    const centerX = outer.width / 2 + opening.x;
    const centerY = outer.depth / 2 + opening.y;
    centroidAccumulator.x -= area * centerX;
    centroidAccumulator.y -= area * centerY;
    centroidAccumulator.area -= area;
  }

  const area = centroidAccumulator.area || 1;
  return [centroidAccumulator.x / area - outer.width / 2, centroidAccumulator.y / area - outer.depth / 2];
}

export function buildAdapter(spec: AdapterSpec): AdapterGeometry {
  const topBase = spec.topBase;
  const flange = spec.flange;
  const height = spec.height;
  const outerWidth = spec.topOpen.w + 2 * (topBase + flange);
  const outerDepth = spec.topOpen.h + 2 * (topBase + flange);
  const seatWidth = spec.topOpen.w + 2 * topBase;
  const seatDepth = spec.topOpen.h + 2 * topBase;

  const seatOffsetX = (outerWidth - seatWidth) / 2;
  const seatOffsetY = (outerDepth - seatDepth) / 2;

  const deckOutline = scaledRectangle(outerWidth, outerDepth);
  const seatHole = scaledRectangle(seatWidth, seatDepth, [seatOffsetX, seatOffsetY]);
  const supplyHole = openingToHole(spec.supply, outerWidth, outerDepth);
  const returnHole = openingToHole(spec.ret, outerWidth, outerDepth);

  const deck: AdapterPart = {
    name: "DECK",
    outline: deckOutline,
    holes: [seatHole, supplyHole, returnHole],
    labels: [
      { at: [outerWidth / 2, outerDepth / 2], text: "DECK" },
      { at: [outerWidth / 2, outerDepth - flange / 2], text: `FLANGE ${flange.toFixed(2)}"` }
    ],
    metadata: {
      seatWidth,
      seatDepth
    }
  };

  const wallHeight = height + flange;
  const longWallOutline = scaledRectangle(outerWidth, wallHeight);
  const shortWallOutline = scaledRectangle(outerDepth, wallHeight);
  const bendLine: BendLine = {
    p1: [0, flange],
    p2: [outerWidth, flange],
    angle: 90
  };
  const shortBendLine: BendLine = {
    p1: [0, flange],
    p2: [outerDepth, flange],
    angle: 90
  };

  const walls: AdapterPart[] = [
    {
      name: "WALL_LONG_A",
      outline: longWallOutline,
      bends: [bendLine]
    },
    {
      name: "WALL_LONG_B",
      outline: longWallOutline,
      bends: [bendLine]
    },
    {
      name: "WALL_SHORT_A",
      outline: shortWallOutline,
      bends: [shortBendLine]
    },
    {
      name: "WALL_SHORT_B",
      outline: shortWallOutline,
      bends: [shortBendLine]
    }
  ];

  const supportLength = seatWidth;
  const support: AdapterPart = {
    name: "SUPPORT_BAR",
    outline: scaledRectangle(supportLength, spec.supportBar),
    labels: [{ at: [supportLength / 2, spec.supportBar / 2], text: "SUPPORT" }]
  };

  const centerOfGravity = calculateCentroid(
    { width: outerWidth, depth: outerDepth },
    { width: seatWidth, depth: seatDepth },
    [spec.supply, spec.ret]
  );

  const parts: AdapterPart[] = [deck, ...walls, support];

  return {
    parts,
    summary: {
      outerWidth,
      outerDepth,
      seatWidth,
      seatDepth,
      height,
      centerOfGravity
    }
  };
}

export type { AdapterPart as GeometryPart };
