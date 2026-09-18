import { Container } from "pixi.js";
import gsap from "gsap";
import type { Beat } from "../content/types";
export class CameraDirector {
  private mode: Beat["camera"] = "wide";
  private base = { zoom: 1, x: 0, y: 0 };
  constructor(
    private world: Container,
    private reduced: () => boolean,
  ) {}
  cue(mode: Beat["camera"] = "wide") {
    this.mode = mode;
    gsap.killTweensOf(this.base);
    const zoom = mode === "close" ? 1.12 : mode === "hand" ? 1.2 : 1;
    gsap.to(this.base, {
      zoom: this.reduced() ? 1 : zoom,
      x: mode === "hand" ? 12 : 0,
      y: mode === "hand" ? -35 : 0,
      duration: this.reduced() ? 0.4 : 3,
      ease: "sine.inOut",
    });
  }
  update(time: number, height: number) {
    const drift =
      this.reduced() || this.mode === "still" ? 0 : Math.sin(time * 0.17) * 1.8;
    this.world.scale.set(this.base.zoom);
    this.world.position.set(
      195 * (1 - this.base.zoom) + this.base.x + drift,
      height * 0.53 * (1 - this.base.zoom) + this.base.y,
    );
  }
  destroy() {
    gsap.killTweensOf(this.base);
  }
}
