import sharp from 'sharp';
import {readFile,writeFile,copyFile} from 'node:fs/promises';
const sources=JSON.parse(await readFile('art/environment-sources.json','utf8'));
for(const[id,source]of Object.entries(sources)){await copyFile(source,'art/masters/env-'+id+'.png');await sharp(source).resize({height:1688}).webp({quality:90}).toFile('public/assets/art/env-'+id+'.webp');}
const manifest=JSON.parse(await readFile('src/content/asset-manifest.json','utf8'));
for(const entry of manifest){if(entry.id==='hero-4'||entry.id==='hero-5')entry.url='assets/art/'+entry.id+'-pixel.webp';const m=await sharp('public/'+entry.url).metadata();entry.width=m.width;entry.height=m.height;entry.memoryBytes=m.width*m.height*4;}
await writeFile('src/content/asset-manifest.json',JSON.stringify(manifest,null,2));
const tiles=await Promise.all(Object.entries(sources).map(async([id,source],i)=>({input:await sharp(source).resize(195,422).png().toBuffer(),left:i*195,top:0})));
await sharp({create:{width:975,height:422,channels:3,background:'#101719'}}).composite(tiles).png().toFile('art/environment-review.png');
