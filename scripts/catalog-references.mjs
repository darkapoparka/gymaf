import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
const root = process.cwd();
const flows = JSON.parse(await readFile('docs/reference-flows.json', 'utf8'));
const assetsRoot = path.join(process.env.LOCALAPPDATA, 'Temp/browser-use/assets');
await mkdir('public/reference/screens', { recursive: true });
await mkdir('docs/ocr', { recursive: true });
const screens = new Map();
for (const flow of flows) {
  if (!flow.dir || !flow.ids) continue;
  const manifest = JSON.parse(await readFile(path.join(assetsRoot,flow.dir,'manifest.json'),'utf8'));
  for(const [index,id] of flow.ids.entries()) {
    if(!id) continue;
    const asset=manifest.assets.find(a=>a.id===id);
    if(!asset) throw Error(`Missing ${flow.name} ${id}`);
    const dest=path.join(root,'public/reference/screens',id+path.extname(asset.path));
    if(!screens.has(id)) {
      await copyFile(asset.path,dest);
      screens.set(id,{id,file:dest,ocr:path.join(root,'docs/ocr',id+'.json'),flows:[]});
    }
    screens.get(id).flows.push({flow:flow.flow,name:flow.name,screen:index+1});
  }
}
await writeFile('docs/reference-screens.json',JSON.stringify([...screens.values()],null,2));
console.log(JSON.stringify({flows:flows.length,captured:flows.filter(f=>f.ids).length,images:screens.size}));
