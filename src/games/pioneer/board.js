// Pointy-top hex grid topology for Pioneer (3-4-5-4-3 island)
// 19 land hexes, 54 intersections, 72 paths, 9 trading posts on the coast

export const HEX_RADIUS = 64;
export const HEX_WIDTH = Math.sqrt(3) * HEX_RADIUS;

export const ROW_CONFIGS = [
  { row: 0, count: 3, xOffset: -1 },
  { row: 1, count: 4, xOffset: -1.5 },
  { row: 2, count: 5, xOffset: -2 },
  { row: 3, count: 4, xOffset: -1.5 },
  { row: 4, count: 3, xOffset: -1 },
];

function round(n) {
  return Math.round(n * 100) / 100;
}

function vKey(x, y) {
  return `${Math.round(x)},${Math.round(y)}`;
}

// Generate raw hex centers
const rawHexes = [];
let hIdx = 0;
for (const rc of ROW_CONFIGS) {
  const cy = (rc.row - 2) * 1.5 * HEX_RADIUS;
  for (let c = 0; c < rc.count; c += 1) {
    const cx = (rc.xOffset + c) * HEX_WIDTH;
    rawHexes.push({
      id: `hex_${hIdx}`,
      index: hIdx,
      row: rc.row,
      col: c,
      cx: round(cx),
      cy: round(cy),
    });
    hIdx += 1;
  }
}

// Build vertex map and edge map
const vertexKeyMap = new Map();
const edgeKeyMap = new Map();

rawHexes.forEach((h) => {
  const pts = [
    [h.cx, h.cy - HEX_RADIUS], // 0: Top
    [h.cx + HEX_WIDTH / 2, h.cy - HEX_RADIUS / 2], // 1: Top-Right
    [h.cx + HEX_WIDTH / 2, h.cy + HEX_RADIUS / 2], // 2: Bottom-Right
    [h.cx, h.cy + HEX_RADIUS], // 3: Bottom
    [h.cx - HEX_WIDTH / 2, h.cy + HEX_RADIUS / 2], // 4: Bottom-Left
    [h.cx - HEX_WIDTH / 2, h.cy - HEX_RADIUS / 2], // 5: Top-Left
  ];

  pts.forEach((p) => {
    const k = vKey(p[0], p[1]);
    if (!vertexKeyMap.has(k)) {
      vertexKeyMap.set(k, {
        x: round(p[0]),
        y: round(p[1]),
        hexIds: [],
      });
    }
    vertexKeyMap.get(k).hexIds.push(h.id);
  });

  for (let i = 0; i < 6; i += 1) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % 6];
    const k1 = vKey(p1[0], p1[1]);
    const k2 = vKey(p2[0], p2[1]);
    const edgeKey = [k1, k2].sort().join('--');
    if (!edgeKeyMap.has(edgeKey)) {
      edgeKeyMap.set(edgeKey, {
        k1,
        k2,
        mx: round((p1[0] + p2[0]) / 2),
        my: round((p1[1] + p2[1]) / 2),
        hexIds: [],
      });
    }
    edgeKeyMap.get(edgeKey).hexIds.push(h.id);
  }
});

// Sort vertices deterministically: top-to-bottom, left-to-right
const sortedVertexEntries = Array.from(vertexKeyMap.entries()).sort((a, b) => {
  if (Math.abs(a[1].y - b[1].y) > 2) return a[1].y - b[1].y;
  return a[1].x - b[1].x;
});

const keyToIntId = new Map();
export const INTERSECTIONS = {};

sortedVertexEntries.forEach(([k, val], index) => {
  const id = `int_${index}`;
  keyToIntId.set(k, id);
  INTERSECTIONS[id] = {
    id,
    index,
    x: val.x,
    y: val.y,
    hexIds: val.hexIds,
    pathIds: [],
    neighborIntIds: [],
    tradingPost: null,
  };
});

// Sort edges deterministically
const sortedEdgeEntries = Array.from(edgeKeyMap.entries()).sort((a, b) => {
  const eA = a[1];
  const eB = b[1];
  if (Math.abs(eA.my - eB.my) > 2) return eA.my - eB.my;
  return eA.mx - eB.mx;
});

export const PATHS = {};
sortedEdgeEntries.forEach(([_, val], index) => {
  const id = `path_${index}`;
  const intA = keyToIntId.get(val.k1);
  const intB = keyToIntId.get(val.k2);
  const [firstInt, secondInt] = [intA, intB].sort();

  PATHS[id] = {
    id,
    index,
    intA: firstInt,
    intB: secondInt,
    mx: val.mx,
    my: val.my,
    hexIds: val.hexIds,
  };

  INTERSECTIONS[intA].pathIds.push(id);
  INTERSECTIONS[intB].pathIds.push(id);
  if (!INTERSECTIONS[intA].neighborIntIds.includes(intB)) INTERSECTIONS[intA].neighborIntIds.push(intB);
  if (!INTERSECTIONS[intB].neighborIntIds.includes(intA)) INTERSECTIONS[intB].neighborIntIds.push(intA);
});

// Assemble HEXES with vertices and edges clockwise
export const HEXES = {};
rawHexes.forEach((h) => {
  const pts = [
    [h.cx, h.cy - HEX_RADIUS],
    [h.cx + HEX_WIDTH / 2, h.cy - HEX_RADIUS / 2],
    [h.cx + HEX_WIDTH / 2, h.cy + HEX_RADIUS / 2],
    [h.cx, h.cy + HEX_RADIUS],
    [h.cx - HEX_WIDTH / 2, h.cy + HEX_RADIUS / 2],
    [h.cx - HEX_WIDTH / 2, h.cy - HEX_RADIUS / 2],
  ];

  const vertexIds = pts.map((p) => keyToIntId.get(vKey(p[0], p[1])));
  const edgeIds = [];
  for (let i = 0; i < 6; i += 1) {
    const k1 = vKey(pts[i][0], pts[i][1]);
    const k2 = vKey(pts[(i + 1) % 6][0], pts[(i + 1) % 6][1]);
    const path = Object.values(PATHS).find(
      (p) => (p.intA === keyToIntId.get(k1) && p.intB === keyToIntId.get(k2)) ||
             (p.intA === keyToIntId.get(k2) && p.intB === keyToIntId.get(k1))
    );
    if (path) edgeIds.push(path.id);
  }

  const polygonPoints = pts.map((p) => `${round(p[0])},${round(p[1])}`).join(' ');

  HEXES[h.id] = {
    ...h,
    vertices: vertexIds,
    edges: edgeIds,
    points: polygonPoints,
  };
});

// Trace coastal paths and build 9 trading post slots around the perimeter
const coastalPaths = Object.values(PATHS).filter((p) => p.hexIds.length === 1);
const coastalAdj = new Map();
coastalPaths.forEach((p) => {
  if (!coastalAdj.has(p.intA)) coastalAdj.set(p.intA, []);
  if (!coastalAdj.has(p.intB)) coastalAdj.set(p.intB, []);
  coastalAdj.get(p.intA).push({ next: p.intB, pathId: p.id });
  coastalAdj.get(p.intB).push({ next: p.intA, pathId: p.id });
});

// Find topmost coastal vertex
const coastalStart = Array.from(coastalAdj.keys()).sort((a, b) => {
  const ia = INTERSECTIONS[a];
  const ib = INTERSECTIONS[b];
  if (Math.abs(ia.y - ib.y) > 2) return ia.y - ib.y;
  return ia.x - ib.x;
})[0];

const perimeterRing = [];
let currInt = coastalStart;
let prevInt = null;
while (perimeterRing.length < coastalPaths.length) {
  perimeterRing.push(currInt);
  const connections = coastalAdj.get(currInt) || [];
  const nextConn = connections.find((c) => c.next !== prevInt) || connections[0];
  prevInt = currInt;
  currInt = nextConn ? nextConn.next : null;
  if (!currInt || currInt === coastalStart) break;
}

// 9 trading post edge indices along the 30 coastal edges
const POST_EDGE_INDICES = [0, 3, 7, 10, 14, 17, 20, 24, 27];

export const TRADING_POST_SLOTS = POST_EDGE_INDICES.map((idx, slotNum) => {
  const intA = perimeterRing[idx];
  const intB = perimeterRing[(idx + 1) % perimeterRing.length];
  const pA = INTERSECTIONS[intA];
  const pB = INTERSECTIONS[intB];
  const mx = (pA.x + pB.x) / 2;
  const my = (pA.y + pB.y) / 2;
  // Direction outward from origin (0, 0)
  const dist = Math.hypot(mx, my) || 1;
  const labelX = round(mx + (mx / dist) * 36);
  const labelY = round(my + (my / dist) * 36);

  const postId = `post_${slotNum}`;
  INTERSECTIONS[intA].tradingPost = postId;
  INTERSECTIONS[intB].tradingPost = postId;

  return {
    id: postId,
    intIds: [intA, intB],
    mx: round(mx),
    my: round(my),
    labelX,
    labelY,
  };
});

export const BOARD_BOUNDS = {
  minX: -260,
  maxX: 260,
  minY: -250,
  maxY: 250,
  width: 520,
  height: 500,
};
