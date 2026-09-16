import { describe, it, expect } from "vitest";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { mkdirSync, writeFileSync } from "node:fs";
import { drawPostcard, validateFormat, readPostcard } from "./postcard";
import {
  WIDTH,
  HEIGHT,
  EXAMPLE_ROUTE,
  BRIDGE_ROUTE,
  ROUTE_COLOR,
  nodes,
} from "./map";
import { analyzeRoute } from "./route";
import { simulate } from "./simulation";

function card(route: number[]) {
  const c = createCanvas(WIDTH, HEIGHT),
    ctx = c.getContext("2d");
  drawPostcard(ctx as unknown as CanvasRenderingContext2D);
  ctx.strokeStyle = ROUTE_COLOR;
  ctx.lineWidth = 9;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  route.forEach((id, i) =>
    i
      ? ctx.lineTo(nodes[id].x, nodes[id].y)
      : ctx.moveTo(nodes[id].x, nodes[id].y),
  );
  ctx.stroke();
  return c;
}
describe("real PNG format and round-trip", () => {
  it("the unedited postcard contains no false route", () => {
    const c = card([]);
    const p = c.getContext("2d").getImageData(0, 0, WIDTH, HEIGHT);
    expect(() => validateFormat(p)).not.toThrow();
    expect(analyzeRoute(p).markedEdges).toEqual([]);
  });
  it.each([
    [EXAMPLE_ROUTE, "scenic"],
    [BRIDGE_ROUTE, "bridge"],
  ] as const)(
    "preserves path and outcome through PNG %#",
    async (route, name) => {
      const c = card([...route]),
        original = analyzeRoute(
          c.getContext("2d").getImageData(0, 0, WIDTH, HEIGHT),
        ).route!;
      const png = c.toBuffer("image/png");
      const decoded = await loadImage(png),
        copy = createCanvas(WIDTH, HEIGHT),
        ctx = copy.getContext("2d");
      ctx.drawImage(decoded, 0, 0);
      const p = ctx.getImageData(0, 0, WIDTH, HEIGHT);
      validateFormat(p);
      const restored = analyzeRoute(p).route!;
      expect(restored).toEqual(original);
      expect(simulate(restored)).toEqual(simulate(original));
      mkdirSync(".qa", { recursive: true });
      writeFileSync(`.qa/${name}-postcard.png`, png);
    },
  );
  it("rejects altered registration marks", () => {
    const c = card(EXAMPLE_ROUTE),
      ctx = c.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(20, 20, 8, 8);
    expect(() => validateFormat(ctx.getImageData(0, 0, WIDTH, HEIGHT))).toThrow(
      /not an intact/,
    );
  });
  it("rejects resized dimensions", () =>
    expect(() => validateFormat({ width: 512, height: 352, data: [] })).toThrow(
      /dimensions/,
    ));
  it("rejects other file formats before decoding", async () => {
    await expect(
      readPostcard(new File(["not png"], "fake.png", { type: "image/png" })),
    ).rejects.toThrow(/Choose a PNG/);
  });
  it("rejects oversized files before decoding", async () => {
    await expect(
      readPostcard(new File([new Uint8Array(8 * 1024 * 1024 + 1)], "big.png")),
    ).rejects.toThrow(/too large/);
  });
});
