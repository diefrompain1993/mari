import { Container, Graphics } from "pixi.js";
import gsap from "gsap";
import type {Environment} from '../content/types';
export class TransitionDirector {
  constructor(
    private root: Container,
    private reduced: () => boolean,
  ) {}
  async cover(pixel: boolean, height: number, environment: Environment) {
    const c = new Container();
    this.root.addChild(c);
    if (pixel && !this.reduced()) {
      for (let i = 0; i < 48; i++) {
        const g = new Graphics()
          .rect(
            (i % 6) * 65,
            (Math.floor(i / 6) * height) / 8,
            66,
            height / 8 + 1,
          )
          .fill(0x111819);
        g.alpha = 0;
        c.addChild(g);
        gsap.to(g, { alpha: 1, duration: 0.35, delay: ((i * 7) % 17) * 0.035 });
      }
    } else if (!this.reduced() && (environment === 'light' || environment === 'garden')) {
      for (let i=0; i<20; i++) {
        const g = new Graphics().rect(i*20,0,21,height).fill(environment === 'light'?0xc8c4b8:0x9b8966);
        g.scale.y=0; g.pivot.y=i%2?height:0;g.y=i%2?height:0;c.addChild(g);
        gsap.to(g.scale,{y:1,duration:.7,delay:Math.sin(i*2)**2*.2,ease:'sine.inOut'});
      }
    } else {
      const g = new Graphics().rect(0, 0, 390, height).fill(environment === 'crowd' && !this.reduced()?0x65443a:0x101719);
      g.alpha = 0;
      c.addChild(g);
      gsap.to(g, { alpha: 1, duration: 0.65 });
    }
    await new Promise((r) => setTimeout(r, 950));
    return () => {
      gsap.to(c, {
        alpha: 0,
        duration: this.reduced() ? 0.3 : 1.1,
        onComplete: () => c.destroy({ children: true }),
      });
    };
  }
}
