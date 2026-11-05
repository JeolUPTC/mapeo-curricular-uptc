let comparisonKind='competency',comparisonPae='C1',comparisonExcel='C1',comparisonTarget='C1';
function competencyNavigation(){return '<div class="segmented"><button type="button" data-competency-view="catalog" aria-pressed="'+(competencyView==='catalog')+'" class="'+(competencyView==='catalog'?'selected':'')+'">Catálogo</button><button type="button" data-competency-view="compare" aria-pressed="'+(competencyView==='compare')+'" class="'+(competencyView==='compare'?'selected':'')+'">Comparar y preparar ajustes</button></div>';}
function comparisonSources(){return comparisonKind==='competency'?{pae:competencySource.pae,excel:competencySource.competencies,current:data.competencies}: {...competencySource.programReferences,current:data.program};}
function comparisonView(){
 const sources=comparisonSources();
 const left=sources.pae.find(c=>c.id===comparisonPae)||sources.pae[0],right=sources.excel.find(c=>c.id===comparisonExcel)||sources.excel[0],current=sources.current.find(c=>c.id===comparisonTarget)||sources.current.find(c=>c.id===right.id)||sources.current[0];
 comparisonPae=left.id;comparisonExcel=right.id;comparisonTarget=current.id;
 const normalized=text=>text.replace(/\s+/g,' ').trim();
 const equal=normalized(left.text)===normalized(right.text);
 const panel=(type,record,options)=>'<section class="comparison-panel"><span class="eyebrow">'+(type==='pae'?'Texto de referencia':'Texto de trabajo')+'</span><label class="field">Texto a comparar<select id="comparison-'+type+'">'+options.map(c=>opt(c.id,c.id+' · '+c.text.slice(0,65)+(c.text.length>65?'…':''),record.id)).join('')+'</select></label><div class="comparison-text"><strong>'+esc(record.id)+'</strong><p>'+esc(record.text)+'</p></div><button type="button" data-prepare-adjustment="'+type+'">Preparar ajuste · '+(type==='pae'?'referencia':'trabajo')+'</button></section>';
 return '<article class="card"><div class="page-title"><div><span class="eyebrow">Diseño de la reforma</span><h2>Comparación de textos</h2></div></div>'+competencyNavigation()+'<div class="bar"><label>Comparar<select id="comparisonKind">'+opt('competency','Competencias',comparisonKind)+opt('program','RA del programa',comparisonKind)+'</select></label><label>Aplicar sobre el registro<select id="comparisonTarget">'+sources.current.map(c=>opt(c.id,c.id+' · '+c.text.slice(0,55)+'…',current.id)).join('')+'</select></label></div><p class="muted">Elige libremente los textos que quieras contrastar. El catálogo se modifica únicamente al aplicar un ajuste revisado.</p><div class="comparison-state">'+(equal?'Los enunciados seleccionados coinciden.':'Los enunciados seleccionados difieren. Puedes revisar ambos completos y elaborar la redacción que adoptará el equipo.')+'</div><div class="comparison-columns">'+panel('pae',left,sources.pae)+panel('excel',right,sources.excel)+'</div><section class="comparison-current"><h3>En trabajo · '+esc(current.id)+'</h3><p>'+esc(current.text)+'</p><small>Los códigos seleccionados no se emparejan automáticamente.</small></section>'+'</article>';
}
function markCompetencyLinksForReview(workspace,raIds){workspace.links.filter(l=>raIds.includes(l.ra)&&l.level!=='N').forEach(l=>l.level='P');}
function adoptComparisonText(workspace,kind,id,text,reference){
 const target=(kind==='competency'?workspace.competencies:workspace.program).find(c=>c.id===id);
 if(!target)throw Error('El registro de destino ya no existe.');
 if(target.text===text)return;
 target.revisions??=[];target.revisions.push({previousText:target.text,previousSource:target.source||'',text,reference,date:new Date().toISOString()});target.text=text;target.source='Ajuste de trabajo · '+reference;
 if(kind==='competency'){
  target.status='pending';target.responsible='';target.date='';target.reference='';
  markCompetencyLinksForReview(workspace,workspace.program.filter(r=>r.competency===id).map(r=>r.id));
 }else markCompetencyLinksForReview(workspace,[id]);
}
document.addEventListener('change',event=>{
 const id=event.target.id;
 if(id==='comparisonKind'){comparisonKind=event.target.value;comparisonPae='';comparisonExcel='';comparisonTarget='';}
 else if(id==='comparison-pae')comparisonPae=event.target.value;
 else if(id==='comparison-excel'){comparisonExcel=event.target.value;if(comparisonSources().current.some(c=>c.id===comparisonExcel))comparisonTarget=comparisonExcel;}
 else if(id==='comparisonTarget')comparisonTarget=event.target.value;
 else return;
 render();$(id)?.focus();
});
document.addEventListener('click',event=>{
 const view=event.target.closest('[data-competency-view]');if(view){competencyView=view.dataset.competencyView;render();return;}
 const prepare=event.target.closest('[data-prepare-adjustment]');if(!prepare)return;
 const sources=comparisonSources(),type=prepare.dataset.prepareAdjustment;
 const source=sources[type].find(c=>c.id===(type==='pae'?comparisonPae:comparisonExcel)),current=sources.current.find(c=>c.id===comparisonTarget);
 const reference=(type==='pae'?'Texto de referencia':'Texto de trabajo')+' · '+source.id;
 edit('Revisar ajuste para '+current.id,'<div class="comparison-columns"><section><h3>En trabajo</h3><p>'+esc(current.text)+'</p></section><section><h3>Punto de partida · '+esc(source.id)+'</h3><p>'+esc(source.text)+'</p></section></div>'+field('Redacción que se incorporará','<textarea name="adjustment" required>'+esc(source.text)+'</textarea>')+'<p class="form-note">Guardar incorpora esta redacción al registro '+esc(current.id)+'. El texto anterior se conserva en el historial JSON y los cruces afectados quedan por revisar. Esto no registra un acuerdo de aprobación.</p>',(form,draft)=>{
  const text=form.get('adjustment').trim();if(!text)throw Error('Escribe la redacción del ajuste.');adoptComparisonText(draft,comparisonKind,current.id,text,reference);
 });
});
