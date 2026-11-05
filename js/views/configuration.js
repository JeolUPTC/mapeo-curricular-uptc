function configuration(){
 const tabs=[['areas','Áreas'],['courses','Actividades y asignaciones'],['program','RA del programa'],['structure','Estructura de malla'],['trash','Papelera']];
 const navigation='<div class="segmented" aria-label="Catálogos">'+tabs.map(([id,label])=>'<button type="button" data-config="'+id+'" aria-pressed="'+(configTab===id)+'" class="'+(configTab===id?'selected':'')+'">'+label+'</button>').join('')+'</div>';
 let content='';
 if(configTab==='structure')content=structureConfiguration();
 if(configTab==='trash')content=trashConfiguration();
 if(configTab==='source')content=sourceReview();
 if(configTab==='areas'){
  content='<div class="section-toolbar"><p>Define los equipos responsables de las actividades curriculares.</p>'+button('area','','+ Nueva área','class="primary"')+'</div><div class="area-grid">'+data.areas.map(a=>{
   const assigned=data.courses.filter(c=>c.area===a.id);
   return '<section class="area-card area-surface" style="--area-hue:'+areaHue(a.id)+'"><span class="eyebrow">Área académica</span><h3>'+esc(a.name)+'</h3><p>'+assigned.length+(assigned.length===1?' actividad · ':' actividades · ')+assigned.reduce((sum,c)=>sum+c.credits,0)+' créditos</p><div class="actions">'+button('assignment',a.id,'Asignar actividades')+button('area',a.id,'Editar nombre')+'</div></section>';
  }).join('')+'</div>';
 }
 if(configTab==='courses'){
  content='<div class="section-toolbar"><p>Cada actividad tiene un área responsable, un semestre y un número de créditos.</p>'+button('course','','+ Nueva AC','class="primary"')+'</div>'+filters()+'<div class="scroll"><table class="config-table"><thead><tr><th>Actividad curricular</th><th>Área responsable</th><th>Semestre</th><th>Créditos</th><th></th></tr></thead><tbody>'+courses().map(c=>'<tr><th scope="row">'+esc(c.name)+'</th><td>'+areaBadge(c.area)+'</td><td>'+c.semester+'</td><td>'+esc(c.credits??'—')+'</td><td>'+button('course',c.id,'Editar')+'</td></tr>').join('')+'</tbody></table></div>';
 }
 if(configTab==='program'){
  content='<p>Gestiona aquí los RA del programa.</p>'+button('open-program','','Abrir catálogo de RA');
 }
 return '<article class="card"><div class="page-title"><div><span class="eyebrow">Catálogos y relaciones</span><h2>Configuración</h2></div></div>'+navigation+content+'</article>';
}
document.addEventListener('click',event=>{
 const target=event.target.closest('[data-config]');
 if(!target)return;
 configTab=target.dataset.config;
 render();
});



function structureConfiguration(){
 const groups=data.curriculum?.groups||[],differences=mallaDifferences(data);
 return '<div class="section-toolbar"><p>Espacios, componentes y núcleos de Ajuste07092026. Las áreas responsables se asignan por separado.</p>'+button('curriculum-group','','+ Nueva agrupación','class="primary"')+'</div><div class="scroll"><table class="config-table"><thead><tr><th>Núcleo / agrupación</th><th>Componente</th><th>Espacio</th><th>AC</th><th></th></tr></thead><tbody>'+groups.map(group=>'<tr><th>'+esc(group.name)+'</th><td>'+esc(group.component||'Sin diligenciar')+'</td><td>'+esc(group.space||'Sin diligenciar')+'</td><td>'+data.courses.filter(c=>c.curriculumGroup===group.id).length+'</td><td>'+button('curriculum-group',group.id,'Editar')+'</td></tr>').join('')+'</tbody></table></div><details class="help-details"><summary>'+differences.length+' diferencias de valores con la malla de origen</summary><p>Se conservan los datos actuales. Revisa cada diferencia antes de adoptar un valor de Ajuste07092026.</p><table class="comparison-table"><thead><tr><th>Dato</th><th>Actual</th><th>Malla de origen</th><th></th></tr></thead><tbody>'+differences.map((difference,index)=>'<tr><th>'+esc(difference.label)+'</th><td>'+esc(difference.current??'Sin dato')+'</td><td>'+esc(difference.incoming??'Sin dato')+'</td><td>'+button('malla-source-change',String(index),'Revisar')+'</td></tr>').join('')+'</tbody></table></details>';
}
function trashConfiguration(){
 const deleted=data.deletedCourses||[];
 return '<p class="muted">Las AC retiradas conservan sus resultados de aprendizaje, sus cruces y justificaciones. Al restaurar se recuperan juntos.</p>'+(deleted.length?'<div class="ra-catalog">'+deleted.map(record=>'<section class="ra-record"><div><strong>'+esc(record.course.name)+'</strong><small>'+areaBadge(record.course.area)+' · Semestre '+record.course.semester+'</small></div><p>'+record.course.outcomes.length+' RA propios · '+record.links.length+' cruces</p>'+button('restore-course',record.course.id,'Restaurar')+'</section>').join('')+'</div>':'<div class="empty-state">La papelera está vacía.</div>');
}
