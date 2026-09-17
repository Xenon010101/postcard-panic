import { describe, it, expect } from "vitest";
import { brief } from "./briefing";
import { simulate } from "./simulation";
import { EXAMPLE_ROUTE, BRIDGE_ROUTE, nodes, distance, streetKey } from "./map";
import type { Route } from "./route";

const route = (ids: number[]): Route => ({
  nodes: ids,
  edges: ids.slice(1).map((n, i) => streetKey(ids[i], n)),
  length: ids
    .slice(1)
    .reduce((l, n, i) => l + distance(nodes[n], nodes[ids[i]]), 0),
});

const SCENIC = simulate(route(EXAMPLE_ROUTE));
const BUSTED = simulate(route(BRIDGE_ROUTE));
const BRIDGE_DELAYED = simulate(route([15, 10, 5, 6, 7, 8, 13, 14, 9, 4]));
const LATE = simulate(
  route([15, 10, 5, 0, 1, 6, 11, 16, 17, 12, 7, 8, 13, 18, 19, 14, 9, 4]),
);

describe("postcard intelligence briefing", () => {
  it("names and scores a safe scenic route", () => {
    expect(SCENIC.outcome).toBe("escaped");
    const b = brief(SCENIC.route, SCENIC);
    expect(b.suggestion).toBeNull();
    expect(b.risk).toBeGreaterThanOrEqual(0);
    expect(b.risk).toBeLessThan(50);
    expect(b.advisories).toHaveLength(3);
    expect(b.codename).toMatch(/^THE [A-Z]+ [A-Z]+$/);
    expect(b.bridge.state).toBeTruthy();
    expect(b.patrol.state).toBe("NOT ON ROUTE");
    expect(b.boat.state).toBe("AWAITING");
    expect(b.eta).toMatch(/to boat$/);
    expect(b.verdict).toBe("Escape window found");
  });
  it("flags a patrol interception and proposes a route that escapes", () => {
    const b = brief(BUSTED.route, BUSTED);
    expect(b.risk).toBeGreaterThan(60);
    expect(b.risk).toBeLessThanOrEqual(100);
    expect(b.patrol.state).toMatch(/HOT/);
    expect(b.boat.state).toBe("AWAITING");
    expect(b.verdict).toBe("Patrol pattern intersects");
    expect(b.advisories.some((a) => /patrol/i.test(a))).toBe(true);
    expect(b.suggestion).not.toBeNull();
    expect(simulate(route(b.suggestion!.nodes)).outcome).toBe("escaped");
  });
  it("reports a drawbridge delay when the route waits and still escapes", () => {
    expect(BRIDGE_DELAYED.outcome).toBe("escaped");
    expect(BRIDGE_DELAYED.segments.some((s) => s.kind === "wait")).toBe(true);
    const b = brief(BRIDGE_DELAYED.route, BRIDGE_DELAYED);
    expect(b.risk).toBeLessThan(50);
    expect(b.bridge.state).toMatch(/OPEN/);
    expect(b.bridge.detail).toMatch(/00:14–00:24/);
    expect(b.advisories.some((a) => /drawbridge/i.test(a))).toBe(true);
    expect(b.suggestion).toBeNull();
  });
  it("flags a missed boat and proposes a faster line", () => {
    expect(LATE.outcome).toBe("late");
    const b = brief(LATE.route, LATE);
    expect(b.risk).toBeGreaterThanOrEqual(80);
    expect(b.boat.state).toBe("GONE");
    expect(b.boat.detail).toBe("Sailed at 00:48");
    expect(b.verdict).toBe("Boat departure missed");
    expect(b.eta).toMatch(/to failure$/);
    expect(b.suggestion).not.toBeNull();
    expect(simulate(route(b.suggestion!.nodes)).outcome).toBe("escaped");
    expect(b.advisories.some((a) => /00:48/i.test(a))).toBe(true);
  });
  it("is deterministic and bounded for every outcome", () => {
    for (const sim of [SCENIC, BUSTED, BRIDGE_DELAYED, LATE]) {
      const a = brief(sim.route, sim);
      const c = brief(sim.route, sim);
      expect(a).toEqual(c);
      expect(Number.isInteger(a.risk)).toBe(true);
      expect(a.risk).toBeGreaterThanOrEqual(0);
      expect(a.risk).toBeLessThanOrEqual(100);
      expect(a.advisories).toHaveLength(3);
      expect(a.advisories.every((x) => x.length > 0)).toBe(true);
      expect(a.codename).toMatch(/^THE [A-Z]+ [A-Z]+$/);
      expect(a.bridge.state.length).toBeGreaterThan(0);
      expect(a.bridge.detail.length).toBeGreaterThan(0);
      expect(a.patrol.state.length).toBeGreaterThan(0);
      expect(a.boat.state.length).toBeGreaterThan(0);
      expect(a.eta.length).toBeGreaterThan(0);
      expect(a.verdict.length).toBeGreaterThan(0);
    }
  });
  it("ranks failure above success on the risk scale", () => {
    const scenic = brief(SCENIC.route, SCENIC);
    const busted = brief(BUSTED.route, BUSTED);
    const late = brief(LATE.route, LATE);
    expect(busted.risk).toBeGreaterThan(scenic.risk);
    expect(late.risk).toBeGreaterThan(scenic.risk);
  });
});