import { Container, Graphics, Rectangle, Sprite, Text, CanvasTextMetrics } from 'pixi.js';
import gsap from 'gsap';
import { button, label, palette } from '../ui/canvas';
import type { GameKind } from '../content/types';
import type { SceneManager } from '../engine/SceneManager';
import { bookGames } from '../content/book-games';
interface Runtime {
  kind: GameKind; elapsed: number; progress: number; round: number;
  responding: number; awaiting: boolean; moving: boolean; turns: number; done: boolean;
  collected: number[];
}
const night = [
  { prompt: 'Она поворачивается к тебе. Можно начать с малого.', choices: ['Спросить, как она', 'Признаться, что устал', 'Послушать ветер'], answers: [
    '— А ты как? Я всё про себя.\n— Уже лучше. Мне тоже хотелось куда-нибудь сесть.',
    '— Я устал сильнее, чем думал.\n— Тогда устраивайся. Сегодня уже можно ничего не успевать.',
    'Сначала слышен только ветер. Потом она тихо спрашивает:\n— Ну как? Получается быть здесь?',
  ] },
  { prompt: 'Ты замечаешь, что больше никуда не торопишься.', choices: ['Поделиться этим', 'Пошутить', 'Спросить о её дне'], answers: [
    '— У меня наконец тихо в голове.\n— Не будем мешать. Посидим ещё.',
    '— Мы очень хорошо ничего не делаем.\n— У тебя талант. Продолжай.',
    '— А у тебя что сегодня было хорошего?\nОна задумывается. Ты ждёшь: тебе правда интересно.',
  ] },
  { prompt: 'Есть слова, которые обычно остаются при тебе.', choices: ['Сказать, что ждал встречи', 'Поблагодарить за вечер', 'Остаться рядом'], answers: [
    '— Я сегодня хотел поскорее тебя увидеть.\nОна смотрит внимательнее. Ты не отводишь взгляд.',
    '— Спасибо, что позвала. Мне этого не хватало.\n— Я тоже хотела поболтать с тобой.',
    'Ты устраиваешься поудобнее. Она продолжает свой рассказ. Сейчас тебе больше никуда не нужно.',
  ] },
];
const memories = [
  { text: 'Я замечаю мелочь и сразу хочу тебе показать.', choices: ['Радость', 'Близость', 'Привязанность'], reply: 'Да. И хочется, чтобы ты тоже улыбнулась. Одного слова всё равно мало.' },
  { text: 'Рядом с тобой я перестаю прокручивать заботы.', choices: ['Спокойствие', 'Доверие', 'Нежность'], reply: 'Я могу выдохнуть. А потом слушать тебя — уже не думая о завтрашних делах.' },
  { text: 'Мне важно, удобно ли тебе идти со мной.', choices: ['Забота', 'Внимание', 'Нежность'], reply: 'Хочется слышать, чего хочешь ты. И самому говорить, что важно мне.' },
  { text: 'Я прошу тебя побыть ещё, хотя боюсь сказать лишнее.', choices: ['Смелость', 'Привязанность', 'Что-то большее'], reply: 'Наверное, я уже знаю. Просто произнести это вслух труднее, чем выбрать слово.' },
];
export class MinigameDirector {
  readonly layer = new Container();
  private state?: Runtime;
  private art = new Graphics();
  private panel = new Graphics();
  private instruction: Text;
  private message: Text;
  private controls = new Container();
  private actions:Container[]=[];
  private panelKey='';
  private messageY=0;
  private rings = new Container();
  private forestBranches = new Container();
  private clockHands: Graphics[] = [];
  private constellation = 0;
  private starSoundAt = -1;
  private readonly starPoints = [[140,0],[65,90],[140,180],[230,0],[250,90],[315,135],[230,180]];
  private readonly starPaths = [
    [[140,0],[65,90],[140,180]],
    [[230,0],[280,0],[315,30],[315,55],[280,90],[250,90],[280,90],[315,120],[315,150],[280,180],[230,180]],
  ];
  private forestNodes: {node:Container;leaf:Container;thread:Graphics;index:number}[] = [];
  private forestRead?: {progress:number;deposit:number;index:number;paper:Graphics;book:Sprite;title:Text;text:string;chars:number};
  // Attachment and leaf centers in the authored 586 × 1266 forest painting.
  private readonly branches = [
    {x:104,y:96,px:107,py:151}, {x:259,y:234,px:258,py:284},
    {x:119,y:408,px:118,py:460}, {x:463,y:329,px:461,py:385},
    {x:548,y:473,px:550,py:524},
  ];
  private finish?: () => void;
  private H = 844;
  private fromX = 105;
  private toX = 105;
  constructor(private scenes: SceneManager, private cue: (id: string) => void) {
    this.instruction = label('', 32, 0, 11, false, palette.muted);
    this.message = label('', 32, 0, 18);
    this.message.style.lineHeight = 26;
    this.layer.addChild(this.panel, this.art, this.forestBranches, this.rings, this.instruction, this.message, this.controls);
    this.layer.eventMode = 'static';
    this.layer.visible = false;
  }
  private say(text: string) {
    this.message.text = text;
    document.getElementById('sr-story')!.textContent = text;
  }
  start(kind: GameKind, height: number, done: () => void) {
    this.stop(); this.H = height; this.finish = done;
    this.state = {kind, elapsed:0, progress:0, round:0, responding:0, awaiting:false, moving:false, turns:0, done:false, collected:[]};
    this.layer.visible = true;
    if(['clock','fragments','stars','archive','name'].includes(kind)) {
      this.scenes.hero.alpha=.25;this.scenes.girl.alpha=.25;this.scenes.npc.alpha=.25;
    }
    this.drawPanel();
    this.layer.hitArea = new Rectangle(0,70,390,height-70);
    this.instruction.y = height-35;
    this.message.y = height-290;
    if(kind==='clock')this.buildClock();
    this.renderRound();
  }
  private clearControls() {
    this.actions=[];
    this.forestNodes=[];
    for (const layer of [this.controls, this.forestBranches]) {
      layer.removeChildren().forEach(c=>c.destroy({children:true}));
    }
  }
  private drawPanel() {
    const firstAction=this.actions.length?Math.min(...this.actions.map(c=>c.y)):this.H-70;
    const fullText=this.forestRead?.text??this.message.text;
    const key=`${this.H}|${firstAction}|${this.message.style.fontSize}|${fullText}`;
    if(key===this.panelKey){this.message.y=this.messageY;return;}
    this.panelKey=key;
    const textHeight=fullText?CanvasTextMetrics.measureText(fullText,this.message.style).height:0;
    this.message.y=firstAction-textHeight-24;
    this.messageY=this.message.y;
    const top=this.message.y-34,height=this.H-top;
    this.panel.clear();
    for(let i=0;i<40;i++)this.panel.rect(0,top+i*height/40,390,height/40+1).fill({color:0x101723,alpha:.9*Math.min(1,i*height/40/52)});
  }
  private action(text: string, y: number, fn: ()=>void) {
    const control=button(text,32,y,326,()=>{
      const s=this.state;if(!s||s.moving||s.responding>0)return;
      if (s.kind === 'page') this.cue('paper');
      fn();
    });
    this.actions.push(control);this.controls.addChild(control);this.panelKey='';
  }
  private renderRound() {
    const s=this.state!; this.clearControls(); this.instruction.text='';
    this.message.y=this.H-300;
    if (bookGames[s.kind]) { this.renderBook(); return; }
    if(s.kind==='follow'){
      this.say(['Мне хочется узнать тебя.','Теперь она совсем близко.','Осталось начать разговор.'][s.round]);
      this.action(['Подойти','Ещё немного','Заговорить'][s.round],this.H-116,()=>this.step());
      this.instruction.text='Одно касание — один шаг';
    }else if(s.kind==='crowd'){
      this.say(['Она замедляет шаг. Ты замечаешь это.','Она показывает на проход сбоку.','Здесь свободнее. Можно идти рядом.'][s.round]);
      const options=[['Подождать её','Спросить, куда хочется'],['Пойти вместе','Предложить передохнуть'],['Подстроиться под её шаг','Спросить, так ли удобно']][s.round];
      options.forEach((v,i)=>this.action(v,this.H-171+i*55,()=>{
        const replies=[['Ты останавливаешься. Она догоняет и сама выбирает поворот.','— Там, где видно небо. Пойдём?\n— Пойдём.'],['Она идёт первой. Теперь ты успеваешь замечать то, на что она смотрит.','— Давай у окна.\nВы сворачиваете вместе.'],['Больше не нужно оглядываться. Вы идёте в одном темпе.','— Да. А тебе?\n— Мне тоже.']];
        this.scenes.hero.x=110+s.round*18;
        this.respond(replies[s.round][i]);
      }));
    }else if(s.kind==='clock'){
      this.say(['07 : 82','25 : 14','03 : 91'][s.turns]??'14 времени');
      this.message.y=this.H-240;this.message.style.fontSize=28;
      this.action('Повернуть стрелки',this.H-116,()=>this.turnClock());
      this.instruction.text='Кажется, у этих часов свои правила';
    }else if(s.kind==='night'){
      this.say(night[s.round].prompt);
      night[s.round].choices.forEach((v,i)=>this.action(v,this.H-205+i*53,()=>this.respond(night[s.round].answers[i])));
    }else{
      this.say(memories[s.round].text);
      this.instruction.text='Здесь нет неправильного чувства';
      memories[s.round].choices.forEach((v,i)=>this.action(v,this.H-205+i*53,()=>this.respond(v+'.\n\n'+memories[s.round].reply)));
    }
  }
  private respond(text:string){
    const s=this.state!;s.awaiting=true;s.responding=.35;
    if (s.kind !== 'fragments') this.clearControls();
    this.say(text);this.message.y=this.H-305;
    if(s.kind==='page')this.layoutPagePanel();
    this.instruction.text='Продолжи, когда прочитаешь';
    if(s.kind==='stars'&&s.collected.length===7){
      this.constellation=0;s.responding=this.scenes.motionReduced?.35:2.4;
      this.instruction.text='Семь звёзд. Теперь видно, что их связывает.';
    }
    this.action('Дальше',this.H-100,()=>{
      if(this.forestRead&&this.forestRead.chars<this.forestRead.text.length){
        this.forestRead.chars=this.forestRead.text.length;this.message.text=this.forestRead.text;return;
      }
      const finishRound = () => {
        s.awaiting=false;s.round++;s.progress=s.round/this.roundCount();
        if(s.round>=this.roundCount())this.complete();else this.renderRound();
      };
      if (this.forestRead && !this.scenes.motionReduced) {
        s.responding=1;
        this.cue('paper');
        gsap.to(this.forestRead,{deposit:1,duration:.62,ease:'sine.inOut',onComplete:finishRound});
      } else finishRound();
    });
  }
  private roundCount() {
    const kind=this.state!.kind;
    return kind==='musician'?1:bookGames[kind]?.items.length??(kind==='sort'?4:3);
  }
  private renderBook() {
    const s=this.state!,data=bookGames[s.kind]!;
    if(s.kind==='fragments'){this.renderForest();return;}
    this.say(data.prompt);
    if (s.kind==='page') {
      this.layoutPagePanel();
      this.action(data.items[s.round].title,this.H-116,()=>{
        const ink=label('Здесь моя история…',230,this.H*.43,16,true,0x293044,140);
        ink.anchor.set(.5);this.rings.addChild(ink);
        gsap.to(ink,{alpha:0,y:ink.y-20,duration:1.8,delay:.4,onComplete:()=>ink.destroy()});
        this.respond(data.items[s.round].text);
      });
      return;
    }
    if(s.kind==='musician') {
      data.items.forEach((item,i)=>this.action(item.title,this.H-205+i*53,()=>this.respond(item.text)));
      return;
    }
    this.message.y=this.H-255;
    this.instruction.text=`${s.collected.length} / ${data.items.length} · можно выбирать в любом порядке`;
    data.items.forEach((item,i)=>{
      const p=this.nodePosition(i,data.items.length),chosen=s.collected.includes(i);
      const c=new Container();c.position.set(p.x,p.y);c.eventMode='static';c.cursor='pointer';c.hitArea=s.kind==='stars'?new Rectangle(-30,-30,60,60):new Rectangle(-55,-32,110,88);
      const g=new Graphics();
      // Soft pools of night preserve contrast without turning artifacts into buttons.
      for(let n=10;n>0;n--)g.ellipse(0,12,34+n*3,31+n*2).fill({color:0x080f21,alpha:.055});
      if(s.kind==='stars') {
        for(let n=7;n>0;n--)g.circle(0,0,4+n*3).fill({color:0xbad7ff,alpha:chosen?.018:.028});
        const r=chosen?10:19;
        g.poly([0,-r,3,-4,r*.65,0,3,4,0,r,-3,4,-r*.65,0,-3,-4]).fill(chosen?0x9daebe:0xfff4d7);
        g.circle(0,0,2.5).fill(0xffffff);
        if(!chosen)g.moveTo(-23,-13).lineTo(-17,-13).moveTo(-20,-16).lineTo(-20,-10).stroke({color:0xdfebff,width:1,alpha:.7});
      } else {
        // A torn, folded leaf with handwriting; its light is the paper itself.
        g.poly([-17,-21,7,-25,19,-14,16,17,5,23,-3,20,-15,24,-19,11,-16,3]).fill({color:chosen?0xa9a797:0xeee1bd,alpha:chosen?.6:1}).stroke({color:0xfff4d8,width:1,alpha:.8});
        g.poly([7,-25,8,-13,19,-14]).fill(0xbfae89);
        for(let j=0;j<4;j++)g.moveTo(-11,-10+j*6).lineTo(8-(j%2)*5,-12+j*6).stroke({color:0x696253,width:1,alpha:.65});
        g.moveTo(-8,15).quadraticCurveTo(0,9,8,13).stroke({color:0x696253,width:1,alpha:.6});
      }
      c.addChild(g);
      const name=label(item.title,0,32,13,true,chosen?0xb1b7bc:0xfff2d9,108);name.anchor.set(.5,0);name.style.align='center';
      name.style.stroke={color:0x0c1426,width:3};
      name.style.dropShadow={color:0x030713,alpha:1,blur:5,distance:0,angle:0};
      if(s.kind!=='stars')c.addChild(name);else name.destroy();
      if (!chosen) c.on('pointertap', e => {
        e.stopPropagation();
        if (s.awaiting || s.responding > 0) return;
        s.collected.push(i);
        if (s.kind === 'stars') {
          this.starSoundAt = s.elapsed;
          this.cue('star-' + s.collected.length);
        } else {
          this.cue('paper');
        }
        this.respond(item.text);
      });
      this.controls.addChild(c);
    });
  }
  private nodePosition(i:number,count:number) {
    if(this.state?.kind==='stars')return this.starPosition(this.starPoints[i]);
    if(this.state?.kind==='fragments'){
      const b=this.branches[i];return this.layer.toLocal(this.scenes.backgroundPoint(b.px,b.py));
    }
    const columns=count>5?3:2,rows=Math.ceil(count/columns);
    const col=i%columns,row=Math.floor(i/columns);
    return{x:columns===3?75+col*120:105+col*175,y:115+row*Math.min(108,(this.H-450)/Math.max(1,rows-1))+(col%2?12:0)};
  }
  private starPosition(p:number[]){return{x:p[0],y:115+p[1]*Math.min(210,this.H-450)/180};}
  private layoutPagePanel(){
    this.drawPanel();
  }
  private drawConstellation(sec:number){
    const s=this.state!;
    if(s.collected.length===7){
      this.constellation=this.scenes.motionReduced?1:Math.min(1,this.constellation+sec/2.2);
    }
      // Fixed, separate strokes form the literal <3 regardless of selection order.
      for(const path of this.starPaths){
        const pixels:{x:number;y:number}[]=[];
        for(let j=1;j<path.length;j++){
          const a=this.starPosition(path[j-1]),b=this.starPosition(path[j]),steps=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/3);
          for(let k=0;k<steps;k++)pixels.push({x:Math.round((a.x+(b.x-a.x)*k/steps)/3)*3,y:Math.round((a.y+(b.y-a.y)*k/steps)/3)*3});
        }
          const end=Math.ceil(pixels.length*this.constellation);
          // A readable dormant constellation is present before any star is chosen.
          for(let j=0;j<pixels.length;j++){
            const p=pixels[j];
            this.art.rect(p.x-2,p.y-2,7,7).fill({color:0x080f24,alpha:.48});
            this.art.rect(p.x,p.y,3,3).fill({color:0xb0c9e9,alpha:.36});
          }
        for(let j=0;j<end;j++){
          const p=pixels[j],head=1-Math.min(1,(end-j)/14);
          this.art.rect(p.x-3,p.y-3,9,9).fill({color:0xaacfff,alpha:.09+head*.1});
          this.art.rect(p.x,p.y,3,3).fill({color:head>.2?0xfff8df:0xc6d9ef,alpha:.82});
        }
      }
      if(s.awaiting)for(const i of s.collected){
      const p=this.nodePosition(i,7),glow=s.collected.length===7?1:.6;
      const age = s.elapsed - this.starSoundAt;
      if (i === s.collected[s.collected.length-1] && age < .8 && !this.scenes.motionReduced) {
        const radius = 9 + 18 * age;
        for (let ray = 0; ray < 8; ray++) {
          const angle = ray * Math.PI / 4;
          const x = Math.round(p.x + radius * Math.cos(angle));
          const y = Math.round(p.y + radius * Math.sin(angle));
          this.art.rect(x, y, 2, 2).fill({color:0xffefce, alpha:.7*(1-age/.8)});
        }
      }
      this.art.rect(p.x-6,p.y-6,12,12).fill({color:0xb7d6ff,alpha:.12*glow});
      this.art.rect(p.x-1.5,p.y-9,3,18).rect(p.x-6,p.y-1.5,12,3).fill({color:0xfff0c9,alpha:glow});
    }
  }
  private renderForest(){
    const s=this.state!,data=bookGames.fragments!;
    if(this.forestRead)gsap.killTweensOf(this.forestRead);
    this.forestRead=undefined;
    for(const c of this.rings.removeChildren())c.destroy({children:true});
    this.drawPanel();
    this.say('На ветвях шелестят страницы.\nКоснись той, что хочется прочитать.');
    this.message.y=this.H-180;
    this.instruction.text=`${s.collected.length} / ${data.items.length} · страницы можно читать в любом порядке`;
    data.items.forEach((item,index)=>{
      const chosen=s.collected.includes(index),node=new Container(),leaf=new Container(),thread=new Graphics();
      const paper=new Graphics();
      paper.poly([-17,-22,8,-25,19,-13,17,18,8,23,0,21,-15,25,-19,12]).fill(chosen?0xa8a48e:0xe8ddba).stroke({color:0xffefd0,width:.7,alpha:.7});
      paper.poly([8,-25,8,-13,19,-13]).fill(0xb6a47b);
      for(let j=0;j<4;j++)paper.moveTo(-11,-9+j*6).lineTo(8-j%2*5,-10+j*6).stroke({color:0x72684f,width:.8,alpha:.55});
      leaf.addChild(paper);leaf.visible=!chosen;node.addChild(thread,leaf);
      node.eventMode=chosen?'none':'static';node.cursor='pointer';
      node.hitArea=new Rectangle(-30,-30,60,60);
      node.on('pointertap',e=>{e.stopPropagation();if(s.awaiting||s.responding>0)return;s.collected.push(index);this.cue('paper');this.openForestPage(index,item.title,item.text);});
      this.forestBranches.addChild(node);this.forestNodes.push({node,leaf,thread,index});
    });
    this.positionForest();
  }
  private positionForest(){
    for(const f of this.forestNodes){
      const b=this.branches[f.index],p=this.nodePosition(f.index,5),a=this.layer.toLocal(this.scenes.backgroundPoint(b.x,b.y));
      f.node.position.copyFrom(p);
      const sway=this.scenes.motionReduced?0:Math.sin((this.state?.elapsed??0)*.85+f.index*1.7)*.035;
      f.leaf.rotation=sway;
      const read=this.forestRead;
      const pulled=read?.index===f.index;
      const loose=this.state!.collected.includes(f.index);
      const motion=pulled&&!this.scenes.motionReduced?Math.sin(read.progress*14)*Math.exp(-read.progress*3)*7:0;
      const tip=pulled && read.progress<.18 ? -23+read.progress*30 : loose ? -28 : -23;
      f.thread.clear().moveTo(a.x-p.x,a.y-p.y).quadraticCurveTo((a.x-p.x)*.5+2+motion*.4,-32,motion,tip).stroke({color:0xdfd4b0,width:1,alpha:.75});
    }
  }
  private openForestPage(index:number,title:string,text:string){
    const selected=this.forestNodes.find(f=>f.index===index)!;
    const paper=selected.leaf.getChildAt<Graphics>(0);
    this.rings.addChild(paper);
    // The same Graphics travels from its thread, through reading, into the book.
    for(const f of this.forestNodes) {
      f.node.eventMode='none';
      f.leaf.alpha=.42;
    }
    const book=new Sprite(this.scenes.assets.get('gesture-pocket-book'));
    book.anchor.set(.5);book.width=96;book.scale.y=book.scale.x;
    const heading=label(title,195,0,25,true,0x494436,240);
    heading.anchor.set(.5);
    this.rings.addChildAt(book,0);
    this.rings.addChild(heading);
    const read={progress:this.scenes.motionReduced?1:0,deposit:0,index,paper,book,title:heading,text,chars:0};
    this.forestRead=read;
    this.respond('');
    this.state!.responding=this.scenes.motionReduced?.35:1;
    document.getElementById('sr-story')!.textContent=text;
    this.instruction.text='Лист разворачивается. Текст появляется под ним.';
    if(!this.scenes.motionReduced)gsap.to(read,{progress:1,duration:.9,ease:'sine.inOut'});
  }
  private updateForest(sec:number){
    this.positionForest();
    const r=this.forestRead;if(!r)return;
    const from=this.nodePosition(r.index,5);
    const p=Math.min(1,Math.max(0,(r.progress-.18)/.82)), d=r.deposit;
    const centerY=Math.min(220,this.H*.29);
    const pull=Math.min(1,r.progress/.18)*5*(1-p);
    const bookY=Math.min(this.H*.52,this.message.y-45);
    r.book.position.set(243,bookY);
    r.book.alpha=p;
    const x=from.x+(195-from.x)*p+48*d;
    const y=from.y+(centerY-from.y)*p+pull+(bookY-centerY)*d-24*Math.sin(Math.PI*d);
    const w=36+222*p,h=48+72*p;
    r.paper.position.set(x,y);r.paper.rotation=(1-p)*-.05+.13*d;
    r.paper.scale.set(1-.95*d,1-.98*d);
    r.paper.alpha=Math.min(1,(1-d)*6);
    const fold=11-7*p;
    r.paper.clear().poly([-w/2,-h/2,w/2-fold,-h/2-2,w/2,-h/2+fold,w/2-3,h/2-5,w*.2,h/2,-w*.1,h/2-3,-w/2+2,h/2]).fill(0xe8ddbd).stroke({color:0xf7eace,width:1,alpha:.8});
    r.paper.poly([w/2-fold,-h/2-2,w/2-fold,-h/2+fold,w/2,-h/2+fold]).fill({color:0xb6a47b,alpha:1-.5*p});
    if(p<1){
      for(let j=0;j<4;j++)r.paper.moveTo(-11,-9+j*6).lineTo(8-j%2*5,-10+j*6).stroke({color:0x72684f,width:.8,alpha:.55*(1-p)});
    }
    r.paper.moveTo(-w*.22,-h/2+4).lineTo(-w*.22,h/2-4).moveTo(w*.23,-h/2+4).lineTo(w*.23,h/2-4).stroke({color:0xa89672,width:1,alpha:.25});
    r.title.position.set(x,y);r.title.alpha=Math.max(0,(p-.65)/.35)*(1-d);
    if(p>=1){
      r.chars=Math.min(r.text.length,r.chars+sec*34);
      this.message.text=r.text.slice(0,Math.floor(r.chars));
      if(r.chars>=r.text.length)this.instruction.text='Можно идти дальше — или ещё немного побыть здесь';
    }
  }
  private step(){
    const s=this.state!;s.moving=true;s.progress=0;this.clearControls();
    this.fromX=this.scenes.hero.x;this.toX=125+s.round*32;
    this.instruction.text='';
  }
  private buildClock(){
    this.rings.position.set(195,this.clockY());
    this.rings.eventMode='static';this.rings.hitArea=new Rectangle(-120,-120,240,240);
    this.rings.on('pointertap',()=>this.turnClock());
    const face=new Graphics();
    for(let n=12;n>0;n--)face.circle(0,0,108+n*3).fill({color:0x060d1b,alpha:.055});
    face.circle(0,0,106).fill({color:0x111f32,alpha:.97}).stroke({color:0xcbb68a,width:2});
    face.circle(0,0,101).stroke({color:0x7e8eaa,width:1,alpha:.6});
    face.circle(0,0,78).stroke({color:0xcbb68a,width:1,alpha:.35});
    for(let i=0;i<60;i++){
      const a=i*Math.PI/30,r=i%5===0?87:93;
      face.moveTo(Math.sin(a)*r,-Math.cos(a)*r).lineTo(Math.sin(a)*97,-Math.cos(a)*97).stroke({color:0xe9d8b1,width:i%5===0?2:1,alpha:i%5===0?.95:.45});
    }
    for(let i=0;i<4;i++){
      const a=i*Math.PI/2,x=Math.sin(a)*113,y=-Math.cos(a)*113;
      face.poly([x,y-4,x+3,y,x,y+4,x-3,y]).fill(0xdac59c);
      const numeral=label(['XII','III','VI','IX'][i],Math.sin(a)*67,-Math.cos(a)*67,16,true,0xefdfb9,40);numeral.anchor.set(.5);
      this.rings.addChild(numeral);
    }
    this.rings.addChildAt(face,0);
    for(let j=0;j<3;j++){
      const g=new Graphics(),r=74-j*17;
      g.poly([0,12,-3,0,-2,-r+9,0,-r,2,-r+9,3,0]).fill(j===2?0x91b1cc:0xffe9bc);
      g.rotation=[-.85,.8,2.6][j];this.rings.addChild(g);this.clockHands.push(g);
    }
    this.rings.addChild(new Graphics().circle(0,0,5).fill(0xedd9aa).circle(0,0,2).fill(0x21304a));
  }
  private clockY(){return (this.H-330)/2+35;}
  private turnClock(){
    const s=this.state;if(!s||s.kind!=='clock'||s.responding>0||s.done)return;
    this.cue('escapement');
    s.turns++;s.responding=.55;
    for(const[i,c]of this.clockHands.entries())gsap.to(c,{rotation:c.rotation+(i%2?-.9:.8),duration:.5,ease:'sine.inOut'});
    if(s.turns>=3){s.done=true;s.responding=1.5;this.clearControls();this.say('14 времени');this.instruction.text='Ну вот. Теперь понятно.';this.cue('chime');}
    else this.renderRound();
  }
  update(dt:number){
    const s=this.state;if(!s)return;
    const sec=Math.min(dt,150)/1000;s.elapsed+=sec;
    if(s.kind==='fragments')this.updateForest(sec);
    this.drawPanel();
    s.responding=Math.max(0,s.responding-sec);
    if(s.done){if(s.responding===0)this.complete();return;}
    this.art.clear();
    const count=this.roundCount();
    if(s.kind==='stars')this.drawConstellation(sec);
    for(let i=0;i<count;i++)this.art.circle(195+(i-(count-1)/2)*14,this.H-58,2).fill({color:palette.gold,alpha:i<=s.round?.9:.25});
    if(s.moving){
      s.progress=Math.min(1,s.progress+sec/.8);
      const eased=s.progress*s.progress*(3-2*s.progress);
      this.scenes.hero.x=this.fromX+(this.toX-this.fromX)*eased;
      if(s.progress>=1){s.moving=false;s.round++;if(s.round===3)this.complete();else this.renderRound();}
    }
  }
  complete(){if(!this.state)return;const done=this.finish;this.stop();done?.();}
  stop(){
    this.panelKey='';
    this.constellation=0;
    if(this.forestRead)gsap.killTweensOf(this.forestRead);this.forestRead=undefined;
    this.scenes.hero.alpha=1;this.scenes.girl.alpha=1;this.scenes.npc.alpha=1;
    this.state=undefined;this.finish=undefined;this.layer.visible=false;this.art.clear();this.clearControls();
    this.rings.removeAllListeners();
    for(const c of this.rings.removeChildren()){gsap.killTweensOf(c);c.destroy();}
    this.clockHands=[];this.rings.position.set(0,0);
    this.message.text='';this.message.style.fontSize=18;this.instruction.text='';
  }
  snapshot(){return this.state?{...this.state,
    constellation:this.constellation,
    targets:bookGames[this.state.kind]?.items.map((_,i)=>this.nodePosition(i,bookGames[this.state!.kind]!.items.length))
  }:null;}
  resize(height:number){
    const delta=height-this.H;this.H=height;if(!this.state)return;
    this.drawPanel();
    this.layer.hitArea=new Rectangle(0,70,390,height-70);
    this.instruction.y+=delta;this.message.y+=delta;
    if(bookGames[this.state.kind]&&!this.state.awaiting)this.renderRound();
    else for(const c of this.controls.children)c.y+=delta;
    if(this.state.kind==='clock')this.rings.y=this.clockY();
    if(this.state.kind==='page')this.layoutPagePanel();
  }
}
