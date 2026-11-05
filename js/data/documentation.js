const mappingCriteria=[
 {id:'meaning',title:'Significado I/R/A',text:'I: introducción guiada; R: práctica y profundización con menor apoyo; A: desempeño integrado con autonomía y exigencia próxima al egreso en el alcance evaluado. A = Avanzado es la adaptación de trabajo del demo, no una nomenclatura universal.',source:'Hawaiʻi [1] y UConn [2]; adaptación local de la letra A.'},
 {id:'aggregation',title:'Varios RA de AC en un cruce',text:'Valorar conjuntamente alcance, tareas, autonomía y criterios. No promediar letras ni asignar A por un único RA aislado. Registrar un nivel representativo y justificar sus límites; conservar borrador si no hay soporte suficiente.',source:'Propuesta operativa del demo para acuerdo colegiado.'},
 {id:'progression',title:'Progresión del programa',text:'Revisar oportunidades de introducción, práctica y desempeño de egreso en las trayectorias estudiantiles. No exigir los tres niveles dentro de cada AC ni una secuencia estricta entre todas las asignaturas.',source:'Hawaiʻi [1] y UConn [2]; aplicación local pendiente de acuerdo.'},
 {id:'bloom',title:'Bloom e I/R/A',text:'Bloom caracteriza el proceso cognitivo del RA. I/R/A describe la contribución curricular bajo condiciones concretas de ayuda, autonomía y evaluación; no hay equivalencia automática entre ambos.',source:'Carnegie Mellon [3] para Bloom; distinción operativa del modelo.'}
];
function criterionRecord(workspace,id){return workspace.documentation?.criteria?.[id]||{status:'pending',responsible:'',date:'',reference:''};}
function criterionStatus(record){return record.status==='agreed'?'Acuerdo registrado por el equipo':'Pendiente de validación colegiada';}
function documentationRows(workspace){
 const result=[['Sección','Concepto / criterio','Definición / contenido','Estado / alcance','Responsable y referencia']];
 result.push(['Control documental','Guía de mapeo v1 · 05/11/2026','Soporte del diseño curricular. Los ejemplos son ilustrativos. Un acuerdo registrado no acredita por sí mismo aprobación institucional.','Convenciones del demo; ver estado individual','']);
 for(const criterion of mappingCriteria){
  const record=criterionRecord(workspace,criterion.id);
  result.push(['Criterios I/R/A',criterion.title,criterion.text+' Fuente: '+criterion.source,criterionStatus(record),[record.responsible,record.date,record.reference].filter(Boolean).join(' · ')||'Sin acuerdo documentado']);
 }
 result.push(['Competencias y fuentes','Insumos de la reforma',competencySource.note,'Material de trabajo','PAE suministrado; Excel: Mapeo obj comp RA']);
 for(const c of workspace.competencies||[])result.push(['Competencias',c.id,c.text,c.status==='agreed'?'Acuerdo registrado':'Pendiente de validar',[c.source,c.responsible,c.date,c.reference].filter(Boolean).join(' · ')]);
 const categories={structure:'Estructura',mapping:'Mapeo',levels:'I/R/A y ejemplos',workflow:'Trabajo y evidencia',views:'Vistas y Bloom'};
 for(const [category,concept,definition,example] of learningTerms)result.push([categories[category],concept,definition+'\nEjemplo: '+example,'Definición operativa del modelo','Consultar criterios y acuerdos del equipo']);
 result.push(['Estados y niveles','Separación documental','Nivel: solo I, R o A; vacío si no hay nivel confirmado. Revisión: documentado, soporte pendiente, borrador o sin revisar. Decisión: aporta, sin aporte o por definir.','Convención de representación','La ausencia de un vínculo equivale a sin revisar; no a sin aporte.']);
 const sources=[['University of Hawaiʻi at Mānoa · Curriculum Mapping','https://manoa.hawaii.edu/assessment/resources/how-to/curriculum-mapping-curriculum-matrix/','Introducción, refuerzo y dominio. Usa M para dominio; su A se refiere a recogida de evidencia.'],['University of Connecticut · Curriculum Mapping','https://cetl.uconn.edu/curriculum-mapping/','Progresión en el mapeo curricular.'],['Carnegie Mellon · Bloom’s Taxonomy','https://www.cmu.edu/teaching/designteach/design/bloomsTaxonomy.html','Procesos cognitivos para formular resultados.']];
 for(const [i,source] of sources.entries())result.push(['Fuentes','['+(i+1)+'] '+source[0],source[1]+'\n'+source[2],'Fuente externa; no acredita adopción institucional','A = Avanzado es adaptación local.']);
 return result;
}
document.addEventListener('click',event=>{
 const target=event.target.closest('[data-criterion]');if(!target)return;
 const criterion=mappingCriteria.find(c=>c.id===target.dataset.criterion),record=criterionRecord(data,criterion.id);
 edit('Estado del criterio: '+criterion.title,'<p>'+esc(criterion.text)+'</p>'+field('Estado','<select name="criterionStatus">'+opt('pending','Pendiente de validación colegiada',record.status)+opt('agreed','Acuerdo registrado por el equipo',record.status)+'</select>')+field('Responsable / equipo','<input name="responsible" value="'+esc(record.responsible)+'">')+field('Fecha del acuerdo','<input type="date" name="date" value="'+esc(record.date)+'">')+field('Acta o referencia del acuerdo','<textarea name="reference">'+esc(record.reference)+'</textarea>'),(form,draft)=>{
  const entry={status:form.get('criterionStatus'),responsible:form.get('responsible').trim(),date:form.get('date'),reference:form.get('reference').trim()};
  if(entry.status==='agreed'&&(!entry.responsible||!entry.date||!entry.reference))throw Error('Para registrar un acuerdo, indica responsable, fecha y acta o referencia.');
  draft.documentation??={criteria:{}};draft.documentation.criteria??={};draft.documentation.criteria[criterion.id]=entry;
 });
});
