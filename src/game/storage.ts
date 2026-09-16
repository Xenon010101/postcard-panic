export const STORAGE_KEY = "postcard-panic:v1";
export interface SavedSession {
  version: 1;
  image: string;
  sound: boolean;
  best: number | null;
}
export function loadSession(): SavedSession | null {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    if (!text) return null;
    const value = JSON.parse(text);
    if (
      value.version !== 1 ||
      typeof value.image !== "string" ||
      !value.image.startsWith("data:image/png;") ||
      value.image.length > 6_000_000
    )
      return null;
    return {
      version: 1,
      image: value.image,
      sound: value.sound === true,
      best:
        typeof value.best === "number" && value.best > 0 ? value.best : null,
    };
  } catch {
    return null;
  }
}
export function saveSession(session: SavedSession): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}
