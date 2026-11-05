function matrix(){
 if(matrixView==='analysis')return analyticsView();
 let semester;
 const available=courses();
 const visible=available.filter(c=>semesterMatches(c)&&(!matrixSearch||sourceCourseName(c.name).includes(sourceCourseName(matrixSearch))));
 const contributions=data.links.filter(l=>visible.some(c=>c.id===l.course)&&l.level!=='N');
 const unsupported=contributions.filter(l=>l.level==='P'||!l.outcomes.length||!l.why).length;
 const rows=visible.map(c=>{
  const group=semester!==c.semester?'<tr class="group"><th colspan="'+(data.program.length+1)+'"><span>Semestre '+c.semester+'</span></th></tr>':'';
  semester=c.semester;
  return group+'<tr class="course-row"><th scope="row"><span>'+esc(c.name)+'</span><small>'+areaBadge(c.area)+' · '+c.credits+' créditos</small></th>'+data.program.map(r=>{
   const contribution=link(c.id,r.id);
   const level=contribution?.level??'';
   const state=contributionState(contribution);
   const label=state.level||'—';
   let info=level==='P'?'Aporte por revisar':level==='N'?'Revisado sin aporte':levels[level]||'Sin revisar';
   info=(state.level?levels[state.level]+' · ':'')+state.status+' · '+state.decision;
   return '<td>'+button('cross',c.id,label,'data-review-label="'+(state.code==='S'?'Por documentar':state.code==='P'?'Borrador':'')+'" class="chip '+(['I','R','A'].includes(level)?level:'quiet-cell')+'" data-ra="'+esc(r.id)+'" title="'+esc(info)+'" aria-label="'+esc(c.name+' · '+r.id+' · '+info)+'"')+'</td>';
  }).join('')+'</tr>';
 }).join('');
 const semesters=[...new Set(available.map(c=>c.semester))].sort((a,b)=>a-b);
 return '<article class="card matrix-card">'+matrixNavigation()+'<div class="page-title"><div><span class="eyebrow">Diseño del plan de estudios</span><h2>Matriz de contribución</h2></div><div class="legend">'+levelLegend()+'</div></div>'+
  '<div class="matrix-controls">'+filters()+semesterPicker()+'<label class="course-search"><span>Buscar AC</span><input id="matrixSearch" type="search" placeholder="Nombre de la actividad" value="'+esc(matrixSearch)+'"></label></div>'+
  kpiCards([[visible.length,'AC visibles'],[contributions.filter(l=>['I','R','A'].includes(l.level)).length,'Aportes con nivel'],[unsupported,'Aportes por documentar']])+
  '<div class="scroll matrix-scroll"><table class="mapping-table"><colgroup><col class="course-col">'+data.program.map(()=>'<col class="ra-col">').join('')+'</colgroup><thead><tr><th>Actividad curricular<small>Área responsable · créditos</small></th>'+data.program.map(r=>'<th scope="col" title="'+esc(r.text)+'">'+button('focus',r.id,r.id)+'<small>'+esc(r.level)+'</small></th>').join('')+'</tr></thead><tbody>'+(rows||'<tr><td colspan="'+(data.program.length+1)+'">No hay actividades para esta selección.</td></tr>')+'</tbody></table></div>'+
  '<details class="help-details"><summary>Cómo leer y completar la matriz</summary><p>I, R y A son los niveles de contribución. Selecciona una celda para registrar los RA propios de la AC y justificar el aporte. Las celdas sin nivel muestran un guion; su detalle distingue borrador, sin aporte y sin revisar. El aviso «Por documentar» señala soporte incompleto y no cambia el nivel.</p>'+demoNote+'</details></article>';
}
function levelLegend(){
 return '<span class="I">I <span>Introducción</span></span><span class="R">R <span>Refuerzo</span></span><span class="A">A <span>Avanzado</span></span>';
}
