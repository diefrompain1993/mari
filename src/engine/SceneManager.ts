import { Container, Sprite, Graphics } from "pixi.js";
import gsap from "gsap";
import { Character } from "../characters/Character";
import { AssetManager } from "./AssetManager";
import { CameraDirector } from "./CameraDirector";
import { FXManager } from "./FXManager";
import { label, shade } from "../ui/canvas";
import type { Scene, Settings } from "../content/types";
export class SceneManager {
  readonly world = new Container();
  readonly overlay = new Container();
  readonly hero = new Character("hero");
  readonly girl = new Character("girl");
  readonly fx = new FXManager();
  readonly camera: CameraDirector;
  private background?: Sprite;
  private scene?: Scene;
  private height = 844;
  private foreground = new Graphics();
  private crowd: Sprite[] = [];
  private stages = { hero: 0, girl: 0 };
  private opening = false;
  private dialogueShade?: Graphics;
  private shadeHeight = 844;
  constructor(
    readonly root: Container,
    readonly assets: AssetManager,
    private settings: () => Settings,
  ) {
    root.addChild(this.world);
    this.world.addChild(this.hero, this.girl, this.foreground);
    root.addChild(this.fx.layer, this.overlay);
    this.camera = new CameraDirector(
      this.world,
      () => settings().reducedMotion,
    );
  }
  async enter(scene: Scene, height: number) {
    this.height = height;
    this.scene = scene;
    await this.assets.scene(scene);
    this.background?.destroy();
    this.background = new Sprite(this.assets.get("env-" + scene.environment));
    this.world.addChildAt(this.background, 0);
    this.fx.set(scene.environment);
    this.overlay.removeChildren().forEach((c) => c.destroy());
    this.dialogueShade = shade(390, height);
    this.shadeHeight = height;
    this.overlay.addChild(this.dialogueShade);
    this.foreground.clear();
    this.crowd.forEach((s) => s.destroy());
    this.crowd = [];
    this.setStages(scene.hero, scene.girl, false);
    this.layout(height);
    if (scene.environment === "crowd") {
      for (let i = 0; i < 24; i++) {
        const s = new Sprite(this.assets.get(i % 2 ? "hero-3" : "girl-6"));
        s.anchor.set(0.5, 1);
        s.height = 220 + (i % 4) * 22;
        s.scale.x = s.scale.y;
        s.tint = 0x000000;
        s.alpha = i % 3 ? .86 : .65;
        if (i % 2) s.scale.x *= -1;
        s.position.set(((i * 91) % 470) - 40, height * 0.54 + (i % 4) * 65);
        this.world.addChild(s);
        this.crowd.push(s);
      }
    }
    this.world.addChild(this.hero, this.girl, this.foreground);
    this.camera.cue("wide");
  }
  setStages(hero: number, girl: number, animate = true) {
    this.stages = { hero, girl };
    this.hero.visible = hero > 0;
    this.girl.visible = girl > 0;
    const seated = this.scene?.environment === 'room' || this.scene?.environment === 'cafe';
    this.girl.scale.x = seated ? -1 : 1;
    if (hero)
      this.hero.setArt(
        this.assets.get(seated ? 'hero-seated' : "hero-" + hero),
        this.characterHeight("hero"),
        this.settings().reducedMotion,
        animate,
      );
    if (girl)
      this.girl.setArt(
        this.assets.get(seated ? (this.scene?.environment === 'room' && girl < 6 ? 'girl-seated-partial' : 'girl-seated') : "girl-" + girl),
        this.characterHeight("girl"),
        this.settings().reducedMotion,
        animate,
      );
  }
  private characterHeight(kind: "hero" | "girl") {
    const env = this.scene?.environment;
    const base =
      env === "prologue"
        ? 290
        : env === "light"
          ? 290
          : env === "room" || env === "cafe"
            ? 325
            : env === "finale"
              ? 385
              : env === "crowd"
                ? 300
                : 350;
    return base * (kind === "girl" ? 0.94 : 1);
  }
  layout(height: number) {
    this.height = height;
    if (this.dialogueShade) this.dialogueShade.y = height - this.shadeHeight;
    if (this.background) {
      const scale = Math.max(
        390 / this.background.texture.width,
        height / this.background.texture.height,
      );
      this.background.scale.set(scale);
      this.background.position.set(
        (390 - this.background.width) / 2,
        (height - this.background.height) / 2,
      );
    }
    const solo = this.stages.girl === 0;
    this.hero.position.set(solo ? 195 : 124, height * 0.75);
    this.girl.position.set(265, height * 0.75 - 6);
    if (this.scene?.environment === 'room') {
      this.hero.position.set(78, height*.79);
      this.girl.position.set(305, height*.79);
    }
    if (this.scene?.environment === 'cafe') {
      this.hero.position.set(80, height*.76);
      this.girl.position.set(305, height*.76);
    }
    this.hero.resize(this.characterHeight("hero"));
    this.girl.resize(this.characterHeight("girl"));
  }
  async title(scene: Scene) {
    if (!scene.title) return;
    const c = new Container();
    const scrim = new Graphics()
      .rect(0, 0, 390, this.height)
      .fill({ color: 0x101719, alpha: 0.65 });
    const top = label(
      scene.eyebrow,
      195,
      this.height * 0.31,
      10,
      false,
      0xd4c4a6,
    );
    top.anchor.set(0.5, 0);
    top.style.letterSpacing = 4;
    const text = label(scene.title, 195, this.height * 0.38, 43, true);
    text.anchor.set(0.5, 0);
    c.addChild(scrim, top, text);
    this.overlay.addChild(c);
    await new Promise<void>((resolve) => {
      gsap.fromTo(
        c,
        { alpha: 0 },
        {
          alpha: 1,
          duration: 0.6,
          onComplete: () => {
            gsap.to(c, {
              alpha: 0,
              delay: 1.4,
              duration: 0.7,
              onComplete: () => {
                c.destroy({ children: true });
                resolve();
              },
            });
          },
        },
      );
    });
  }
  setOpening(value: boolean) {
    this.opening = value;
    if (this.background) this.background.alpha = value ? 0.12 : 1;
  }
  beat(id: string) {
    if (id === 'opening_line') this.hero.draw(this.settings().reducedMotion ? 1 : 5.5);
    if (id === "title_reveal") {
      const t = label("Проявление", 195, this.height * 0.28, 46, true);
      t.anchor.set(0.5, 0);
      this.overlay.addChild(t);
      gsap.fromTo(t, { alpha: 0 }, { alpha: 1, duration: 1 });
      gsap.to(t, {
        alpha: 0,
        delay: 3,
        duration: 1,
        onComplete: () => t.destroy(),
      });
    }
    if (id === "first_light") {
      this.setOpening(false);
      this.girl.x = 280;
      gsap.from(this.girl, { alpha: 0, x: 320, duration: 2.5 });
    }
    if (id === "first_kindness_reveal" || id === "kindness_wait") {
      const lights = new Graphics();
      for (let i = 0; i < 3; i++)
        lights
          .circle(230 + i * 35, this.height * 0.53 + i * 13, 4 - i * 0.7)
          .fill({ color: 0xf4dfac, alpha: 0.7 });
      this.world.addChild(lights);
      gsap.fromTo(
        lights,
        { alpha: 0.15 },
        {
          alpha: 0.9,
          duration: 2,
          yoyo: true,
          repeat: 2,
          onComplete: () => lights.destroy(),
        },
      );
    }
    if (id === "unable_to_simplify") {
      const t = label(
        "НЕ УДАЁТСЯ\nУПРОСТИТЬ",
        195,
        this.height * 0.28,
        16,
        false,
        0xe2c38c,
      );
      t.anchor.set(0.5, 0);
      t.style.align = "center";
      this.overlay.addChild(t);
      gsap.to(t, {
        alpha: 0,
        delay: 3,
        duration: 1,
        onComplete: () => t.destroy(),
      });
    }
    if (id === "light_memory") {
      const g = new Sprite(this.assets.get("girl-7"));
      g.anchor.set(0.5, 1);
      g.height = this.characterHeight("girl");
      g.scale.x = g.scale.y;
      g.position.copyFrom(this.girl.position);
      g.tint = 0xfff4d7;
      g.alpha = 0.3;
      this.world.addChild(g);
      gsap.to(g, { alpha: 0, duration: 3, onComplete: () => g.destroy() });
    }
  }
  update(time: number, dt: number) {
    this.camera.update(time, this.height);
    this.hero.update(time, this.settings().reducedMotion);
    this.girl.update(time, this.settings().reducedMotion);
    this.fx.update(time, dt, this.height, this.settings().reducedMotion);
    if (!this.settings().reducedMotion)
      this.crowd.forEach((s, i) => {
        s.x = ((((i * 91 + time * (i % 2 ? 11 : -9)) % 490) + 490) % 490) - 50;
        s.y = this.height * 0.54 + (i % 4) * 65 + Math.sin(time + i) * 2;
      });
    if (this.opening && this.background) this.background.alpha = 0.12;
  }
}
