import { Container, Graphics } from "pixi.js";
import type { Environment } from "../content/types";
export class FXManager {
  readonly layer = new Container();
  private dust = new Graphics();
  private light = new Graphics();
  private env: Environment = "prologue";
  tier: "high" | "reduced" = "high";
  private frames = 0;
  private slow = 0;
  constructor() {
    this.layer.addChild(this.light, this.dust);
    this.layer.eventMode = "none";
  }
  set(env: Environment) {
    this.env = env;
  }
  update(time: number, dt: number, height: number, reduced: boolean) {
    this.frames++;
    if (dt > 23) this.slow++;
    if (this.frames === 90) {
      if (this.slow > 45) this.tier = "reduced";
      this.frames = 0;
      this.slow = 0;
    }
    this.dust.clear();
    this.light.clear();
    const pixel = this.env === "pixel";
    const count = this.tier === "reduced" || reduced ? 12 : 30;
    for (let i = 0; i < count; i++) {
      const x = (i * 83.71 + Math.sin(time * 0.12 + i) * 9) % 390;
      const y =
        (((i * 47.9 - time * (reduced ? 0 : 4 + (i % 3))) % height) + height) %
        height;
      const alpha = 0.1 + 0.12 * Math.sin(time * 0.6 + i) ** 2;
      if (pixel)
        this.dust
          .rect(Math.round(x / 3) * 3, Math.round(y / 3) * 3, 3, 3)
          .fill({ color: 0xd8c18a, alpha });
      else
        this.dust
          .circle(x, y, i % 4 === 0 ? 1.5 : 0.65)
          .fill({ color: 0xf2dfb2, alpha });
    }
    if (this.env === "crowd") {
      const a = reduced ? 0.045 : 0.05 + Math.sin(time * 0.7) * 0.025;
      this.light
        .poly([40, 0, 70, 0, 340, height * 0.75, 230, height * 0.75])
        .fill({ color: 0xe7a779, alpha: a });
      this.light
        .poly([330, 0, 350, 0, 40, height * 0.8, 0, height * 0.8])
        .fill({ color: 0x86c7d0, alpha: a });
    }
  }
  count() {
    return this.tier === "high" ? 30 : 12;
  }
}
