const OfficeFiles = {
 async template(path){
  const response=await fetch(path);
  if(!response.ok)throw Error('No se pudo leer la plantilla. Abre la aplicación desde el servidor local.');
  const bytes=new Uint8Array(await response.arrayBuffer());
  const view=new DataView(bytes.buffer);
  let end=bytes.length-22;
  while(end>=Math.max(0,bytes.length-65557)&&view.getUint32(end,true)!==0x06054b50)end--;
  if(end<0)throw Error('La plantilla no es un paquete Office válido.');
  const count=view.getUint16(end+10,true);
  let offset=view.getUint32(end+16,true);
  const files={};
  for(let i=0;i<count;i++){
   if(view.getUint32(offset,true)!==0x02014b50)throw Error('Directorio de plantilla inválido.');
   const method=view.getUint16(offset+10,true);
   const size=view.getUint32(offset+20,true);
   const nameLength=view.getUint16(offset+28,true);
   const extraLength=view.getUint16(offset+30,true);
   const commentLength=view.getUint16(offset+32,true);
   const local=view.getUint32(offset+42,true);
   const name=new TextDecoder().decode(bytes.slice(offset+46,offset+46+nameLength));
   const start=local+30+view.getUint16(local+26,true)+view.getUint16(local+28,true);
   const compressed=bytes.slice(start,start+size);
   if(method===0)files[name]=compressed;
   else if(method===8){
    const stream=new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    files[name]=new Uint8Array(await new Response(stream).arrayBuffer());
   }else throw Error('La plantilla usa una compresión no compatible.');
   offset+=46+nameLength+extraLength+commentLength;
  }
  return files;
 },
 xml(files,path){
  const bytes=files[path];
  if(!bytes)throw Error('Falta '+path+' en la plantilla.');
  const doc=new DOMParser().parseFromString(new TextDecoder().decode(bytes),'application/xml');
  if(doc.getElementsByTagName('parsererror').length)throw Error('XML inválido en '+path);
  return doc;
 },
 put(files,path,document){
  files[path]=new TextEncoder().encode(new XMLSerializer().serializeToString(document));
 },
 zip(files){
  const encoder=new TextEncoder(),chunks=[],central=[];
  let offset=0,centralLength=0,count=0;
  for(const [path,content] of Object.entries(files)){
   const name=encoder.encode(path);
   const bytes=typeof content==='string'?encoder.encode(content):content;
   let crc=-1;
   for(const byte of bytes){
    crc^=byte;
    for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);
   }
   crc=(~crc)>>>0;
   const local=new DataView(new ArrayBuffer(30)),entry=new DataView(new ArrayBuffer(46));
   local.setUint32(0,0x04034b50,true);local.setUint16(4,20,true);local.setUint16(6,0x800,true);local.setUint16(12,33,true);
   local.setUint32(14,crc,true);local.setUint32(18,bytes.length,true);local.setUint32(22,bytes.length,true);local.setUint16(26,name.length,true);
   entry.setUint32(0,0x02014b50,true);entry.setUint16(4,20,true);entry.setUint16(6,20,true);entry.setUint16(8,0x800,true);entry.setUint16(14,33,true);
   entry.setUint32(16,crc,true);entry.setUint32(20,bytes.length,true);entry.setUint32(24,bytes.length,true);entry.setUint16(28,name.length,true);entry.setUint32(42,offset,true);
   chunks.push(local.buffer,name,bytes);central.push(entry.buffer,name);
   offset+=30+name.length+bytes.length;centralLength+=46+name.length;count++;
  }
  const end=new DataView(new ArrayBuffer(22));
  end.setUint32(0,0x06054b50,true);end.setUint16(8,count,true);end.setUint16(10,count,true);
  end.setUint32(12,centralLength,true);end.setUint32(16,offset,true);
  return new Blob([...chunks,...central,end.buffer]);
 }
};
const OfficeNames={
 spreadsheet:'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
 word:'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
 relationship:'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
 packageRelationship:'http://schemas.openxmlformats.org/package/2006/relationships',
 content:'http://schemas.openxmlformats.org/package/2006/content-types'
};
function officeChildren(element,name){
 return [...element.children].filter(child=>child.localName===name);
}
function officeElement(doc,namespace,name,attributes={}){
 const element=doc.createElementNS(namespace,name);
 for(const [key,value] of Object.entries(attributes))element.setAttribute(key,String(value));
 return element;
}
function exportCourseOrder(workspace){
 return [...workspace.courses].sort((a,b)=>a.semester-b.semester||(a.order??a.sourceNumber??999)-(b.order??b.sourceNumber??999)||a.name.localeCompare(b.name,'es'));
}
function exportLevel(link){
 return ['I','R','A'].includes(link?.level)?link.level:'';
}
function exportLinkState(link){
 return contributionState(link).status;
}
function exportArea(workspace,id){
 return workspace.areas.find(a=>a.id===id)?.name||'Por asignar';
}


function exportContribution(link){return contributionState(link).decision;}
