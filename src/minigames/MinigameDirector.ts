import { Container, Graphics, Rectangle, Text } from 'pixi.js';
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
  private rings = new Container();
  private finish?: () => void;
  private H = 844;
  private fromX = 105;
  private toX = 105;
  constructor(private scenes: SceneManager, private chime: () => void) {
    this.instruction = label('', 32, 0, 11, false, palette.muted);
    this.message = label('', 32, 0, 18);
    this.message.style.lineHeight = 26;
    this.layer.addChild(this.panel, this.art, this.rings, this.instruction, this.message, this.controls);
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
    this.drawPanel();
    this.layer.hitArea = new Rectangle(0,70,390,height-70);
    this.instruction.y = height-35;
    this.message.y = height-290;
    if(kind==='clock')this.buildClock();
    this.renderRound();
  }
  private clearControls() { this.controls.removeChildren().forEach(c=>c.destroy({children:true})); }
  private drawPanel() {
    this.panel.clear().rect(0,this.H-330,390,330).fill({color:0x101723,alpha:.94});
    this.panel.moveTo(32,this.H-328).lineTo(358,this.H-328).stroke({color:palette.gold,width:1,alpha:.2});
  }
  private action(text: string, y: number, fn: ()=>void) {
    this.controls.addChild(button(text,32,y,326,()=>{
      const s=this.state;if(!s||s.moving||s.responding>0)return;
      this.chime();fn();
    }));
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
    this.clearControls();this.say(text);this.message.y=this.H-305;
    this.instruction.text='Продолжи, когда прочитаешь';
    this.action('Дальше',this.H-100,()=>{
      s.awaiting=false;s.round++;s.progress=s.round/this.roundCount();
      if(s.round>=this.roundCount())this.complete();else this.renderRound();
    });
  }
  private roundCount() {
    const kind=this.state!.kind;
    return kind==='musician'?1:bookGames[kind]?.items.length??(kind==='sort'?4:3);
  }
  private renderBook() {
    const s=this.state!,data=bookGames[s.kind]!;
    this.say(data.prompt);
    if (s.kind==='page') {
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
      const c=new Container();c.position.set(p.x,p.y);c.eventMode='static';c.cursor='pointer';c.hitArea=new Rectangle(-30,-30,60,60);
      const g=new Graphics();
      g.circle(0,2,29).fill({color:0x060c18,alpha:.65});
      g.circle(0,0,25).fill({color:chosen?0x263b42:0x101c30,alpha:.97});
      if(s.kind==='stars')g.poly([0,-9,3,-3,9,0,3,3,0,9,-3,3,-9,0,-3,-3]).fill({color:palette.paper,alpha:chosen?.35:1});
      else g.poly([-10,-15,9,-12,12,13,-8,16]).fill({color:palette.paper,alpha:chosen?.3:.9});
      g.circle(0,0,25).stroke({color:chosen?0x99c5bb:palette.paper,width:2,alpha:1});
      if(chosen)g.moveTo(-7,0).lineTo(-1,6).lineTo(10,-7).stroke({color:0xd7fff0,width:3});
      c.addChild(g);
      const name=label(item.title,0,33,11,false,palette.paper,106);name.anchor.set(.5,0);name.style.align='center';
      const plate=new Graphics().roundRect(-56,29,112,name.height+9,6).fill({color:0x101c30,alpha:.96});
      c.addChild(plate,name);
      if(!chosen)c.on('pointertap',e=>{e.stopPropagation();if(s.awaiting||s.responding>0)return;s.collected.push(i);this.chime();this.respond(item.text);});
      this.controls.addChild(c);
    });
  }
  private nodePosition(i:number,count:number) {
    const columns=count>5?3:2,rows=Math.ceil(count/columns);
    const col=i%columns,row=Math.floor(i/columns);
    return{x:columns===3?75+col*120:110+col*170,y:125+row*Math.min(100,(this.H-450)/Math.max(1,rows-1))};
  }
  private step(){
    const s=this.state!;s.moving=true;s.progress=0;this.clearControls();
    this.fromX=this.scenes.hero.x;this.toX=125+s.round*32;
    this.instruction.text='';
  }
  private buildClock(){
    this.rings.eventMode='static';this.rings.hitArea=new Rectangle(70,this.H*.42-125,250,250);
    this.rings.on('pointertap',()=>this.turnClock());
    for(let j=0;j<3;j++){
      const g=new Graphics(),r=96-j*25;
      g.circle(0,0,r).stroke({color:palette.gold,width:1,alpha:.65});
      for(let i=0;i<12;i++){
        const a=i*Math.PI/6;
        g.moveTo(Math.cos(a)*(r-7),Math.sin(a)*(r-7)).lineTo(Math.cos(a)*r,Math.sin(a)*r).stroke({color:palette.paper,width:1,alpha:.7});
      }
      g.moveTo(0,0).lineTo(0,-r+12).stroke({color:palette.paper,width:2});
      g.position.set(195,this.H*.42);this.rings.addChild(g);
    }
  }
  private turnClock(){
    const s=this.state;if(!s||s.kind!=='clock'||s.responding>0||s.done)return;
    s.turns++;s.responding=.55;
    for(const[i,c]of this.rings.children.entries())gsap.to(c,{rotation:c.rotation+(i%2?-.9:.8),duration:.5,ease:'sine.inOut'});
    if(s.turns>=3){s.done=true;s.responding=1.5;this.clearControls();this.say('14 времени');this.instruction.text='Ну вот. Теперь понятно.';this.chime();}
    else this.renderRound();
  }
  update(dt:number){
    const s=this.state;if(!s)return;
    const sec=Math.min(dt,150)/1000;s.elapsed+=sec;
    s.responding=Math.max(0,s.responding-sec);
    if(s.done){if(s.responding===0)this.complete();return;}
    this.art.clear();
    const count=this.roundCount();
    if(s.kind==='stars'&&s.collected.length>1){
      s.collected.forEach((i,j)=>{const p=this.nodePosition(i,count);if(j===0)this.art.moveTo(p.x,p.y);else this.art.lineTo(p.x,p.y);});
      this.art.stroke({color:palette.gold,width:1,alpha:.55});
    }
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
    this.state=undefined;this.finish=undefined;this.layer.visible=false;this.art.clear();this.clearControls();
    this.rings.removeAllListeners();
    for(const c of this.rings.removeChildren()){gsap.killTweensOf(c);c.destroy();}
    this.message.text='';this.message.style.fontSize=18;this.instruction.text='';
  }
  snapshot(){return this.state?{...this.state,
    targets:bookGames[this.state.kind]?.items.map((_,i)=>this.nodePosition(i,bookGames[this.state!.kind]!.items.length))
  }:null;}
  resize(height:number){
    const delta=height-this.H;this.H=height;if(!this.state)return;
    this.drawPanel();
    this.layer.hitArea=new Rectangle(0,70,390,height-70);
    this.instruction.y+=delta;this.message.y+=delta;
    if(bookGames[this.state.kind]&&!this.state.awaiting)this.renderRound();
    else for(const c of this.controls.children)c.y+=delta;
    for(const c of this.rings.children)c.y+=delta*.42;
    this.rings.hitArea=new Rectangle(70,height*.42-125,250,250);
  }
}
