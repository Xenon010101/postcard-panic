import { afterEach, describe, it, expect, vi } from "vitest";
import { loadSession, saveSession } from "./storage";
afterEach(() => vi.unstubAllGlobals());
describe("local progress", () => {
  it("survives blocked storage", () => {
    vi.stubGlobal("localStorage", {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("quota");
      },
    });
    expect(loadSession()).toBeNull();
    expect(
      saveSession({
        version: 1,
        image: "data:image/png;base64,",
        sound: false,
        best: null,
      }),
    ).toBe(false);
  });
  it.each([
    "broken",
    "{}",
    '{"version":2}',
    '{"version":1,"image":"https://external.invalid"}',
  ])("ignores invalid state %s", (text) => {
    vi.stubGlobal("localStorage", { getItem: () => text });
    expect(loadSession()).toBeNull();
  });
  it("round-trips a valid session", () => {
    let value = "";
    vi.stubGlobal("localStorage", {
      getItem: () => value,
      setItem: (_k: string, v: string) => {
        value = v;
      },
    });
    const session = {
      version: 1 as const,
      image: "data:image/png;base64,hello",
      sound: true,
      best: 32,
    };
    expect(saveSession(session)).toBe(true);
    expect(loadSession()).toEqual(session);
  });
});
