function courseNumberInput(name,value,optional=false){
 return '<input name="'+name+'" type="number" min="1" step="1" value="'+esc(value??'')+'" '+(optional?'':'required')+'>';
}
function openCourseEditor(course,defaults={}){
 const groups=data.curriculum?.groups||[];
 const defaultArea=course?.area||defaults.area||area||data.areas.find(a=>a.id==='unassigned')?.id||data.areas[0]?.id;
 const inPlan=course?course.inStudyPlan!==false:defaults.inStudyPlan!==false;
 const group=course?.curriculumGroup||defaults.group||'';
 const fields=field('Nombre',input('name',course?.name))+
  '<div class="course-form-grid">'+field('Área responsable','<select name="area">'+data.areas.map(a=>opt(a.id,a.name,defaultArea)).join('')+'</select>')+
  field('Semestre',courseNumberInput('semester',course?.semester??defaults.semester??1))+
  field('Créditos',courseNumberInput('credits',course?.credits??(course?null:3),true))+
  field('Ubicación','<select name="inStudyPlan">'+opt('yes','Dentro del plan',inPlan?'yes':'no')+opt('no','Fuera del plan',inPlan?'yes':'no')+'</select>')+'</div>'+
  field('Núcleo / agrupación de la malla','<select name="curriculumGroup">'+opt('','Por ubicar',group)+groups.map(g=>opt(g.id,g.name+(g.component?' · '+g.component:''),group)).join('')+'</select>')+
  courseAutoSummary(course)+topicsForm(course)+courseDocumentForm(course)+
  (course?'<details class="help-details"><summary>Retirar actividad del plan de trabajo</summary><p>La AC y sus cruces pueden recuperarse desde la papelera de Configuración.</p>'+button('archive-course',course.id,'Retirar AC','class="danger-button"')+'</details>':'');
 edit(course?'Editar actividad curricular':'Nueva actividad curricular',fields,(form,draft)=>{
  const rawCredits=form.get('credits').trim();
  const inStudyPlan=form.get('inStudyPlan')==='yes';
  const credits=rawCredits===''?null:Number(rawCredits);
  if(inStudyPlan&&credits===null)throw Error('Registra los créditos para incluir la AC dentro del plan.');
  if(credits!==null&&(!Number.isInteger(credits)||credits<1))throw Error('Los créditos deben ser enteros positivos.');
  const values={name:form.get('name').trim(),area:form.get('area'),semester:Number(form.get('semester')),credits,inStudyPlan,curriculumGroup:form.get('curriculumGroup'),...readTopics(),...readCourseDocumentForm(form,course)};
  if(draft.courses.some(c=>c.id!==course?.id&&c.semester===values.semester&&(c.inStudyPlan!==false)===inStudyPlan&&c.name.localeCompare(values.name,'es',{sensitivity:'base'})===0))throw Error('Ya existe una AC con este nombre en el semestre elegido.');
  if(course)Object.assign(draft.courses.find(c=>c.id===course.id),values);
  else draft.courses.push({id:uid(),outcomes:[],order:Math.max(0,...draft.courses.map(c=>c.order??c.sourceNumber??0))+1,...values});
 }); synchronizeCourseHours();
}
function curriculumAction(action,id){
 if(action==='design-course'){graphCourse=id;focus='';tab='graph';render();return true;}
 if(action==='new-course'){
  openCourseEditor(undefined,{semester:Number(id)||1,area,group:mallaGroup,inStudyPlan:planScope!=='outside'});
  return true;
 }
 if(action==='move-course'){
  const course=data.courses.find(c=>c.id===id);
  edit('Mover '+course.name,'<p>Sus RA y cruces se conservan al mover la actividad.</p>'+field('Semestre de destino',courseNumberInput('semester',course.semester))+field('Área responsable','<select name="area">'+data.areas.map(a=>opt(a.id,a.name,course.area)).join('')+'</select>')+field('Núcleo / agrupación','<select name="group">'+opt('','Por ubicar',course.curriculumGroup)+(data.curriculum?.groups||[]).map(g=>opt(g.id,g.name,course.curriculumGroup)).join('')+'</select>'),(form,draft)=>{
   moveCourse(draft,id,Number(form.get('semester')));
   const moved=draft.courses.find(c=>c.id===id);
   moved.area=form.get('area');moved.curriculumGroup=form.get('group');
  });
  return true;
 }
 if(action==='archive-course'){
  const course=data.courses.find(c=>c.id===id);
  const count=data.links.filter(l=>l.course===id).length;
  if($('editor').open)$('editor').close();
  edit('Retirar actividad', '<p><strong>'+esc(course.name)+'</strong></p><p>La AC y sus '+count+' cruces se retirarán de las vistas activas y se guardarán en la papelera. Podrás restaurarlos juntos.</p>',(form,draft)=>archiveCourse(draft,id));
  return true;
 }
 if(action==='restore-course'){
  const record=data.deletedCourses.find(record=>record.course.id===id);
  edit('Restaurar actividad','<p>'+esc(record.course.name)+' · '+record.links.length+' cruces</p>',(form,draft)=>restoreCourse(draft,id));
  return true;
 }
 if(action==='curriculum-group'){
  const group=data.curriculum?.groups.find(g=>g.id===id);
  edit(group?'Editar agrupación':'Nueva agrupación de la malla',field('Nombre del núcleo / agrupación',input('name',group?.name))+field('Componente de formación','<input name="component" value="'+esc(group?.component)+'">')+field('Espacio de formación','<input name="space" value="'+esc(group?.space)+'">'),(form,draft)=>{
   draft.curriculum??={groups:[]};
   const values={name:form.get('name').trim(),component:form.get('component').trim(),space:form.get('space').trim()};
   if(!values.name)throw Error('Registra el nombre de la agrupación.');
   if(group)Object.assign(draft.curriculum.groups.find(g=>g.id===id),values);else draft.curriculum.groups.push({id:uid(),...values});
  });
  return true;
 }
 if(action==='malla-source-change'){
  const difference=mallaDifferences(data)[Number(id)];
  edit('Revisar dato de Ajuste07092026','<p>'+esc(difference.label)+'</p><div class="merge-compare"><div><strong>Actual</strong><p>'+esc(difference.current??'Sin dato')+'</p></div><div><strong>Malla de origen</strong><p>'+esc(difference.incoming??'Sin dato')+'</p></div></div>',(form,draft)=>{
   const course=draft.courses.find(c=>c.id===difference.course);
   if(['presential','autonomous'].includes(difference.field)){
    course.hours??={};course.hours[difference.field]=difference.incoming;
    course.hours.total=typeof course.hours.presential==='number'&&typeof course.hours.autonomous==='number'?course.hours.presential+course.hours.autonomous:null;
   }else course[difference.field]=difference.incoming;
  });
  return true;
 }
 return false;
}


