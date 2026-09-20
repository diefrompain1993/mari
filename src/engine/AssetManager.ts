import { Assets, Texture } from "pixi.js";
import manifest from "../content/asset-manifest.json";
import type { Scene } from "../content/types";
import { backgroundId, characterIds } from '../content/visuals';
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
          if (id.includes('pixel') || /^hero-[45]$/.test(id) || /env-book-(star-hill|paper-city|library)/.test(id) || (id.startsWith('npc-') && id !== 'npc-binder'))
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
    const ids = new Set<string>();
    let hero = scene.hero, girl = scene.girl;
    const add = () => {
      ids.add(backgroundId(scene, hero));
      const art = characterIds(scene, hero, girl);
      if (hero) ids.add(art.hero);
      if (girl) ids.add(art.girl);
    };
    add();
    if (scene.npc) ids.add(scene.npc);
    for (const b of scene.beats) {
      hero = b.hero ?? hero; girl = b.girl ?? girl; add();
    }
    if (scene.environment === "crowd") {
      ids.add("hero-5");
      ids.add("girl-pixel");
    }
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
