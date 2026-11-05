function malla(){
 const all=courses();
 const visible=all.filter(course=>semesterMatches(course)&&(!mallaGroup||course.curriculumGroup===mallaGroup)&&(!mallaSearch||sourceCourseName(course.name).includes(sourceCourseName(mallaSearch))));
 const allSemesters=Array.from({length:Math.max(9,...data.courses.map(c=>c.semester))},(_,i)=>i+1);
 const semesters=allSemesters.filter(semester=>(!selectedSemesters.length||selectedSemesters.includes(String(semester)))&&(mallaShowEmpty||visible.some(c=>c.semester===semester)));
 const sum=visible.reduce((total,c)=>total+(c.credits??0),0),missing=visible.filter(c=>c.credits===null).length;
 const groups=data.curriculum?.groups||[];
 const filtersMarkup=filters()+semesterPicker()+'<label>Agrupación <select id="mallaGroup">'+opt('','Todas',mallaGroup)+groups.map(g=>opt(g.id,g.name+(g.component?' · '+g.component:''),mallaGroup)).join('')+'</select></label>'+
  '<label>Buscar <input id="mallaSearch" type="search" placeholder="Actividad curricular" value="'+esc(mallaSearch)+'"></label>';
 const lanes=semesters.map(semester=>{
  const activities=visible.filter(c=>c.semester===semester);
  const credits=activities.reduce((total,c)=>total+(c.credits??0),0);
  return '<section class="semester-lane" data-semester="'+semester+'" aria-label="Semestre '+semester+'"><header class="semester-heading"><div><span>SEMESTRE</span><h3>'+semester+'</h3></div><p>'+activities.length+' AC · '+credits+' cr.</p></header><div class="semester-cards">'+activities.map(course=>{
   const links=data.links.filter(l=>l.course===course.id&&l.level!=='N');
   const group=curriculumGroup(data,course.curriculumGroup);
   const p=course.hours?.presential,a=course.hours?.autonomous;
   return '<article class="plan-course" draggable="true" data-course="'+esc(course.id)+'" style="--area-hue:'+areaHue(course.area)+'" aria-label="'+esc(course.name)+'"><span class="plan-area">'+esc(areaName(course.area))+'</span><h4>'+esc(course.name)+'</h4><p class="plan-metrics"><strong>'+esc(course.credits??'—')+' <span>créditos</span></strong><span>'+(p??'—')+' P · '+(a??'—')+' A</span></p><p class="plan-group" title="'+esc(group?.component)+'">'+esc(group?.name||'Por ubicar')+'</p><div class="plan-course-footer"><span>'+course.outcomes.length+' RA propios · '+links.length+' aportes</span><div>'+button('course',course.id,'Editar')+button('move-course',course.id,'Mover')+button('design-course',course.id,'RA y vínculos')+'</div></div></article>';
  }).join('')+'</div>'+button('new-course',String(semester),'+ Agregar AC','class="add-course"')+'</section>';
 }).join('');
 return '<article class="card malla-card"><div class="page-title"><div><span class="eyebrow">Diseño y distribución del plan</span><h2>Malla del programa</h2></div><div class="actions">'+button('course','','+ Nueva AC','class="primary"')+'<button type="button" id="exportMalla">Exportar Excel</button></div></div>'+
  '<div class="malla-controls">'+filtersMarkup+'</div>'+kpiCards([[visible.length,'Actividades visibles'],[sum,'Créditos'],[semesters.length,'Semestres visibles'],[missing,'AC sin créditos']])+'<div class="malla-toolbar"><div><label><input id="mallaShowEmpty" type="checkbox" '+(mallaShowEmpty?'checked':'')+'> Mostrar semestres vacíos</label><label><input id="mallaCompact" type="checkbox" '+(mallaCompact?'checked':'')+'> Vista compacta</label></div></div>'+
  (lastMove?'<div class="move-notice" role="status">'+esc(lastMove.name)+' movida a semestre '+lastMove.semester+'. <button type="button" id="undoMove">Deshacer</button></div>':'')+
  '<p class="malla-instruction">Arrastra una tarjeta a otro semestre o usa Mover. Editar abre los datos, contenidos y horas de la misma AC que utiliza la matriz.</p>'+
  '<div class="malla-scroll"><div class="semester-board '+(mallaCompact?'compact':'')+'" style="--semester-count:'+Math.max(1,semesters.length)+'">'+(lanes||'<p class="muted">No hay actividades con estos filtros.</p>')+'</div></div><p class="malla-footnote">P = horas presenciales · A = horas autónomas. Los créditos fuera del plan se consultan con el filtro Ubicación.</p></article>';
}
$('screen').addEventListener('dragstart',event=>{
 const card=event.target.closest('[data-course][draggable]');
 if(!card)return;
 event.dataTransfer.setData('text/plain',card.dataset.course);
 event.dataTransfer.effectAllowed='move';card.classList.add('dragging');
});
$('screen').addEventListener('dragend',()=>{
 document.querySelectorAll('.dragging,.drop-target').forEach(node=>node.classList.remove('dragging','drop-target'));
});
$('screen').addEventListener('dragover',event=>{
 const lane=event.target.closest('.semester-lane');
 if(!lane)return;
 event.preventDefault();event.dataTransfer.dropEffect='move';lane.classList.add('drop-target');
});
$('screen').addEventListener('dragleave',event=>{
 const lane=event.target.closest('.semester-lane');
 if(lane&&!lane.contains(event.relatedTarget))lane.classList.remove('drop-target');
});
$('screen').addEventListener('drop',event=>{
 const lane=event.target.closest('.semester-lane');
 if(!lane)return;
 event.preventDefault();
 const id=event.dataTransfer.getData('text/plain'),semester=Number(lane.dataset.semester);
 const course=data.courses.find(c=>c.id===id);if(!course)return;
 const previous={semester:course.semester,order:course.order};
 const draft=structuredClone(data);
 if(moveCourse(draft,id,semester)){
  commit(draft);
  lastMove={id,name:course.name,semester,previous};
  render();
 }
});
document.addEventListener('click',event=>{
 if(event.target.id==='undoMove'&&lastMove){
  const move=lastMove,draft=structuredClone(data),course=draft.courses.find(c=>c.id===move.id);
  if(course){course.semester=move.previous.semester;course.order=move.previous.order;commit(draft);render();}
 }
 if(event.target.id==='exportMalla')runOfficeExport(event.target,()=>exportExcel(data));
});

