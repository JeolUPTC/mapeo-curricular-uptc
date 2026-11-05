let competencyQuery='',competencyView='catalog';
function competencies(){
 if(competencyView==='compare')return comparisonView();
 const catalog=data.competencies||[];
 const visible=catalog.filter(c=>(c.id+' '+c.text).toLocaleLowerCase('es').includes(competencyQuery.toLocaleLowerCase('es')));
 return '<article class="card"><div class="page-title"><div><span class="eyebrow">Capacidades que orientan la formación</span><h2>Competencias del programa</h2></div><button type="button" data-competency-edit="">+ Nueva competencia</button></div>'+competencyNavigation()+'<label class="field">Buscar competencia<input id="competencyQuery" type="search" value="'+esc(competencyQuery)+'" placeholder="Código o enunciado"></label><div class="competency-grid">'+visible.map(c=>{
  const ras=data.program.filter(r=>r.competency===c.id);
  return '<section class="competency-record"><div class="section-toolbar"><h3>'+esc(c.id)+'</h3><span class="count-pill">'+ras.length+' RA asociados</span></div><p>'+esc(c.text)+'</p><p class="meta">Objetivos: '+esc((c.objectives||[]).join(', ')||'Por relacionar')+'</p><div class="actions"><button type="button" data-competency-edit="'+esc(c.id)+'">Editar competencia</button>'+ras.map(r=>button('program',r.id,r.id+' · Editar vínculo')).join('')+button('program-new',c.id,'+ Nuevo RA')+button('competency-ras',c.id,'Asignar RA')+'</div><details class="help-details"><summary>Acuerdos del equipo</summary><p>'+esc(c.status==='agreed'?'Acuerdo registrado':'Sin acuerdo registrado')+'</p><p>'+esc([c.responsible,c.date,c.reference].filter(Boolean).join(' · '))+'</p></details></section>';
 }).join('')+'</div></article>';
}
document.addEventListener('input',event=>{
 if(event.target.id!=='competencyQuery')return;competencyQuery=event.target.value;const cursor=event.target.selectionStart;render();$('competencyQuery').focus();$('competencyQuery').setSelectionRange(cursor,cursor);
});
document.addEventListener('click',event=>{
 const target=event.target.closest('[data-competency-edit]');if(!target)return;
 const current=data.competencies?.find(c=>c.id===target.dataset.competencyEdit);
 edit(current?'Editar '+current.id:'Nueva competencia',field('Código','<input name="code" required value="'+esc(current?.id)+'" '+(current?'readonly':'')+'>')+field('Enunciado','<textarea name="text" required>'+esc(current?.text)+'</textarea>')+field('Objetivos relacionados (separados por coma)','<input name="objectives" value="'+esc(current?.objectives?.join(', '))+'" placeholder="O1, O2">')+field('Estado','<select name="status">'+opt('pending','Pendiente de validar',current?.status||'pending')+opt('agreed','Acuerdo registrado',current?.status)+'</select>')+field('Responsable','<input name="responsible" value="'+esc(current?.responsible)+'">')+field('Fecha','<input type="date" name="date" value="'+esc(current?.date)+'">')+field('Acta / referencia','<textarea name="reference">'+esc(current?.reference)+'</textarea>')+'<p class="form-note">Cambiar el enunciado deja sus cruces pendientes de revisión; no cambia el texto de los RA del programa.</p>',(form,draft)=>{
  const values={id:form.get('code').trim(),text:form.get('text').trim(),objectives:form.get('objectives').split(',').map(s=>s.trim()).filter(Boolean),status:form.get('status'),responsible:form.get('responsible').trim(),date:form.get('date'),reference:form.get('reference').trim()};
  if(!values.id||!values.text)throw Error('Completa código y enunciado.');
  if(!current&&draft.competencies.some(c=>c.id===values.id))throw Error('Ese código ya existe.');
  if(values.status==='agreed'&&(!values.responsible||!values.date||!values.reference))throw Error('Un acuerdo requiere responsable, fecha y referencia.');
  if(current){
   Object.assign(draft.competencies.find(c=>c.id===current.id),values);
   if(current.text!==values.text){const ras=draft.program.filter(r=>r.competency===current.id).map(r=>r.id);draft.links.filter(l=>ras.includes(l.ra)&&l.level!=='N').forEach(l=>l.level='P');}
  }else draft.competencies.push({...values,source:'Registro del equipo',proposals:[]});
 });
});
