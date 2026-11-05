import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{const f=path.join(dir,e.name);if(e.isSymbolicLink())throw Error('No se publican enlaces simbólicos: '+f);return e.isDirectory()?walk(f):[f];});}
const files=['js','css','assets'].flatMap(d=>walk(path.join(root,d)));
for(const f of files.filter(f=>f.endsWith('.js')))new vm.Script(fs.readFileSync(f,'utf8'),{filename:f});
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
 const url=match[1].split('?')[0];if(/^(https?:|data:)/.test(url))continue;
 if(url.startsWith('/'))throw Error('Ruta absoluta incompatible con sitio de proyecto: '+url);
 const target=path.resolve(root,url);if(!target.startsWith(root+path.sep)||!fs.existsSync(target))throw Error('Recurso inexistente: '+url);
}
for(const f of ['assets/templates/contenidos-ac.docx','assets/templates/mapeo-curricular.xlsx']){
 const bytes=fs.readFileSync(path.join(root,f));if(bytes[0]!==80||bytes[1]!==75)throw Error('Plantilla Office inválida: '+f);
}
console.log('Sintaxis, recursos relativos y plantillas: OK.');
