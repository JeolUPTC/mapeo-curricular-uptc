function configureRecord(action,id){
 if(action==='open-program'){tab='program';render();return true;}
 if(action==='source-change'){reviewSourceChange(id);return true;}
 if(action==='assignment'){
  const target=data.areas.find(a=>a.id===id);
  edit('Asignar actividades a '+target.name,'<p>Selecciona las AC que deseas trasladar a esta área. Las asignaciones actuales que no marques se conservan.</p><fieldset><legend>Actividades disponibles</legend>'+[...data.courses].sort((a,b)=>a.name.localeCompare(b.name,'es')).map(c=>'<label class="check-row"><input type="checkbox" name="courses" value="'+esc(c.id)+'" '+(c.area===id?'checked disabled':'')+'> <span>'+esc(c.name)+'<small>'+esc(areaName(c.area))+'</small></span></label>').join('')+'</fieldset>',(form,draft)=>{
   for(const courseId of form.getAll('courses'))draft.courses.find(c=>c.id===courseId).area=id;
  });
  return true;
 }
 if(action==='program-new'){
  const number=Math.max(0,...data.program.map(r=>Number(r.id.replace(/^RA/,''))||0))+1;
  edit('Nuevo RA del programa',field('Código','<input name="code" required value="RA'+number+'" pattern="RA[1-9][0-9]*">')+field('Resultado del programa','<textarea name="text" required></textarea>')+field('Competencia asociada','<select name="competency">'+data.competencies.map(c=>opt(c.id,c.id+' · '+c.text.slice(0,65),id)).join('')+'</select>')+field('Nivel de Bloom','<select name="level">'+bloom.map(([l,d])=>opt(l,l+' · '+d)).join('')+'</select>'),(form,draft)=>{
   const code=form.get('code').trim(),text=form.get('text').trim(),competency=form.get('competency');
   if(!/^RA[1-9][0-9]*$/.test(code)||draft.program.some(r=>r.id===code))throw Error('Usa un código RA único, por ejemplo RA8.');
   if(!text||!draft.competencies.some(c=>c.id===competency))throw Error('Completa el resultado y su competencia.');
   draft.program.push({id:code,text,competency,level:form.get('level')});
  });return true;
 }
 if(action==='competency-ras'){
  const c=data.competencies.find(c=>c.id===id);
  edit('Asignar RA a '+c.id,'<p>Marca los RA que deseas asociar a esta competencia. Puedes seleccionar varios. Los que no marques conservarán su asignación actual.</p><fieldset><legend>RA del programa</legend>'+data.program.map(r=>'<label class="check-row"><input type="checkbox" name="ras" value="'+esc(r.id)+'" '+(r.competency===id?'checked disabled':'')+'><span><strong>'+esc(r.id)+' · '+esc(r.competency)+'</strong><small>'+esc(r.text)+'</small></span></label>').join('')+'</fieldset><p>Los RA que cambien de competencia dejarán sus aportes pendientes de revisión.</p>',(form,draft)=>{
   for(const ra of form.getAll('ras')){const r=draft.program.find(r=>r.id===ra);if(r.competency!==id){r.competency=id;draft.links.filter(l=>l.ra===ra&&l.level!=='N').forEach(l=>l.level='P');}}
  });return true;
 }
 if(action==='program'){
  const r=data.program.find(x=>x.id===id);
  edit('Editar '+r.id,field('Resultado del programa','<textarea name="text" required>'+esc(r.text)+'</textarea>')+field('Competencia asociada','<select name="competency">'+data.competencies.map(c=>opt(c.id,c.id+' · '+c.text.slice(0,64)+'…',r.competency)).join('')+'</select><small class="competency-description">'+esc(data.competencies.find(c=>c.id===r.competency)?.text)+'</small>')+field('Nivel de Bloom','<select name="level">'+bloom.map(([level,description])=>opt(level,level+' · '+description,r.level)).join('')+'</select>')+'<p class="form-note">Si cambias el enunciado o el nivel de Bloom, sus aportes quedarán pendientes de revisión. Distribuye después el catálogo actualizado a las áreas.</p>',(form,draft)=>{
   const values={text:form.get('text').trim(),competency:form.get('competency').trim(),level:form.get('level')};
   if(!values.text||!values.competency)throw Error('Completa el enunciado y la competencia.');
   const changed=r.text!==values.text||r.level!==values.level||r.competency!==values.competency;
   Object.assign(draft.program.find(x=>x.id===id),values);
   if(changed)draft.links.filter(l=>l.ra===id&&l.level!=='N').forEach(l=>{l.level='P';});
  });
  return true;
 }
 return false;
}

