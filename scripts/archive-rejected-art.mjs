import {readFile,readdir,mkdir,copyFile,stat,unlink} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
const workspace=resolve('.'),source=resolve('public/assets/art'),archive=resolve('art/archive-realism/runtime');
if(!source.startsWith(workspace+sep)||!archive.startsWith(workspace+sep))throw Error('Archive outside workspace');
const manifest=JSON.parse(await readFile('src/content/asset-manifest.json','utf8'));
if(manifest.some(a=>a.url.startsWith('assets/art/')))throw Error('Old art still referenced');
await mkdir(archive,{recursive:true});
for(const entry of await readdir(source,{withFileTypes:true})){
 if(!entry.isFile()||!entry.name.endsWith('.webp'))continue;
 const from=resolve(source,entry.name),to=resolve(archive,entry.name);
 await copyFile(from,to);
 if((await stat(from)).size!==(await stat(to)).size)throw Error('Archive verification failed');
 await unlink(from);
}
console.log('Rejected runtime art archived outside public; no active references.');
