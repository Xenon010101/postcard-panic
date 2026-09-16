import {
  WIDTH,
  HEIGHT,
  ROUTE_COLOR,
  FORMAT,
  nodes,
  streets,
  markers,
  type Point,
} from "./map";
import type { Pixels } from "./route";

export function drawPostcard(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#f8f1de";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#163d3b";
  ctx.font = '700 42px "Barlow Condensed", sans-serif';
  ctx.fillText("PALMETTO BAY", 60, 76);
  ctx.font = '12px "IBM Plex Mono", monospace';
  ctx.fillStyle = "#677770";
  ctx.fillText("A LITTLE PARADISE. A TERRIBLE PLACE TO GET CAUGHT.", 62, 102);
  ctx.textAlign = "right";
  ctx.fillText("ESCAPE PLAN  /  01", 966, 67);
  ctx.fillText("N ↑", 966, 100);
  ctx.textAlign = "left";
  ctx.fillStyle = "#e8ead5";
  ctx.fillRect(58, 136, 826, 501);
  ctx.fillStyle = "#bed3c1";
  ctx.fillRect(543, 136, 45, 501);
  ctx.fillStyle = "#226e72";
  ctx.fillRect(902, 136, 76, 501);
  ctx.fillStyle = "#427f7f";
  for (let y = 151; y < 632; y += 24) {
    ctx.fillRect(912, y, 52, 1);
  }
  ctx.save();
  ctx.translate(945, 455);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "#f8f1de";
  ctx.font = '14px "IBM Plex Mono", monospace';
  ctx.fillText("THE OPEN WATER", 0, 0);
  ctx.restore();
  const colors = [
    "#e4b7a2",
    "#d4c395",
    "#b8c7a1",
    "#d8b6ad",
    "#d4ccad",
    "#c6c2a4",
  ];
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 4; col++) {
      if (col === 2) continue;
      const x = 126 + col * 176 + 30,
        y = 188 + row * 136 + 29;
      ctx.fillStyle = colors[(col + row * 2) % colors.length];
      ctx.fillRect(x, y, 116, 77);
      ctx.strokeStyle = "#f8f1de";
      ctx.lineWidth = 5;
      ctx.strokeRect(x + 10, y + 10, 96, 57);
    }
  for (const s of streets) {
    const a = nodes[s.a],
      b = nodes[s.b];
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineCap = "round";
    ctx.strokeStyle = s.kind === "boardwalk" ? "#d6bd8f" : "#d2d3bc";
    ctx.lineWidth = 36;
    ctx.stroke();
    ctx.strokeStyle = "#fff9e9";
    ctx.lineWidth = 27;
    ctx.stroke();
    ctx.setLineDash([5, 8]);
    ctx.strokeStyle = "#c5c2ac";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
  }
  const label = (text: string, x: number, y: number) => {
    ctx.textAlign = "center";
    ctx.font = '11px "IBM Plex Mono", monospace';
    ctx.fillStyle = "#385751";
    ctx.fillText(text, x, y);
    ctx.textAlign = "left";
  };
  label("OLD TOWN", 218, 270);
  label("THE STRIP", 390, 410);
  label("PALM COURT", 217, 541);
  label("MARINA", 744, 268);
  label("NIGHT MARKET", 744, 542);
  label("DRAWBRIDGE", 566, 299);
  label("OPENS 00:14–00:24", 566, 350);
  label("PATROL 00:18–00:30", 747, 306);
  label("SLOW PROMENADE", 566, 624);
  ctx.fillStyle = "#e46e47";
  ctx.fillRect(705, 319, 73, 10);
  function pin(id: number, text: string, color: string, dy: number) {
    const p = nodes[id];
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff9e9";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(id === 15 ? "A" : "B", p.x, p.y + 5);
    ctx.fillStyle = color;
    ctx.font = 'bold 13px "IBM Plex Mono",monospace';
    ctx.fillText(text, p.x, p.y + dy);
    ctx.textAlign = "left";
  }
  pin(15, "PICKUP", "#cb563b", -27);
  pin(4, "BOAT", "#163d3b", -29);
  ctx.fillStyle = ROUTE_COLOR;
  ctx.fillRect(63, 661, 13, 5);
  ctx.fillStyle = "#53645c";
  ctx.font = '11px "IBM Plex Mono",monospace';
  ctx.fillText("YOUR ROUTE: #00D8FF", 88, 668);
  ctx.textAlign = "right";
  ctx.fillText(`${FORMAT}  •  KEEP ORIGINAL SIZE`, 963, 668);
  ctx.textAlign = "left";
  for (const m of markers) {
    ctx.fillStyle = `rgb(${m.color.join(",")})`;
    ctx.fillRect(m.x, m.y, 8, 8);
  }
}
export function makePostcard(route?: number[]) {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d")!;
  drawPostcard(ctx);
  if (route?.length) {
    ctx.strokeStyle = ROUTE_COLOR;
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    route.forEach((id, i) =>
      i
        ? ctx.lineTo(nodes[id].x, nodes[id].y)
        : ctx.moveTo(nodes[id].x, nodes[id].y),
    );
    ctx.stroke();
  }
  return canvas.toDataURL("image/png");
}
export async function decodeImage(
  source: string,
): Promise<{ pixels: ImageData; image: HTMLImageElement }> {
  const image = new Image();
  image.src = source;
  try {
    await image.decode();
  } catch {
    throw new Error(
      "This image could not be read. Try the original postcard PNG.",
    );
  }
  if (image.width !== WIDTH || image.height !== HEIGHT)
    throw new Error(
      "Use the original 1024 × 704 postcard PNG. Screenshots and resized images cannot be replayed.",
    );
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(image, 0, 0);
  return { pixels: ctx.getImageData(0, 0, WIDTH, HEIGHT), image };
}
export function validateFormat(p: Pixels) {
  if (p.width !== WIDTH || p.height !== HEIGHT)
    throw new Error("The postcard dimensions do not match this district.");
  for (const m of markers) {
    let ok = 0;
    for (let y = m.y + 2; y < m.y + 6; y++)
      for (let x = m.x + 2; x < m.x + 6; x++) {
        const i = (y * p.width + x) * 4;
        if (
          m.color.every((v, c) => Math.abs(p.data[i + c] - v) < 18) &&
          p.data[i + 3] > 240
        )
          ok++;
      }
    if (ok < 14)
      throw new Error(
        "This is not an intact Palmetto Bay postcard. Keep the four corner marks when editing.",
      );
  }
}
export async function readPostcard(file: File): Promise<string> {
  if (file.size > 8 * 1024 * 1024)
    throw new Error(
      "That file is too large. Choose a postcard PNG smaller than 8 MB.",
    );
  const sig = new Uint8Array(await file.slice(0, 24).arrayBuffer());
  if (![137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => sig[i] === v))
    throw new Error("Choose a PNG exported from Postcard Panic.");
  if (sig.length < 24 || String.fromCharCode(...sig.slice(12, 16)) !== "IHDR")
    throw new Error("This PNG has an invalid image header.");
  const header = new DataView(sig.buffer);
  if (header.getUint32(16) !== WIDTH || header.getUint32(20) !== HEIGHT)
    throw new Error("Use the original 1024 × 704 postcard PNG. Resized images cannot be replayed.");
  const data = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read that file."));
    r.readAsDataURL(file);
  });
  const { pixels } = await decodeImage(data);
  validateFormat(pixels);
  return data;
}
export function downloadPostcard(data: string) {
  const link = document.createElement("a");
  link.href = data;
  link.download = "postcard-panic-palmetto.png";
  link.click();
}
export function pointAlong(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
