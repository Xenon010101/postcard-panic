import {
  EXIT,
  START,
  WIDTH,
  HEIGHT,
  nodes,
  streets,
  streetKey,
  distance,
} from "./map";
export interface Pixels {
  width: number;
  height: number;
  data: ArrayLike<number>;
}
export interface Route {
  nodes: number[];
  edges: string[];
  length: number;
}
export interface RouteAnalysis {
  route: Route | null;
  error: string | null;
  markedEdges: string[];
  problemNodes: number[];
}
export function isCyan(r: number, g: number, b: number, a: number) {
  return a > 170 && r < 130 && g > 135 && b > 165 && b - r > 90 && g - r > 75;
}
function cyanNear(p: Pixels, x: number, y: number) {
  // A 24px corridor tolerates finger/pen wobble without reaching adjacent roads.
  for (let dy = -24; dy <= 24; dy += 2)
    for (let dx = -24; dx <= 24; dx += 2) {
      if (dx * dx + dy * dy > 576) continue;
      const px = Math.round(x + dx),
        py = Math.round(y + dy);
      if (px < 0 || py < 0 || px >= p.width || py >= p.height) continue;
      const i = (py * p.width + px) * 4;
      if (isCyan(p.data[i], p.data[i + 1], p.data[i + 2], p.data[i + 3]))
        return true;
    }
  return false;
}
export function analyzeRoute(p: Pixels): RouteAnalysis {
  const fail = (
    error: string,
    markedEdges: string[] = [],
    problemNodes: number[] = [],
  ): RouteAnalysis => ({ route: null, error, markedEdges, problemNodes });
  if (p.width !== WIDTH || p.height !== HEIGHT)
    return fail(
      "This postcard has been resized. Use an original 1024 × 704 postcard PNG.",
    );
  const selected = streets.filter((s) => {
    const a = nodes[s.a],
      b = nodes[s.b];
    let hits = 0;
    for (let k = 0; k < 18; k++) {
      const t = 0.13 + (k * 0.74) / 17;
      if (cyanNear(p, a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)) hits++;
    }
    return hits >= 14;
  });
  const markedEdges = selected.map((s) => streetKey(s.a, s.b));
  if (!selected.length)
    return fail(
      "No route found yet. Use the cyan pen (#00D8FF) to trace the streets from PICKUP to BOAT.",
    );
  const adj = new Map<number, number[]>();
  for (const s of selected) {
    adj.set(s.a, [...(adj.get(s.a) || []), s.b]);
    adj.set(s.b, [...(adj.get(s.b) || []), s.a]);
  }
  const branches = [...adj].filter(([, v]) => v.length > 2).map(([k]) => k);
  if (branches.length)
    return fail(
      "Your driver needs one clear route. Remove the extra branch at the highlighted junction.",
      markedEdges,
      branches,
    );
  if (!adj.has(START) || !adj.has(EXIT))
    return fail(
      "Connect PICKUP to BOAT. Trace every street in between, including the last stretch.",
      markedEdges,
      [...(!adj.has(START) ? [START] : []), ...(!adj.has(EXIT) ? [EXIT] : [])],
    );
  if (adj.get(START)!.length !== 1 || adj.get(EXIT)!.length !== 1)
    return fail(
      "Start at PICKUP and finish at BOAT, with just one line entering each.",
      markedEdges,
      [START, EXIT],
    );
  const path = [START];
  let current = START,
    previous = -1;
  while (current !== EXIT) {
    const next = adj.get(current)?.find((n) => n !== previous);
    if (next === undefined)
      return fail(
        "There is a gap in your route. Join the highlighted end to the next street.",
        markedEdges,
        [current],
      );
    if (path.includes(next))
      return fail(
        "Your route goes in a loop. Give the driver a single path to the boat.",
        markedEdges,
        [next],
      );
    previous = current;
    current = next;
    path.push(current);
  }
  if (path.length !== adj.size)
    return fail(
      "There is a disconnected mark or loop. Keep only one continuous escape route.",
      markedEdges,
      [...adj.keys()].filter((n) => !path.includes(n)),
    );
  return {
    route: {
      nodes: path,
      edges: markedEdges,
      length: path
        .slice(1)
        .reduce((sum, n, i) => sum + distance(nodes[path[i]], nodes[n]), 0),
    },
    error: null,
    markedEdges,
    problemNodes: [],
  };
}
