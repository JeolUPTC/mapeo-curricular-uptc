function areaPackage(workspace,id){
 const courses=workspace.courses.filter(course=>course.area===id);
 const ids=new Set(courses.map(course=>course.id));
 return {...(workspace.competencies?{competencies:structuredClone(workspace.competencies)}:{}),...(workspace.documentation?{documentation:structuredClone(workspace.documentation)}:{}),kind:'area',version:1,areas:workspace.areas.filter(area=>area.id===id),program:workspace.program,
  curriculum:structuredClone(workspace.curriculum||{groups:[]}),courses,links:workspace.links.filter(link=>ids.has(link.course)),
  deletedCourses:structuredClone((workspace.deletedCourses||[]).filter(record=>record.course.area===id))};
}
function sameRecord(a,b){
 const canonical=value=>Array.isArray(value)?value.map(canonical):
  value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
 return JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
}
function planMerge(current,packages){
 const next=structuredClone(current),conflicts=[];
 next.curriculum??={groups:[]};next.curriculum.groups??=[];next.deletedCourses??=[];
 let added=0;
 function consider(list,incoming,find,label,file){
  const index=list.findIndex(find);
  if(index<0){list.push(incoming);added++;return;}
  const previous=list[index];
  if(sameRecord(previous,incoming))return;
  conflicts.push({label,file,previous,incoming,apply:()=>{
   const position=list.findIndex(find);
   if(position>=0)list[position]=incoming;
  }});
 }
 for(const {name,pkg} of packages){
  if(pkg.kind!=='area'||pkg.areas.length!==1)throw Error(name+' no es un paquete de área.');
  if(!sameRecord([...pkg.program].sort((a,b)=>a.id.localeCompare(b.id)),[...current.program].sort((a,b)=>a.id.localeCompare(b.id))))throw Error(name+' usa un catálogo de RA distinto.');
  for(const [id,incoming] of Object.entries(pkg.documentation?.criteria||{})){
   const previous=next.documentation?.criteria?.[id]||{status:'pending',responsible:'',date:'',reference:''};
   if(!sameRecord(previous,incoming))conflicts.push({label:'Estado de criterio · '+id,file:name,previous,incoming,apply:()=>{
    next.documentation??={criteria:{}};next.documentation.criteria??={};next.documentation.criteria[id]=structuredClone(incoming);
   }});
  }
  if(pkg.competencies){
   next.competencies??=[];
   for(const incoming of pkg.competencies)consider(next.competencies,incoming,c=>c.id===incoming.id,'Competencia · '+incoming.id,name);
  }
  const scope=pkg.areas[0];
  consider(next.areas,scope,area=>area.id===scope.id,'Área · '+scope.name,name);
  for(const group of pkg.curriculum?.groups||[]){
   consider(next.curriculum.groups,group,existing=>existing.id===group.id,'Agrupación de malla · '+group.name,name);
  }
  for(const course of pkg.courses){
   const existing=next.courses.find(c=>c.id===course.id);
   if(existing&&existing.area!==scope.id)throw Error(name+' intenta editar una AC de otra área: '+existing.name);
   const homonym=next.courses.find(c=>c.id!==course.id&&c.semester===course.semester&&c.name.localeCompare(course.name,'es',{sensitivity:'base'})===0);
   if(homonym)throw Error('La AC '+course.name+' ya existe en ese semestre con otro identificador.');
   const archived=next.deletedCourses.find(record=>record.course.id===course.id);
   if(archived){
    conflicts.push({label:'Restaurar AC · '+course.name,file:name,previous:{...archived.course,deleted:true},incoming:course,apply:()=>{
     next.deletedCourses=next.deletedCourses.filter(record=>record.course.id!==course.id);
     next.courses.push(course);
     next.links.push(...pkg.links.filter(link=>link.course===course.id));
    }});
    continue;
   }
   consider(next.courses,course,c=>c.id===course.id,'AC · '+course.name,name);
   for(const link of pkg.links.filter(link=>link.course===course.id)){
    consider(next.links,link,l=>l.course===link.course&&l.ra===link.ra,course.name+' × '+link.ra,name);
   }
  }
  for(const deleted of pkg.deletedCourses||[]){
   const active=next.courses.find(course=>course.id===deleted.course.id);
   if(active){
    if(active.area!==scope.id)throw Error(name+' intenta retirar una AC de otra área.');
    conflicts.push({label:'Retirar AC · '+active.name,file:name,previous:active,incoming:{...deleted.course,deleted:true},apply:()=>archiveCourse(next,active.id)});
   }else if(!next.deletedCourses.some(record=>record.course.id===deleted.course.id)){
    next.deletedCourses.push(deleted);
   }
  }
 }
 return {next,conflicts,added};
}
