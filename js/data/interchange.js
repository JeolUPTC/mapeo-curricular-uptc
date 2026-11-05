// v2 is the public JSON contract. The internal v1 adapter preserves existing history and area merges.
function encodeWorkspace(workspace){
 const result=structuredClone(workspace);
 function encode(l){const s=contributionState(l);const review={D:'documented',S:'support-pending',P:'draft',N:'reviewed'}[s.code];return {...l,level:s.level,reviewState:review,contribution:s.decision==='Sin aporte'?'none':'contributes'};}
 result.links=result.links.map(encode);
 for(const record of result.deletedCourses||[])record.links=record.links.map(encode);
 result.version=2;return result;
}
function decodeWorkspace(workspace){
 if(workspace.version!==2)return workspace;
 const result=structuredClone(workspace);
 function decode(l){
  if(!l||!['contributes','none'].includes(l.contribution)||!['documented','support-pending','draft','reviewed'].includes(l.reviewState))throw Error('Estado de revisión o decisión de aporte inválidos.');
  const {reviewState,contribution,...record}=l;
  if(contribution==='none'){
   if(record.level!==null||reviewState!=='reviewed')throw Error('Sin aporte no puede tener nivel I/R/A.');record.level='N';
  }else if(reviewState==='draft'){
   if(record.level!==null)throw Error('Un borrador no tiene un nivel confirmado.');record.level='P';
  }else if(!['I','R','A'].includes(record.level)||!['documented','support-pending'].includes(reviewState))throw Error('La contribución requiere un nivel I/R/A válido.');
  const expected={D:'documented',S:'support-pending',P:'draft',N:'reviewed'}[contributionState(record).code];
  if(expected!==reviewState)throw Error('El estado de revisión contradice el soporte registrado.');
  return record;
 }
 if(!Array.isArray(result.links))throw Error('Faltan las relaciones curriculares.');
 result.links=result.links.map(decode);
 for(const record of result.deletedCourses||[])record.links=record.links.map(decode);
 result.version=1;return result;
}
