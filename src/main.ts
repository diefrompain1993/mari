import "./style.css";
import { Application } from "pixi.js";
import { GameDirector } from "./engine/GameDirector";
async function main() {
  const app = new Application();
  try {
    await app.init({
      width: innerWidth,
      height: innerHeight,
      resolution: Math.min(devicePixelRatio, 1.5),
      autoDensity: true,
      antialias: false,
      background: 0x111516,
      preference: "webgl",
      powerPreference: "high-performance",
    });
    document.getElementById("game")!.appendChild(app.canvas);
    const director = new GameDirector(app);
    if (import.meta.env.DEV) {
      Object.defineProperty(window, "__VN_DEBUG__", {
        value: {
          goToScene: (id: string) => director.goToScene(id),
          restartScene: () => director.restartScene(),
          completeMinigame: () => director.completeMinigame(),
          setCharacterStage: (hero: number, girl: number) =>
            director.setCharacterStage(hero, girl),
          dumpState: () => director.dumpState(),
        },
        configurable: true,
      });
    }
    await director.boot();
  } catch (error) {
    document.getElementById("boot")!.innerHTML =
      "<p>Истории нужен браузер<br>с поддержкой WebGL.</p><small>Попробуй открыть ссылку в Safari или Chrome.</small>";
    if (import.meta.env.DEV) console.error(error);
  }
}
void main();
