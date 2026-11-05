const historyKinds={competency:'Competencia',program:'RA del programa',outcome:'RA de la AC',link:'Cruce AC × RA'};
function historyRecords(workspace){
 const records=[];
 for(const c of workspace.competencies||[])records.push({kind:'competency',id:c.id,parent:'',record:c});
 for(const r of workspace.program)records.push({kind:'program',id:r.id,parent:'',record:r});
 for(const c of workspace.courses)for(const o of c.outcomes)records.push({kind:'outcome',id:o.id,parent:c.id,record:o});
 for(const l of workspace.links)records.push({kind:'link',id:l.ra,parent:l.course,record:l});
 return new Map(records.map(r=>[JSON.stringify([r.kind,r.parent,r.id]),r]));
}
function historyChanges(before,after){
 const a=historyRecords(before),b=historyRecords(after),changes=[];
 for(const key of new Set([...a.keys(),...b.keys()])){
  const left=a.get(key),right=b.get(key),ref=left||right;
  if(!left||!right){changes.push({key,kind:ref.kind,id:ref.id,parent:ref.parent,before:left?structuredClone(left.record):null,after:right?structuredClone(right.record):null,fields:null});continue;}
  const fields=[];
  for(const name of new Set([...Object.keys(left.record),...Object.keys(right.record)])){
   const beforeHas=Object.hasOwn(left.record,name),afterHas=Object.hasOwn(right.record,name);
   if(beforeHas!==afterHas||!sameRecord(left.record[name],right.record[name]))fields.push({name,beforeHas,afterHas,before:beforeHas?structuredClone(left.record[name]):null,after:afterHas?structuredClone(right.record[name]):null});
  }
  if(fields.length)changes.push({key,kind:ref.kind,id:ref.id,parent:ref.parent,fields});
 }
 return changes;
}
function appendHistory(before,next,label){
 const changes=historyChanges(before,next);if(!changes.length)return next;
 next.history??={version:1,entries:[]};
 next.history.entries.push({id:uid(),at:new Date().toISOString(),label,action:'edit',changes});return next;
}
function historyUndoReason(workspace,entry){
 if(entry.action==='undo')return 'Este registro documenta una reversión.';
 if(entry.undoneBy)return 'Ajuste ya deshecho.';
 const entries=workspace.history?.entries||[],index=entries.findIndex(e=>e.id===entry.id),keys=new Set(entry.changes.map(c=>c.key));
 if(entries.slice(index+1).some(e=>e.action!=='undo'&&!e.undoneBy&&e.changes.some(c=>keys.has(c.key))))return 'Hay un cambio posterior en estos registros. Deshaz primero ese cambio.';
 const records=historyRecords(workspace);
 for(const c of entry.changes){
  const current=records.get(c.key)?.record;
  if(c.fields){
   if(!current)return 'El registro ya no está activo.';
   if(c.fields.some(f=>Object.hasOwn(current,f.name)!==f.afterHas||(f.afterHas&&!sameRecord(current[f.name],f.after))))return 'El estado actual ya no coincide con el ajuste.';
  }else if(!sameRecord(current??null,c.after))return 'El registro tiene cambios posteriores o externos.';
  if(c.kind==='outcome'&&!workspace.courses.some(course=>course.id===c.parent))return 'Restaura primero la AC desde la papelera.';
 }
 return '';
}
function undoHistoryEntry(workspace,id){
 const entry=workspace.history?.entries.find(e=>e.id===id);if(!entry)throw Error('No se encontró el ajuste.');
 const reason=historyUndoReason(workspace,entry);if(reason)throw Error(reason);
 const next=structuredClone(workspace);
 for(const c of entry.changes){
  const list=c.kind==='competency'?next.competencies:c.kind==='program'?next.program:c.kind==='outcome'?next.courses.find(course=>course.id===c.parent).outcomes:next.links;
  const index=list.findIndex(r=>c.kind==='link'?r.course===c.parent&&r.ra===c.id:r.id===c.id);
  if(c.fields){const current=list[index];for(const f of c.fields){if(f.beforeHas)current[f.name]=structuredClone(f.before);else delete current[f.name];}}
  else if(c.before===null){if(index>=0)list.splice(index,1);}
  else if(index>=0)list[index]=structuredClone(c.before);else list.push(structuredClone(c.before));
 }
 if(!valid(next))throw Error('La reversión dejaría vínculos inválidos. Revisa los cambios posteriores de sus dependencias.');
 const reversal={id:uid(),at:new Date().toISOString(),label:'Deshacer · '+entry.label,action:'undo',undoOf:id,changes:historyChanges(workspace,next)};
 next.history.entries.find(e=>e.id===id).undoneBy=reversal.id;next.history.entries.push(reversal);return next;
}
function validHistory(history){
 return history===undefined||(history&&history.version===1&&Array.isArray(history.entries)&&history.entries.every(e=>e&&typeof e.id==='string'&&typeof e.label==='string'&&typeof e.at==='string'&&Number.isFinite(Date.parse(e.at))&&['edit','undo'].includes(e.action)&&Array.isArray(e.changes)&&e.changes.every(c=>c&&Object.hasOwn(historyKinds,c.kind)&&typeof c.id==='string'&&typeof c.parent==='string'&&c.key===JSON.stringify([c.kind,c.parent,c.id])&&(c.fields===null||Array.isArray(c.fields)&&c.fields.every(f=>f&&typeof f.name==='string'&&!['__proto__','constructor','prototype','id','course','ra'].includes(f.name)&&typeof f.beforeHas==='boolean'&&typeof f.afterHas==='boolean'))))&&new Set(history.entries.map(e=>e.id)).size===history.entries.length);
}
