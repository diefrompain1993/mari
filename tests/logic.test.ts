import { describe, it, expect } from "vitest";
import { SaveManager, defaults, SAVE_KEY } from "../src/engine/SaveManager";
import { story, findScene, stagesAt } from "../src/content/story";
import { clockValue, crowdProgress, followPath } from "../src/minigames/logic";
const storage = () => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => {
      m.set(k, v);
    },
    removeItem: (k: string) => {
      m.delete(k);
    },
  };
};
describe("checkpoint durability", () => {
  it("round trips narrative and preferences", () => {
    const s = new SaveManager(storage());
    const data = {
      version: 1 as const,
      scene: 4,
      beat: 5,
      completed: ["follow_start"],
      settings: defaults(),
    };
    s.save(data);
    expect(s.load()).toEqual(data);
  });
  it("rejects corrupt and out-of-range saves", () => {
    const memory = storage(),
      s = new SaveManager(memory);
    memory.setItem(SAVE_KEY, "{");
    expect(s.load()).toBeNull();
    memory.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: 1,
        scene: 999,
        beat: 0,
        settings: defaults(),
        completed: [],
      }),
    );
    expect(s.load()).toBeNull();
  });
  it("continues when persistence is unavailable", () => {
    const s = new SaveManager({
      getItem: () => {
        throw Error();
      },
      setItem: () => {
        throw Error();
      },
      removeItem: () => {
        throw Error();
      },
    });
    expect(s.load()).toBeNull();
    expect(
      s.save({
        version: 1,
        scene: 0,
        beat: 0,
        settings: defaults(),
        completed: [],
      }),
    ).toBe(false);
  });
});
describe("narrative continuity", () => {
  it("has unique beat IDs and one open final question", () => {
    const beats = story.flatMap((s) => s.beats);
    expect(new Set(beats.map((b) => b.id)).size).toBe(beats.length);
    expect(beats.filter((b) => b.final)).toHaveLength(1);
    expect(beats.at(-1)?.text).toBe("Будешь ли моей девушкой?");
    expect(new Set(beats.filter((b) => b.game).map((b) => b.game))).toEqual(
      new Set(["follow", "clock", "night", "crowd", "sort"]),
    );
  });
  it("reconstructs character stage at reloaded reveal", () => {
    const p = findScene("first_kindness_reveal")!;
    expect(stagesAt(p.scene, p.beat).girl).toBe(3);
    const final = findScene("human_reveal")!;
    expect(stagesAt(final.scene, final.beat).hero).toBe(6);
  });
});
describe("no-failure interactions", () => {
  it("clock eventually reveals without solving arithmetic", () => {
    expect(clockValue(0, 39)).toBe("14 времени");
    expect(clockValue(4, 2)).toBe("14 времени");
  });
  it("crowd keeps progressing even at a distance", () => {
    expect(crowdProgress(1, 200, true)).toBeGreaterThan(0);
    expect(crowdProgress(1, 0, false)).toBe(0);
  });
  it("follow path stays inside a finger-sized safe area", () => {
    for (let i = 0; i <= 100; i++)
      expect(followPath(i / 100)).toBeGreaterThan(80);
  });
});
