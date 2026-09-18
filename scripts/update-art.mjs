import sharp from 'sharp';
import {copyFile,readFile,writeFile} from 'node:fs/promises';
const root='C:/Users/aleks/.codex/generated_images/01a0b116-6b79-71e2-9315-31760c0e16b1/';
const selected={'env-room':'exec-76c47930-7574-4d55-af6f-4ff3eb7d0b46.png','env-finale':'exec-dd7f49c9-ab96-4a78-8f93-726a7448f1bf.png','env-light':'exec-984350a1-108e-4e22-a1d4-a6113d1da22b.png','hero-1':'exec-20eb01cd-84f6-4e0a-a1c5-f3d2357953d2.png'};
for(const[id,file]of Object.entries(selected)){await copyFile(root+file,'art/masters/'+id+'.png');await sharp(root+file).resize({height:id.startsWith('env-')?1688:760}).webp({quality:91}).toFile('public/assets/art/'+id+'.webp');}
const manifest=JSON.parse(await readFile('src/content/asset-manifest.json','utf8'));
for(const entry of manifest){const m=await sharp('public/'+entry.url).metadata();entry.width=m.width;entry.height=m.height;entry.memoryBytes=m.width*m.height*4;}
await writeFile('src/content/asset-manifest.json',JSON.stringify(manifest,null,2));
