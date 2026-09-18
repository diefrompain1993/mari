import {webkit,devices} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('art/qa/polish',{recursive:true});
const browser=await webkit.launch();const page=await browser.newPage({...devices['iPhone 13']});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5173/');await page.locator('#boot').waitFor({state:'hidden'});await page.touchscreen.tap(195,590);
const scenes=['first_light','light_follow','fourteen_time','night_silence','noise_cafe','stay_close','resolution_8bit','human_reveal','final_question'];const states=[];
for(const id of scenes){await page.evaluate(id=>window.__VN_DEBUG__.goToScene(id),id);await page.waitForTimeout(3000);await page.screenshot({path:'art/qa/polish/'+id+'.png'});states.push(await page.evaluate(()=>window.__VN_DEBUG__.dumpState()));}
await writeFile('art/qa/polish/states.json',JSON.stringify({states,errors},null,2));console.log(JSON.stringify({scenes:states.map(s=>({scene:s.scene,fps:s.fps,tier:s.graphicsTier})),errors}));await browser.close();
