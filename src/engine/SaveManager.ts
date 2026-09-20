import { story } from "../content/story";
import { findScene } from '../content/story';
import type { SaveData, Settings } from "../content/types";
export const SAVE_KEY = "proyavlenie.v1";
export const defaults = (reduced = false): Settings => ({
  music: 0.55,
  sfx: 0.55,
  textSpeed: 35,
  reducedMotion: reduced,
});
export class SaveManager {
  constructor(
    private storage: Pick<
      Storage,
      "getItem" | "setItem" | "removeItem"
    > = localStorage,
  ) {}
  load(): SaveData | null {
    try {
      const raw = this.storage.getItem(SAVE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw) as SaveData & { checkpoint?: string; narrative?: string };
      if (!s || typeof s !== 'object') return null;
      // A different story cannot resume at a numerically similar beat. Keep preferences.
      if (s.narrative !== 'book-v1') { s.scene=0; s.beat=0; s.completed=[]; }
      const checkpoint = s.narrative === 'book-v1' ? s.checkpoint : undefined;
      const location = typeof checkpoint === 'string' ? findScene(checkpoint) : undefined;
      if (location) { s.scene = location.scene; s.beat = location.beat; }
      delete s.checkpoint;
      delete s.narrative;
      if (
        s.version !== 1 ||
        !Number.isInteger(s.scene) ||
        !Number.isInteger(s.beat) ||
        !story[s.scene]?.beats[s.beat] ||
        !Array.isArray(s.completed) ||
        !s.settings
      )
        return null;
      const d = defaults();
      for (const key of ["music", "sfx"] as const) {
        const n = s.settings[key];
        s.settings[key] =
          typeof n === "number" && Number.isFinite(n)
            ? Math.max(0, Math.min(1, n))
            : d[key];
      }
      s.settings.textSpeed =
        typeof s.settings.textSpeed === "number" && Number.isFinite(s.settings.textSpeed)
          ? Math.max(15, Math.min(65, s.settings.textSpeed))
          : 35;
      s.settings.reducedMotion = Boolean(s.settings.reducedMotion);
      s.completed = s.completed.filter((v) => typeof v === "string");
      return s;
    } catch {
      return null;
    }
  }
  save(data: SaveData) {
    try {
      this.storage.setItem(SAVE_KEY, JSON.stringify({ ...data, narrative:'book-v1', checkpoint: story[data.scene]?.beats[data.beat]?.id }));
      return true;
    } catch {
      return false;
    }
  }
  clear() {
    try {
      this.storage.removeItem(SAVE_KEY);
    } catch {
      /* Private browser storage may be unavailable. */
    }
  }
}
