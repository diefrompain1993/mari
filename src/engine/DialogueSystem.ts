import { Container, Graphics, Text, Rectangle, CanvasTextMetrics } from "pixi.js";
import { label, palette } from "../ui/canvas";
import type { Beat, Settings } from "../content/types";
export class DialogueSystem {
  readonly layer = new Container();
  private text: Text;
  private who: Text;
  private hint: Text;
  private full = "";
  private elapsed = 0;
  private done = false;
  private active = false;
  private final = false;
  private panelHeight = 185;
  private fullHeight = 0;
  constructor(
    private settings: () => Settings,
    private next: () => void,
  ) {
    this.who = label("", 32, 0, 10, false, palette.gold);
    this.who.style.letterSpacing = 2;
    this.text = label("", 32, 24, 19);
    this.hint = label(
      "КОСНИСЬ, ЧТОБЫ ПРОДОЛЖИТЬ",
      32,
      134,
      8,
      false,
      palette.muted,
    );
    this.hint.style.letterSpacing = 1.5;
    const edge = new Graphics()
      .moveTo(32, -15)
      .lineTo(65, -15)
      .stroke({ color: palette.paper, alpha: 0.4, width: 1 });
    this.layer.addChild(edge, this.who, this.text, this.hint);
    this.layer.eventMode = "static";
    this.layer.hitArea = new Rectangle(0, -22, 390, 210);
    this.layer.on("pointertap", (e) => {
      e.stopPropagation();
      this.tap();
    });
  }
  show(beat: Beat, height: number) {
    this.full = beat.text ?? "";
    this.elapsed = 0;
    this.done = false;
    this.active = true;
    this.final = !!beat.final;
    this.layer.visible = true;
    this.text.text = "";
    this.text.style.fontFamily = this.final
      ? "Cormorant Garamond"
      : "Onest Variable";
    this.text.style.fontSize = this.final ? 33 : 19;
    this.text.style.lineHeight = this.final ? 42 : 28;
    this.text.style.wordWrapWidth = 326;
    this.fullHeight = CanvasTextMetrics.measureText(this.full, this.text.style).height;
    this.panelHeight = Math.max(this.final ? 200 : 185, this.fullHeight + 85);
    this.layer.position.y = height - this.panelHeight;
    this.hint.y = 24 + this.fullHeight + 22;
    this.layer.hitArea = new Rectangle(0, -22, 390, this.panelHeight + 22);
    const names = {girl:'ДЕВУШКА ИЗ СВЕТА', hero:'СТРАННИК', thought:'ПРО СЕБЯ', narrator:'', binder:'ПЕРЕПЛЁТЧИК', letter:'ДЕВУШКА С ПИСЬМОМ', musician:'МУЗЫКАНТ', painter:'ХУДОЖНИК', keeper:'ХРАНИТЕЛЬНИЦА'};
    this.who.text = this.final ? '' : names[beat.speaker ?? 'narrator'];
    this.hint.visible = false;
    document.getElementById("sr-story")!.textContent = this.full;
  }
  hide() {
    this.active = false;
    this.layer.visible = false;
  }
  resize(height: number) {
    this.layer.position.y = height - this.panelHeight;
  }
  tap() {
    if (!this.active || this.final) return;
    if (!this.done) {
      this.text.text = this.full;
      this.done = true;
      this.hint.visible = true;
    } else this.next();
  }
  update(dt: number) {
    if (!this.active || this.done) return;
    this.elapsed += dt;
    const speed = this.final ? 16 : this.settings().textSpeed;
    const chars = Math.floor((this.elapsed / 1000) * speed);
    this.text.text = this.full.slice(0, chars);
    if (chars >= this.full.length) {
      this.done = true;
      this.hint.visible = !this.final;
    }
  }
  state() {
    return { typing: !this.done, visible: this.active, final: this.final,
      textBottom: this.layer.y + 24 + this.fullHeight,
      hintTop: this.layer.y + this.hint.y };
  }
}
