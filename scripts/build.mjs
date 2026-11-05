import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fs.realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'));
const target=path.resolve(root,'dist');
if(path.dirname(target)!==root||path.basename(target)!=='dist')throw Error('Destino fuera del proyecto.');
if(fs.existsSync(target)&&fs.lstatSync(target).isSymbolicLink())throw Error('dist no puede ser un enlace simbólico.');
function assertTree(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isSymbolicLink())throw Error('No se publican enlaces simbólicos.');if(e.isDirectory())assertTree(f);}}
for(const dir of ['css','js','assets'])assertTree(path.join(root,dir));
fs.rmSync(target,{recursive:true,force:true});fs.mkdirSync(target);
for(const name of ['index.html','css','js','assets'])fs.cpSync(path.join(root,name),path.join(target,name),{recursive:true});
fs.writeFileSync(path.join(target,'.nojekyll'),'');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
function list(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{const f=path.join(dir,e.name);return e.isDirectory()?list(f):[f];});}
const files=list(target).map(f=>({path:path.relative(target,f).split(path.sep).join('/'),sha256:crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')})).sort((a,b)=>a.path.localeCompare(b.path));
fs.writeFileSync(path.join(target,'release.json'),JSON.stringify({version:pkg.version,jsonFormat:2,files},null,2));
console.log('Sitio preparado en dist: '+files.length+' archivos; versión '+pkg.version+'. Sin JSON de trabajo.');
