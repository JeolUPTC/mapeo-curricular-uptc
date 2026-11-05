const analysisLevels=['I','R','A','P','N','U'];
const analysisNames={I:'Introducción',R:'Refuerzo',A:'Avanzado',P:'Por revisar',N:'Sin aporte',U:'Sin revisar'};
const analysisColors={I:'#d5b75f',R:'#e5a900',A:'#526a9c',P:'#a181bc',N:'#8c999b',U:'#c3c9d0'};
let matrixView='table',analysisKind='ra',analysisBasis='classified',analysisSelection=null;
function matrixNavigation(){return '<div class="segmented"><button type="button" data-matrix-view="table" class="'+(matrixView==='table'?'selected':'')+'" aria-pressed="'+(matrixView==='table')+'">Matriz</button><button type="button" data-matrix-view="analysis" class="'+(matrixView==='analysis'?'selected':'')+'" aria-pressed="'+(matrixView==='analysis')+'">Análisis</button></div>';}
function contributionStatistics(workspace,activities){
 const state=(c,r)=>workspace.links.find(l=>l.course===c.id&&l.ra===r.id)?.level||'U';
 const counts=values=>Object.fromEntries(analysisLevels.map(level=>[level,values.filter(v=>v===level).length]));
 return {byRA:workspace.program.map(r=>({id:r.id,text:r.text,counts:counts(activities.map(c=>state(c,r)))})),byAC:activities.map(c=>({id:c.id,name:c.name,area:c.area,semester:c.semester,counts:counts(workspace.program.map(r=>state(c,r)))}))};
}
function analyticsView(){
 const activities=courses().filter(c=>semesterMatches(c)&&(!matrixSearch||sourceCourseName(c.name).includes(sourceCourseName(matrixSearch))));
 const stats=contributionStatistics(data,activities),total=activities.length*data.program.length;
 const classified=stats.byRA.reduce((n,r)=>n+r.counts.I+r.counts.R+r.counts.A,0);
 const states=activities.flatMap(c=>data.program.map(r=>({c,r,l:link(c.id,r.id),...contributionState(link(c.id,r.id))})));
 const stateCodes=['D','S','P','N','U'],stateNames={D:'Documentado',S:'Soporte pendiente',P:'Borrador',N:'Revisado · sin aporte',U:'Sin revisar'};
 const rows=analysisKind==='ac'?stats.byAC:stats.byRA;
 const choose=(id,level)=>'data-analysis-id="'+esc(id)+'" data-analysis-level="'+level+'"';
 let content='';
 if(analysisKind==='heatmap'){
  content='<div class="scroll"><table class="heatmap"><caption>Nivel de contribución · pulsa una celda para editar</caption><thead><tr><th>Actividad curricular</th>'+data.program.map(r=>'<th title="'+esc(r.text)+'">'+esc(r.id)+'</th>').join('')+'</tr></thead><tbody>'+activities.map(c=>'<tr><th>'+esc(c.name)+areaBadge(c.area)+'</th>'+data.program.map(r=>{const state=contributionState(link(c.id,r.id));return '<td>'+button('cross',c.id,state.level||'—','class="heat-cell '+(state.level||'')+'" data-ra="'+esc(r.id)+'" aria-label="'+esc(c.name+' · '+r.id+' · '+(state.level||state.status))+'" title="'+esc(state.status+' · '+state.decision)+'"')+'</td>';}).join('')+'</tr>').join('')+'</tbody></table></div>';
 }else if(analysisKind==='progress'){
  content='<p class="form-note">Avance de revisión y documentación, independiente del nivel I/R/A. La decisión «sin aporte» se muestra como tal; no es un nivel.</p><div class="progress-grid">'+stateCodes.map(code=>{const count=states.filter(s=>s.code===code).length,percent=total?100*count/total:0;return '<section class="progress-card"><h3>'+stateNames[code]+'</h3><strong>'+count+' <small>· '+percent.toFixed(1)+'%</small></strong><meter min="0" max="'+(total||1)+'" value="'+count+'">'+percent.toFixed(1)+'%</meter><button data-review-state="'+code+'">Ver relaciones</button></section>';}).join('')+'</div>';
 }else{
  content='<div class="analysis-grid '+(analysisKind==='ac'?'by-ac':'')+'">'+rows.map(row=>{
   const denominator=row.counts.I+row.counts.R+row.counts.A;let offset=0;
   const arcs=['I','R','A'].filter(l=>row.counts[l]).map(l=>{const share=row.counts[l]/denominator*100;const arc='<circle cx="60" cy="60" r="43" fill="none" stroke="'+analysisColors[l]+'" stroke-width="15" pathLength="100" stroke-dasharray="'+share+' '+(100-share)+'" stroke-dashoffset="'+(-offset)+'" transform="rotate(-90 60 60)"/>';offset+=share;return arc;}).join('');
   const legend='<div class="analysis-legend">'+['I','R','A'].map(l=>'<button '+choose(row.id,l)+' '+(!row.counts[l]?'disabled':'')+'><i style="background:'+analysisColors[l]+'"></i><span>'+analysisNames[l]+'</span><strong>'+row.counts[l]+' · '+(denominator?100*row.counts[l]/denominator:0).toFixed(1)+'%</strong></button>').join('')+'</div>';
   return '<section class="analysis-chart"><h3>'+esc(analysisKind==='ra'?row.id:row.name)+'</h3>'+(analysisKind==='ra'?'<p class="chart-statement" title="'+esc(row.text)+'">'+esc(row.text)+'</p>':areaBadge(row.area)+'<p>Semestre '+row.semester+'</p>')+(analysisKind==='ra'?'<svg class="donut" viewBox="0 0 120 120" role="img" aria-label="Distribución I/R/A de '+esc(row.id)+'"><circle cx="60" cy="60" r="43" fill="none" stroke="var(--line)" stroke-width="15"/>'+arcs+'<text x="60" y="58" text-anchor="middle">'+denominator+'</text><text x="60" y="74" class="donut-caption" text-anchor="middle">con nivel</text></svg>':'<div class="ac-stacked-bar">'+['I','R','A'].filter(l=>row.counts[l]).map(l=>'<button '+choose(row.id,l)+' style="flex:'+row.counts[l]+';background:'+analysisColors[l]+';color:'+ (l==='A'?'#fff':'#101820')+'">'+l+' · '+row.counts[l]+'</button>').join('')+'</div>')+legend+'<p class="meta">'+denominator+' relaciones con nivel. Revisión y documentación en «Avance del trabajo».</p></section>';
  }).join('')+'</div>';
 }
 let detail='';
 if(analysisSelection&&analysisSelection.kind===analysisKind){
  const sel=analysisSelection;
  const matches=states.filter(s=>sel.state?s.code===sel.state:s.level===sel.level&&(analysisKind==='ra'?s.r.id===sel.id:s.c.id===sel.id));
  detail='<section id="analysisDetail" tabindex="-1" class="analysis-detail"><div class="section-toolbar"><h3>'+esc(sel.state?stateNames[sel.state]:sel.id+' · '+analysisNames[sel.level])+'</h3><button id="closeAnalysisDetail">Cerrar detalle</button></div><p>'+matches.length+' relaciones</p><div class="scroll"><table><thead><tr><th>AC</th><th>RA</th><th>Nivel</th><th>Revisión / decisión</th><th>Justificación</th><th></th></tr></thead><tbody>'+matches.map(s=>'<tr><th>'+esc(s.c.name)+'</th><td>'+esc(s.r.id)+'</td><td>'+esc(s.level||'—')+'</td><td>'+esc(s.status+' · '+s.decision)+'</td><td class="analysis-why">'+esc(s.l?.why||'Por documentar')+'</td><td>'+button('cross',s.c.id,'Revisar cruce','data-ra="'+esc(s.r.id)+'"')+'</td></tr>').join('')+'</tbody></table></div></section>';
 }
 return '<article class="card"><div class="page-title"><div><span class="eyebrow">Lectura del diseño curricular</span><h2>Análisis de contribución</h2></div>'+matrixNavigation()+'</div><div class="matrix-controls">'+filters()+semesterPicker()+'<label>Buscar AC<input id="matrixSearch" type="search" value="'+esc(matrixSearch)+'"></label></div>'+kpiCards([[activities.length,'AC visibles'],[total,'Relaciones AC × RA','Cada AC visible se cruza con cada RA del programa'],[classified,'Aportes con nivel I/R/A'],[states.filter(s=>s.code==='D').length,'Aportes documentados']])+'<div class="bar"><label>Visualización<select id="analysisKind">'+opt('ra','Anillos · niveles por RA',analysisKind)+opt('ac','Barras · niveles por AC',analysisKind)+opt('heatmap','Mapa de calor · AC × RA',analysisKind)+opt('progress','Avance del trabajo',analysisKind)+'</select></label></div><p class="form-note">Los porcentajes I/R/A usan únicamente aportes con nivel. Describen oportunidades formativas, no el logro de los estudiantes. Selecciona la leyenda para consultar los aportes.</p>'+detail+(activities.length?content:'<p class="empty-state">No hay AC con estos filtros.</p>')+'</article>';
}
document.addEventListener('click',e=>{
 const view=e.target.closest('[data-matrix-view]');if(view){matrixView=view.dataset.matrixView;render();return;}
 const segment=e.target.closest('[data-analysis-level]');if(segment){analysisSelection={kind:analysisKind,id:segment.dataset.analysisId,level:segment.dataset.analysisLevel};render();$('analysisDetail')?.focus();}
 const state=e.target.closest('[data-review-state]');if(state){analysisSelection={kind:analysisKind,state:state.dataset.reviewState};render();$('analysisDetail')?.focus();}
 if(e.target.id==='closeAnalysisDetail'){analysisSelection=null;render();}
});
document.addEventListener('change',e=>{if(e.target.id==='analysisKind'){analysisKind=e.target.value;analysisSelection=null;render();}});
