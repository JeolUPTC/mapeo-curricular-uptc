const courseDocumentFields=[
 ['faculty','Facultad'],['programName','Programa académico'],['version','Versión del formato'],['createdAt','Fecha de elaboración'],['updatedAt','Fecha de actualización'],['teachers','Profesores'],['efsh','EFSH'],['complementarity','Complementariedad'],['complementarityPlaces','Cupos de complementariedad'],['transversal','Transversalidad'],['transversalGroups','Grupos de transversalidad'],
 ['code','Código'],['maxStudents','Número máximo de estudiantes'],['modality','Modalidad'],['campus','Lugar o sede'],
 ['category','Categoría de la actividad'],['trainingSpace','Espacio de formación'],['component','Componente de formación'],['origin','Programa o núcleo de origen'],
 ['teacherProfile','Perfil del profesor'],['presentation','Presentación'],['prerequisites','Requisitos de acceso'],['priorKnowledge','Conocimientos previos'],
 ['objectives','Objetivos de formación'],['methodology','Metodologías de enseñanza y aprendizaje'],['research','Investigación, innovación o emprendimiento'],
 ['internationalization','Internacionalización'],['evaluation','Evaluación de los aprendizajes'],['resources','Medios educativos e infraestructura'],
 ['bibliography','Recursos bibliográficos'],['author','Elaboró']
];
function optionalNumber(name,value,label){
 return field(label,'<input name="'+name+'" type="number" min="0" step="0.5" value="'+esc(value??'')+'" placeholder="Sin diligenciar">');
}
function courseDocumentForm(course){
 const group=curriculumGroup(data,course?.curriculumGroup);
 const details={faculty:'INGENIERÍA',programName:'SISTEMAS Y COMPUTACIÓN',trainingSpace:group?.space||'',component:group?.component||'',origin:group?.name||'',...(course?.details||{})},hours=course?.hours||{};
 for(const [key,fallback] of [['trainingSpace',group?.space],['component',group?.component],['origin',group?.name]])if(!details[key])details[key]=fallback||'';
 return '<details class="form-section"><summary>Naturaleza y distribución de horas</summary>'+field('Naturaleza','<select name="nature">'+opt('','Sin diligenciar',course?.nature)+['Teórica','Teórico-práctica','Práctica'].map(value=>opt(value,value,course?.nature)).join('')+'</select>')+
  '<div class="hours-grid">'+[['theory','Presenciales teóricas'],['practice','Presenciales prácticas'],['presential','Presenciales totales'],['autonomous','Autónomas'],['total','Total horas']].map(([key,label])=>optionalNumber('hours_'+key,hours[key],label)).join('')+'</div></details>'+
  '<details class="form-section"><summary>Campos del formato de contenidos Word</summary><p class="meta">Los campos vacíos se exportan como pendientes de diligenciar.</p>'+courseDocumentFields.map(([key,label])=>documentListKeys.includes(key)?listField(key,label,details.lists?.[key]||details[key]):['presentation','teacherProfile'].includes(key)?field(label,'<textarea name="detail_'+key+'">'+esc(details[key])+'</textarea>'):field(label,'<input name="detail_'+key+'" type="'+(['maxStudents','complementarityPlaces','transversalGroups'].includes(key)?'number':['createdAt','updatedAt'].includes(key)?'date':'text')+'" '+(['maxStudents','complementarityPlaces','transversalGroups'].includes(key)?'min="0" step="1"':'')+' value="'+esc(details[key])+'">')).join('')+'</details>';
}
function readCourseDocumentForm(form,previous){
 const number=name=>{
  const value=form.get(name);
  if(value===null||value.trim()==='')return null;
  const parsed=Number(value);
  if(!Number.isFinite(parsed)||parsed<0)throw Error('Las horas deben ser números no negativos.');
  return parsed;
 };
 const details={...(previous?.details||{})};
 details.lists={...(details.lists||{})};
 for(const [key] of courseDocumentFields){
  if(documentListKeys.includes(key)){
   const list=[...$('form').querySelectorAll('[data-list-key="'+key+'"] textarea')].map(input=>input.value.trim()).filter(Boolean);
   details.lists[key]=list;details[key]=list.map((text,index)=>(index+1)+'. '+text).join('\n');
  }else details[key]=String(form.get('detail_'+key)||'').trim();
 }
 const oldGroup=curriculumGroup(data,previous?.curriculumGroup),newGroup=curriculumGroup(data,form.get('curriculumGroup'));
 for(const [key,groupKey] of [['trainingSpace','space'],['component','component'],['origin','name']]){
  if(!details[key]||(previous?.curriculumGroup!==form.get('curriculumGroup')&&details[key]===oldGroup?.[groupKey]))details[key]=newGroup?.[groupKey]||'';
 }
 const hours={};
 for(const key of ['theory','practice','presential','autonomous','total'])hours[key]=number('hours_'+key);
 if(typeof hours.theory==='number'&&typeof hours.practice==='number')hours.presential=hours.theory+hours.practice;
 if(typeof hours.presential==='number'&&typeof hours.autonomous==='number')hours.total=hours.presential+hours.autonomous;
 return {nature:form.get('nature')||'',hours,details};
}
function outcomeDocumentForm(outcome){
 const hours=outcome?.hours||{};
 return '<details class="form-section"><summary>Detalle opcional del anexo Word</summary>'+field('Tipo de competencia de la AC','<select name="competencyType">'+opt('','Sin diligenciar',outcome?.competencyType)+[...new Set(['Saber','Hacer','Ser',outcome?.competencyType].filter(Boolean))].map(value=>opt(value,value,outcome?.competencyType)).join('')+'</select>')+
  field('Competencia de la actividad','<textarea name="competencyText">'+esc(outcome?.competencyText)+'</textarea>')+
  '<p class="meta">Distribución de horas de este resultado. Se diligencia de forma independiente de las horas de la AC.</p><div class="hours-grid">'+[['theory','Teóricas'],['practice','Prácticas'],['autonomous','Independientes']].map(([key,label])=>optionalNumber('outcomeHours_'+key,hours[key],label)).join('')+'</div></details>';
}
function readOutcomeDocumentForm(form){
 const hours={};
 for(const key of ['theory','practice','autonomous']){
  const value=form.get('outcomeHours_'+key);
  hours[key]=value===null||value.trim()===''?null:Number(value);
  if(hours[key]!==null&&(!Number.isFinite(hours[key])||hours[key]<0))throw Error('Revisa la distribución de horas del resultado.');
 }
 return {competencyType:String(form.get('competencyType')||'').trim(),competencyText:String(form.get('competencyText')||'').trim(),hours};
}



function synchronizeCourseHours(){
 const form=$('form'),p=form.elements.namedItem('hours_presential'),total=form.elements.namedItem('hours_total');
 if(!p||!total)return;
 const number=name=>{
  const input=form.elements.namedItem(name);
  return input&&input.value!==''&&Number.isFinite(Number(input.value))?Number(input.value):null;
 };
 const theory=number('hours_theory'),practice=number('hours_practice'),autonomous=number('hours_autonomous');
 p.readOnly=theory!==null&&practice!==null;
 if(p.readOnly)p.value=theory+practice;
 const presential=number('hours_presential');
 total.readOnly=presential!==null&&autonomous!==null;
 if(total.readOnly)total.value=presential+autonomous;
 p.title=p.readOnly?'Calculado como teóricas + prácticas':'Total de horas presenciales';
 total.title=total.readOnly?'Calculado como presenciales + autónomas':'Total de horas';
}
$('form').addEventListener('input',event=>{
 if(event.target.name.startsWith('hours_'))synchronizeCourseHours();
});
