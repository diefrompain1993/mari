import {webkit,chromium,devices} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const url='https://diefrompain1993.github.io/mari/';
const manifest=JSON.parse(await readFile('src/content/asset-manifest.json','utf8'));
await mkdir('art/qa/live',{recursive:true});const report=[];
for(const[name,engine,device]of[['webkit',webkit,'iPhone 13'],['chromium',chromium,'Pixel 7']]){
 const browser=await engine.launch();const page=await browser.newPage({...devices[device],viewport:{width:390,height:844},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 const response=await page.goto(url);if(response.status()!==200)throw Error('Site HTTP '+response.status());
 await page.locator('#boot').waitFor({state:'hidden',timeout:60000});
 if(await page.evaluate(()=>typeof window.__VN_DEBUG__!=='undefined'))throw Error('Debug exposed');
 await page.touchscreen.tap(195,590);await page.waitForTimeout(8500);
 const text=await page.locator('#sr-story').textContent();if(!text.includes('нарисовать себя'))throw Error('Story did not start');
 await page.screenshot({path:`art/qa/live/${name}-intro.png`});
 await page.reload();await page.locator('#boot').waitFor({state:'hidden'});await page.touchscreen.tap(195,590);await page.waitForTimeout(2000);
 if(!(await page.locator('#sr-story').textContent()).includes('нарисовать себя'))throw Error('Resume failed');
 if(name==='chromium')for(const asset of manifest){const r=await page.request.get(new URL(asset.url,url).href);if(r.status()!==200)errors.push('Asset '+asset.id+' '+r.status());}
 report.push({browser:name,http:response.status(),started:true,resumed:true,debugAbsent:true,errors});await browser.close();
}
await writeFile('art/qa/live/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(report.some(r=>r.errors.length))process.exitCode=1;
