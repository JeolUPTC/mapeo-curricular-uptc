function isSourceContribution(link){
 return ['I','R','A','P'].includes(link.level)&&link.source?.sheet==='Mapeo Curricular'&&['I','R','A'].includes(link.source.level)&&(link.level==='P'||link.source.level===link.level)&&Number.isInteger(link.source.row)&&link.source.row>=7;
}
// GitHub Pages projects share a host: isolate each project by its URL directory.
const workspaceBasePath=typeof location==='undefined'?'/':location.pathname.replace(/[^/]*$/,'');
const key='mapa-curricular-demo-v1'+(workspaceBasePath==='/'?'':':'+workspaceBasePath);
const levels={P:'Vinculado · revisar nivel I/R/A',I:'Introducción',R:'Refuerzo',A:'Avanzado',N:'Revisado sin aporte'};
function valid(workspace){
 if(workspace?.version!==1||!['areas','program','courses','links'].every(k=>Array.isArray(workspace[k])))return false;
 const text=value=>typeof value==='string'&&value.trim().length>0;
 const unique=values=>new Set(values).size===values.length;
 const ids=records=>records.every(record=>record&&text(record.id))&&unique(records.map(record=>record.id));
 const bloomLevel=value=>bloom.some(([level])=>level===value);
 if(workspace.competencies!==undefined&&(!Array.isArray(workspace.competencies)||!ids(workspace.competencies)||!workspace.competencies.every(c=>text(c.text)&&['pending','agreed'].includes(c.status)&&Array.isArray(c.objectives)&&c.objectives.every(text)&&(c.status!=='agreed'||(text(c.responsible)&&text(c.date)&&text(c.reference))))||!workspace.program.every(r=>workspace.competencies.some(c=>c.id===r.competency))))return false;
 const groups=workspace.curriculum?.groups||[];
 if(!Array.isArray(groups)||!ids(groups)||!groups.every(group=>text(group.name)))return false;
 if(!ids(workspace.areas)||!workspace.areas.every(area=>text(area.name)))return false;
 if(!ids(workspace.program)||!workspace.program.length||!workspace.program.every(ra=>text(ra.text)&&text(ra.competency)&&bloomLevel(ra.level)))return false;
 function coursesValid(courses){
  return ids(courses)&&courses.every(course=>
   (course.details?.lists===undefined||(course.details.lists&&typeof course.details.lists==='object'&&!Array.isArray(course.details.lists)&&Object.values(course.details.lists).every(list=>Array.isArray(list)&&list.every(text))))&&
   (course.topics===undefined||(Array.isArray(course.topics)&&course.topics.every(t=>t&&text(t.title)&&Array.isArray(t.items)&&t.items.every(text))))&&
   text(course.name)&&workspace.areas.some(area=>area.id===course.area)&&
   Number.isInteger(course.semester)&&course.semester>0&&
   ((Number.isInteger(course.credits)&&course.credits>0)||(course.inStudyPlan===false&&course.credits===null))&&
   (course.inStudyPlan===undefined||typeof course.inStudyPlan==='boolean')&&
   (!course.curriculumGroup||groups.some(group=>group.id===course.curriculumGroup))&&
   (course.order===undefined||Number.isFinite(course.order))&&
   Array.isArray(course.outcomes)&&ids(course.outcomes)&&course.outcomes.every(outcome=>text(outcome.text)&&bloomLevel(outcome.level))
  );
 }
 function linksValid(links,courses){
  return Array.isArray(links)&&links.every(link=>
   link&&Object.hasOwn(levels,link.level)&&workspace.program.some(ra=>ra.id===link.ra)&&
   Array.isArray(link.outcomes)&&unique(link.outcomes)&&typeof link.why==='string'&&
   courses.some(course=>course.id===link.course&&link.outcomes.every(id=>course.outcomes.some(outcome=>outcome.id===id)))&&
   (link.level==='N'?link.outcomes.length===0:((link.outcomes.length>0&&(link.level==='P'||text(link.why)))||isSourceContribution(link)))
  )&&unique(links.map(link=>JSON.stringify([link.course,link.ra])));
 }
 if(workspace.documentation!==undefined){
  const criteria=workspace.documentation?.criteria;
  if(!criteria||typeof criteria!=='object'||Array.isArray(criteria)||!Object.values(criteria).every(r=>r&&['pending','agreed'].includes(r.status)&&['responsible','date','reference'].every(k=>typeof r[k]==='string')&&(r.status!=='agreed'||(r.responsible.trim()&&/^\d{4}-\d{2}-\d{2}$/.test(r.date)&&r.reference.trim()))))return false;
 }
 if(typeof validHistory==='function'&&!validHistory(workspace.history))return false;
 if(!coursesValid(workspace.courses)||!linksValid(workspace.links,workspace.courses))return false;
 const deleted=workspace.deletedCourses||[];
 if(!Array.isArray(deleted)||!deleted.every(record=>record?.course&&Array.isArray(record.links)))return false;
 const deletedCourses=deleted.map(record=>record.course);
 return coursesValid(deletedCourses)&&deletedCourses.every(course=>!workspace.courses.some(active=>active.id===course.id))&&deleted.every(record=>linksValid(record.links,[record.course]));
}
function readWorkspace(){
 const saved=localStorage.getItem(key);
 return saved===null?structuredClone(seed):parseWorkspace(saved);
}
function parseWorkspace(json){
 const workspace=decodeWorkspace(JSON.parse(json.replace(/^\uFEFF/,'')));
 if(!valid(workspace))throw Error('El archivo tiene datos o referencias de mapeo incompletos o inválidos.');
 return workspace;
}
function writeWorkspace(workspace){
 if(!valid(workspace))throw Error('Revisa los datos de las AC, sus créditos y las referencias de los cruces.');
 localStorage.setItem(key,JSON.stringify(workspace));
}
