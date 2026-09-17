import {
  START,
  EXIT,
  distance,
  nodes,
  streetKey,
  findStreet,
} from "./map";
import { DEADLINE, clockLabel, simulate, type Simulation } from "./simulation";
import type { Route } from "./route";

export interface IntelliStatus {
  state: string;
  detail: string;
}
export interface Revision {
  label: string;
  nodes: number[];
  blurb: string;
}
export interface Briefing {
  codename: string;
  risk: number;
  advisories: string[];
  bridge: IntelliStatus;
  patrol: IntelliStatus;
  boat: IntelliStatus;
  eta: string;
  verdict: string;
  suggestion: Revision | null;
}

const ADJECTIVES = [
  "SUNSET",
  "CLEAN",
  "MIDNIGHT",
  "CORAL",
  "SALT",
  "NEON",
  "DRIFT",
  "AMBER",
  "TIDAL",
  "MANGROVE",
  "PALM",
  "BROKEN",
];
const NOUNS = [
  "ALIBI",
  "GETAWAY",
  "POSTMARK",
  "PACKAGE",
  "RECEIPT",
  "TIDE",
  "VACATION",
  "FLAMINGO",
  "COMPASS",
  "MARGIN",
  "HOLIDAY",
  "TOURIST",
];

function hashIds(ids: number[], salt: number): number {
  let h = (salt | 0) + 0x9e3779b9;
  for (const id of ids) h = ((h << 5) - h + id) | 0;
  return h >>> 0;
}
function routeCodename(route: Route, outcome: Simulation["outcome"]): string {
  const salt =
    outcome === "escaped" ? 11 : outcome === "busted" ? 23 : 41;
  const h = hashIds(route.nodes, salt);
  return `THE ${ADJECTIVES[h % ADJECTIVES.length]} ${
    NOUNS[(h >>> 7) % NOUNS.length]
  }`;
}

interface RouteFacts {
  bridge: boolean;
  bridgeWait: boolean;
  patrol: boolean;
  boardwalk: boolean;
  margin: number;
  detourRatio: number;
}
function routeFacts(route: Route, sim: Simulation): RouteFacts {
  let bridge = false,
    patrol = false,
    boardwalk = false;
  for (let i = 1; i < route.nodes.length; i++) {
    const kind = findStreet(route.nodes[i - 1], route.nodes[i])?.kind;
    if (kind === "bridge") bridge = true;
    if (kind === "patrol") patrol = true;
    if (kind === "boardwalk") boardwalk = true;
  }
  const straight = distance(nodes[START], nodes[EXIT]);
  return {
    bridge,
    bridgeWait: sim.segments.some((s) => s.kind === "wait"),
    patrol,
    boardwalk,
    margin: DEADLINE - sim.duration,
    detourRatio: straight > 0 ? route.length / straight : 1,
  };
}
function routeRisk(facts: RouteFacts, sim: Simulation): number {
  const base =
    sim.outcome === "escaped"
      ? Math.max(14, 44 - Math.round(facts.margin * 4))
      : sim.outcome === "busted"
        ? 86
        : 78;
  let r = base;
  if (facts.patrol) r += 14;
  if (facts.bridgeWait) r += 10;
  else if (facts.bridge) r += 4;
  if (facts.boardwalk) r += 6;
  if (facts.detourRatio > 1.35) r += 6;
  if (sim.outcome === "escaped" && facts.margin < 6) r += 8;
  return Math.max(1, Math.min(100, Math.round(r)));
}
function routeAdvice(facts: RouteFacts, sim: Simulation): string[] {
  const list: string[] = [];
  if (sim.outcome === "busted")
    list.push(
      "The patrol intercepts you on its 00:18–00:30 watch. Avoid the exposed marina street and cross from the south or the promenade.",
    );
  else if (facts.patrol)
    list.push(
      "This route crosses the patrol street inside its 00:18–00:30 watch window. Timing decides everything.",
    );
  else list.push("No patrol street is marked. The marina guard stays off your route.");
  if (facts.bridgeWait)
    list.push("The drawbridge is raised 00:14–00:24. Your driver waits it out before crossing.");
  else if (facts.bridge)
    list.push("The drawbridge is crossed before it lifts at 00:14.");
  else list.push("No drawbridge on the route. The waterfront stays level.");
  if (sim.outcome === "late")
    list.push("The boat sails at 00:48. This route lands after it has gone.");
  else if (facts.boardwalk)
    list.push(
      "The promenade is slower and adds time. The flamingo enjoys the view; the clock does not.",
    );
  else if (sim.outcome === "escaped" && facts.margin < 6)
    list.push(`Only ${Math.max(0, Math.floor(facts.margin))}s of slack before the 00:48 boat.`);
  else
    list.push(`Beat the boat at 00:48 with about ${clockLabel(sim.duration)} on the clock.`);
  return list;
}
function routeStatuses(
  facts: RouteFacts,
  sim: Simulation,
): { bridge: IntelliStatus; patrol: IntelliStatus; boat: IntelliStatus } {
  const bridge: IntelliStatus = facts.bridgeWait
    ? { state: "OPEN — DELAY", detail: "Raised 00:14–00:24" }
    : facts.bridge
      ? { state: "CLEAR — NO WAIT", detail: "Crossed before 00:14" }
      : { state: "NOT ON ROUTE", detail: "No drawbridge drawn" };
  const patrol: IntelliStatus =
    sim.outcome === "busted"
      ? { state: "HOT — INTERCEPTION", detail: "Caught 00:18–00:30" }
      : facts.patrol
        ? { state: "COLD — BYPASSED", detail: "Patrol street cleared" }
        : { state: "NOT ON ROUTE", detail: "No patrol street drawn" };
  const boat: IntelliStatus =
    sim.outcome === "late"
      ? { state: "GONE", detail: "Sailed at 00:48" }
      : { state: "AWAITING", detail: `Departs 00:48 · ETA ${clockLabel(sim.duration)}` };
  return { bridge, patrol, boat };
}

const REVISIONS: Revision[] = [
  {
    label: "THE SOUTH-WEST MARGIN",
    nodes: [15, 16, 17, 18, 19, 14, 9, 4],
    blurb:
      "Stay off the patrol street and clear the waterfront early. The slow promenade still beats the boat.",
  },
  {
    label: "THE EASTERN CORRIDOR",
    nodes: [15, 10, 5, 6, 7, 8, 13, 14, 9, 4],
    blurb:
      "Hug the east edge, wait out the drawbridge, then climb the quiet avenue to the marina.",
  },
];
const asRoute = (ids: number[]): Route => ({
  nodes: ids,
  edges: ids.slice(1).map((n, i) => streetKey(ids[i], n)),
  length: ids.slice(1).reduce(
    (sum, n, i) => sum + distance(nodes[ids[i]], nodes[n]),
    0,
  ),
});
function sameRoute(a: number[], b: number[]) {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}
function routeRevision(sim: Simulation): Revision | null {
  if (sim.outcome === "escaped") return null;
  const reason =
    sim.outcome === "busted"
      ? "This keeps pickup to boat clear of the patrol's watch window."
      : "This shorter line reaches the 00:48 boat with time to spare.";
  for (const revision of REVISIONS) {
    if (sameRoute(revision.nodes, sim.route.nodes)) continue;
    if (simulate(asRoute(revision.nodes)).outcome === "escaped")
      return { ...revision, blurb: `${reason} ${revision.blurb}` };
  }
  return null;
}

export function brief(route: Route, sim: Simulation): Briefing {
  const facts = routeFacts(route, sim);
  return {
    codename: routeCodename(route, sim.outcome),
    risk: routeRisk(facts, sim),
    advisories: routeAdvice(facts, sim),
    ...routeStatuses(facts, sim),
    eta: `${clockLabel(sim.duration)} ${
      sim.outcome === "escaped" ? "to boat" : "to failure"
    }`,
    verdict:
      sim.outcome === "escaped"
        ? "Escape window found"
        : sim.outcome === "busted"
          ? "Patrol pattern intersects"
          : "Boat departure missed",
    suggestion: routeRevision(sim),
  };
}