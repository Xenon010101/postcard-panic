import { describe, it, expect } from "vitest";
import { simulate, sampleSimulation, DEADLINE } from "./simulation";
import { EXAMPLE_ROUTE, BRIDGE_ROUTE, nodes, distance, streetKey } from "./map";
import type { Route } from "./route";
const route = (ids: number[]): Route => ({
  nodes: ids,
  edges: ids.slice(1).map((n, i) => streetKey(ids[i], n)),
  length: ids
    .slice(1)
    .reduce((l, n, i) => l + distance(nodes[n], nodes[ids[i]]), 0),
});
describe("deterministic getaway", () => {
  it("the promenade reaches the boat", () => {
    const s = simulate(route(EXAMPLE_ROUTE));
    expect(s.outcome).toBe("escaped");
    expect(s.duration).toBeLessThan(DEADLINE);
    expect(sampleSimulation(s, s.duration)).toMatchObject({
      x: nodes[4].x,
      y: nodes[4].y,
    });
  });
  it("bridge wait puts the direct route in patrol window", () => {
    const s = simulate(route(BRIDGE_ROUTE));
    expect(s.outcome).toBe("busted");
    expect(s.segments.some((s) => s.kind === "wait")).toBe(true);
    expect(s.duration).toBeGreaterThan(18);
    expect(s.duration).toBeLessThan(30);
  });
  it("a different marina approach escapes", () =>
    expect(simulate(route([15, 10, 5, 6, 7, 8, 13, 14, 9, 4])).outcome).toBe(
      "escaped",
    ));
  it("same route produces identical events and outcome", () =>
    expect(simulate(route(EXAMPLE_ROUTE))).toEqual(
      simulate(route(EXAMPLE_ROUTE)),
    ));
  it("rejects nonexistent streets", () =>
    expect(() => simulate(route([15, 4]))).toThrow(/does not exist/));
  it("replay sampling is independent of animation frame order", () => {
    const s = simulate(route(EXAMPLE_ROUTE));
    const a = sampleSimulation(s, 10);
    sampleSimulation(s, 5);
    sampleSimulation(s, 30);
    expect(sampleSimulation(s, 10)).toEqual(a);
  });
  it("long routes miss the boat at the exact deadline", () => {
    const s = simulate(
      route([15, 10, 5, 0, 1, 6, 11, 16, 17, 12, 7, 8, 13, 18, 19, 14, 9, 4]),
    );
    expect(s.outcome).toBe("late");
    expect(s.duration).toBe(DEADLINE);
  });
  it("all events and segments are time ordered", () => {
    const s = simulate(route(BRIDGE_ROUTE));
    expect(
      s.events.every((e, i) => i === 0 || e.at >= s.events[i - 1].at),
    ).toBe(true);
    expect(
      s.segments.every((e, i) => i === 0 || e.start === s.segments[i - 1].end),
    ).toBe(true);
  });
});
