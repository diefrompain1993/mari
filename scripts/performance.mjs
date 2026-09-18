import {webkit,chromium} from '@playwright/test';
for(const[name,type]of [['webkit',webkit],['chromium',chromium]]){
 const browser=await type.launch();const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 await page.goto('about:blank');const empty=await page.evaluate(()=>new Promise(resolve=>{const start=performance.now();let n=0;function frame(){n++;if(performance.now()-start<3000)requestAnimationFrame(frame);else resolve(n*1000/(performance.now()-start));}requestAnimationFrame(frame);}));
 await page.goto('http://127.0.0.1:5173/?scene=final_question');await page.locator('#boot').waitFor({state:'hidden'});await page.waitForTimeout(4000);const state=await page.evaluate(()=>window.__VN_DEBUG__.dumpState());console.log(JSON.stringify({name,empty,app:state.fps,tier:state.graphicsTier}));await browser.close();
}
