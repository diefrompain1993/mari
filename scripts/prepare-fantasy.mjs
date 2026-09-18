import sharp from 'sharp';
import {readFile,writeFile,mkdir,copyFile,access} from 'node:fs/promises';
const sources=JSON.parse(await readFile('art/fantasy-generation.json','utf8'));
await mkdir('art/fantasy',{recursive:true});
await mkdir('public/assets/art-v2',{recursive:true});
for(const [id,entry] of Object.entries(sources)){
  if(entry.selected===false)continue;
  const path=`art/fantasy/${id}.png`;
  try{await access(path);}catch{await copyFile(entry.path,path);}
}
const manifest=JSON.parse(await readFile('src/content/asset-manifest.json','utf8'));
async function output(id,pipeline,pixel=false){
  const path=`public/assets/art-v2/${id}.webp`;
  await pipeline.webp({quality:94,lossless:pixel}).toFile(path);
  const meta=await sharp(path).metadata();
  Object.assign(manifest.find(a=>a.id===id),{url:`assets/art-v2/${id}.webp`,width:meta.width,height:meta.height,memoryBytes:meta.width*meta.height*4});
}
for(const[id,source]of[['hero-6','heroClean'],['girl-7','girl'],['hero-seated','heroSeated'],['girl-seated','girlSeated'],['girl-seated-partial','girlSeatedPartial']])
 await output(id,sharp(`art/fantasy/${source}.png`).resize({height:1000}));
// Keep the original sparse drawn opening; it is not one of the rejected realistic assets.
await output('hero-1',sharp('art/masters/hero-1.png').resize({height:900}));
for(const[kind,count,source]of[['hero',5,'heroStages'],['girl',6,'girlStages']]){
 const path=`art/fantasy/${source}.png`,m=await sharp(path).metadata();
 for(let i=0;i<count;i++){
  if(kind==='hero'&&i===0)continue;
  const left=Math.round(i*m.width/count),right=Math.round((i+1)*m.width/count);
  const pixel=kind==='hero'&&i>=3;
  const cut=await sharp(path).extract({left,top:0,width:right-left,height:m.height}).png().toBuffer();
  await output(`${kind}-${i+1}`,sharp(cut).resize({height:pixel?(i===3?128:256):900,kernel:pixel?'nearest':'lanczos3'}),pixel);
 }
}
for(const[source,ids]of[['envFirst',['prologue','light','garden']],['envIntimate',['room','cafe','finale']],['envOther',['clock','crowd','thought']]]){
 const path=`art/fantasy/${source}.png`,m=await sharp(path).metadata();
 for(let i=0;i<3;i++){
  const left=Math.round(i*m.width/3)+1,right=Math.round((i+1)*m.width/3)-1;
  await output('env-'+ids[i],sharp(path).extract({left,top:0,width:right-left,height:m.height}));
 }
}
await output('env-pixel',sharp('art/masters/pixel.png').resize(390,844,{kernel:'nearest'}),true);
await writeFile('src/content/asset-manifest.json',JSON.stringify(manifest,null,2));
console.log(`Packaged ${manifest.length} fantasy textures with preserved alpha.`);
