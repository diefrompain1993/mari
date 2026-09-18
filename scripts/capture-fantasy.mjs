import {webkit,chromium,devices} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
await mkdir('art/qa/fantasy',{recursive:true});const errors=[],frames=[];
for(const[name,engine]of[['webkit',webkit],['chromium',chromium]]){
 const browser=await engine.launch();const page=await browser.newPage({...devices[name==='webkit'?'iPhone 13':'Pixel 7'],viewport:{width:390,height:844},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await page.goto('http://127.0.0.1:5173/');await page.locator('#boot').waitFor({state:'hidden'});await page.touchscreen.tap(195,590);
 for(const id of ['first_light','light_end','noise_cafe','final_question']){
  await page.evaluate(id=>window.__VN_DEBUG__.goToScene(id),id);await page.waitForTimeout(2800);
  const path=`art/qa/fantasy/${name}-${id}.png`;await page.screenshot({path});frames.push(path);
 }
 await browser.close();
}
const tiles=await Promise.all(frames.map(async(path,i)=>({input:await sharp(path).resize(195,422).png().toBuffer(),left:i%4*195,top:Math.floor(i/4)*422})));
await sharp({create:{width:780,height:844,channels:3,background:'#111827'}}).composite(tiles).png().toFile('art/fantasy/game-preview.png');
await writeFile('art/qa/fantasy/report.json',JSON.stringify({frames,errors},null,2));console.log(JSON.stringify({frames:frames.length,errors}));if(errors.length)process.exitCode=1;
