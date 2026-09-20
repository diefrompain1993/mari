export type Chapter =
  | "prologue"
  | "light"
  | "approach"
  | "silence"
  | "noise"
  | "resolution"
  | "finale";
export type Environment =
  | "prologue"
  | "light"
  | "garden"
  | "clock"
  | "room"
  | "crowd"
  | "cafe"
  | "thought"
  | "finale"
  | "pixel";
export type GameKind = "follow" | "clock" | "night" | "crowd" | "sort" | 'page' | 'fragments' | 'stars' | 'musician' | 'archive' | 'name';
export type Speaker = "thought" | "hero" | "girl" | 'narrator' | 'binder' | 'letter' | 'musician' | 'painter' | 'keeper';
export interface Beat {
  id: string;
  text?: string;
  speaker?: Speaker;
  hero?: number;
  girl?: number;
  pause?: number;
  game?: GameKind;
  camera?: "wide" | "close" | "hand" | "still";
  cue?: "pencil" | "chime" | "door" | "breath";
  final?: boolean;
}
export interface Scene {
  id: string;
  chapter: Chapter;
  title: string;
  eyebrow: string;
  environment: Environment;
  hero: number;
  girl: number;
  background?: string;
  fullBackground?: string;
  npc?: string;
  beats: Beat[];
}
export interface Settings {
  music: number;
  sfx: number;
  textSpeed: number;
  reducedMotion: boolean;
}
export interface SaveData {
  version: 1;
  scene: number;
  beat: number;
  completed: string[];
  settings: Settings;
}
