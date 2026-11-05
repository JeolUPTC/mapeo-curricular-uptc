function importCompetencies(workspace){
 if(workspace.competencies)return workspace;
 const next=structuredClone(workspace);
 next.competencies=structuredClone(competencySource.competencies);
 for(const ra of next.program)if(!next.competencies.some(c=>c.id===ra.competency))next.competencies.push({id:ra.competency,text:ra.competency,source:'Identificador previo del demo; enunciado por completar',status:'pending',objectives:[],proposals:[]});
 return next;
}
function competencyText(workspace,id){return workspace.competencies?.find(c=>c.id===id)?.text||'Enunciado pendiente';}
function competencyDescription(workspace,id){return id+'. '+competencyText(workspace,id);}
