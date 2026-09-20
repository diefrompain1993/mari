import { Application, Container, Graphics } from "pixi.js";
import gsap from "gsap";
import { story, findScene, stagesAt } from "../content/story";
import { worldStyle } from '../content/visuals';
import type { SaveData, Settings } from "../content/types";
import { AssetManager } from "./AssetManager";
import { SaveManager, defaults } from "./SaveManager";
import { SceneManager } from "./SceneManager";
import { AudioManager } from "./AudioManager";
import { DialogueSystem } from "./DialogueSystem";
import { TransitionDirector } from "./TransitionDirector";
import { MinigameDirector } from "../minigames/MinigameDirector";
import { button, label } from "../ui/canvas";
export class GameDirector {
  readonly root = new Container();
  readonly assets = new AssetManager();
  readonly save = new SaveManager();
  readonly scenes: SceneManager;
  readonly audio: AudioManager;
  readonly dialogue: DialogueSystem;
  readonly games: MinigameDirector;
  readonly transitions: TransitionDirector;
  private data: SaveData;
  private height = 844;
  private started = false;
  private busy = false;
  private paused = false;
  private pauseRemaining = 0;
  private time = 0;
  private frames: number[] = [];
  private generation = 0;
  private startLayer = new Container();
  constructor(readonly app: Application) {
    const saved = this.save.load();
    this.data = saved ?? {
      version: 1,
      scene: 0,
      beat: 0,
      completed: [],
      settings: defaults(
        matchMedia("(prefers-reduced-motion: reduce)").matches,
      ),
    };
    app.stage.addChild(this.root);
    this.scenes = new SceneManager(
      this.root,
      this.assets,
      () => this.data.settings,
    );
    this.audio = new AudioManager(this.data.settings);
    this.dialogue = new DialogueSystem(
      () => this.data.settings,
      () => void this.next(),
    );
    this.games = new MinigameDirector(this.scenes, () =>
      this.audio.cue("chime"),
    );
    this.root.addChild(this.games.layer, this.dialogue.layer, this.startLayer);
    this.transitions = new TransitionDirector(
      this.root,
      () => this.data.settings.reducedMotion,
    );
    app.ticker.add((t) => this.update(t.deltaMS));
    this.resize();
    window.addEventListener("resize", () => this.resize());
    visualViewport?.addEventListener("resize", () => this.resize());
    document.addEventListener("visibilitychange", () =>
      this.pause(document.hidden || document.querySelector<HTMLDialogElement>('#settings')!.open || matchMedia('(orientation: landscape)').matches),
    );
    this.setupSettings();
  }
  async boot() {
    await document.fonts.ready;
    await this.assets.scene(story[0]);
    await this.scenes.enter(story[0], this.height);
    this.scenes.setOpening(false);
    this.scenes.hero.visible = false;
    this.dialogue.hide();
    this.startLayer
      .removeChildren()
      .forEach((c) => c.destroy({ children: true }));
    const g = new Graphics()
      .moveTo(195, this.height * 0.31)
      .lineTo(195, this.height * 0.39)
      .stroke({ color: 0xe7dac4, width: 1, alpha: 0.7 });
    const text = label(
      "Последняя страница\nпока пуста.",
      195,
      this.height * 0.43,
      30,
      true,
    );
    text.anchor.set(0.5, 0);
    text.style.align = "center";
    const b = button(
      this.save.load() ? "Продолжить" : "Открыть книгу",
      85,
      this.height * 0.67,
      220,
      () => {
        void this.audio.unlock().then((ok) => {
          document.getElementById("audio-retry")!.hidden = ok;
        });
        void this.begin();
      },
    );
    this.startLayer.addChild(g, text, b);
    const small = label(
      "Лучше со звуком. И без спешки.",
      195,
      this.height * 0.8,
      10,
      false,
      0xa4a79f,
    );
    small.anchor.set(0.5, 0);
    this.startLayer.addChild(small);
    document.getElementById("boot")!.style.display = "none";
    this.assets.prefetch(story[1]);
    if (import.meta.env.DEV) {
      const query = new URLSearchParams(location.search);
      const id = query.get("scene");
      if (id) {
        document.documentElement.dataset.debug = "true";
        await this.goToScene(id);
      }
    }
  }
  private async begin() {
    if (this.started) return;
    this.started = true;
    this.startLayer.visible = false;
    await this.enter(this.data.scene, this.data.beat, false);
  }
  private async enter(index: number, beat = 0, transition = true) {
    const token = ++this.generation;
    this.busy = true;
    this.dialogue.hide();
    this.games.stop();
    this.pauseRemaining = 0;
    const uncover = transition
      ? await this.transitions.cover(
          worldStyle(story[index].hero) === 'pixel',
          this.height,
          story[index].environment,
        )
      : () => {};
    if (token !== this.generation) {
      uncover();
      return;
    }
    try {
      await this.scenes.enter(story[index], this.height);
      if (token !== this.generation) {
        uncover();
        return;
      }
      this.data.scene = index;
      this.data.beat = beat;
      this.scenes.setOpening(false);
      this.audio.enter(story[index]);
      uncover();
      if (transition && beat === 0) await this.scenes.title(story[index]);
      if (token !== this.generation) return;
      this.busy = false;
      this.applyBeat();
      this.assets.prefetch(story[index + 1]);
      void this.assets.retain(story.slice(Math.max(0, index - 1), index + 2));
    } catch {
      uncover();
      this.showLoadRetry(index, beat);
    }
  }
  private showLoadRetry(index: number, beat: number) {
    const c = new Container();
    c.addChild(new Graphics().rect(0, 0, 390, this.height).fill(0x111819));
    c.addChild(
      label(
        "Не получилось загрузить\nследующий фрагмент истории.",
        32,
        this.height * 0.4,
        23,
        true,
      ),
    );
    c.addChild(
      button("Попробовать ещё раз", 32, this.height * 0.6, 326, () => {
        c.destroy({ children: true });
        void this.enter(index, beat, false);
      }),
    );
    this.root.addChild(c);
  }
  private applyBeat() {
    const scene = story[this.data.scene],
      beat = scene.beats[this.data.beat];
    const stages = stagesAt(this.data.scene, this.data.beat);
    this.scenes.setStages(stages.hero, stages.girl);
    this.scenes.layout(this.height);
    this.dialogue.resize(this.height);
    this.scenes.camera.cue(
      beat.camera ?? (scene.environment === "room" ? "still" : "wide"),
    );
    this.scenes.beat(beat.id);
    if (beat.cue) this.audio.cue(beat.cue);
    if (beat.game) {
      this.dialogue.hide();
      this.games.start(beat.game, this.height, () => {
        if (!this.data.completed.includes(beat.id))
          this.data.completed.push(beat.id);
        void this.next();
      });
    } else if (beat.pause) {
      this.dialogue.hide();
      this.pauseRemaining = beat.pause;
      if (beat.id === "night_silence" || beat.id === "before_question")
        this.audio.quiet(0.08);
    } else if (beat.text) this.dialogue.show(beat, this.height);
    if (beat.final) {
      document.getElementById("settings-button")!.style.opacity = ".2";
      this.audio.quiet(0.12);
    }
    this.persist();
  }
  async next() {
    if (
      this.busy ||
      !this.started ||
      this.games.snapshot() ||
      this.pauseRemaining > 0
    )
      return;
    const scene = story[this.data.scene];
    if (scene.beats[this.data.beat].final) return;
    this.dialogue.hide();
    if (this.data.beat + 1 < scene.beats.length) {
      this.data.beat++;
      this.applyBeat();
    } else if (this.data.scene + 1 < story.length)
      await this.enter(this.data.scene + 1, 0, story[this.data.scene + 1].id !== 'finale_question');
  }
  private update(dt: number) {
    if (this.paused) return;
    const delta = Math.min(dt, 150);
    this.time += delta / 1000;
    this.frames.push(dt);
    if (this.frames.length > 120) this.frames.shift();
    this.scenes.update(this.time, delta);
    this.dialogue.update(delta);
    this.games.update(delta);
    if (this.pauseRemaining > 0 && !this.busy) {
      this.pauseRemaining -= delta;
      if (this.pauseRemaining <= 0) {
        this.pauseRemaining = 0;
        void this.next();
      }
    }
  }
  private resize() {
    const w = window.innerWidth,
      h = window.innerHeight;
    const scale = w / 390;
    // Keep the drawing buffer stable: WebKit can lose canvas presentation on resize.
    // CSS fits the viewport; inverse root scaling preserves proportions and touch mapping.
    this.app.canvas.style.width = '100%';
    this.app.canvas.style.height = '100%';
    this.root.scale.set(this.app.screen.width / 390, this.app.screen.height / (h / scale));
    this.height = h / scale;
    this.scenes.layout(this.height);
    this.dialogue.resize(this.height);
    this.games.resize(this.height);
    if (this.started) this.pause(document.hidden || document.querySelector<HTMLDialogElement>('#settings')!.open || matchMedia('(orientation: landscape)').matches);
  }
  private persist() {
    this.save.save(this.data);
  }
  private pause(value: boolean) {
    this.paused = value;
    if (value) {
      this.audio.pause();
      gsap.globalTimeline.pause();
      this.persist();
    } else {
      this.audio.resume();
      gsap.globalTimeline.resume();
    }
  }
  private setupSettings() {
    const dialog = document.querySelector<HTMLDialogElement>("#settings")!;
    const fields = {
      music: document.querySelector<HTMLInputElement>("#music")!,
      sfx: document.querySelector<HTMLInputElement>("#sfx")!,
      textSpeed: document.querySelector<HTMLInputElement>("#text-speed")!,
      reducedMotion:
        document.querySelector<HTMLInputElement>("#reduced-motion")!,
    };
    const refresh = () => {
      for (const id of ['music', 'sfx', 'text-speed']) {
        const field = document.getElementById(id) as HTMLInputElement;
        document.getElementById(id+'-value')!.textContent = id === 'text-speed'
          ? Number(field.value) < 30 ? 'Неспешно' : Number(field.value) > 45 ? 'Быстро' : 'Размеренно'
          : Math.round(Number(field.value)*100)+'%';
      }
      document.documentElement.dataset.motion = fields.reducedMotion.checked ? 'reduced' : 'full';
    };
    document.getElementById("settings-button")!.onclick = () => {
      for (const k of ["music", "sfx", "textSpeed"] as const)
        fields[k].value = String(this.data.settings[k]);
      fields.reducedMotion.checked = this.data.settings.reducedMotion;
      refresh();
      this.pause(true);
      dialog.showModal();
    };
    dialog.addEventListener("close", () => {
      confirmRestart = false;
      document.getElementById('restart')!.textContent = 'Начать историю заново';
      this.pause(document.hidden || matchMedia('(orientation: landscape)').matches);
    });
    for (const field of Object.values(fields))
      field.addEventListener("input", () => {
        this.data.settings = {
          music: Number(fields.music.value),
          sfx: Number(fields.sfx.value),
          textSpeed: Number(fields.textSpeed.value),
          reducedMotion: fields.reducedMotion.checked,
        };
        this.audio.update(this.data.settings);
        refresh();
        this.persist();
      });
    let confirmRestart = false;
    document.getElementById("restart")!.onclick = () => {
      const b = document.getElementById("restart")!;
      if (!confirmRestart) {
        b.textContent = "Ещё раз — начать сначала";
        confirmRestart = true;
        return;
      }
      confirmRestart = false;
      b.textContent = "Начать историю заново";
      dialog.close();
      this.data.scene = 0;
      this.data.beat = 0;
      this.data.completed = [];
      this.started = true;
      this.startLayer.visible = false;
      void this.enter(0, 0);
    };
    document.querySelector<HTMLButtonElement>("#audio-retry button")!.onclick =
      () =>
        void this.audio.unlock().then((ok) => {
          document.getElementById("audio-retry")!.hidden = ok;
        });
  }
  async goToScene(id: string) {
    const found = findScene(id);
    if (!found) throw new Error("Unknown scene " + id);
    this.started = true;
    this.startLayer.visible = false;
    await this.enter(found.scene, found.beat, false);
  }
  restartScene() {
    return this.goToScene(story[this.data.scene].id);
  }
  completeMinigame() {
    this.games.complete();
  }
  setCharacterStage(hero: number, girl: number) {
    return Promise.all([
      hero ? this.assets.load("hero-" + hero) : Promise.resolve(),
      girl ? this.assets.load("girl-" + girl) : Promise.resolve(),
    ]).then(() => this.scenes.setStages(hero, girl));
  }
  dumpState() {
    const scene = story[this.data.scene];
    return {
      chapter: scene.chapter,
      scene: scene.id,
      beat: scene.beats[this.data.beat].id,
      stages: stagesAt(this.data.scene, this.data.beat),
      loadedAssets: this.assets.ids(),
      audio: this.audio.state(),
      minigame: this.games.snapshot(),
      fps: Math.round(
        1000 /
          (this.frames.reduce((a, b) => a + b, 0) /
            Math.max(1, this.frames.length)),
      ),
      renderer: "WebGL",
      graphicsTier: this.scenes.fx.tier,
      particles: this.scenes.fx.count(),
      dialogue: this.dialogue.state(),
      paused: this.paused,
      busy: this.busy,
      remainingPause: this.pauseRemaining,
      completed: [...this.data.completed],
    };
  }
}
