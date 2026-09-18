import {webkit,devices} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('art/qa/full',{recursive:true});
const browser=await webkit.launch();
const context=await browser.newContext({...devices['iPhone 13'],viewport:{width:390,height:844},deviceScaleFactor:1,recordVideo:{dir:'art/qa/full/video',size:{width:390,height:844}}});
const page=await context.newPage();
const errors=[],log=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
await page.goto('http://127.0.0.1:5173/');await page.locator('#boot').waitFor({state:'hidden'});await page.touchscreen.tap(195,590);
const start=Date.now();let previous='',dialogueBeat='',held=false,lastShot='',lastLog=0;
while(Date.now()-start<25*60*1000){
 const state=await page.evaluate(()=>window.__VN_DEBUG__.dumpState());
 if(Date.now()-lastLog>30000){lastLog=Date.now();console.log(JSON.stringify({beat:state.beat,minigame:state.minigame,seconds:Math.round((Date.now()-start)/1000)}));await writeFile('art/qa/full/live.json',JSON.stringify(state,null,2));}
 if(state.scene!==previous){previous=state.scene;const entry={scene:previous,seconds:Math.round((Date.now()-start)/1000),fps:state.fps};log.push(entry);console.log(JSON.stringify(entry));}
 if(state.beat==='final_question') {await page.waitForTimeout(4000);await page.screenshot({path:'art/qa/full/final-question.png'});break;}
 if(state.busy||state.remainingPause>0){await page.waitForTimeout(500);continue;}
 const m=state.minigame;
 if(m){
   if(m.kind==='follow'||m.kind==='crowd'){
     const x=m.kind==='crowd'?195+Math.sin(m.elapsed*.17)*85+Math.sin(m.elapsed*.07)*24:195;
     await page.mouse.move(x,600);
     if(!held){await page.mouse.down();held=true;}
     await page.waitForTimeout(500);
   }else if(m.kind==='clock') {await page.touchscreen.tap(195,375);await page.waitForTimeout(1100);}
   else if(m.responding>0)await page.waitForTimeout(600);
   else {await page.touchscreen.tap(195,m.kind==='night'?685:650);await page.waitForTimeout(1000);}
 }else{
   if(held){await page.mouse.up();held=false;}
   if(dialogueBeat!==state.beat){dialogueBeat=state.beat;await page.waitForTimeout(4200);}
   if(lastShot!==state.scene){lastShot=state.scene;await page.screenshot({path:'art/qa/full/'+state.scene+'.png'});}
   await page.touchscreen.tap(195,735);await page.waitForTimeout(350);
 }
}
const final=await page.evaluate(()=>window.__VN_DEBUG__.dumpState());
const report={seconds:(Date.now()-start)/1000,final,errors,log};
await writeFile('art/qa/full/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({finished:final.beat,seconds:report.seconds,errors}));
await context.close();await browser.close();if(final.beat!=='final_question'||errors.length)process.exitCode=1;
