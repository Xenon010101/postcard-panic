import { distance, findStreet, nodes, type Point } from "./map";
import type { Route } from "./route";
export const DEADLINE = 48;
export interface ReplayEvent {
  at: number;
  title: string;
  detail: string;
  tone: "neutral" | "warning" | "danger" | "success";
}
export interface Segment {
  from: Point;
  to: Point;
  start: number;
  end: number;
  kind: "drive" | "wait";
}
export interface Simulation {
  route: Route;
  duration: number;
  outcome: "escaped" | "busted" | "late";
  events: ReplayEvent[];
  segments: Segment[];
  distance: number;
}
export function simulate(route: Route): Simulation {
  const segments: Segment[] = [],
    events: ReplayEvent[] = [
      {
        at: 0,
        title: "A very conspicuous getaway.",
        detail: "The flamingo is secured. Allegedly.",
        tone: "neutral",
      },
    ];
  let time = 0,
    travelled = 0,
    boardwalkSeen = false;
  const finish = (
    outcome: Simulation["outcome"],
    title: string,
    detail: string,
  ): Simulation => {
    events.push({
      at: time,
      title,
      detail,
      tone: outcome === "escaped" ? "success" : "danger",
    });
    return {
      route,
      duration: time,
      outcome,
      events,
      segments,
      distance: travelled,
    };
  };
  for (let i = 1; i < route.nodes.length; i++) {
    const from = nodes[route.nodes[i - 1]],
      to = nodes[route.nodes[i]],
      street = findStreet(from.id, to.id);
    if (!street)
      throw new Error("The route contains a street that does not exist.");
    const len = distance(from, to),
      duration = len / (street.kind === "boardwalk" ? 31 : 46);
    if (street.kind === "bridge" && time < 24 && time + duration > 14) {
      events.push({
        at: time,
        title: "Bridge up. Patience down.",
        detail: "The drawbridge stays open until 00:24. Your driver waits.",
        tone: "warning",
      });
      segments.push({ from, to: from, start: time, end: 24, kind: "wait" });
      time = 24;
    }
    if (street.kind === "boardwalk" && !boardwalkSeen) {
      boardwalkSeen = true;
      events.push({
        at: time,
        title: "Taking the scenic route.",
        detail: "The promenade is slower. The flamingo appreciates the view.",
        tone: "neutral",
      });
    }
    let end = time + duration,
      ratio = 1,
      fail: Simulation["outcome"] | null = null;
    if (
      street.kind === "patrol" &&
      time + duration / 2 >= 18 &&
      time + duration / 2 < 30
    ) {
      end = time + duration / 2;
      ratio = 0.5;
      fail = "busted";
    }
    if (end > DEADLINE) {
      end = DEADLINE;
      ratio = Math.max(0, (end - time) / duration);
      fail = "late";
    }
    const endpoint = {
      x: from.x + (to.x - from.x) * ratio,
      y: from.y + (to.y - from.y) * ratio,
    };
    segments.push({ from, to: endpoint, start: time, end, kind: "drive" });
    travelled += len * ratio;
    time = end;
    if (fail === "busted")
      return finish(
        "busted",
        "FLAMINGO DOWN.",
        "The marina patrol caught you between 00:18 and 00:30. Try another crossing or approach the marina from the south.",
      );
    if (fail === "late")
      return finish(
        "late",
        "MISSED THE BOAT.",
        "Your boat left at 00:48. Shorten the route or avoid waiting at the drawbridge.",
      );
    if (street.kind === "patrol")
      events.push({
        at: time,
        title: "Coast is clear. For once.",
        detail: "You slipped past the marina patrol outside its watch window.",
        tone: "neutral",
      });
  }
  return finish(
    "escaped",
    "SOUVENIR SECURED.",
    "One flamingo. Zero explanations. Your crew made the boat.",
  );
}
export function sampleSimulation(
  sim: Simulation,
  time: number,
): Point & { angle: number; waiting: boolean } {
  const t = Math.max(0, Math.min(time, sim.duration));
  const segment = sim.segments.find((s) => s.end > t) || sim.segments.at(-1);
  if (!segment)
    return { ...nodes[sim.route.nodes[0]], angle: 0, waiting: false };
  const p =
    segment.end === segment.start
      ? 1
      : Math.max(
          0,
          Math.min(1, (t - segment.start) / (segment.end - segment.start)),
        );
  const angle = Math.atan2(
    segment.to.x - segment.from.x,
    segment.to.y - segment.from.y,
  );
  return {
    x: segment.from.x + (segment.to.x - segment.from.x) * p,
    y: segment.from.y + (segment.to.y - segment.from.y) * p,
    angle,
    waiting: segment.kind === "wait",
  };
}
export const clockLabel = (seconds: number) =>
  `00:${Math.floor(seconds).toString().padStart(2, "0")}`;
