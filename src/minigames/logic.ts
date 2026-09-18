export const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
export function followPath(progress: number) {
  return 195 + Math.sin(progress * Math.PI * 3) * 82;
}
export function crowdGap(seconds: number) {
  return 195 + Math.sin(seconds * 0.17) * 85 + Math.sin(seconds * 0.07) * 24;
}
export function crowdProgress(dt: number, distance: number, active: boolean) {
  return active ? dt * (distance < 60 ? 1 : 0.65) : 0;
}
export function clockValue(turns: number, elapsed: number) {
  return turns >= 4 || elapsed >= 38
    ? "14 времени"
    : ["07:82", "25:14", "— : —", "03:91"][Math.min(3, turns)];
}
export const memoryCategories: Record<string, string[]> = {
  "Ночная тишина": ["Спокойствие", "Близость", "Нежность"],
  "Желание написать": ["Интерес", "Привязанность", "Близость"],
  Толпа: ["Забота", "Тревога", "Привязанность"],
  "14 времени": ["Дружба", "Близость", "Радость"],
};
