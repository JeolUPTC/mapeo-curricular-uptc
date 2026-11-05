function field(label,html){return '<label class="field">'+label+html+'</label>';}
function input(name,value,type='text'){return '<input name="'+name+'" type="'+type+'" value="'+esc(value)+'" required '+(type==='number'?'min="1"':'')+'>';}
function edit(title,fields,callback){
 $('title').textContent=title;$('fields').innerHTML=fields;$('error').textContent='';save=callback;$('editor').showModal();
}
function formFor(action,id,ra,outcome){
 if(configureRecord(action,id)||curriculumAction(action,id))return;
 const c=data.courses.find(x=>x.id===id);
 if(action==='focus'){focus=id;graphCourse='';tab='graph';render();return;}
 if(action==='examples'){
  try{
   const next=structuredClone(data);
   if(!next.areas.some(a=>a.id==='sw'))next.areas.push(seed.areas.find(a=>a.id==='sw'));
   for(const c of seed.courses.filter(c=>c.area==='sw'&&!next.courses.some(x=>x.id===c.id||x.name.localeCompare(c.name,'es',{sensitivity:'base'})===0))){
    next.courses.push(c);
    next.links.push(...seed.links.filter(l=>l.course===c.id&&next.program.some(r=>r.id===l.ra)));
   }
   commit(next);area='sw';render();
  }catch(error){$('status').textContent=error.message;}
  return;
 }
 if(action==='area'){
  const a=data.areas.find(x=>x.id===id);
  edit(a?'Editar área':'Nueva área',field('Nombre',input('name',a?.name)),(f,d)=>{
   const name=f.get('name').trim();
   if(d.areas.some(x=>x.id!==id&&x.name.toLocaleLowerCase('es')===name.toLocaleLowerCase('es')))throw Error('Ya existe un área con ese nombre.');
   if(a)d.areas.find(x=>x.id===id).name=name;else d.areas.push({id:uid(),name});
  });
 }
 if(action==='course'){openCourseEditor(c);return;}
 if(action==='outcome'){
  const o=c.outcomes.find(x=>x.id===outcome);
  const mapped=data.links.filter(l=>l.course===id&&l.outcomes.includes(outcome)).map(l=>l.ra);
  const targets='<fieldset><legend>¿A cuáles RA del programa aporta este resultado?</legend><p>Selecciona uno o varios. El nivel I/R/A se revisa para el conjunto de aportes de esta actividad a cada RA del programa.</p>'+data.program.map(r=>'<label><input type="checkbox" name="targets" value="'+esc(r.id)+'" '+(mapped.includes(r.id)?'checked':'')+'> <strong>'+esc(r.id)+'</strong> · '+esc(r.text)+'</label>').join('')+'</fieldset>';
  edit(o?'Editar RA de la AC':'Nuevo RA de la AC',field('Resultado de aprendizaje','<textarea name="text" required>'+esc(o?.text)+'</textarea>')+field('Nivel de Bloom','<select name="level">'+bloom.map(([l,description])=>opt(l,l+' · '+description,o?.level)).join('')+'</select>')+targets+outcomeDocumentForm(o),(f,d)=>{
   const selected=f.getAll('targets');
   if(!selected.length)throw Error('Selecciona al menos un RA del programa al que aporta este resultado.');
   const list=d.courses.find(x=>x.id===id).outcomes;
   const values={text:f.get('text').trim(),level:f.get('level'),...readOutcomeDocumentForm(f)};
   const outcomeId=o?outcome:uid();
   const changed=o&&(o.text!==values.text||o.level!==values.level);
   if(o)Object.assign(list.find(x=>x.id===outcome),values);else list.push({id:outcomeId,...values});
   for(const r of d.program){
    let contribution=d.links.find(l=>l.course===id&&l.ra===r.id);
    const included=contribution?.outcomes.includes(outcomeId)??false;
    const wanted=selected.includes(r.id);
    if(!included&&!wanted)continue;
    if(!contribution){
     contribution={course:id,ra:r.id,level:'P',outcomes:[],why:''};
     d.links.push(contribution);
    }
    if(wanted&&!included)contribution.outcomes.push(outcomeId);
    if(!wanted&&included)contribution.outcomes=contribution.outcomes.filter(x=>x!==outcomeId);
    if(included!==wanted||changed)contribution.level='P';
    if(!contribution.outcomes.length){
     contribution.level='N';
     contribution.why='';
    }
   }
  });
 }
 if(action==='cross'){
  const r=data.program.find(x=>x.id===ra), l=link(id,ra);
  const selected=['I','R','A'].includes(l?.level)?l.level:'';
  const draft=l?.level==='P'?'<p class="form-note">Los resultados vinculados cambiaron. Revisa el nivel y la justificación para completar este aporte.</p>':'';
  const options='<div class="level-selector">'+['I','R','A'].map(level=>'<label><input type="radio" name="level" value="'+level+'" '+(selected===level?'checked':'')+'><span><strong>'+level+'</strong>'+levels[level]+'</span></label>').join('')+'</div>';
  edit(c.name+' × '+ra,'<p class="program-statement">'+esc(r.text)+'</p><section class="review-state-note"><strong>Estado de trabajo: '+esc(contributionState(l).status)+'</strong><p>Decisión: '+esc(contributionState(l).decision)+'. El nivel I/R/A se registra por separado a continuación.</p></section>'+draft+'<fieldset class="level-fieldset"><legend>Nivel de contribución</legend>'+options+'</fieldset>'+
   '<fieldset><legend>Resultados de la actividad que aportan a '+esc(ra)+'</legend>'+(c.outcomes.map((o,index)=>'<label class="check-row"><input type="checkbox" name="outcomes" value="'+esc(o.id)+'" '+(l?.outcomes.includes(o.id)?'checked':'')+'> <span><strong>RA de la AC '+(index+1)+'</strong><small>'+esc(o.text)+'</small></span></label>').join('')||'<p>Crea primero los RA de esta actividad en la sección Actividades.</p>')+'</fieldset>'+field('Justificación y evaluación prevista','<textarea name="why" placeholder="Explica qué demuestra el estudiante y cómo se evalúa.">'+esc(l?.why)+'</textarea>')+
   '<div class="draft-action"><button type="submit" name="crossState" value="P">Guardar borrador</button><span class="meta">Para continuar la revisión después.</span></div><details class="help-details"><summary>Revisar como actividad sin aporte</summary><p>Esta acción desvincula todos los RA de esta actividad de '+esc(ra)+'.</p><button type="submit" name="crossState" value="N">Registrar sin aporte</button></details>',(form,draft)=>{
   const state=form.get('crossState');
   const level=state==='P'||state==='N'?state:form.get('level');
   if(!level)throw Error('Selecciona I, R o A, o guarda el aporte como borrador.');
   const outcomes=level==='N'?[]:form.getAll('outcomes');
   if(level!=='N'&&!outcomes.length)throw Error('Selecciona al menos un resultado de la actividad.');
   const why=form.get('why').trim();
   if(['I','R','A'].includes(level)&&!why)throw Error('Completa la justificación y la evaluación prevista.');
   draft.links=draft.links.filter(x=>x.course!==id||x.ra!==ra);
   draft.links.push({course:id,ra,level,outcomes,why:level==='N'?'':why});
  });
 }
}
$('form').onsubmit=e=>{e.preventDefault();try{const next=structuredClone(data);save(new FormData(e.target,e.submitter),next);commit(next);$('editor').close();render();}catch(error){$('error').textContent=error.message;}};
$('cancel').onclick=()=>$('editor').close();





