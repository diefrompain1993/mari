import {webkit,chromium,devices} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
await mkdir('art/qa/controls',{recursive:true});const rows=[],errors=[];
for(const [name,engine]of[['webkit',webkit],['chromium',chromium]]){
 const browser=await engine.launch();const page=await browser.newPage({...devices[name==='webkit'?'iPhone 13':'Pixel 7'],viewport:{width:390,height:844},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5173/');await page.locator('#boot').waitFor({state:'hidden'});await page.touchscreen.tap(195,590);
 for(const [id,height]of[['night_conversation',844],['sort_memories',664],['night_sound',844],['night_silence',844]]){
   await page.setViewportSize({width:390,height});await page.evaluate(id=>window.__VN_DEBUG__.goToScene(id),id);await page.waitForTimeout(3000);
   const path=`art/qa/controls/${name}-${id}.png`;await page.screenshot({path});
   rows.push({name,id,height,path,state:await page.evaluate(()=>window.__VN_DEBUG__.dumpState())});
 }
 await browser.close();
}
const cells=await Promise.all(rows.map(async r=>({input:await sharp(r.path).resize({width:195}).extend({top:0,left:0,right:0,bottom:422-Math.round(r.height/2),background:'#111516'}).png().toBuffer()})));
await sharp({create:{width:780,height:844,channels:3,background:'#111516'}}).composite(cells.map((c,i)=>({...c,left:i%4*195,top:Math.floor(i/4)*422}))).png().toFile('art/qa/controls/review.png');
await writeFile('art/qa/controls/report.json',JSON.stringify({rows,errors},null,2));console.log(JSON.stringify({frames:rows.length,errors}));if(errors.length)process.exitCode=1;
