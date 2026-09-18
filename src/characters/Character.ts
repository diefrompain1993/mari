import { Container, Sprite, Graphics, Texture } from "pixi.js";
import gsap from "gsap";
import { timing } from "../engine/timing";
export class Character extends Container {
  private art?: Sprite;
  private masker?: Graphics;
  private progress = { value: 1 };
  private transition = false;
  private drawing = false;
  private baseHeight = 320;
  private currentTexture?: Texture;
  constructor(readonly kind: "hero" | "girl") {
    super();
  }
  setArt(texture: Texture, height: number, reduced: boolean, animate = true) {
    this.baseHeight = height;
    if (!animate) {
      gsap.killTweensOf(this.progress);
      for (const child of this.removeChildren()) {
        gsap.killTweensOf(child);
        child.destroy();
      }
      this.art = undefined;
      this.masker = undefined;
      this.currentTexture = undefined;
      this.transition = false;
      this.drawing = false;
    }
    if (this.currentTexture === texture) {
      this.resize(height);
      return;
    }
    this.currentTexture = texture;
    const previous = this.art;
    const next = new Sprite(texture);
    next.anchor.set(0.5, 1);
    next.height = height;
    next.scale.x = next.scale.y;
    this.addChild(next);
    this.art = next;
    if (!previous || !animate || reduced) {
      previous?.destroy();
      return;
    }
    this.masker?.destroy();
    gsap.killTweensOf(this.progress);
    this.progress.value = 0;
    this.transition = true;
    const mask = new Graphics();
    this.masker = mask;
    this.addChild(mask);
    next.mask = mask;
    gsap.to(this.progress, {
      value: 1,
      duration: timing.reveal,
      ease: "sine.inOut",
      onComplete: () => {
        next.mask = null;
        mask.destroy();
        if (this.masker === mask) this.masker = undefined;
        previous.destroy();
        this.transition = false;
      },
    });
    gsap.to(previous, { alpha: 0, duration: timing.reveal, delay: 0.1 });
  }
  resize(height: number) {
    this.baseHeight = height;
    if (this.art) {
      this.art.height = height;
      this.art.scale.x = this.art.scale.y;
    }
  }
  draw(duration: number) {
    if (!this.art) return;
    gsap.killTweensOf(this.progress);
    this.masker?.destroy();
    this.masker = new Graphics();
    this.addChild(this.masker);
    this.art.mask = this.masker;
    this.progress.value = 0;
    this.drawing = true;
    gsap.to(this.progress, { value: 1, duration, ease: 'none', onComplete: () => {
      if (this.art) this.art.mask = null;
      this.masker?.destroy(); this.masker = undefined; this.drawing = false;
    }});
  }
  update(time: number, reduced: boolean) {
    if (this.art) {
      this.art.y = reduced
        ? 0
        : Math.sin(time * 1.25 + (this.kind === "girl" ? 1 : 0)) * 1.1;
      this.art.rotation = reduced ? 0 : Math.sin(time * 0.55) * 0.0015;
    }
    if (this.drawing && this.masker) {
      this.masker.clear().rect(-160, -this.baseHeight, 320, this.baseHeight * this.progress.value).fill(0xffffff);
    } else if (this.transition && this.masker) {
      const p = this.progress.value;
      this.masker.clear();
      const halfWidth = Math.max(125, (this.art?.width ?? 250) / 2 + 8);
      for (let row = 0; row < 50; row++) {
        const stagger = (Math.sin(row * 13.37) + 1) * 0.11;
        const w = Math.max(0, Math.min(1, (p - stagger) / 0.78)) * halfWidth * 2;
        this.masker
          .rect(
            -halfWidth,
            -this.baseHeight + (row * this.baseHeight) / 50,
            w,
            this.baseHeight / 50 + 1,
          )
          .fill(0xffffff);
      }
    }
  }
  override destroy() {
    gsap.killTweensOf(this.progress);
    for (const child of this.children) gsap.killTweensOf(child);
    super.destroy({ children: true });
  }
}
