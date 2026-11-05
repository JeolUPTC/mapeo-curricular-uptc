function setProgramCompetency(workspace,raId,competencyId){
 const ra=workspace.program.find(r=>r.id===raId);
 if(!ra||!workspace.competencies.some(c=>c.id===competencyId))throw Error('Selecciona un RA y una competencia del catálogo.');
 if(ra.competency===competencyId)return;
 ra.competency=competencyId;markCompetencyLinksForReview(workspace,[raId]);
}
function competencyOptions(selected){return data.competencies.map(c=>opt(c.id,c.id+' · '+c.text.slice(0,100)+(c.text.length>100?'…':''),selected)).join('');}
function editProgramCompetency(id){
 const ra=data.program.find(r=>r.id===id);
 edit('Vínculo '+ra.id+' → competencia','<p>'+esc(ra.text)+'</p>'+field('Competencia vinculada','<select name="competency">'+competencyOptions(ra.competency)+'</select>')+'<p class="form-note">Cada RA tiene una competencia asociada en este modelo. Una competencia puede reunir varios RA. Cambiar el vínculo conserva los RA de las AC y sus justificaciones; sus aportes quedan por revisar.</p>',(form,draft)=>setProgramCompetency(draft,id,form.get('competency')));
}
function editCompetencyLinks(id){
 const competency=data.competencies.find(c=>c.id===id),linked=data.program.filter(r=>r.competency===id),others=data.program.filter(r=>r.competency!==id);
 edit('Vínculos de '+id,'<p>'+esc(competency.text)+'</p><fieldset><legend>RA actualmente vinculados</legend>'+(linked.length?linked.map(r=>field(r.id+' · '+r.text,'<select name="assign-'+esc(r.id)+'">'+competencyOptions(id)+'</select>')).join(''):'<p>Esta competencia todavía no tiene RA vinculados.</p>')+'</fieldset>'+field('Vincular otro RA a '+id,'<select name="addRA">'+opt('','No añadir','')+others.map(r=>opt(r.id,r.id+' · actualmente '+r.competency,'')).join('')+'</select>')+'<p class="form-note">Para trasladar un RA, elige su nueva competencia. Añadir otro RA lo reasigna a '+esc(id)+'. Los aportes afectados quedarán por revisar.</p>',(form,draft)=>{
  for(const ra of linked)setProgramCompetency(draft,ra.id,form.get('assign-'+ra.id));
  if(form.get('addRA'))setProgramCompetency(draft,form.get('addRA'),id);
 });
}
document.addEventListener('click',event=>{
 const competency=event.target.closest('[data-graph-competency]');if(competency){editCompetencyLinks(competency.dataset.graphCompetency);return;}
 const ra=event.target.closest('[data-graph-ra]');if(ra)editProgramCompetency(ra.dataset.graphRa);
});
