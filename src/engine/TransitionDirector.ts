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
    } else if (!this.reduced()) {
      // Overlapping dark leaves turn across the scene, like closing a book.
      for (let i=0; i<12; i++) {
        const g = new Graphics().rect(0,0,34,height).fill(i%2?0x172334:0x1c2939);
        g.moveTo(32,0).lineTo(32,height).stroke({color:0xc5b797,width:1,alpha:.13});
        g.x=i*33;g.scale.x=0;c.addChild(g);
        gsap.to(g.scale,{x:1,duration:.48,delay:i*.028,ease:'sine.inOut'});
      }
    } else {
      const g = new Graphics().rect(0, 0, 390, height).fill(environment === 'crowd' && !this.reduced()?0x65443a:0x101719);
      g.alpha = 0;
      c.addChild(g);
      gsap.to(g, { alpha: 1, duration: 0.65 });
    }
    await new Promise<void>((resolve) => gsap.delayedCall(this.reduced() ? .7 : .95, resolve));
    return () => {
      gsap.to(c, {
        alpha: 0,
        duration: this.reduced() ? 0.3 : 1.1,
        onComplete: () => c.destroy({ children: true }),
      });
    };
  }
}
