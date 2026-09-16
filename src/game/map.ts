export const WIDTH = 1024;
export const HEIGHT = 704;
export const ROUTE_COLOR = "#00d8ff";
export const FORMAT = "PP-PALMETTO-1";
export const START = 15;
export const EXIT = 4;
export interface Point {
  x: number;
  y: number;
}
export interface MapNode extends Point {
  id: number;
}
export interface Street {
  a: number;
  b: number;
  kind: "street" | "bridge" | "boardwalk" | "patrol";
}
export const nodes: MapNode[] = Array.from({ length: 20 }, (_, id) => ({
  id,
  x: 126 + (id % 5) * 176,
  y: 188 + Math.floor(id / 5) * 136,
}));
export const streets: Street[] = [];
for (const n of nodes) {
  const col = n.id % 5,
    row = Math.floor(n.id / 5);
  if (col < 4 && !(col === 2 && (row === 0 || row === 2))) {
    const kind =
      col === 2 && row === 1
        ? "bridge"
        : row === 3
          ? "boardwalk"
          : n.id === 8
            ? "patrol"
            : "street";
    streets.push({ a: n.id, b: n.id + 1, kind });
  }
  if (row < 3) streets.push({ a: n.id, b: n.id + 5, kind: "street" });
}
export const streetKey = (a: number, b: number) =>
  `${Math.min(a, b)}-${Math.max(a, b)}`;
export const findStreet = (a: number, b: number) =>
  streets.find((s) => streetKey(s.a, s.b) === streetKey(a, b));
export const distance = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, a.y - b.y);
export const EXAMPLE_ROUTE = [15, 16, 17, 18, 19, 14, 9, 4];
export const BRIDGE_ROUTE = [15, 10, 5, 6, 7, 8, 9, 4];
export const markers = [
  { x: 20, y: 20, color: [210, 78, 51] },
  { x: 996, y: 20, color: [26, 60, 56] },
  { x: 20, y: 676, color: [222, 173, 67] },
  { x: 996, y: 676, color: [152, 61, 88] },
];
