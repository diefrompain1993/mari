import sharp from 'sharp';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
const sources=JSON.parse(await readFile('art/progression-generation.json','utf8'));
await mkdir('art/progression',{recursive:true}); await mkdir('public/assets/art-v3',{recursive:true});
for(const[id,s]of Object.entries(sources)) await copyFile(s.path,`art/progression/${id}.png`);
const manifest=JSON.parse(await readFile('src/content/asset-manifest.json','utf8'));
async function out(id,pipeline,pixel=false){
 const url=`assets/art-v3/${id}.webp`;
 await pipeline.webp({quality:95,lossless:pixel}).toFile('public/'+url);
 const m=await sharp('public/'+url).metadata();
 const entry={id,url,chapter:'shared',type:'texture',priority:'chapter-current',width:m.width,height:m.height,memoryBytes:m.width*m.height*4,fallback:null};
 const existing=manifest.find(a=>a.id===id);if(existing)Object.assign(existing,entry);else manifest.push(entry);
}
// Raster export only: generated transparent strokes retain their authored alpha.
await out('hero-1',sharp('art/progression/stick.png').trim().resize({height:600}));
await out('env-line',sharp('art/progression/line-world.png').resize({height:1266}));
for(const id of ['garden','room','passage']) await out('env-pixel-'+id,sharp(`art/progression/pixel-${id}.png`).resize(195,422,{fit:'fill',kernel:'nearest'}),true);
const sheet='art/progression/pixel-sprites.png',m=await sharp(sheet).metadata();
for(const[id,i]of [['girl-pixel',0],['girl-seated-pixel',1],['hero-seated-pixel',2],['hero-5',3]]){
 const left=Math.round(i*m.width/4),right=Math.round((i+1)*m.width/4);
 const cell=await sharp(sheet).extract({left,top:0,width:right-left,height:m.height}).png().toBuffer();
 await out(id,sharp(cell).trim().resize({height:160,kernel:'nearest'}),true);
}
for(let i=1;i<=5;i++)await out('girl-pixel-'+i,sharp(`public/assets/art-v2/girl-${i}.webp`).resize({height:112,kernel:'nearest'}),true);
await writeFile('src/content/asset-manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log('Exported progression art.');
