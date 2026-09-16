import { describe, it, expect } from "vitest";
import { WIDTH, HEIGHT, nodes, EXAMPLE_ROUTE, BRIDGE_ROUTE } from "./map";
import { analyzeRoute, isCyan, type Pixels } from "./route";
function fixture(
  path: number[],
  radius = 5,
  offset = 0,
  color = [0, 216, 255],
): Pixels {
  const data = new Uint8ClampedArray(WIDTH * HEIGHT * 4);
  for (let i = 1; i < path.length; i++) {
    const a = nodes[path[i - 1]],
      b = nodes[path[i]],
      steps = Math.ceil(Math.hypot(a.x - b.x, a.y - b.y));
    for (let s = 0; s <= steps; s++) {
      const cx = Math.round(a.x + ((b.x - a.x) * s) / steps + offset),
        cy = Math.round(a.y + ((b.y - a.y) * s) / steps + offset);
      for (let y = cy - radius; y <= cy + radius; y++)
        for (let x = cx - radius; x <= cx + radius; x++) {
          if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) continue;
          if ((x - cx) ** 2 + (y - cy) ** 2 > radius ** 2) continue;
          const idx = (y * WIDTH + x) * 4;
          data.set([...color, 255], idx);
        }
    }
  }
  return { data, width: WIDTH, height: HEIGHT };
}
describe("saved postcard pixels to a route", () => {
  it.each([[EXAMPLE_ROUTE], [BRIDGE_ROUTE]])(
    "reads a complete route %#",
    (path) => {
      expect(analyzeRoute(fixture(path)).route?.nodes).toEqual(path);
    },
  );
  it.each([
    [2, 0],
    [4, 7],
    [10, -5],
    [14, 0],
    [4, 18],
    [5, -18],
  ])("tolerates radius %i and offset %i", (r, o) =>
    expect(analyzeRoute(fixture(EXAMPLE_ROUTE, r, o)).route?.nodes).toEqual(
      EXAMPLE_ROUTE,
    ),
  );
  it("rejects missing route", () =>
    expect(analyzeRoute(fixture([])).error).toMatch(/No route/));
  it("does not snap ink from far outside the street", () =>
    expect(analyzeRoute(fixture(EXAMPLE_ROUTE, 2, 40)).route).toBeNull());
  it("rejects wrong color", () =>
    expect(
      analyzeRoute(fixture(EXAMPLE_ROUTE, 5, 0, [239, 100, 60])).route,
    ).toBeNull());
  it("rejects unfinished route", () =>
    expect(analyzeRoute(fixture(EXAMPLE_ROUTE.slice(0, -1))).error).toMatch(
      /Connect/,
    ));
  it("rejects branching route", () =>
    expect(analyzeRoute(fixture([...EXAMPLE_ROUTE, 9, 8])).error).toMatch(
      /branch/,
    ));
  it("rejects a disconnected street", () => {
    const p = fixture(EXAMPLE_ROUTE),
      other = fixture([0, 1]);
    for (let i = 0; i < p.data.length; i += 4)
      if (other.data[i + 3]) {
        for (let c = 0; c < 4; c++)
          (p.data as Uint8ClampedArray)[i + c] = other.data[i + c];
      }
    expect(analyzeRoute(p).error).toMatch(/disconnected/);
  });
  it("rejects changed dimensions", () =>
    expect(analyzeRoute({ width: 512, height: 352, data: [] }).error).toMatch(
      /resized/,
    ));
  it("ignores cyan outside streets", () => {
    const p = fixture(EXAMPLE_ROUTE);
    for (let x = 300; x < 500; x++)
      (p.data as Uint8ClampedArray).set(
        [0, 216, 255, 255],
        (50 * WIDTH + x) * 4,
      );
    expect(analyzeRoute(p).route?.nodes).toEqual(EXAMPLE_ROUTE);
  });
  it("does not classify sea or cream pixels as route ink", () => {
    expect(isCyan(34, 110, 114, 255)).toBe(false);
    expect(isCyan(248, 241, 222, 255)).toBe(false);
    expect(isCyan(0, 216, 255, 255)).toBe(true);
  });
});
