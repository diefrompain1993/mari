import {test,expect,type Page} from '@playwright/test';
const state=(p:Page)=>p.evaluate(()=>window.__VN_DEBUG__!.dumpState());
const frame=(p:Page)=>p.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));
async function jump(p:Page,id:string){await p.evaluate(id=>window.__VN_DEBUG__!.goToScene(id),id);await frame(p);}
async function tap(p:Page,x:number,y:number){await p.touchscreen.tap(x,y);await frame(p);}
async function ready(p:Page){await p.goto('/');await p.waitForFunction(()=>window.__VN_DEBUG__);await expect(p.locator('#boot')).toBeHidden();await frame(p);}
test('complete every book interaction through ordinary touches',async({page},info)=>{
 test.setTimeout(240000); // Nine scenes include separate asset/audio loads; each interaction remains capped below.
 await ready(page);const h=page.viewportSize()!.height;const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const id of ['write_page','collect_fragments','follow_start','fourteen_time','night_conversation','join_stars','ask_musician','reread_book','name_fragments']){
  await jump(page,id);const started=Date.now();let shots=0;
  while((await state(page)).minigame){
   expect(Date.now()-started).toBeLessThan(45000);
   const m=(await state(page)).minigame as {kind:string;moving:boolean;responding:number;done:boolean;awaiting:boolean;collected:number[];targets?:{x:number;y:number}[]};
   if (!m) break;
   if(m.moving||m.responding>0||m.done){await page.waitForTimeout(120);continue;}
   if(m.awaiting){if(!shots++){await page.screenshot({path:`art/qa/book-${info.project.name}-${id}.png`});}await tap(page,195,h-76);}
   else if(['fragments','stars','archive','name'].includes(m.kind)){
    const i=m.targets!.findIndex((_,i)=>!m.collected.includes(i)),p=m.targets![i];await tap(page,p.x,p.y);
   }else await tap(page,195,h-(['night','musician'].includes(m.kind)?181:92));
  }
  if(id==='follow_start')expect(Date.now()-started).toBeLessThan(12000);
 }
 expect(errors).toEqual([]);
});
test('new checkpoints, readable text, resizing and open ending',async({page},info)=>{
 await ready(page);await jump(page,'keeper_answer');await page.reload();await page.waitForFunction(()=>window.__VN_DEBUG__);await frame(page);await tap(page,195,page.viewportSize()!.height*.7+24);
 await expect.poll(async()=>(await state(page)).beat).toBe('keeper_answer');
 for(const h of [664,844]){await page.setViewportSize({width:390,height:h});
  for(const id of ['self_portrait','new_detail','night_honest_end','constellation_person','keeper_choice','confession_calm']){
   await jump(page,id);await tap(page,195,h-95);const d=(await state(page)).dialogue as {textBottom:number;hintTop:number};expect(d.textBottom).toBeLessThan(d.hintTop);expect(d.hintTop).toBeLessThan(h-15);
  }
  await page.screenshot({path:`art/qa/book-${info.project.name}-text-${h}.png`});
 }
 await jump(page,'final_question');await tap(page,195,740);expect((await state(page)).beat).toBe('final_question');
});
test('book world assets and reveal scenes load in mobile engines',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});await ready(page);
 for(const id of ['blank_page','self_portrait','forest_start','new_detail','good_here','hill_start','city_arrival','archive_start','name_reveal','human_reveal','confession_choice']){
  await jump(page,id);await page.waitForTimeout(2800);await page.screenshot({path:`art/qa/book-${info.project.name}-${id}.png`});
 }
 expect(errors).toEqual([]);
});
test('settings persist, score is long, and targets remain legible',async({page},info)=>{
 await ready(page);await jump(page,'collect_fragments');
 await page.screenshot({path:`art/qa/polish-${info.project.name}-fragments.png`});
 await jump(page,'join_stars');
 await page.screenshot({path:`art/qa/polish-${info.project.name}-stars.png`});
 await page.locator('#settings-button').click();
 await expect(page.locator('#settings')).toBeVisible();
 await page.locator('#music').fill('0.35');
 await expect(page.locator('#music-value')).toHaveText('35%');
 await page.locator('#reduced-motion').check();
 await page.screenshot({path:`art/qa/polish-${info.project.name}-settings.png`});
 await page.getByRole('button',{name:'Продолжить историю'}).click();
 await expect(page.locator('#settings')).toBeHidden();
 await page.locator('#settings-button').click();
 await expect(page.locator('#music')).toHaveValue('0.35');
 await expect(page.locator('#reduced-motion')).toBeChecked();
 await page.getByRole('button',{name:'Продолжить историю'}).click();
 await expect.poll(async()=>Number(((await state(page)).audio as {duration:number}).duration),{timeout:20000}).toBeGreaterThan(190);
});
test('clock stays readable and responds directly after resizing',async({page},info)=>{
 await ready(page);await jump(page,'fourteen_time');
 for(const h of [664,844]){
  await page.setViewportSize({width:390,height:h});await frame(page);
  await page.screenshot({path:`art/qa/atmosphere-${info.project.name}-clock-${h}.png`});
 }
 for(let i=1;i<=3;i++){
  await tap(page,195,(844-330)/2+35);await page.waitForTimeout(600);
  if(i<3)expect(((await state(page)).minigame as {turns:number}).turns).toBe(i);
 }
 await expect.poll(async()=>(await state(page)).minigame).toBeNull();
});
test('forest leaves stay on branches and unfold before reading',async({page},info)=>{
 await ready(page);
 for(const h of [664,844]){
  await page.setViewportSize({width:390,height:h});await jump(page,'collect_fragments');
  await page.waitForTimeout(250);
  const m=(await state(page)).minigame as {targets:{x:number;y:number}[]};
  for(const p of m.targets){expect(p.x).toBeGreaterThan(25);expect(p.x).toBeLessThan(385);expect(p.y).toBeGreaterThan(60);expect(p.y).toBeLessThan(h-220);}
  await page.screenshot({path:`art/qa/forest-${info.project.name}-branches-${h}.png`});
  await tap(page,m.targets[2].x,m.targets[2].y);
  await page.waitForTimeout(1300);
  expect(((await state(page)).minigame as {awaiting:boolean}).awaiting).toBe(true);
  await page.screenshot({path:`art/qa/forest-${info.project.name}-unfold-${h}.png`});
  await tap(page,195,h-76); // Reveal the remaining text first.
  await page.screenshot({path:`art/qa/forest-${info.project.name}-read-${h}.png`});
  await tap(page,195,h-76);
  expect(((await state(page)).minigame as {collected:number[]}).collected).toContain(2);
 }
});
test('seven stars reveal a fixed pixel <3 after the last selection',async({page},info)=>{
 await ready(page);await jump(page,'join_stars');const h=page.viewportSize()!.height;
 await page.screenshot({path:`art/qa/heart-before-${info.project.name}.png`});
 for(const i of [6,0,4,2,5,1,3]){
  const m=(await state(page)).minigame as {targets:{x:number;y:number}[]};
  await tap(page,m.targets[i].x,m.targets[i].y);
  if(i!==3){await page.waitForTimeout(400);await tap(page,195,h-76);}
 }
 await expect.poll(async()=>((await state(page)).minigame as {constellation:number}).constellation).toBe(1);
 await page.screenshot({path:`art/qa/heart-${info.project.name}.png`});
 expect(((await state(page)).minigame as {collected:number[]}).collected).toHaveLength(7);
 await page.waitForTimeout(300);await tap(page,195,h-76);
 await expect.poll(async()=>(await state(page)).minigame).toBeNull();
});
