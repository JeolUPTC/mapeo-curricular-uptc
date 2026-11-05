function downloadFile(name,content,type){
 const url=URL.createObjectURL(new Blob([content],{type}));
 const anchor=document.createElement('a');
 anchor.href=url;anchor.download=name;anchor.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function downloadJson(name,workspace){
 downloadFile(name,JSON.stringify(encodeWorkspace(workspace),null,2),'application/json');
}
function exchange(){
 return '<article class="card"><h2>Trabajo por áreas</h2><p>Exporta un área para que el equipo complete sus actividades y cruces. Reúne después los archivos devueltos y revisa las diferencias antes de aplicar los cambios.</p><div class="bar"><label>Área <select id="packageArea">'+data.areas.map(a=>opt(a.id,a.name,area)).join('')+'</select></label><button id="areaExport" class="primary" '+(data.areas.length?'':'disabled')+'>Exportar área</button><button id="areaMerge">Reunir JSON de áreas</button></div></article><article class="card"><h2>Documentos y respaldo</h2><p>Descarga la malla y el mapeo con su trazabilidad, el formato oficial de una AC o el soporte documental por separado.</p><div class="bar"><button id="excelExport">Matriz Excel</button><label>Actividad <select id="wordCourse">'+data.courses.map(c=>opt(c.id,c.name+' · Semestre '+c.semester+(c.inStudyPlan===false?' · Fuera del plan':''))).join('')+'</select></label><button id="supportExport">Soporte del mapeo Word</button><button id="wordExport" '+(data.courses.length?'':'disabled')+'>Formato oficial Word</button></div><div class="bar"><button id="download">Respaldar matriz general</button><button id="upload">Abrir espacio JSON</button></div></article>';
}
function describeChange(record){
 if('text' in record&&'objectives' in record)return record.id+' · '+record.text+'\n'+(record.status==='agreed'?'Acuerdo registrado':'Pendiente de validar');
 if('status' in record)return criterionStatus(record)+'\n'+[record.responsible,record.date,record.reference].filter(Boolean).join(' · ');
 if(record.deleted)return 'AC retirada. '+describeChange({...record,deleted:false});
 if('why' in record)return (levels[record.level]||record.level)+'\n'+(record.why||'Sin justificación')+'\nRA vinculados: '+(record.outcomes.join(', ')||'ninguno');
 if('semester' in record){
  return record.name+' · Semestre '+record.semester+' · '+(record.credits??'Sin dato')+' créditos · '+(record.inStudyPlan===false?'Fuera del plan':'Dentro del plan')+
   '\nÁrea: '+record.area+' · Agrupación: '+(record.curriculumGroup||'Por ubicar')+
   '\n'+record.outcomes.map(o=>o.id+' · '+o.level+' · '+o.text).join('\n')+'\nContenidos: '+(record.contents||'Pendiente');
 }
 return record.name;
}
document.addEventListener('click',event=>{
 const id=event.target.id;
 if(id==='download')downloadJson('mapa-curricular.json',data);
 if(id==='upload')$('file').click();
 if(id==='areaMerge')$('areaFiles').click();
 if(id==='areaExport'){
  const pkg=areaPackage(data,$('packageArea').value);
  downloadJson('area-'+pkg.areas[0].name.replace(/[^\p{L}\p{N}-]+/gu,'-')+'.json',pkg);
 }
 if(id==='excelExport')runOfficeExport(event.target,()=>exportExcel(data));
 if(id==='supportExport')runOfficeExport(event.target,()=>exportWord(data,data.courses.find(c=>c.id===$('wordCourse').value),'support'));
 if(id==='wordExport')exportWord(data,data.courses.find(c=>c.id===$('wordCourse').value));
});
$('file').onchange=async event=>{
 const [file]=event.target.files;event.target.value='';
 if(!file)return;
 try{
  const next=importCompetencies(parseWorkspace(await file.text()));
  if(!confirm('¿Abrir este archivo como espacio de trabajo? Sustituirá el espacio guardado en este navegador.'))return;
  commit(next,{track:false});area='';graphCourse='';mallaGroup='';matrixSearch='';matrixSemester='';selectedSemesters=[];planScope=next.courses.length&&next.courses.every(c=>c.inStudyPlan===false)?'outside':'plan';tab='malla';render();
 }catch(error){$('status').textContent='Importación fallida. '+error.message;}
};
$('areaFiles').onchange=async event=>{
 const files=Array.from(event.target.files);event.target.value='';
 if(!files.length)return;
 try{
  const packages=await Promise.all(files.map(async file=>({name:file.name,pkg:parseWorkspace(await file.text())})));
  const ids=packages.map(({pkg})=>pkg.areas[0]?.id);
  if(new Set(ids).size!==ids.length)throw Error('Selecciona una sola versión de cada área por revisión.');
  const plan=planMerge(data,packages);
  edit('Revisar integración','<p>'+plan.added+' registros nuevos · '+plan.conflicts.length+' conflictos</p><p>Por defecto se conserva lo que ya está en la matriz. Marca solo los cambios que quieras aceptar.</p>'+plan.conflicts.map((c,i)=>'<fieldset class="merge-conflict"><legend>'+esc(c.label)+'</legend><div class="merge-compare"><div><strong>Matriz actual</strong><p>'+esc(describeChange(c.previous))+'</p></div><div><strong>'+esc(c.file)+'</strong><p>'+esc(describeChange(c.incoming))+'</p></div></div><label><input type="checkbox" name="accept" value="'+i+'"> Usar la versión del archivo</label></fieldset>').join(''),(form,draft)=>{
   const resolved=planMerge(data,packages);
   for(const index of form.getAll('accept'))resolved.conflicts[Number(index)].apply();
   if(!valid(resolved.next))throw Error('La selección deja cruces con RA de la AC que ya no existen. Revisa juntos los cambios de la actividad y sus cruces.');
   Object.assign(draft,resolved.next);
   delete draft.kind;
   tab='malla';area='';graphCourse='';mallaGroup='';planScope='plan';
  });
 }catch(error){$('status').textContent='Integración pendiente. '+error.message;}
};




