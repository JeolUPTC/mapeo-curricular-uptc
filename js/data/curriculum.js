function archiveCourse(workspace,id){
 const course=workspace.courses.find(course=>course.id===id);
 if(!course)return;
 workspace.deletedCourses??=[];
 workspace.deletedCourses.push({course:structuredClone(course),links:structuredClone(workspace.links.filter(link=>link.course===id))});
 workspace.courses=workspace.courses.filter(course=>course.id!==id);
 workspace.links=workspace.links.filter(link=>link.course!==id);
}
function restoreCourse(workspace,id){
 const deleted=workspace.deletedCourses?.find(record=>record.course.id===id);
 if(!deleted)return;
 if(workspace.courses.some(course=>course.id===id))throw Error('La actividad ya existe en el plan.');
 workspace.courses.push(deleted.course);
 workspace.links.push(...deleted.links);
 workspace.deletedCourses=workspace.deletedCourses.filter(record=>record.course.id!==id);
}
function moveCourse(workspace,id,semester){
 const course=workspace.courses.find(course=>course.id===id);
 if(!course||!Number.isInteger(semester)||semester<1)throw Error('Selecciona un semestre válido.');
 if(course.semester===semester)return false;
 const order=Math.max(0,...workspace.courses.filter(c=>c.semester===semester&&c.id!==id).map(c=>c.order??c.sourceNumber??0))+1;
 course.semester=semester;
 course.order=order;
 return true;
}
function importMallaSource(workspace){
 if(workspace.kind==='area')return workspace;
 if(workspace.mallaImport===mallaSource.id){
  const legacy=workspace.areas.find(area=>area.id==='area-nucleus-87'&&area.name==='de Gestión');
  if(!legacy)return workspace;
  const revised=structuredClone(workspace);
  revised.areas.find(area=>area.id===legacy.id).name='Gestión';
  return revised;
 }
 const draft=structuredClone(workspace);
 draft.curriculum??={groups:[]};draft.curriculum.groups??=[];
 const existingGroups=draft.curriculum.groups;
 for(const group of mallaSource.groups){
  if(!existingGroups.some(existing=>existing.id===group.id))existingGroups.push(structuredClone(group));
 }
 const knownAreas={'nucleus-5':'math','nucleus-23':'prog','nucleus-43':'sw'};
 const aliases=new Map();
 for(const group of mallaSource.groups){
  let area=knownAreas[group.id]&&draft.areas.find(area=>area.id===knownAreas[group.id]);
  let name=group.name.replace(/^Núcleo (?:de )?/,'');
  if(group.id==='nucleus-68')name='Libre elección de profundización';
  if(group.id==='nucleus-94')name='Humanismos y Lenguajes';
  area??=draft.areas.find(area=>sourceCourseName(area.name)===sourceCourseName(name));
  if(!area){area={id:'area-'+group.id,name};draft.areas.push(area);}
  aliases.set(group.id,area.id);
 }
 for(const source of mallaSource.courses){
  const deleted=draft.deletedCourses?.some(record=>record.course.id===source.id||sourceCourseName(record.course.name)===sourceCourseName(source.name)&&record.course.semester===source.semester);
  if(deleted)continue;
  let course=draft.courses.find(course=>course.id===source.id||sourceCourseName(course.name)===sourceCourseName(source.name)&&course.semester===source.semester);
  if(!course){
   const hours={theory:null,practice:null,presential:source.presential,autonomous:source.autonomous,total:typeof source.presential==='number'&&typeof source.autonomous==='number'?source.presential+source.autonomous:null};
   course={id:source.id,name:source.name,semester:source.semester,credits:source.credits,area:aliases.get(source.curriculumGroup),outcomes:[],hours};
   draft.courses.push(course);
  }
  course.curriculumGroup??=source.curriculumGroup;
  course.inStudyPlan??=source.inStudyPlan;
  course.order??=course.sourceNumber??mallaSource.courses.indexOf(source)+1;
  if(course.area==='unassigned')course.area=aliases.get(source.curriculumGroup);
  course.mallaSource={id:source.id,cell:source.sourceCell,semester:source.semester,credits:source.credits,presential:source.presential,autonomous:source.autonomous};
 }
 draft.mallaImport=mallaSource.id;
 return draft;
}
function mallaDifferences(workspace){
 return workspace.courses.flatMap(course=>{
  const source=course.mallaSource;
  if(!source)return [];
  const result=[];
  for(const field of ['semester','credits']){
   if(course[field]!==source[field])result.push({course:course.id,field,label:course.name+' · '+(field==='semester'?'Semestre':'Créditos'),current:course[field],incoming:source[field]});
  }
  for(const field of ['presential','autonomous']){
   if((course.hours?.[field]??null)!==(source[field]??null))result.push({course:course.id,field,label:course.name+' · '+(field==='presential'?'Horas presenciales':'Horas autónomas'),current:course.hours?.[field]??null,incoming:source[field]??null});
  }
  return result;
 });
}
function curriculumGroup(workspace,id){
 return workspace.curriculum?.groups.find(group=>group.id===id);
}

