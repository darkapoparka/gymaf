import { readFile, writeFile } from 'node:fs/promises';
const flows=JSON.parse(await readFile('docs/reference-flows.json','utf8'));
let text='# Mobbin reference text\n\nOCR transcription for implementation. Original images remain the visual authority.\n';
for(const f of flows){text+=`\n## ${f.name}\n\nhttps://mobbin.com/flows/${f.flow}\n`;for(const [i,id] of (f.ids??[]).entries()){let o;try{o=JSON.parse((await readFile(`docs/ocr/${id}.json`,'utf8')).replace(/^\uFEFF/,''));}catch{continue;}text+=`\n${i+1}. [${id}] ${o.text}\n`;}}
await writeFile('docs/reference-text.md',text);

