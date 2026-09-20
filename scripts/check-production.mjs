import {createServer} from 'node:http';
import {readFile,stat,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {webkit,chromium,devices} from '@playwright/test';
const root=resolve('dist'),prefix='/novel-preview/';
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.wav':'audio/wav','.mp3':'audio/mpeg','.woff2':'font/woff2','.woff':'font/woff'};
const server=createServer(async(req,res)=>{try{
 if(!req.url.startsWith(prefix)){res.writeHead(404).end();return;}
 const relative=decodeURIComponent(req.url.split('?')[0].slice(prefix.length))||'index.html';
 const path=resolve(root,relative);
 if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}
 await stat(path);res.setHeader('Content-Type',mime[extname(path)]||'application/octet-stream');res.end(await readFile(path));
}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(4174,'127.0.0.1',r));
await mkdir('art/qa/production',{recursive:true});const reports=[];
try{for(const [name,engine,device]of[['webkit',webkit,'iPhone 13'],['chromium',chromium,'Pixel 7']]){
 const browser=await engine.launch();const page=await browser.newPage({...devices[device],viewport:{width:390,height:844},deviceScaleFactor:1});
 const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{requests.push(r.url());if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await page.goto('http://127.0.0.1:4174'+prefix+'?scene=final_question');await page.locator('#boot').waitFor({state:'hidden'});
 if(await page.evaluate(()=>typeof window.__VN_DEBUG__!=='undefined'))throw Error('Production exposes debug');
 await page.touchscreen.tap(195,590);await page.waitForTimeout(8500);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('proyavlenie.v1')));
 if(saved.scene!==0)throw Error('Production query skips story');
 const webAudio=await page.evaluate(()=>typeof AudioContext!=='undefined');
 const scoreRequested=requests.some(u=>u.endsWith('/assets/audio/prologue.mp3'));
 if(webAudio&&!scoreRequested)throw Error('Missing score request');
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Horizontal overflow');
 await page.screenshot({path:`art/qa/production/${name}.png`});
 reports.push({browser:name,errors,requests:requests.length,checkpoint:saved.scene,debugAbsent:true,subpath:prefix,webAudio,scoreRequested});await browser.close();
 if(errors.length)throw Error(errors.join('\n'));
}}finally{server.close();await writeFile('art/qa/production/report.json',JSON.stringify(reports,null,2));}
console.log(JSON.stringify(reports));
