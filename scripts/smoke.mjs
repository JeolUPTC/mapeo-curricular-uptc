import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'release.json'),'utf8'));
const prefix='/mapeo-curricular-piloto/';
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(!pathname.startsWith(prefix)){res.writeHead(404).end();return;}
 const relative=decodeURIComponent(pathname.slice(prefix.length))||'index.html';const file=path.resolve(root,relative);
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
 res.writeHead(200);res.end(fs.readFileSync(file));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try{
 const base='http://127.0.0.1:'+server.address().port+prefix;
 for(const entry of manifest.files){const response=await fetch(new URL(entry.path,base));assert.equal(response.status,200,entry.path);assert.equal((await response.arrayBuffer()).byteLength,fs.statSync(path.join(root,entry.path)).size);}
 assert(!manifest.files.some(e=>/^(backups|exports|outputs|tests|scripts|\.github)\//.test(e.path)));
 assert(!manifest.files.some(e=>e.path.endsWith('.json')));
 console.log('Sitio servido bajo /mapeo-curricular-piloto/: todos los recursos y plantillas accesibles. Sin respaldos ni herramientas de desarrollo publicados.');
}finally{await new Promise(resolve=>server.close(resolve));}
