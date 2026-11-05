function sourceCourseName(name){
 return name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLocaleLowerCase('es').replace(/\s+/g,' ');
}
function importCurricularSource(workspace){
 if(workspace.kind==='area'||workspace.sourceImport===curricularSource.id)return workspace;
 const draft=structuredClone(workspace);
 const aliases=new Map();
 if(!draft.areas.some(a=>a.id==='unassigned'))draft.areas.push({id:'unassigned',name:'Por asignar'});
 for(const source of curricularSource.courses){
  if(workspace.deletedCourses?.some(record=>record.course.id===source.id||sourceCourseName(record.course.name)===sourceCourseName(source.name)))continue;
  let course=draft.courses.find(c=>c.id===source.id||sourceCourseName(c.name)===sourceCourseName(source.name));
  if(!course){
   course={...structuredClone(source),area:'unassigned'};
   draft.courses.push(course);
  }
  aliases.set(source.id,course.id);
  course.sourceRow=source.sourceRow;
  course.sourceNumber=source.sourceNumber;
  course.sourceName=source.name;
  course.nature??=source.nature;
  course.hours??=structuredClone(source.hours);
 }
 for(const marker of curricularSource.markers){
  const course=aliases.get(marker.course);
  if(!course)continue;
  const existing=draft.links.find(l=>l.course===course&&l.ra===marker.ra);
  if(existing){
   existing.source=structuredClone(marker.source);
  }else{
   draft.links.push({...structuredClone(marker),course,outcomes:[],why:''});
  }
 }
 draft.sourceImport=curricularSource.id;
 return draft;
}
function curricularDifferences(workspace){
 const result=[];
 for(const source of curricularSource.courses){
  if(workspace.deletedCourses?.some(record=>record.course.id===source.id||sourceCourseName(record.course.name)===sourceCourseName(source.name)))continue;
  const course=workspace.courses.find(c=>c.sourceRow===source.sourceRow||c.id===source.id);
  if(!course)continue;
  for(const field of ['semester','credits','nature']){
   if(course[field]!==source[field])result.push({kind:'course',id:course.id,field,label:course.name+' · '+({semester:'Semestre',credits:'Créditos',nature:'Naturaleza'})[field],current:course[field],incoming:source[field]});
  }
  for(const marker of curricularSource.markers.filter(l=>l.course===source.id)){
   const existing=workspace.links.find(l=>l.course===course.id&&l.ra===marker.ra);
   if(existing?.level!==marker.level)result.push({kind:'link',id:course.id,ra:marker.ra,label:course.name+' × '+marker.ra,current:existing?.level||'Sin registrar',incoming:marker.level,marker});
  }
 }
 for(const source of curricularSource.programLevels){
  const ra=workspace.program.find(r=>r.id===source.id);
  if(ra&&ra.level!==source.level)result.push({kind:'bloom',id:ra.id,label:ra.id+' · Bloom',current:ra.level,incoming:source.level});
 }
 return result;
}
function sourceReview(){
 const differences=curricularDifferences(data);
 return '<div class="source-summary"><strong>'+curricularSource.courses.length+' actividades · '+curricularSource.markers.length+' marcas I/R/A</strong><p>Importadas desde la hoja Mapeo Curricular. Las áreas y los RA de las actividades no están definidos en esa hoja. La estructura de Ajuste07092026 aporta sus núcleos a la malla y las marcas importadas conservan el soporte pendiente de diligenciar.</p></div>'+
  '<h3>Contraste con el espacio de trabajo</h3>'+(differences.length?'<p class="meta">Se conserva la versión actual en cada diferencia. Revisa antes de adoptar el valor del Excel.</p><div class="scroll"><table class="comparison-table"><thead><tr><th>Dato</th><th>Actual</th><th>Excel</th><th></th></tr></thead><tbody>'+differences.map((difference,index)=>'<tr><th>'+esc(difference.label)+'</th><td>'+esc(difference.current)+'</td><td>'+esc(difference.incoming)+'</td><td>'+button('source-change',String(index),'Revisar')+'</td></tr>').join('')+'</tbody></table></div>':'<p class="muted">Los datos comparables coinciden con el archivo de origen.</p>')+
  '<h3>Información del archivo</h3><ul class="source-findings"><li>La hoja incluye naturaleza, créditos y horas. Los valores calculados se importan tal como estaban guardados en Excel.</li><li>Los espacios vacíos se conservan. No se completan RA de las AC ni justificaciones a partir de las marcas.</li><li>Cálculo Diferencial registra 3 créditos, 4 horas presenciales, 2 autónomas y 6 totales. Conviene revisar esta distribución.</li><li>Las notas del archivo proponen I → R → A y evitar R después de A. Se presentan como criterios para discutir con el claustro.</li></ul>'+
  '<details class="help-details"><summary>Ver los criterios registrados en el Excel</summary><ul>'+curricularSource.guidance.filter(Boolean).map(text=>'<li>'+esc(text)+'</li>').join('')+'</ul></details>';
}
function reviewSourceChange(id){
 const difference=curricularDifferences(data)[Number(id)];
 if(!difference)return;
 edit('Revisar dato del Excel','<p>'+esc(difference.label)+'</p><div class="merge-compare"><div><strong>Versión actual</strong><p>'+esc(difference.current)+'</p></div><div><strong>Excel de origen</strong><p>'+esc(difference.incoming)+'</p></div></div><p>Guardar aplicará el valor del Excel a este dato.</p>',(form,draft)=>{
  if(difference.kind==='course')draft.courses.find(c=>c.id===difference.id)[difference.field]=difference.incoming;
  if(difference.kind==='bloom'){
   draft.program.find(r=>r.id===difference.id).level=difference.incoming;
   draft.links.filter(l=>l.ra===difference.id&&l.level!=='N').forEach(l=>{l.level='P';});
  }
  if(difference.kind==='link'){
   let existing=draft.links.find(l=>l.course===difference.id&&l.ra===difference.ra);
   if(!existing){
    existing={...structuredClone(difference.marker),course:difference.id,outcomes:[],why:''};
    draft.links.push(existing);
   }
   existing.level=difference.incoming;
   existing.source=structuredClone(difference.marker.source);
   existing.why='';
  }
 });
}


