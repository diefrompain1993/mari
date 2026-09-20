import {readFile,writeFile} from 'node:fs/promises';
import ts from 'typescript';
const source=await readFile('src/content/story.ts','utf8');
const module={};
new Function('exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(module);
const games={};
new Function('exports',ts.transpileModule(await readFile('src/content/book-games.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(games);
const names={thought:'Про себя',hero:'Странник',girl:'Девушка из Света',narrator:'Рассказчик',binder:'Переплётчик',letter:'Девушка с письмом',musician:'Музыкант',painter:'Художник',keeper:'Хранительница'};
const lines=['# Проявление — текущий сценарий','', 'Художественные диалоги; реальные биографические события не реконструируются.',''];
for(const scene of module.story){
  lines.push('## '+(scene.title||'Вопрос'),'');
  for(const beat of scene.beats){
    if(beat.text)lines.push(`**${names[beat.speaker]}:** ${beat.text}`,'');
    else if(beat.game){
      lines.push(`*[Взаимодействие: ${beat.game}]*`,'');
      const data=games.bookGames[beat.game];
      if(data){lines.push(data.prompt,'');for(const item of data.items)lines.push(`**${item.title}:** ${item.text}`,'');}
    }
    else if(beat.pause)lines.push(`*[Пауза ${(beat.pause/1000).toFixed(1)} с${beat.hero?' · новый образ героя':''}]*`,'');
  }
}
await writeFile('docs/SCENARIO.md',lines.join('\n'));
const beats=module.story.flatMap(s=>s.beats);
console.log(JSON.stringify({beats:beats.length,words:beats.map(b=>b.text||'').join(' ').trim().split(/\s+/).length}));
