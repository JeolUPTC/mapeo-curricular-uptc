let graphScope='full';
function graph(){
 const available=courses().filter(semesterMatches),source=available.find(c=>c.id===graphCourse),activities=graphScope==='program'?[]:source?[source]:available;
 const results=focus?data.program.filter(r=>r.id===focus):data.program;
 const competencies=graphScope==='program'&&!focus?data.competencies:data.competencies.filter(c=>results.some(r=>r.competency===c.id));
 const rows=[],groups=activities.map(c=>{
  const start=rows.length;
  for(const [index,o] of c.outcomes.entries())rows.push({c,o,index,y:96+rows.length*90});
  if(!c.outcomes.length)rows.push({c,o:null,y:96+rows.length*90});
  return {c,y:(rows[start].y+rows.at(-1).y)/2};
 });
 const height=Math.max(270,rows.length*90+100,results.length*90+100,competencies.length*90+100);
 const position=(index,count)=>count===1?height/2:96+index*(height-160)/Math.max(1,count-1);
 const programX=graphScope==='program'?100:610,competencyX=graphScope==='program'?550:810;
 const width=graphScope==='program'?900:1050;
 const node=(type,x,y,label,info,attrs,hue)=>'<button type="button" class="network-node '+type+'" style="left:'+x+'px;top:'+y+'px;'+(hue===undefined?'':'--area-hue:'+hue)+'" data-info="'+esc(info)+'" '+attrs+'>'+label+'</button>';
 const edges=[];
 for(const {c,o,y} of rows){
  if(!o)continue;
  const group=groups.find(g=>g.c.id===c.id);
  edges.push('<path class="ownership" d="M198 '+group.y+' C218 '+group.y+' 228 '+y+' 250 '+y+'"/>');
  for(const [index,ra] of results.entries()){
   const contribution=link(c.id,ra.id);if(!contribution?.outcomes.includes(o.id))continue;
   const label=c.name+' · RA de la AC '+(c.outcomes.indexOf(o)+1)+' → '+ra.id+' · '+levels[contribution.level];
   edges.push('<path class="mapping-edge edge-'+contribution.level+'" tabindex="0" role="button" aria-label="'+esc('Editar cruce '+label)+'" data-action="cross" data-id="'+esc(c.id)+'" data-ra="'+esc(ra.id)+'" d="M470 '+y+' C525 '+y+' 555 '+position(index,results.length)+' '+programX+' '+position(index,results.length)+'"><title>'+esc(label)+'</title></path>');
  }
 }
 for(const [index,ra] of results.entries()){
  const ci=competencies.findIndex(c=>c.id===ra.competency);if(ci<0)continue;
  const y=position(index,results.length),cy=position(ci,competencies.length),end=programX+(graphScope==='program'?220:110);
  edges.push('<path class="competency-edge mapping-edge" tabindex="0" role="button" aria-label="Editar vínculo '+esc(ra.id+' con '+ra.competency)+'" data-graph-ra="'+esc(ra.id)+'" d="M'+end+' '+y+' C'+(end+45)+' '+y+' '+(competencyX-50)+' '+cy+' '+competencyX+' '+cy+'"><title>'+esc(ra.id+' → '+ra.competency)+'</title></path>');
 }
 const activityNodes=groups.map(({c,y})=>node('activity',8,y,esc(c.name)+'<small>'+esc(areaName(c.area))+'</small>','Semestre '+c.semester+' · '+areaName(c.area),'data-action="course" data-id="'+esc(c.id)+'"',areaHue(c.area))).join('');
 const outcomeNodes=rows.map(({c,o,index,y})=>node('outcome',250,y,o?'<strong>RA de la AC '+(index+1)+'</strong><small>'+esc(o.text.length>62?o.text.slice(0,61)+'…':o.text)+'</small>':'+ Crear RA de la AC',c.name+' · '+(o?o.text+' · Bloom: '+o.level:'Sin RA propios'),'data-action="outcome" data-id="'+esc(c.id)+'"'+(o?' data-outcome="'+esc(o.id)+'"':''),areaHue(c.area))).join('');
 const programNodes=results.map((r,index)=>node('program',programX,position(index,results.length),esc(r.id)+'<small>'+esc(r.competency)+' · Ver vínculos</small>',r.text+' · Competencia: '+competencyDescription(data,r.competency),'data-program="'+esc(r.id)+'"')).join('');
 const competencyNodes=competencies.map((c,index)=>node('competency',competencyX,position(index,competencies.length),'<strong>'+esc(c.id)+'</strong><small>'+esc(c.text.length>57?c.text.slice(0,56)+'…':c.text)+'</small>',c.text+' · RA: '+data.program.filter(r=>r.competency===c.id).map(r=>r.id).join(', '),'data-graph-competency="'+esc(c.id)+'"')).join('');
 const pairs=activities.flatMap(c=>results.flatMap(r=>{const contribution=link(c.id,r.id);return contribution&&contribution.level!=='N'?[{c,r,contribution}]:[];}));
 return '<article class="card"><h2>Mapa de resultados y competencias</h2><p class="muted">Pulsa una competencia o una línea RA → competencia para editar sus vínculos. Las líneas AC → RA del programa permiten revisar I/R/A y su justificación.</p><div class="bar"><label>Vista<select id="graphScope">'+opt('full','Mapa completo',graphScope)+opt('program','RA del programa y competencias',graphScope)+'</select></label><label>RA del programa<select id="raFilter">'+opt('','Todos',focus)+data.program.map(r=>opt(r.id,r.id,focus)).join('')+'</select></label></div>'+(graphScope==='full'?filters()+'<div class="bar"><label>Actividad<select id="graphCourse">'+opt('','Todas',graphCourse)+available.map(c=>opt(c.id,c.name,graphCourse)).join('')+'</select></label>'+(source?button('outcome',source.id,'+ RA de la actividad'):'')+'</div>':'')+
 '<div class="graph-toolbar"><div class="layer-legend">'+(graphScope==='full'?'<span class="activity">Actividad</span><span class="outcome">RA de la AC</span>':'')+'<span class="program">RA del programa</span><span class="competency">Competencia</span></div>'+(graphScope==='full'?'<div class="legend">'+levelLegend()+'</div>':'<span class="meta">Los vínculos con competencias no tienen nivel I/R/A.</span>')+'</div><div id="nodeInfo" class="network-detail" aria-live="polite">Pasa el puntero o usa Tab para consultar el enunciado completo de cada nodo.</div><div class="scroll"><div class="network four-layers '+(graphScope==='program'?'program-only':'')+'" style="height:'+height+'px;width:'+width+'px;min-width:'+width+'px">'+(graphScope==='full'?'<div class="network-heading" style="left:8px">ACTIVIDAD</div><div class="network-heading" style="left:250px">RA DE LA AC</div>':'')+'<div class="network-heading" style="left:'+programX+'px">RA DEL PROGRAMA</div><div class="network-heading" style="left:'+competencyX+'px">COMPETENCIA</div><svg width="'+width+'" height="'+height+'" aria-label="Vínculos de resultados y competencias">'+edges.join('')+'</svg>'+activityNodes+outcomeNodes+programNodes+competencyNodes+'</div></div><div id="programActions"></div>'+(pairs.length?'<details><summary>Cruces y justificaciones ('+pairs.length+')</summary><ul class="cross-list">'+pairs.map(({c,r,contribution})=>'<li>'+button('cross',c.id,c.name+' × '+r.id+' · '+(contribution.level==='P'?'Revisar':contribution.level),'data-ra="'+esc(r.id)+'"')+'</li>').join('')+'</ul></details>':'')+'</article>';
}

function showNode(event){
 const node=event.target.closest('[data-info]');
 const info=$('nodeInfo');
 if(!node||!info)return;
 info.innerHTML='<strong>'+esc(node.textContent)+'</strong> · '+esc(node.dataset.info);
}
for(const event of ['pointerover','focusin'])$('screen').addEventListener(event,showNode);
$('screen').addEventListener('click',event=>{
 const node=event.target.closest('[data-program]');
 if(!node)return;
 const ra=data.program.find(r=>r.id===node.dataset.program);
 const visible=courses().filter(c=>!graphCourse||c.id===graphCourse);
 $('programActions').innerHTML='<section class="branch"><h3>'+esc(ra.id)+'</h3><p>'+esc(ra.text)+'</p><p>Competencia: '+esc(competencyDescription(data,ra.competency))+'</p><button type="button" data-graph-ra="'+esc(ra.id)+'">Editar vínculo con competencia</button><p>Selecciona una actividad para editar su cruce.</p><div class="actions">'+visible.map(c=>button('cross',c.id,c.name+' · '+(levels[link(c.id,ra.id)?.level]||'Sin revisar'),'data-ra="'+esc(ra.id)+'"')).join('')+'</div></section>';
 showNode(event);
});
$('screen').addEventListener('keydown',event=>{
 const edge=event.target.closest('path[data-action],path[data-graph-ra]');
 if(edge&&['Enter',' '].includes(event.key)){
  event.preventDefault();
  if(edge.dataset.graphRa)editProgramCompetency(edge.dataset.graphRa);else formFor('cross',edge.dataset.id,edge.dataset.ra);
 }
});


$('screen').addEventListener('change',event=>{if(event.target.id==='graphScope'){graphScope=event.target.value;render();}});
