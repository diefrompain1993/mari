import type { Scene } from './types';
export type WorldStyle = 'line' | 'pixel' | 'full';
export const worldStyle = (hero: number): WorldStyle => hero >= 6 ? 'full' : hero >= 4 ? 'pixel' : 'line';
export function backgroundId(scene: Scene, hero: number) {
  if (hero >= 6 && scene.fullBackground) return scene.fullBackground;
  if (scene.background) return scene.background;
  const style = worldStyle(hero);
  if (style === 'line') return 'env-line';
  if (style === 'full') return 'env-' + scene.environment;
  if (scene.environment === 'room' || scene.environment === 'cafe') return 'env-pixel-room';
  if (scene.environment === 'crowd' || scene.environment === 'pixel' || scene.environment === 'thought') return 'env-pixel-passage';
  return 'env-pixel-garden';
}
export function characterIds(scene: Scene, hero: number, girl: number) {
  const style = worldStyle(hero);
  const seated = scene.environment === 'room' || scene.environment === 'cafe';
  return {
    hero: seated ? (style === 'pixel' ? 'hero-seated-pixel' : 'hero-seated') : 'hero-' + hero,
    girl: style === 'pixel'
      ? seated ? 'girl-seated-pixel' : girl < 6 ? 'girl-pixel-' + girl : 'girl-pixel'
      : seated ? 'girl-seated' : 'girl-' + girl,
  };
}
