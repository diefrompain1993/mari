import sharp from 'sharp';
import {readFile,writeFile,mkdir,copyFile,access} from 'node:fs/promises';
await mkdir('art/book',{recursive:true});await mkdir('public/assets/book',{recursive:true});
const sources=JSON.parse(await readFile('art/book-generation.json','utf8'));
const manifest=JSON.parse(await readFile('src/content/asset-manifest.json','utf8'));
async function output(id,p,pixel=false){const url=`assets/book/${id}.webp`;await p.webp({quality:95,lossless:pixel}).toFile('public/'+url);const m=await sharp('public/'+url).metadata();const a={id,url,chapter:'shared',type:'texture',priority:'chapter-current',width:m.width,height:m.height,memoryBytes:m.width*m.height*4,fallback:null};const old=manifest.find(x=>x.id===id);if(old)Object.assign(old,a);else manifest.push(a);}
for(const[id,s]of Object.entries(sources)){const path=`art/book/${id}.png`;try{await access(path);}catch{await copyFile(s.path,path);}if(id!=='npcs'){const pixel=['star-hill','paper-city','library'].includes(id);await output('env-book-'+id,sharp(path).resize({height:pixel?422:1266,kernel:pixel?'nearest':'lanczos3'}),pixel);}}
const m=await sharp('art/book/npcs.png').metadata();
for(const[i,id]of ['binder','letter','musician','painter','keeper'].entries()){const left=Math.round(i*m.width/5),right=Math.round((i+1)*m.width/5);const buf=await sharp('art/book/npcs.png').extract({left,top:0,width:right-left,height:m.height}).png().toBuffer();await output('npc-'+id,sharp(buf).trim().resize({height:i?160:600,kernel:i?'nearest':'lanczos3'}),i>0);}
await writeFile('src/content/asset-manifest.json',JSON.stringify(manifest,null,2)+'\n');
