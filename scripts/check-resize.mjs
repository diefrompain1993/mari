import {webkit,devices} from '@playwright/test';
const browser=await webkit.launch();const page=await browser.newPage({...devices['iPhone 13'],viewport:{width:390,height:844},deviceScaleFactor:1});
await page.goto('http://127.0.0.1:5173/?scene=night_silence');await page.locator('#boot').waitFor({state:'hidden'});await page.waitForTimeout(3000);
for(const h of[844,664,844]){await page.setViewportSize({width:390,height:h});await page.waitForTimeout(3000);console.log(await page.evaluate(()=>{const c=document.querySelector('canvas');const gl=c.getContext('webgl2')||c.getContext('webgl');return {w:c.width,h:c.height,innerHeight,rect:c.getBoundingClientRect().toJSON(),lost:gl?.isContextLost(),error:gl?.getError(),state:window.__VN_DEBUG__.dumpState().beat};}));await page.screenshot({path:`art/qa/controls/resize-${h}-${Date.now()}.png`});}
await browser.close();
