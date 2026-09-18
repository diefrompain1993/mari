import { Container, Graphics, Text, Rectangle } from "pixi.js";
export const palette = {
  ink: 0x111819,
  paper: 0xeee3ce,
  muted: 0xa6aaa4,
  gold: 0xc9ad79,
};
export function label(
  text: string,
  x: number,
  y: number,
  size = 17,
  serif = false,
  color = palette.paper,
  width = 326,
) {
  const t = new Text({
    text,
    style: {
      fontFamily: serif ? "Cormorant Garamond" : "Onest Variable",
      fontSize: size,
      fill: color,
      wordWrap: true,
      wordWrapWidth: width,
      lineHeight: size * 1.45,
      fontWeight: "400",
    },
  });
  t.position.set(x, y);
  t.resolution = 2;
  return t;
}
export function button(
  text: string,
  x: number,
  y: number,
  width: number,
  action: () => void,
) {
  const c = new Container();
  c.position.set(x, y);
  c.eventMode = "static";
  c.cursor = "pointer";
  c.hitArea = new Rectangle(0, 0, width, 52);
  const g = new Graphics()
    .moveTo(0, 49)
    .lineTo(width, 49)
    .stroke({ color: palette.paper, alpha: 0.24, width: 1 });
  const t = label(text, width / 2, 13, 14, false, palette.paper, width - 12);
  t.anchor.set(0.5, 0);
  c.addChild(g, t);
  c.on("pointertap", (e) => {
    e.stopPropagation();
    action();
  });
  return c;
}
export function shade(width: number, height: number) {
  const g = new Graphics();
  for (let i = 0; i < 160; i++)
    g.rect(0, height - 320 + i * 2, width, 2).fill({
      color: 0x090f11,
      alpha: Math.min(.94, (i / 160) ** .65),
    });
  return g;
}
