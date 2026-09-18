import { Assets, Texture } from "pixi.js";
import manifest from "../content/asset-manifest.json";
import type { Scene } from "../content/types";
export class AssetManager {
  private loaded = new Map<string, Texture>();
  private pending = new Map<string, Promise<Texture>>();
  ids() {
    return [...this.loaded.keys()];
  }
  get(id: string) {
    const t = this.loaded.get(id);
    if (!t) throw new Error("Texture not loaded: " + id);
    return t;
  }
  async load(id: string) {
    if (this.loaded.has(id)) return this.get(id);
    let promise = this.pending.get(id);
    if (!promise) {
      const entry = manifest.find((a) => a.id === id);
      if (!entry) throw new Error("Unknown art: " + id);
      promise = Assets.load<Texture>(import.meta.env.BASE_URL + entry.url)
        .then((t) => {
          if (id === "env-pixel" || /^hero-[45]$/.test(id))
            t.source.scaleMode = "nearest";
          this.loaded.set(id, t);
          return t;
        })
        .finally(() => this.pending.delete(id));
      this.pending.set(id, promise);
    }
    return promise;
  }
  required(scene: Scene) {
    const ids = new Set(["env-" + scene.environment]);
    if (scene.hero) ids.add("hero-" + scene.hero);
    if (scene.girl) ids.add("girl-" + scene.girl);
    for (const b of scene.beats) {
      if (b.hero) ids.add("hero-" + b.hero);
      if (b.girl) ids.add("girl-" + b.girl);
    }
    if (scene.environment === "crowd") {
      ids.add("hero-3");
      ids.add("girl-6");
    }
    if (scene.environment === 'room' || scene.environment === 'cafe') {
      ids.add('hero-seated'); ids.add('girl-seated');
    }
    if (scene.environment === 'room') ids.add('girl-seated-partial');
    return [...ids];
  }
  async scene(scene: Scene) {
    await Promise.all(this.required(scene).map((id) => this.load(id)));
  }
  prefetch(scene?: Scene) {
    if (scene)
      void this.scene(scene).catch(() => {
        /* Foreground loading provides a retry on a flaky connection. */
      });
  }
  async retain(scenes: Scene[]) {
    const keep = new Set(scenes.flatMap((s) => this.required(s)));
    for (const id of this.loaded.keys()) {
      if (id.startsWith('env-') && !keep.has(id)) {
        const entry = manifest.find((a) => a.id === id)!;
        this.loaded.delete(id);
        await Assets.unload(import.meta.env.BASE_URL + entry.url);
      }
    }
  }
}
