import {
  Container,
  Graphics,
  Rectangle,
  FederatedPointerEvent,
  Text,
} from "pixi.js";
import gsap from "gsap";
import { button, label, palette } from "../ui/canvas";
import {
  clamp,
  followPath,
  crowdGap,
  crowdProgress,
  clockValue,
  memoryCategories,
} from "./logic";
import { timing } from "../engine/timing";
import type { GameKind } from "../content/types";
import type { SceneManager } from "../engine/SceneManager";
interface Runtime {
  kind: GameKind;
  elapsed: number;
  progress: number;
  held: boolean;
  x: number;
  y: number;
  turns: number;
  round: number;
  responding: number;
  done: boolean;
}
export class MinigameDirector {
  readonly layer = new Container();
  private state?: Runtime;
  private art = new Graphics();
  private instruction: Text;
  private message: Text;
  private controls = new Container();
  private rings = new Container();
  private finish?: () => void;
  private H = 844;
  private pointerId = -1;
  constructor(
    private scenes: SceneManager,
    private chime: () => void,
  ) {
    this.instruction = label("", 32, 0, 12, false, palette.muted);
    this.message = label("", 32, 0, 19);
    this.layer.addChild(
      this.art,
      this.rings,
      this.instruction,
      this.message,
      this.controls,
    );
    this.layer.eventMode = "static";
    this.layer.on("pointerdown", (e) => this.down(e));
    this.layer.on("globalpointermove", (e) => this.move(e));
    this.layer.on("pointerup", () => this.up());
    this.layer.on("pointerupoutside", () => this.up());
    this.layer.on("pointercancel", () => this.up());
    this.layer.visible = false;
  }
  start(kind: GameKind, height: number, done: () => void) {
    this.stop();
    this.H = height;
    this.finish = done;
    this.state = {
      kind,
      elapsed: 0,
      progress: 0,
      held: false,
      x: 195,
      y: height * 0.72,
      turns: 0,
      round: 0,
      responding: 0,
      done: false,
    };
    this.layer.visible = true;
    this.layer.hitArea = new Rectangle(0, 70, 390, height - 70);
    this.instruction.y = height - 93;
    this.message.y = height - 210;
    this.message.text = "";
    this.instruction.text =
      kind === "follow"
        ? "Удерживай палец. Можно никуда не спешить."
        : kind === "crowd"
          ? "Веди пальцем, выбирая свободный проход."
          : kind === "clock"
            ? "Коснись колец или попробуй повернуть их."
            : "";
    if (kind === "clock") this.buildClock();
    if (kind === "night") this.nightChoices();
    if (kind === "sort") this.sortChoices();
  }
  private down(e: FederatedPointerEvent) {
    if (!this.state) return;
    e.stopPropagation();
    this.pointerId = e.pointerId;
    const p = this.layer.toLocal(e.global);
    this.state.held = true;
    this.state.x = p.x;
    this.state.y = p.y;
    if (this.state.kind === "clock") {
      this.state.turns++;
      this.chime();
      for (const [i, c] of this.rings.children.entries())
        gsap.to(c, {
          rotation: c.rotation + (i % 2 ? -0.8 : 0.7),
          duration: 1.2,
          ease: "sine.inOut",
        });
    }
  }
  private move(e: FederatedPointerEvent) {
    if (!this.state?.held || e.pointerId !== this.pointerId) return;
    const p = this.layer.toLocal(e.global);
    this.state.x = clamp(p.x, 50, 340);
    this.state.y = p.y;
  }
  private up() {
    if (this.state) this.state.held = false;
    this.pointerId = -1;
  }
  private buildClock() {
    for (let j = 0; j < 3; j++) {
      const g = new Graphics();
      const r = 105 - j * 27;
      g.circle(0, 0, r).stroke({ color: 0xd3bc91, width: 1.2, alpha: 0.7 });
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        g.moveTo(Math.cos(a) * (r - 9), Math.sin(a) * (r - 9))
          .lineTo(Math.cos(a) * r, Math.sin(a) * r)
          .stroke({ color: 0xd3bc91, width: 1, alpha: 0.8 });
      }
      g.moveTo(0, 0)
        .lineTo(0, -r + 10)
        .stroke({ color: 0xe8d8bb, width: 2 });
      g.position.set(195, this.H * 0.44);
      this.rings.addChild(g);
    }
    this.message.text = "07:82";
    this.message.style.align = "center";
    this.message.x = 32;
    this.message.style.fontFamily = "Cormorant Garamond";
    this.message.style.fontSize = 32;
  }
  private clearControls() {
    this.controls
      .removeChildren()
      .forEach((c) => c.destroy({ children: true }));
  }
  private nightChoices() {
    const s = this.state!;
    this.clearControls();
    this.message.y = this.H - 260;
    this.message.style.fontFamily = "Onest Variable";
    this.message.style.fontSize = 19;
    this.message.style.align = "left";
    const rounds = [
      ["Спросить", "Рассказать", "Послушать"],
      ["Пошутить", "Спросить ещё", "Оставить паузу"],
      ["Рассказать честно", "Послушать", "Просто остаться"],
    ];
    const prompts = [
      "Разговор ещё никуда не торопится.",
      "За окном кто-то гасит свет.",
      "Можно ничего не придумывать.",
    ];
    this.message.text = prompts[s.round];
    rounds[s.round].forEach((text, i) => {
      const b = button(text, 32, this.H - 181 + i * 51, 326, () =>
        this.chooseNight(i),
      );
      this.controls.addChild(b);
    });
  }
  private chooseNight(choice: number) {
    const s = this.state;
    if (!s || s.responding) return;
    this.clearControls();
    this.chime();
    const answers = [
      [
        "— А тебе бывает хорошо оттого, что день обычный?\n— Вот сейчас, например.",
        "— Я сегодня хотел тебе кое-что рассказать.\n— Я слушаю.",
        "Ты слушаешь. Она ненадолго отвлекается на огни, потом продолжает.",
      ],
      [
        "— Мы профессионально ничего не делаем.\n— Наконец-то подходящая работа.",
        "— Ты ещё не хочешь спать?\n— Пока нет.",
        "Разговор останавливается сам. Никто не пытается его подталкивать.",
      ],
      [
        "— Мне нравится, что можно вот так сидеть.\n— Тогда посидим ещё.",
        "Ей не приходится торопиться с ответом. Ты остаёшься рядом.",
        "За окном движется свет. Здесь всё спокойно.",
      ],
    ];
    this.message.text = answers[s.round][choice];
    this.message.y = this.H - 200;
    this.instruction.text = "";
    s.responding = 7;
  }
  private sortChoices() {
    const s = this.state!;
    this.clearControls();
    this.message.style.fontSize = 20;
    this.message.style.fontFamily = "Onest Variable";
    this.message.style.align = "left";
    const memory = Object.keys(memoryCategories)[s.round];
    this.message.text = memory;
    this.message.y = this.H * 0.37;
    this.instruction.text = "К чему это ближе?";
    const cats = memoryCategories[memory];
    cats.forEach((cat, i) =>
      this.controls.addChild(
        button(cat, 40, this.H - 220 + i * 54, 310, () => {
          if (s.responding) return;
          this.clearControls();
          this.message.text = memory + "\n\n" + cats.join("  ·  ");
          s.responding = 5;
          this.chime();
        }),
      ),
    );
  }
  update(dt: number) {
    const s = this.state;
    if (!s) return;
    const sec = Math.min(dt, 150) / 1000;
    if (s.done) { s.responding -= sec; if (s.responding <= 0) this.complete(); return; }
    s.elapsed += sec;
    this.art.clear();
    if (s.responding > 0) {
      s.responding -= sec;
      if (s.responding <= 0) {
        s.responding = 0;
        s.round++;
        if (s.round >= (s.kind === "night" ? 3 : 4)) this.complete();
        else if (s.kind === "night") this.nightChoices();
        else this.sortChoices();
      }
      return;
    }
    if (s.kind === "follow") {
      if (s.held) s.progress += sec / timing.followSeconds;
      const x = followPath(s.progress);
      this.scenes.hero.x += (x - this.scenes.hero.x) * 0.05;
      this.scenes.girl.x +=
        (followPath(s.progress + 0.16) - this.scenes.girl.x) * 0.04;
      this.scenes.girl.y = this.H * 0.68;
      for (let i = 0; i < 18; i++) {
        const y = this.H * 0.35 + i * 18;
        const px = 195 + Math.sin(s.progress * Math.PI * 3 + i * 0.12) * 80;
        this.art
          .circle(px, y, 1.5)
          .fill({ color: 0xf0d8a0, alpha: 0.12 + i * 0.016 });
      }
      this.message.text =
        s.progress > 0.7
          ? "Иногда она останавливается.\nТы тоже можешь."
          : s.progress > 0.35
            ? "Впереди становится немного яснее."
            : "";
      if (s.elapsed > 20 && !s.held)
        this.instruction.text = "Коснись и удерживай, чтобы идти дальше.";
      if (s.progress >= 1) this.complete();
    } else if (s.kind === "crowd") {
      const target = crowdGap(s.elapsed);
      this.scenes.girl.x += (target - this.scenes.girl.x) * 0.06;
      if (s.held) this.scenes.hero.x += (s.x - this.scenes.hero.x) * 0.1;
      const distance = Math.abs(this.scenes.hero.x - this.scenes.girl.x);
      s.progress += crowdProgress(sec, distance, s.held) / timing.crowdSeconds;
      this.art
        .moveTo(this.scenes.hero.x, this.H * 0.72)
        .quadraticCurveTo(
          (this.scenes.hero.x + this.scenes.girl.x) / 2,
          this.H * 0.75,
          this.scenes.girl.x,
          this.H * 0.71,
        )
        .stroke({
          color: 0xeed8aa,
          width: 1,
          alpha: distance < 70 ? 0.55 : 0.18,
        });
      this.message.text =
        distance > 100 ? "Можно подождать, пока появится проход." : "";
      if (s.progress >= 1) this.complete();
    } else if (s.kind === "clock") {
      const value = clockValue(s.turns, s.elapsed);
      this.message.text = value;
      if (value === "14 времени") {
        s.done = true;
        this.instruction.text = "";
        s.responding = 2.8;
      } else if (s.elapsed > 20)
        this.instruction.text = "Кажется, эти часы считают как-то иначе.";
    }
  }
  complete() {
    if (!this.state) return;
    const done = this.finish;
    this.stop();
    done?.();
  }
  stop() {
    this.state = undefined;
    this.finish = undefined;
    this.layer.visible = false;
    this.art.clear();
    this.clearControls();
    for (const c of this.rings.removeChildren()) {
      gsap.killTweensOf(c);
      c.destroy();
    }
    this.message.text = "";
    this.message.y = this.H - 210;
    this.message.style.fontSize = 19;
    this.message.style.fontFamily = "Onest Variable";
    this.message.style.align = "left";
  }
  snapshot() {
    return this.state ? { ...this.state } : null;
  }
  resize(height: number) {
    const delta = height - this.H;
    this.H = height;
    if (!this.state) return;
    this.layer.hitArea = new Rectangle(0,70,390,height-70);
    this.instruction.y += delta;
    this.message.y += this.state.kind === 'sort' ? delta*.37 : delta;
    for (const child of this.controls.children) child.y += delta;
    for (const child of this.rings.children) child.y += delta*.44;
  }
}
