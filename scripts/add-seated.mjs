import sharp from 'sharp';
import {copyFile,readFile,writeFile} from 'node:fs/promises';
const root='C:/Users/aleks/.codex/generated_images/01a0b116-6b79-71e2-9315-31760c0e16b1/';
const entries=[['hero-seated','exec-fdb7d032-ca03-4cc3-b0dc-972efe1a5643.png'],['girl-seated','exec-6ab08ea8-8ff4-4372-9522-2031f7cb1bc0.png'],['girl-seated-partial','exec-52d5fa4f-0946-42f8-b4b1-ef69bf094849.png']];
const manifest=JSON.parse(await readFile('src/content/asset-manifest.json','utf8'));
for(const[id,file]of entries){await copyFile(root+file,'art/masters/'+id+'.png');await sharp(root+file).resize({height:900}).webp({quality:92}).toFile('public/assets/art/'+id+'.webp');const m=await sharp('public/assets/art/'+id+'.webp').metadata();if(!manifest.some(e=>e.id===id))manifest.push({id,url:'assets/art/'+id+'.webp',chapter:'shared',type:'texture',priority:'chapter-current',width:m.width,height:m.height,memoryBytes:m.width*m.height*4,fallback:null});}
await writeFile('src/content/asset-manifest.json',JSON.stringify(manifest,null,2));
