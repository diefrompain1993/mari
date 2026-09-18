import { Howl, Howler } from "howler";
import type { Scene, Settings } from "../content/types";
import {personalMusic} from '../content/music';
export class AudioManager {
  private music?: Howl;
  private ambience?: Howl;
  private sounds = new Map<string, Howl>();
  private track = "";
  private unlocked = false;
  private paused = false;
  constructor(private settings: Settings) {
    Howler.autoUnlock = true;
    this.sounds.set('tap', new Howl({src:[import.meta.env.BASE_URL+'assets/audio/tap.wav'],volume:0,preload:true}));
  }
  async unlock() {
    try {
      if (Howler.ctx?.state === "suspended") await Howler.ctx.resume();
      this.unlocked = Howler.ctx?.state === "running";
      return this.unlocked;
    } catch {
      return false;
    }
  }
  enter(scene: Scene) {
    const id = personalMusic.scene === scene.id && personalMusic.stayTrack ? 'personal-stay' : scene.environment === "cafe" ? "cafe" : scene.chapter;
    if (this.track === id) return;
    this.track = id;
    const old = this.music;
    old?.fade(old.volume(), 0, 1000);
    if (old) setTimeout(() => old.unload(), 1100);
    this.music = new Howl({
      src: [import.meta.env.BASE_URL + (personalMusic.scene === scene.id && personalMusic.stayTrack ? personalMusic.stayTrack : `assets/audio/${id}.wav`)],
      loop: true,
      volume: 0,
      html5: false,
      onplayerror: () => {
        document.getElementById("audio-retry")!.hidden = false;
      },
    });
    this.music.play();
    this.music.fade(0, this.settings.music * 0.43, 1800);
    this.ambience?.unload();
    this.ambience = new Howl({
      src: [import.meta.env.BASE_URL + "assets/audio/air.wav"],
      loop: true,
      volume: this.settings.sfx * 0.13,
    });
    this.ambience.play();
  }
  cue(id: string) {
    let h = this.sounds.get(id);
    if (!h) {
      h = new Howl({
        src: [import.meta.env.BASE_URL + `assets/audio/${id}.wav`],
        volume: this.settings.sfx * 0.35,
      });
      this.sounds.set(id, h);
    }
    h.volume(this.settings.sfx * 0.35);
    h.play();
  }
  quiet(value = 0.2) {
    this.music?.fade(this.music.volume(), this.settings.music * value, 1500);
  }
  update(settings: Settings) {
    this.settings = settings;
    this.music?.volume(settings.music * 0.43);
    this.ambience?.volume(settings.sfx * 0.13);
  }
  pause() {
    this.paused = true;
    this.music?.pause();
    this.ambience?.pause();
  }
  resume() {
    if (!this.paused) return;
    this.paused = false;
    this.music?.play();
    this.ambience?.play();
  }
  state() {
    return {
      track: this.track,
      unlocked: this.unlocked,
      context: Howler.ctx?.state ?? "unavailable",
      playing: this.music?.playing() ?? false,
    };
  }
}
