import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('art/qa/book-run',{recursive:true});const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});const errors=[],scenes=[],beats=new Set();
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
await page.goto('http://127.0.0.1:5188');await page.waitForFunction(()=>window.__VN_DEBUG__);await page.locator('#boot').waitFor({state:'hidden'});await page.waitForTimeout(500);await page.touchscreen.tap(195,615);
await page.waitForFunction(()=>window.__VN_DEBUG__.dumpState().remainingPause>0);
const started=Date.now();let prev='',nextLog=0;
while(Date.now()-started<12*60*1000){
 const s=await page.evaluate(()=>window.__VN_DEBUG__.dumpState());beats.add(s.beat);
 if(s.scene!==prev){prev=s.scene;scenes.push(prev);console.log(prev);}
 if(Date.now()>nextLog){console.log(JSON.stringify({beat:s.beat,seconds:Math.round((Date.now()-started)/1000)}));nextLog=Date.now()+45000;}
 if(s.beat==='final_question')break;
 if(s.busy||s.remainingPause>0){await page.waitForTimeout(180);continue;}
 const m=s.minigame;
 if(m){
  if(m.moving||m.responding>0||m.done){await page.waitForTimeout(120);continue;}
  if(m.awaiting)await page.touchscreen.tap(195,768);
  else if(['fragments','stars','archive','name'].includes(m.kind)){const i=m.targets.findIndex((_,i)=>!m.collected.includes(i));const p=m.targets[i];await page.touchscreen.tap(p.x,p.y);}
  else await page.touchscreen.tap(195,['night','musician'].includes(m.kind)?663:752);
 }else await page.touchscreen.tap(195,744);
 await page.waitForTimeout(200);
}
const final=await page.evaluate(()=>window.__VN_DEBUG__.dumpState());await page.waitForTimeout(2300);await page.screenshot({path:'art/qa/book-run/final.png'});
const report={mode:'accelerated text via ordinary taps, real interactions and unmodified pauses',seconds:(Date.now()-started)/1000,scenes,beats:beats.size,final,errors};
await writeFile('art/qa/book-run/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({finished:final.beat,beats:beats.size,errors}));await browser.close();if(final.beat!=='final_question'||errors.length)process.exitCode=1;
